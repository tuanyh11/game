// ============================================================
//  NetworkClient — WebSocket client for multiplayer
//  Handles connection, command sending, tick synchronization
// ============================================================

import {
    type GameCommand, type ServerMessage, type ClientMessage,
    type RoomState, type RoomPlayer,
    ClientMsgType, ServerMsgType, TICK_RATE,
} from '../../server/types';

export type NetworkEventHandler = {
    onRoomCreated?: (playerId: string, room: RoomState) => void;
    onRoomJoined?: (playerId: string, room: RoomState) => void;
    onRoomUpdate?: (room: RoomState) => void;
    onGameStarting?: (room: RoomState, players: RoomPlayer[], seed: number) => void;
    onTickAdvance?: (tick: number, commands: GameCommand[]) => void;
    onPlayerDisconnected?: (playerId: string, name: string, room: RoomState) => void;
    onPlayerReconnected?: (playerId: string, name: string) => void;
    onAllLoaded?: () => void;
    onError?: (message: string) => void;
    onConnectionChange?: (connected: boolean) => void;
    onChatMessage?: (name: string, message: string, color: string) => void;
};

export class NetworkClient {
    private ws: WebSocket | null = null;
    private serverUrl: string;
    private handlers: NetworkEventHandler = {};
    private _connected = false;
    private _playerId = '';
    private _ping = 0;
    private _pingInterval: ReturnType<typeof setInterval> | null = null;
    private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private _shouldReconnect = false;
    private _lastRoomId = '';

    constructor(serverUrl?: string) {
        if (serverUrl) {
            this.serverUrl = serverUrl;
        } else if (typeof window !== 'undefined' && window.location) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            this.serverUrl = `${protocol}//${window.location.host}/game`;
        } else {
            this.serverUrl = 'ws://localhost:4000/game';
        }
    }

    // ---- Properties ----
    get connected(): boolean { return this._connected; }
    get playerId(): string { return this._playerId; }
    get ping(): number { return this._ping; }

    // ---- Event Registration ----
    setHandlers(handlers: NetworkEventHandler): void {
        this.handlers = handlers;
    }

    // ---- Connection ----
    connect(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                this.ws = new WebSocket(this.serverUrl);

                this.ws.onopen = () => {
                    console.log('[NET] WebSocket connected!');
                    this._connected = true;
                    this.handlers.onConnectionChange?.(true);
                    this.startPing();
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    try {
                        // console.log('[NET] Raw message received:', event.data.toString().slice(0, 200));
                        const msg: ServerMessage = JSON.parse(event.data);
                        this.handleMessage(msg);
                    } catch (e) { console.error('[NET] Parse error:', e); }
                };

                this.ws.onclose = () => {
                    this._connected = false;
                    this.handlers.onConnectionChange?.(false);
                    this.stopPing();

                    if (this._shouldReconnect) {
                        this._reconnectTimer = setTimeout(() => {
                            console.log('🔄 Attempting reconnect...');
                            this.connect();
                        }, 2000);
                    }
                };

                this.ws.onerror = () => {
                    this._connected = false;
                    resolve(false);
                };
            } catch {
                resolve(false);
            }
        });
    }

    disconnect(): void {
        this._shouldReconnect = false;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._connected = false;
    }

    // ---- Send Methods ----
    private send(msg: ClientMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    createRoom(name: string, mapPreset: string): void {
        console.log('[NET] Sending CREATE_ROOM:', { name, mapPreset });
        this.send({
            type: ClientMsgType.CREATE_ROOM,
            data: { name, mapPreset },
        });
    }

    joinRoom(roomId: string, name: string): void {
        this._lastRoomId = roomId;
        this.send({
            type: ClientMsgType.JOIN_ROOM,
            data: { roomId, name },
        });
    }

    leaveRoom(): void {
        this.send({ type: ClientMsgType.LEAVE_ROOM });
    }

    updateSlot(data: { team?: number; civIndex?: number; color?: string; name?: string; mapPreset?: string }): void {
        this.send({
            type: ClientMsgType.UPDATE_SLOT,
            data,
        });
    }

    toggleReady(): void {
        this.send({ type: ClientMsgType.PLAYER_READY });
    }

    startGame(): void {
        this.send({ type: ClientMsgType.START_GAME });
    }

    addAI(): void {
        this.send({ type: ClientMsgType.ADD_AI });
    }

    removeAI(aiPlayerId: string): void {
        this.send({ type: ClientMsgType.REMOVE_AI, data: { aiPlayerId } });
    }

    updateAISlot(aiPlayerId: string, data: { civIndex?: number; aiDifficulty?: number; team?: number }): void {
        this.send({ type: ClientMsgType.UPDATE_AI_SLOT, data: { aiPlayerId, ...data } });
    }

    sendCommand(cmd: GameCommand): void {
        this.send({
            type: ClientMsgType.GAME_COMMAND,
            data: cmd,
        });
    }

    sendChat(message: string): void {
        this.send({
            type: ClientMsgType.CHAT,
            data: { message },
        });
    }

    // ---- Message Handler ----
    private handleMessage(msg: ServerMessage): void {
        switch (msg.type) {
            case ServerMsgType.ROOM_CREATED:
                this._playerId = msg.data.playerId;
                this._shouldReconnect = true;
                this.handlers.onRoomCreated?.(msg.data.playerId, msg.data.room);
                break;

            case ServerMsgType.ROOM_JOINED:
                this._playerId = msg.data.playerId;
                this._shouldReconnect = true;
                this._lastRoomId = msg.data.room.roomId;
                this.handlers.onRoomJoined?.(msg.data.playerId, msg.data.room);
                break;

            case ServerMsgType.ROOM_UPDATE:
                this.handlers.onRoomUpdate?.(msg.data.room);
                break;

            case ServerMsgType.GAME_STARTING:
                this._shouldReconnect = true;
                this.handlers.onGameStarting?.(msg.data.room, msg.data.players, msg.data.seed);
                break;

            case ServerMsgType.TICK_ADVANCE:
                this.handlers.onTickAdvance?.(msg.data.tick, msg.data.commands || []);
                break;

            case ServerMsgType.PLAYER_DISCONNECTED:
                this.handlers.onPlayerDisconnected?.(msg.data.playerId, msg.data.name, msg.data.room);
                break;

            case ServerMsgType.PLAYER_RECONNECTED:
                this.handlers.onPlayerReconnected?.(msg.data.playerId, msg.data.name);
                break;

            case ServerMsgType.ERROR:
                this.handlers.onError?.(msg.data.message);
                break;

            case ServerMsgType.PONG:
                if (msg.data?.timestamp) {
                    this._ping = Date.now() - msg.data.timestamp;
                }
                break;

            case ServerMsgType.CHAT_MSG:
                this.handlers.onChatMessage?.(msg.data.name, msg.data.message, msg.data.color);
                break;

            case ServerMsgType.ALL_LOADED:
                console.log('✅ All players loaded! Game starting...');
                this.handlers.onAllLoaded?.();
                break;
        }
    }

    // ---- Ping ----
    private startPing(): void {
        this.stopPing();
        this._pingInterval = setInterval(() => {
            this.send({
                type: ClientMsgType.PING,
                data: { timestamp: Date.now() },
            });
        }, 2000);
    }

    private stopPing(): void {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }

    /** Notify server that this player has finished loading the game */
    sendPlayerLoaded(): void {
        console.log('📦 Sending PLAYER_LOADED to server');
        this.send({ type: ClientMsgType.PLAYER_LOADED });
    }
}
