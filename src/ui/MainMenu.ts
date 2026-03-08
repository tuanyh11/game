// ============================================================
//  MainMenu — Warcraft III-style Lobby with Stone Frame UI
// ============================================================

import { MAP_LIST, MapPreset, TileMap } from "../map/TileMap";
import { C, TerrainType, CivilizationType, CIVILIZATION_DATA } from "../config/GameConfig";
import { AIDifficulty, AI_DIFFICULTY_NAMES } from "../systems/AIController";
import { AISlotConfig } from "../core/Game";

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
const TEAM_NAMES = [
    'Xanh dương', 'Đỏ', 'Lục lam', 'Tím',
    'Vàng', 'Xanh lá', 'Cam', 'Tím nhạt',
    'Hồng', 'Xanh ngọc', 'Tím than', 'Vàng chanh',
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
    private stopped = false;
    private container: HTMLDivElement | null = null;
    private previewCanvases: HTMLCanvasElement[] = [];
    private colorPickerSlotIndex = -1;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvas.style.display = 'none';

        this.slots = [
            { isHuman: true, team: 1, civIndex: 3, difficulty: AIDifficulty.Normal, color: TEAM_COLORS[0], name: 'Bạn' },
            { isHuman: false, team: 1, civIndex: -1, difficulty: AIDifficulty.Normal, color: TEAM_COLORS[1], name: 'Đồng minh' },
            { isHuman: false, team: 2, civIndex: -1, difficulty: AIDifficulty.Normal, color: TEAM_COLORS[2], name: 'Kẻ địch 1' },
            { isHuman: false, team: 2, civIndex: -1, difficulty: AIDifficulty.Hard, color: TEAM_COLORS[3], name: 'Kẻ địch 2' },
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
            if (!this.slots[i].isHuman) this.slots[i].name = `Máy ${i}`;
        }
    }

    // ===================== BUILD HTML UI =====================
    private buildUI(): void {
        if (this.container) this.container.remove();

        const container = document.createElement('div');
        container.id = 'main-menu';
        this.container = container;

        this.injectStyles();

        container.innerHTML = `
            <div class="wc-bg">
                <div class="wc-ambient"></div>
                <div class="wc-vignette"></div>

                <div class="wc-frame">
                    <!-- Top bar with rivets -->
                    <div class="wc-frame-top">
                        <div class="wc-rivet"></div>
                        <div class="wc-frame-title-bar">
                            <div class="wc-emblem">⚔</div>
                            <h1 class="wc-title">PIXEL EMPIRES</h1>
                            <div class="wc-emblem">⚔</div>
                        </div>
                        <div class="wc-rivet"></div>
                    </div>

                    <!-- Main content area -->
                    <div class="wc-body">
                        <!-- Map selection row -->
                        <div class="wc-map-row">
                            <div class="wc-map-preview-wrap" id="wc-map-preview-wrap"></div>
                            <div class="wc-map-select-wrap">
                                <label class="wc-map-label">🗺 BẢN ĐỒ</label>
                                <select class="wc-map-select" id="mm-map-select"></select>
                            </div>
                        </div>

                        <!-- Players panel -->
                        <div class="wc-panel">
                            <div class="wc-panel-header">
                                <span class="wc-panel-icon">👥</span> NGƯỜI CHƠI
                            </div>
                            <div class="wc-panel-content">
                                <div class="wc-slot-header">
                                    <span class="wc-col" style="width:24px">Màu</span>
                                    <span class="wc-col" style="flex:1">Tên</span>
                                    <span class="wc-col" style="width:70px">Phe</span>
                                    <span class="wc-col" style="width:120px">Văn minh</span>
                                    <span class="wc-col" style="width:70px">Độ khó</span>
                                    <span class="wc-col" style="width:24px"></span>
                                </div>
                                <div class="wc-slots" id="mm-slots"></div>
                                <div class="wc-add-row" id="mm-add-row"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom bar with actions -->
                    <div class="wc-frame-bottom">
                        <button class="wc-btn wc-btn-secondary" id="mm-btn-free">
                            <span class="wc-btn-icon">🎮</span> CHẾ ĐỘ TỰ DO
                        </button>
                        <div class="wc-summary" id="mm-summary"></div>
                        <button class="wc-btn wc-btn-primary" id="mm-btn-start">
                            <span class="wc-btn-shine"></span>
                            <span class="wc-btn-icon">⚔️</span> BẮT ĐẦU
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.wc-color-dot') && !target.closest('.wc-color-picker')) {
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

    // ===================== STYLES =====================
    private injectStyles(): void {
        if (document.getElementById('mm-styles')) return;
        const style = document.createElement('style');
        style.id = 'mm-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

            #main-menu {
                position: fixed; inset: 0; z-index: 9999;
                font-family: 'Inter', 'Segoe UI', sans-serif;
            }

            /* ===== BACKGROUND ===== */
            .wc-bg {
                width: 100%; height: 100%;
                background: #080c14;
                background-image:
                    radial-gradient(ellipse at 30% 20%, rgba(20,40,80,0.4) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, rgba(60,20,10,0.3) 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 50%, rgba(10,15,25,0.8) 0%, transparent 80%);
                display: flex; align-items: center; justify-content: center;
                overflow: hidden; position: relative;
            }
            .wc-ambient {
                position: absolute; inset: 0; pointer-events: none;
                background: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E") repeat;
                opacity: 0.5;
            }
            .wc-vignette {
                position: absolute; inset: 0; pointer-events: none;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);
            }

            /* ===== MAIN FRAME (Warcraft stone frame) ===== */
            .wc-frame {
                width: 92vw; max-width: 620px;
                max-height: 94vh;
                display: flex; flex-direction: column;
                background: linear-gradient(180deg, #141820 0%, #0e1218 50%, #0a0e14 100%);
                border: 3px solid #3a3228;
                border-radius: 6px;
                box-shadow:
                    0 0 0 1px #1a1814,
                    0 0 0 4px #2a2520,
                    0 0 40px rgba(0,0,0,0.8),
                    inset 0 1px 0 rgba(255,255,255,0.03);
                position: relative; z-index: 1;
                overflow: hidden;
            }

            /* ===== TOP BAR ===== */
            .wc-frame-top {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 12px;
                background: linear-gradient(180deg, #2a2418 0%, #1e1a14 100%);
                border-bottom: 2px solid #3a3228;
                position: relative;
            }
            .wc-frame-top::after {
                content: '';
                position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
                background: linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent);
            }
            .wc-rivet {
                width: 14px; height: 14px; border-radius: 50%;
                background: radial-gradient(circle at 40% 35%, #6a5a40, #3a3020);
                border: 1px solid #2a2218;
                box-shadow: inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.5);
                flex-shrink: 0;
            }
            .wc-frame-title-bar {
                display: flex; align-items: center; gap: 12px;
                flex: 1; justify-content: center;
            }
            .wc-emblem {
                font-size: 18px;
                filter: drop-shadow(0 0 4px rgba(201,168,76,0.4));
                animation: wc-emblem-pulse 3s ease-in-out infinite;
            }
            @keyframes wc-emblem-pulse {
                0%, 100% { filter: drop-shadow(0 0 4px rgba(201,168,76,0.3)); }
                50% { filter: drop-shadow(0 0 10px rgba(201,168,76,0.6)); }
            }
            .wc-title {
                font-family: 'Cinzel', 'MedievalSharp', serif;
                font-size: 22px; font-weight: 900;
                color: transparent;
                background: linear-gradient(180deg, #f0d878 0%, #c9a84c 40%, #a08030 100%);
                -webkit-background-clip: text; background-clip: text;
                text-shadow: none;
                letter-spacing: 4px;
                margin: 0;
                position: relative;
            }

            /* ===== BODY ===== */
            .wc-body {
                display: flex; flex-direction: column;
                flex: 1; overflow-y: auto;
                min-height: 0;
                padding: 8px;
                gap: 8px;
            }

            /* ===== MAP SELECT ROW ===== */
            .wc-map-row {
                display: flex; align-items: center; gap: 10px;
                background: rgba(8,10,16,0.7);
                border: 1px solid #2a2520;
                border-radius: 4px;
                padding: 8px 12px;
            }
            .wc-map-preview-wrap {
                width: 60px; height: 60px; flex-shrink: 0;
                border: 2px solid #3a3228;
                border-radius: 3px;
                overflow: hidden;
                box-shadow: 0 0 8px rgba(0,0,0,0.5);
            }
            .wc-map-preview-wrap canvas {
                width: 100%; height: 100%;
                display: block;
                image-rendering: pixelated;
            }
            .wc-map-select-wrap {
                flex: 1; display: flex; flex-direction: column; gap: 4px;
            }
            .wc-map-label {
                font-size: 9px; font-weight: 700;
                color: #9a8a6a;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            .wc-map-select {
                background: linear-gradient(180deg, #1a1816 0%, #0e0c0a 100%);
                border: 1px solid #3a3228;
                border-radius: 3px;
                color: #c9a84c;
                font-size: 13px; font-weight: 700;
                font-family: 'Inter', sans-serif;
                padding: 6px 10px;
                cursor: pointer;
                outline: none;
                appearance: none;
                -webkit-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='2' fill='none'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 10px center;
                padding-right: 30px;
                transition: all 0.15s;
            }
            .wc-map-select:hover {
                border-color: #c9a84c;
                box-shadow: 0 0 8px rgba(201,168,76,0.15);
            }
            .wc-map-select:focus {
                border-color: #c9a84c;
                box-shadow: 0 0 12px rgba(201,168,76,0.2);
            }
            .wc-map-select option {
                background: #141820;
                color: #c9a84c;
                padding: 6px;
            }

            /* ===== PANELS ===== */
            .wc-panel {
                display: flex; flex-direction: column;
                border: 1px solid #2a2520;
                border-radius: 4px;
                background: rgba(8,10,16,0.7);
                overflow: hidden;
            }

            .wc-panel-header {
                padding: 6px 10px;
                background: linear-gradient(180deg, #1e1a16 0%, #151210 100%);
                border-bottom: 1px solid #2a2520;
                font-size: 10px; font-weight: 700;
                color: #9a8a6a;
                letter-spacing: 2px;
                text-transform: uppercase;
                display: flex; align-items: center; gap: 6px;
            }
            .wc-panel-icon { font-size: 13px; }
            .wc-panel-content {
                padding: 8px;
                flex: 1; overflow-y: auto;
            }

            /* ===== PLAYER SLOTS ===== */
            .wc-slot-header {
                display: flex; align-items: center; gap: 4px;
                padding: 0 4px 4px;
                border-bottom: 1px solid #1a1820;
                margin-bottom: 2px;
            }
            .wc-col {
                font-size: 8px; font-weight: 700;
                color: #4a4438;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .wc-slots { display: flex; flex-direction: column; }

            .wc-slot-row {
                display: flex; align-items: center; gap: 4px;
                padding: 5px 4px;
                border-bottom: 1px solid rgba(30,28,24,0.5);
                transition: background 0.15s;
                border-radius: 2px;
            }
            .wc-slot-row:hover { background: rgba(201,168,76,0.03); }

            /* Color dot */
            .wc-color-dot {
                width: 18px; height: 18px;
                border-radius: 3px;
                border: 2px solid rgba(0,0,0,0.4);
                flex-shrink: 0;
                cursor: pointer;
                transition: all 0.15s;
                position: relative;
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.5);
            }
            .wc-color-dot:hover {
                transform: scale(1.15);
                border-color: #c9a84c;
            }

            /* Color picker */
            .wc-color-picker {
                position: absolute; top: 100%; left: 0; margin-top: 4px;
                background: #141820;
                border: 2px solid #3a3228;
                border-radius: 4px;
                padding: 6px;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px; z-index: 100;
                box-shadow: 0 6px 24px rgba(0,0,0,0.7);
                animation: wc-pop 0.12s ease-out;
            }
            @keyframes wc-pop {
                from { opacity: 0; transform: translateY(-4px) scale(0.9); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .wc-color-option {
                width: 22px; height: 22px;
                border-radius: 3px;
                border: 2px solid transparent;
                cursor: pointer;
                transition: all 0.1s;
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.3);
            }
            .wc-color-option:hover { transform: scale(1.2); border-color: #fff; }
            .wc-color-option.active {
                border-color: #c9a84c;
                box-shadow: 0 0 8px rgba(201,168,76,0.5);
            }

            /* Slot name */
            .wc-slot-name {
                flex: 1; font-size: 11px;
                color: #7a7060;
                white-space: nowrap; overflow: hidden;
                text-overflow: ellipsis;
            }
            .wc-slot-name.human { color: #c9a84c; font-weight: 700; }

            /* Field buttons (Wc3 stone button style) */
            .wc-field-btn {
                border: 1px solid #2a2520;
                border-radius: 3px;
                background: linear-gradient(180deg, #1a1816 0%, #0e0c0a 100%);
                padding: 3px 6px;
                font-size: 10px; font-weight: 600;
                font-family: 'Inter', sans-serif;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s;
                user-select: none;
                white-space: nowrap;
                position: relative;
            }
            .wc-field-btn::before {
                content: '';
                position: absolute; top: 0; left: 0; right: 0; height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
            }
            .wc-field-btn:hover {
                background: linear-gradient(180deg, #222018 0%, #161412 100%);
                border-color: #4a4030;
            }
            .wc-field-btn:active { transform: scale(0.97); }
            .wc-field-btn.disabled {
                cursor: default; opacity: 0.4;
            }
            .wc-field-btn.disabled:hover {
                transform: none;
                background: linear-gradient(180deg, #1a1816 0%, #0e0c0a 100%);
                border-color: #2a2520;
            }

            .wc-field-btn.team-1 { color: #6699ff; border-color: rgba(68,136,255,0.2); }
            .wc-field-btn.team-1:hover { border-color: #4488ff; }
            .wc-field-btn.team-2 { color: #ff6666; border-color: rgba(221,68,68,0.2); }
            .wc-field-btn.team-2:hover { border-color: #dd4444; }

            /* Close button */
            .wc-close-btn {
                width: 20px; height: 20px;
                border: 1px solid #332020;
                border-radius: 3px;
                background: linear-gradient(180deg, #1a1210 0%, #0e0a08 100%);
                color: #664444;
                font-size: 10px; font-weight: 700;
                font-family: 'Inter', sans-serif;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.15s;
                flex-shrink: 0;
            }
            .wc-close-btn:hover {
                background: linear-gradient(180deg, #2a1515 0%, #1a0e0e 100%);
                border-color: #aa3333;
                color: #ff4444;
            }

            /* Add AI */
            .wc-add-row { text-align: center; padding-top: 6px; }
            .wc-add-btn {
                background: linear-gradient(180deg, #141a14 0%, #0a0e0a 100%);
                border: 1px solid #2a4a2a;
                border-radius: 3px;
                color: #4a8a4a;
                font-size: 10px; font-weight: 700;
                font-family: 'Inter', sans-serif;
                padding: 4px 16px;
                cursor: pointer;
                transition: all 0.15s;
            }
            .wc-add-btn:hover {
                border-color: #44aa44;
                color: #66cc66;
                box-shadow: 0 0 8px rgba(68,170,68,0.15);
            }

            /* ===== BOTTOM BAR ===== */
            .wc-frame-bottom {
                display: flex; align-items: center; justify-content: space-between;
                padding: 10px 14px;
                background: linear-gradient(180deg, #1e1a14 0%, #2a2418 100%);
                border-top: 2px solid #3a3228;
                gap: 10px;
                position: relative;
            }
            .wc-frame-bottom::before {
                content: '';
                position: absolute; top: 0; left: 0; right: 0; height: 1px;
                background: linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent);
            }

            .wc-summary {
                flex: 1; text-align: center;
                font-size: 10px; color: #6a6050;
                letter-spacing: 0.5px;
            }
            .wc-summary.error { color: #cc4444; }

            /* ===== BUTTONS (Wc3 metal buttons) ===== */
            .wc-btn {
                border: 2px solid #3a3228;
                border-radius: 4px;
                padding: 8px 20px;
                font-size: 12px; font-weight: 700;
                font-family: 'Cinzel', 'MedievalSharp', serif;
                cursor: pointer;
                transition: all 0.2s;
                letter-spacing: 1px;
                position: relative; overflow: hidden;
                text-transform: uppercase;
            }
            .wc-btn-primary {
                background: linear-gradient(180deg, #3a3020 0%, #2a2418 40%, #1e1a14 100%);
                border-color: #c9a84c;
                color: #f0d878;
                padding: 10px 32px;
                font-size: 14px;
                box-shadow: 0 0 15px rgba(201,168,76,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
                animation: wc-glow 3s ease-in-out infinite;
            }
            .wc-btn-shine {
                position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
                animation: wc-shine 4s ease-in-out infinite;
            }
            @keyframes wc-shine {
                0%, 100% { left: -100%; }
                50% { left: 150%; }
            }
            @keyframes wc-glow {
                0%, 100% { box-shadow: 0 0 12px rgba(201,168,76,0.12); }
                50% { box-shadow: 0 0 25px rgba(201,168,76,0.25); }
            }
            .wc-btn-primary:hover {
                background: linear-gradient(180deg, #4a4030 0%, #3a3020 40%, #2a2418 100%);
                box-shadow: 0 0 30px rgba(201,168,76,0.35);
                transform: scale(1.03);
            }
            .wc-btn-primary:active { transform: scale(0.98); }
            .wc-btn-primary.disabled {
                border-color: #2a2520;
                color: #4a4030;
                box-shadow: none; animation: none;
                cursor: not-allowed;
            }

            .wc-btn-secondary {
                background: linear-gradient(180deg, #141820 0%, #0e1218 100%);
                border-color: #2a3a5a;
                color: #5588bb;
                font-size: 10px;
                padding: 6px 16px;
                font-family: 'Inter', sans-serif;
            }
            .wc-btn-secondary:hover {
                border-color: #4488cc;
                color: #66aadd;
                box-shadow: 0 0 10px rgba(68,136,204,0.15);
            }

            .wc-btn-icon { margin-right: 4px; }

            /* ===== RESPONSIVE ===== */
            @media (max-width: 680px) {
                .wc-slot-header { display: none; }
                .wc-slot-row { flex-wrap: wrap; gap: 3px; }
                .wc-frame { max-height: 98vh; }
                .wc-title { font-size: 18px; letter-spacing: 2px; }
                .wc-map-row { flex-direction: column; align-items: stretch; }
                .wc-map-preview-wrap { width: 100%; height: 80px; }
            }
        `;
        document.head.appendChild(style);
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
        const wrap = document.getElementById('wc-map-preview-wrap');
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
            row.className = 'wc-slot-row';

            // Color dot
            const dotWrapper = document.createElement('div');
            dotWrapper.style.position = 'relative';
            dotWrapper.style.flexShrink = '0';
            const dot = document.createElement('div');
            dot.className = 'wc-color-dot';
            dot.style.background = `linear-gradient(135deg, ${slot.color}, ${this.darkenColor(slot.color, 0.6)})`;
            dot.title = 'Nhấn để đổi màu';
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.colorPickerSlotIndex = this.colorPickerSlotIndex === i ? -1 : i;
                this.renderSlots();
            });
            dotWrapper.appendChild(dot);

            if (this.colorPickerSlotIndex === i) {
                const picker = document.createElement('div');
                picker.className = 'wc-color-picker';
                for (let ci = 0; ci < TEAM_COLORS.length; ci++) {
                    const color = TEAM_COLORS[ci];
                    const opt = document.createElement('div');
                    opt.className = `wc-color-option${slot.color === color ? ' active' : ''}`;
                    opt.style.background = `linear-gradient(135deg, ${color}, ${this.darkenColor(color, 0.6)})`;
                    opt.title = TEAM_NAMES[ci];
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
            name.className = `wc-slot-name${slot.isHuman ? ' human' : ''}`;
            name.textContent = slot.isHuman ? `👤 ${slot.name}` : `🤖 ${slot.name}`;
            row.appendChild(name);

            // Team
            const teamBtn = document.createElement('button');
            teamBtn.className = `wc-field-btn team-${slot.team}${slot.isHuman ? ' disabled' : ''}`;
            teamBtn.style.width = '70px';
            teamBtn.textContent = slot.team === 1 ? '🤝 Phe 1' : '⚔ Phe 2';
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
            civBtn.className = 'wc-field-btn';
            civBtn.style.width = '120px';
            civBtn.style.color = civData?.accentColor ?? '#666';
            civBtn.textContent = civData ? `${civData.icon} ${civData.name}` : '🎲 Ngẫu nhiên';
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
            diffBtn.className = `wc-field-btn${slot.isHuman ? ' disabled' : ''}`;
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
                diffBtn.style.color = '#2a2520';
                diffBtn.textContent = '—';
            }
            row.appendChild(diffBtn);

            // Close
            if (!slot.isHuman) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'wc-close-btn';
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
            addBtn.className = 'wc-add-btn';
            addBtn.textContent = '+ THÊM MÁY';
            addBtn.addEventListener('click', () => {
                const newIndex = this.slots.length;
                this.slots.push({
                    isHuman: false, team: 2, civIndex: -1,
                    difficulty: AIDifficulty.Normal,
                    color: TEAM_COLORS[newIndex % TEAM_COLORS.length],
                    name: `Máy ${newIndex}`,
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
        const freeBtn = document.getElementById('mm-btn-free');
        if (freeBtn) {
            freeBtn.onclick = () => {
                if (this.onStart) {
                    this.stop();
                    this.onStart(MapPreset.Grasslands, CivilizationType.LaMa, [], true, '');
                }
            };
        }

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
            summary.className = 'wc-summary error';
            summary.textContent = '⚠ Cần ít nhất 1 AI Phe 2 (địch)';
            startBtn.classList.add('disabled');
        } else {
            summary.className = 'wc-summary';
            summary.textContent = `${MAP_LIST[this.selectedMapIndex].name} • ${civData.icon} ${civData.name} • ${enemies} Địch • ${allies} Đồng minh`;
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
}
