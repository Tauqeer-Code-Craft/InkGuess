import { create } from "zustand";

export interface Player {
    id: string; 
    name: string;
    score: number;
    isHost: boolean;
    hasGuessed: boolean;
    isDrawer: boolean;
    scoreAddedThisTurn: number;
    sessionToken: string;
    isDisconnected?: boolean;
}

export type GameStatus = 'lobby' | 'selecting' | 'drawing' | 'round-end' | 'game-over';

export interface GameState {
    roomCode: string | null;
    playerName: string;
    playerId: string | null;
    players: Player[];
    isPlaying: boolean;
    round: number;
    maxRounds: number;
    turnIndex: number;
    turnOwnerId: string | null;
    currentWord: string | null;
    hint: string;
    timer: number;
    status: GameStatus;
    wordOptions: string[];
    chatMessages: ChatMessage[];
    canvasStrokes: StrokeData[];

    // Actions
    setPlayerName: (name: string) => void;
    setPlayerId: (id: string | null) => void;
    setRoomCode: (code: string | null) => void;
    updateRoomState: (state: any) => void;
    addChatMessage: (msg: Omit<ChatMessage,'id'>) => void;
    setCanvasStrokes: (strokes: StrokeData[]) => void;
    addStroke: (stroke: StrokeData) => void;
    clearCanvas: () => void;
    resetCanvas: () => void;
}

export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    type: 'guess' | 'system' | 'correct';
}

export interface StrokePoint {
    x: number;
    y: number;
}

export interface StrokeData {
    points: StrokePoint[];
    color: string;
    width: number;
    isDrawing: boolean;
    isFill?: boolean;
}

export const useGameStore = create<GameState>((set)=>({
    roomCode: null,
    playerName: '',
    playerId: null,
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
    chatMessages: [],
    canvasStrokes: [],

    setPlayerName: (name) => set({playerName: name}),
    setPlayerId: (id) => set({playerId: id}),
    setRoomCode: (code) => set({roomCode: code}),
    updateRoomState: (state) => set((prev)=> {
        const nextRoomCode = state.code ?? prev.roomCode;
        const nextPlayers = state.players ?? prev.players;
        const myPlayerId = state.playerId ?? prev.playerId;

        if(myPlayerId && nextPlayers){
            const me = nextPlayers.find((p:any)=> p.id === myPlayerId);
            if(me?.sessionToken){
                sessionStorage.setItem('inkguess_session_token',me.sessionToken);
                sessionStorage.setItem('inkguess_room_code',nextRoomCode || '');
                sessionStorage.setItem('inkguess_player_name',me.name || '');
            }
        }

        return {
            roomCode: nextRoomCode,
            players: nextPlayers,
            isPlaying: state.isPlaying ?? prev.isPlaying,
            round: state.round ?? prev.round,
            maxRounds: state.maxRounds ?? prev.maxRounds,
            turnIndex: state.turnIndex ?? prev.turnIndex,
            turnOwnerId: state.turnOwnerId ?? prev.turnOwnerId,
            currentWord: state.currentWord ?? prev.currentWord,
            hint: state.hint ?? prev.hint,
            timer: state.timer ?? prev.timer,
            status: state.status ?? prev.status,
            wordOptions: state.wordOptions ?? prev.wordOptions
        };
    }),
    addChatMessage: (msg) =>set((state)=> ({
        chatMessages: [
            ...state.chatMessages,
            {...msg,id: Math.random().toString(36)}  
        ]
    })) ,
    setCanvasStrokes: (strokes) => set({
        canvasStrokes: strokes
    }),
    addStroke: (stroke) => set((state)=> ({
        canvasStrokes: [...state.canvasStrokes,stroke] 
    })),
    clearCanvas: () => set({canvasStrokes: []}),
    resetCanvas: () => {
        sessionStorage.removeItem('inkguess_session_token');
        sessionStorage.removeItem('inkguess_room_code');
        sessionStorage.removeItem('inkguess_player_name');
        set({
            roomCode: null,
            players: [],
            isPlaying: false,
            round: 1,
            turnIndex: 0,
            turnOwnerId: null,
            currentWord: null,
            hint: '',
            timer: 0,
            status: 'lobby',
            wordOptions: [],
            chatMessages: [],
            canvasStrokes: [],
            });
        },
}));