// ============================================================
//  Shared swordsman finish — upgrade stars + age 4 aura
//  Extracted from UnitRenderer.ts
// ============================================================

import type { Unit } from "../Unit";
import type { CivColors } from "./shared";

// Shared finish: upgrade stars + age4 aura
export function drawSwordsFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -25 + bob);
    }
    if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawSpearsFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -27 + bob); // slightly higher for spears
    }
    if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawArchersFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -24 + bob);
    }
    if (age >= 4) {
        // Outer glow
        ctx.globalAlpha = 0.04 + Math.sin(unit.animTimer * 3) * 0.02;
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2); ctx.fill();
        // Inner glow
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 4 + 1) * 0.03;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(0, -2 + bob, 10, 0, Math.PI * 2); ctx.fill();
        // Bow glow
        ctx.globalAlpha = 0.1 + Math.sin(unit.animTimer * 5) * 0.05;
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(9, 0 + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawKnightsFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        // Knights are taller, so float stars higher
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -35 + bob);
    }
    if (age >= 4) {
        // Large horse aura
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 2) * 0.03;
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.ellipse(0, 5 + bob, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}
