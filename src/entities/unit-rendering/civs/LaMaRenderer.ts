// ============================================================
//  La Mã (Roman) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish } from "../draw-swords-finish";

// ======== LA MÃ SCOUT — Roman Equites (mounted scout with spear) ========
export function drawScout_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Cape — civ colored
    if (age >= 2) {
        ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid;
        const capeWave = moving ? Math.sin(unit.animTimer * 14) * 2 : 0;
        ctx.fillRect(-8, -2 + bob, 3, 14 + capeWave);
        if (age >= 4) {
            ctx.fillStyle = cv.secondary;
            ctx.fillRect(-8, -2 + bob, 3, 1); // gold clasp
        }
    }

    // Body — CIV COLORED Roman leather armor
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    // Leather straps
    ctx.fillStyle = age >= 4 ? '#5a4020' : '#4a3020';
    ctx.fillRect(-4, 0 + bob, 2, 9);
    ctx.fillRect(2, -3 + bob, 2, 8);
    // Gold belt buckle
    if (age >= 2) {
        ctx.fillStyle = cv.secondary;
        ctx.fillRect(-5, 5 + bob, 10, 2);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, 4 + bob, 2, 3);
    }
    // Pteruges (leather skirt)
    if (age >= 3) {
        ctx.fillStyle = cv.bodyLight;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-5 + i * 3, 7 + bob, 2, 3);
        }
    }
    // Shoulder plates (age 3+)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58';
        ctx.fillRect(-7, -4 + bob, 3, 6);
        ctx.fillRect(5, -4 + bob, 3, 6);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-7, -4 + bob, 3, 1);
            ctx.fillRect(5, -4 + bob, 3, 1);
        }
    }

    // Small round shield (parma) — civ colored
    if (age >= 2) {
        ctx.fillStyle = cv.bodyLight;
        ctx.beginPath();
        ctx.arc(-7, 2 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cv.secondary;
        ctx.beginPath();
        ctx.arc(-7, 2 + bob, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -9 + bob, 2, 2);

    // Roman cavalry helmet
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58';
        ctx.fillRect(-5, -15 + bob, 10, 5);
        // Cheek guards
        ctx.fillRect(-6, -11 + bob, 2, 4);
        ctx.fillRect(4, -11 + bob, 2, 4);
        // Red crest
        ctx.fillStyle = age >= 4 ? '#dd2222' : '#aa3333';
        ctx.fillRect(-1, -19 + bob, 2, 5);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-5, -15 + bob, 10, 1);
        }
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(-4, -14 + bob, 8, 3);
    }

    // Short lance/javelin — quality improves
    ctx.fillStyle = age >= 3 ? '#4a3a20' : '#5a3a10';
    ctx.fillRect(5, -6 + bob, 2, 14);
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : age >= 3 ? '#ddd' : '#ccc';
    ctx.beginPath();
    ctx.moveTo(5, -12 + bob);
    ctx.lineTo(6, -6 + bob);
    ctx.lineTo(7, -12 + bob);
    ctx.closePath();
    ctx.fill();
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#ffd700' : '#aaa';
        ctx.fillRect(4, -6 + bob, 4, 2);
    }
    if (age >= 4) {
        // Lance shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(6, -10 + bob, 1, 4);
    }

    // Legs — civ colored
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    ctx.fillStyle = age >= 4 ? '#6a6a68' : '#4a4a48';
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 3) { ctx.globalAlpha = 0.15; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-10 - i * 4, -4 + bob + i * 5); ctx.lineTo(-14 - i * 4, -4 + bob + i * 5); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== LA MÃ SWORDSMAN — Legionnaire (Lính lê dương) ========
export function drawSwords_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    // Body — lorica segmentata
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-7, -5 + bob, 14, 16);
    // Segmented plate bands
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(-6, -4 + bob + i * 2.5, 12, 1);
    }
    // Tunic showing at bottom
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5, 8 + bob, 10, 4);
    // Pteruges (leather strips)
    if (age >= 2) {
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-7, 8 + bob, 14, 2);
        ctx.fillStyle = cv.bodyDark;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-6 + i * 3, 10 + bob, 2, 3);
        }
    }
    // Shoulder plates
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58';
        ctx.fillRect(-9, -6 + bob, 5, 8);
        ctx.fillRect(4, -6 + bob, 5, 8);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-9, -6 + bob, 5, 1);
            ctx.fillRect(4, -6 + bob, 5, 1);
        }
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -11 + bob, 2, 2);

    // Roman galea
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58';
        ctx.fillRect(-6, -18 + bob, 12, 6);
        // Cheek guards
        ctx.fillRect(-7, -12 + bob, 3, 5);
        ctx.fillRect(4, -12 + bob, 3, 5);
        // Red crest (transverse for centurion at age4)
        ctx.fillStyle = cv.bodyLight;
        ctx.fillRect(-1, -24 + bob, 2, 8);
        ctx.fillRect(-3, -23 + bob, 6, 2);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-6, -18 + bob, 12, 1);
        }
    } else if (age >= 2) {
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(-5, -16 + bob, 10, 5);
        ctx.fillStyle = '#333';
        ctx.fillRect(-3, -12 + bob, 6, 1);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(-5, -15 + bob, 10, 4);
    }

    // Scutum shield (left) — tall rectangular
    if (age >= 2) {
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-12, -5 + bob, 6, age >= 3 ? 18 : 14);
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-11, 2 + bob, 4, 4);
        if (age >= 3) {
            // Golden eagle wings
            ctx.fillRect(-11, -1 + bob, 4, 1);
            ctx.fillRect(-11, 5 + bob, 4, 1);
            ctx.strokeStyle = '#daa520';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-12, -5 + bob, 6, 18);
        }
    }

    // Gladius (right) — short Roman sword
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(7, -1 + bob, 2, 6); // handle
    ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
    ctx.fillRect(6, -12 + bob, 4, 12); // shorter blade
    // Leaf-shaped point
    ctx.beginPath();
    ctx.moveTo(8, -14 + bob);
    ctx.lineTo(6, -12 + bob);
    ctx.lineTo(10, -12 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#888';
    ctx.fillRect(4, -1 + bob, 8, 2); // guard
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(6, -12 + bob, 1, 12);

    // Legs
    ctx.fillStyle = age >= 3 ? '#3a3a38' : '#5a4a38';
    ctx.fillRect(-5, 11, 4, 6 + legOff);
    ctx.fillRect(1, 11, 4, 6 - legOff);
    // Caligae sandals
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(-6, 15 + legOff, 5, 3);
    ctx.fillRect(0, 15 - legOff, 5, 3);

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
}
