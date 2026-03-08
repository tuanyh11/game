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
