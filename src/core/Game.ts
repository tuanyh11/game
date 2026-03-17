// ============================================================
//  Game — Main orchestrator (Warcraft-style RTS)
//  Supports both singleplayer and multiplayer modes
// ============================================================

import { Camera } from "./Camera";
import { GameLoop } from "./GameLoop";
import { TileMap, MapPreset } from "../map/TileMap";
import { RoomPlayer } from "../../server/types";
import { EntityManager } from "../systems/EntityManager";
import { PlayerState } from "../systems/PlayerState";
import { SelectionSystem } from "../systems/SelectionSystem";
import { GameUI } from "../ui/GameUI";
import { ParticleSystem } from "../effects/ParticleSystem";
import { FogOfWar } from "../systems/FogOfWar";
import { AIController, AIDifficulty } from "../systems/AIController";
import { CommandConsole, ConsoleHost } from "../ui/CommandConsole";
import { SettingsMenu } from "../ui/SettingsMenu";
import { WORLD_W, WORLD_H, TILE_SIZE, UnitType, BuildingType, ResourceType, CivilizationType, CIVILIZATION_DATA, CIV_ELITE_UNIT, resetId } from "../config/GameConfig";
import { Unit } from "../entities/Unit";
import { ResourceCache } from "../entities/ResourceCache";
import { audioSystem } from "../systems/AudioSystem";
// Multiplayer
import type { NetworkClient } from "../network/NetworkClient";
import type { GameCommand } from "../network/NetworkCommands";
import { cmdCheat, CommandType } from "../network/NetworkCommands";
import { SeededRandom } from "../utils/SeededRandom";

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

    // ---- MULTIPLAYER ----
    public isMultiplayer = false;
    public isHost = false;
    public myTeam = 0; // Which team this player controls
    public networkClient: NetworkClient | null = null;
    private pendingCommands: GameCommand[] = []; // Commands waiting to be applied
    private pendingTicks: { tick: number; commands: GameCommand[] }[] = []; // Ticks from server
    private gameSeed: number | null = null; // Multiplayer seed for deterministic generation
    private aiRng: SeededRandom | null = null; // Persistent seeded RNG for AI determinism in multiplayer
    private humanTeams: Set<number> = new Set([0]); // Teams controlled by human players
    private mpAccumulator: number = 0; // Fixed timestep accumulator for multiplayer
    private teamStatesMap: Map<number, PlayerState> = new Map(); // Per-team PlayerState

    constructor(canvasId: string, mapPreset: MapPreset = MapPreset.Grasslands, playerCiv: CivilizationType = CivilizationType.LaMa, aiSlots: AISlotConfig[] = [{ team: 2, civ: null, difficulty: AIDifficulty.Normal }], freeMode: boolean = false, playerColor: string = '', seed?: number) {
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
        this.gameSeed = seed ?? null;
        if (this.gameSeed !== null) {
            this.aiRng = new SeededRandom(this.gameSeed + 77777);
        }

        // Sort by team number (= slot number in multiplayer) for consistent ordering
        const sortedSlots = [...aiSlots].sort((a, b) => a.team - b.team);

        // In singleplayer: MainMenu passes team as alliance group (1=ally, 2=enemy)
        // but setupGame() assigns sequential team IDs (1,2,3...).
        // We need to remap so each AI gets a UNIQUE team number while preserving alliance info.
        // In multiplayer: slots already have unique team numbers (= slot numbers), skip remapping.
        if (seed === undefined) {
            // Count original allies/enemies BEFORE remapping
            this.allyCount = sortedSlots.filter(s => s.team === 1).length;
            this.enemyCount = sortedSlots.length - this.allyCount;
            // Remap to sequential: allies get 1..allyCount, enemies get allyCount+1..total
            for (let i = 0; i < sortedSlots.length; i++) {
                sortedSlots[i] = { ...sortedSlots[i], team: i + 1 };
            }
        } else {
            // Multiplayer: team numbers are unique slot numbers, alliance set by setupMultiplayer
            this.allyCount = sortedSlots.filter(s => s.team === 1).length;
            this.enemyCount = sortedSlots.length - this.allyCount;
        }
        this.totalAI = sortedSlots.length;
        // Update aiSlots reference so _doInit uses the remapped teams
        this.aiSlots = sortedSlots;

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
        // Use seeded random for civ resolution in multiplayer for determinism
        const civRng = seed !== undefined ? new SeededRandom(seed + 99999) : null;
        const civRandom = () => civRng ? civRng.next() : Math.random();
        for (const slot of sortedSlots) {
            if (slot.civ) {
                aiCivs.push(slot.civ);
                usedCivs.push(slot.civ);
            } else {
                // Pick random unused civ
                const available = allCivs.filter(c => !usedCivs.includes(c));
                const pick = available.length > 0
                    ? available[Math.floor(civRandom() * available.length)]
                    : allCivs[Math.floor(civRandom() * allCivs.length)];
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

        // Register per-team PlayerState for multiplayer determinism
        // Team 0 = slot 0 (player), Team 1..N = sorted AI slots
        this.teamStatesMap.set(0, this.playerState);
        // AI states will be added after AI controllers are created (in init)

        this.particles = new ParticleSystem();
        this.fog = new FogOfWar();
        this.entityManager.fog = this.fog;
        
        // Let audio system know about fog for spatial muting
        audioSystem.setFogOfWar(this.fog);

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
        await this._doInit(onProgress);
    }

    private async _doInit(onProgress: (percent: number, stepName: string) => void): Promise<void> {
        // Step 1: Pre-render generic complex sprites into bitmaps
        onProgress(5, "Đang tối ưu hóa tài nguyên ảnh...");
        ResourceCache.init();

        // Step 2: TileMap generation — MUST be synchronous + seeded for multiplayer determinism
        onProgress(10, "Đang định hình địa hình...");
        if (this.gameSeed !== null) {
            console.log(`🎲 Using seeded random: ${this.gameSeed}`);
            // Generate terrain synchronously with deterministic random
            SeededRandom.withSeed(this.gameSeed, () => {
                this.tileMap.generate(this.tileMap.mapPreset);
            });
        } else {
            this.tileMap.generate(this.tileMap.mapPreset);
        }

        // Step 2b: Terrain cache rendering (async canvas drawing — no Math.random needed)
        await this.tileMap.buildTerrainCache(onProgress);

        // Step 3: Initialize AI controllers and build bases
        onProgress(70, "Đang xây dựng vương quốc...");

        // Re-sort slots for team consistency
        const sortedSlots = [...this.aiSlots].sort((a, b) => a.team - b.team);

        // Create AI controllers with per-slot difficulty
        for (let i = 0; i < this.totalAI; i++) {
            const team = sortedSlots[i].team; // Use slot's team number directly (= slot number in multiplayer)
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
            this.teamStatesMap.set(team, aiState); // Register AI state for per-team tracking
        }

        // Register all team states with EntityManager
        this.entityManager.setTeamStates(this.teamStatesMap);

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
            if (this.gameSeed !== null) {
                // CRITICAL: Reset ID counter + run setupGame with seeded random
                // ALL in one synchronous block — no interruptions possible!
                SeededRandom.withSeed(this.gameSeed + 12345, () => {
                    resetId();
                    this.entityManager.setupGame(this.totalAI, this.allyCount);
                });
            } else {
                resetId();
                this.entityManager.setupGame(this.totalAI, this.allyCount);
            }

            // Log entity IDs for multiplayer sync verification
            const team0Units = this.entityManager.units.filter(u => u.team === 0);
            const team1Units = this.entityManager.units.filter(u => u.team === 1);
            console.log(`🔢 CONFIG: seed=${this.gameSeed}, totalAI=${this.totalAI}, allyCount=${this.allyCount}`);
            console.log(`🔢 TEAM 0: ${team0Units.length} units, IDs=[${team0Units.map(u=>u.id).join(',')}]`);
            console.log(`🔢 TEAM 1: ${team1Units.length} units, IDs=[${team1Units.map(u=>u.id).join(',')}]`);
            console.log(`🔢 TOTALS: units=${this.entityManager.units.length}, buildings=${this.entityManager.buildings.length}, resources=${this.entityManager.resources.length}`);

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
        // Disconnect network if multiplayer
        if (this.networkClient) {
            this.networkClient.disconnect();
            this.networkClient = null;
        }
    }

    // ---- MULTIPLAYER METHODS ----

    /** Configure for multiplayer mode */
    setupMultiplayer(networkClient: NetworkClient, mySlot: number, isHost: boolean, players: RoomPlayer[], myPlayerId: string): void {
        this.isMultiplayer = true;
        this.networkClient = networkClient;
        this.myTeam = mySlot; // My slot = my internal team number
        this.isHost = isHost;

        // Set team on SelectionSystem so player controls correct team
        if (this.selectionSystem) {
            this.selectionSystem.playerTeam = mySlot;
            this.selectionSystem.isMultiplayer = true;
            this.selectionSystem.sendCommand = (cmd) => this.sendCommand(cmd);
        }

        // Set team on EntityManager for UI display only (fog, health bar colors)
        this.entityManager.localPlayerTeam = mySlot;

        // DO NOT swap civilizations — use absolute teamCivs map for civ lookup
        // playerCiv and enemyCivs remain as slot 0's perspective (same on ALL clients)

        // Configure alliances ABSOLUTELY (same on all clients)
        // Use lobby team numbers directly — same lobby team = allies, different = enemies
        const sortedPlayers = [...players].sort((a, b) => a.slot - b.slot);

        const em = this.entityManager;
        em['teamAlliances'].clear();
        // Group by lobby team: assign alliance groups by lobby team number
        const lobbyTeamToAlliance = new Map<number, number>();
        let nextAlliance = 0;
        for (const p of sortedPlayers) {
            if (!lobbyTeamToAlliance.has(p.team)) {
                lobbyTeamToAlliance.set(p.team, nextAlliance++);
            }
            em['teamAlliances'].set(p.slot, lobbyTeamToAlliance.get(p.team)!);
        }
        console.log(`🔄 Alliances configured (absolute): ${sortedPlayers.map(p => `slot${p.slot}(lobbyTeam${p.team})=alliance${em['teamAlliances'].get(p.slot)}`).join(', ')}`);

        // Mark human-controlled slots (remove their AI controllers)
        this.humanTeams.clear();
        for (const p of sortedPlayers) {
            if (!p.isAI) {
                this.humanTeams.add(p.slot);
            }
        }

        // Remove AI controllers for human-controlled teams entirely
        this.aiControllers = this.aiControllers.filter(ai => !this.humanTeams.has(ai.team));
        console.log(`🤖 AI controllers remaining: ${this.aiControllers.length} (removed for human slots: ${[...this.humanTeams].join(',')})`);

        // ★ CRITICAL: Swap playerState to the local player's team state
        // Without this, Player 2's UI shows team 0's resources/age (host's state)
        const myState = this.teamStatesMap.get(mySlot);
        if (myState && mySlot !== 0) {
            this.playerState = myState;
            this.entityManager.playerState = myState;
            // Update all UI subsystems that reference playerState
            if (this.selectionSystem) {
                (this.selectionSystem as any).playerState = myState;
            }
            if (this.gameUI) {
                (this.gameUI as any).playerState = myState;
            }
            console.log(`🔄 PlayerState swapped to team ${mySlot}'s state for local UI`);
        }

        // Center camera on MY team's Town Center
        const myTC = this.entityManager.buildings.find(b => b.team === mySlot);
        if (myTC) {
            this.camera.x = myTC.x - 400;
            this.camera.y = myTC.y - 300;
        }

        // Listen for tick advances from server
        networkClient.setHandlers({
            ...networkClient['handlers'], // preserve existing handlers
            onTickAdvance: (tick: number, commands: GameCommand[]) => {
                // Buffer ticks with their commands — processed in update()
                if (commands.length > 0) {
                    console.log(`📨 TICK ${tick}: received ${commands.length} commands:`, commands.map(c => `${c.type}(team=${c.team})`).join(', '));
                }
                this.pendingTicks.push({ tick, commands });
            },
        });

        console.log(`🎮 Multiplayer configured: slot=${mySlot}, isHost=${isHost}`);
    }

    /** Send a command to the server (multiplayer) or apply directly (singleplayer) */
    sendCommand(cmd: GameCommand): void {
        console.log(`📤 Game.sendCommand: isMP=${this.isMultiplayer}, hasNC=${!!this.networkClient}, cmd=${cmd.type}`);
        if (this.isMultiplayer && this.networkClient) {
            this.networkClient.sendCommand(cmd);
        } else {
            // Singleplayer: apply directly
            this.entityManager.applyCommand(cmd);
        }
    }

    /** Apply queued network commands */
    private applyNetworkCommands(): void {
        while (this.pendingCommands.length > 0) {
            const cmd = this.pendingCommands.shift()!;
            console.log(`🎯 Applying cmd: ${cmd.type} team=${cmd.team}`, cmd.data);
            if (cmd.type === CommandType.CHEAT) {
                this.applyCheatCommand(cmd);
            } else {
                this.entityManager.applyCommand(cmd);
            }
        }
    }

    /** Expose entity manager for SelectionSystem multiplayer integration */
    getEntityManager(): EntityManager { return this.entityManager; }

    // Explicitly expose for GameUI Exit Button
    exitToMenu(): void {
        this.destroy();

        // Draw animated zen loading screen
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            if (this.onExitToMenu) this.onExitToMenu();
            return;
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const dpr = this.dpr;
        
        let progress = 0;
        const startTime = performance.now();
        const duration = 600; // ms to animate loading

        const loadingLoop = (now: number) => {
            const elapsed = now - startTime;
            progress = Math.min(1, elapsed / duration);
            
            // Ease out quad
            const easeProgress = progress * (2 - progress);

            ctx.resetTransform(); 
            
            // Zen Dark Gradient Background
            const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
            bgGrad.addColorStop(0, 'rgba(22, 22, 26, 1)');
            bgGrad.addColorStop(1, 'rgba(10, 10, 12, 1)');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Giant Background Kanji (待機 - Standby)
            ctx.font = `${Math.floor(250 * dpr)}px 'Noto Serif JP', serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillText('待機', w / 2, h / 2 - (20 * dpr));

            // Loading Text
            ctx.fillStyle = '#c2185b'; // Crimson
            ctx.font = `600 ${Math.floor(18 * dpr)}px 'Inter', sans-serif`;
            ctx.letterSpacing = `${2 * dpr}px`;
            ctx.fillText("ĐANG TẢI MENU...", w / 2, h / 2 - (10 * dpr));
            
            // Percentage
            ctx.fillStyle = '#a0a0aa'; // Zinc
            ctx.font = `400 ${Math.floor(14 * dpr)}px 'Inter', sans-serif`;
            ctx.fillText(`${Math.floor(easeProgress * 100)}%`, w / 2, h / 2 + (25 * dpr));
            ctx.letterSpacing = "0px";

            // Thin progress line
            const barW = 200 * dpr;
            const barH = 2 * dpr;
            const barX = w / 2 - barW / 2;
            const barY = h / 2 + (50 * dpr);
            
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#c2185b';
            ctx.fillRect(barX, barY, barW * easeProgress, barH);
            ctx.shadowBlur = 0;

            if (progress < 1) {
                requestAnimationFrame(loadingLoop);
            } else {
                // Done loading
                setTimeout(() => {
                    if (this.onExitToMenu) this.onExitToMenu();
                }, 100);
            }
        };

        requestAnimationFrame(loadingLoop);
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
        // Update spatial audio with camera position
        audioSystem.updateCamera(this.camera.x, this.camera.y, this.camera.viewportWidth, this.camera.viewportHeight);

        // Skip game updates if console is open or paused
        if (this.paused) return;

        // In multiplayer: process server ticks with FIXED timestep
        // In singleplayer: use variable dt for smooth gameplay
        if (this.isMultiplayer) {
            const FIXED_DT = 1 / 20; // 50ms — matches server TICK_RATE

            // Process ALL pending server ticks (catches up after tab-switch)
            // Cap at 100 ticks per frame to prevent freeze on long tab-away
            const maxTicks = Math.min(this.pendingTicks.length, 100);
            for (let i = 0; i < maxTicks; i++) {
                const tickData = this.pendingTicks[i];

                // Override Math.random with seeded RNG for full determinism
                // MUST be before commands — spawning/cheats may call Math.random
                const origRandom = Math.random;
                if (this.aiRng) Math.random = () => this.aiRng!.next();

                // Apply commands for this tick
                for (const cmd of tickData.commands) {
                    console.log(`🎯 Applying cmd: ${cmd.type} team=${cmd.team}`, cmd.data);
                    if (cmd.type === CommandType.CHEAT) {
                        this.applyCheatCommand(cmd);
                    } else {
                        this.entityManager.applyCommand(cmd);
                    }
                }

                // Fixed-step game logic update
                this.entityManager.update(FIXED_DT, this.particles);
                this.particles.update(FIXED_DT);

                // AI runs deterministically on ALL clients within the tick loop
                for (const ai of this.aiControllers) {
                    if (this.humanTeams.has(ai.team)) continue; // Skip human-controlled teams
                    ai.update(FIXED_DT, this.particles);
                }

                // Restore original Math.random
                Math.random = origRandom;

                // ★ DESYNC DETECTION: Log state hash for ALL teams
                if (tickData.tick % 100 === 0) {
                    const allUnits = this.entityManager.units.filter(u => u.alive);
                    const allHash = allUnits.reduce((h, u) => h + Math.round(u.x * 10) + Math.round(u.y * 10), 0);
                    const teamCounts: string[] = [];
                    const teamSet = new Set(allUnits.map(u => u.team));
                    for (const t of [...teamSet].sort()) {
                        const tu = allUnits.filter(u => u.team === t);
                        const th = tu.reduce((h, u) => h + Math.round(u.x) + Math.round(u.y), 0);
                        teamCounts.push(`T${t}:${tu.length}u/h${th}`);
                    }
                    const rngState = this.aiRng ? (this.aiRng as any).state ?? '?' : 'none';
                    console.log(`🔍 TICK ${tickData.tick}: hash=${allHash} rng=${rngState} ${teamCounts.join(' ')} bldgs=${this.entityManager.buildings.filter(b=>b.alive).length}`);
                }
            }
            // Remove processed ticks
            this.pendingTicks.splice(0, maxTicks);

            // Fog uses real dt for smooth visual updates
            if (this.fogEnabled) {
                const allyTeams = this.entityManager.getAllyTeams(this.myTeam);
                this.fog.update(this.entityManager.units, this.entityManager.buildings, this.myTeam, allyTeams, dt);
            }

            // Visual interpolation: lerp renderX/renderY toward logical x/y
            // Game logic ticks at 20Hz but render runs at 60fps.
            // Use a fast lerp so units visually catch up within ~2 frames
            // to minimize perceived input lag while staying smooth.
            const lerpFactor = Math.min(1, dt * 18); // ~0.3 per frame at 60fps → catches up in ~3 frames
            for (const u of this.entityManager.units) {
                if (!u.alive) continue;
                const dx = u.x - u.renderX;
                const dy = u.y - u.renderY;
                const distSq = dx * dx + dy * dy;
                // Snap if teleported (>80px jump) or very close (<0.3px)
                if (distSq > 6400 || distSq < 0.09) {
                    u.renderX = u.x;
                    u.renderY = u.y;
                } else {
                    u.renderX += dx * lerpFactor;
                    u.renderY += dy * lerpFactor;
                }
            }
        } else {
            const gameDt = dt * this.gameSpeed;

            // Check for Win/Loss conditions every 1 second
            if (this.gameState === 'playing' && (!this.gameUI || !this.gameUI.freePlacementPhase)) {
                this.stateCheckTimer += gameDt;
                if (this.stateCheckTimer >= 1.0) {
                    this.stateCheckTimer = 0;
                    let playerEntityCount = 0;
                    let enemyEntityCount = 0;
                    for (const b of this.entityManager.buildings) {
                        if (b.alive) {
                            if (b.team === this.myTeam) playerEntityCount++;
                            else this.entityManager.isEnemy(this.myTeam, b.team) && enemyEntityCount++;
                        }
                    }
                    for (const u of this.entityManager.units) {
                        if (u.alive) {
                            if (u.team === this.myTeam) playerEntityCount++;
                            else this.entityManager.isEnemy(this.myTeam, u.team) && enemyEntityCount++;
                        }
                    }
                    if (this.entityManager.freeMode) {
                        if (playerEntityCount > 0) this.freeModeHadPlayer = true;
                        if (enemyEntityCount > 0) this.freeModeHadEnemy = true;
                    } else {
                        if (playerEntityCount === 0) this.gameState = 'defeat';
                        else if (enemyEntityCount === 0) this.gameState = 'victory';
                    }
                }
            }

            if (this.gameState !== 'playing') {
                this.particles.update(gameDt);
                return;
            }

            this.entityManager.update(gameDt, this.particles);
            this.particles.update(gameDt);

            // In singleplayer, snap render positions (variable dt = smooth already)
            for (const u of this.entityManager.units) {
                u.renderX = u.x;
                u.renderY = u.y;
            }

            if (this.fogEnabled) {
                const allyTeams = this.entityManager.getAllyTeams(this.myTeam);
                this.fog.update(this.entityManager.units, this.entityManager.buildings, this.myTeam, allyTeams, dt);
            }
        }
        // In singleplayer, AI runs with variable dt
        if (!this.isMultiplayer) {
            const aiDt = dt * this.gameSpeed;
            for (const ai of this.aiControllers) {
                ai.update(aiDt, this.particles);
            }
        }
        this.selectionSystem.updateIndicators(dt);
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
        const s = Math.max(0.1, Math.min(10, speed));
        if (this.isMultiplayer && !this.isHost) {
            this.console.log('❌ Chỉ host mới dùng được lệnh này', '#ff4444');
            return;
        }
        this.sendCheat('setSpeed', { speed: s });
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

    // ---- CHEAT COMMAND HANDLING ----

    /** Apply a cheat command received from the network (all clients run this) */
    private applyCheatCommand(cmd: GameCommand): void {
        const { cheatType } = cmd.data;
        const team = cmd.team;

        switch (cheatType) {
            case 'addResource': {
                const { resourceType, amount } = cmd.data;
                // Add resources to the commanding team's state (deterministic for all clients)
                const ts = this.teamStatesMap.get(team) ?? this.playerState;
                switch (resourceType) {
                    case 'food': ts.addResource(ResourceType.Food, amount); break;
                    case 'wood': ts.addResource(ResourceType.Wood, amount); break;
                    case 'gold': ts.addResource(ResourceType.Gold, amount); break;
                    case 'stone': ts.addResource(ResourceType.Stone, amount); break;
                }
                break;
            }
            case 'reveal': {
                this.fogEnabled = false;
                this.entityManager.fog = null;
                audioSystem.setFogOfWar(null as any);
                break;
            }
            case 'toggleFog': {
                this.fogEnabled = !this.fogEnabled;
                this.entityManager.fog = this.fogEnabled ? this.fog : null;
                audioSystem.setFogOfWar(this.fogEnabled ? this.fog : null as any);
                break;
            }
            case 'setSpeed': {
                const { speed } = cmd.data;
                this.gameSpeed = speed;
                break;
            }
            case 'gg': {
                // Reveal + full resources for the commanding team + speed 3x
                this.fogEnabled = false;
                this.entityManager.fog = null;
                audioSystem.setFogOfWar(null as any);
                this.gameSpeed = 3;
                const ggTs = this.teamStatesMap.get(team) ?? this.playerState;
                ggTs.addResource(ResourceType.Food, 99999);
                ggTs.addResource(ResourceType.Wood, 99999);
                ggTs.addResource(ResourceType.Gold, 99999);
                ggTs.addResource(ResourceType.Stone, 99999);
                break;
            }

            // ---- SPAWN CHEATS (both host and player can use) ----

            case 'spawn': {
                const { unitType, count } = cmd.data;
                // Find Town Center for this team to spawn near it
                const tc = this.entityManager.buildings.find(b => b.team === team && b.alive);
                const baseX = tc ? tc.x : 400;
                const baseY = tc ? tc.y + 80 : 400;
                for (let i = 0; i < count; i++) {
                    // Deterministic circle pattern to avoid Math.random() desync
                    const angle = (i / Math.max(count, 1)) * Math.PI * 2;
                    const radius = 30 + (i % 5) * 15;
                    const sx = baseX + Math.cos(angle) * radius;
                    const sy = baseY + Math.sin(angle) * radius;
                    this.entityManager.spawnUnit(unitType, sx, sy, team);
                }
                break;
            }
            case 'spawnElite': {
                const { unitType, count } = cmd.data;
                const tc2 = this.entityManager.buildings.find(b => b.team === team && b.alive);
                const baseX2 = tc2 ? tc2.x : 400;
                const baseY2 = tc2 ? tc2.y + 80 : 400;
                for (let i = 0; i < count; i++) {
                    const angle = (i / Math.max(count, 1)) * Math.PI * 2;
                    const radius = 30 + (i % 5) * 15;
                    const sx = baseX2 + Math.cos(angle) * radius;
                    const sy = baseY2 + Math.sin(angle) * radius;
                    this.entityManager.spawnUnit(unitType, sx, sy, team);
                }
                break;
            }
        }
    }

    /** Send a cheat command (host only in multiplayer, except spawn/spawnElite) */
    private sendCheat(cheatType: string, args?: Record<string, any>): void {
        if (this.isMultiplayer) {
            // spawn/spawnElite: both host and player can use
            const anyoneCanUse = cheatType === 'spawn' || cheatType === 'spawnElite';
            if (!this.isHost && !anyoneCanUse) return; // Only host can use other cheats
            this.sendCommand(cmdCheat(this.myTeam, cheatType, args));
        } else {
            // Singleplayer: apply directly as a fake command
            this.applyCheatCommand({
                type: CommandType.CHEAT,
                playerId: '',
                team: this.myTeam,
                tick: 0,
                data: { cheatType, ...args },
            });
        }
    }

    addResource(type: string, amount: number): void {
        if (this.isMultiplayer && !this.isHost) {
            this.console.log('❌ Chỉ host mới dùng được lệnh này', '#ff4444');
            return;
        }
        this.sendCheat('addResource', { resourceType: type, amount });
    }

    revealMap(): void {
        if (this.isMultiplayer && !this.isHost) {
            this.console.log('❌ Chỉ host mới dùng được lệnh này', '#ff4444');
            return;
        }
        this.sendCheat('reveal');
    }

    toggleFog(): void {
        if (this.isMultiplayer && !this.isHost) {
            this.console.log('❌ Chỉ host mới dùng được lệnh này', '#ff4444');
            return;
        }
        this.sendCheat('toggleFog');
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
        this.sendCheat('spawn', { unitType: ut, count });
    }

    spawnElite(count: number): void {
        // Resolve elite type locally before sending — ensures all clients get the same unit type
        const playerCiv = this.entityManager.playerCiv;
        const eliteType = CIV_ELITE_UNIT[playerCiv];
        this.sendCheat('spawnElite', { unitType: eliteType, count });
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
