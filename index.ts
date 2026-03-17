/**
 * Entry point — Pixel Empires RTS
 * Shows main menu first, then starts game with selected map.
 * Supports returning to the menu from in-game settings.
 * Supports multiplayer mode via Elysia WebSocket server.
 */
import { Game, AISlotConfig } from "./src/core/Game";
import { MainMenu } from "./src/ui/MainMenu";
import { MapPreset } from "./src/map/TileMap";
import { CivilizationType } from "./src/config/GameConfig";
import { AIDifficulty } from "./src/systems/AIController";
import type { NetworkLobby } from "./src/network/NetworkLobby";
import type { RoomState, RoomPlayer } from './server/types';
import { audioSystem } from './src/systems/AudioSystem';

const originalArc = CanvasRenderingContext2D.prototype.arc;
CanvasRenderingContext2D.prototype.arc = function (x, y, r, sa, ea, counterclockwise) {
    if (isNaN(x) || isNaN(y) || isNaN(r) || isNaN(sa) || isNaN(ea)) {
        console.error("CANVAS ARC NaN ERROR", arguments);
        console.trace();
    }
    return originalArc.call(this, x, y, r, sa, ea, counterclockwise);
};
const originalLineTo = CanvasRenderingContext2D.prototype.lineTo;
CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
    if (isNaN(x) || isNaN(y)) {
        console.error("CANVAS LINETO NaN ERROR", arguments);
        console.trace();
    }
    return originalLineTo.call(this, x, y);
};
const originalMoveTo = CanvasRenderingContext2D.prototype.moveTo;
CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
    if (isNaN(x) || isNaN(y)) {
        console.error("CANVAS MOVETO NaN ERROR", arguments);
        console.trace();
    }
    return originalMoveTo.call(this, x, y);
};

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
if (!canvas) throw new Error("Canvas #gameCanvas not found");

let currentGame: Game | null = null;
let currentMenu: MainMenu | null = null;

function startMenu(): void {
    // Get a fresh canvas (clone to strip old listeners)
    const oldCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const newCanvas = oldCanvas.cloneNode(true) as HTMLCanvasElement;
    oldCanvas.parentNode!.replaceChild(newCanvas, oldCanvas);
    newCanvas.id = "gameCanvas";

    const menu = new MainMenu(newCanvas);
    currentMenu = menu;

    menu.setOnStart((preset: MapPreset, playerCiv: CivilizationType, aiSlots: AISlotConfig[], freeMode: boolean, playerColor: string) => {
        currentMenu = null;
        startGame(preset, playerCiv, aiSlots, freeMode, playerColor);
    });

    // Multiplayer start callback
    menu.setOnMultiplayerStart((room: RoomState, players: RoomPlayer[], seed: number, myPlayerId: string, myTeam: number, lobby: NetworkLobby) => {
        currentMenu = null;
        startMultiplayerGame(room, players, seed, myPlayerId, myTeam, lobby);
    });

    menu.start();
    // Play menu background music
    audioSystem.playBGM('/musics/Rites.mp3', 0.3);
    console.log("🎮 Pixel Empires — Main Menu loaded!");
}


function startGame(preset: MapPreset, playerCiv: CivilizationType, aiSlots: AISlotConfig[], freeMode: boolean = false, playerColor: string = '', onReady?: () => void, seed?: number, skipAutoStart: boolean = false): void {
    const loadingScreen = document.getElementById("loading-screen");
    const loadingText = document.getElementById("loading-text");
    const loadingPercent = document.getElementById("loading-percentage");
    const loadingBarFill = document.getElementById("loading-bar-fill");

    if (loadingScreen) {
        loadingScreen.classList.add("visible");
        if (loadingText) loadingText.textContent = "Đang chuẩn bị dữ liệu...";
        if (loadingPercent) loadingPercent.textContent = "0%";
        if (loadingBarFill) loadingBarFill.style.width = "0%";
    }

    // Give the browser time to render the loading UI before blocking the main thread
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setTimeout(async () => {
                // Clone canvas *now* to strip menu listeners, when the loading screen is already visible
                const menuCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
                const gameCanvas = menuCanvas.cloneNode(true) as HTMLCanvasElement;
                menuCanvas.parentNode!.replaceChild(gameCanvas, menuCanvas);
                gameCanvas.id = "gameCanvas";

                const game = new Game("gameCanvas", preset, playerCiv, aiSlots, freeMode, playerColor, seed);
                currentGame = game;
                // Stop menu BGM when game starts
                audioSystem.stopBGM();

                // Wire exit-to-menu callback
                game.setOnExitToMenu(() => {
                    currentGame = null;
                    console.log("🏠 Returning to Main Menu...");
                    startMenu();
                });

                // Run async initialization (Map generation -> Terrain Canvas -> Entities)
                await game.init((percent: number, stepName?: string) => {
                    if (loadingPercent) {
                        loadingPercent.textContent = `${Math.floor(percent)}%`;
                    }
                    if (loadingBarFill) {
                        loadingBarFill.style.width = `${percent}%`;
                    }
                    if (loadingText && stepName) {
                        loadingText.textContent = stepName;
                    }
                });

                // Call multiplayer setup callback if provided
                if (onReady) onReady();

                // In multiplayer (skipAutoStart), don't start game loop or hide loading screen
                // The caller will do that after ALL_LOADED
                if (!skipAutoStart) {
                    game.start();

                    // Hide loading screen after map is built and game is running
                    if (loadingScreen) {
                        loadingScreen.classList.add("fade-out");
                        loadingScreen.classList.remove("visible");
                        setTimeout(() => {
                            loadingScreen.classList.remove("fade-out");
                        }, 500); // Clean up after transition
                    }
                }
            }, 50); // Small delay guarantees the style recalculation and paint are flushed
        });
    });
}

// --- Multiplayer game start ---
function startMultiplayerGame(room: RoomState, players: RoomPlayer[], seed: number, myPlayerId: string, myTeam: number, lobby: NetworkLobby): void {
    // Determine map preset from room config
    const preset = (room.config.mapPreset as MapPreset) || MapPreset.Grasslands;

    // *** CRITICAL: Both clients must create the EXACT same game configuration ***
    // Sort players by SLOT to ensure consistent ordering across all clients
    const sortedPlayers = [...players].sort((a, b) => a.slot - b.slot);

    // Slot 0 player is ALWAYS the "player" in Game constructor (internal team 0)
    const slot0Player = sortedPlayers.find(p => p.slot === 0)!;
    const playerCiv = slot0Player?.civIndex !== undefined && slot0Player.civIndex >= 0
        ? Object.values(CivilizationType)[slot0Player.civIndex] ?? CivilizationType.LaMa
        : CivilizationType.LaMa;
    const playerColor = slot0Player?.color || '#4488ff';
    const slot0LobbyTeam = slot0Player?.team ?? 0; // Lobby team of slot 0

    // All other players become AI slots ordered by slot number
    // CRITICAL: team = slot number (not alliance group!) to match setupMultiplayer expectations
    const difficultyMap = [AIDifficulty.Easy, AIDifficulty.Normal, AIDifficulty.Hard];
    const otherPlayers = sortedPlayers.filter(p => p.slot !== 0);
    const aiSlots: AISlotConfig[] = otherPlayers.map(p => ({
        team: p.slot, // MUST be slot number for internal team mapping
        civ: p.civIndex >= 0 ? Object.values(CivilizationType)[p.civIndex] ?? null : null,
        difficulty: difficultyMap[(p as any).aiDifficulty] ?? AIDifficulty.Normal,
        color: p.color,
    }));

    const myPlayer = players.find(p => p.id === myPlayerId);
    const isHost = myPlayer?.isHost ?? false;

    // Start game through normal flow, passing the server seed for deterministic generation
    // skipAutoStart = true: don't start game loop until ALL_LOADED
    startGame(preset, playerCiv, aiSlots, false, playerColor, () => {
        // After game is initialized, configure multiplayer
        if (currentGame) {
            currentGame.setupMultiplayer(lobby.networkClient, myTeam, isHost, sortedPlayers, myPlayerId);
            console.log(`🌐 Multiplayer game loaded! Room: ${room.roomId}, Slot: ${myTeam}, Host: ${isHost}`);

            // Show "waiting for other players" on the loading screen
            const loadingText = document.querySelector('.loading-text');
            const loadingPercent = document.querySelector('.loading-percent');
            if (loadingText) loadingText.textContent = 'Đang chờ người chơi khác...';
            if (loadingPercent) loadingPercent.textContent = '✓';

            // Tell server we're done loading
            lobby.networkClient.sendPlayerLoaded();

            // Wait for ALL_LOADED from server before starting game loop
            const nc = lobby.networkClient;
            const prevHandlers = { ...nc['handlers'] };
            nc.setHandlers({
                ...prevHandlers,
                onAllLoaded: () => {
                    console.log('🚀 All players loaded! Starting game loop...');
                    // Restore previous handlers (without onAllLoaded)
                    nc.setHandlers(prevHandlers);
                    // Now start the game
                    if (currentGame) {
                        currentGame.start();
                    }
                    // Hide loading screen
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) {
                        loadingScreen.classList.add('fade-out');
                        loadingScreen.classList.remove('visible');
                        setTimeout(() => {
                            loadingScreen.classList.remove('fade-out');
                        }, 500);
                    }
                },
            });
        }
    }, seed, true); // <-- pass the seed + skipAutoStart for multiplayer
}

// Boot up the main menu
startMenu();
