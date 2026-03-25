// ============================================================
//  TopBar — Resource bar at the top of the game screen
//  Extracted from GameUI.ts
// ============================================================

import { C, CIVILIZATION_DATA } from "../../config/GameConfig";
import { IS_IOS } from "../../config/PlatformConfig";
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
    setTooltip: (tip: { x: number; y: number; lines: string[] }) => void;
}

export function renderTopBar(ctx: CanvasRenderingContext2D, vpW: number, tb: TopBarContext): void {
    const { topBarH, playerState, entityManager, loop, showFPS, tradeUI, clickAreas, isHovered, setTooltip } = tb;

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
    const isiOS = IS_IOS;
    const fontSize = isiOS ? 10 : 14;
    const iconFont = isiOS ? 10 : 14;
    const y = isiOS ? 17 : 24;

    // Resource items
    const items: [string, string, string, number][] = isiOS
        ? [['G', t('topbar.gold'), C.gold, Math.floor(res.gold)],
           ['S', t('topbar.supplies'), C.wood, Math.floor(res.supplies)]]
        : [['🪙', t('topbar.gold'), C.gold, Math.floor(res.gold)],
           ['📦', t('topbar.supplies'), C.wood, Math.floor(res.supplies)]];

    let x = isiOS ? 8 : 14;
    for (const [icon, name, color, val] of items) {
        const itemStartX = x;
        // Icon
        ctx.fillStyle = color;
        ctx.font = `${iconFont}px ${isiOS ? "'Inter', sans-serif" : "sans-serif"}`;
        ctx.fillText(icon, x, y);
        x += isiOS ? 12 : 20;
        // Value
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
        ctx.fillText(`${val}`, x, y);
        x += isiOS ? 40 : 60;
        // Separator dot
        ctx.fillStyle = C.uiSeparator;
        ctx.fillRect(x, isiOS ? 6 : 12, 1, isiOS ? 10 : 14);
        x += isiOS ? 6 : 10;

        // Tooltip on hover
        const itemW = x - itemStartX - (isiOS ? 6 : 10);
        if (isHovered(itemStartX, 4, itemW, topBarH - 8)) {
            setTooltip({
                x: itemStartX + itemW / 2,
                y: topBarH + 4,
                lines: [`${name}: ${val}`],
            });
        }
    }

    // Population
    ctx.fillStyle = C.uiText;
    ctx.font = `bold ${isiOS ? 10 : 13}px 'Inter', sans-serif`;
    const popColor = playerState.population >= playerState.maxPopulation ? C.uiTextRed : C.uiTextGreen;
    ctx.fillStyle = popColor;
    const popIcon = isiOS ? 'P' : '⚔';
    ctx.fillText(`${popIcon} ${playerState.population}`, x, y);
    ctx.fillStyle = C.uiTextDim;
    ctx.fillText(`/${playerState.maxPopulation}`, x + ctx.measureText(`${popIcon} ${playerState.population}`).width, y);
    x += isiOS ? 50 : 80;


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
