// ============================================================
//  Viking (Norse) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish } from "../draw-swords-finish";

// ======== VIKING SCOUT — Berserker Scout with dual axes ========
export function drawScout_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Wolf pelt cape (behind body)
    if (age >= 2) {
        ctx.fillStyle = '#5a4a2a';
        const capeWave = moving ? Math.sin(unit.animTimer * 14) * 2 : 0;
        ctx.fillRect(-9, -3 + bob, 4, 14 + capeWave);
        ctx.fillStyle = '#4a3a1a';
        ctx.fillRect(-9, -3 + bob, 4, 3); // fur texture top
    }

    // Muscular body — CIV COLORED chainmail
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.bodyMid;
    ctx.fillRect(-6, -4 + bob, 12, 13);
    // Fur vest over chainmail
    ctx.fillStyle = '#6a5a3a';
    ctx.fillRect(-6, -4 + bob, 12, 4);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(-6, -1 + bob, 12, 1);
    // Leather belt with pouches
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(-6, 5 + bob, 12, 2);
    // Pouch
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(3, 3 + bob, 3, 3);

    // War paint marks on body (age 3+) — civ accent
    if (age >= 3) {
        ctx.fillStyle = cv.accent + '44';
        ctx.fillRect(-3, -2 + bob, 2, 5);
        ctx.fillRect(1, -2 + bob, 2, 5);
        if (age >= 4) {
            // Extra war paint patterns
            ctx.fillStyle = cv.accent + '33';
            ctx.fillRect(-5, 1 + bob, 1, 4);
            ctx.fillRect(4, 1 + bob, 1, 4);
        }
    }
    // Bone necklace (age 4)
    if (age >= 4) {
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(-3, -4 + bob, 6, 1);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -4 + bob, 1, 1);
        ctx.fillRect(1, -4 + bob, 1, 1);
    }

    // Head — broader, fiercer
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    // Fierce eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, -9 + bob, 2, 2);
    ctx.fillRect(1, -9 + bob, 2, 2);
    // War paint on face — civ accent
    ctx.fillStyle = cv.accent + '88';
    ctx.fillRect(-4, -8 + bob, 2, 3);
    ctx.fillRect(3, -8 + bob, 2, 3);
    // Beard
    ctx.fillStyle = '#b89050';
    ctx.fillRect(-3, -5 + bob, 6, 3);

    // Hair/headgear
    if (age >= 3) {
        // Leather/iron helm
        ctx.fillStyle = age >= 4 ? '#5a5a58' : '#4a4a48';
        ctx.fillRect(-6, -16 + bob, 12, 5);
        // Nose guard
        ctx.fillStyle = '#6a6a68';
        ctx.fillRect(0, -13 + bob, 2, 4);
        if (age >= 4) {
            // Small horns
            ctx.fillStyle = '#ddd';
            ctx.fillRect(-8, -17 + bob, 2, 4);
            ctx.fillRect(6, -17 + bob, 2, 4);
        }
    } else {
        // Wild braided hair
        ctx.fillStyle = '#b89050';
        ctx.fillRect(-5, -16 + bob, 10, 5);
        ctx.fillRect(-6, -14 + bob, 2, 6); // left braid
        ctx.fillRect(4, -14 + bob, 2, 6); // right braid
    }

    // DUAL HAND AXES (distinctive Viking weapon)
    // Right axe — blade improves
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(5, -3 + bob, 2, 9); // handle
    ctx.fillStyle = age >= 4 ? '#eee' : age >= 3 ? '#ccc' : '#bbb';
    ctx.fillRect(5, -7 + bob, 4, 4); // axe head
    ctx.fillRect(7, -6 + bob, 2, 2); // blade edge

    // Left axe (in other hand)
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(-8, -2 + bob, 2, 8); // handle
    ctx.fillStyle = age >= 4 ? '#eee' : age >= 3 ? '#ccc' : '#bbb';
    ctx.fillRect(-10, -5 + bob, 4, 3); // axe head

    if (age >= 4) {
        // Runic glow on axes — pulsing
        ctx.globalAlpha = 0.4 + Math.sin(unit.animTimer * 5) * 0.2;
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(6, -6 + bob, 2, 2);
        ctx.fillRect(-9, -4 + bob, 2, 2);
        ctx.globalAlpha = 1;
    } else if (age >= 3) {
        // Iron edge gleam
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(8, -6 + bob, 1, 2);
        ctx.fillRect(-10, -5 + bob, 1, 2);
    }

    // Thick legs — fur-wrapped
    ctx.fillStyle = age >= 3 ? '#3a3a28' : '#4a4a38';
    ctx.fillRect(-5, 9, 4, 7 + legOffset);
    ctx.fillRect(1, 9, 4, 7 - legOffset);
    // Fur wraps
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(-5, 12 + legOffset, 4, 3);
    ctx.fillRect(1, 12 - legOffset, 4, 3);
    // Heavy boots
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-6, 14 + legOffset, 5, 3);
    ctx.fillRect(0, 14 - legOffset, 5, 3);

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 2) { ctx.globalAlpha = 0.15; ctx.fillStyle = '#8a7a60'; for (let i = 0; i < 3; i++) { ctx.fillRect(-12 - i * 3, 10 + bob + i * 3, 3, 2); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== VIKING SWORDSMAN — Berserker (Chiến binh cuồng nộ) ========
export function drawSwords_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    // Body — chainmail + fur
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-7, -5 + bob, 14, 16);
    // Chain links
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-6, -3 + bob + i * 3, 12, 1);
    }
    // Fur collar / bear pelt
    ctx.fillStyle = age >= 3 ? '#5a4a2a' : '#7a6a4a';
    ctx.fillRect(-8, -7 + bob, 16, 4);
    ctx.fillStyle = '#4a3a1a';
    ctx.fillRect(-8, -6 + bob, 16, 1);
    // Leather belt with buckle
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(-7, 5 + bob, 14, 3);
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#888';
    ctx.fillRect(-1, 5 + bob, 3, 3);

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -11 + bob, 2, 2);
    // Beard
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-3, -7 + bob, 6, 4);

    // Viking helm
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#5a5a58' : '#4a4a48';
        ctx.fillRect(-6, -18 + bob, 12, 6);
        // Nose guard
        ctx.fillStyle = '#6a6a68';
        ctx.fillRect(0, -14 + bob, 2, 5);
        // Eye guards
        ctx.fillRect(-5, -13 + bob, 3, 2);
        ctx.fillRect(3, -13 + bob, 3, 2);
        if (age >= 4) {
            // Horns
            ctx.fillStyle = '#eee';
            ctx.fillRect(-9, -19 + bob, 2, 5);
            ctx.fillRect(7, -19 + bob, 2, 5);
            ctx.fillRect(-10, -20 + bob, 2, 3);
            ctx.fillRect(8, -20 + bob, 2, 3);
        }
    } else if (age >= 2) {
        ctx.fillStyle = '#4a4a48';
        ctx.fillRect(-5, -16 + bob, 10, 5);
    } else {
        // Wild hair
        ctx.fillStyle = '#b89050';
        ctx.fillRect(-6, -17 + bob, 12, 6);
        ctx.fillRect(-7, -14 + bob, 2, 5);
    }

    // Battle Axe (right) — large two-handed
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(7, -4 + bob, 2, 16); // long handle
    // Axe head
    ctx.fillStyle = age >= 4 ? '#ddd' : '#aaa';
    ctx.beginPath();
    ctx.moveTo(9, -8 + bob);
    ctx.lineTo(14, -4 + bob);
    ctx.lineTo(14, 0 + bob);
    ctx.lineTo(9, -4 + bob);
    ctx.closePath();
    ctx.fill();
    // Edge gleam
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(12, -6 + bob, 1, 4);
    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(9, -8 + bob, 1, 4); // gold inlay
    }

    // Round shield (left)
    if (age >= 2) {
        ctx.fillStyle = '#5a4a2a';
        ctx.beginPath();
        ctx.arc(-8, 2 + bob, age >= 3 ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        // Iron boss
        ctx.fillStyle = '#7a7a78';
        ctx.beginPath();
        ctx.arc(-8, 2 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        // Painted stripe
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-9, -1 + bob, 2, 6);
    }

    // Legs — cloth wraps
    ctx.fillStyle = age >= 3 ? '#3a3a30' : '#5a4a38';
    ctx.fillRect(-5, 11, 4, 6 + legOff);
    ctx.fillRect(1, 11, 4, 6 - legOff);
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(-6, 15 + legOff, 5, 3);
    ctx.fillRect(0, 15 - legOff, 5, 3);

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
}
