// ============================================================
//  MultiplayerLobbyUI — Online lobby (Create/Join/Room views)
//  Extracted from MainMenu.ts
// ============================================================

import { MAP_LIST, MapPreset } from "../map/TileMap";
import { CivilizationType, CIVILIZATION_DATA } from "../config/GameConfig";
import { NetworkLobby } from "../network/NetworkLobby";
import type { RoomState, RoomPlayer } from '../../server/types';
import { getLobbyChooseTemplate, getLobbyRoomTemplate } from './MainMenu.templates';
import { t } from '../i18n/i18n';

const CIV_LIST = [
    CivilizationType.BaTu,
    CivilizationType.DaiMinh,
    CivilizationType.Yamato,
    CivilizationType.LaMa,
    CivilizationType.Viking,
];

/** Callbacks from the lobby UI back to the parent (MainMenu) */
export interface LobbyCallbacks {
    onGameStart: (room: RoomState, players: RoomPlayer[], seed: number, myPlayerId: string, myTeam: number, lobby: NetworkLobby) => void;
    onClose: () => void;
    getSelectedMapPreset: () => MapPreset;
    getPreviewCanvas: (mapIdx: number) => HTMLCanvasElement | null;
}

export class MultiplayerLobbyUI {
    private overlay: HTMLDivElement | null = null;
    private networkLobby: NetworkLobby | null = null;
    private callbacks: LobbyCallbacks;

    constructor(callbacks: LobbyCallbacks) {
        this.callbacks = callbacks;
    }

    /** Show the multiplayer lobby overlay */
    show(): void {
        if (this.overlay) this.overlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'mp-lobby-overlay';
        this.overlay = overlay;

        this.renderChooseView(overlay);
        document.body.appendChild(overlay);
    }

    /** Clean up */
    destroy(): void {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        this.networkLobby = null;
    }

    getNetworkLobby(): NetworkLobby | null {
        return this.networkLobby;
    }

    // ===================== CHOOSE VIEW =====================
    private renderChooseView(overlay: HTMLDivElement): void {
        overlay.innerHTML = getLobbyChooseTemplate();

        overlay.querySelector('#mp-close')!.addEventListener('click', () => {
            overlay.remove();
            this.overlay = null;
            this.callbacks.onClose();
        });

        overlay.querySelector('#mp-create')!.addEventListener('click', () => {
            const name = (overlay.querySelector('#mp-name') as HTMLInputElement).value.trim() || 'Host';
            this.createRoom(name, overlay);
        });

        overlay.querySelector('#mp-join')!.addEventListener('click', () => {
            const name = (overlay.querySelector('#mp-name') as HTMLInputElement).value.trim() || 'Player';
            const code = (overlay.querySelector('#mp-room-code') as HTMLInputElement).value.trim().toUpperCase();
            if (code.length < 3) {
                this.showError(overlay, t('mp.roomCodeError'));
                return;
            }
            this.joinRoom(code, name, overlay);
        });
    }

    // ===================== CREATE / JOIN =====================
    private createRoom(name: string, overlay: HTMLDivElement): void {
        overlay.innerHTML = `<div class="mp-panel"><div class="mp-body"><div class="mp-connecting">${t('mp.connecting')}</div></div></div>`;

        const lobby = new NetworkLobby();
        this.networkLobby = lobby;

        lobby.setHandlers({
            onStateChange: () => this.renderRoomView(overlay, lobby),
            onError: (msg) => this.showError(overlay, msg),
            onGameStart: (room, players, seed, myPlayerId, myTeam) => {
                this.callbacks.onGameStart(room, players, seed, myPlayerId, myTeam, lobby);
                overlay.remove();
                this.overlay = null;
            },
        });

        const mapPreset = this.callbacks.getSelectedMapPreset();
        lobby.createRoom(name, mapPreset);
    }

    private joinRoom(roomId: string, name: string, overlay: HTMLDivElement): void {
        overlay.innerHTML = `<div class="mp-panel"><div class="mp-body"><div class="mp-connecting">${t('mp.connectingShort')}</div></div></div>`;

        const lobby = new NetworkLobby();
        this.networkLobby = lobby;

        lobby.setHandlers({
            onStateChange: () => this.renderRoomView(overlay, lobby),
            onError: (msg) => {
                this.renderChooseView(overlay);
                setTimeout(() => this.showError(overlay, msg), 50);
            },
            onGameStart: (room, players, seed, myPlayerId, myTeam) => {
                this.callbacks.onGameStart(room, players, seed, myPlayerId, myTeam, lobby);
                overlay.remove();
                this.overlay = null;
            },
        });

        lobby.joinRoom(roomId, name);
    }

    private showError(overlay: HTMLDivElement, msg: string): void {
        const el = overlay.querySelector('#mp-error') as HTMLDivElement;
        if (el) { el.style.display = 'block'; el.textContent = msg; }
    }

    // ===================== ROOM VIEW =====================
    private renderRoomView(overlay: HTMLDivElement, lobby: NetworkLobby): void {
        if (!lobby.roomState) return;
        const room = lobby.roomState;
        const isHost = lobby.isHost;

        const diffNames = [t('mp.diffEasy'), t('mp.diffNormal'), t('mp.diffHard')];
        const diffColors = ['#44cc44', '#ddcc44', '#dd4444'];

        // Load the shell template
        overlay.innerHTML = getLobbyRoomTemplate();

        // Populate dynamic fields
        const roomIdEl = overlay.querySelector('#mp-room-id');
        if (roomIdEl) roomIdEl.textContent = room.roomId;

        const countEl = overlay.querySelector('#mp-player-count');
        if (countEl) countEl.textContent = `${t('mp.playerCount')} (${room.players.length}/8)`;

        const pingEl = overlay.querySelector('#mp-ping');
        if (pingEl) pingEl.textContent = `Ping: ${lobby.ping}ms`;

        // Map select + Preview (fits in right column)
        const mapWrap = overlay.querySelector('#mp-map-wrap');
        if (mapWrap) {
            const currentMap = room.config.mapPreset;
            const mapIdx = MAP_LIST.findIndex(m => m.preset === currentMap);
            const mapInfo = MAP_LIST.find(m => m.preset === currentMap);

            // Map preview canvas (full width of column)
            if (mapIdx >= 0) {
                const srcCanvas = this.callbacks.getPreviewCanvas(mapIdx);
                if (srcCanvas) {
                    const previewWrap = document.createElement('div');
                    previewWrap.style.cssText = 'width:100%; aspect-ratio:1; border:1px solid rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.3); margin-bottom:10px';
                    const preview = srcCanvas.cloneNode(true) as HTMLCanvasElement;
                    const pctx = preview.getContext('2d')!;
                    pctx.drawImage(srcCanvas, 0, 0);
                    preview.style.cssText = 'width:100%; height:100%; display:block; image-rendering:pixelated';
                    previewWrap.appendChild(preview);
                    mapWrap.appendChild(previewWrap);
                }
            }

            if (isHost) {
                const mapSelect = document.createElement('select');
                mapSelect.className = 'mp-civ-select';
                mapSelect.style.cssText = 'width:100%; padding:8px 10px !important; font-size:12px !important';
                MAP_LIST.forEach((m) => {
                    const opt = document.createElement('option');
                    opt.value = m.preset;
                    opt.textContent = m.name;
                    if (m.preset === currentMap) opt.selected = true;
                    mapSelect.appendChild(opt);
                });
                mapSelect.id = 'mp-map-select';
                mapWrap.appendChild(mapSelect);
            } else {
                const mapName = document.createElement('div');
                mapName.style.cssText = 'font-size:13px; font-weight:500; color:#d4d4d8; text-align:center';
                mapName.textContent = mapInfo ? mapInfo.name : currentMap;
                mapWrap.appendChild(mapName);
            }
        }

        // Render player list via DOM API
        const playerListEl = overlay.querySelector('#mp-player-list');
        if (playerListEl) {
            for (const p of room.players) {
                const isAI = (p as any).isAI === true;
                const isMe = p.id === lobby.myPlayerId;

                const row = document.createElement('div');
                row.className = 'mp-player';

                // Color dot
                const dotWrap = document.createElement('div');
                dotWrap.style.cssText = 'width:24px; display:flex; justify-content:center';
                const dot = document.createElement('div');
                dot.className = 'mp-player-dot';
                dot.style.background = p.color;
                dotWrap.appendChild(dot);
                row.appendChild(dotWrap);

                // Name
                const nameEl = document.createElement('div');
                nameEl.className = 'zen-slot-name human';
                nameEl.style.color = '#f4f4f5';
                nameEl.textContent = isAI ? `🤖 ${p.name}` : p.name;
                row.appendChild(nameEl);

                // Civilization select/label
                const civData = p.civIndex >= 0 && p.civIndex < CIV_LIST.length
                    ? CIVILIZATION_DATA[CIV_LIST[p.civIndex]]
                    : null;
                const isLocked = !isAI && !p.isHost && p.ready;
                const civWrap = document.createElement('div');
                civWrap.style.cssText = 'width:120px';
                if ((isMe || (isHost && isAI)) && !isLocked) {
                    const civSelect = document.createElement('select');
                    civSelect.className = 'zen-field-btn mp-civ-select';
                    civSelect.dataset.playerId = p.id;
                    civSelect.dataset.isAi = String(isAI);
                    civSelect.title = t('mp.changeCiv');
                    civSelect.style.width = '100%';
                    const randomOpt = document.createElement('option');
                    randomOpt.value = '-1';
                    randomOpt.textContent = t('mp.randomCiv');
                    if (p.civIndex === -1) randomOpt.selected = true;
                    civSelect.appendChild(randomOpt);
                    CIV_LIST.forEach((civId, idx) => {
                        const cData = CIVILIZATION_DATA[civId];
                        if (cData) {
                            const opt = document.createElement('option');
                            opt.value = String(idx);
                            opt.textContent = `${cData.icon} ${cData.name}`;
                            if (p.civIndex === idx) opt.selected = true;
                            civSelect.appendChild(opt);
                        }
                    });
                    civWrap.appendChild(civSelect);
                } else {
                    const civLabel = document.createElement('div');
                    civLabel.style.cssText = 'font-size:12px; font-weight:500; color:#94a3b8';
                    civLabel.textContent = civData ? `${civData.icon} ${civData.name}` : t('mp.randomCiv');
                    civWrap.appendChild(civLabel);
                }
                row.appendChild(civWrap);

                // Team button/label
                const teamWrap = document.createElement('div');
                teamWrap.style.cssText = 'width:70px; text-align:center';
                const teamColor = p.team === 0 ? '#d4d4d8' : p.team === 1 ? '#a1a1aa' : '#71717a';
                if ((isMe || (isHost && isAI)) && !isLocked) {
                    const teamBtn = document.createElement('button');
                    teamBtn.className = 'zen-field-btn mp-team-btn';
                    teamBtn.dataset.playerId = p.id;
                    teamBtn.dataset.isAi = String(isAI);
                    teamBtn.style.color = teamColor;
                    teamBtn.style.borderColor = 'rgba(255,255,255,0.08)';
                    teamBtn.style.width = '100%';
                    teamBtn.title = t('mp.changeTeam');
                    teamBtn.textContent = `${t('mp.teamLabel')} ${p.team} ▸`;
                    teamWrap.appendChild(teamBtn);
                } else {
                    const teamLabel = document.createElement('div');
                    teamLabel.style.cssText = `font-size:11px; font-weight:600; color:${teamColor}; padding: 4px 0`;
                    teamLabel.textContent = `${t('mp.teamLabel')} ${p.team}`;
                    teamWrap.appendChild(teamLabel);
                }
                row.appendChild(teamWrap);

                // Difficulty (AI only)
                const diffWrap = document.createElement('div');
                diffWrap.style.cssText = 'width:70px; text-align:center';
                if (isAI) {
                    const diff = (p as any).aiDifficulty ?? 1;
                    const dName = diffNames[diff] || t('mp.diffNormal');
                    const dColor = diffColors[diff] || '#d4af37';
                    if (isHost) {
                        const diffBtn = document.createElement('button');
                        diffBtn.className = 'zen-field-btn mp-diff-btn';
                        diffBtn.dataset.aiId = p.id;
                        diffBtn.style.color = dColor;
                        diffBtn.style.borderColor = 'rgba(255,255,255,0.08)';
                        diffBtn.style.width = '100%';
                        diffBtn.title = t('mp.changeDiff');
                        diffBtn.textContent = `⚔ ${dName} ▸`;
                        diffWrap.appendChild(diffBtn);
                    } else {
                        const diffLabel = document.createElement('div');
                        diffLabel.style.cssText = `font-size:11px; font-weight:600; color:${dColor}; padding: 4px 0`;
                        diffLabel.textContent = `⚔ ${dName}`;
                        diffWrap.appendChild(diffLabel);
                    }
                }
                row.appendChild(diffWrap);

                // Ready status
                const readyWrap = document.createElement('div');
                readyWrap.style.cssText = 'width:80px; text-align:center';
                const readySpan = document.createElement('span');
                if (p.isHost) {
                    readySpan.className = 'mp-player-host';
                    readySpan.textContent = t('mp.host');
                } else if (isAI) {
                    readySpan.className = 'mp-player-ready';
                    readySpan.style.color = '#a1a1aa';
                    readySpan.style.borderColor = 'rgba(255,255,255,0.05)';
                    readySpan.textContent = t('mp.aiReady');
                } else if (p.ready) {
                    readySpan.className = 'mp-player-ready';
                    readySpan.style.color = '#d4af37';
                    readySpan.style.borderColor = 'rgba(212,175,55,0.3)';
                    readySpan.textContent = t('mp.ready');
                } else {
                    readySpan.className = 'mp-player-ready';
                    readySpan.style.color = '#71717a';
                    readySpan.style.borderColor = 'rgba(255,255,255,0.05)';
                    readySpan.textContent = '⏳ CHỜ';
                }
                readyWrap.appendChild(readySpan);
                row.appendChild(readyWrap);

                // Remove AI button (host only)
                const actWrap = document.createElement('div');
                actWrap.style.cssText = 'width:40px; text-align:right';
                if (isHost && isAI) {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'zen-close-btn mp-remove-ai';
                    removeBtn.dataset.aiId = p.id;
                    removeBtn.textContent = '✕';
                    removeBtn.title = t('mp.kickAI');
                    actWrap.appendChild(removeBtn);
                }
                row.appendChild(actWrap);

                playerListEl.appendChild(row);
            }
        }

        // Add AI button
        const humanPlayers = room.players.filter(p => !(p as any).isAI);
        const allReady = humanPlayers.filter(p => !p.isHost).every(p => p.ready);
        const hasEnoughPlayers = room.players.length >= 2;
        const canStart = isHost && hasEnoughPlayers && (humanPlayers.length <= 1 || allReady);
        const canAddAI = isHost && room.players.length < 8;

        const addAIWrap = overlay.querySelector('#mp-add-ai-wrap');
        if (addAIWrap && canAddAI) {
            const addAIBtn = document.createElement('button');
            addAIBtn.className = 'zen-add-btn';
            addAIBtn.id = 'mp-add-ai';
            addAIBtn.textContent = t('mp.addBot');
            addAIWrap.appendChild(addAIBtn);
        }

        // Action button (Start / Ready)
        const actionWrap = overlay.querySelector('#mp-action-wrap');
        if (actionWrap) {
            if (isHost) {
                const startBtn = document.createElement('button');
                startBtn.className = 'mp-btn mp-btn-gold';
                startBtn.id = 'mp-start';
                startBtn.textContent = t('mp.startGame');
                if (!canStart) {
                    startBtn.disabled = true;
                    startBtn.style.opacity = '0.4';
                    startBtn.style.cursor = 'not-allowed';
                }
                actionWrap.appendChild(startBtn);
            } else {
                const readyBtn = document.createElement('button');
                readyBtn.className = 'mp-btn mp-btn-green';
                readyBtn.id = 'mp-ready';
                readyBtn.textContent = lobby.myPlayer?.ready ? t('mp.cancelReady') : t('mp.readyBtn');
                actionWrap.appendChild(readyBtn);
            }
        }

        // ---- EVENT LISTENERS ----
        overlay.querySelector('#mp-leave')?.addEventListener('click', () => {
            lobby.leaveRoom();
            this.networkLobby = null;
            this.renderChooseView(overlay);
        });

        overlay.querySelector('#mp-start')?.addEventListener('click', () => {
            lobby.startGame();
        });

        overlay.querySelector('#mp-ready')?.addEventListener('click', () => {
            lobby.toggleReady();
        });

        overlay.querySelector('#mp-map-select')?.addEventListener('change', (e) => {
            const val = (e.currentTarget as HTMLSelectElement).value;
            lobby.updateSlot({ mapPreset: val });
        });

        overlay.querySelector('#mp-add-ai')?.addEventListener('click', () => {
            lobby.addAI();
        });

        overlay.querySelectorAll('.mp-remove-ai').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aiId = (e.currentTarget as HTMLElement).dataset.aiId;
                if (aiId) lobby.removeAI(aiId);
            });
        });

        overlay.querySelectorAll('.mp-civ-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const el = e.currentTarget as HTMLSelectElement;
                const pid = el.dataset.playerId!;
                const isAI = el.dataset.isAi === 'true';
                const newCiv = parseInt(el.value, 10);
                if (isAI) {
                    lobby.updateAISlot(pid, { civIndex: newCiv });
                } else {
                    lobby.updateSlot({ civIndex: newCiv });
                }
            });
        });

        overlay.querySelectorAll('.mp-diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const el = e.currentTarget as HTMLElement;
                const aiId = el.dataset.aiId!;
                const player = room.players.find(p => p.id === aiId);
                if (!player) return;
                const currentDiff = (player as any).aiDifficulty ?? 1;
                const newDiff = (currentDiff + 1) % 3;
                lobby.updateAISlot(aiId, { aiDifficulty: newDiff });
            });
        });

        overlay.querySelectorAll('.mp-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const el = e.currentTarget as HTMLElement;
                const pid = el.dataset.playerId!;
                const isAI = el.dataset.isAi === 'true';
                const player = room.players.find(p => p.id === pid);
                if (!player) return;
                const newTeam = (player.team + 1) % 4;
                if (isAI) {
                    lobby.updateAISlot(pid, { team: newTeam });
                } else {
                    lobby.updateSlot({ team: newTeam });
                }
            });
        });
    }
}
