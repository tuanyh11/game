// ============================================================
//  TopBar — Resource bar at the top of the game screen
//  Extracted from GameUI.ts
// ============================================================

import { C, CIVILIZATION_DATA } from "../../config/GameConfig";
import { t } from '../../i18n/i18n';
import type { PlayerState } from "../../systems/PlayerState";
import type { EntityManager } from "../../systems/EntityManager";
import type { GameLoop } from "../../core/GameLoop";

interface ClickArea {
    x: number; y: number; w: number; h: number;
    action: () => void;
}

export interface TopBarContext {
    topBarH: number;
    playerState: PlayerState;
    entityManager: EntityManager;
    loop: GameLoop;
    showFPS: boolean;
    tradeUI: { isVisible: boolean; toggle: () => void };
    clickAreas: ClickArea[];
    isHovered: (x: number, y: number, w: number, h: number) => boolean;
}

export function renderTopBar(ctx: CanvasRenderingContext2D, vpW: number, tb: TopBarContext): void {
    const { topBarH, playerState, entityManager, loop, showFPS, tradeUI, clickAreas, isHovered } = tb;

    // Background
    ctx.fillStyle = C.uiBorderOuter;
    ctx.fillRect(0, 0, vpW, topBarH);
    ctx.fillStyle = C.uiBg;
    ctx.fillRect(0, 2, vpW, topBarH - 4);
    // Bottom gold line
    ctx.fillStyle = C.uiBorderDark;
    ctx.fillRect(0, topBarH - 2, vpW, 1);
    ctx.fillStyle = C.uiBorder;
    ctx.fillRect(0, topBarH - 1, vpW, 1);

    const res = playerState.resources;
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
    const popColor = playerState.population >= playerState.maxPopulation ? C.uiTextRed : C.uiTextGreen;
    ctx.fillStyle = popColor;
    ctx.fillText(`⚔ ${playerState.population}`, x, y);
    ctx.fillStyle = C.uiTextDim;
    ctx.fillText(`/${playerState.maxPopulation}`, x + ctx.measureText(`⚔ ${playerState.population}`).width, y);
    x += 80;

    // Age
    ctx.fillStyle = C.uiHighlight;
    ctx.font = "bold 13px 'MedievalSharp', cursive";
    ctx.fillText(`⛨ ${playerState.ageName}`, x, y);
    x += ctx.measureText(`⛨ ${playerState.ageName}`).width + 15;

    // Civilization indicator
    const civData = CIVILIZATION_DATA[entityManager.playerCiv];
    ctx.fillStyle = civData.accentColor;
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillText(`${civData.icon} ${civData.name}`, x, y);
    x += ctx.measureText(`${civData.icon} ${civData.name}`).width + 15;

    // Trade Button
    if (playerState.hasTrade) {
        const btnW = 90;
        const btnH = 24;
        const btnX = x;
        const btnY = 6;
        const hovered = isHovered(btnX, btnY, btnW, btnH);

        ctx.fillStyle = hovered ? C.uiButtonHover : (tradeUI.isVisible ? C.uiHighlight : C.uiButton);
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = C.uiBorderLight;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.fillStyle = tradeUI.isVisible ? '#000' : '#fff';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(t('topbar.trade'), btnX + btnW / 2, btnY + 16);
        ctx.textAlign = 'left';

        clickAreas.push({
            x: btnX, y: btnY, w: btnW, h: btnH,
            action: () => { tradeUI.toggle(); }
        });
    }

    // FPS (right) — controlled by settings
    if (showFPS) {
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "11px 'Inter', sans-serif";
        ctx.textAlign = 'right';
        const fpsStr = `${loop.fps} FPS`;
        const msStr = `${loop.lastRenderTimeMs.toFixed(1)}ms (T:${loop.renderMetrics.terrain.toFixed(1)} E:${loop.renderMetrics.entities.toFixed(1)} P:${loop.renderMetrics.particles.toFixed(1)} F:${loop.renderMetrics.fog.toFixed(1)} U:${loop.renderMetrics.ui.toFixed(1)})`;
        ctx.fillText(fpsStr, vpW - 10, y - 14);
        ctx.fillText(msStr, vpW - 10, y - 2);
        ctx.textAlign = 'left';
    }
}
