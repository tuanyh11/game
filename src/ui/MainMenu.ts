// ============================================================
//  MainMenu — Warcraft III-style Lobby with Stone Frame UI
// ============================================================

import { MAP_LIST, TileMap, MapPreset } from "../map/TileMap";
import { C, TerrainType, CIVILIZATION_DATA, CivilizationType } from "../config/GameConfig";
import { AI_DIFFICULTY_NAMES } from "../systems/AIController";
import { AIDifficulty } from "../systems/ai/AIConfig";
import { AISlotConfig } from "../core/Game";
import { NetworkLobby } from "../network/NetworkLobby";
import './MainMenu.css';
import type { RoomState, RoomPlayer } from '../../server/types';

// HTML Templates (exported as functions for i18n)
import { getModeSelectTemplate, getAiSetupTemplate, getLobbyChooseTemplate, getLobbyRoomTemplate } from './MainMenu.templates';
import { MultiplayerLobbyUI } from './MultiplayerLobbyUI';
import { GuideUI } from './GuideUI';
import { t, getLang, setLang } from '../i18n/i18n';

const DIFFICULTIES = [AIDifficulty.Easy, AIDifficulty.Normal, AIDifficulty.Hard];
const DIFF_COLORS: Record<AIDifficulty, string> = {
    [AIDifficulty.Easy]: '#44cc44',
    [AIDifficulty.Normal]: '#ddcc44',
    [AIDifficulty.Hard]: '#dd4444',
};

const CIV_LIST = [
    CivilizationType.BaTu,
    CivilizationType.DaiMinh,
    CivilizationType.Yamato,
    CivilizationType.LaMa,
    CivilizationType.Viking,
];

const TEAM_COLORS = [
    '#4488ff', '#dd4444', '#44ccaa', '#cc44cc',
    '#ddaa44', '#44dd44', '#dd8844', '#8888ff',
    '#ff6688', '#66ccdd', '#aa66cc', '#88cc44',
];
const TEAM_NAME_KEYS = [
    'team.blue', 'team.red', 'team.teal', 'team.purple',
    'team.yellow', 'team.green', 'team.orange', 'team.lightPurple',
    'team.pink', 'team.cyan', 'team.darkPurple', 'team.lime',
];

interface PlayerSlot {
    isHuman: boolean;
    team: number;
    civIndex: number;
    difficulty: AIDifficulty;
    color: string;
    name: string;
}

export class MainMenu {
    private canvas: HTMLCanvasElement;
    private selectedMapIndex = 0;
    private slots: PlayerSlot[] = [];
    private onStart: ((preset: MapPreset, playerCiv: CivilizationType, aiSlots: AISlotConfig[], freeMode: boolean, playerColor: string) => void) | null = null;
    // Multiplayer callback
    private onMultiplayerStart: ((room: RoomState, players: RoomPlayer[], seed: number, myPlayerId: string, myTeam: number, lobby: NetworkLobby) => void) | null = null;
    private stopped = false;
    private container: HTMLDivElement | null = null;
    private previewCanvases: HTMLCanvasElement[] = [];
    private colorPickerSlotIndex = -1;
    private networkLobby: NetworkLobby | null = null;
    private lobbyOverlay: HTMLDivElement | null = null;
    private multiplayerLobbyUI: MultiplayerLobbyUI | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvas.style.display = 'none';

        this.slots = [
            { isHuman: true, team: 1, civIndex: 3, difficulty: AIDifficulty.Normal, color: TEAM_COLORS[0], name: t('slot.you') },
            { isHuman: false, team: 1, civIndex: -1, difficulty: AIDifficulty.Normal, color: TEAM_COLORS[1], name: t('slot.ally') },
            { isHuman: false, team: 2, civIndex: -1, difficulty: AIDifficulty.Normal, color: TEAM_COLORS[2], name: t('slot.enemy1') },
            { isHuman: false, team: 2, civIndex: -1, difficulty: AIDifficulty.Hard, color: TEAM_COLORS[3], name: t('slot.enemy2') },
        ];

        // Pre-render map previews
        const PREVIEW_SIZE = 200;
        for (const info of MAP_LIST) {
            const map = new TileMap(info.preset);
            map.generate(info.preset); // Explicitly create terrain data for the preview
            const offscreen = document.createElement('canvas');
            offscreen.width = PREVIEW_SIZE;
            offscreen.height = PREVIEW_SIZE;
            const octx = offscreen.getContext('2d')!;
            const tw = PREVIEW_SIZE / map.cols;
            const th = PREVIEW_SIZE / map.rows;
            for (let r = 0; r < map.rows; r++) {
                for (let c = 0; c < map.cols; c++) {
                    const t = map.terrain[r][c];
                    switch (t) {
                        case TerrainType.Grass: octx.fillStyle = '#3a6a20'; break;
                        case TerrainType.GrassDark: octx.fillStyle = '#2a5a15'; break;
                        case TerrainType.GrassLight: octx.fillStyle = '#4a8a2e'; break;
                        case TerrainType.GrassFlower: octx.fillStyle = '#3e7a22'; break;
                        case TerrainType.Sand: octx.fillStyle = '#b0a060'; break;
                        case TerrainType.Dirt: octx.fillStyle = '#6a5535'; break;
                        case TerrainType.DirtDark: octx.fillStyle = '#453520'; break;
                        case TerrainType.Rock: octx.fillStyle = '#707068'; break;
                        case TerrainType.Water: octx.fillStyle = '#2070aa'; break;
                    }
                    octx.fillRect(c * tw, r * th, Math.ceil(tw), Math.ceil(th));
                }
            }
            this.previewCanvases.push(offscreen);
        }
    }

    setOnStart(cb: (preset: MapPreset, playerCiv: CivilizationType, aiSlots: AISlotConfig[], freeMode: boolean, playerColor: string) => void): void {
        this.onStart = cb;
    }

    setOnMultiplayerStart(cb: (room: RoomState, players: RoomPlayer[], seed: number, myPlayerId: string, myTeam: number, lobby: NetworkLobby) => void): void {
        this.onMultiplayerStart = cb;
    }

    start(): void {
        this.buildUI();
    }

    stop(): void {
        this.stopped = true;
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.canvas.style.display = 'block';
    }

    private updateSlotColors(): void {
        const usedColors = new Set<string>();
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i].color || usedColors.has(this.slots[i].color)) {
                const free = TEAM_COLORS.find(c => !usedColors.has(c)) ?? TEAM_COLORS[i % TEAM_COLORS.length];
                this.slots[i].color = free;
            }
            usedColors.add(this.slots[i].color);
            if (!this.slots[i].isHuman) this.slots[i].name = `${t('slot.ai')} ${i}`;
        }
    }

    // ===================== BUILD HTML UI =====================
    private buildUI(): void {
        if (this.container) this.container.remove();

        const container = document.createElement('div');
        container.id = 'main-menu';
        this.container = container;

        container.innerHTML = getModeSelectTemplate();
        document.body.appendChild(container);

        // Mode card click handlers
        container.querySelector('#mode-ai')?.addEventListener('click', () => {
            this.showAISetup();
        });

        container.querySelector('#mode-online')?.addEventListener('click', () => {
            this.showMultiplayerLobby();
        });

        // Language toggle handler
        const langBtn = container.querySelector('#mm-lang-btn') as HTMLButtonElement | null;
        if (langBtn) {
            langBtn.textContent = getLang() === 'vi' ? 'Tiếng Việt' : 'English';
            langBtn.addEventListener('click', () => {
                const current = getLang();
                setLang(current === 'vi' ? 'en' : 'vi');
                this.buildUI();
            });
            // Hover effect for language button
            langBtn.addEventListener('mouseenter', () => langBtn.style.background = 'rgba(255,255,255,0.2)');
            langBtn.addEventListener('mouseleave', () => langBtn.style.background = 'rgba(0,0,0,0.5)');
        }

        container.querySelector('#mode-free')?.addEventListener('click', () => {
            if (this.onStart) {
                this.stop();
                this.onStart(MapPreset.Grasslands, CivilizationType.LaMa, [], true, '');
            }
        });

        // Guide screen
        container.querySelector('#mode-guide')?.addEventListener('click', () => {
            const guide = new GuideUI(() => {
                // Return to main menu (already visible beneath the overlay, nothing strictly needed)
            });
            guide.show();
        });
    }

    // ===================== AI SETUP VIEW =====================
    private showAISetup(): void {
        if (!this.container) return;

        this.container.innerHTML = getAiSetupTemplate();

        // Back button
        this.container.querySelector('#mm-btn-back')?.addEventListener('click', () => {
            this.buildUI();
        });

        // Close color picker on outside click
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.zen-color-dot') && !target.closest('.zen-color-picker')) {
                if (this.colorPickerSlotIndex >= 0) {
                    this.colorPickerSlotIndex = -1;
                    this.renderSlots();
                }
            }
        });

        this.renderMapCards();
        this.renderSlots();
        this.renderActions();
    }

    // ===================== RENDER MAP SELECT =====================
    private renderMapCards(): void {
        const select = document.getElementById('mm-map-select') as HTMLSelectElement;
        if (!select) return;
        select.innerHTML = '';

        for (let i = 0; i < MAP_LIST.length; i++) {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = MAP_LIST[i].name;
            if (i === this.selectedMapIndex) opt.selected = true;
            select.appendChild(opt);
        }

        select.onchange = () => {
            this.selectedMapIndex = parseInt(select.value);
            this.updateMapPreview();
            this.updateSummary();
        };

        this.updateMapPreview();
    }

    private updateMapPreview(): void {
        const wrap = document.getElementById('zen-map-preview-wrap');
        if (!wrap) return;
        wrap.innerHTML = '';
        const preview = this.previewCanvases[this.selectedMapIndex].cloneNode(true) as HTMLCanvasElement;
        const pctx = preview.getContext('2d')!;
        pctx.drawImage(this.previewCanvases[this.selectedMapIndex], 0, 0);
        wrap.appendChild(preview);
    }

    // ===================== RENDER SLOTS =====================
    private renderSlots(): void {
        const slotsEl = document.getElementById('mm-slots');
        const addRow = document.getElementById('mm-add-row');
        if (!slotsEl || !addRow) return;
        slotsEl.innerHTML = '';

        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            const row = document.createElement('div');
            row.className = 'zen-slot-row';

            // Color dot
            const dotWrapper = document.createElement('div');
            dotWrapper.style.position = 'relative';
            dotWrapper.style.flexShrink = '0';
            const dot = document.createElement('div');
            dot.className = 'zen-color-dot';
            dot.style.background = slot.color;
            dot.title = 'Change Color';
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.colorPickerSlotIndex = this.colorPickerSlotIndex === i ? -1 : i;
                this.renderSlots();
            });
            dotWrapper.appendChild(dot);

            if (this.colorPickerSlotIndex === i) {
                const picker = document.createElement('div');
                picker.className = 'zen-color-picker';
                for (let ci = 0; ci < TEAM_COLORS.length; ci++) {
                    const color = TEAM_COLORS[ci];
                    const opt = document.createElement('div');
                    opt.className = `zen-color-option${slot.color === color ? ' active' : ''}`;
                    opt.style.background = color;
                    opt.title = t(TEAM_NAME_KEYS[ci]);
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        slot.color = color;
                        this.colorPickerSlotIndex = -1;
                        this.renderSlots();
                    });
                    picker.appendChild(opt);
                }
                dotWrapper.appendChild(picker);
            }
            row.appendChild(dotWrapper);

            // Name
            const name = document.createElement('div');
            name.className = `zen-slot-name${slot.isHuman ? ' human' : ''}`;
            name.textContent = slot.isHuman ? `👤 ${slot.name}` : `🤖 ${slot.name}`;
            row.appendChild(name);

            // Team
            const teamBtn = document.createElement('button');
            teamBtn.className = `zen-field-btn team-${slot.team}${slot.isHuman ? ' disabled' : ''}`;
            teamBtn.style.width = '70px';
            teamBtn.textContent = slot.team === 1 ? 'TEAM 1' : 'TEAM 2';
            if (!slot.isHuman) {
                teamBtn.addEventListener('click', () => {
                    slot.team = slot.team === 1 ? 2 : 1;
                    this.renderSlots();
                    this.updateSummary();
                });
            }
            row.appendChild(teamBtn);

            // Civ
            const civData = slot.civIndex >= 0 ? CIVILIZATION_DATA[CIV_LIST[slot.civIndex]] : null;
            const civBtn = document.createElement('button');
            civBtn.className = 'zen-field-btn';
            civBtn.style.width = '120px';
            civBtn.style.color = civData?.accentColor ?? '#d4d4d8';
            civBtn.textContent = civData ? `${civData.icon} ${civData.name}` : t('menu.random');
            civBtn.addEventListener('click', () => {
                if (slot.isHuman) {
                    slot.civIndex = (slot.civIndex + 1) % CIV_LIST.length;
                } else {
                    slot.civIndex++;
                    if (slot.civIndex >= CIV_LIST.length) slot.civIndex = -1;
                }
                this.renderSlots();
                this.updateSummary();
            });
            row.appendChild(civBtn);

            // Difficulty
            const diffBtn = document.createElement('button');
            diffBtn.className = `zen-field-btn${slot.isHuman ? ' disabled' : ''}`;
            diffBtn.style.width = '70px';
            if (!slot.isHuman) {
                const diffColor = DIFF_COLORS[slot.difficulty];
                diffBtn.style.color = diffColor;
                diffBtn.textContent = AI_DIFFICULTY_NAMES[slot.difficulty];
                diffBtn.addEventListener('click', () => {
                    const idx = DIFFICULTIES.indexOf(slot.difficulty);
                    slot.difficulty = DIFFICULTIES[(idx + 1) % DIFFICULTIES.length];
                    this.renderSlots();
                });
            } else {
                diffBtn.style.color = '#71717a';
                diffBtn.textContent = '—';
            }
            row.appendChild(diffBtn);

            // Close
            if (!slot.isHuman) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'zen-close-btn';
                closeBtn.textContent = '✕';
                closeBtn.addEventListener('click', () => {
                    this.slots.splice(i, 1);
                    this.updateSlotColors();
                    this.renderSlots();
                    this.updateSummary();
                });
                row.appendChild(closeBtn);
            } else {
                const spacer = document.createElement('div');
                spacer.style.width = '24px';
                spacer.style.flexShrink = '0';
                row.appendChild(spacer);
            }

            slotsEl.appendChild(row);
        }

        // Add AI
        addRow.innerHTML = '';
        if (this.slots.length < 8) {
            const addBtn = document.createElement('button');
            addBtn.className = 'zen-add-btn';
            addBtn.textContent = t('menu.addAI');
            addBtn.addEventListener('click', () => {
                const newIndex = this.slots.length;
                this.slots.push({
                    isHuman: false, team: 2, civIndex: -1,
                    difficulty: AIDifficulty.Normal,
                    color: TEAM_COLORS[newIndex % TEAM_COLORS.length],
                    name: `AI ${newIndex}`,
                });
                this.updateSlotColors();
                this.renderSlots();
                this.updateSummary();
            });
            addRow.appendChild(addBtn);
        }
    }

    // ===================== RENDER ACTIONS =====================
    private renderActions(): void {
        const startBtn = document.getElementById('mm-btn-start');
        if (startBtn) {
            startBtn.onclick = () => {
                const hasEnemy = this.slots.some(s => !s.isHuman && s.team === 2);
                if (!hasEnemy || !this.onStart) return;

                const playerSlot = this.slots[0];
                const playerCiv = CIV_LIST[playerSlot.civIndex] ?? CivilizationType.LaMa;
                const aiSlots = this.slots.filter(s => !s.isHuman);
                const aiConfigs: AISlotConfig[] = aiSlots.map(s => ({
                    team: s.team,
                    civ: s.civIndex >= 0 ? CIV_LIST[s.civIndex] : null,
                    difficulty: s.difficulty,
                    color: s.color,
                }));

                this.stop();
                this.onStart(MAP_LIST[this.selectedMapIndex].preset, playerCiv, aiConfigs, false, playerSlot.color);
            };
        }

        this.updateSummary();
    }

    private updateSummary(): void {
        const summary = document.getElementById('mm-summary');
        const startBtn = document.getElementById('mm-btn-start');
        if (!summary || !startBtn) return;

        const hasEnemy = this.slots.some(s => !s.isHuman && s.team === 2);
        const allies = this.slots.filter(s => !s.isHuman && s.team === 1).length;
        const enemies = this.slots.filter(s => !s.isHuman && s.team === 2).length;
        const playerSlot = this.slots[0];
        const civData = CIVILIZATION_DATA[CIV_LIST[playerSlot.civIndex] ?? CivilizationType.LaMa];

        if (!hasEnemy) {
            summary.className = 'zen-summary error';
            summary.textContent = `${t('menu.needEnemy')}`;
            startBtn.classList.add('disabled');
        } else {
            summary.className = 'zen-summary';
            summary.textContent = `${MAP_LIST[this.selectedMapIndex].name} • ${civData.icon} ${civData.name} • ${enemies} ${t('menu.enemies')} • ${allies} ${t('menu.allies')}`;
            startBtn.classList.remove('disabled');
        }
    }

    // ===================== HELPERS =====================
    private darkenColor(hex: string, factor: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
    }

    // ===================== MULTIPLAYER LOBBY =====================
    private showMultiplayerLobby(): void {
        if (this.multiplayerLobbyUI) this.multiplayerLobbyUI.destroy();

        this.multiplayerLobbyUI = new MultiplayerLobbyUI({
            onGameStart: (room, players, seed, myPlayerId, myTeam, lobby) => {
                if (this.onMultiplayerStart) {
                    this.stop();
                    this.onMultiplayerStart(room, players, seed, myPlayerId, myTeam, lobby);
                }
            },
            onClose: () => {
                this.multiplayerLobbyUI = null;
            },
            getSelectedMapPreset: () => MAP_LIST[this.selectedMapIndex].preset,
            getPreviewCanvas: (idx) => this.previewCanvases[idx] || null,
        });

        this.multiplayerLobbyUI.show();
    }

}
