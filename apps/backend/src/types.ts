export interface Player {
    id: string; //Socket ID
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

export interface RoomState {
    code: string;
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
}

export class StrokePoint {
    x!: number;
    y!: number;
}

export class StrokeData {
    points!: StrokePoint[];
    color!: string;
    width!: number;
    isDrawing!: boolean;
    isFill?: boolean;
}