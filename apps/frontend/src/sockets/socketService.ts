import { io, type Socket } from "socket.io-client";
import { useGameStore, type StrokeData } from "../store/useGameStore";

class SocketService {
    private socket: Socket | null = null;
    private backendUrl = 'http://localhost:3000' 

    connect(){
        if (this.socket?.connected) return;

        this.socket = io(this.backendUrl,{
            transports: ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', ()=>{
            console.log('Socket connected: ',this.socket?.id);
            if(this.socket?.id){
                useGameStore.getState().setPlayerId(this.socket.id);
            }
        });

        this.socket.on('room-update', (roomState)=>{
            useGameStore.getState().updateRoomState(roomState);
        });

        this.socket.on('timer-update',(timerState)=>{
            useGameStore.getState().updateRoomState(timerState);
        })

        this.socket.on('hint-update',(hintState)=>{
            useGameStore.getState().updateRoomState(hintState);
        })

        this.socket.on('draw-stroke',(stroke: StrokeData)=>{
            useGameStore.getState().addStroke(stroke);
        })

        this.socket.on('clear-canvas',()=>{
            useGameStore.getState().clearCanvas();
        })

        this.socket.on('canvas-sync',(strokes: StrokeData[])=>{
            useGameStore.getState().setCanvasStrokes(strokes);
        })

        this.socket.on('chat-message',(msg)=>{
            useGameStore.getState().addChatMessage(msg);
        })

        this.socket.on('error',(errorMsg)=>{
            useGameStore.getState().addChatMessage({
                sender: 'System Error',
                text: errorMsg,
                type: 'system',
            });
        });

        this.socket.on('disconnect',()=>{
            console.log('Socket disconnected');
            useGameStore.getState().setPlayerId(null);
        })
    }

    joinRoom(roomCode: string , playerName: string, sessionToken?: string){
        if(!this.socket) this.connect();
        this.socket?.emit('join-room',{roomCode,playerName,sessionToken});
    }

    startGame(){
        this.socket?.emit('start-game')
    }

    draw(stroke: StrokeData){
        this.socket?.emit('draw', stroke);
    }

    clearCanvas(){
        this.socket?.emit('clear-canvas')
    }

    undoStroke(){
        this.socket?.emit('undo-stroke');
    }

    fillCanvas(color: string){
        this.socket?.emit('fill-canvas',{color});
    }

    selectWord(word: string){
        this.socket?.emit('select-word',{word});
    }

    submitGuess(guess: string){
        this.socket?.emit('submit-guess',{guess});
    }

    requestRematch(){
        this.socket?.emit('request-rematch')
    }
    
    disconnect(){
        if(this.socket){
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();