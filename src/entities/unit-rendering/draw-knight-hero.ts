// ============================================================
//  Knight + Hero Renderers — complex multi-civ draw functions
//  Extracted from UnitRenderer.ts
// ============================================================

import {
    UnitType, UnitState, CIVILIZATION_DATA,
    CivilizationType, C, TILE_SIZE,
    ResourceType, ResourceNodeType, isRangedType,
} from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";
import { drawBeautifulHorse } from "./draw-cavalry-unique";

import { drawMusashiComplete } from './civs/heroes/draw-musashi';
import { drawSpartacusComplete } from './civs/heroes/draw-spartacus';
import { drawRagnarComplete } from './civs/heroes/draw-ragnar';
import { drawQiJiguangComplete } from './civs/heroes/draw-qijiguang';
import { drawZarathustraComplete } from './civs/heroes/draw-zarathustra';


export function drawKnight(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const civ = cv.civ;
    const lvl = unit.upgradeLevel;

    ctx.save();
    // Giảm kích thước tổng thể của toàn bộ kỵ sĩ xuống một chút (cả người và ngựa)
    ctx.scale(0.85, 0.85);

    // === HORSE COLOR PER CIVILIZATION ===
    let horseColor: string, horseDark: string, horseHi: string;
    let horseBlankColor: string, horseTrimColor: string;
    switch (civ) {
        case CivilizationType.BaTu:
            // Sandy desert horse — lighter, golden tones
            horseColor = age >= 4 ? '#c9a060' : '#b89050';
            horseDark = age >= 4 ? '#8a6a30' : '#7a5a28';
            horseHi = age >= 4 ? '#d4b070' : '#c9a060';
            horseBlankColor = '#c9a84c'; horseTrimColor = '#ffd700';
            break;
        case CivilizationType.DaiMinh:
            // Black warhorse — imposing and heavy
            horseColor = age >= 4 ? '#2a2a2a' : '#3a3a3a';
            horseDark = age >= 4 ? '#1a1a1a' : '#222';
            horseHi = age >= 4 ? '#3a3a3a' : '#4a4a4a';
            horseBlankColor = cv.bodyDark; horseTrimColor = '#ffd700';
            break;
        case CivilizationType.Yamato:
            // Dark bay horse — classic Japanese cavalry
            horseColor = age >= 4 ? '#4a2a18' : '#5a3020';
            horseDark = age >= 4 ? '#2a1a10' : '#3a2018';
            horseHi = age >= 4 ? '#5a3a28' : '#6a4030';
            horseBlankColor = cv.bodyDark; horseTrimColor = cv.bodyLight;
            break;
        case CivilizationType.LaMa:
            // White warhorse — Roman glory
            horseColor = age >= 4 ? '#c8c0b0' : '#a8a098';
            horseDark = age >= 4 ? '#8a8078' : '#7a7268';
            horseHi = age >= 4 ? '#d8d0c0' : '#b8b0a8';
            horseBlankColor = '#8b0000'; horseTrimColor = '#daa520';
            break;
        case CivilizationType.Viking:
            // Gray/dapple horse — sturdy northern breed
            horseColor = age >= 4 ? '#5a5a58' : '#6a6a68';
            horseDark = age >= 4 ? '#3a3a38' : '#4a4a48';
            horseHi = age >= 4 ? '#6a6a68' : '#7a7a78';
            horseBlankColor = '#5a4a2a'; horseTrimColor = '#8a8a88';
            break;
        default:
            horseColor = age >= 4 ? '#3a2a18' : '#5a4030';
            horseDark = age >= 4 ? '#2a1a10' : '#3a2a20';
            horseHi = age >= 4 ? '#4a3a28' : '#6a5040';
            horseBlankColor = cv.bodyMid; horseTrimColor = cv.accent;
    }

    const hx = -2, hy = 0 + bob;
    const legBob = moving ? Math.sin(unit.animTimer * 18) * 3 : 0;

    // === HORSE BODY & BARDING ===
    ctx.save();
    // Position the beautiful horse so its back aligns with the rider's Y (-16)
    // The beautiful horse's back is at -18, so if we translate by (hx, hy + 18), 
    // the back will be at hy (0 + bob). The rider is drawn at hy - 16, which sits perfectly on top!
    ctx.translate(hx, hy + 18);
    ctx.scale(0.85, 0.85);

    const legSwing = moving ? Math.sin(unit.animTimer * 18) * 5 : 0;
    const walkBobBase = bob;

    drawBeautifulHorse(ctx, walkBobBase, legSwing, horseColor, horseDark, horseDark, '#222');

    // === HORSE BARDING (ARMOR) — CIVILIZATION SPECIFIC ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Ornate golden blanket with tassels
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(-12, -18 + walkBobBase, 24, 6);
                ctx.fillStyle = horseTrimColor;
                ctx.fillRect(-12, -13 + walkBobBase, 24, 1);
                // Tassels
                ctx.fillStyle = '#ffd700';
                for (let i = 0; i < 6; i++) {
                    ctx.fillRect(-10 + i * 4, -12 + walkBobBase, 2, 4);
                }

                if (age >= 4) {
                    // Full Golden Scale Barding
                    ctx.fillStyle = '#b8860b'; // Dark gold base
                    ctx.fillRect(-16, -16 + walkBobBase, 28, 7);
                    // Scales overlay
                    ctx.fillStyle = '#ffd700';
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 6; c++) {
                            ctx.beginPath();
                            ctx.arc(-14 + c * 5, -14 + r * 2.5 + walkBobBase, 2.5, 0, Math.PI);
                            ctx.fill();
                        }
                    }

                    // Armored neck (Crinet)
                    ctx.fillStyle = '#b8860b';
                    ctx.beginPath();
                    ctx.moveTo(12, -18 + walkBobBase);
                    ctx.lineTo(20, -28 + walkBobBase);
                    ctx.lineTo(16, -12 + walkBobBase);
                    ctx.fill();

                    // Head chanfron (golden face plate)
                    ctx.fillStyle = '#c9a84c';
                    ctx.beginPath();
                    ctx.moveTo(22, -26 + walkBobBase);
                    ctx.lineTo(28, -20 + walkBobBase);
                    ctx.lineTo(24, -28 + walkBobBase);
                    ctx.fill();
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(26, -24 + walkBobBase, 2, 2); // spike
                }
            }
            break;
        case CivilizationType.DaiMinh:
            // Red lacquered barding with dragon motif
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.beginPath();
                ctx.moveTo(-16, -15 + walkBobBase);
                ctx.quadraticCurveTo(0, -18 + walkBobBase, 12, -10 + walkBobBase);
                ctx.lineTo(12, -4 + walkBobBase);
                ctx.quadraticCurveTo(0, -8 + walkBobBase, -16, -8 + walkBobBase);
                ctx.fill();
                // Scales
                ctx.fillStyle = cv.bodyLight;
                for (let i = 0; i < 5; i++) {
                    ctx.fillRect(-10 + i * 4, -13 + walkBobBase, 2, 2);
                }
                ctx.fillStyle = horseTrimColor;
                ctx.fillRect(-14, -8 + walkBobBase, 26, 1);

                if (age >= 4) {
                    // Heavy Iron & Red Lacquer Barding
                    ctx.fillStyle = '#111'; // Iron base
                    ctx.beginPath();
                    ctx.moveTo(-18, -12 + walkBobBase);
                    ctx.quadraticCurveTo(0, -14 + walkBobBase, 16, -6 + walkBobBase);
                    ctx.lineTo(14, 2 + walkBobBase);
                    ctx.quadraticCurveTo(0, 0 + walkBobBase, -18, -2 + walkBobBase);
                    ctx.fill();

                    // Red Lacquer scales
                    ctx.fillStyle = '#8a2222';
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 7; c++) {
                            ctx.fillRect(-16 + c * 4, -10 + walkBobBase + r * 3, 3, 2);
                        }
                    }

                    // Neck armor
                    ctx.fillStyle = '#8a2222';
                    ctx.beginPath();
                    ctx.moveTo(12, -18 + walkBobBase);
                    ctx.lineTo(18, -28 + walkBobBase);
                    ctx.lineTo(16, -10 + walkBobBase);
                    ctx.fill();
                    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();

                    // Face plate
                    ctx.fillStyle = cv.bodyDark;
                    ctx.beginPath();
                    ctx.moveTo(22, -26 + walkBobBase);
                    ctx.lineTo(28, -20 + walkBobBase);
                    ctx.lineTo(24, -28 + walkBobBase);
                    ctx.fill();
                }
            }
            break;
        case CivilizationType.Yamato:
            // Dark lacquered barding with samurai aesthetics
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(-12, -18 + walkBobBase, 22, 6);
                ctx.fillStyle = horseTrimColor;
                for (let i = 0; i < 7; i++) {
                    ctx.fillRect(-10 + i * 3, -16 + walkBobBase, 1, 4);
                }

                if (age >= 4) {
                    // Heavy Umayoroi (Horse Armor)
                    ctx.fillStyle = '#1a1a2a'; // Deep indigo armor
                    ctx.fillRect(-14, -16 + walkBobBase, 28, 8);

                    // Red Odoshi (Lacing)
                    ctx.fillStyle = '#cc3333';
                    ctx.fillRect(-14, -14 + walkBobBase, 28, 1);
                    ctx.fillRect(-14, -11 + walkBobBase, 28, 1);

                    // Neck scales
                    ctx.fillStyle = '#1a1a2a';
                    ctx.beginPath();
                    ctx.moveTo(10, -16 + walkBobBase);
                    ctx.lineTo(18, -26 + walkBobBase);
                    ctx.lineTo(15, -10 + walkBobBase);
                    ctx.fill();
                    ctx.fillStyle = '#cc3333';
                    ctx.fillRect(13, -15 + walkBobBase, 4, 1);
                    ctx.fillRect(14, -20 + walkBobBase, 3, 1);

                    // Dragon Face plate (Bamen)
                    ctx.fillStyle = cv.bodyDark;
                    ctx.beginPath();
                    ctx.moveTo(22, -26 + walkBobBase);
                    ctx.lineTo(28, -20 + walkBobBase);
                    ctx.lineTo(25, -28 + walkBobBase);
                    ctx.fill();
                    // Gold horn
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(25, -28 + walkBobBase, 1, 3);
                }
            }
            break;
        case CivilizationType.LaMa:
            // Roman-style barding — segmented metal plates
            if (age >= 3) {
                ctx.fillStyle = '#8b0000'; // Red cloth
                ctx.fillRect(-14, -18 + walkBobBase, 26, 8);
                ctx.fillStyle = '#6a6a68'; // Metal overlay
                ctx.fillRect(-12, -18 + walkBobBase, 22, 6);
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                for (let i = 0; i < 5; i++) {
                    ctx.fillRect(-11, -17 + walkBobBase + i, 20, 1);
                }

                if (age >= 4) {
                    // Full Cataphract Scale Armor
                    ctx.fillStyle = '#7a7a78';
                    ctx.beginPath();
                    ctx.moveTo(-20, -18 + walkBobBase); // covers butt
                    ctx.lineTo(16, -18 + walkBobBase); // covers chest
                    ctx.lineTo(12, 0 + walkBobBase);
                    ctx.lineTo(-16, 0 + walkBobBase);
                    ctx.fill();

                    // Shine lines
                    ctx.strokeStyle = '#a8a8a6';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 4; i++) {
                        ctx.beginPath();
                        ctx.moveTo(-18 + i * 2, -16 + walkBobBase + i * 4);
                        ctx.lineTo(14 - i * 2, -16 + walkBobBase + i * 4);
                        ctx.stroke();
                    }

                    // Metal neck guard
                    ctx.fillStyle = '#6a6a68';
                    ctx.beginPath();
                    ctx.moveTo(12, -18 + walkBobBase);
                    ctx.lineTo(18, -26 + walkBobBase);
                    ctx.lineTo(16, -10 + walkBobBase);
                    ctx.fill();

                    // Chanfron
                    ctx.fillStyle = '#5a5a58';
                    ctx.beginPath();
                    ctx.moveTo(22, -26 + walkBobBase);
                    ctx.lineTo(28, -20 + walkBobBase);
                    ctx.lineTo(24, -28 + walkBobBase);
                    ctx.fill();
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(25, -24 + walkBobBase, 2, 2);
                }
            }
            break;
        case CivilizationType.Viking:
            // Fur-covered horse blanket
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(-14, -18 + walkBobBase, 24, 6);
                ctx.fillStyle = '#6a5a3a';
                ctx.fillRect(-14, -18 + walkBobBase, 24, 2);
                ctx.fillStyle = '#4a3a1a';
                ctx.fillRect(-14, -13 + walkBobBase, 24, 1);

                if (age >= 4) {
                    // Heavy Chainmail and Iron Plates
                    ctx.fillStyle = '#5a5a58'; // Chainmail base
                    ctx.fillRect(-18, -14 + walkBobBase, 30, 8);

                    // Chainmail texture
                    ctx.fillStyle = '#3a3a38';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.setLineDash([2, 1]);
                        ctx.moveTo(-18, -12 + walkBobBase + i * 3);
                        ctx.lineTo(12, -12 + walkBobBase + i * 3);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }

                    // Huge iron shields strapped to the side
                    ctx.fillStyle = '#3a2a1a'; // Wood
                    ctx.beginPath();
                    ctx.arc(-2, -8 + walkBobBase, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#8a8a88'; // Iron boss
                    ctx.beginPath();
                    ctx.arc(-2, -8 + walkBobBase, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    // Iron rim
                    ctx.strokeStyle = '#5a5a58';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Neck chainmail
                    ctx.fillStyle = '#5a5a58';
                    ctx.beginPath();
                    ctx.moveTo(10, -18 + walkBobBase);
                    ctx.lineTo(16, -26 + walkBobBase);
                    ctx.lineTo(14, -10 + walkBobBase);
                    ctx.fill();

                    // Iron Face plate
                    ctx.fillStyle = '#4a4a48';
                    ctx.beginPath();
                    ctx.moveTo(22, -26 + walkBobBase);
                    ctx.lineTo(28, -20 + walkBobBase);
                    ctx.lineTo(24, -28 + walkBobBase);
                    ctx.fill();
                }
            }
            break;

        default:
            // European Knight Barding (Default)
            if (age >= 3) {
                // Cloth trapper
                ctx.fillStyle = horseBlankColor;
                ctx.beginPath();
                ctx.moveTo(-18, -18 + walkBobBase);
                ctx.lineTo(16, -18 + walkBobBase);
                ctx.lineTo(12, -4 + walkBobBase);
                ctx.lineTo(-14, -4 + walkBobBase);
                ctx.fill();

                ctx.fillStyle = horseTrimColor;
                ctx.fillRect(-16, -6 + walkBobBase, 26, 1);

                if (age >= 4) {
                    // Full Plate Barding (Heavy Steel)
                    ctx.fillStyle = '#7a8a9a'; // Steel
                    // Rear body armor (Croupiere)
                    ctx.beginPath();
                    ctx.moveTo(-20, -18 + walkBobBase);
                    ctx.lineTo(-8, -18 + walkBobBase);
                    ctx.lineTo(-4, -6 + walkBobBase);
                    ctx.lineTo(-18, -6 + walkBobBase);
                    ctx.fill();
                    // Front body armor (Peytral)
                    ctx.beginPath();
                    ctx.moveTo(8, -18 + walkBobBase);
                    ctx.lineTo(18, -18 + walkBobBase);
                    ctx.lineTo(16, -2 + walkBobBase);
                    ctx.lineTo(4, -2 + walkBobBase);
                    ctx.fill();

                    // Shine on steel
                    ctx.fillStyle = '#d0e0f0';
                    ctx.fillRect(-16, -10 + walkBobBase, 8, 1);
                    ctx.fillRect(8, -8 + walkBobBase, 6, 1);

                    // Full steel crinet (neck)
                    ctx.fillStyle = '#7a8a9a';
                    ctx.beginPath();
                    ctx.moveTo(10, -18 + walkBobBase);
                    ctx.lineTo(18, -28 + walkBobBase);
                    ctx.lineTo(15, -10 + walkBobBase);
                    ctx.fill();

                    // Steel Chanfron
                    ctx.fillStyle = '#6a7a8a';
                    ctx.beginPath();
                    ctx.moveTo(22, -26 + walkBobBase);
                    ctx.lineTo(28, -20 + walkBobBase);
                    ctx.lineTo(24, -28 + walkBobBase);
                    ctx.fill();
                }
            }
            break;
    }
    ctx.restore();

    // === RIDER ===
    // Lowered rider Y further from -12 to -10 so they sit very deeply in the saddle
    const riderY = hy - 10;

    // Cape — civ body colored (Larger and more flowing in Age 4)
    if (age >= 3) {
        ctx.fillStyle = cv.bodyDark;
        const capeWave = moving ? Math.sin(unit.animTimer * 12) * 3 : 0;
        const capeWidth = age >= 4 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(hx - 4, riderY + 4);
        ctx.quadraticCurveTo(hx - 8, riderY + 10 + capeWave, hx - 6 - capeWidth, riderY + 16 + capeWave);
        ctx.lineTo(hx - 4 - capeWidth, riderY + 16 + capeWave);
        ctx.quadraticCurveTo(hx - 6, riderY + 10 + capeWave, hx - 1, riderY + 4);
        ctx.fill();
        // Accent edge
        ctx.strokeStyle = cv.accent;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Rider body — Chest Plate and Armor
    const armorBase = age >= 4 ? cv.bodyDark : age >= 3 ? cv.bodyMid : cv.bodyLight;
    const armorHighlight = age >= 4 ? cv.bodyMid : cv.bodyLight;

    // Chest Plate (Cuirass)
    ctx.fillStyle = armorBase;
    ctx.beginPath();
    ctx.moveTo(hx - 4, riderY + 2); // top left
    ctx.lineTo(hx + 4, riderY + 2); // top right
    ctx.lineTo(hx + 5, riderY + 8); // swell right
    ctx.lineTo(hx + 3, riderY + 12); // waist right
    ctx.lineTo(hx - 3, riderY + 12); // waist left
    ctx.lineTo(hx - 5, riderY + 8); // swell left
    ctx.fill();

    // Chest highlight
    ctx.fillStyle = armorHighlight;
    ctx.beginPath();
    ctx.moveTo(hx - 2, riderY + 3);
    ctx.lineTo(hx + 2, riderY + 3);
    ctx.lineTo(hx + 3, riderY + 8);
    ctx.lineTo(hx - 3, riderY + 8);
    ctx.fill();

    // Belt
    ctx.fillStyle = '#222';
    ctx.fillRect(hx - 4, riderY + 11, 8, 2);
    ctx.fillStyle = '#ffd700'; // Gold buckle
    ctx.fillRect(hx - 1, riderY + 11, 2, 2);

    // Armors layer on Rider for Age 4 +
    if (age >= 4) {
        // Thêm Plackart (Bụng giáp lồi ra ngoài) - giúp có cảm giác giáp dày dặn
        ctx.fillStyle = armorHighlight;
        ctx.beginPath();
        ctx.moveTo(hx - 5, riderY + 8);
        ctx.lineTo(hx + 5, riderY + 8);
        ctx.lineTo(hx + 4, riderY + 12);
        ctx.lineTo(hx - 4, riderY + 12);
        ctx.fill();
        // Viền bóng
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(hx - 2, riderY + 9, 4, 1);
        ctx.globalAlpha = 1;

        // Thêm lớp Tassets bảo vệ lật (Faulds) nhiều tầng
        ctx.fillStyle = armorBase;
        ctx.beginPath();
        ctx.moveTo(hx - 6, riderY + 13);
        ctx.lineTo(hx + 6, riderY + 13);
        ctx.lineTo(hx + 9, riderY + 17);
        ctx.lineTo(hx - 3, riderY + 17);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.stroke();

        ctx.fillStyle = armorHighlight;
        // Tầng Tasset 2
        ctx.beginPath();
        ctx.moveTo(hx - 4, riderY + 16);
        ctx.lineTo(hx + 7, riderY + 16);
        ctx.lineTo(hx + 10, riderY + 20);
        ctx.lineTo(hx - 2, riderY + 20);
        ctx.fill();
        ctx.stroke();
    } else {
        // Tassets (Thigh guards hanging over the saddle and angled forward) for normal
        ctx.fillStyle = armorBase;
        ctx.beginPath();
        // Start at waist, angle knee slightly forward
        ctx.moveTo(hx - 4, riderY + 13);
        ctx.lineTo(hx + 4, riderY + 13);
        ctx.lineTo(hx + 8, riderY + 19); // Knee position (forward)
        ctx.lineTo(hx - 2, riderY + 19);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.stroke();
    }

    // Legs and Boots (Bending forward into stirrups)
    // Inner trousers/mail (shin angled down and slightly further forward)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(hx, riderY + 19);
    ctx.lineTo(hx + 6, riderY + 19);
    ctx.lineTo(hx + 8, riderY + 24); // Ankle
    ctx.lineTo(hx + 2, riderY + 24);
    ctx.fill();

    // Armored/Leather boots (foot planted flat or toes slightly up)
    const bootColor = age >= 4 ? '#555' : '#332211';
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.moveTo(hx + 1, riderY + 24);
    ctx.lineTo(hx + 9, riderY + 24); // Heel to top-foot
    ctx.lineTo(hx + 11, riderY + 28); // Toe
    ctx.lineTo(hx + 2, riderY + 28); // Sole heel
    ctx.fill();

    // Spur on boot heel
    ctx.fillStyle = '#bbb';
    ctx.fillRect(hx, riderY + 26, 2, 1);

    // Stirrup trap (Connecting from saddle down to the boot)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx + 6, riderY + 26); // Stirrup bottom
    ctx.lineTo(hx + 2, riderY + 13); // Up to saddle
    ctx.stroke();

    if (age >= 4) {
        // Gold trim on armor for Age 4
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(hx - 3, riderY + 2, 6, 1); // collar trim

        // Tasset trim (angled)
        ctx.beginPath();
        ctx.moveTo(hx - 1, riderY + 18);
        ctx.lineTo(hx + 7, riderY + 18);
        ctx.lineTo(hx + 6, riderY + 19);
        ctx.lineTo(hx - 2, riderY + 19);
        ctx.fill();

        // Boot trim (angled)
        ctx.beginPath();
        ctx.moveTo(hx + 1, riderY + 24);
        ctx.lineTo(hx + 9, riderY + 24);
        ctx.lineTo(hx + 9.5, riderY + 25);
        ctx.lineTo(hx + 1.5, riderY + 25);
        ctx.fill();
    }

    // Per-civ armor detail overlays
    switch (civ) {
        case CivilizationType.BaTu:
            // Scale pattern overlay
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(hx - 3, riderY + 4 + i * 3, 6, 1);
            }
            ctx.fillStyle = cv.accent;
            ctx.fillRect(hx - 4, riderY + 2, 8, 2); // gold sash
            break;
        case CivilizationType.DaiMinh:
            // Lamellar pattern
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(hx - 3, riderY + 4 + i * 2, 6, 1);
            }
            if (age >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(hx, riderY + 7, 2, 0, Math.PI * 2); // chest mirror
                ctx.fill();
            }
            break;
        case CivilizationType.Yamato:
            // Red lacing (odoshi)
            ctx.fillStyle = cv.accent;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(hx - 3, riderY + 4 + i * 3, 6, 1);
            }
            // Sode (shoulder guards) — civ body dark
            ctx.fillStyle = cv.bodyDark;
            ctx.fillRect(hx - 7, riderY + 1, 4, 8);
            ctx.fillRect(hx + 3, riderY + 1, 4, 8);
            ctx.fillStyle = cv.accent;
            ctx.fillRect(hx - 7, riderY + 1, 4, 1);
            ctx.fillRect(hx + 3, riderY + 1, 4, 1);
            break;
        case CivilizationType.LaMa:
            // Segmented bands
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(hx - 3, riderY + 4 + i * 3, 6, 1);
            }
            ctx.fillStyle = cv.secondary;
            ctx.fillRect(hx - 2, riderY + 5, 4, 3); // eagle
            break;
        case CivilizationType.Viking:
            // Chain pattern
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(hx - 3, riderY + 4 + i * 3, 6, 1);
            }
            // Fur collar
            ctx.fillStyle = '#6a5a3a';
            ctx.fillRect(hx - 6, riderY + 1, 12, 4);
            ctx.fillStyle = '#5a4a2a';
            ctx.fillRect(hx - 5, riderY + 4, 10, 1);
            break;
    }

    // Shoulder plates (Pouldrons) for non-Yamato
    if (civ !== CivilizationType.Yamato) {
        ctx.fillStyle = armorBase;
        ctx.beginPath();
        // Left pouldron
        ctx.arc(hx - 5, riderY + 3, age >= 4 ? 4 : 3, Math.PI, 0);
        // Right pouldron
        ctx.arc(hx + 5, riderY + 3, age >= 4 ? 4 : 3, Math.PI, 0);
        ctx.fill();

        if (age >= 4) {
            // Lớp Pauldron dưới cho Age 4
            ctx.fillStyle = armorHighlight;
            ctx.beginPath();
            ctx.moveTo(hx - 9, riderY + 3);
            ctx.lineTo(hx - 1, riderY + 3);
            ctx.lineTo(hx - 3, riderY + 7);
            ctx.lineTo(hx - 7, riderY + 7);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(hx + 1, riderY + 3);
            ctx.lineTo(hx + 9, riderY + 3);
            ctx.lineTo(hx + 7, riderY + 7);
            ctx.lineTo(hx + 3, riderY + 7);
            ctx.fill();

            // Gold trim for Age 4 shoulders
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(hx - 8, riderY + 2, 4, 1);
            ctx.fillRect(hx + 4, riderY + 2, 4, 1);
            // Cù trỏ (Couter/Elbow guard)
            ctx.beginPath();
            ctx.arc(hx, riderY + 10, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(hx - 3, riderY - 8, 6, 8);
    ctx.fillStyle = '#222';
    ctx.fillRect(hx + 1, riderY - 5, 2, 2);

    // === HELMET — CIVILIZATION SPECIFIC ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Persian spiked helm with chain veil
            ctx.fillStyle = age >= 4 ? '#c9a84c' : '#9a8040';
            ctx.fillRect(hx - 4, riderY - 10, 8, 5);
            // Spike on top
            ctx.fillStyle = age >= 4 ? '#ffd700' : '#c9a84c';
            ctx.fillRect(hx - 1, riderY - 14, 2, 5);
            // Chain veil / aventail
            ctx.fillStyle = '#8a8888';
            ctx.fillRect(hx - 4, riderY - 6, 8, 3);
            if (age >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(hx - 4, riderY - 10, 8, 1);
                // Side feathers
                ctx.fillStyle = '#e0d8c0';
                ctx.fillRect(hx - 6, riderY - 12, 2, 4);
                ctx.fillRect(hx + 4, riderY - 12, 2, 4);
            }
            break;
        case CivilizationType.DaiMinh:
            // Song dynasty helmet with wide brim and knob
            ctx.fillStyle = age >= 4 ? '#8a2222' : '#6a3333';
            ctx.fillRect(hx - 5, riderY - 10, 10, 5);
            // Wide brim
            ctx.fillRect(hx - 6, riderY - 6, 12, 2);
            // Top knob
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(hx - 1, riderY - 13, 2, 4);
            if (age >= 4) {
                // Ornate plume
                ctx.fillStyle = '#dd3333';
                ctx.fillRect(hx - 1, riderY - 16, 2, 4);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(hx - 5, riderY - 10, 10, 1);
            }
            break;
        case CivilizationType.Yamato:
            // Kabuto with maedate
            ctx.fillStyle = age >= 4 ? '#1a1a2a' : '#2a2a3a';
            ctx.fillRect(hx - 5, riderY - 10, 10, 5);
            // Golden maedate (front crest)
            ctx.fillStyle = age >= 4 ? '#ffd700' : '#cc9944';
            ctx.beginPath();
            ctx.moveTo(hx, riderY - 17);
            ctx.lineTo(hx - 3, riderY - 10);
            ctx.lineTo(hx + 3, riderY - 10);
            ctx.closePath();
            ctx.fill();
            // Shikoro (neck guard)
            ctx.fillStyle = age >= 4 ? '#1a1a2a' : '#2a2a3a';
            ctx.fillRect(hx - 6, riderY - 6, 12, 3);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(hx - 6, riderY - 7, 12, 1);
            break;
        case CivilizationType.LaMa:
            // Roman galea with transverse crest
            ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58';
            ctx.fillRect(hx - 4, riderY - 10, 8, 5);
            // Cheek guards
            ctx.fillRect(hx - 5, riderY - 6, 2, 5);
            ctx.fillRect(hx + 3, riderY - 6, 2, 5);
            // Red crest (transverse)
            ctx.fillStyle = age >= 4 ? '#dd2222' : '#aa3333';
            ctx.fillRect(hx - 1, riderY - 16, 2, 7);
            ctx.fillRect(hx - 3, riderY - 15, 6, 2);
            if (age >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(hx - 4, riderY - 10, 8, 1);
            }
            break;
        case CivilizationType.Viking:
            // Spectacle helm with nose guard
            ctx.fillStyle = age >= 4 ? '#5a5a58' : '#4a4a48';
            ctx.fillRect(hx - 4, riderY - 10, 8, 5);
            // Nose guard
            ctx.fillStyle = '#6a6a68';
            ctx.fillRect(hx, riderY - 7, 2, 5);
            // Eye guards
            ctx.fillRect(hx - 3, riderY - 7, 2, 2);
            ctx.fillRect(hx + 2, riderY - 7, 2, 2);
            if (age >= 4) {
                // Horns
                ctx.fillStyle = '#eee';
                ctx.fillRect(hx - 7, riderY - 13, 2, 5);
                ctx.fillRect(hx + 5, riderY - 13, 2, 5);
                ctx.fillRect(hx - 8, riderY - 14, 2, 3);
                ctx.fillRect(hx + 6, riderY - 14, 2, 3);
            }
            break;
        default:
            // Classic European Visored Knight Helmet
            ctx.fillStyle = age >= 4 ? '#7a8a9a' : '#6a7a8a';
            // Helmet dome
            ctx.beginPath();
            ctx.arc(hx, riderY - 6, 5, Math.PI, 0);
            ctx.fill();
            // Helmet base
            ctx.fillRect(hx - 5, riderY - 6, 10, 4);
            // Visor (pointed face guard)
            ctx.fillStyle = age >= 4 ? '#d0e0f0' : '#b0c0d0';
            ctx.beginPath();
            ctx.moveTo(hx - 5, riderY - 6);
            ctx.lineTo(hx + 6, riderY - 6);
            ctx.lineTo(hx + 4, riderY - 1);
            ctx.lineTo(hx - 4, riderY - 1);
            ctx.fill();
            // Eye slit
            ctx.fillStyle = '#111';
            ctx.fillRect(hx - 2, riderY - 4, 6, 1);

            if (age >= 4) {
                // Helmet Plume (feather)
                ctx.fillStyle = cv.accent;
                ctx.beginPath();
                ctx.moveTo(hx, riderY - 11);
                ctx.quadraticCurveTo(hx - 5, riderY - 16, hx - 8, riderY - 10);
                ctx.quadraticCurveTo(hx - 3, riderY - 12, hx, riderY - 11);
                ctx.fill();
                // Gold rivets/trim
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(hx + 1, riderY - 6, 2, 2);
            }
    }

    // === WEAPON — CIVILIZATION SPECIFIC ===
    if (unit.state !== UnitState.Attacking) {
        switch (civ) {
            case CivilizationType.BaTu:
                // Curved scimitar
                ctx.fillStyle = '#8a6a30';
                ctx.fillRect(hx + 5, riderY + 2, 2, 4); // handle
                ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
                ctx.beginPath();
                ctx.moveTo(hx + 5, riderY - 8);
                ctx.quadraticCurveTo(hx + 9, riderY - 2, hx + 6, riderY + 2);
                ctx.lineTo(hx + 8, riderY + 2);
                ctx.quadraticCurveTo(hx + 11, riderY - 2, hx + 7, riderY - 8);
                ctx.closePath();
                ctx.fill();
                if (age >= 4) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(hx + 4, riderY + 1, 4, 2);
                }
                break;
            case CivilizationType.DaiMinh:
                // Ji halberd (long polearm)
                ctx.fillStyle = age >= 4 ? '#6a2222' : '#5a3a20';
                ctx.fillRect(hx + 5, riderY - 6, 2, 20); // shaft
                ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
                // Halberd head (broad blade + hook)
                ctx.fillRect(hx + 3, riderY - 12, 6, 3);
                ctx.beginPath();
                ctx.moveTo(hx + 6, riderY - 14);
                ctx.lineTo(hx + 4, riderY - 9);
                ctx.lineTo(hx + 8, riderY - 9);
                ctx.closePath();
                ctx.fill();
                if (age >= 4) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(hx + 4, riderY - 6, 4, 2);
                    // Red tassel
                    ctx.fillStyle = '#dd3333';
                    ctx.fillRect(hx + 3, riderY - 6, 2, 4);
                }
                break;
            case CivilizationType.Yamato:
                // Katana (curved blade)
                ctx.fillStyle = '#333';
                ctx.fillRect(hx + 5, riderY + 2, 2, 5); // handle
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(hx + 5, riderY + 3, 2, 3); // red wrapping
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(hx + 4, riderY + 1, 4, 2); // tsuba (guard)
                ctx.fillStyle = age >= 4 ? '#f0f0f0' : '#ddd';
                ctx.beginPath();
                ctx.moveTo(hx + 5, riderY - 10);
                ctx.quadraticCurveTo(hx + 8, riderY - 4, hx + 6, riderY + 1);
                ctx.lineTo(hx + 7, riderY + 1);
                ctx.quadraticCurveTo(hx + 9, riderY - 4, hx + 6, riderY - 10);
                ctx.closePath();
                ctx.fill();
                break;
            case CivilizationType.LaMa:
                // Lance (pilum/contus — long spear)
                ctx.fillStyle = age >= 4 ? '#5a3a18' : '#8B5E3C';
                ctx.fillRect(hx + 5, riderY - 4, 2, 18); // shaft
                // Spear head
                ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
                ctx.beginPath();
                ctx.moveTo(hx + 5, riderY - 12);
                ctx.lineTo(hx + 6, riderY - 4);
                ctx.lineTo(hx + 7, riderY - 12);
                ctx.closePath();
                ctx.fill();
                if (age >= 4) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(hx + 4, riderY - 4, 4, 2);
                    // Pennant
                    ctx.fillStyle = '#8b0000';
                    ctx.fillRect(hx + 7, riderY - 10, 4, 3);
                }
                break;
            case CivilizationType.Viking:
                // Battle axe
                ctx.fillStyle = '#5a3a18';
                ctx.fillRect(hx + 5, riderY - 2, 2, 16); // handle
                ctx.fillStyle = age >= 4 ? '#ddd' : '#bbb';
                // Axe head
                ctx.beginPath();
                ctx.moveTo(hx + 7, riderY - 8);
                ctx.lineTo(hx + 13, riderY - 5);
                ctx.lineTo(hx + 13, riderY + 1);
                ctx.lineTo(hx + 7, riderY - 2);
                ctx.closePath();
                ctx.fill();
                if (age >= 4) {
                    // Runic glow
                    ctx.globalAlpha = 0.5 + Math.sin(unit.animTimer * 5) * 0.3;
                    ctx.fillStyle = '#88ccff';
                    ctx.fillRect(hx + 9, riderY - 5, 2, 3);
                    ctx.globalAlpha = 1;
                }
                break;
            default:
                // Classic Heavy Jousting Lance
                ctx.fillStyle = age >= 4 ? '#5a3a18' : '#8B5E3C';
                // Thick base shaft
                ctx.fillRect(hx + 5, riderY + 2, 3, 6);
                // Vamplate (Hand guard cone)
                ctx.fillStyle = age >= 4 ? '#d0e0f0' : '#b0c0d0';
                ctx.beginPath();
                ctx.moveTo(hx + 2, riderY - 2);
                ctx.lineTo(hx + 11, riderY - 2);
                ctx.lineTo(hx + 7, riderY + 3);
                ctx.lineTo(hx + 6, riderY + 3);
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.stroke();

                // Tapered lance shaft
                ctx.fillStyle = age >= 4 ? '#6a4a28' : '#8B5E3C';
                ctx.beginPath();
                ctx.moveTo(hx + 5, riderY - 2);
                ctx.lineTo(hx + 8, riderY - 2);
                ctx.lineTo(hx + 7, riderY - 18);
                ctx.lineTo(hx + 6, riderY - 18);
                ctx.fill();

                // Steel lance tip
                ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
                ctx.beginPath();
                ctx.moveTo(hx + 6, riderY - 18);
                ctx.lineTo(hx + 7, riderY - 18);
                ctx.lineTo(hx + 6.5, riderY - 22);
                ctx.fill();

                if (age >= 4) {
                    // Decorative Pennant (flag)
                    ctx.fillStyle = cv.accent;
                    ctx.beginPath();
                    ctx.moveTo(hx + 7, riderY - 16);
                    ctx.lineTo(hx + 16, riderY - 14);
                    ctx.lineTo(hx + 7, riderY - 12);
                    ctx.fill();
                }
        } // End of Weapon Switch
    } // End of !Attacking check

    // Upgrade stars
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, riderY - 16);
    }

    // Dust particles when moving — civ-tinted
    if (moving) {
        let dustColor: string;
        let pColor: string;
        switch (civ) {
            case CivilizationType.BaTu: dustColor = '#c9a060'; pColor = '#e0c090'; break;
            case CivilizationType.Viking: dustColor = '#6a6a68'; pColor = '#8a8a88'; break;
            default: dustColor = '#8a7a60'; pColor = '#a89a80';
        }

        ctx.globalAlpha = 0.4; // Tăng độ mờ lên chút để dễ thấy hiệu ứng bụi
        // Tạo nhiều cụm bụi văng ra sau
        for (let i = 0; i < 5; i++) {
            // Tốc độ bụi bay lên (dựa trên timer)
            const lift = (unit.animTimer * 15 + i * 7) % 10;
            const spread = Math.sin(unit.animTimer * 8 + i) * 6;

            // Lùi bụi ra sau lưng ngựa
            const dx = hx - 16 - i * 3 + spread;
            const dy = hy + 16 - lift;

            // Hạt bụi to nhỏ đan xen
            const size = 3 - (lift / 5);
            if (size > 0.5) {
                ctx.fillStyle = i % 2 === 0 ? dustColor : pColor;
                ctx.beginPath();
                ctx.arc(dx, dy, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Vết nện móng ngựa (đạp xuống đất)
        const stomp = Math.sin(unit.animTimer * 18);
        if (stomp > 0.8) {
            ctx.fillStyle = dustColor;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(hx + 12, hy + 20, 6, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    // Age 4: Glory aura — civ colored
    if (age >= 4) {
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 3) * 0.03;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Kết thúc logic scale tổng thể
    ctx.restore();
}
// ---- HERO VISUAL IDENTITY PER CIVILIZATION ----
export function getCivHeroVisuals(unit: Unit): { color: string; symbol: string } {
    const civ = unit.civilization;
    const t = unit.type;
    let result: { color: string; symbol: string };
    // Each (civ, heroType) gets a unique color + symbol
    if (civ === CivilizationType.BaTu) {
        if (t === UnitType.HeroZarathustra) result = { color: '#ff4400', symbol: '🔥' };
        else result = { color: '#ff4400', symbol: '🔥' }; // Default for BaTu
    } else if (civ === CivilizationType.DaiMinh) {
        if (t === UnitType.HeroQiJiguang) result = { color: '#ff9800', symbol: '🏹' };
        else result = { color: '#ff9800', symbol: '🏹' }; // Default for DaiMinh
    } else if (civ === CivilizationType.Yamato) {
        if (t === UnitType.HeroMusashi) result = { color: '#607d8b', symbol: '⚔' };
        else result = { color: '#607d8b', symbol: '⚔' }; // Default for Yamato
    } else if (civ === CivilizationType.LaMa) {
        if (t === UnitType.HeroSpartacus) result = { color: '#c62828', symbol: '🗡' };
        else result = { color: '#c62828', symbol: '🗡' }; // Default for LaMa
    } else if (civ === CivilizationType.Viking) {
        if (t === UnitType.HeroRagnar) result = { color: '#795548', symbol: '⚔' };
        else result = { color: '#795548', symbol: '⚔' }; // Default for Viking
    } else {
        result = { color: '#ff4444', symbol: '⚔' };
    }
    // Override color with slot color from lobby
    if (unit.slotColor) result.color = unit.slotColor;
    return result;
}

// ---- HERO RENDERER — CIVILIZATION SPECIFIC ----
export function drawHero(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, color: string, _symbol: string): void {
    const cv = getCivColors(unit);
    const legSwing = moving ? Math.sin(unit.animTimer * 12) * 3 : 0;
    const ht = unit.type;

    if (ht === UnitType.HeroMusashi) {
        drawMusashiComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroSpartacus) {
        drawSpartacusComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroRagnar) {
        drawRagnarComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroQiJiguang) {
        drawQiJiguangComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroZarathustra) {
        drawZarathustraComplete(unit, ctx, bob, moving, legSwing, cv);
    } else {
        // Fallback for unknown heroes
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(-5, -20 + bob, 10, 20);
    }

    // Hero level indicator
    if (unit.heroLevel > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${unit.heroLevel}`, 0, -32 + bob);
        ctx.textAlign = 'left';
    }
}
