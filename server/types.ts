// ============================================================
//  Shared Types — Client ↔ Server message protocol
// ============================================================

// ---- Room / Lobby ----

export interface RoomConfig {
    mapPreset: string;
    maxPlayers: number;
    seed: number;
}

export interface RoomPlayer {
    id: string;
    name: string;
    slot: number;      // Unique player index (determines unit ownership)
    team: number;      // Alliance group (same team = allies)
    civIndex: number;
    color: string;
    ready: boolean;
    isHost: boolean;
    isAI: boolean;
    aiDifficulty: number; // 0=Easy, 1=Normal, 2=Hard (-1 for humans)
    ping: number;
}

export interface RoomState {
    roomId: string;
    config: RoomConfig;
    players: RoomPlayer[];
    started: boolean;
}

// ---- Game Commands ----

export enum CommandType {
    MOVE = 'MOVE',
    ATTACK_UNIT = 'ATTACK_UNIT',
    ATTACK_BUILDING = 'ATTACK_BUILDING',
    GATHER = 'GATHER',
    BUILD_PLACE = 'BUILD_PLACE',
    BUILD_AT = 'BUILD_AT',
    TRAIN = 'TRAIN',
    RESEARCH = 'RESEARCH',
    AGE_UP = 'AGE_UP',
    SET_RALLY = 'SET_RALLY',
    DELETE_UNIT = 'DELETE_UNIT',
    DELETE_BUILDING = 'DELETE_BUILDING',
    STOP = 'STOP',
    CANCEL_TRAIN = 'CANCEL_TRAIN',
    CHEAT = 'CHEAT',
    RETURN_RESOURCES = 'RETURN_RESOURCES',
}

export interface GameCommand {
    type: CommandType;
    playerId: string;
    team: number;
    tick: number;
    data: Record<string, any>;
}

// ---- Messages Client → Server ----

export enum ClientMsgType {
    // Lobby
    CREATE_ROOM = 'CREATE_ROOM',
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    UPDATE_SLOT = 'UPDATE_SLOT',
    PLAYER_READY = 'PLAYER_READY',
    START_GAME = 'START_GAME',
    ADD_AI = 'ADD_AI',
    REMOVE_AI = 'REMOVE_AI',
    UPDATE_AI_SLOT = 'UPDATE_AI_SLOT',
    // In-game
    GAME_COMMAND = 'GAME_COMMAND',
    PLAYER_LOADED = 'PLAYER_LOADED',
    TICK_ACK = 'TICK_ACK',
    PING = 'PING',
    CHAT = 'CHAT',
}

export interface ClientMessage {
    type: ClientMsgType;
    data?: any;
}

// ---- Messages Server → Client ----

export enum ServerMsgType {
    // Lobby
    ROOM_CREATED = 'ROOM_CREATED',
    ROOM_JOINED = 'ROOM_JOINED',
    ROOM_LEFT = 'ROOM_LEFT',
    ROOM_UPDATE = 'ROOM_UPDATE',
    GAME_STARTING = 'GAME_STARTING',
    ERROR = 'ERROR',
    // In-game
    COMMANDS_BATCH = 'COMMANDS_BATCH',
    TICK_ADVANCE = 'TICK_ADVANCE',
    ALL_LOADED = 'ALL_LOADED',
    PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
    PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
    PONG = 'PONG',
    CHAT_MSG = 'CHAT_MSG',
}

export interface ServerMessage {
    type: ServerMsgType;
    data?: any;
}

// ---- Tick System ----
export const TICK_RATE = 20; // 20 ticks per second (50ms per tick)
export const TICK_INTERVAL = 1000 / TICK_RATE; // 50ms
