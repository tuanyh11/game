// ============================================================
//  Pixel Empires — Multiplayer Server (Bun + Elysia)
//  Handles Room management, Lobby sync, Command relay
// ============================================================

import { Elysia, file } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import {
    type RoomConfig, type RoomPlayer, type RoomState,
    type GameCommand, type ClientMessage, type ServerMessage,
    ClientMsgType, ServerMsgType, TICK_RATE, TICK_INTERVAL,
} from './types';

// ---- Room Storage ----
interface ServerRoom {
    id: string;
    config: RoomConfig;
    players: Map<string, RoomPlayer>;
    started: boolean;
    hostId: string;
    // Tick management
    currentTick: number;
    tickTimer: ReturnType<typeof setInterval> | null;
    commandBuffer: Map<number, GameCommand[]>; // tick → commands
    // Player websocket references
    sockets: Map<string, any>; // playerId → ws
    // Loading sync
    loadedPlayers: Set<string>; // Human players who finished loading
}

const rooms = new Map<string, ServerRoom>();

// ---- Helpers ----
function genRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id: string;
    do {
        id = '';
        for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
    } while (rooms.has(id));
    return id;
}

function genPlayerId(): string {
    return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function broadcastToRoom(room: ServerRoom, msg: ServerMessage, excludeId?: string): void {
    const data = JSON.stringify(msg);
    for (const [pid, ws] of room.sockets) {
        if (pid === excludeId) continue;
        try { ws.send(data); } catch { /* ignore dead sockets */ }
    }
}

function sendTo(room: ServerRoom, playerId: string, msg: ServerMessage): void {
    const ws = room.sockets.get(playerId);
    if (ws) {
        try { ws.send(JSON.stringify(msg)); } catch { /* ignore */ }
    }
}

function getRoomState(room: ServerRoom): RoomState {
    return {
        roomId: room.id,
        config: room.config,
        players: Array.from(room.players.values()),
        started: room.started,
    };
}

function startGameTicks(room: ServerRoom): void {
    if (room.tickTimer) return;
    room.currentTick = 0;
    room.commandBuffer.clear();

    room.tickTimer = setInterval(() => {
        room.currentTick++;
        const tick = room.currentTick;

        // Collect commands for this tick
        const commands = room.commandBuffer.get(tick) ?? [];
        room.commandBuffer.delete(tick);
        // Also flush any commands that arrived for earlier ticks
        for (const [t, cmds] of room.commandBuffer) {
            if (t <= tick) {
                commands.push(...cmds);
                room.commandBuffer.delete(t);
            }
        }

        // Broadcast tick advance + commands
        broadcastToRoom(room, {
            type: ServerMsgType.TICK_ADVANCE,
            data: { tick, commands },
        });
    }, TICK_INTERVAL);
}

function stopGameTicks(room: ServerRoom): void {
    if (room.tickTimer) {
        clearInterval(room.tickTimer);
        room.tickTimer = null;
    }
}

function cleanupRoom(roomId: string): void {
    const room = rooms.get(roomId);
    if (room) {
        stopGameTicks(room);
        rooms.delete(roomId);
        console.log(`🗑️  Room ${roomId} deleted`);
    }
}

// ---- Player → Room lookup ----
const playerRooms = new Map<string, string>(); // playerId → roomId
const wsPlayerMap = new Map<string, string>(); // ws.id → playerId

// ============================================================
//  Elysia Server
// ============================================================

const PORT = Number(process.env.PORT) || 4000;

const app = new Elysia()
    .use(cors())
    .use(await staticPlugin({
        assets: 'dist',
        prefix: '/',
        ignorePatterns: ['.html'],
    }))

    // ---- Serve index.html at root ----
    .get('/', () => file('dist/index.html'))

    // ---- REST endpoints for room listing ----
    .get('/rooms', () => {
        const list: RoomState[] = [];
        for (const room of rooms.values()) {
            if (!room.started && room.players.size < room.config.maxPlayers) {
                list.push(getRoomState(room));
            }
        }
        return list;
    })

    .get('/health', () => ({
        status: 'ok',
        rooms: rooms.size,
        players: playerRooms.size,
    }))

    // ---- WebSocket endpoint ----
    .ws('/game', {
        open(ws) {
            const playerId = genPlayerId();
            wsPlayerMap.set(ws.id, playerId);
            console.log(`🔌 Player connected: ${playerId} (ws.id=${ws.id})`);
        },

        message(ws, rawMsg) {
            const playerId = wsPlayerMap.get(ws.id);
            console.log(`📩 Message from ws.id=${ws.id}, playerId=${playerId}, raw type=${typeof rawMsg}`);
            if (!playerId) {
                console.log('❌ No playerId found for ws.id:', ws.id);
                return;
            }

            let msg: ClientMessage;
            try {
                msg = typeof rawMsg === 'string' ? JSON.parse(rawMsg as string) : rawMsg as any;
            } catch (e) {
                console.log('❌ Failed to parse message:', e);
                return;
            }

            console.log(`📨 Parsed msg type: ${msg.type}`);

            switch (msg.type) {
                // ===== CREATE ROOM =====
                case ClientMsgType.CREATE_ROOM: {
                    // Leave existing room if any
                    const existingRoomId = playerRooms.get(playerId);
                    if (existingRoomId) handleLeaveRoom(playerId);

                    const roomId = genRoomId();
                    const playerName = msg.data?.name || 'Host';
                    const mapPreset = msg.data?.mapPreset || 'continental';

                    const room: ServerRoom = {
                        id: roomId,
                        config: {
                            mapPreset,
                            maxPlayers: 8,
                            seed: Math.floor(Math.random() * 999999),
                        },
                        players: new Map(),
                        started: false,
                        hostId: playerId,
                        currentTick: 0,
                        tickTimer: null,
                        commandBuffer: new Map(),
                        sockets: new Map(),
                        loadedPlayers: new Set(),
                    };

                    const player: RoomPlayer = {
                        id: playerId,
                        name: playerName,
                        slot: 0, // Host is always slot 0
                        team: 0,
                        civIndex: 3, // La Mã default
                        color: '#4488ff',
                        ready: false,
                        isHost: true,
                        isAI: false,
                        aiDifficulty: -1,
                        ping: 0,
                    };

                    room.players.set(playerId, player);
                    room.sockets.set(playerId, ws);
                    rooms.set(roomId, room);
                    playerRooms.set(playerId, roomId);

                    ws.send(JSON.stringify({
                        type: ServerMsgType.ROOM_CREATED,
                        data: { playerId, room: getRoomState(room) },
                    } satisfies ServerMessage));

                    console.log(`🏠 Room ${roomId} created by ${playerName} — sent ROOM_CREATED to ${playerId}`);
                    break;
                }

                // ===== JOIN ROOM =====
                case ClientMsgType.JOIN_ROOM: {
                    const roomId = (msg.data?.roomId || '').toUpperCase();
                    const room = rooms.get(roomId);
                    const playerName = msg.data?.name || 'Player';

                    if (!room) {
                        ws.send(JSON.stringify({
                            type: ServerMsgType.ERROR,
                            data: { message: 'Không tìm thấy phòng!' },
                        } satisfies ServerMessage));
                        return;
                    }

                    if (room.started) {
                        ws.send(JSON.stringify({
                            type: ServerMsgType.ERROR,
                            data: { message: 'Trận đấu đã bắt đầu!' },
                        } satisfies ServerMessage));
                        return;
                    }

                    if (room.players.size >= room.config.maxPlayers) {
                        ws.send(JSON.stringify({
                            type: ServerMsgType.ERROR,
                            data: { message: 'Phòng đã đầy!' },
                        } satisfies ServerMessage));
                        return;
                    }

                    // Leave any existing room
                    const existingRoomId = playerRooms.get(playerId);
                    if (existingRoomId) handleLeaveRoom(playerId);

                    // Assign team & color
                    const colors = ['#4488ff', '#dd4444', '#44ccaa', '#cc44cc', '#ddaa44', '#44dd44'];
                    const usedColors = new Set(Array.from(room.players.values()).map(p => p.color));
                    const freeColor = colors.find(c => !usedColors.has(c)) || colors[room.players.size % colors.length];

                    // Assign next available slot
                    const usedSlots = new Set(Array.from(room.players.values()).map(p => p.slot));
                    let joinSlot = 0;
                    while (usedSlots.has(joinSlot)) joinSlot++;

                    // Put joiner on opposing team from host by default
                    const hostPlayer = room.players.get(room.hostId);
                    const hostTeam = hostPlayer?.team ?? 0;
                    const joinTeam = hostTeam === 0 ? 1 : 0;

                    const player: RoomPlayer = {
                        id: playerId,
                        name: playerName,
                        slot: joinSlot,
                        team: joinTeam,
                        civIndex: -1, // Random
                        color: freeColor,
                        ready: false,
                        isHost: false,
                        isAI: false,
                        aiDifficulty: -1,
                        ping: 0,
                    };

                    room.players.set(playerId, player);
                    room.sockets.set(playerId, ws);
                    playerRooms.set(playerId, roomId);

                    // Notify joiner
                    ws.send(JSON.stringify({
                        type: ServerMsgType.ROOM_JOINED,
                        data: { playerId, room: getRoomState(room) },
                    } satisfies ServerMessage));

                    // Notify others
                    broadcastToRoom(room, {
                        type: ServerMsgType.ROOM_UPDATE,
                        data: { room: getRoomState(room) },
                    }, playerId);

                    console.log(`👤 ${playerName} joined room ${roomId} (${room.players.size}/${room.config.maxPlayers})`);
                    break;
                }

                // ===== LEAVE ROOM =====
                case ClientMsgType.LEAVE_ROOM: {
                    handleLeaveRoom(playerId);
                    break;
                }

                // ===== UPDATE SLOT =====
                case ClientMsgType.UPDATE_SLOT: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || room.started) return;

                    const player = room.players.get(playerId);
                    if (!player) return;

                    const { team, civIndex, color, name } = msg.data || {};
                    if (team !== undefined) player.team = team;
                    if (civIndex !== undefined) player.civIndex = civIndex;
                    if (color !== undefined) player.color = color;
                    if (name !== undefined) player.name = name;

                    // Host can also update map config
                    if (playerId === room.hostId && msg.data?.mapPreset) {
                        room.config.mapPreset = msg.data.mapPreset;
                    }

                    broadcastToRoom(room, {
                        type: ServerMsgType.ROOM_UPDATE,
                        data: { room: getRoomState(room) },
                    });
                    break;
                }

                // ===== READY =====
                case ClientMsgType.PLAYER_READY: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || room.started) return;

                    const player = room.players.get(playerId);
                    if (!player) return;
                    player.ready = !player.ready;

                    broadcastToRoom(room, {
                        type: ServerMsgType.ROOM_UPDATE,
                        data: { room: getRoomState(room) },
                    });
                    break;
                }

                // ===== ADD AI =====
                case ClientMsgType.ADD_AI: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || room.started) return;
                    if (playerId !== room.hostId) return; // Only host

                    if (room.players.size >= room.config.maxPlayers) {
                        sendTo(room, playerId, {
                            type: ServerMsgType.ERROR,
                            data: { message: 'Phòng đã đầy!' },
                        });
                        return;
                    }

                    // Find next available slot
                    const usedSlots = new Set(Array.from(room.players.values()).map(p => p.slot));
                    let aiSlot = 0;
                    while (usedSlots.has(aiSlot)) aiSlot++;

                    // Default AI to a different alliance team than host
                    const hostPlayer = room.players.get(room.hostId);
                    const hostTeam = hostPlayer?.team ?? 0;
                    const aiTeam = hostTeam === 0 ? 1 : 0;

                    // Find free color
                    const colors = ['#4488ff', '#dd4444', '#44ccaa', '#cc44cc', '#ddaa44', '#44dd44', '#ff8844', '#8888ff'];
                    const usedColors = new Set(Array.from(room.players.values()).map(p => p.color));
                    const freeColor = colors.find(c => !usedColors.has(c)) || colors[room.players.size % colors.length];

                    const aiId = `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
                    const aiNames = ['AI Chiến Binh', 'AI Kiếm Sĩ', 'AI Cung Thủ', 'AI Kỵ Sĩ', 'AI Tướng Quân', 'AI Đao Phủ', 'AI Giáo Binh', 'AI Trinh Sát'];
                    const aiCount = Array.from(room.players.values()).filter(p => p.isAI).length;

                    const aiPlayer: RoomPlayer = {
                        id: aiId,
                        name: aiNames[aiCount % aiNames.length],
                        slot: aiSlot,
                        team: aiTeam,
                        civIndex: -1, // Random
                        color: freeColor,
                        ready: true,
                        isHost: false,
                        isAI: true,
                        aiDifficulty: 1, // Normal default
                        ping: 0,
                    };

                    room.players.set(aiId, aiPlayer);

                    broadcastToRoom(room, {
                        type: ServerMsgType.ROOM_UPDATE,
                        data: { room: getRoomState(room) },
                    });
                    // Also send to host (broadcastToRoom does NOT exclude, so this covers all)
                    console.log(`🤖 AI "${aiPlayer.name}" added to room ${roomId} (team ${aiTeam})`);
                    break;
                }

                // ===== REMOVE AI =====
                case ClientMsgType.REMOVE_AI: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || room.started) return;
                    if (playerId !== room.hostId) return; // Only host

                    const aiPlayerId = msg.data?.aiPlayerId;
                    if (!aiPlayerId) return;

                    const aiPlayer = room.players.get(aiPlayerId);
                    if (!aiPlayer || !aiPlayer.isAI) return;

                    room.players.delete(aiPlayerId);

                    broadcastToRoom(room, {
                        type: ServerMsgType.ROOM_UPDATE,
                        data: { room: getRoomState(room) },
                    });
                    console.log(`🤖 AI "${aiPlayer.name}" removed from room ${roomId}`);
                    break;
                }

                // ===== UPDATE AI SLOT (host only) =====
                case ClientMsgType.UPDATE_AI_SLOT: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || room.started) return;
                    if (playerId !== room.hostId) return; // Only host

                    const { aiPlayerId, civIndex, aiDifficulty, team } = msg.data || {};
                    if (!aiPlayerId) return;

                    const aiPlayer = room.players.get(aiPlayerId);
                    if (!aiPlayer || !aiPlayer.isAI) return;

                    if (civIndex !== undefined) aiPlayer.civIndex = civIndex;
                    if (aiDifficulty !== undefined) aiPlayer.aiDifficulty = aiDifficulty;
                    if (team !== undefined) aiPlayer.team = team;

                    broadcastToRoom(room, {
                        type: ServerMsgType.ROOM_UPDATE,
                        data: { room: getRoomState(room) },
                    });
                    break;
                }

                // ===== START GAME =====
                case ClientMsgType.START_GAME: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || room.started) return;
                    if (playerId !== room.hostId) return;

                    // Check all non-host HUMAN players are ready
                    for (const [pid, p] of room.players) {
                        if (pid !== room.hostId && !p.isAI && !p.ready) {
                            sendTo(room, playerId, {
                                type: ServerMsgType.ERROR,
                                data: { message: 'Chưa tất cả người chơi sẵn sàng!' },
                            });
                            return;
                        }
                    }

                    // Need at least 2 players (human + AI counts)
                    if (room.players.size < 2) {
                        sendTo(room, playerId, {
                            type: ServerMsgType.ERROR,
                            data: { message: 'Cần ít nhất 2 người chơi!' },
                        });
                        return;
                    }

                    room.started = true;

                    // Assign player indices (deterministic order)
                    const playerList = Array.from(room.players.values());
                    // Host is always index 0
                    playerList.sort((a, b) => {
                        if (a.id === room.hostId) return -1;
                        if (b.id === room.hostId) return 1;
                        return 0;
                    });

                    // Generate fresh seed
                    room.config.seed = Math.floor(Math.random() * 999999);

                    broadcastToRoom(room, {
                        type: ServerMsgType.GAME_STARTING,
                        data: {
                            room: getRoomState(room),
                            players: playerList,
                            seed: room.config.seed,
                        },
                    });

                    // DON'T start ticks yet — wait for all players to load
                    // startGameTicks will be called when all human players send PLAYER_LOADED
                    console.log(`🎮 Game starting in room ${roomId} — waiting for ${room.players.size} players to load (seed: ${room.config.seed})`);
                    break;
                }

                // ===== PLAYER LOADED =====
                case ClientMsgType.PLAYER_LOADED: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || !room.started) return;

                    room.loadedPlayers.add(playerId);

                    // Check if all human players have loaded
                    const humanPlayers = Array.from(room.players.values()).filter(p => !p.isAI);
                    const allLoaded = humanPlayers.every(p => room.loadedPlayers.has(p.id));

                    console.log(`📦 Player ${playerId} loaded (${room.loadedPlayers.size}/${humanPlayers.length})`);

                    if (allLoaded) {
                        console.log(`✅ All players loaded! Starting game ticks in room ${roomId}`);
                        broadcastToRoom(room, {
                            type: ServerMsgType.ALL_LOADED,
                            data: {},
                        });
                        startGameTicks(room);
                    }
                    break;
                }

                // ===== GAME COMMAND =====
                case ClientMsgType.GAME_COMMAND: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room || !room.started) return;

                    const cmd: GameCommand = msg.data;
                    if (!cmd) return;

                    // Stamp with current tick + 2 (input delay for fairness)
                    const executeTick = room.currentTick + 2;
                    cmd.tick = executeTick;
                    cmd.playerId = playerId;

                    if (!room.commandBuffer.has(executeTick)) {
                        room.commandBuffer.set(executeTick, []);
                    }
                    room.commandBuffer.get(executeTick)!.push(cmd);
                    break;
                }

                // ===== PING =====
                case ClientMsgType.PING: {
                    ws.send(JSON.stringify({
                        type: ServerMsgType.PONG,
                        data: { timestamp: msg.data?.timestamp },
                    } satisfies ServerMessage));
                    break;
                }

                // ===== CHAT =====
                case ClientMsgType.CHAT: {
                    const roomId = playerRooms.get(playerId);
                    if (!roomId) return;
                    const room = rooms.get(roomId);
                    if (!room) return;

                    const player = room.players.get(playerId);
                    broadcastToRoom(room, {
                        type: ServerMsgType.CHAT_MSG,
                        data: {
                            name: player?.name || 'Unknown',
                            message: (msg.data?.message || '').slice(0, 200),
                            color: player?.color || '#fff',
                        },
                    });
                    break;
                }
            }
        },

        close(ws) {
            const playerId = wsPlayerMap.get(ws.id);
            wsPlayerMap.delete(ws.id);
            if (!playerId) return;

            console.log(`❌ Player disconnected: ${playerId}`);
            handleLeaveRoom(playerId);
        },
    })


    .listen(PORT);

// ---- Leave Room Handler ----
function handleLeaveRoom(playerId: string): void {
    const roomId = playerRooms.get(playerId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) {
        playerRooms.delete(playerId);
        return;
    }

    const leavingPlayer = room.players.get(playerId);
    room.players.delete(playerId);
    room.sockets.delete(playerId);
    playerRooms.delete(playerId);

    if (room.players.size === 0) {
        cleanupRoom(roomId);
        return;
    }

    // If host left, promote next player
    if (playerId === room.hostId) {
        const nextHost = room.players.keys().next().value;
        if (nextHost) {
            room.hostId = nextHost;
            const nextHostPlayer = room.players.get(nextHost);
            if (nextHostPlayer) nextHostPlayer.isHost = true;
        }
    }

    if (room.started) {
        broadcastToRoom(room, {
            type: ServerMsgType.PLAYER_DISCONNECTED,
            data: {
                playerId,
                name: leavingPlayer?.name || 'Unknown',
                room: getRoomState(room),
            },
        });

        // If only 1 player left in a started game, stop ticks
        if (room.players.size <= 1) {
            stopGameTicks(room);
        }
    } else {
        broadcastToRoom(room, {
            type: ServerMsgType.ROOM_UPDATE,
            data: { room: getRoomState(room) },
        });
    }
}

console.log(`
╔═══════════════════════════════════════════════╗
║  🏰 Pixel Empires Multiplayer Server          ║
║  Running on http://localhost:${PORT}             ║
║  WebSocket: ws://localhost:${PORT}/game          ║
║  Serving static files from dist/              ║
╚═══════════════════════════════════════════════╝
`);
