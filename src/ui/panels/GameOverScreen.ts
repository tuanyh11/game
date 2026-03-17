// ============================================================
//  GameOverScreen — Victory / Defeat overlay
//  Extracted from GameUI.ts
// ============================================================

import { C } from "../../config/GameConfig";
import { roundRect } from "../UIHelpers";
import { t } from '../../i18n/i18n';

export interface GameOverContext {
    isVictory: boolean;
    viewportWidth: number;
    viewportHeight: number;
    mouseX: number;
    mouseY: number;
}

export function renderGameOverScreen(ctx: CanvasRenderingContext2D, go: GameOverContext): void {
    const { isVictory, viewportWidth: w, viewportHeight: h, mouseX, mouseY } = go;

    const color = isVictory ? '#c2185b' : '#f87171'; // Crimson or soft red
    const colorDim = isVictory ? 'rgba(194,24,91,0.2)' : 'rgba(248,113,113,0.2)';

    // Glassmorphism radial overlay
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
    grad.addColorStop(0, 'rgba(22, 22, 26, 0.95)');
    grad.addColorStop(1, 'rgba(10, 10, 12, 0.99)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Giant Background Kanji (Subtle)
    ctx.font = "300px 'Noto Serif JP', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillText(isVictory ? '勝' : '敗', w / 2, h / 2 - 20);

    // Main Title Kanji
    ctx.font = "80px 'Noto Serif JP', serif";
    ctx.fillStyle = colorDim;
    ctx.fillText(isVictory ? '勝利' : '敗北', w / 2, h / 2 - 100);

    // Main Text (Vietnamese)
    ctx.font = "600 42px 'Inter', sans-serif";
    ctx.letterSpacing = "6px";
    const text = isVictory ? t('gameover.victory') : t('gameover.defeat');
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 - 20);
    ctx.letterSpacing = "0px";

    // Decorative separating line
    const gradLine = ctx.createLinearGradient(w / 2 - 150, 0, w / 2 + 150, 0);
    gradLine.addColorStop(0, 'rgba(194,24,91,0)');
    gradLine.addColorStop(0.5, color);
    gradLine.addColorStop(1, 'rgba(194,24,91,0)');
    ctx.fillStyle = gradLine;
    ctx.fillRect(w / 2 - 150, h / 2 + 20, 300, 1);

    // Exit Button
    const btnW = 200;
    const btnH = 44;
    const btnX = w / 2 - btnW / 2;
    const btnY = h / 2 + 60;

    const isHover = (mouseX >= btnX && mouseX <= btnX + btnW &&
        mouseY >= btnY && mouseY <= btnY + btnH);

    // Button background
    ctx.fillStyle = isHover ? C.uiButtonHover : C.uiButton;
    roundRect(ctx, btnX, btnY, btnW, btnH, 4);
    ctx.fill();

    // Button border
    ctx.strokeStyle = isHover ? C.uiBorderLight : C.uiBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, btnX, btnY, btnW, btnH, 4);
    ctx.stroke();

    // Button Glow
    if (isHover) {
        ctx.shadowColor = C.uiBorderLight;
        ctx.shadowBlur = 10;
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Button text
    ctx.fillStyle = isHover ? C.uiTextBright : C.uiTextDim;
    ctx.font = "600 13px 'Inter', sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(t('gameover.backToMenu'), w / 2, btnY + btnH / 2 + 2);
    ctx.letterSpacing = "0px";

    // Reset text align
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}
