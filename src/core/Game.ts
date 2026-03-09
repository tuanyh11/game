// ============================================================
//  Game — Main orchestrator (Warcraft-style RTS)
// ============================================================

import { Camera } from "./Camera";
import { GameLoop } from "./GameLoop";
import { TileMap, MapPreset } from "../map/TileMap";
import { EntityManager } from "../systems/EntityManager";
import { PlayerState } from "../systems/PlayerState";
import { SelectionSystem } from "../systems/SelectionSystem";
import { GameUI } from "../ui/GameUI";
import { ParticleSystem } from "../effects/ParticleSystem";
import { FogOfWar } from "../systems/FogOfWar";
import { AIController, AIDifficulty } from "../systems/AIController";
import { CommandConsole, ConsoleHost } from "../ui/CommandConsole";
import { SettingsMenu } from "../ui/SettingsMenu";
import { WORLD_W, WORLD_H, TILE_SIZE, UnitType, BuildingType, ResourceType, CivilizationType, CIVILIZATION_DATA, CIV_ELITE_UNIT } from "../config/GameConfig";
import { Unit } from "../entities/Unit";
import { ResourceCache } from "../entities/ResourceCache";
import { audioSystem } from "../systems/AudioSystem";

/** Configuration for each AI player slot from the lobby */
export interface AISlotConfig {
    team: number;                   // 1 = ally, 2 = enemy
    civ: CivilizationType | null;   // null = random
    difficulty: AIDifficulty;
    color?: string;                 // slot color from lobby
}

export class Game implements ConsoleHost {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dpr = 1;

    camera: Camera;
    private loop: GameLoop;
    private tileMap: TileMap;
    private playerState: PlayerState;
    private entityManager: EntityManager;
    private selectionSystem!: SelectionSystem;
    private gameUI!: GameUI;
    private particles: ParticleSystem;
    private fog: FogOfWar;
    private aiControllers: AIController[] = [];
    public aiStates: PlayerState[] = [];
    private console: CommandConsole;
    private settingsMenu: SettingsMenu;

    // Removed Audio


    // Exit callback (to return to main menu)
    private onExitToMenu: (() => void) | null = null;

    // Game state
    public gameState: 'playing' | 'victory' | 'defeat' = 'playing';
    private stateCheckTimer = 0;

    // Game speed multiplier
    private gameSpeed = 1;
    private fogEnabled = true;
    private paused = false;
    private destroyed = false;
    private freeModeHadPlayer = false;
    private freeModeHadEnemy = false;

    // Store init params for async init
    private mapPreset: MapPreset;
    private playerCiv: CivilizationType;
    private aiSlots: AISlotConfig[];
    private freeMode: boolean;
    private playerColor: string;
    private totalAI: number;
    private allyCount: number;
    private enemyCount: number;

    constructor(canvasId: string, mapPreset: MapPreset = MapPreset.Grasslands, playerCiv: CivilizationType = CivilizationType.LaMa, aiSlots: AISlotConfig[] = [{ team: 2, civ: null, difficulty: AIDifficulty.Normal }], freeMode: boolean = false, playerColor: string = '') {
        const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!el) throw new Error(`Canvas #${canvasId} not found`);
        this.canvas = el;
        const ctx = this.canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot get 2D context");
        this.ctx = ctx;

        this.mapPreset = mapPreset;
        this.playerCiv = playerCiv;
        this.aiSlots = aiSlots;
        this.freeMode = freeMode;
        this.playerColor = playerColor;

        // Separate allies (team 1) and enemies (team 2) from slots
        // Reorder: allies first (team 1), then enemies (team 2)
        const sortedSlots = [...aiSlots].sort((a, b) => a.team - b.team);
        this.allyCount = sortedSlots.filter(s => s.team === 1).length;
        this.enemyCount = sortedSlots.filter(s => s.team === 2).length;
        this.totalAI = sortedSlots.length;

        // Core systems
        this.camera = new Camera({
            worldWidth: WORLD_W,
            worldHeight: WORLD_H,
            scrollSpeed: 600,
            edgeMargin: 20,
        });

        this.loop = new GameLoop({
            update: (dt) => this.update(dt),
            render: (dt) => this.render(dt),
        });

        this.tileMap = new TileMap(mapPreset);
        this.playerState = new PlayerState();
        this.entityManager = new EntityManager(this.tileMap, this.playerState);

        // Resolve AI civs (null = random)
        const allCivs = Object.values(CivilizationType);
        const usedCivs = [playerCiv];
        const aiCivs: CivilizationType[] = [];
        for (const slot of sortedSlots) {
            if (slot.civ) {
                aiCivs.push(slot.civ);
                usedCivs.push(slot.civ);
            } else {
                // Pick random unused civ
                const available = allCivs.filter(c => !usedCivs.includes(c));
                const pick = available.length > 0
                    ? available[Math.floor(Math.random() * available.length)]
                    : allCivs[Math.floor(Math.random() * allCivs.length)];
                aiCivs.push(pick);
                usedCivs.push(pick);
            }
        }
        this.entityManager.setCivilizations(playerCiv, aiCivs);

        // Pass slot colors from lobby
        const aiColors = sortedSlots.map(s => s.color ?? '');
        this.entityManager.setTeamColors(playerColor, aiColors);

        // Setup alliance system
        this.entityManager.setAlliances(this.allyCount, this.enemyCount);

        this.particles = new ParticleSystem();
        this.fog = new FogOfWar();
        this.entityManager.fog = this.fog;

        // Command Console
        this.console = new CommandConsole();
        this.console.setHost(this);

        // Settings Menu
        this.settingsMenu = new SettingsMenu();
        this.settingsMenu.setCallbacks({
            onExit: () => this.exitToMenu(),
            onToggleFog: () => this.toggleFog(),
            onSetSpeed: (s) => this.setGameSpeed(s),
            onResume: () => this.resume(),
            getGameSpeed: () => this.gameSpeed,
            getFogEnabled: () => this.fogEnabled,
            getGamePaused: () => this.paused,
        });
    }

    /** Run async initializations (map generation, pre-rendering) */
    async init(onProgress: (percent: number, stepName: string) => void): Promise<void> {
        // Step 1: Pre-render generic complex sprites into bitmaps
        onProgress(5, "Đang tối ưu hóa tài nguyên ảnh...");
        ResourceCache.init();
        await new Promise(r => setTimeout(r, 10)); // Yield to update UI

        // Step 2: TileMap procedural generation and rendering
        await this.tileMap.asyncInit(onProgress);

        // Step 3: Initialize AI controllers and build bases
        onProgress(70, "Đang xây dựng vương quốc...");
        await new Promise(r => setTimeout(r, 10)); // Yield to update UI

        // Re-sort slots for team consistency
        const sortedSlots = [...this.aiSlots].sort((a, b) => a.team - b.team);

        // Create AI controllers with per-slot difficulty
        for (let i = 0; i < this.totalAI; i++) {
            const team = i + 1;
            const aiState = new PlayerState();
            const ai = new AIController(
                this.entityManager,
                aiState,
                sortedSlots[i].difficulty,
                team,
                (msg, color) => {
                    if (this.console) this.console.log(msg, color);
                }
            );
            this.aiStates.push(aiState);
            this.aiControllers.push(ai);
        }

        this.selectionSystem = new SelectionSystem(
            this.canvas, this.camera, this.entityManager, this.playerState, this.tileMap, this.particles
        );
        // UI
        this.gameUI = new GameUI(
            this.canvas,
            this.camera,
            this.playerState,
            this.entityManager,
            this.selectionSystem,
            this.tileMap,
            this.loop,
            this.freeMode
        );
        this.gameUI.game = this; // Hook up game reference for Game Over state

        // Sync UI heights with selection system
        this.selectionSystem.uiBottomHeight = this.gameUI.bottomPanelH;
        this.selectionSystem.uiTopHeight = this.gameUI.topBarH;

        // ---- FREE MODE: Empty sandbox ----
        if (this.freeMode) {
            onProgress(80, "Đang thiết lập Chế Độ Tự Do...");
            // Don't setup normal game (no TC, no villagers, no AI)
            // Just an empty map with forests
            this.entityManager.freeMode = true;
            this.playerState.age = 4;
            this.playerState.maxPopulation = 999;
            this.fogEnabled = false;
            this.entityManager.fog = null;
            // Start PAUSED for placement phase
            this.paused = true;
            this.gameUI.freePlacementPhase = true;
            this.gameUI.onStartBattle = () => {
                this.paused = false;
            };
            this.gameUI.onPauseGame = () => {
                this.paused = true;
            };
            this.gameUI.onResetMap = () => {
                // Clear all units and buildings
                this.entityManager.units.length = 0;
                this.entityManager.buildings.length = 0;
                this.selectionSystem.clearSelection();
                // Keep placement phase active
                this.paused = true;
                this.gameUI.freePlacementPhase = true;
            };

            // Add AI Controllers for Team 0 (Player's spawned units) and Team 2 (Enemy)
            // so they automatically fight each other instead of standing still.
            for (const teamId of [0, 2]) {
                const state = new PlayerState();
                state.age = 4;
                state.maxPopulation = 999;
                const ai = new AIController(
                    this.entityManager, state, AIDifficulty.Hard, teamId
                );
                // Disable economy & base building in Free Mode
                ai.timers.build = Infinity;
                ai.timers.gather = Infinity;
                ai.timers.train = Infinity;
                ai.timers.ageUp = Infinity;

                this.aiStates.push(state);
                this.aiControllers.push(ai);
            }

            // Center camera in middle of map
            this.camera.x = WORLD_W / 2 - 400;
            this.camera.y = WORLD_H / 2 - 300;
        } else {
            // Setup game world with all AI players (pass allyCount for strategic spawn placement)
            onProgress(85, "Đang bố trí tài nguyên...");
            await new Promise(r => setTimeout(r, 10)); // Yield
            this.entityManager.setupGame(this.totalAI, this.allyCount);

            // Center camera on player TC (find actual position)
            const playerTC = this.entityManager.buildings.find(b => b.team === 0);
            if (playerTC) {
                this.camera.x = playerTC.x - 400;
                this.camera.y = playerTC.y - 300;
            }
        }

        onProgress(100, "Chuẩn bị xuất trận!");
        await new Promise(r => setTimeout(r, 100)); // Brief pause on 100%

        // ---- Input listeners for Settings Menu ----
        this._onKeyDown = (e: KeyboardEvent) => {
            if (this.destroyed) return;
            // F10 opens/closes settings (hard toggle)
            if (e.key === 'F10') {
                e.preventDefault();
                if (this.settingsMenu.visible) {
                    this.settingsMenu.close();
                    this.resume();
                } else {
                    this.pause();
                    this.settingsMenu.open();
                }
                return;
            }
            // Escape: priority 1 = close settings, priority 2 = clear selection, priority 3 = open settings
            if (e.key === 'Escape') {
                // 1. If settings is already open, Escape closes it
                if (this.settingsMenu.handleKeyDown('Escape')) return;

                // 2. If we have active selection or build mode, Escape clears it immediately
                let clearedSelection = false;
                if (this.selectionSystem.buildMode) {
                    this.selectionSystem.buildMode = null;
                    clearedSelection = true;
                } else if (this.selectionSystem.buildMenuOpen) {
                    this.selectionSystem.buildMenuOpen = false;
                    clearedSelection = true;
                } else if (this.selectionSystem.selectedUnits.length > 0 ||
                    this.selectionSystem.selectedBuilding !== null ||
                    this.selectionSystem.selectedResource !== null) {
                    this.selectionSystem.clearSelection();
                    clearedSelection = true;
                }

                // If we cleared something, stop here
                if (clearedSelection) {
                    return;
                }

                // 3. If there's NO selection, NO build mode, NO build menu, then Esc opens Settings
                this.pause();
                this.settingsMenu.open();
                return;
            }
        };
        this._onMouseMove = (e: MouseEvent) => {
            if (this.destroyed) return;
            this.settingsMenu.handleMouseMove(e.clientX, e.clientY);
        };
        this._onClick = (e: MouseEvent) => {
            if (this.destroyed) return;
            if (this.settingsMenu.handleClick(e.clientX, e.clientY)) {
                e.stopPropagation();
            }
        };

        window.addEventListener('keydown', this._onKeyDown);
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        // Use capture phase so settings menu gets clicks before game canvas
        this.canvas.addEventListener('click', this._onClick, true);

        // Resize
        this.handleResize();
        this._onResize = () => this.handleResize();
        window.addEventListener("resize", this._onResize);
    }

    // Stored event handlers for cleanup
    private _onKeyDown!: (e: KeyboardEvent) => void;
    private _onMouseMove!: (e: MouseEvent) => void;
    private _onClick!: (e: MouseEvent) => void;
    private _onResize!: () => void;

    setOnExitToMenu(cb: () => void): void {
        this.onExitToMenu = cb;
    }

    start(): void {
        this.loop.start();
    }

    destroy(): void {
        this.destroyed = true;
        this.loop.stop();
        window.removeEventListener('keydown', this._onKeyDown);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('click', this._onClick, true);
        window.removeEventListener('resize', this._onResize);
        if (this.gameUI) {
            this.gameUI.destroy();
        }
    }

    // Explicitly expose for GameUI Exit Button
    exitToMenu(): void {
        this.destroy();

        // Draw loading screen
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.resetTransform(); // Ignore camera offsets
            ctx.fillStyle = '#050403';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#f0e6d2';
            ctx.font = `bold ${Math.floor(24 * this.dpr)}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText("Đang tải Menu...", this.canvas.width / 2, this.canvas.height / 2);
            ctx.textAlign = 'left';
        }

        if (this.onExitToMenu) {
            setTimeout(() => {
                if (this.onExitToMenu) this.onExitToMenu();
            }, 500);
        }
    }

    private handleResize(): void {
        this.dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth, h = window.innerHeight;
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.camera.resize(w, h);
    }

    private update(dt: number): void {
        this.console.update(dt);
        this.settingsMenu.update(dt);

        // Update audio volume from settings
        const targetVol = this.settingsMenu.settings.musicVolume / 100;
        audioSystem.setVolume(targetVol);

        // Camera always updates (even when paused, for Free Mode placement)
        this.camera.update(dt);

        // Skip game updates if console is open or paused
        if (this.paused) return;

        // Apply game speed multiplier
        const gameDt = dt * this.gameSpeed;

        // Check for Win/Loss conditions every 1 second
        // Only check if playing and not in free placement phase
        if (this.gameState === 'playing' && (!this.gameUI || !this.gameUI.freePlacementPhase)) {
            this.stateCheckTimer += gameDt;
            if (this.stateCheckTimer >= 1.0) {
                this.stateCheckTimer = 0;

                // Count all alive units and buildings
                let playerEntityCount = 0;
                let enemyEntityCount = 0;

                // Count Buildings
                for (const b of this.entityManager.buildings) {
                    if (b.alive) {
                        if (b.team === 0) playerEntityCount++;
                        else this.entityManager.isEnemy(0, b.team) && enemyEntityCount++;
                    }
                }

                // Count Units
                for (const u of this.entityManager.units) {
                    if (u.alive) {
                        if (u.team === 0) playerEntityCount++;
                        else this.entityManager.isEnemy(0, u.team) && enemyEntityCount++;
                    }
                }

                // Free Mode tracking: track entities but never trigger win/loss
                if (this.entityManager.freeMode) {
                    if (playerEntityCount > 0) this.freeModeHadPlayer = true;
                    if (enemyEntityCount > 0) this.freeModeHadEnemy = true;
                    // Intentionally NOT setting this.gameState here to prevent game over in Free Mode
                } else {
                    // Normal mode: Trigger loss if no units and no buildings exist for a faction
                    if (playerEntityCount === 0) {
                        this.gameState = 'defeat';
                    } else if (enemyEntityCount === 0) {
                        this.gameState = 'victory';
                    }
                }
            }
        }

        // If game is over, only update particles (for explosions to finish) and camera, freeze entities
        if (this.gameState !== 'playing') {
            this.particles.update(gameDt);
            return;
        }

        this.entityManager.update(gameDt, this.particles);
        this.particles.update(gameDt);
        if (this.fogEnabled) {
            const allyTeams = this.entityManager.getAllyTeams(0);
            this.fog.update(this.entityManager.units, this.entityManager.buildings, 0, allyTeams, dt);
        }
        for (const ai of this.aiControllers) {
            ai.update(gameDt, this.particles);
        }
        this.selectionSystem.updateIndicators(gameDt);
    }

    private render(_dt: number): void {
        const ctx = this.ctx;
        const cam = this.camera;
        const dpr = this.dpr;

        const perfRenderStart = performance.now();

        // Clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // World rendering (DPR + camera)
        ctx.setTransform(dpr, 0, 0, dpr, -Math.round(cam.x) * dpr, -Math.round(cam.y) * dpr);

        let t0 = performance.now();
        // Layer 1: Terrain tiles
        this.tileMap.render(ctx, cam.x, cam.y, cam.viewportWidth, cam.viewportHeight);
        let t1 = performance.now();
        this.loop.renderMetrics.terrain = t1 - t0;

        t0 = performance.now();
        // Layer 2-4: Y-sorted entities (resources + buildings + units)
        // This creates depth: entities lower on screen (higher Y) draw on top
        this.entityManager.renderAllYSorted(ctx, cam.x, cam.y, cam.viewportWidth, cam.viewportHeight);
        t1 = performance.now();
        this.loop.renderMetrics.entities = t1 - t0;

        t0 = performance.now();
        // Layer 5: Particles (world space, with viewport culling, hidden under fog)
        this.particles.render(ctx, cam.x, cam.y, cam.viewportWidth, cam.viewportHeight, this.fogEnabled ? this.fog : null);
        t1 = performance.now();
        this.loop.renderMetrics.particles = t1 - t0;

        t0 = performance.now();
        // Layer 6: Fog of War (world space)
        if (this.fogEnabled) {
            this.fog.render(ctx, cam.x, cam.y, cam.viewportWidth, cam.viewportHeight);
        }
        t1 = performance.now();
        this.loop.renderMetrics.fog = t1 - t0;

        // HUD rendering (DPR only, no camera offset)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        t0 = performance.now();

        // Selection overlays (box select, build ghost)
        this.selectionSystem.renderOverlays(ctx);

        // Sync free mode placement flag to prevent selection system interference
        this.selectionSystem.freePlacementActive = this.gameUI.freePlacementPhase && this.gameUI.freeSpawnUnit !== null;

        // UI panels
        this.gameUI.showFPS = this.settingsMenu.settings.showFPS;
        this.gameUI.render(ctx);

        // Game speed indicator (top-right, next to FPS)
        if (this.gameSpeed !== 1 || this.paused) {
            ctx.fillStyle = this.paused ? '#ff4444' : '#ffd700';
            ctx.font = "bold 12px 'Inter', sans-serif";
            ctx.textAlign = 'right';
            ctx.fillText(
                this.paused ? '⏸ PAUSED' : `⚡ ${this.gameSpeed}x`,
                cam.viewportWidth - 70, 24
            );
            ctx.textAlign = 'left';
        }

        // Settings menu hint (top-right)
        if (!this.settingsMenu.visible && !this.paused) {
            ctx.fillStyle = '#5a4a3a';
            ctx.font = "10px 'Inter', sans-serif";
            ctx.textAlign = 'right';
            ctx.fillText('F10 / Esc — Cài đặt', cam.viewportWidth - 10, 14);
            ctx.textAlign = 'left';
        }

        // Command Console (always on top)
        this.console.render(ctx, cam.viewportWidth, cam.viewportHeight);

        // Settings Menu (on top of everything)
        this.settingsMenu.render(ctx, cam.viewportWidth, cam.viewportHeight);

        t1 = performance.now();
        this.loop.renderMetrics.ui = t1 - t0;

        this.loop.lastRenderTimeMs = performance.now() - perfRenderStart;
    }

    // ============================================================
    //  ConsoleHost implementation — cheats & game commands
    // ============================================================

    setGameSpeed(speed: number): void {
        this.gameSpeed = Math.max(0.1, Math.min(10, speed));
    }

    getGameSpeed(): number {
        return this.gameSpeed;
    }

    /** Settings data for external queries (e.g. FPS visibility) */
    get showFPS(): boolean {
        return this.settingsMenu.settings.showFPS;
    }

    get notificationsEnabled(): boolean {
        return this.settingsMenu.settings.notificationsEnabled;
    }

    addResource(type: string, amount: number): void {
        switch (type) {
            case 'food': this.playerState.addResource(ResourceType.Food, amount); break;
            case 'wood': this.playerState.addResource(ResourceType.Wood, amount); break;
            case 'gold': this.playerState.addResource(ResourceType.Gold, amount); break;
            case 'stone': this.playerState.addResource(ResourceType.Stone, amount); break;
        }
    }

    revealMap(): void {
        // Reveal by creating a temporary fog update with max sight
        this.fogEnabled = false;
        this.entityManager.fog = null;
    }

    toggleFog(): void {
        this.fogEnabled = !this.fogEnabled;
        this.entityManager.fog = this.fogEnabled ? this.fog : null;
    }

    spawnUnits(type: string, count: number): void {
        const unitTypeMap: Record<string, UnitType> = {
            villager: UnitType.Villager,
            spearman: UnitType.Spearman,
            archer: UnitType.Archer,
            scout: UnitType.Scout,
            swordsman: UnitType.Swordsman,
            knight: UnitType.Knight,
            herospartacus: UnitType.HeroSpartacus,
            herozarathustra: UnitType.HeroZarathustra,
            herohuangzhong: UnitType.HeroQiJiguang,
            heromusashi: UnitType.HeroMusashi,
            heroragnar: UnitType.HeroRagnar,
            immortal: UnitType.Immortal,
            chukonu: UnitType.ChuKoNu,
            ninja: UnitType.Ninja,
            centurion: UnitType.Centurion,
            ulfhednar: UnitType.Ulfhednar,
        };
        const ut = unitTypeMap[type.toLowerCase()];
        if (!ut) return;
        for (let i = 0; i < count; i++) {
            const cx = this.camera.x + this.camera.viewportWidth / 2 + (Math.random() - 0.5) * 100;
            const cy = this.camera.y + this.camera.viewportHeight / 2 + (Math.random() - 0.5) * 100;
            this.entityManager.spawnUnit(ut, cx, cy, 0);
        }
    }

    spawnElite(count: number): void {
        const playerCiv = this.entityManager.playerCiv;
        const eliteType = CIV_ELITE_UNIT[playerCiv];
        for (let i = 0; i < count; i++) {
            const cx = this.camera.x + this.camera.viewportWidth / 2 + (Math.random() - 0.5) * 100;
            const cy = this.camera.y + this.camera.viewportHeight / 2 + (Math.random() - 0.5) * 100;
            this.entityManager.spawnUnit(eliteType, cx, cy, 0);
        }
    }

    getPlayerCiv(): string {
        return this.entityManager.playerCiv;
    }

    /** Spawn a showcase of all civilizations side by side */
    spawnCivShowcase(): void {
        const civs = [
            CivilizationType.BaTu,
            CivilizationType.DaiMinh,
            CivilizationType.Yamato,
            CivilizationType.LaMa,
            CivilizationType.Viking,
        ];
        const unitTypes = [
            UnitType.Spearman,
            UnitType.Archer,
            UnitType.Scout,
            UnitType.Swordsman,
            UnitType.Knight,
            UnitType.Immortal,
            UnitType.ChuKoNu,
            UnitType.Ninja,
            UnitType.Centurion,
            UnitType.Ulfhednar,
        ];

        const startX = this.camera.x + this.camera.viewportWidth / 2 - 150;
        const startY = this.camera.y + this.camera.viewportHeight / 2 - 100;

        for (let ci = 0; ci < civs.length; ci++) {
            for (let ui = 0; ui < unitTypes.length; ui++) {
                const x = startX + ui * 50;
                const y = startY + ci * 50;
                const unit = new Unit(unitTypes[ui], x, y, 0, civs[ci]);
                unit.age = this.playerState.age;
                unit.setDropOffCallback(() => { });
                this.entityManager.units.push(unit);
            }
        }
    }

    killSelected(): void {
        for (const u of this.selectionSystem.selectedUnits) {
            u.hp = 0;
        }
    }

    pause(): void {
        this.paused = true;
        this.selectionSystem.isPaused = true;
    }

    resume(): void {
        this.paused = false;
        this.selectionSystem.isPaused = false;
    }

    addHeroXp(amount: number): void {
        for (const u of this.selectionSystem.selectedUnits) {
            if (u.isHero) u.addHeroXp(amount);
        }
    }
}
