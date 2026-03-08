// ============================================================
//  Yamato (Japan) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish } from "../draw-swords-finish";

// ======== YAMATO SCOUT — Shinobi (ninja-like stealth scout) ========
export function drawScout_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Tattered scarf trailing behind — civ accent colored
    if (age >= 2) {
        ctx.fillStyle = cv.accent + '88';
        const scarfWave = moving ? Math.sin(unit.animTimer * 16) * 3 : 0;
        ctx.fillRect(-8, -6 + bob, 2, 12 + scarfWave);
    }

    // Body — CIV COLORED stealth outfit
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    // Chest wrap accent
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-4, -2 + bob, 8, 3);
    // Arm wraps (age 3+)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#2a2a2a' : '#3a3a3a';
        ctx.fillRect(-7, -2 + bob, 3, 5);
        ctx.fillRect(5, -2 + bob, 3, 5);
        if (age >= 4) {
            ctx.fillStyle = cv.accent;
            ctx.fillRect(-7, -2 + bob, 3, 1);
            ctx.fillRect(5, -2 + bob, 3, 1);
        }
    }
    // Obi belt — civ accent
    ctx.fillStyle = cv.accent;
    ctx.fillRect(-5, 4 + bob, 10, 2);
    // Kunai holster (side)
    if (age >= 2) {
        ctx.fillStyle = '#444';
        ctx.fillRect(-6, 1 + bob, 2, 5);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-6, 1 + bob, 1, 3); // kunai blades
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -9 + bob, 2, 2);

    // Ninja face mask + headband
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-4, -8 + bob, 8, 5); // face mask
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -13 + bob, 8, 2); // hachimaki
    ctx.fillStyle = cv.accent;
    ctx.fillRect(3, -13 + bob, 2, 3); // civ-colored ties
    // Only eyes visible
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -10 + bob, 6, 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, -10 + bob, 2, 1);
    ctx.fillRect(1, -10 + bob, 2, 1);

    // Short ninjato (straight blade) — quality improves
    ctx.fillStyle = '#333';
    ctx.fillRect(5, -1 + bob, 2, 4); // handle
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : age >= 3 ? '#ddd' : '#ccc';
    ctx.fillRect(5, -9 + bob, 2, 9); // straight blade
    ctx.fillStyle = '#333';
    ctx.fillRect(4, -1 + bob, 4, 1); // square guard
    if (age >= 4) {
        // Poison blade glow
        ctx.globalAlpha = 0.3 + Math.sin(unit.animTimer * 6) * 0.15;
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(5, -8 + bob, 2, 7);
        ctx.globalAlpha = 1;
    }

    // Shuriken on belt (age 3+)
    if (age >= 3) {
        ctx.fillStyle = '#aaa';
        ctx.save();
        ctx.translate(-2, 5 + bob);
        ctx.rotate(unit.animTimer * 4);
        for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 2;
            ctx.fillRect(Math.cos(a) * 2 - 0.5, Math.sin(a) * 2 - 0.5, 1, 1);
        }
        ctx.fillRect(-0.5, -0.5, 1, 1);
        ctx.restore();
    }

    // Legs — civ colored dark leggings
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    // Tabi shoes
    ctx.fillStyle = '#222';
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    // Ninja speed after-images — civ colored
    if (moving && age >= 3) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-12, -4 + bob, 6, 13);
        ctx.fillRect(-18, -4 + bob, 4, 11);
        ctx.globalAlpha = 1;
    }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== YAMATO SWORDSMAN — Samurai (侍) ========
export function drawSwords_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    // Body — ō-yoroi style armor
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-7, -5 + bob, 14, 16);
    // Armor cord lacing (odoshi)
    ctx.fillStyle = cv.bodyLight;
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-6, -3 + bob + i * 3, 12, 1);
    }
    // Kusazuri (skirt plates)
    if (age >= 2) {
        ctx.fillStyle = cv.bodyDark;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-6 + i * 3, 8 + bob, 3, 4);
        }
    }
    // Sode (shoulder guards)
    if (age >= 2) {
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-9, -6 + bob, 4, 8);
        ctx.fillRect(5, -6 + bob, 4, 8);
        ctx.fillStyle = cv.bodyLight;
        ctx.fillRect(-9, -6 + bob, 4, 1);
        ctx.fillRect(5, -6 + bob, 4, 1);
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -11 + bob, 2, 2);

    // Kabuto (samurai helmet)
    if (age >= 3) {
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-7, -18 + bob, 14, 6);
        // Maedate (front crest)
        ctx.fillStyle = age >= 4 ? '#ffd700' : '#cc9944';
        ctx.beginPath();
        ctx.moveTo(0, -26 + bob);
        ctx.lineTo(-4, -18 + bob);
        ctx.lineTo(4, -18 + bob);
        ctx.closePath();
        ctx.fill();
        // Shikoro (neck guard)
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-7, -12 + bob, 14, 3);
        ctx.fillStyle = cv.bodyLight;
        ctx.fillRect(-7, -14 + bob, 14, 1);
        if (age >= 4) {
            // Kuwagata (horn ornament)
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-8, -22 + bob, 2, 5);
            ctx.fillRect(6, -22 + bob, 2, 5);
        }
    } else if (age >= 2) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-6, -17 + bob, 12, 5);
    } else {
        // Hachimaki
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -15 + bob, 10, 2);
        ctx.fillStyle = cv.bodyLight;
        ctx.fillRect(3, -15 + bob, 2, 2);
    }

    // Katana (right) — curved Japanese sword
    ctx.fillStyle = '#3a2a10';
    ctx.fillRect(7, -2 + bob, 2, 8); // tsuka (handle)
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(7, 5 + bob, 2, 2); // tsuka-ito wrapping
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : '#ddd';
    // Curved blade
    ctx.beginPath();
    ctx.moveTo(7, -18 + bob);
    ctx.quadraticCurveTo(10, -10 + bob, 8, -2 + bob);
    ctx.lineTo(10, -2 + bob);
    ctx.quadraticCurveTo(12, -10 + bob, 9, -18 + bob);
    ctx.closePath();
    ctx.fill();
    // Tsuba (guard)
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#666';
    ctx.fillRect(5, -2 + bob, 6, 2);
    // Hamon line
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(7, -16 + bob, 1, 14);

    // No shield — two-handed grip
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-9, -3 + bob, 3, 8); // arm guard (kote)
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-9, -3 + bob, 3, 1);

    // Legs — hakama pants
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5, 11, 4, 6 + legOff);
    ctx.fillRect(1, 11, 4, 6 - legOff);
    // Waraji sandals
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(-6, 15 + legOff, 5, 2);
    ctx.fillRect(0, 15 - legOff, 5, 2);

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
}
