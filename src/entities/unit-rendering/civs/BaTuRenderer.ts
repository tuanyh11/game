// ============================================================
//  Ba Tư (Persian) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish } from "../draw-swords-finish";

// ======== BA TƯ SCOUT — Desert Rider with curved saber ========
export function drawScout_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Flowing desert cape (behind body) — grows with age
    if (age >= 2) {
        ctx.fillStyle = cv.bodyDark + '88';
        const capeWave = moving ? Math.sin(unit.animTimer * 14) * 3 : 0;
        const capeLen = age >= 4 ? 18 : age >= 3 ? 16 : 14;
        ctx.fillRect(-9, -2 + bob, 4, capeLen + capeWave);
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-9, -2 + bob, 1, capeLen + capeWave); // accent edge
        if (age >= 3) {
            // Cape pattern
            ctx.fillStyle = 'rgba(255,215,0,0.12)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-8, 2 + bob + i * 4, 2, 2);
            }
        }
    }

    // Body — CIV COLORED with golden trim
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    // Golden sash (BaTu accent)
    ctx.fillStyle = cv.accent;
    ctx.fillRect(-5, 2 + bob, 10, 2);
    // Scale pattern
    if (age >= 2) {
        ctx.fillStyle = 'rgba(255,215,0,0.15)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-4, -3 + bob + i * 3, 8, 1);
        }
    }
    // Shoulder guards (age 3+)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#c9a040' : '#8a6a30';
        ctx.fillRect(-7, -4 + bob, 3, 5);
        ctx.fillRect(5, -4 + bob, 3, 5);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-7, -4 + bob, 3, 1);
            ctx.fillRect(5, -4 + bob, 3, 1);
        }
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -8 + bob, 2, 2);

    // Turban with jewel — grows more ornate with age
    ctx.fillStyle = age >= 4 ? '#f0e8d0' : age >= 3 ? '#e8e0c8' : '#e0d8c0';
    ctx.fillRect(-4, -14 + bob, 8, 4);
    ctx.fillRect(-3, -16 + bob, 6, 3);
    ctx.fillStyle = age >= 4 ? '#ff2222' : '#ff4444';
    ctx.fillRect(0, -14 + bob, 3, 3); // jewel
    if (age >= 3) {
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-4, -10 + bob, 8, 1); // gold band
        // Feather
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(3, -17 + bob, 2, 5);
        if (age >= 4) {
            // Second feather + gold tip
            ctx.fillRect(1, -18 + bob, 2, 4);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(3, -17 + bob, 2, 1);
            ctx.fillRect(1, -18 + bob, 2, 1);
        }
    }

    // Curved scimitar weapon — blade quality improves with age
    ctx.fillStyle = cv.accent;
    ctx.fillRect(5, -2 + bob, 2, 4); // handle
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : age >= 3 ? '#ddd' : '#ccc';
    ctx.beginPath();
    ctx.moveTo(5, -10 + bob);
    ctx.quadraticCurveTo(9, -4 + bob, 6, -1 + bob);
    ctx.lineTo(8, -1 + bob);
    ctx.quadraticCurveTo(11, -4 + bob, 7, -10 + bob);
    ctx.closePath();
    ctx.fill();
    if (age >= 3) {
        ctx.fillStyle = cv.accent;
        ctx.fillRect(4, -2 + bob, 4, 2); // gold guard
    }
    if (age >= 4) {
        // Blade shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(6, -8 + bob, 1, 6);
        // Arm bracelet
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, 0 + bob, 3, 1);
    }

    // Legs — flowing pants
    ctx.fillStyle = cv.secondary;
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    // Pointed shoes — better with age
    ctx.fillStyle = age >= 4 ? '#8a6a40' : '#6a5030';
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

    // Upgrade stars + effects
    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 2) { ctx.globalAlpha = 0.15; ctx.fillStyle = cv.accent; for (let i = 0; i < 3; i++) { ctx.fillRect(-12 - i * 3, 10 + bob + i * 3, 4, 2); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.08; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== BA TƯ SWORDSMAN — Immortal (Bất Tử) with scimitar ========
export function drawSwords_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    // Body — scale armor with gold trim
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.bodyMid;
    ctx.fillRect(-7, -5 + bob, 14, 16);
    // Scale pattern
    ctx.fillStyle = 'rgba(201,168,76,0.15)';
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 4; c++) {
            ctx.fillRect(-5 + c * 3 + (r % 2), -3 + bob + r * 3, 2, 2);
        }
    }
    // Gold sash
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-7, 4 + bob, 14, 3);
    if (age >= 3) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-7, -5 + bob, 14, 2); // gold collar
        ctx.fillRect(-7, 8 + bob, 14, 2); // gold hem
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -8 + bob, 2, 2);

    // Persian helmet — conical with chain veil
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#c9a84c' : '#9a8040';
        ctx.fillRect(-5, -15 + bob, 10, 5);
        // Conical top
        ctx.beginPath();
        ctx.moveTo(-3, -15 + bob);
        ctx.lineTo(0, -21 + bob);
        ctx.lineTo(3, -15 + bob);
        ctx.closePath();
        ctx.fill();
        // Chain veil (aventail)
        ctx.fillStyle = '#7a7a78';
        ctx.fillRect(-5, -10 + bob, 10, 4);
        ctx.fillStyle = 'rgba(120,120,120,0.3)';
        ctx.fillRect(-5, -8 + bob, 10, 1);
    } else if (age >= 2) {
        ctx.fillStyle = '#9a8040';
        ctx.fillRect(-4, -14 + bob, 8, 5);
    } else {
        // Turban with cloth wrap
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(-4, -15 + bob, 8, 5);
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-4, -15 + bob, 8, 2);
    }

    // Scimitar (right) — curved blade
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(7, -2 + bob, 2, 8);
    ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
    ctx.beginPath();
    ctx.moveTo(7, -14 + bob);
    ctx.quadraticCurveTo(12, -6 + bob, 8, -2 + bob);
    ctx.lineTo(10, -2 + bob);
    ctx.quadraticCurveTo(14, -6 + bob, 9, -14 + bob);
    ctx.closePath();
    ctx.fill();
    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(5, -2 + bob, 8, 2); // golden guard
    }

    // Round shield (left)
    if (age >= 2) {
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(-8, 2 + bob, age >= 3 ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-8, 2 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Legs
    ctx.fillStyle = age >= 3 ? '#4a4a48' : '#6a5040';
    ctx.fillRect(-5, 11, 4, 6 + legOff);
    ctx.fillRect(1, 11, 4, 6 - legOff);

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
}
