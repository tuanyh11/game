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

export function drawKnight(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const civ = cv.civ;
    const lvl = unit.upgradeLevel;

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

    // === HORSE BODY ===
    ctx.fillStyle = horseColor;
    ctx.fillRect(hx - 10, hy, 20, 12);
    ctx.fillStyle = horseHi;
    ctx.fillRect(hx - 10, hy, 20, 3);

    // Horse head
    ctx.fillStyle = horseColor;
    ctx.fillRect(hx + 8, hy - 6, 8, 10);
    ctx.fillStyle = horseDark;
    ctx.fillRect(hx + 14, hy - 4, 3, 4); // snout
    ctx.fillStyle = '#111';
    ctx.fillRect(hx + 12, hy - 4, 2, 2); // eye

    // Horse mane — civ-colored
    ctx.fillStyle = horseDark;
    ctx.fillRect(hx + 6, hy - 4, 4, 3);

    // === HORSE BARDING (ARMOR) — CIVILIZATION SPECIFIC ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Ornate golden blanket with tassels
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(hx - 10, hy + 2, 20, 4);
                ctx.fillStyle = horseTrimColor;
                ctx.fillRect(hx - 10, hy + 2, 20, 1);
                ctx.fillRect(hx - 10, hy + 5, 20, 1);
                // Tassels hanging
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(hx - 9 + i * 4, hy + 6, 2, 3);
                }
                if (age >= 4) {
                    // Head chanfron (golden face plate)
                    ctx.fillStyle = '#c9a84c';
                    ctx.fillRect(hx + 8, hy - 6, 8, 3);
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(hx + 11, hy - 7, 2, 2); // spike
                }
            }
            break;
        case CivilizationType.DaiMinh:
            // Red lacquered barding with dragon motif
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(hx - 10, hy + 1, 20, 5);
                // Dragon-scale pattern
                ctx.fillStyle = cv.bodyLight;
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(hx - 8 + i * 5, hy + 2, 3, 3);
                }
                ctx.fillStyle = horseTrimColor;
                ctx.fillRect(hx - 10, hy + 1, 20, 1);
                if (age >= 4) {
                    // Full head armor (mengu)
                    ctx.fillStyle = cv.bodyDark;
                    ctx.fillRect(hx + 8, hy - 6, 8, 3);
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(hx + 10, hy - 7, 4, 2);
                }
            }
            break;
        case CivilizationType.Yamato:
            // Dark lacquered barding with samurai aesthetics
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(hx - 10, hy + 1, 20, 5);
                // Red lacing detail
                ctx.fillStyle = horseTrimColor;
                for (let i = 0; i < 6; i++) {
                    ctx.fillRect(hx - 9 + i * 3, hy + 2, 1, 3);
                }
                if (age >= 4) {
                    // Full head armor — kabuto style
                    ctx.fillStyle = cv.bodyDark;
                    ctx.fillRect(hx + 8, hy - 6, 8, 3);
                    ctx.fillStyle = cv.bodyLight;
                    ctx.fillRect(hx + 8, hy - 7, 8, 1);
                }
            }
            break;
        case CivilizationType.LaMa:
            // Roman-style barding — segmented metal plates
            if (age >= 3) {
                ctx.fillStyle = '#6a6a68';
                ctx.fillRect(hx - 10, hy + 1, 20, 5);
                // Metal segments
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(hx - 9, hy + 2 + i, 18, 1);
                }
                // Red cloth below barding
                ctx.fillStyle = '#8b0000';
                ctx.fillRect(hx - 10, hy + 5, 20, 2);
                ctx.fillStyle = horseTrimColor;
                ctx.fillRect(hx - 10, hy + 1, 20, 1);
                if (age >= 4) {
                    // Full head chanfron — metal with gold accents
                    ctx.fillStyle = '#5a5a58';
                    ctx.fillRect(hx + 8, hy - 6, 8, 3);
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(hx + 11, hy - 7, 2, 2);
                }
            }
            break;
        case CivilizationType.Viking:
            // Fur-covered horse blanket, minimal metal
            if (age >= 3) {
                ctx.fillStyle = horseBlankColor;
                ctx.fillRect(hx - 10, hy + 1, 20, 5);
                // Fur texture
                ctx.fillStyle = '#6a5a3a';
                ctx.fillRect(hx - 10, hy + 1, 20, 2);
                ctx.fillStyle = '#4a3a1a';
                ctx.fillRect(hx - 10, hy + 5, 20, 1);
                if (age >= 4) {
                    // Simple metal face plate
                    ctx.fillStyle = '#4a4a48';
                    ctx.fillRect(hx + 8, hy - 6, 8, 3);
                }
            }
            break;
    }

    // Horse legs
    ctx.fillStyle = horseDark;
    ctx.fillRect(hx - 8, hy + 10, 3, 7 + legBob);
    ctx.fillRect(hx - 3, hy + 10, 3, 7 - legBob);
    ctx.fillRect(hx + 3, hy + 10, 3, 7 + legBob);
    ctx.fillRect(hx + 8, hy + 10, 3, 7 - legBob);
    // Hooves
    ctx.fillStyle = '#222';
    ctx.fillRect(hx - 9, hy + 16 + legBob, 4, 2);
    ctx.fillRect(hx - 4, hy + 16 - legBob, 4, 2);
    ctx.fillRect(hx + 2, hy + 16 + legBob, 4, 2);
    ctx.fillRect(hx + 7, hy + 16 - legBob, 4, 2);

    // Horse tail — civ-tinted
    ctx.fillStyle = horseDark;
    ctx.fillRect(hx - 12, hy + 1, 4, 2);
    ctx.fillRect(hx - 14, hy + 2, 3, 4);

    // === RIDER ===
    const riderY = hy - 16;

    // Cape — civ body colored
    if (age >= 3) {
        ctx.fillStyle = cv.bodyDark;
        const capeWave = moving ? Math.sin(unit.animTimer * 12) * 2 : 0;
        ctx.fillRect(hx - 6, riderY + 4, 3, 14 + capeWave);
        // Accent edge
        ctx.fillStyle = cv.accent;
        ctx.fillRect(hx - 6, riderY + 4, 1, 14 + capeWave);
    }

    // Rider body — CIV COLORED ARMOR (uses cv.bodyLight/Mid/Dark)
    ctx.fillStyle = age >= 4 ? cv.bodyDark : age >= 3 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(hx - 4, riderY + 2, 8, 12);

    // Per-civ armor detail overlays
    switch (civ) {
        case CivilizationType.BaTu:
            // Scale pattern overlay
            ctx.fillStyle = 'rgba(255,215,0,0.2)';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(hx - 3, riderY + 3 + i * 3, 6, 1);
            }
            ctx.fillStyle = cv.accent;
            ctx.fillRect(hx - 4, riderY + 2, 8, 2); // gold sash
            break;
        case CivilizationType.DaiMinh:
            // Lamellar pattern
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(hx - 3, riderY + 3 + i * 2, 6, 1);
            }
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(hx - 2, riderY + 6, 4, 3); // dragon emblem
            break;
        case CivilizationType.Yamato:
            // Red lacing (odoshi)
            ctx.fillStyle = cv.accent;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(hx - 3, riderY + 3 + i * 3, 6, 1);
            }
            // Sode (shoulder guards) — civ body dark
            ctx.fillStyle = cv.bodyDark;
            ctx.fillRect(hx - 7, riderY + 1, 4, 7);
            ctx.fillRect(hx + 3, riderY + 1, 4, 7);
            ctx.fillStyle = cv.accent;
            ctx.fillRect(hx - 7, riderY + 1, 4, 1);
            ctx.fillRect(hx + 3, riderY + 1, 4, 1);
            break;
        case CivilizationType.LaMa:
            // Segmented bands
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(hx - 3, riderY + 3 + i * 3, 6, 1);
            }
            ctx.fillStyle = cv.secondary;
            ctx.fillRect(hx - 2, riderY + 5, 4, 3); // eagle
            ctx.fillStyle = cv.bodyLight;
            ctx.fillRect(hx - 4, riderY + 10, 8, 2); // sash
            break;
        case CivilizationType.Viking:
            // Chain pattern
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(hx - 3, riderY + 4 + i * 3, 6, 1);
            }
            // Fur collar
            ctx.fillStyle = '#6a5a3a';
            ctx.fillRect(hx - 5, riderY + 1, 10, 3);
            ctx.fillStyle = '#5a4a2a';
            ctx.fillRect(hx - 5, riderY + 3, 10, 1);
            break;
    }

    // Shoulder plates (non-Yamato, since Yamato has sode above)
    if (civ !== CivilizationType.Yamato) {
        ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid;
        ctx.fillRect(hx - 6, riderY + 1, 3, 5);
        ctx.fillRect(hx + 3, riderY + 1, 3, 5);
        if (age >= 4) {
            ctx.fillStyle = cv.accent;
            ctx.fillRect(hx - 6, riderY + 1, 3, 1);
            ctx.fillRect(hx + 3, riderY + 1, 3, 1);
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
            ctx.fillStyle = age >= 4 ? '#5a6a8a' : '#4a5a7a';
            ctx.fillRect(hx - 4, riderY - 10, 8, 5);
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(hx - 2, riderY - 6, 4, 1);
    }

    // === WEAPON — CIVILIZATION SPECIFIC ===
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
            // Generic lance
            ctx.fillStyle = age >= 4 ? '#5a3a18' : '#8B5E3C';
            ctx.fillRect(hx + 5, riderY - 4, 2, 18);
            ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
            ctx.beginPath();
            ctx.moveTo(hx + 5, riderY - 10);
            ctx.lineTo(hx + 6, riderY - 4);
            ctx.lineTo(hx + 7, riderY - 10);
            ctx.closePath();
            ctx.fill();
    }

    // Upgrade stars
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, riderY - 16);
    }

    // Dust particles when moving — civ-tinted
    if (moving) {
        let dustColor: string;
        switch (civ) {
            case CivilizationType.BaTu: dustColor = '#c9a060'; break;
            case CivilizationType.Viking: dustColor = '#6a6a68'; break;
            default: dustColor = '#8a7a60';
        }
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = dustColor;
        for (let i = 0; i < 3; i++) {
            const dx = -14 - i * 4 + Math.sin(unit.animTimer * 10 + i) * 3;
            const dy = hy + 14 + Math.random() * 4;
            ctx.fillRect(dx, dy, 3, 2);
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
    const civ = cv.civ;
    const legSwing = moving ? Math.sin(unit.animTimer * 12) * 3 : 0;

    // Glowing aura — civ-colored pulsating aura
    const auraColor = cv.accent;
    const pulse = Math.sin(unit.animTimer * 4) * 0.15 + 0.35;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, -4 + bob, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ----- LEGS — civilization styled -----
    switch (civ) {
        case CivilizationType.Yamato:
            // Flowing indigo hakama (袴) with pleats
            ctx.fillStyle = '#1a1a3a';
            ctx.fillRect(-6, 4 + bob, 5, 8 + legSwing); // left leg
            ctx.fillRect(1, 4 + bob, 5, 8 - legSwing); // right leg
            // Hakama pleat lines
            ctx.fillStyle = '#12122a';
            ctx.fillRect(-4, 5 + bob, 1, 6 + legSwing);
            ctx.fillRect(3, 5 + bob, 1, 6 - legSwing);
            // Gold waist tie (obi)
            ctx.fillStyle = '#cc9944';
            ctx.fillRect(-7, 3 + bob, 14, 2);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(5, 2 + bob, 3, 3); // tied knot
            // Wooden geta sandals
            ctx.fillStyle = '#6a4a20';
            ctx.fillRect(-6, 12 + bob + legSwing, 5, 2);
            ctx.fillRect(1, 12 + bob - legSwing, 5, 2);
            ctx.fillStyle = '#4a3010';
            ctx.fillRect(-5, 13 + bob + legSwing, 1, 1); // strap
            ctx.fillRect(3, 13 + bob - legSwing, 1, 1);
            break;
        case CivilizationType.LaMa:
            // Red greaves
            ctx.fillStyle = '#5a1a1a';
            ctx.fillRect(-5, 4 + bob, 4, 8 + legSwing);
            ctx.fillRect(1, 4 + bob, 4, 8 - legSwing);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-5, 10 + legSwing, 4, 2);
            ctx.fillRect(1, 10 - legSwing, 4, 2);
            break;
        case CivilizationType.Viking:
            // Fur-wrapped legs
            ctx.fillStyle = '#3a3a28';
            ctx.fillRect(-5, 4 + bob, 4, 8 + legSwing);
            ctx.fillRect(1, 4 + bob, 4, 8 - legSwing);
            ctx.fillStyle = '#5a4a2a';
            ctx.fillRect(-5, 8 + legSwing, 4, 3);
            ctx.fillRect(1, 8 - legSwing, 4, 3);
            break;
        case CivilizationType.DaiMinh:
            // Ming-style red trousers with gold knee guards
            ctx.fillStyle = '#4a1a1a';
            ctx.fillRect(-5, 4 + bob, 4, 8 + legSwing);
            ctx.fillRect(1, 4 + bob, 4, 8 - legSwing);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-5, 8 + legSwing, 4, 1);
            ctx.fillRect(1, 8 - legSwing, 4, 1);
            break;
        case CivilizationType.BaTu:
            // Persian cavalry trousers with embroidery
            ctx.fillStyle = '#3a2010';
            ctx.fillRect(-5, 4 + bob, 5, 8 + legSwing); // left leg
            ctx.fillRect(1, 4 + bob, 5, 8 - legSwing); // right leg
            // Gold embroidered knee bands
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-5, 8 + bob + legSwing, 5, 1);
            ctx.fillRect(1, 8 + bob - legSwing, 5, 1);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-4, 8 + bob + legSwing, 3, 0.5);
            ctx.fillRect(2, 8 + bob - legSwing, 3, 0.5);
            // Persian pointed boots with curled tips
            ctx.fillStyle = '#4a2a10';
            ctx.fillRect(-6, 12 + bob + legSwing, 6, 2);
            ctx.fillRect(1, 12 + bob - legSwing, 6, 2);
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(-7, 12 + bob + legSwing, 2, 1); // curled tip
            ctx.fillRect(6, 12 + bob - legSwing, 2, 1);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-6, 12 + bob + legSwing, 6, 0.5); // gold edge
            ctx.fillRect(1, 12 + bob - legSwing, 6, 0.5);
            break;
        default:
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(-5, 4 + bob, 4, 8 + legSwing);
            ctx.fillRect(1, 4 + bob, 4, 8 - legSwing);
    }

    // ----- BODY — civilization specific armor -----
    switch (civ) {
        case CivilizationType.BaTu:
            // Persian Royal Lamellar Armor — Rostam (رستم)
            // Chain mail underlayer
            ctx.fillStyle = '#4a4a48';
            ctx.fillRect(-8, -7 + bob, 16, 13);
            // Main lamellar chest plate — dark bronze
            ctx.fillStyle = '#6a5a2a';
            ctx.fillRect(-7, -8 + bob, 14, 14);
            // Lamellar plate rows
            ctx.fillStyle = '#8a7030';
            ctx.fillRect(-6, -7 + bob, 12, 2);
            ctx.fillRect(-6, -4 + bob, 12, 2);
            ctx.fillRect(-6, -1 + bob, 12, 2);
            ctx.fillRect(-6, 2 + bob, 12, 2);
            // Plate highlights
            ctx.fillStyle = '#a08838';
            ctx.fillRect(-6, -7 + bob, 12, 0.5);
            ctx.fillRect(-6, -4 + bob, 12, 0.5);
            ctx.fillRect(-6, -1 + bob, 12, 0.5);
            ctx.fillRect(-6, 2 + bob, 12, 0.5);
            // Gold border trim (top + bottom)
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-7, -8 + bob, 14, 1);
            ctx.fillRect(-7, 5 + bob, 14, 1);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-6, -8 + bob, 12, 0.5); // highlight
            // Farvahar emblem on chest (فروهر)
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, -2 + bob, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Wings of Farvahar
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-5, -3 + bob, 3, 1); // left wing
            ctx.fillRect(2, -3 + bob, 3, 1); // right wing
            ctx.fillRect(-6, -2 + bob, 2, 1);
            ctx.fillRect(4, -2 + bob, 2, 1);
            // Center figure
            ctx.fillStyle = '#ffeedd';
            ctx.fillRect(-0.5, -3 + bob, 1, 2);
            // Crimson sash (flowing)
            ctx.fillStyle = '#cc2222';
            ctx.fillRect(-8, 4 + bob, 16, 2);
            ctx.fillStyle = '#aa1818';
            ctx.fillRect(-9, 5 + bob, 3, 4); // sash tail left
            ctx.fillRect(6, 5 + bob, 3, 3); // sash tail right
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-8, 4 + bob, 16, 0.5); // gold edge
            // Lion-head pauldrons (شانه‌بند شیر)
            ctx.fillStyle = '#6a5a2a';
            ctx.fillRect(-12, -8 + bob, 5, 10);
            ctx.fillRect(7, -8 + bob, 5, 10);
            // Pauldron plate lines
            ctx.fillStyle = '#8a7030';
            ctx.fillRect(-12, -6 + bob, 5, 1);
            ctx.fillRect(7, -6 + bob, 5, 1);
            ctx.fillRect(-12, -3 + bob, 5, 1);
            ctx.fillRect(7, -3 + bob, 5, 1);
            // Gold trim on pauldrons
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-12, -8 + bob, 5, 1);
            ctx.fillRect(7, -8 + bob, 5, 1);
            // Turquoise gems on pauldrons (فیروزه)
            ctx.fillStyle = '#44bbaa';
            ctx.fillRect(-11, -5 + bob, 2, 2);
            ctx.fillRect(9, -5 + bob, 2, 2);
            ctx.fillStyle = '#66ddcc';
            ctx.fillRect(-10.5, -4.5 + bob, 1, 1); // gem shine
            ctx.fillRect(9.5, -4.5 + bob, 1, 1);
            break;

        case CivilizationType.DaiMinh:
            // Ming Dynasty Dragon Scale Armor (明朝龍鳞甲)
            ctx.fillStyle = '#8a0a0a';
            ctx.fillRect(-8, -8 + bob, 16, 14);
            ctx.fillStyle = '#aa1111';
            ctx.fillRect(-6, -6 + bob, 12, 10);
            // Dragon scale pattern
            ctx.fillStyle = 'rgba(255,215,0,0.15)';
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    ctx.fillRect(-5 + c * 3 + (r % 2), -5 + bob + r * 3, 2, 2);
                }
            }
            // Gold collar (金領)
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-8, -8 + bob, 16, 2);
            // Phoenix emblem on chest (鳳凰)
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-3, -3 + bob, 6, 4);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-2, -2 + bob, 4, 2);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-1, -1 + bob, 2, 1);
            // Red cloth skirt (戰裙)
            ctx.fillStyle = '#cc2222';
            ctx.fillRect(-7, 4 + bob, 14, 3);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-7, 4 + bob, 14, 1);
            // Shoulder pauldrons
            ctx.fillStyle = '#8a0a0a';
            ctx.fillRect(-10, -7 + bob, 4, 8);
            ctx.fillRect(6, -7 + bob, 4, 8);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-10, -7 + bob, 4, 1);
            ctx.fillRect(6, -7 + bob, 4, 1);
            break;

        case CivilizationType.Yamato:
            // Premium ō-yoroi (大鎧) — Miyamoto Musashi's battle armor
            // Chain mail underlayer (kusari)
            ctx.fillStyle = '#3a3a40';
            ctx.fillRect(-8, -7 + bob, 16, 13);
            // Main dō (chest plate) — dark iron
            ctx.fillStyle = '#2a2a35';
            ctx.fillRect(-7, -8 + bob, 14, 14);
            // Layered red lacing (odoshi 威) — gradient crimson
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(-6, -6 + bob, 12, 1);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-6, -3 + bob, 12, 1);
            ctx.fillStyle = '#bb2828';
            ctx.fillRect(-6, 0 + bob, 12, 1);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-6, 3 + bob, 12, 1);
            // Gold border trim (top + bottom of dō)
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-7, -8 + bob, 14, 1);
            ctx.fillRect(-7, 5 + bob, 14, 1);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-6, -8 + bob, 12, 0.5); // highlight
            // Miyamoto crest — circle (丸) on chest
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, -2 + bob, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-0.5, -3 + bob, 1, 2); // center dot
            // Kusazuri (skirt plates 草摺)
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-8, 5 + bob, 6, 4);
            ctx.fillRect(2, 5 + bob, 6, 4);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-8, 5 + bob, 6, 0.5);
            ctx.fillRect(2, 5 + bob, 6, 0.5);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-8, 8 + bob, 6, 0.5); // gold tip
            ctx.fillRect(2, 8 + bob, 6, 0.5);
            // Ō-sode (large shoulder guards 大袖)
            ctx.fillStyle = '#2a2a35';
            ctx.fillRect(-12, -8 + bob, 5, 12);
            ctx.fillRect(7, -8 + bob, 5, 12);
            // Sode lacing layers
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(-12, -6 + bob, 5, 1);
            ctx.fillRect(7, -6 + bob, 5, 1);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-12, -3 + bob, 5, 1);
            ctx.fillRect(7, -3 + bob, 5, 1);
            ctx.fillStyle = '#bb2828';
            ctx.fillRect(-12, 0 + bob, 5, 1);
            ctx.fillRect(7, 0 + bob, 5, 1);
            // Sode gold trim
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-12, -8 + bob, 5, 1);
            ctx.fillRect(7, -8 + bob, 5, 1);
            ctx.fillRect(-12, 3 + bob, 5, 0.5);
            ctx.fillRect(7, 3 + bob, 5, 0.5);
            // Gold rivets on sode
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-11, -5 + bob, 1, 1);
            ctx.fillRect(10, -5 + bob, 1, 1);
            break;

        case CivilizationType.LaMa:
            // Praetorian lorica with purple cape
            ctx.fillStyle = '#5a005a';
            ctx.fillRect(-10, -6 + bob, 4, 14); // cape left
            ctx.fillRect(6, -6 + bob, 4, 14);  // cape right
            ctx.fillStyle = '#6a6a68';
            ctx.fillRect(-8, -8 + bob, 16, 14);
            // Segmented bands
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(-7, -7 + bob + i * 3, 14, 1);
            }
            // Gold eagle emblem
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-3, -4 + bob, 6, 4);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-2, -3 + bob, 4, 2);
            // Red sash
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(-8, 1 + bob, 16, 2);
            break;

        case CivilizationType.Viking:
            // 🐺 Ragnar — Berserker (Bare chest with glowing runic tattoos + heavy fur)
            // Bare muscular chest
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-8, -8 + bob, 16, 12);

            // Pectorals & Abs shading
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(-8, -4 + bob, 16, 1); // under pecs
            ctx.fillRect(-1, -3 + bob, 2, 6);  // center ab line
            ctx.fillRect(-5, 0 + bob, 10, 1);  // ab division

            // Glowing blue runic tattoos on chest/arms
            ctx.fillStyle = '#88ddff';
            ctx.globalAlpha = 0.7 + Math.sin(unit.animTimer * 4) * 0.3; // pulsating glow
            // Center chest rune
            ctx.fillRect(-2, -7 + bob, 4, 1);
            ctx.fillRect(-1, -8 + bob, 2, 4);
            // Arm/shoulder tattoos
            ctx.fillRect(-9, -6 + bob, 2, 4);
            ctx.fillRect(7, -6 + bob, 2, 4);
            ctx.globalAlpha = 1;

            // Heavy leather & fur belt
            ctx.fillStyle = '#3a2a18';
            ctx.fillRect(-9, 4 + bob, 18, 5); // wide leather belt
            // Gold belt buckle
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-4, 3 + bob, 8, 6);
            ctx.fillStyle = '#111';
            ctx.fillRect(-2, 5 + bob, 4, 2);

            // Thick wolf pelt draped over shoulders and back
            ctx.fillStyle = '#4a4a4a'; // dark grey wolf fur
            ctx.fillRect(-11, -10 + bob, 22, 6); // huge shoulder pelt
            ctx.fillRect(-12, -9 + bob, 2, 4); // spilling over arms
            ctx.fillRect(10, -9 + bob, 2, 4);
            // Lighter grey fur highlights
            ctx.fillStyle = '#7a7a7a';
            ctx.fillRect(-9, -10 + bob, 18, 2);
            ctx.fillRect(-10, -7 + bob, 3, 2);
            ctx.fillRect(7, -7 + bob, 3, 2);

            // Fur kilt / Faulds
            ctx.fillStyle = '#5a4a3a';
            ctx.fillRect(-8, 9 + bob, 16, 4);
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-8, 13 + bob, 16, 2); // jagged fur edge
            break;

        default:
            ctx.fillStyle = cv.bodyMid;
            ctx.fillRect(-7, -8 + bob, 14, 14);
            ctx.fillStyle = color;
            ctx.fillRect(-5, -6 + bob, 10, 10);
    }

    // ----- HEAD — unique per mythological hero -----
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -16 + bob, 8, 9);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -12 + bob, 2, 2);
    ctx.fillRect(1, -12 + bob, 2, 2);

    const ht = unit.type;
    if (ht === UnitType.HeroZarathustra) {
        // 🔥 Zarathustra — Zoroastrian Mobed (Magi) Attire
        // Matha (traditional white/cream cap)
        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(-5, -24 + bob, 10, 8);
        // Cap folds/texture
        ctx.fillStyle = '#e0e0d8';
        ctx.fillRect(-4, -22 + bob, 8, 2);
        ctx.fillRect(-5, -18 + bob, 10, 2);
        // Padam (white cloth veil over mouth to protect sacred fire)
        ctx.fillStyle = '#fdfdfd';
        ctx.fillRect(-5, -10 + bob, 10, 5);
        // Veil folds
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(-3, -9 + bob, 1, 4);
        ctx.fillRect(2, -9 + bob, 1, 4);
        // Long gray beard peering from under the veil
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(-4, -5 + bob, 8, 6);
        ctx.fillStyle = '#999999';
        ctx.fillRect(-2, -5 + bob, 4, 8); // beard tip
        // Golden flame symbol on the cap
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(0, -22 + bob);
        ctx.quadraticCurveTo(-2, -19 + bob, 0, -18 + bob);
        ctx.quadraticCurveTo(2, -19 + bob, 0, -22 + bob);
        ctx.fill();
    } else if (ht === UnitType.HeroQiJiguang) {
        // 🛡️ Thích Kế Quang — Ming General Helmet
        // Steel base
        ctx.fillStyle = '#6a6a68';
        ctx.fillRect(-5, -22 + bob, 10, 6);
        // Neck guard (flared out)
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(-7, -18 + bob, 2, 6);
        ctx.fillRect(5, -18 + bob, 2, 6);
        // Gold rim/trim
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-6, -17 + bob, 12, 1);
        ctx.fillRect(-2, -22 + bob, 4, 4); // gold center ridge
        // Red tassel (Mao)
        ctx.fillStyle = '#dd1111';
        ctx.fillRect(-1, -26 + bob, 2, 4);
        ctx.fillRect(-2, -24 + bob, 4, 2);
        // Face (beard)
        ctx.fillStyle = '#222';
        ctx.fillRect(-4, -10 + bob, 8, 3); // neat black beard
    } else if (ht === UnitType.HeroMusashi) {
        // ⚔️ Musashi — Ronin warrior with wild topknot
        // Wild flowing hair base
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-5, -23 + bob, 10, 6);
        // Topknot (mage 髷)
        ctx.fillStyle = '#111';
        ctx.fillRect(-2, -26 + bob, 4, 4);
        ctx.fillRect(0, -28 + bob, 2, 3); // tall knot
        // Loose hair strands (wild ronin look)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-6, -20 + bob, 2, 5); // left strand
        ctx.fillRect(4, -20 + bob, 2, 4); // right strand
        ctx.fillStyle = '#222';
        ctx.fillRect(-7, -18 + bob, 1, 3); // flyaway
        // Hachimaki headband (鉢巻) — white with red sun
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(-6, -20 + bob, 12, 2);
        // Red sun mark (hinomaru) on headband center
        ctx.fillStyle = '#cc2222';
        ctx.beginPath();
        ctx.arc(0, -19 + bob, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Headband tails flowing right
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(5, -21 + bob, 4, 1.5);
        ctx.fillRect(7, -20 + bob, 3, 1);
        // Battle scar across cheek
        ctx.strokeStyle = '#aa6655';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-3, -14 + bob);
        ctx.lineTo(2, -16 + bob);
        ctx.stroke();
    } else if (ht === UnitType.HeroSpartacus) {
        // 🗡️ Spartacus — Gladiator murmillo helm with wide visor
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(-6, -21 + bob, 12, 5);
        ctx.fillRect(-7, -16 + bob, 3, 5); // cheek
        ctx.fillRect(4, -16 + bob, 3, 5);
        // Wide crest (smaller than centurion)
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-4, -25 + bob, 8, 4);
        // Visor holes
        ctx.fillStyle = '#222';
        ctx.fillRect(-3, -16 + bob, 2, 1);
        ctx.fillRect(1, -16 + bob, 2, 1);
    } else if (ht === UnitType.HeroRagnar) {
        // ⚔️ Ragnar — Horned Iron Helm & Epic Viking Beard
        ctx.fillStyle = '#3a3a38';
        ctx.fillRect(-7, -22 + bob, 14, 6); // heavy iron base
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(0, -18 + bob, 2, 6); // nose guard extending down
        // Helmet rivets and rim
        ctx.fillStyle = '#222';
        ctx.fillRect(-7, -17 + bob, 14, 1);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-2, -22 + bob, 4, 1); // subtle gold top
        // Large curved horns
        ctx.fillStyle = '#e8dec0'; // bone color
        // Left horn
        ctx.fillRect(-11, -25 + bob, 4, 5);
        ctx.fillRect(-13, -28 + bob, 3, 4);
        ctx.fillRect(-14, -31 + bob, 2, 4);
        // Right horn
        ctx.fillRect(7, -25 + bob, 4, 5);
        ctx.fillRect(10, -28 + bob, 3, 4);
        ctx.fillRect(12, -31 + bob, 2, 4);
        // Horn weathering (darker tips and base rings)
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(-8, -21 + bob, 2, 2); // left horn base ring
        ctx.fillRect(6, -21 + bob, 2, 2);  // right horn base ring
        ctx.fillStyle = '#d0c0a0';
        ctx.fillRect(-14, -31 + bob, 1, 2); // left tip
        ctx.fillRect(13, -31 + bob, 1, 2);  // right tip
        // Glowing Rune on forehead
        ctx.fillStyle = '#88ddff';
        ctx.globalAlpha = 0.5 + Math.sin(unit.animTimer * 5) * 0.4;
        ctx.fillRect(-2, -20 + bob, 4, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1, -19.5 + bob, 2, 1); // inner bright spot
        ctx.globalAlpha = 1;
        // Epic braided blonde beard
        ctx.fillStyle = '#eebb55'; // vibrant blonde
        ctx.fillRect(-6, -11 + bob, 12, 6); // main beard bulk
        ctx.fillRect(-4, -5 + bob, 8, 4);  // tapers down
        ctx.fillRect(-2, -1 + bob, 4, 3);  // longest tip
        // Beard braids detail (darker lines)
        ctx.fillStyle = '#c09030';
        ctx.fillRect(-5, -10 + bob, 1, 8);
        ctx.fillRect(4, -10 + bob, 1, 8);
        ctx.fillRect(-1, -4 + bob, 2, 5); // center braid
        ctx.fillStyle = '#fff'; // center braid tie
        ctx.fillRect(-1, -1 + bob, 2, 1);
        // Warpaint (Blue stripes over eyes)
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(-5, -13 + bob, 4, 1);
        ctx.fillRect(1, -13 + bob, 4, 1);
    } else {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-5, -20 + bob, 10, 3);
        ctx.fillRect(-3, -22 + bob, 6, 2);
    }

    // ----- WEAPON — unique per mythological hero -----
    const heroT = unit.type;

    if (heroT === UnitType.HeroMusashi) {
        // ⚔️ Musashi — Dual katanas with both arms (Niten Ichi-ryū 二天一流)
        ctx.save();

        const isYamatoAttacking = unit.state === UnitState.Attacking && unit.attackAnimTimer > 0;

        if (isYamatoAttacking) {
            // === ATTACKING: Dual slash stance ===
            const swingPhase = (unit.attackAnimTimer * 10) % (Math.PI * 2);
            const swingCycle = Math.sin(unit.attackAnimTimer * 10);
            const slashR = swingCycle * 1.2;
            const slashL = -swingCycle * 1.0 + 0.3;

            // Right arm + main katana
            ctx.save();
            ctx.translate(8, -6 + bob);
            ctx.rotate(slashR);
            // Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 4, 4, 6); // upper arm
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-2, 8, 4, 4); // sleeve
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 11, 4, 3); // hand
            // Main katana (longer)
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.quadraticCurveTo(3, -10, 1, 0);
            ctx.lineTo(2, 0);
            ctx.quadraticCurveTo(4, -10, 1, -18);
            ctx.closePath();
            ctx.fill();
            // Edge shine
            ctx.fillStyle = '#fff';
            ctx.fillRect(0.5, -16, 0.5, 14);
            // Tsuba (guard)
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-2, 0, 5, 2);
            // Handle
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-1, 2, 3, 4);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-1, 3, 3, 1); // red wrapping
            ctx.restore();

            // Left arm + wakizashi
            ctx.save();
            ctx.translate(-6, -4 + bob);
            ctx.rotate(slashL);
            // Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 2, 4, 5); // upper arm
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-2, 5, 4, 3); // sleeve
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 7, 4, 3); // hand
            // Wakizashi (shorter katana)
            ctx.fillStyle = '#d8d8d8';
            ctx.fillRect(-1, -12, 2, 14);
            ctx.fillStyle = '#eee';
            ctx.fillRect(-0.5, -11, 0.5, 12); // shine
            // Tsuba
            ctx.fillStyle = '#cc9944';
            ctx.fillRect(-2, 0, 4, 1.5);
            // Handle
            ctx.fillStyle = '#1a1a2a';
            ctx.restore();

            // Removed extra save for outer restore
            ctx.restore(); // Balance the top-level save()
        } else {
            // === IDLE: Dual sword ready stance ===
            // Right arm + main katana (angled forward-down)
            ctx.save();
            ctx.translate(9, -6 + bob);
            ctx.rotate(-0.3);
            // Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 4, 4, 6); // upper arm
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-2, 8, 4, 4); // sleeve
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 11, 4, 3); // hand grip
            // Main katana
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.moveTo(-1, -16);
            ctx.quadraticCurveTo(3, -8, 1, 2);
            ctx.lineTo(3, 2);
            ctx.quadraticCurveTo(5, -8, 1, -16);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(0.5, -14, 0.5, 14); // edge shine
            // Tsuba
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-3, 2, 7, 2);
            // Handle
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-1, 4, 3, 5);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-1, 5, 3, 1); // red wrapping
            ctx.restore();

            // Left arm + wakizashi (angled slightly back)
            ctx.save();
            ctx.translate(-8, -4 + bob);
            ctx.rotate(0.4);
            // Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 2, 4, 5); // upper arm
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-2, 5, 4, 3); // sleeve
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 7, 4, 3); // hand grip
            // Wakizashi (shorter)
            ctx.fillStyle = '#d0d0d0';
            ctx.fillRect(-1, -10, 2, 14);
            ctx.fillStyle = '#ddd';
            ctx.fillRect(-0.5, -9, 0.5, 12); // shine
            // Tsuba
            ctx.fillStyle = '#cc9944';
            ctx.fillRect(-2, 2, 4, 1.5);
            // Handle
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(-1, 3, 2, 4);
            ctx.restore();

            // Removed Extra save for outer
            ctx.restore(); // Balance the top-level save()
        }
    } else if (heroT === UnitType.HeroSpartacus) {
        // 🗡️ Spartacus — Gladius + scutum shield with arms
        ctx.save();

        const isLaMaAttacking = unit.state === UnitState.Attacking && unit.attackAnimTimer > 0;

        // Left arm + scutum shield
        ctx.save();
        if (isLaMaAttacking) {
            const shieldBash = Math.max(0, Math.sin(unit.attackAnimTimer * 10)) * 4;
            ctx.translate(-8 + shieldBash, -4 + bob);
        } else {
            ctx.translate(-10, -4 + bob);
        }
        ctx.rotate(isLaMaAttacking ? -0.1 : 0.15);
        // Arm
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-2, 2, 4, 5);
        ctx.fillStyle = '#5a1a1a';
        ctx.fillRect(-2, 5, 4, 3); // leather bracer
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-2, 7, 4, 3);
        // Scutum shield
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-6, -8, 10, 18);
        // Gold boss
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.arc(-1, 1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-1, 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Gold rim
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 1;
        ctx.strokeRect(-6, -8, 10, 18);
        // SPQR eagle wings
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-4, -4, 2, 1);
        ctx.fillRect(1, -4, 2, 1);
        ctx.restore();

        // Right arm + gladius
        ctx.save();
        if (isLaMaAttacking) {
            // Slash arc — arm rotates through swing
            const slashAng = Math.sin(unit.attackAnimTimer * 10) * 2.2 - 1.2;
            ctx.translate(6, -8 + bob);
            ctx.rotate(slashAng);
        } else {
            ctx.translate(9, -6 + bob);
            ctx.rotate(-0.3);
        }
        // Arm — follows the sword
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-2, 0, 4, 6); // upper arm
        ctx.fillRect(-2, 4, 4, 5); // forearm
        ctx.fillStyle = '#5a1a1a';
        ctx.fillRect(-2, 7, 4, 3); // bracer
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-2, 9, 4, 3); // hand
        // Gladius blade
        ctx.fillStyle = '#c8c8d0';
        ctx.fillRect(-1, -16, 3, 18);
        ctx.fillStyle = '#e0e0e8';
        ctx.fillRect(-1, -16, 1, 16);
        // Blood groove
        ctx.fillStyle = '#aab';
        ctx.fillRect(0, -14, 1, 12);
        // Guard
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-3, 0, 7, 2);
        // Handle
        ctx.fillStyle = '#6a3a10';
        ctx.fillRect(-1, 2, 3, 5);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-0.5, 2.5, 2, 3.5);
        // Pommel
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, 6, 3, 2);
        ctx.fillStyle = '#cc1111';
        ctx.fillRect(0, 6.5, 1, 1); // ruby
        ctx.restore(); // restore right arm
        ctx.restore(); // restore top-level Spartacus save
    } else if (heroT === UnitType.HeroRagnar) {
        // ⚔️ Ragnar — Dual Axes Idle Stance (Leviathan + Handaxe)
        ctx.save();

        const isVikingAttacking = unit.state === UnitState.Attacking && unit.attackAnimTimer > 0;

        if (isVikingAttacking) {
            // Attack animation is handled in AttackEffects.ts
            // But we still need to draw the arms and axes following the swing
            const swingPhase = (unit.attackAnimTimer * 10) % (Math.PI * 2);
            const swingCycle = Math.sin(unit.attackAnimTimer * 10);
            const chopR = swingCycle * 1.6 - 0.2;
            const chopL = -swingCycle * 1.2 + 0.4;

            // Right Arm + Leviathan Axe (Main)
            ctx.save();
            ctx.translate(8, -6 + bob);
            ctx.rotate(chopR);
            // Right Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 2, 4, 8); // upper arm
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-2, 6, 4, 4); // leather bracer
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 10, 4, 3); // hand
            // Leviathan Axe Handle
            ctx.fillStyle = '#4a2a10';
            ctx.fillRect(-1, -12, 3, 26);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-2, -8, 5, 2); // gold bands
            ctx.fillRect(-2, 2, 5, 2);
            ctx.fillRect(-2, 12, 5, 2);
            // Leviathan Axe Head
            ctx.fillStyle = '#88ccff'; // icy blue glow base
            ctx.fillRect(1, -12, 8, 8);
            ctx.fillStyle = '#d0e0f0'; // steel
            ctx.beginPath();
            ctx.moveTo(2, -14);
            ctx.lineTo(10, -10);
            ctx.lineTo(10, 0);
            ctx.lineTo(2, -6);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(9, -9, 1, 8); // edge
            // Runes
            ctx.fillStyle = '#44ffff';
            ctx.fillRect(4, -10, 2, 2);
            ctx.fillRect(6, -8, 2, 2);
            ctx.fillRect(4, -6, 2, 2);
            ctx.restore();

            // Left Arm + Handaxe
            ctx.save();
            ctx.translate(-6, -4 + bob);
            ctx.rotate(chopL);
            // Left Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 1, 4, 6);
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-2, 4, 4, 3);
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 7, 4, 3);
            // Handaxe
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(-1, -8, 2, 18);
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.moveTo(1, -8);
            ctx.lineTo(6, -5);
            ctx.lineTo(6, 1);
            ctx.lineTo(1, -2);
            ctx.closePath();
            ctx.fill();
            // Blood on left axe
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(4, -4, 2, 4);
            ctx.restore(); // restore left arm
            ctx.restore(); // balance top-level save for Ragnar
        } else {
            // === IDLE: Dual Axe Combat-Ready Stance ===
            // Right Arm + Leviathan Axe (held low, glowing)
            ctx.save();
            ctx.translate(9, -4 + bob);
            ctx.rotate(-0.4);
            // Right Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 2, 4, 7); // drop arm
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-2, 5, 4, 4); // leather bracer
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 9, 4, 3); // hand
            // Leviathan Axe Handle
            ctx.fillStyle = '#4a2a10';
            ctx.fillRect(-1, -8, 3, 24);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(-2, -4, 5, 2); // gold bands
            ctx.fillRect(-2, 4, 5, 2);
            ctx.fillRect(-2, 14, 5, 2);
            // Leviathan Axe Head
            ctx.fillStyle = '#88ccff'; // icy blue glow
            ctx.globalAlpha = 0.5 + Math.sin(unit.animTimer * 6) * 0.3;
            ctx.fillRect(1, -9, 9, 10);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#d0e0f0'; // steel
            ctx.beginPath();
            ctx.moveTo(2, -10);
            ctx.lineTo(10, -6);
            ctx.lineTo(10, 4);
            ctx.lineTo(2, -2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff'; // edge
            ctx.fillRect(9, -5, 1, 8);
            // Runes
            ctx.fillStyle = '#44ffff';
            ctx.fillRect(4, -6, 2, 2);
            ctx.fillRect(6, -4, 2, 2);
            ctx.fillRect(4, -2, 2, 2);
            // Cold mist particles off Leviathan Axe
            ctx.fillStyle = '#ccffff';
            for (let i = 0; i < 3; i++) {
                const mistY = -12 - (unit.animTimer * 8 + i * 4) % 10;
                const mistX = 6 + Math.sin(mistY * 0.5) * 2;
                ctx.globalAlpha = 1 - Math.abs(mistY + 12) / 10;
                ctx.fillRect(mistX, mistY, 1.5, 1.5);
            }
            ctx.globalAlpha = 1;
            ctx.restore();

            // Left Arm + Handaxe (held up/across chest)
            ctx.save();
            ctx.translate(-7, -2 + bob);
            ctx.rotate(0.5);
            // Left Arm
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 0, 4, 6); // upper arm
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-2, 3, 4, 3); // bracer
            ctx.fillStyle = cv.skinColor;
            ctx.fillRect(-2, 6, 4, 3); // hand
            // Handaxe Handle
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(-1, -10, 2, 18);
            // Handaxe Head
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.moveTo(1, -10);
            ctx.lineTo(6, -7);
            ctx.lineTo(6, -1);
            ctx.lineTo(1, -4);
            ctx.closePath();
            ctx.fill();
            // Edge highlighting
            ctx.fillStyle = '#ccc';
            ctx.fillRect(5, -6, 1, 5);
            // Blood stains
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(4, -6, 2, 4);
            ctx.restore(); // balance left arm
        }
        ctx.restore(); // balance the top-level save for Ragnar
    } else if (heroT === UnitType.HeroZarathustra) {
        // 🔥 Zarathustra — Fire scepter, eternal flame on top
        ctx.save();
        ctx.translate(8, -4 + bob);
        // 🔥 Zarathustra — Sacred Fire Scepter (Afarghanyu staff)
        // Dark hardwood shaft with gold spiraling
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(0, -14, 3, 22); // staff
        // Gold spiral wrapping
        ctx.fillStyle = '#daa520';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(0, -12 + i * 4, 3, 1);
        }
        // Base pommel
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, 8, 5, 2);
        // Golden fire Chalice/Urn (Afarghanyu) at the top
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-1, -16, 5, 3); // urn base
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-3, -20);
        ctx.lineTo(6, -20);
        ctx.lineTo(4, -16);
        ctx.lineTo(-1, -16);
        ctx.closePath();
        ctx.fill();
        // Urn side handles
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-3, -18, 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(6, -18, 2, 0, Math.PI * 2);
        ctx.stroke();
        // Raging Eternal Flame (Atar) inside the chalice
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(1.5, -28);
        ctx.quadraticCurveTo(-4, -22, 1.5, -20);
        ctx.quadraticCurveTo(7, -22, 1.5, -28);
        ctx.fill();
        // Inner bright yellow flame
        ctx.fillStyle = '#ffcc00';
        // Flickering intensity
        ctx.globalAlpha = 0.6 + Math.sin(unit.animTimer * 12) * 0.4;
        ctx.beginPath();
        ctx.moveTo(1.5, -26);
        ctx.quadraticCurveTo(-1.5, -22, 1.5, -20);
        ctx.quadraticCurveTo(4.5, -22, 1.5, -26);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Embers floating up from the fire
        ctx.fillStyle = '#ff9900';
        for (let i = 0; i < 4; i++) {
            const emberY = -28 - (unit.animTimer * 15 + i * 5) % 12;
            const emberX = 1.5 + Math.sin(emberY * 0.5 + i) * 3;
            ctx.globalAlpha = 1 - Math.abs(emberY + 28) / 12;
            ctx.fillRect(emberX, emberY, 1.5, 1.5);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    } else if (heroT === UnitType.HeroQiJiguang) {
        // 🗡️ Thích Kế Quang — Trường Đao (Ming Changdao) — Two-handed swing
        ctx.save();
        const isMingAttacking = unit.state === UnitState.Attacking && unit.attackAnimTimer > 0;

        if (isMingAttacking) {
            // Downward diagonal cleave
            const cleavePhase = Math.sin(unit.attackAnimTimer * 10);
            const swordAngle = cleavePhase * 1.5 - 0.5;

            ctx.translate(6, -6 + bob);
            ctx.rotate(swordAngle);
        } else {
            // Idle martial arts stance (blade held upright and slightly back)
            ctx.translate(2, -4 + bob);
            ctx.rotate(0.3);
        }

        // Left Arm (Grips lower handle)
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-6, 2, 8, 4); // forearm reaching across
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(-4, 1, 4, 5); // red sleeve
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(2, 2, 3, 4); // hand gripping

        // Right Arm (Grips upper handle)
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-2, -1, 4, 7);
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(-2, 3, 4, 4); // red bracer
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-2, 7, 4, 3); // hand gripping

        // Changdao Handle (very long)
        ctx.fillStyle = '#222';
        ctx.fillRect(-1, -6, 3, 16); // wrapped handle
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(-1, -2, 3, 1); // red wrap details
        ctx.fillRect(-1, 2, 3, 1);
        ctx.fillRect(-1, 6, 3, 1);
        ctx.fillStyle = '#ffd700'; // gold pommel
        ctx.fillRect(-1.5, 9, 4, 3);

        // Tsuba / Guard (disc-shaped)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-3, -7, 7, 2);

        // Changdao Blade (long curving single edge)
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(1, -7);
        ctx.lineTo(1, -28); // straight spine
        ctx.quadraticCurveTo(0, -32, -2, -30); // curved tip
        ctx.lineTo(-2, -7); // edge
        ctx.closePath();
        ctx.fill();

        // Edge shine
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -28, 1, 21);

        ctx.restore();
    }

    // Hero level indicator
    if (unit.heroLevel > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${unit.heroLevel}`, 0, -28 + bob);
        ctx.textAlign = 'left';
    }
}
