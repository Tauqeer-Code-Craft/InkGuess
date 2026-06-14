import { Injectable, Logger } from "@nestjs/common";
import { Server } from 'socket.io'
import { RedisService } from "./redis.service";
import { Player, RoomState, StrokeData } from "./types";
import { getRandomWords } from "./game-words";

@Injectable()
export class GameService{
    private readonly logger = new Logger(GameService.name);
    private server: Server | null = null;
    private activeTimers = new Map<string,NodeJS.Timeout>();
    private hintTimers = new Map<string,NodeJS.Timeout[]>();

    constructor (private readonly redisService: RedisService){}

    setServer(server: Server){
        this.server = server;
    }

    private getRoomKey(roomCode: string): string {
        return `room:${roomCode}`;
    }

    private getStrokesKey(roomCode: string): string { 
        return `strokes:${roomCode}`
    }

    // generate 4-letter room code
    generateRoomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4 ; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));            
        }
        return code;
    }

    async createRoom(isPublic = false): Promise<String>{
        let code = this.generateRoomCode();
        // 
        let exists = await this.roomExists(code);
        while (exists) {
            code = this.generateRoomCode();
            exists = await this.roomExists(code);
        }

        const roomState: RoomState = {
            code,
            players: [],
            isPlaying: false,
            round: 1,
            maxRounds: 3,
            turnIndex: 0,
            turnOwnerId: null,
            currentWord: null,
            hint: '',
            timer: 0,
            status: 'lobby',
            wordOptions: [],
        };
        await this.saveRoomState(code,roomState);
        await this.redisService.sadd('rooms',code);
        return code;
    }


    async roomExists(roomCode: string): Promise<boolean>{
        const state = await this.getRoomState(roomCode);
        return state !== null;
    }

    async getRoomState(roomCode: string): Promise <RoomState | null>{
        const raw = await this.redisService.get(this.getRoomKey(roomCode));
        if(!raw) return null;
        return JSON.parse(raw) as RoomState;
    }

    async saveRoomState(roomCode: string,state:RoomState): Promise<void>{
        await this.redisService.set(this.getRoomKey(roomCode),JSON.stringify(state));
    }

    async deleteRoom(roomCode: string): Promise<void>{
        this.clearRoomTimers(roomCode); // we will make this later
        await this.redisService.del(this.getRoomKey(roomCode));
        await this.redisService.del(this.getStrokesKey(roomCode)) 
        await this.redisService.srem('room',roomCode);
    }

    // Strokes management
    async getStrokes(roomCode: string): Promise<StrokeData[]>{
        const raw = await this.redisService.get(this.getStrokesKey(roomCode));
        if (!raw) return [];
        return JSON.parse(raw) as StrokeData[];
    }

    async addStroke(roomCode: string,stroke: StrokeData): Promise<void>{
        const strokes = await this.getStrokes(roomCode);
        strokes.push(stroke);
        await this.redisService.set(this.getStrokesKey(roomCode),JSON.stringify(strokes));
    }

    async clearStrokes(roomCode: string): Promise<void>{
        await this.redisService.del(this.getStrokesKey(roomCode));
    }

    // player operations
    async joinRoom(roomCode: string, playerId: string, playerName: string, sessionToken?: string): Promise<RoomState>{
        const room = await this.getRoomState(roomCode);
        if(!room){
            throw new Error('Room not found');
        }

        const tokenToUse = sessionToken || Math.random().toString(36).substring(2,15);
        const existingPlayer = room.players.find((p)=> p.sessionToken === tokenToUse);

        if(existingPlayer){
            existingPlayer.id = playerId;
            existingPlayer.isDisconnected = false;
        } else {
            const isHost = room.players.length === 0;
            const newPlayer: Player = {
                id: playerId,
                name: playerName,
                score: 0,
                isHost,
                hasGuessed: false,
                isDrawer: false,
                scoreAddedThisTurn: 0,
                sessionToken: tokenToUse,
            };
            room.players.push(newPlayer);
        }

        await this.saveRoomState(roomCode,room);
        return room;
    }

    async leaveRoom(roomCode: string,playerId: string): Promise<RoomState | null>{
        const room = await this.getRoomState(roomCode);
        if(!room) return null;

        const playerIndex = room.players.findIndex((p)=> p.id === playerId);
        if (playerIndex === -1) return room;

        const leavingPlayer = room.players[playerIndex];
        room.players.splice(playerIndex,1);

        if (room.players.length === 0) {
            await this.deleteRoom(roomCode);
            return null;
        }

        // Reassign host if host left
        if(leavingPlayer.isHost){
            room.players[0].isHost = true;
        }

        // if game is active and leaving player was the drawer
        if (room.isPlaying && room.turnOwnerId === playerId){
            this.clearRoomTimers(roomCode);
            await this.nextTurn(room);
        } else {
            await this.saveRoomState(roomCode,room);
            // check if everyone has guessed after the player left
            if (room.isPlaying && room.status=== 'drawing'){
                await this.checkedAllGuessed(roomCode);
            }
        }
        return room;

    }

    // Game flow control
    async startGame (roomCode: string): Promise<void>{
        const room = await this.getRoomState(roomCode);
        if(!room || room.isPlaying) return;

        room.isPlaying = true;
        room.round = 1;
        room.turnIndex = 0;
        room.status = 'selecting';
        await this.startTurn(room);
    } 

    async startTurn(room: RoomState): Promise<void>{
        const roomCode = room.code;
        this.clearRoomTimers(roomCode);
        await this.clearStrokes(roomCode);
        this.broadcastToRoom(roomCode,'clear-canvas',null);

        if(room.players.length === 0){
            await this.deleteRoom(roomCode);
            return;
        }

        // adjust turn index if out of bounds
        if(room.turnIndex >= room.players.length) {
            room.turnIndex = 0;
            room.round++;
        }

        // check if game is completed (3 rounds completed)
        if (room.round > room.maxRounds){
            await this.endGame(room);
            return;
        }

        // assign drawer
        room.status = 'selecting';
        room.players.forEach((p,idx)=>{
            p.isDrawer = idx === room.turnIndex;
            p.hasGuessed = false;
            p.scoreAddedThisTurn = 0;
        });

        const currentDrawer = room.players[room.turnIndex];
        room.turnOwnerId = currentDrawer.id;
        room.currentWord = null;
        room.hint = '';
        room.wordOptions = getRandomWords(3);
        room.timer = 15  // 15 seconds to select a word

        await this.saveRoomState(roomCode,room);
        this.broadcastToRoom(roomCode,'room-update',room);

        // Start selection countdown
        const timerId = setInterval(async () => {
            const currentRoom = await this.getRoomState(roomCode);
            if (!currentRoom || currentRoom.status !== 'selecting'){
                clearInterval(timerId);
                return;
            }

            currentRoom.timer--;
            if(currentRoom.timer <= 0){
                clearInterval(timerId);
                // Force pick first option
                const forceWord = currentRoom.wordOptions[0];
                await this.selectWord(roomCode,forceWord);
            } else {
                await this.saveRoomState(roomCode , currentRoom);
                this.broadcastToRoom(roomCode,'timer-update',{timer: currentRoom.timer , status: 'selecting'});
            }
        },1000);

        this.activeTimers.set(roomCode,timerId);

    }

    async selectWord(roomCode: string, word: string): Promise<void>{
        const room = await this.getRoomState(roomCode);
        if (!room || room.status !== 'selecting') return;

        this.clearRoomTimers(roomCode);
        
        room.status = 'drawing';
        room.currentWord = word.toLowerCase();
        room.hint = '_ '.repeat(word.length).trim();
        room.timer = 60; // 60 seconds to draw

        await this.saveRoomState(roomCode,room);
        this.broadcastToRoom(roomCode,'room-update',room);
        this.broadcastToRoom(roomCode,'chat-message',{
            sender: 'System',
            text: `The drawer is choosing a word... The word has ${word.length} letters!`,
            type: 'system',
        });

        // Setup progressive hint reveal
        this.setUpHintTimers(roomCode,word);

        // start drawing timer
        const timerId = setInterval(async ()=> {
            const currentRoom = await this.getRoomState(roomCode)
            if(!currentRoom || currentRoom.status !== 'drawing'){
                clearInterval(timerId);
                return;
            }

            currentRoom.timer--;
            if(currentRoom.timer <= 0){
                clearInterval(timerId);
                await this.endTurn(roomCode);
            } else {
                await this.saveRoomState(roomCode,currentRoom);
                this.broadcastToRoom(roomCode, 'timer-update', {timer: currentRoom.timer , status: 'drawing'});
            }
        },1000);

        this.activeTimers.set(roomCode,timerId);
    } 

    async endTurn(roomCode: string): Promise<void>{
        const room = await this.getRoomState(roomCode);
        if(!room) return;

        this.clearRoomTimers(roomCode);
        room.status = 'round-end';
        await this.saveRoomState(roomCode,room);

        this.broadcastToRoom(roomCode,'room-update',room);
        this.broadcastToRoom(roomCode,'chat-message',{
            sender : 'System',
            text: `Round ended! The word was: ${room.currentWord?.toUpperCase()}`,
            type: 'system',
        });

        // Show round-end scoreboard for 3 seconds, then move to next turn
        const timeoutId = setTimeout(async ()=>{
            const currentRoom = await this.getRoomState(roomCode);
            if(currentRoom){
                await this.nextTurn(currentRoom);
            }
        },3000);
        this.activeTimers.set(roomCode,timeoutId);
    }

    async nextTurn(room: RoomState):Promise<void>{
        room.turnIndex++;
        await this.startTurn(room);
    }

    async endGame(room:RoomState): Promise<void>{
        room.status = 'game-over';
        room.isPlaying = false;
        room.turnOwnerId = null;
        room.currentWord = null;
        room.hint = '';

        await this.saveRoomState(room.code,room);
        this.broadcastToRoom(room.code,'room-update',room);

        // sort players by final score
        const standings = [...room.players].sort((a,b)=> b.score - a.score);
        const winner = standings[0];

        this.broadcastToRoom(room.code,'chat-message',{
            sender: 'System',
            text: `Game over! Final standings: \n` + 
            `\nWinner is: ${winner ? winner.name : 'No one'}| 🏆`,
            type: 'system',
        });
    }

    // there is need for reset room , handle guess , setupHint timer etc , in the next video

    private clearRoomTimers(roomCode: string){
        // clear main loop timer
        const mainTimer = this.activeTimers.get(roomCode);
        if(mainTimer){
            clearInterval(mainTimer);
            clearTimeout(mainTimer);
            this.activeTimers.delete(roomCode);
        }

        // clear Hint timers
        const hints = this.hintTimers.get(roomCode);
        if (hints){
            hints.forEach((t)=> clearTimeout(t));
            this.hintTimers.delete(roomCode)
        }
    }

    private broadcastToRoom(roomCode: string , event: string , data: any){
        if( this.server){
            this.server.to(roomCode).emit(event,data);
        }
    }
}