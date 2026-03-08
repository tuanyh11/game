/**
 * Entry point — Pixel Empires RTS
 * Shows main menu first, then starts game with selected map.
 * Supports returning to the menu from in-game settings.
 */
import { Game, AISlotConfig } from "./src/core/Game";
import { MainMenu } from "./src/ui/MainMenu";
import { MapPreset } from "./src/map/TileMap";
import { CivilizationType } from "./src/config/GameConfig";

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

    menu.start();
    console.log("🎮 Pixel Empires — Main Menu loaded!");
}


function startGame(preset: MapPreset, playerCiv: CivilizationType, aiSlots: AISlotConfig[], freeMode: boolean = false, playerColor: string = ''): void {
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

                const game = new Game("gameCanvas", preset, playerCiv, aiSlots, freeMode, playerColor);
                currentGame = game;

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

                game.start();

                const allies = aiSlots.filter(s => s.team === 1).length;
                const enemies = aiSlots.filter(s => s.team === 2).length;
                console.log(`🏰 Pixel Empires — Map: ${preset}, Civ: ${playerCiv}, ${enemies} enemies, ${allies} allies`);
                console.log("Controls:");
                console.log("  Left click: Select units/buildings");
                console.log("  Right click: Move / Gather / Attack");
                console.log("  WASD / Arrows / Edge scroll: Pan camera");
                console.log("  Escape / F10: Settings menu");

                // Hide loading screen after map is built and game is running
                if (loadingScreen) {
                    loadingScreen.classList.add("fade-out");
                    loadingScreen.classList.remove("visible");
                    setTimeout(() => {
                        loadingScreen.classList.remove("fade-out");
                    }, 500); // Clean up after transition
                }
            }, 50); // Small delay guarantees the style recalculation and paint are flushed
        });
    });
}

// Boot up the main menu
startMenu();
