// ============================================================
//  GameOverScreen — Victory / Defeat / Second Chance overlay
//  Extracted from GameUI.ts
// ============================================================

import { C } from "../../config/GameConfig";
import { roundRect } from "../UIHelpers";
import { t } from '../../i18n/i18n';

export interface GameOverContext {
    isVictory: boolean;
    isDefeatPrompt: boolean;   // true = show "Watch Ad" button
    adInProgress: boolean;     // true = ad is currently showing
    viewportWidth: number;
    viewportHeight: number;
    mouseX: number;
    mouseY: number;
}

// Export button hit areas so GameUI can detect clicks
export let secondChanceButtonArea = { x: 0, y: 0, w: 0, h: 0 };
export let skipButtonArea = { x: 0, y: 0, w: 0, h: 0 };
export let exitButtonArea = { x: 0, y: 0, w: 0, h: 0 };

export function renderGameOverScreen(ctx: CanvasRenderingContext2D, go: GameOverContext): void {
    const { isVictory, isDefeatPrompt, adInProgress, viewportWidth: w, viewportHeight: h, mouseX, mouseY } = go;

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

    // ---- Second Chance prompt (defeat_prompt state) ----
    if (isDefeatPrompt && !isVictory) {
        // "Watch Ad" button (gold/highlighted)
        const adBtnW = 280;
        const adBtnH = 48;
        const adBtnX = w / 2 - adBtnW / 2;
        const adBtnY = h / 2 + 50;
        secondChanceButtonArea = { x: adBtnX, y: adBtnY, w: adBtnW, h: adBtnH };

        const isAdHover = !adInProgress && (mouseX >= adBtnX && mouseX <= adBtnX + adBtnW &&
            mouseY >= adBtnY && mouseY <= adBtnY + adBtnH);

        // Gold gradient button
        const btnGrad = ctx.createLinearGradient(adBtnX, adBtnY, adBtnX, adBtnY + adBtnH);
        btnGrad.addColorStop(0, isAdHover ? '#3a3020' : '#2a2418');
        btnGrad.addColorStop(1, isAdHover ? '#2a2010' : '#1a180e');
        ctx.fillStyle = btnGrad;
        roundRect(ctx, adBtnX, adBtnY, adBtnW, adBtnH, 6);
        ctx.fill();

        ctx.strokeStyle = isAdHover ? '#daa520' : '#8b7020';
        ctx.lineWidth = isAdHover ? 2 : 1;
        roundRect(ctx, adBtnX, adBtnY, adBtnW, adBtnH, 6);
        ctx.stroke();

        if (isAdHover) {
            ctx.shadowColor = '#daa520';
            ctx.shadowBlur = 12;
            roundRect(ctx, adBtnX, adBtnY, adBtnW, adBtnH, 6);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Button text
        ctx.fillStyle = adInProgress ? '#888' : (isAdHover ? '#ffd700' : '#daa520');
        ctx.font = "600 14px 'Inter', sans-serif";
        ctx.letterSpacing = "1px";
        const adText = adInProgress ? t('gameover.adLoading') : t('gameover.watchAd');
        ctx.fillText(adText, w / 2, adBtnY + adBtnH / 2 + 2);
        ctx.letterSpacing = "0px";

        // Reward description
        ctx.fillStyle = '#71717a';
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillText(t('gameover.adReward'), w / 2, adBtnY + adBtnH + 18);

        // Skip button (smaller, dimmer)
        const skipBtnW = 160;
        const skipBtnH = 36;
        const skipBtnX = w / 2 - skipBtnW / 2;
        const skipBtnY = adBtnY + adBtnH + 40;
        skipButtonArea = { x: skipBtnX, y: skipBtnY, w: skipBtnW, h: skipBtnH };

        const isSkipHover = (mouseX >= skipBtnX && mouseX <= skipBtnX + skipBtnW &&
            mouseY >= skipBtnY && mouseY <= skipBtnY + skipBtnH);

        ctx.fillStyle = isSkipHover ? C.uiButtonHover : C.uiButton;
        roundRect(ctx, skipBtnX, skipBtnY, skipBtnW, skipBtnH, 4);
        ctx.fill();

        ctx.strokeStyle = isSkipHover ? '#666' : C.uiBorder;
        ctx.lineWidth = 1;
        roundRect(ctx, skipBtnX, skipBtnY, skipBtnW, skipBtnH, 4);
        ctx.stroke();

        ctx.fillStyle = isSkipHover ? C.uiTextDim : '#555';
        ctx.font = "500 12px 'Inter', sans-serif";
        ctx.fillText(t('gameover.skipDefeat'), w / 2, skipBtnY + skipBtnH / 2 + 2);

        // Clear exit button area (not used in prompt mode)
        exitButtonArea = { x: 0, y: 0, w: 0, h: 0 };
    } else {
        // ---- Normal Victory / Final Defeat: Exit Button ----
        // Clear second chance areas
        secondChanceButtonArea = { x: 0, y: 0, w: 0, h: 0 };
        skipButtonArea = { x: 0, y: 0, w: 0, h: 0 };

        const btnW = 200;
        const btnH = 44;
        const btnX = w / 2 - btnW / 2;
        const btnY = h / 2 + 60;
        exitButtonArea = { x: btnX, y: btnY, w: btnW, h: btnH };

        const isHover = (mouseX >= btnX && mouseX <= btnX + btnW &&
            mouseY >= btnY && mouseY <= btnY + btnH);

        ctx.fillStyle = isHover ? C.uiButtonHover : C.uiButton;
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();

        ctx.strokeStyle = isHover ? C.uiBorderLight : C.uiBorder;
        ctx.lineWidth = 1;
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.stroke();

        if (isHover) {
            ctx.shadowColor = C.uiBorderLight;
            ctx.shadowBlur = 10;
            roundRect(ctx, btnX, btnY, btnW, btnH, 4);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = isHover ? C.uiTextBright : C.uiTextDim;
        ctx.font = "600 13px 'Inter', sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText(t('gameover.backToMenu'), w / 2, btnY + btnH / 2 + 2);
        ctx.letterSpacing = "0px";
    }

    // Reset text align
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}
