// ============================================================
//  NetworkLobby — Multiplayer lobby state management
//  Bridges between NetworkClient and MainMenu UI
// ============================================================

import { NetworkClient } from './NetworkClient';
import type { RoomState, RoomPlayer } from '../../server/types';

export type LobbyEventHandler = {
    onStateChange?: (lobby: NetworkLobby) => void;
    onError?: (message: string) => void;
    onGameStart?: (room: RoomState, players: RoomPlayer[], seed: number, myPlayerId: string, myTeam: number) => void;
    onChat?: (name: string, message: string, color: string) => void;
};

export class NetworkLobby {
    private client: NetworkClient;
    private handlers: LobbyEventHandler = {};

    // State
    roomState: RoomState | null = null;
    myPlayerId = '';
    isInLobby = false;
    isConnecting = false;
    connectionError = '';

    constructor(serverUrl?: string) {
        this.client = new NetworkClient(serverUrl);
        this.setupHandlers();
    }

    get isHost(): boolean {
        if (!this.roomState) return false;
        const me = this.roomState.players.find(p => p.id === this.myPlayerId);
        return me?.isHost ?? false;
    }

    get myPlayer(): RoomPlayer | undefined {
        return this.roomState?.players.find(p => p.id === this.myPlayerId);
    }

    get myTeam(): number {
        return this.myPlayer?.team ?? 0;
    }

    get connected(): boolean {
        return this.client.connected;
    }

    get ping(): number {
        return this.client.ping;
    }

    get networkClient(): NetworkClient {
        return this.client;
    }

    setHandlers(handlers: LobbyEventHandler): void {
        this.handlers = handlers;
    }

    // ---- Setup ----
    private setupHandlers(): void {
        this.client.setHandlers({
            onRoomCreated: (playerId, room) => {
                this.myPlayerId = playerId;
                this.roomState = room;
                this.isInLobby = true;
                this.isConnecting = false;
                this.connectionError = '';
                this.handlers.onStateChange?.(this);
            },
            onRoomJoined: (playerId, room) => {
                this.myPlayerId = playerId;
                this.roomState = room;
                this.isInLobby = true;
                this.isConnecting = false;
                this.connectionError = '';
                this.handlers.onStateChange?.(this);
            },
            onRoomUpdate: (room) => {
                this.roomState = room;
                this.handlers.onStateChange?.(this);
            },
            onGameStarting: (room, players, seed) => {
                this.roomState = room;
                // Use slot (unique ownership index) as the internal team number
                const me = players.find(p => p.id === this.myPlayerId);
                const myTeam = me ? me.slot : 0;
                this.handlers.onGameStart?.(room, players, seed, this.myPlayerId, myTeam);
            },
            onPlayerDisconnected: (_playerId, name, room) => {
                this.roomState = room;
                this.handlers.onStateChange?.(this);
            },
            onError: (message) => {
                this.connectionError = message;
                this.isConnecting = false;
                this.handlers.onError?.(message);
                this.handlers.onStateChange?.(this);
            },
            onConnectionChange: (connected) => {
                if (!connected) {
                    this.isConnecting = false;
                    if (this.isInLobby) {
                        this.connectionError = 'Mất kết nối server!';
                    }
                }
                this.handlers.onStateChange?.(this);
            },
            onChatMessage: (name, message, color) => {
                this.handlers.onChat?.(name, message, color);
            },
        });
    }

    // ---- Actions ----
    async createRoom(name: string, mapPreset: string): Promise<void> {
        this.isConnecting = true;
        this.connectionError = '';
        this.handlers.onStateChange?.(this);

        const ok = await this.client.connect();
        if (!ok) {
            this.isConnecting = false;
            this.connectionError = 'Không thể kết nối server! Hãy chắc chắn server đang chạy.';
            this.handlers.onStateChange?.(this);
            return;
        }

        this.client.createRoom(name, mapPreset);
    }

    async joinRoom(roomId: string, name: string): Promise<void> {
        this.isConnecting = true;
        this.connectionError = '';
        this.handlers.onStateChange?.(this);

        const ok = await this.client.connect();
        if (!ok) {
            this.isConnecting = false;
            this.connectionError = 'Không thể kết nối server!';
            this.handlers.onStateChange?.(this);
            return;
        }

        this.client.joinRoom(roomId, name);
    }

    leaveRoom(): void {
        this.client.leaveRoom();
        this.client.disconnect();
        this.roomState = null;
        this.isInLobby = false;
        this.myPlayerId = '';
        this.connectionError = '';
        this.handlers.onStateChange?.(this);
    }

    updateSlot(data: { team?: number; civIndex?: number; color?: string; mapPreset?: string }): void {
        this.client.updateSlot(data);
    }

    toggleReady(): void {
        this.client.toggleReady();
    }

    startGame(): void {
        this.client.startGame();
    }

    addAI(): void {
        this.client.addAI();
    }

    removeAI(aiPlayerId: string): void {
        this.client.removeAI(aiPlayerId);
    }

    updateAISlot(aiPlayerId: string, data: { civIndex?: number; aiDifficulty?: number; team?: number }): void {
        this.client.updateAISlot(aiPlayerId, data);
    }

    sendChat(message: string): void {
        this.client.sendChat(message);
    }

    destroy(): void {
        this.client.disconnect();
        this.roomState = null;
        this.isInLobby = false;
    }
}
