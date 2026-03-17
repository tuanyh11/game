// ============================================================
//  GameUI — Warcraft III-style interface
//
//  Layout:  [MINIMAP] [PORTRAIT + INFO] [COMMAND GRID]
//  Top:     Resource bar with gold/wood/stone/food icons
// ============================================================

import {
    C, TILE_SIZE, MAP_COLS, MAP_ROWS, BuildingType, BUILDING_DATA,
    UnitType, UNIT_DATA, ResourceType, AGE_COSTS, UnitState,
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
import { renderGameOverScreen as renderGameOverScreenFn } from "./panels/GameOverScreen";
import { renderTopBar as renderTopBarFn } from "./panels/TopBar";
import { drawPanel as drawPanelFn, drawSeparator as drawSeparatorFn, drawStatBar as drawStatBarFn, wrapText as wrapTextFn, roundRect as roundRectFn } from "./UIHelpers";
import { TradeUI } from "./TradeUI";
import { cmdCancelTrain } from "../network/NetworkCommands";

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
    private shiftHeld = false;

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
    freeSlotColor: string = '#cc3333'; // Team color for free mode
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

        // --- Touch Events Support ---
        canvas.addEventListener('touchstart', (e) => {
            // Check if touch is in UI area to prevent default (like scrolling)
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                // For minimap click
                const mockE = { clientX: touch.clientX, clientY: touch.clientY, button: 0, stopPropagation: () => { } } as unknown as MouseEvent;
                this.handleMinimapClick(mockE);

                // For UI clicks
                this.mouseX = touch.clientX;
                this.mouseY = touch.clientY;
                this.handleClick(mockE);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        }, { passive: false });

        // Add CSS to prevent touch actions
        canvas.style.touchAction = 'none';

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
            if (e.key === 'Shift') this.shiftHeld = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.shiftHeld = false;
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
            // Apply custom color to the just-spawned unit
            const units = this.entityManager.units;
            const lastUnit = units[units.length - 1];
            if (lastUnit && this.freeSlotColor) {
                lastUnit.slotColor = this.freeSlotColor;
            }
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
    //  ZEN PANEL DRAWING HELPERS (delegated to UIHelpers)
    // ==================================================================
    private drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        drawPanelFn(ctx, x, y, w, h);
    }

    private drawGoldCorner(_ctx: CanvasRenderingContext2D, _x: number, _y: number, _size: number): void {
        // Zen: no ornate corners
    }

    private drawSeparator(ctx: CanvasRenderingContext2D, x: number, y: number, height: number): void {
        drawSeparatorFn(ctx, x, y, height);
    }

    // ==================================================================
    //  GAME OVER SCREEN (delegated to GameOverScreen module)
    // ==================================================================        
    private renderGameOverScreen(ctx: CanvasRenderingContext2D): void {
        if (!this.game) return;
        renderGameOverScreenFn(ctx, {
            isVictory: this.game.gameState === 'victory',
            viewportWidth: this.camera.viewportWidth,
            viewportHeight: this.camera.viewportHeight,
            mouseX: this.mouseX,
            mouseY: this.mouseY,
        });
    }

    // ==================================================================
    //  TOP RESOURCE BAR (delegated to TopBar module)
    // ==================================================================
    private renderTopBar(ctx: CanvasRenderingContext2D, vpW: number): void {
        renderTopBarFn(ctx, vpW, {
            topBarH: this.topBarH,
            playerState: this.playerState,
            entityManager: this.entityManager,
            loop: this.loop,
            showFPS: this.showFPS,
            tradeUI: this.tradeUI,
            clickAreas: this.clickAreas,
            isHovered: (x, y, w, h) => this.isHovered(x, y, w, h),
        });
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
            // Set up queue click areas collection on SelectionSystem
            const queueClickAreas: { x: number; y: number; w: number; h: number; queueIndex: number; buildingId: number }[] = [];
            (sel as any)._queueClickAreas = queueClickAreas;

            renderBuildingPortraitFn(ctx, px, py, sel, drawBar, this.playerState, (t) => this.entityManager.isEnemy(0, t));

            // Register queue cancel click areas
            for (const qa of queueClickAreas) {
                this.clickAreas.push({
                    x: qa.x, y: qa.y, w: qa.w, h: qa.h,
                    action: () => {
                        const b = sel.selectedBuilding;
                        if (!b || b.id !== qa.buildingId) return;
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdCancelTrain(sel.playerTeam, qa.buildingId, qa.queueIndex));
                        } else {
                            b.cancelQueueItem(qa.queueIndex, this.playerState);
                        }
                    },
                });
            }

            // Clean up temp property
            delete (sel as any)._queueClickAreas;
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
            shiftHeld: this.shiftHeld,
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
            get freeSlotColor() { return self.freeSlotColor; },
            set freeSlotColor(v) { self.freeSlotColor = v; },
            get freePlacementPhase() { return self.freePlacementPhase; },
            set freePlacementPhase(v) { self.freePlacementPhase = v; },
            onStartBattle: this.onStartBattle,
            onResetMap: this.onResetMap,
            onColorChange: (color: string) => {
                // Apply color to ALL existing units & buildings of the selected team
                for (const u of this.entityManager.units) {
                    if (u.team === this.freeSpawnTeam) u.slotColor = color;
                }
                for (const b of this.entityManager.buildings) {
                    if (b.team === this.freeSpawnTeam) b.slotColor = color;
                }
            },
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
    //  STAT BAR (delegated to UIHelpers)
    // ==================================================================
    private drawStatBar(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, w: number, h: number,
        pct: number, color: string, label: string,
    ): void {
        drawStatBarFn(ctx, x, y, w, h, pct, color, label);
    }

    public destroy(): void {
        if (this.tradeUI) {
            this.tradeUI.destroy();
        }
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        roundRectFn(ctx, x, y, w, h, r);
    }
}
