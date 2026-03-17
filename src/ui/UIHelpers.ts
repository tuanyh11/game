// ============================================================
//  UIHelpers — Shared canvas drawing utilities
//  Extracted from GameUI.ts for reuse across UI modules
// ============================================================

import { C } from "../config/GameConfig";

/**
 * Draw a Zen-style panel with subtle gradient and thin accent line.
 */
export function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    // Outer border
    ctx.fillStyle = C.uiBorderOuter;
    ctx.fillRect(x, y, w, h);
    // Thin top accent (crimson)
    ctx.fillStyle = C.uiBorderLight;
    ctx.fillRect(x, y, w, 1);
    // Inner fill
    ctx.fillStyle = C.uiBg;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    // Subtle inner glow (top)
    const grad = ctx.createLinearGradient(x, y + 1, x, y + 20);
    grad.addColorStop(0, 'rgba(194,24,91,0.04)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x + 1, y + 1, w - 2, 19);
}

/**
 * Draw a single-pixel vertical separator line.
 */
export function drawSeparator(ctx: CanvasRenderingContext2D, x: number, y: number, height: number): void {
    ctx.fillStyle = C.uiSeparator;
    ctx.fillRect(x, y, 1, height);
}

/**
 * Draw a rounded rectangle path (does NOT fill or stroke — caller must do that).
 */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Draw word-wrapped text within a given width.
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

/**
 * Draw a stat bar (HP, training progress, etc.).
 */
export function drawStatBar(
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
