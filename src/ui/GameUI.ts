// ============================================================
//  GameUI — Warcraft III-style interface
//
//  Layout:  [MINIMAP] [PORTRAIT + INFO] [COMMAND GRID]
//  Top:     Resource bar with gold/wood/stone/food icons
// ============================================================

import {
    C, TILE_SIZE, MAP_COLS, MAP_ROWS, BuildingType, BUILDING_DATA,
    UnitType, UNIT_DATA, ResourceType, AGE_NAMES, AGE_COSTS, UnitState,
    UpgradeType, UPGRADE_DATA, ResourceNodeType, GATHER_RATES,
    CIVILIZATION_DATA, CIV_UNIT_MODIFIERS, isCivElite, CIV_ELITE_UNIT, CivilizationType,
} from "../config/GameConfig";
import { PlayerState } from "../systems/PlayerState";
import { EntityManager } from "../systems/EntityManager";
import { SelectionSystem } from "../systems/SelectionSystem";
import { Camera } from "../core/Camera";
import { TileMap } from "../map/TileMap";
import { GameLoop } from "../core/GameLoop";
import { HERO_XP_TABLE } from "../entities/Unit";
import { renderCommandGrid as renderCommandGridFn } from "./panels/CommandGrid";
import { renderSpawnPalette as renderSpawnPaletteFn, renderFreePauseButton as renderFreePauseButtonFn, SPAWN_ITEMS, SpawnEntityType } from "./panels/SpawnPalette";
import { renderUnitPortrait as renderUnitPortraitFn, renderBuildingPortrait as renderBuildingPortraitFn, renderResourcePortrait as renderResourcePortraitFn, renderMultiUnitGrid as renderMultiUnitGridFn, getUnitSkillInfo } from "./panels/Portrait";
import { TradeUI } from "./TradeUI";

// ---- Action Button definition ----
interface ActionDef {
    label: string;
    hotkey?: string;
    cost?: string;
    action: () => void;
    enabled: boolean;
    tooltip?: string;
}

// ---- Registered clickable area ----
interface ClickArea {
    x: number; y: number; w: number; h: number;
    action: () => void;
}

export class GameUI {
    private clickAreas: ClickArea[] = [];
    private mouseX = 0;
    private mouseY = 0;

    /** True when there's at least one unit, building, or resource selected */
    private get hasSelection(): boolean {
        return this.selectionSystem.selectedUnits.length > 0
            || this.selectionSystem.selectedBuilding !== null
            || this.selectionSystem.selectedResource !== null;
    }

    // Layout
    readonly topBarH = 36;
    readonly bottomPanelH = 180;
    readonly bottomPanelW = 650;
    readonly minimapSize = 180;
    private borderWidth = 4;

    // Settings-driven flags
    showFPS = true;
    showUI = true;

    // Free Mode spawn palette
    freeSpawnUnit: SpawnEntityType | null = null;
    freeSpawnCategory: 'unit' | 'building' | 'resource' = 'unit';
    freeSpawnCiv: CivilizationType = CivilizationType.LaMa;
    freeSpawnAge: number = 4;
    freeSpawnTeam: number = 0; // 0 = player, 2 = enemy
    freePlacementPhase = false; // true during placement, before battle starts
    onStartBattle: (() => void) | null = null;
    onPauseGame: (() => void) | null = null;
    onResetMap: (() => void) | null = null;
    // Drag-to-paint state
    private freeDragging = false;
    private freeLastSpawnX = 0;
    private freeLastSpawnY = 0;
    // Ghost preview position (world coords)
    private freeGhostX = 0;
    private freeGhostY = 0;
    private freeGhostVisible = false;

    // Trade system state
    private tradeUI: TradeUI;

    // Game reference for state
    public game: import('../core/Game').Game | null = null;

    // Command Grid Hotkeys Active
    private hotkeyActions: Record<string, () => void> = {};

    constructor(
        private canvas: HTMLCanvasElement,
        private camera: Camera,
        private playerState: PlayerState,
        private entityManager: EntityManager,
        private selectionSystem: SelectionSystem,
        private tileMap: TileMap,
        private loop: GameLoop,
        private freeMode: boolean = false,
    ) {
        this.tradeUI = new TradeUI(playerState, entityManager, (team) => this.game?.aiStates[team]);

        // Initialize camera and selection bounds
        this.camera.setBottomMargin(this.bottomPanelH);
        this.selectionSystem.uiBottomHeight = this.bottomPanelH;

        // Register Selection System hotkeys to fire active panel buttons
        this.selectionSystem.setHotkeyCallback((key: string) => {
            if (this.hotkeyActions[key]) {
                this.hotkeyActions[key]();
            }
        });

        canvas.addEventListener('click', (e) => this.handleClick(e));
        // mousemove is handled below with ghost preview logic
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.handleMinimapClick(e);

            // Free Mode: cancel spawn selection on right/middle click
            if (this.freeMode && this.freePlacementPhase && (e.button === 2 || e.button === 1)) {
                this.freeSpawnUnit = null;
                return;
            }

            // Free Mode: spawn units during placement phase
            if (this.freeMode && this.freePlacementPhase && e.button === 0 && this.freeSpawnUnit) {
                // Don't spawn on UI areas
                if (e.clientY <= this.topBarH || e.clientX >= this.camera.viewportWidth - 180) return;
                if (e.clientY >= this.camera.viewportHeight - this.bottomPanelH && this.hasSelection) return;
                if (e.ctrlKey) {
                    // Ctrl+mousedown: start drag-painting
                    this.freeDragging = true;
                    this.handleFreeSpawn(e);
                    this.freeLastSpawnX = e.clientX;
                    this.freeLastSpawnY = e.clientY;
                } else {
                    // Normal click: spawn one
                    this.handleFreeSpawn(e);
                }
                e.stopPropagation();
            }
        });
        canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            // Ghost preview update
            if (this.freeMode && this.freePlacementPhase && this.freeSpawnUnit) {
                const world = this.camera.screenToWorld(e.clientX, e.clientY);
                this.freeGhostX = world.x;
                this.freeGhostY = world.y;
                this.freeGhostVisible = e.clientY > this.topBarH && e.clientX < this.camera.viewportWidth - 180;
            } else {
                this.freeGhostVisible = false;
            }
            // Ctrl+drag painting
            if (this.freeDragging && e.ctrlKey && this.freeSpawnUnit) {
                const dx = e.clientX - this.freeLastSpawnX;
                const dy = e.clientY - this.freeLastSpawnY;
                if (dx * dx + dy * dy >= 20 * 20) { // spawn every 20px
                    this.handleFreeSpawn(e);
                    this.freeLastSpawnX = e.clientX;
                    this.freeLastSpawnY = e.clientY;
                }
            }
        });
        canvas.addEventListener('mouseup', () => {
            this.freeDragging = false;
        });

        // Prevent context menu to allow clean right-clicks
        canvas.addEventListener('contextmenu', (e) => {
            if (this.freeMode && this.freePlacementPhase && this.freeSpawnUnit) {
                e.preventDefault();
            }
        });

        // Toggle UI Hotkey ('Tab')
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleUI();
            }
        });
    }

    private toggleUI(): void {
        this.showUI = !this.showUI;
        const newMargin = this.showUI ? this.bottomPanelH : 0;
        this.camera.setBottomMargin(newMargin);
        this.selectionSystem.uiBottomHeight = newMargin;
    }

    private handleClick(e: MouseEvent): void {
        // Intercept Game Over screen clicks
        if (this.game && this.game.gameState !== 'playing') {
            const w = this.camera.viewportWidth;
            const h = this.camera.viewportHeight;

            const btnW = 200;
            const btnH = 50;
            const btnX = w / 2 - btnW / 2;
            const btnY = h / 2 + 60;

            if (e.clientX >= btnX && e.clientX <= btnX + btnW &&
                e.clientY >= btnY && e.clientY <= btnY + btnH) {
                this.game.exitToMenu();
            }
            return;
        }

        for (const area of this.clickAreas) {
            if (e.clientX >= area.x && e.clientX <= area.x + area.w &&
                e.clientY >= area.y && e.clientY <= area.y + area.h) {
                area.action();
                return;
            }
        }
    }

    private handleMinimapClick(e: MouseEvent): void {
        const mmX = this.borderWidth + 8;
        const mmY = this.camera.viewportHeight - this.bottomPanelH + 10;
        const mmS = this.minimapSize - 16;
        if (e.clientX >= mmX && e.clientX <= mmX + mmS &&
            e.clientY >= mmY && e.clientY <= mmY + mmS) {
            this.camera.x = ((e.clientX - mmX) / mmS) * MAP_COLS * TILE_SIZE - this.camera.viewportWidth / 2;
            this.camera.y = ((e.clientY - mmY) / mmS) * MAP_ROWS * TILE_SIZE - this.camera.viewportHeight / 2;
        }
    }

    /** Check if screen coordinate is inside the minimap area */
    isInMinimap(sx: number, sy: number): boolean {
        const mmX = this.borderWidth + 8;
        const mmY = this.camera.viewportHeight - this.bottomPanelH + 10;
        const mmS = this.minimapSize - 16;
        return sx >= mmX && sx <= mmX + mmS && sy >= mmY && sy <= mmY + mmS;
    }

    /** Convert screen coordinate (on minimap) to world coordinate */
    minimapToWorld(sx: number, sy: number): { x: number; y: number } {
        const mmX = this.borderWidth + 8;
        const mmY = this.camera.viewportHeight - this.bottomPanelH + 10;
        const mmS = this.minimapSize - 16;
        return {
            x: ((sx - mmX) / mmS) * MAP_COLS * TILE_SIZE,
            y: ((sy - mmY) / mmS) * MAP_ROWS * TILE_SIZE,
        };
    }

    private isHovered(x: number, y: number, w: number, h: number): boolean {
        return this.mouseX >= x && this.mouseX <= x + w && this.mouseY >= y && this.mouseY <= y + h;
    }

    /** Free Mode: Spawn unit at click position */
    private handleFreeSpawn(e: MouseEvent): void {
        if (!this.freeSpawnUnit) return;
        // Don't spawn if clicking on UI areas
        if (e.clientY <= this.topBarH) return;
        if (e.clientY >= this.camera.viewportHeight - this.bottomPanelH && this.hasSelection) return;
        // Don't spawn if clicking the spawn palette area (right side)
        if (e.clientX >= this.camera.viewportWidth - 180) return;

        const world = this.camera.screenToWorld(e.clientX, e.clientY);

        const spawnDef = SPAWN_ITEMS.find(item => item.type === this.freeSpawnUnit);
        if (!spawnDef) return;

        if (spawnDef.entityCategory === 'unit') {
            this.entityManager.spawnUnitFree(this.freeSpawnUnit as UnitType, world.x, world.y, this.freeSpawnTeam, this.freeSpawnCiv, this.freeSpawnAge);
        } else if (spawnDef.entityCategory === 'building') {
            // Free mode: snap to tile grid
            const [tx, ty] = this.tileMap.worldToTile(world.x, world.y);
            this.entityManager.spawnBuilding(this.freeSpawnUnit as BuildingType, tx, ty, this.freeSpawnTeam, true, this.freeSpawnCiv, this.freeSpawnAge);
        } else if (spawnDef.entityCategory === 'resource') {
            // Spawn some nominal amount for free mode testing
            let amount = 500;
            if (this.freeSpawnUnit === ResourceNodeType.Tree) amount = 150;
            this.entityManager.spawnResource(this.freeSpawnUnit as ResourceNodeType, world.x, world.y, amount);
        }
    }

    // ==================================================================
    //  RENDER
    // ==================================================================
    render(ctx: CanvasRenderingContext2D): void {
        this.clickAreas = [];
        this.hotkeyActions = {};
        const vpW = this.camera.viewportWidth;
        const vpH = this.camera.viewportHeight;

        this.renderTopBar(ctx, vpW);
        this.renderControlGroups(ctx, vpW);

        if (this.showUI) {
            // Render bottom panel FIRST (background), then minimap on top
            if (this.hasSelection) {
                this.renderBottomPanel(ctx, vpW, vpH);
            }

            // Always render minimap (floats in bottom-left, on top of panel)
            this.renderMinimap(ctx, vpH);

            // Portrait + command grid on top of everything
            if (this.hasSelection) {
                this.renderPortrait(ctx, vpH);
                this.renderCommandGrid(ctx, vpW, vpH);
            }
        }

        // Free Mode spawn palette (only during placement phase)
        if (this.freeMode && this.freePlacementPhase) {
            this.renderSpawnPalette(ctx, vpW, vpH);
        }

        // Free Mode: Pause/Play toggle button (always visible after first battle start)
        if (this.freeMode && !this.freePlacementPhase) {
            this.renderFreePauseButton(ctx, vpW);
        }

        // Free Mode: Ghost preview at cursor
        if (this.freeMode && this.freePlacementPhase && this.freeGhostVisible && this.freeSpawnUnit) {
            this.renderGhostPreview(ctx);
        }

        // Game Over / Victory screen overlay
        if (this.game && this.game.gameState !== 'playing') {
            this.renderGameOverScreen(ctx);
        }
    }


    /** Render ghost unit shadow at cursor position */
    private renderGhostPreview(ctx: CanvasRenderingContext2D): void {
        const screenPos = this.camera.worldToScreen(this.freeGhostX, this.freeGhostY);
        const sx = screenPos.x, sy = screenPos.y;
        const isEnemy = this.freeSpawnTeam !== 0;
        const civData = CIVILIZATION_DATA[this.freeSpawnCiv];

        ctx.save();
        ctx.globalAlpha = 0.45;

        const spawnDef = SPAWN_ITEMS.find(item => item.type === this.freeSpawnUnit);
        if (!spawnDef) {
            ctx.restore();
            return;
        }

        if (spawnDef.entityCategory === 'unit') {
            // Unit ghost
            ctx.fillStyle = isEnemy ? '#cc3333' : civData.secondaryColor;
            ctx.beginPath();
            ctx.arc(sx, sy - 4, 8, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#e8b87a';
            ctx.beginPath();
            ctx.arc(sx, sy - 14, 5, 0, Math.PI * 2);
            ctx.fill();

            // Civ accent ring
            ctx.strokeStyle = isEnemy ? '#ff4444' : civData.accentColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy - 4, 12, 0, Math.PI * 2);
            ctx.stroke();

            // Unit name label
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#fff';
            ctx.font = "bold 9px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            const ud = UNIT_DATA[this.freeSpawnUnit as UnitType];
            ctx.fillText(ud.name, sx, sy + 14);
        } else if (spawnDef.entityCategory === 'building') {
            // Building ghost
            const bd = BUILDING_DATA[this.freeSpawnUnit as BuildingType];
            const bw = bd.size[0] * TILE_SIZE;
            const bh = bd.size[1] * TILE_SIZE;

            // Snap to grid
            const [tx, ty] = this.tileMap.worldToTile(this.freeGhostX, this.freeGhostY);
            const snappedX = tx * TILE_SIZE;
            const snappedY = ty * TILE_SIZE;
            const screenPosSnap = this.camera.worldToScreen(snappedX, snappedY);

            // Check if placeable
            const canPlace = this.tileMap.canPlace(tx, ty, bd.size[0], bd.size[1]);

            ctx.fillStyle = canPlace ? 'rgba(80, 200, 80, 0.4)' : 'rgba(200, 80, 80, 0.4)';
            ctx.fillRect(screenPosSnap.x, screenPosSnap.y, bw, bh);
            ctx.strokeStyle = canPlace ? '#5f5' : '#f55';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenPosSnap.x, screenPosSnap.y, bw, bh);

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#fff';
            ctx.font = "bold 10px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(bd.name, screenPosSnap.x + bw / 2, screenPosSnap.y + bh / 2 + 4);

        } else if (spawnDef.entityCategory === 'resource') {
            // Resource ghost
            let rad = 6;
            if (this.freeSpawnUnit === ResourceNodeType.Tree) rad = 12;
            else if (this.freeSpawnUnit === ResourceNodeType.GoldMine || this.freeSpawnUnit === ResourceNodeType.StoneMine) rad = 16;

            ctx.fillStyle = 'rgba(200, 200, 80, 0.4)';
            ctx.beginPath();
            ctx.arc(sx, sy, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#dd0';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#fff';
            ctx.font = "bold 9px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(spawnDef.label, sx, sy + rad + 10);
        }

        ctx.textAlign = 'left';
        ctx.restore();
    }

    // ==================================================================
    //  ORNATE PANEL DRAWING HELPERS
    // ==================================================================
    private drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        // Outer black border
        ctx.fillStyle = C.uiBorderOuter;
        ctx.fillRect(x, y, w, h);
        // Dark gold bevel
        ctx.fillStyle = C.uiBorderDark;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        // Gold border trim
        ctx.fillStyle = C.uiBorder;
        ctx.fillRect(x + 3, y + 3, w - 6, 2); // top
        ctx.fillRect(x + 3, y + h - 5, w - 6, 2); // bottom
        ctx.fillRect(x + 3, y + 3, 2, h - 6); // left
        ctx.fillRect(x + w - 5, y + 3, 2, h - 6); // right
        // Inner fill
        ctx.fillStyle = C.uiBg;
        ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
        // Subtle inner gradient (top highlight)
        const grad = ctx.createLinearGradient(x, y + 5, x, y + 30);
        grad.addColorStop(0, 'rgba(200,170,100,0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 5, y + 5, w - 10, 25);
    }

    private drawGoldCorner(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.fillStyle = C.uiBorderLight;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = C.uiBorder;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    }

    private drawSeparator(ctx: CanvasRenderingContext2D, x: number, y: number, height: number): void {
        ctx.fillStyle = C.uiBorderOuter;
        ctx.fillRect(x, y, 1, height);
        ctx.fillStyle = C.uiBorderDark;
        ctx.fillRect(x + 1, y, 1, height);
        ctx.fillStyle = C.uiBorder;
        ctx.fillRect(x + 2, y, 1, height);
        ctx.fillStyle = C.uiBorderDark;
        ctx.fillRect(x + 3, y, 1, height);
    }

    // ==================================================================
    //  TOP RESOURCE BAR
    // ==================================================================        
    private renderGameOverScreen(ctx: CanvasRenderingContext2D): void {
        if (!this.game) return;

        const w = this.camera.viewportWidth;
        const h = this.camera.viewportHeight;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        const isVictory = this.game.gameState === 'victory';

        // Main Text
        ctx.font = "bold 60px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = isVictory ? "CHIẾN THẮNG" : "THẤT BẠI";
        const color = isVictory ? "#ffd700" : "#ff4444";

        // Text Shadow
        ctx.fillStyle = "#000000";
        ctx.fillText(text, w / 2 + 4, h / 2 - 40 + 4);

        ctx.fillStyle = color;
        ctx.fillText(text, w / 2, h / 2 - 40);

        // Check mouse for hover effect on button
        const btnW = 200;
        const btnH = 50;
        const btnX = w / 2 - btnW / 2;
        const btnY = h / 2 + 60;

        const isHover = (this.mouseX >= btnX && this.mouseX <= btnX + btnW &&
            this.mouseY >= btnY && this.mouseY <= btnY + btnH);

        // Exit Button
        ctx.fillStyle = isHover ? '#665544' : '#4a3a2a';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f0e6d2';
        ctx.font = "20px 'Inter', sans-serif";
        ctx.fillText("Thoát ra Menu", w / 2, btnY + btnH / 2);

        // Reset text align
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }

    private renderTopBar(ctx: CanvasRenderingContext2D, vpW: number): void {
        // Background
        ctx.fillStyle = C.uiBorderOuter;
        ctx.fillRect(0, 0, vpW, this.topBarH);
        ctx.fillStyle = C.uiBg;
        ctx.fillRect(0, 2, vpW, this.topBarH - 4);
        // Bottom gold line
        ctx.fillStyle = C.uiBorderDark;
        ctx.fillRect(0, this.topBarH - 2, vpW, 1);
        ctx.fillStyle = C.uiBorder;
        ctx.fillRect(0, this.topBarH - 1, vpW, 1);

        const res = this.playerState.resources;
        const y = 24;

        // Resource items with icons
        const items: [string, string, string, number][] = [
            ['🌾', 'Food', C.food, Math.floor(res.food)],
            ['🪵', 'Wood', C.wood, Math.floor(res.wood)],
            ['🪙', 'Gold', C.gold, Math.floor(res.gold)],
            ['🪨', 'Stone', C.stone, Math.floor(res.stone)],
        ];

        let x = 14;
        for (const [icon, _name, color, val] of items) {
            // Icon
            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.fillText(icon, x, y);
            x += 20;
            // Value
            ctx.fillStyle = color;
            ctx.font = "bold 14px 'Inter', sans-serif";
            ctx.fillText(`${val}`, x, y);
            x += 60;
            // Separator dot
            ctx.fillStyle = C.uiSeparator;
            ctx.fillRect(x, 12, 1, 14);
            x += 10;
        }

        // Population
        ctx.fillStyle = C.uiText;
        ctx.font = "bold 13px 'Inter', sans-serif";
        const popColor = this.playerState.population >= this.playerState.maxPopulation ? C.uiTextRed : C.uiTextGreen;
        ctx.fillStyle = popColor;
        ctx.fillText(`⚔ ${this.playerState.population}`, x, y);
        ctx.fillStyle = C.uiTextDim;
        ctx.fillText(`/${this.playerState.maxPopulation}`, x + ctx.measureText(`⚔ ${this.playerState.population}`).width, y);
        x += 80;

        // Age
        ctx.fillStyle = C.uiHighlight;
        ctx.font = "bold 13px 'MedievalSharp', cursive";
        ctx.fillText(`⛨ ${this.playerState.ageName}`, x, y);
        x += ctx.measureText(`⛨ ${this.playerState.ageName}`).width + 15;

        // Civilization indicator
        const civData = CIVILIZATION_DATA[this.entityManager.playerCiv];
        ctx.fillStyle = civData.accentColor;
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(`${civData.icon} ${civData.name}`, x, y);
        x += ctx.measureText(`${civData.icon} ${civData.name}`).width + 15;

        // Trade Button
        if (this.playerState.hasTrade) {
            const btnW = 90;
            const btnH = 24;
            const btnX = x;
            const btnY = 6;
            const hovered = this.isHovered(btnX, btnY, btnW, btnH);

            ctx.fillStyle = hovered ? C.uiButtonHover : (this.tradeUI.isVisible ? C.uiHighlight : C.uiButton);
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = C.uiBorderLight;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            ctx.fillStyle = this.tradeUI.isVisible ? '#000' : '#fff';
            ctx.font = "bold 11px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("🤝 Giao Thương", btnX + btnW / 2, btnY + 16);
            ctx.textAlign = 'left';

            this.clickAreas.push({
                x: btnX, y: btnY, w: btnW, h: btnH,
                action: () => { this.tradeUI.toggle(); }
            });
        }

        // FPS (right) — controlled by settings
        if (this.showFPS) {
            ctx.fillStyle = C.uiTextDim;
            ctx.font = "11px 'Inter', sans-serif";
            ctx.textAlign = 'right';
            const fpsStr = `${this.loop.fps} FPS`;
            const msStr = `${this.loop.lastRenderTimeMs.toFixed(1)}ms (T:${this.loop.renderMetrics.terrain.toFixed(1)} E:${this.loop.renderMetrics.entities.toFixed(1)} P:${this.loop.renderMetrics.particles.toFixed(1)} F:${this.loop.renderMetrics.fog.toFixed(1)} U:${this.loop.renderMetrics.ui.toFixed(1)})`;
            ctx.fillText(fpsStr, vpW - 10, y - 14);
            ctx.fillText(msStr, vpW - 10, y - 2);
            ctx.textAlign = 'left';
        }
    }

    // ==================================================================
    //  CONTROL GROUP INDICATORS (below top bar)
    // ==================================================================
    private renderControlGroups(ctx: CanvasRenderingContext2D, vpW: number): void {
        const groups = this.selectionSystem.getControlGroups();
        const boxW = 32, boxH = 22, gap = 2;
        const totalW = 10 * (boxW + gap) - gap;
        const startX = Math.floor((vpW - totalW) / 2);
        const y = this.topBarH + 4;

        let hasAnyGroup = false;
        for (let i = 0; i <= 9; i++) {
            if (groups[i] && groups[i].length > 0) {
                const alive = groups[i].filter(u => u.alive);
                if (alive.length > 0) { hasAnyGroup = true; break; }
            }
        }
        if (!hasAnyGroup) return; // Don't render if no groups assigned

        for (let i = 0; i <= 9; i++) {
            const bx = startX + i * (boxW + gap);
            const alive = (groups[i] || []).filter(u => u.alive);
            const count = alive.length;
            const isActive = count > 0 && this.selectionSystem.selectedUnits.length > 0 &&
                alive.every(u => this.selectionSystem.selectedUnits.includes(u)) &&
                alive.length === this.selectionSystem.selectedUnits.length;
            const hovered = this.isHovered(bx, y, boxW, boxH);

            // Background
            if (isActive) {
                ctx.fillStyle = 'rgba(218,165,32,0.5)';
            } else if (count > 0 && hovered) {
                ctx.fillStyle = 'rgba(218,165,32,0.25)';
            } else if (count > 0) {
                ctx.fillStyle = 'rgba(30,28,22,0.85)';
            } else {
                ctx.fillStyle = 'rgba(20,18,14,0.5)';
            }
            ctx.fillRect(bx, y, boxW, boxH);

            // Border
            ctx.strokeStyle = count > 0 ? (isActive ? '#ffd700' : '#8a7a4a') : '#3a3622';
            ctx.lineWidth = isActive ? 1.5 : 0.8;
            ctx.strokeRect(bx, y, boxW, boxH);

            // Number label
            ctx.font = "bold 10px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillStyle = count > 0 ? (isActive ? '#ffd700' : '#c0b070') : '#5a5540';
            ctx.fillText(`${i}`, bx + boxW / 2, y + 10);

            // Unit count
            if (count > 0) {
                ctx.font = "9px 'Inter', sans-serif";
                ctx.fillStyle = isActive ? '#fff' : '#aaa';
                ctx.fillText(`${count}`, bx + boxW / 2, y + 19);
            }

            // Click area to recall group
            if (count > 0) {
                this.clickAreas.push({
                    x: bx, y, w: boxW, h: boxH,
                    action: () => {
                        this.selectionSystem.clearSelection();
                        const a = (groups[i] || []).filter(u => u.alive);
                        for (const u of a) u.selected = true;
                        this.selectionSystem.selectedUnits = a;
                    },
                });
            }
        }
        ctx.textAlign = 'left';
    }

    // ==================================================================
    //  BOTTOM PANEL (main frame)
    // ==================================================================
    private renderBottomPanel(ctx: CanvasRenderingContext2D, vpW: number, vpH: number): void {
        const y = vpH - this.bottomPanelH;
        // Only draw up to bottomPanelW to avoid empty black space
        this.drawPanel(ctx, 0, y, this.bottomPanelW, this.bottomPanelH);

        // Gold corner decorations
        const cs = 8;
        this.drawGoldCorner(ctx, 0, y, cs);
        this.drawGoldCorner(ctx, this.bottomPanelW - cs, y, cs);
        this.drawGoldCorner(ctx, 0, vpH - cs, cs);
        this.drawGoldCorner(ctx, this.bottomPanelW - cs, vpH - cs, cs);

        // Vertical separators
        const mmEnd = this.minimapSize + 6;
        this.drawSeparator(ctx, mmEnd, y + 6, this.bottomPanelH - 12);

        const portraitEnd = mmEnd + 240;
        this.drawSeparator(ctx, portraitEnd, y + 6, this.bottomPanelH - 12);
    }

    // ==================================================================
    //  MINIMAP (left section)
    // ==================================================================
    private renderMinimap(ctx: CanvasRenderingContext2D, vpH: number): void {
        const mx = this.borderWidth + 8;
        const my = vpH - this.bottomPanelH + 6; // Reduced padding to fit 180px box
        const ms = this.minimapSize - 16;

        // When no selection, draw a compact background panel behind the minimap
        if (!this.hasSelection) {
            const panelPad = 8;
            const panelX = mx - panelPad - 3;
            const panelY = my - panelPad - 3;
            const panelW = ms + (panelPad + 3) * 2;
            const panelH = ms + (panelPad + 3) * 2 + 12; // extra for label
            this.drawPanel(ctx, panelX, panelY, panelW, panelH);
        }

        // Minimap border (carved frame look)
        ctx.fillStyle = C.uiBorderOuter;
        ctx.fillRect(mx - 3, my - 3, ms + 6, ms + 6);
        ctx.fillStyle = C.uiBorderDark;
        ctx.fillRect(mx - 2, my - 2, ms + 4, ms + 4);
        ctx.fillStyle = C.uiBorder;
        ctx.fillRect(mx - 1, my - 1, ms + 2, ms + 2);

        // Terrain
        this.tileMap.renderMinimap(ctx, mx, my, ms, ms);

        // Entities
        this.entityManager.renderMinimap(ctx, mx, my, ms, ms);

        // Camera viewport rectangle
        const sx = ms / (MAP_COLS * TILE_SIZE);
        const sy = ms / (MAP_ROWS * TILE_SIZE);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
            mx + this.camera.x * sx,
            my + this.camera.y * sy,
            this.camera.viewportWidth * sx,
            (this.camera.viewportHeight - this.bottomPanelH - this.topBarH) * sy,
        );

        // Label
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "9px 'Inter', sans-serif";
        ctx.fillText('MINIMAP', mx + ms / 2 - 20, vpH - 6);
    }

    // ==================================================================
    //  PORTRAIT & INFO PANEL (center-left section)
    // ==================================================================
    private renderPortrait(ctx: CanvasRenderingContext2D, vpH: number): void {
        const px = this.minimapSize + 16;
        const py = vpH - this.bottomPanelH + 8; // Reduced padding
        const sel = this.selectionSystem;
        const drawBar = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, col: string, lbl: string) =>
            this.drawStatBar(c, x, y, w, h, p, col, lbl);

        if (sel.selectedUnits.length > 0) {
            renderUnitPortraitFn(ctx, px, py, sel, drawBar, renderMultiUnitGridFn, (t) => this.entityManager.isEnemy(0, t));
        } else if (sel.selectedBuilding) {
            renderBuildingPortraitFn(ctx, px, py, sel, drawBar, this.playerState, (t) => this.entityManager.isEnemy(0, t));
        } else if (sel.selectedResource) {
            renderResourcePortraitFn(ctx, px, py, sel.selectedResource, drawBar);
        }
    }

    // ==================================================================
    //  COMMAND GRID (delegated to panels/CommandGrid.ts)
    // ==================================================================
    private renderCommandGrid(ctx: CanvasRenderingContext2D, vpW: number, vpH: number): void {
        renderCommandGridFn(ctx, vpW, vpH, {
            minimapSize: this.minimapSize,
            bottomPanelH: this.bottomPanelH,
            freeMode: this.freeMode,
            playerState: this.playerState,
            entityManager: this.entityManager,
            selectionSystem: this.selectionSystem,
            clickAreas: this.clickAreas,
            hotkeyActions: this.hotkeyActions,
            isHovered: (x, y, w, h) => this.isHovered(x, y, w, h),
        });
    }

    // ==================================================================
    //  SPAWN PALETTE (delegated to panels/SpawnPalette.ts)
    // ==================================================================
    private renderSpawnPalette(ctx: CanvasRenderingContext2D, vpW: number, vpH: number): void {
        const self = this;
        renderSpawnPaletteFn(ctx, vpW, vpH, {
            topBarH: this.topBarH,
            get freeSpawnUnit() { return self.freeSpawnUnit; },
            set freeSpawnUnit(v) { self.freeSpawnUnit = v; },
            get freeSpawnCategory() { return self.freeSpawnCategory; },
            set freeSpawnCategory(v) { self.freeSpawnCategory = v; },
            get freeSpawnCiv() { return self.freeSpawnCiv; },
            set freeSpawnCiv(v) { self.freeSpawnCiv = v; },
            get freeSpawnAge() { return self.freeSpawnAge; },
            set freeSpawnAge(v) { self.freeSpawnAge = v; },
            get freeSpawnTeam() { return self.freeSpawnTeam; },
            set freeSpawnTeam(v) { self.freeSpawnTeam = v; },
            get freePlacementPhase() { return self.freePlacementPhase; },
            set freePlacementPhase(v) { self.freePlacementPhase = v; },
            onStartBattle: this.onStartBattle,
            onResetMap: this.onResetMap,
            clickAreas: this.clickAreas,
            isHovered: (x, y, w, h) => this.isHovered(x, y, w, h),
        });
    }

    private renderFreePauseButton(ctx: CanvasRenderingContext2D, vpW: number): void {
        const self = this;
        renderFreePauseButtonFn(ctx, vpW, {
            topBarH: this.topBarH,
            get freePlacementPhase() { return self.freePlacementPhase; },
            set freePlacementPhase(v) { self.freePlacementPhase = v; },
            onPauseGame: this.onPauseGame,
            clickAreas: this.clickAreas,
            isHovered: (x, y, w, h) => this.isHovered(x, y, w, h),
        });
    }

    // ==================================================================
    //  STAT BAR (HP / Training progress)
    // ==================================================================
    private drawStatBar(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, w: number, h: number,
        pct: number, color: string, label: string,
    ): void {
        // Background
        ctx.fillStyle = C.hpBg;
        ctx.fillRect(x, y, w, h);
        // Border
        ctx.strokeStyle = C.uiBorderDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        // Fill
        const fillColor = pct > 0.5 ? color : pct > 0.25 ? C.hpYellow : C.hpRed;
        ctx.fillStyle = fillColor;
        ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, pct), h - 2);
        // Highlight on top of fill
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgba(255,255,255,0.15)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, pct), h - 2);
        // Label
        if (label) {
            ctx.fillStyle = '#fff';
            ctx.font = "bold 8px 'Inter', sans-serif";
            ctx.fillText(label, x + w / 2 - ctx.measureText(label).width / 2, y + h - 2);
        }
    }

    public destroy(): void {
        if (this.tradeUI) {
            this.tradeUI.destroy();
        }
    }
}
