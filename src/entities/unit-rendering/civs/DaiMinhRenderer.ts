// ============================================================
//  Đại Minh (Ming Dynasty) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish } from "../draw-swords-finish";

// ======== ĐẠI MINH SCOUT — 明朝 Khinh Kỵ (Ming Light Cavalry) ========
export function drawScout_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {

    // ── LAYER 1: BACK BANNER (背旗) ──
    if (age >= 3) {
        const wave = moving ? Math.sin(unit.animTimer * 10) * 2 : 0;
        // Pole
        ctx.fillStyle = '#5a4020';
        ctx.fillRect(-6, -22 + bob, 2, 28);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(-5, -25 + bob);
            ctx.lineTo(-7, -22 + bob);
            ctx.lineTo(-3, -22 + bob);
            ctx.closePath();
            ctx.fill();
        }
        // Red banner flag
        const bW = age >= 4 ? 8 : 6;
        const bH = age >= 4 ? 13 : 10;
        ctx.fillStyle = age >= 4 ? '#cc1111' : '#aa2222';
        ctx.fillRect(-6 - bW, -21 + bob + wave, bW, bH);
        // Gold border
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-6 - bW, -21 + bob + wave, bW, 1);
        ctx.fillRect(-6 - bW, -21 + bob + wave + bH - 1, bW, 1);
        ctx.fillRect(-6 - bW, -21 + bob + wave, 1, bH);
        // Dragon / 明 character
        ctx.fillStyle = '#ffd700';
        if (age >= 4) {
            ctx.fillRect(-12, -17 + bob + wave, 4, 1);
            ctx.fillRect(-11, -18 + bob + wave, 2, 5);
            ctx.fillRect(-13, -15 + bob + wave, 1, 3);
            ctx.fillRect(-9, -15 + bob + wave, 1, 3);
        } else {
            ctx.fillRect(-10, -17 + bob + wave, 3, 3);
        }
    }

    // ── LAYER 2: BODY ARMOR ──
    if (age >= 4) {
        // Imperial red armor with gold studs
        ctx.fillStyle = '#8a1111';
        ctx.fillRect(-6, -5 + bob, 12, 14);
        // Gold studs
        ctx.fillStyle = '#ffd700';
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.fillRect(-5 + c * 3, -3 + bob + r * 4, 1, 1);
            }
        }
        // Gold collar
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-6, -5 + bob, 12, 2);
        // Gold belt
        ctx.fillRect(-6, 5 + bob, 12, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1, 5 + bob, 2, 2);
    } else if (age >= 3) {
        // Red cotton armor (綿甲)
        ctx.fillStyle = '#992222';
        ctx.fillRect(-5, -4 + bob, 10, 13);
        // Quilted pattern
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-4, -3 + bob + i * 2.5, 8, 1);
        }
        // Red collar
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(-5, -4 + bob, 10, 2);
        // Belt
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(-5, 5 + bob, 10, 2);
    } else if (age >= 2) {
        // Simple padded coat
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(-5, -4 + bob, 10, 13);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-4, -2 + bob + i * 3, 8, 1);
        }
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(-5, 5 + bob, 10, 2);
    } else {
        // Peasant cloth
        ctx.fillStyle = '#8a7a5a';
        ctx.fillRect(-5, -4 + bob, 10, 13);
        ctx.fillStyle = '#7a6a4a';
        ctx.fillRect(-5, 4 + bob, 10, 2);
    }

    // Shoulder plates (age 3+)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#8a1111' : '#883322';
        ctx.fillRect(-8, -4 + bob, 3, 6);
        ctx.fillRect(5, -4 + bob, 3, 6);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-8, -4 + bob, 3, 1);
            ctx.fillRect(5, -4 + bob, 3, 1);
        }
    }

    // ── LAYER 3: HEAD ──
    ctx.fillStyle = '#e0c8a0';
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#111';
    ctx.fillRect(1, -9 + bob, 2, 2);

    // ── LAYER 4: HEADGEAR ──
    if (age >= 4) {
        // Ornate Ming helmet — round with conical peak
        ctx.fillStyle = '#555';
        ctx.fillRect(-6, -16 + bob, 12, 5);
        ctx.beginPath();
        ctx.moveTo(0, -20 + bob);
        ctx.lineTo(-4, -16 + bob);
        ctx.lineTo(4, -16 + bob);
        ctx.closePath();
        ctx.fill();
        // Brim
        ctx.fillStyle = '#444';
        ctx.fillRect(-7, -12 + bob, 14, 2);
        // Gold trim
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-7, -12 + bob, 14, 1);
        ctx.fillRect(-1, -20 + bob, 2, 1);
        // Red horsehair plume
        ctx.fillStyle = '#dd1111';
        ctx.fillRect(-1, -24 + bob, 2, 5);
        ctx.fillRect(-2, -23 + bob, 4, 2);
        // Cheek plates
        ctx.fillStyle = '#555';
        ctx.fillRect(-6, -11 + bob, 2, 3);
        ctx.fillRect(4, -11 + bob, 2, 3);
    } else if (age >= 3) {
        // Iron helm with knob
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(-5, -15 + bob, 10, 4);
        ctx.fillRect(-6, -12 + bob, 12, 2);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, -17 + bob, 2, 3);
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(0, -18 + bob, 1, 2);
    } else if (age >= 2) {
        // Simple iron cap
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(-5, -14 + bob, 10, 3);
        ctx.fillRect(-6, -12 + bob, 12, 2);
    } else {
        // Straw hat (斗笠) — peasant
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(-7, -14 + bob, 14, 2);
        ctx.fillStyle = '#b89040';
        ctx.fillRect(-5, -16 + bob, 10, 3);
    }

    // ── LAYER 5: WEAPON — 柳葉刀 ──
    if (age >= 4) {
        // Master liuyedao — red handle, gold guard, wide curved blade
        ctx.fillStyle = '#6a1818';
        ctx.fillRect(6, 0 + bob, 2, 5);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(6, 1 + bob, 2, 1);
        ctx.fillRect(5, -1 + bob, 4, 2);
        // Wide curved blade
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(8, -14 + bob);
        ctx.quadraticCurveTo(12, -6 + bob, 8, 0 + bob);
        ctx.lineTo(6, 0 + bob);
        ctx.quadraticCurveTo(10, -7 + bob, 7, -13 + bob);
        ctx.closePath();
        ctx.fill();
        // Edge shine
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(8, -13 + bob);
        ctx.quadraticCurveTo(11, -6 + bob, 8, 0 + bob);
        ctx.stroke();
        // Tassel
        ctx.fillStyle = '#cc1111';
        ctx.fillRect(6, 5 + bob, 1, 3);
        ctx.fillRect(8, 5 + bob, 1, 2);
    } else if (age >= 3) {
        // Forged dao — curved
        ctx.fillStyle = '#4a2a14';
        ctx.fillRect(6, 0 + bob, 2, 4);
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(5, -1 + bob, 4, 1);
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(7, -11 + bob);
        ctx.quadraticCurveTo(10, -5 + bob, 7, 0 + bob);
        ctx.lineTo(6, 0 + bob);
        ctx.quadraticCurveTo(8, -6 + bob, 6, -10 + bob);
        ctx.closePath();
        ctx.fill();
    } else if (age >= 2) {
        // Simple straight dao
        ctx.fillStyle = '#5a3a20';
        ctx.fillRect(6, 0 + bob, 2, 3);
        ctx.fillStyle = '#888';
        ctx.fillRect(5, -1 + bob, 4, 1);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(6, -8 + bob, 2, 8);
        ctx.beginPath();
        ctx.moveTo(7, -10 + bob);
        ctx.lineTo(6, -8 + bob);
        ctx.lineTo(8, -8 + bob);
        ctx.closePath();
        ctx.fill();
    } else {
        // Bamboo spear
        ctx.fillStyle = '#7a6a40';
        ctx.fillRect(5, -10 + bob, 2, 16);
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.moveTo(6, -13 + bob);
        ctx.lineTo(5, -10 + bob);
        ctx.lineTo(7, -10 + bob);
        ctx.closePath();
        ctx.fill();
    }

    // ── LAYER 6: LEGS ──
    ctx.fillStyle = age >= 3 ? '#4a3028' : age >= 2 ? '#5a4a38' : '#7a6a50';
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    // Boots
    ctx.fillStyle = age >= 3 ? '#2a2018' : '#4a3a28';
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

    // ── EFFECTS ──
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -26 + bob);
    }
    if (moving && age >= 2) {
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#aa8866';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-10 - i * 4, 12 + bob + i * 2, 3, 2);
        }
        ctx.globalAlpha = 1;
    }
    if (age >= 4) {
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ======== ĐẠI MINH SWORDSMAN — Đao binh (Dao swordsman) ========
export function drawSwords_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    // Body — lamellar armor with red/gold
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.bodyMid;
    ctx.fillRect(-7, -5 + bob, 14, 16);
    // Lamellar pattern
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(-6, -4 + bob + i * 2.5, 12, 1);
    }
    // Red cloth belt
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-7, 5 + bob, 14, 3);
    if (age >= 3) {
        // Gold trim
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-7, -5 + bob, 14, 1);
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -11 + bob, 2, 2);

    // Song dynasty helmet
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#8a2222' : '#6a3333';
        ctx.fillRect(-6, -17 + bob, 12, 5);
        ctx.fillRect(-8, -12 + bob, 16, 2); // wide brim
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, -20 + bob, 2, 4); // top knob
        if (age >= 4) {
            // Red plume
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(-1, -24 + bob, 2, 5);
        }
    } else if (age >= 2) {
        ctx.fillStyle = '#6a3333';
        ctx.fillRect(-5, -16 + bob, 10, 4);
    } else {
        // Top knot
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-3, -18 + bob, 6, 5);
    }

    // Dao blade (right) — single-edge Chinese broadsword
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(7, -2 + bob, 2, 8);
    ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
    ctx.fillRect(6, -16 + bob, 4, 16);
    // Single edge taper
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(6, -16 + bob, 1, 14);
    // Ring pommel
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#888';
    ctx.fillRect(6, 6 + bob, 4, 2);
    // Guard
    ctx.fillRect(4, -2 + bob, 8, 2);

    // Rectangular shield (left)
    if (age >= 2) {
        ctx.fillStyle = '#aa1111';
        ctx.fillRect(-11, -4 + bob, 5, 14);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-10, 1 + bob, 3, 3); // dragon emblem
        if (age >= 3) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-11, -4 + bob, 5, 14);
        }
    }

    // Legs — with cloth wraps
    ctx.fillStyle = age >= 3 ? '#3a3a38' : '#5a4a38';
    ctx.fillRect(-5, 11, 4, 6 + legOff);
    ctx.fillRect(1, 11, 4, 6 - legOff);

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
}
