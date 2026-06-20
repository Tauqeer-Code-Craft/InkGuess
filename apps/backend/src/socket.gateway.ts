import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from 'socket.io'
import { GameService } from "./game.service";
import { StrokeData } from "./types";

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})

export class SocketGateway implements OnGatewayInit , OnGatewayConnection , OnGatewayDisconnect {
    private readonly logger = new Logger(SocketGateway.name);

    @WebSocketServer()
    server !: Server;

    // Track which socket is in which room
    private socketToRoom = new Map<string,string>();
    // Track player names for sockets
    private socketToName = new Map<string,string>();
    // Track reconnection grace period timeouts by sessionToken
    private playerDisconnectTimeouts = new Map<string, NodeJS.Timeout>();

    constructor(private readonly gameService: GameService){}

    afterInit(server: Server) {
        this.logger.log('Websocket Gateway initialized.');
        this.gameService.setServer(server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Clinet disconnected: ${client.id}`);
        const roomCode = this.socketToRoom.get(client.id);
        const name = this.socketToName.get(client.id) || 'Someone';

        if (roomCode){
            const room = await this.gameService.getRoomState(roomCode);
            if(room){
                const player = room.players.find(p => p.id === client.id);
                if(player){
                    player.isDisconnected = true;
                    await this.gameService.saveRoomState(roomCode,room);

                    // Notify room of connection state change
                    this.server.to(roomCode).emit('room-update',room);

                    // start 8-second grace period for rejoining
                    const sessionToken = player.sessionToken;
                    const timeoutId = setTimeout(async ()=> {
                        this.playerDisconnectTimeouts.delete(sessionToken);
                        const updatedRoom = await this.gameService.leaveRoom(roomCode,client.id);
                        this.socketToRoom.delete(client.id);
                        this.socketToName.delete(client.id);

                        if(updatedRoom) {
                            this.server.to(roomCode).emit('room-update',updatedRoom);
                            this.server.to(roomCode).emit('chat-message',{
                                sender: 'System',
                                text: `${name} has left the room.`,
                                type: 'system',
                            });
                        }
                    },8000);

                    this.playerDisconnectTimeouts.set(sessionToken,timeoutId);
                }
            }
        }
    }

    @SubscribeMessage('join-room')
    async handleJoinRoom(@ConnectedSocket () client: Socket , @MessageBody() data: {
        roomCode: string; playerName: string; sessionToken?: string}
    ){
        try {
            const roomCode = data.roomCode.toUpperCase();

            // Clear disconnect timeout if reconnecting
            if(data.sessionToken && this.playerDisconnectTimeouts.has(data.sessionToken)){
                this.logger.log(`Reconnecting player with sessionToken: ${data.sessionToken}`);

                clearTimeout(this.playerDisconnectTimeouts.get(data.sessionToken)!);
                this.playerDisconnectTimeouts.delete(data.sessionToken);
            }

            const room = await this.gameService.joinRoom(roomCode,client.id,data.playerName, data.sessionToken);

            client.join(roomCode);
            this.socketToRoom.set(client.id,roomCode);
            this.socketToName.set(client.id,data.playerName);

            // Notify room about updated player list
            this.server.to(roomCode).emit('room-update',room);

            // send greeting chat message (only if not silent reconnection)
            const existingPlayer = room.players.find(p => p.id === client.id);
            const isReconnection = existingPlayer && existingPlayer.sessionToken === data.sessionToken;

            this.server.to(roomCode).emit('chat-message',{
                sender: 'System',
                text: isReconnection ?
                `${data.playerName} reconnected.`
                :`${data.playerName} has joined the room!`,
                type: 'system',
            });

            // synchronize canvas strokes
            const strokes = await this.gameService.getStrokes(roomCode);
            if(strokes && strokes.length > 0){
                client.emit('canvas-sync',strokes);
            }
        } catch (error: any ) {
            client.emit('error',error.message || 'Failed to join room');
        }
    }

    @SubscribeMessage('start-game')
    async handleStartGame(@ConnectedSocket () client: Socket){
        const roomCode = this.socketToRoom.get(client.id);
        if (!roomCode) return;

        const room = await this.gameService.getRoomState(roomCode);
        if(!room) return;

        // only host can start the game
        const player = room.players.find(p => p.id === client.id);
        if(player && player.isHost){
            await this.gameService.startGame(roomCode);
            this.server.to(roomCode).emit('chat-message',{
                sender: 'System',
                text: 'The game has started!',
                type: 'system',
            });
        }
    }

    @SubscribeMessage('draw')
    async handleDraw(@ConnectedSocket () client : Socket, @MessageBody () stroke: StrokeData){
        const roomCode = this.socketToRoom.get(client.id);
        if(!roomCode) return;

        const room = await this.gameService.getRoomState(roomCode);
        if(!room || room.status !== 'drawing' || room.turnOwnerId !== client.id){
            return;
        }

        client.to(roomCode).emit('draw-stroke',stroke);
        await this.gameService.addStroke(roomCode,stroke);
    }

    @SubscribeMessage('clear-canvas')
    async handleClearCanvas(@ConnectedSocket () client: Socket){
        const roomCode = this.socketToRoom.get(client.id);
        if(!roomCode) return;

        const room = await this.gameService.getRoomState(roomCode);
        if(!room || room.status !== 'drawing' || room.turnOwnerId !== client.id){
            return;
        }

        await this.gameService.clearStrokes(roomCode);
        this.server.to(roomCode).emit('clear-canvas');

    }

    @SubscribeMessage('undo-stroke')
    async handleUndoStroke(@ConnectedSocket () client : Socket){
        const roomCode = this.socketToRoom.get(client.id);
        if(!roomCode) return;
        await this.gameService.undoStroke(roomCode,client.id);
    }

    @SubscribeMessage('fill-canvas')
    async handleFillCanvas(@ConnectedSocket () client: Socket,@MessageBody() data : {color:string}){
        const roomCode = this.socketToRoom.get(client.id);
        if(!roomCode) return;
        await this.gameService.fillCanvas(roomCode,client.id,data.color);
    }

    @SubscribeMessage('select-word')
    async handleSelectWord(@ConnectedSocket () client: Socket,@MessageBody() data : {word:string}){
        const roomCode = this.socketToRoom.get(client.id);
        if(!roomCode) return;

        const room = await this.gameService.getRoomState(roomCode);
        if(!room || room.status !== 'selecting' || room.turnOwnerId !== client.id){
            return;
        }

        await this.gameService.selectWord(roomCode,data.word)
    }
    
    @SubscribeMessage('submit-guess')
    async handleGuess(@ConnectedSocket () client: Socket,@MessageBody() data : {guess:string}){
        const roomCode = this.socketToRoom.get(client.id);
        const name = this.socketToName.get(client.id);
        if(!roomCode || !name) return;

        const room = await this.gameService.getRoomState(roomCode);
        if( !room || room.status !== 'drawing') return;

        const isCorrect = await this.gameService.handleGuess(roomCode,client.id,data.guess);

        if(!isCorrect){
            this.server.to(roomCode).emit('chat-message',{
                sender: name,
                text: data.guess,
                type: 'guess',
            });
        }
    }

    @SubscribeMessage('request-rematch')
    async handleRematch(@ConnectedSocket () client: Socket){
        const roomCode = this.socketToRoom.get(client.id);
        if(!roomCode) return;

        const room = await this.gameService.getRoomState(roomCode);
        if( !room || room.status !== 'game-over') return;

        const player = room.players.find( p => p.id === client.id);
        if(player && player.isHost){
            const resetRoom = await this.gameService.resetRoom(roomCode)
            if(resetRoom){
                this.server.to(roomCode).emit('room-update',resetRoom);
                this.server.to(roomCode).emit('chat-message',{
                    sender: 'System',
                    text: 'Room has been reset for a rematch!',
                    type: 'system',
                })
            }
        }
    }
}