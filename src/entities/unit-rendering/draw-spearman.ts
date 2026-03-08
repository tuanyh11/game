// ============================================================
//  Spearman Renderer — shared across all civilizations
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";

export function drawSpearman(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3 : 0;
    const lvl = unit.upgradeLevel;
    const civ = cv.civ;

    // Body armor — civilization colored
    const armorColor = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillStyle = armorColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    // Age 2+: Armor texture (civ-specific)
    if (age >= 2) {
        if (civ === CivilizationType.DaiMinh || civ === CivilizationType.Yamato) {
            // Lamellar armor pattern
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(-5, -3 + bob + i * 3, 10, 1);
            }
        } else {
            // Chainmail pattern
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(-5, -2 + bob + i * 3, 10, 1);
            }
        }
    }

    // Civilization-specific body accents
    switch (civ) {
        case CivilizationType.BaTu:
            // Gold trim on armor
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(-6, -4 + bob, 12, 2);
            if (age >= 3) {
                ctx.fillRect(-6, 8 + bob, 12, 2);
            }
            break;
        case CivilizationType.Yamato:
            // Samurai sode (shoulder guards) different style
            if (age >= 2) {
                ctx.fillStyle = cv.accent;
                ctx.fillRect(-8, -5 + bob, 3, 6);
                ctx.fillRect(5, -5 + bob, 3, 6);
            }
            break;
        case CivilizationType.Viking:
            // Fur collar
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(-7, -5 + bob, 14, 3);
            break;
        case CivilizationType.LaMa:
            // Red/white skirt (pteruges)
            if (age >= 2) {
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-7, 7 + bob, 14, 3);
                ctx.fillStyle = '#8b0000';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(-6 + i * 3, 10 + bob, 2, 3);
                }
            }
            break;
    }

    // Age 3+: Shoulder plates  
    if (age >= 3 && civ !== CivilizationType.Yamato) {
        ctx.fillStyle = age >= 4 ? cv.accent : cv.secondary;
        ctx.fillRect(-8, -5 + bob, 4, 7);
        ctx.fillRect(4, -5 + bob, 4, 7);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-8, -5 + bob, 4, 1);
            ctx.fillRect(4, -5 + bob, 4, 1);
        }
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -8 + bob, 2, 2);

    // Helmet — CIVILIZATION SPECIFIC
    switch (civ) {
        case CivilizationType.BaTu:
            if (age >= 3) {
                // Persian helmet with chain mail
                ctx.fillStyle = age >= 4 ? '#c9a84c' : '#9a8040';
                ctx.fillRect(-5, -15 + bob, 10, 6);
                // Spike on top
                ctx.fillStyle = age >= 4 ? '#ffd700' : '#c9a84c';
                ctx.fillRect(-1, -19 + bob, 2, 5);
                // Chain veil
                ctx.fillStyle = '#8a8888';
                ctx.fillRect(-5, -10 + bob, 10, 3);
            } else if (age >= 2) {
                ctx.fillStyle = '#9a8040';
                ctx.fillRect(-4, -14 + bob, 8, 5);
                ctx.fillStyle = '#8a8888';
                ctx.fillRect(-4, -10 + bob, 8, 2);
            } else {
                // Turban
                ctx.fillStyle = '#e0d8c0';
                ctx.fillRect(-4, -14 + bob, 8, 4);
            }
            break;
        case CivilizationType.DaiMinh:
            if (age >= 3) {
                // Song dynasty helmet with crest
                ctx.fillStyle = age >= 4 ? '#8a2222' : '#6a3333';
                ctx.fillRect(-5, -15 + bob, 10, 6);
                // Wide brim
                ctx.fillRect(-7, -10 + bob, 14, 2);
                // Top knob
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-1, -18 + bob, 2, 4);
            } else if (age >= 2) {
                ctx.fillStyle = '#6a3333';
                ctx.fillRect(-4, -14 + bob, 8, 4);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-4, -14 + bob, 8, 4);
                ctx.fillRect(-2, -17 + bob, 4, 4);
            }
            break;
        case CivilizationType.Yamato:
            if (age >= 3) {
                // Kabuto (samurai helmet)
                ctx.fillStyle = age >= 4 ? '#1a1a2a' : '#2a2a3a';
                ctx.fillRect(-6, -15 + bob, 12, 6);
                // Maedate (front crest)
                ctx.fillStyle = age >= 4 ? '#ffd700' : '#cc9944';
                ctx.beginPath();
                ctx.moveTo(0, -22 + bob);
                ctx.lineTo(-3, -15 + bob);
                ctx.lineTo(3, -15 + bob);
                ctx.closePath();
                ctx.fill();
                // Shikoro (neck guard)
                ctx.fillStyle = age >= 4 ? '#1a1a2a' : '#2a2a3a';
                ctx.fillRect(-6, -10 + bob, 12, 3);
                // Red lacing detail
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-6, -12 + bob, 12, 1);
            } else if (age >= 2) {
                // Jingasa (simple helmet)
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-5, -14 + bob, 10, 5);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-5, -14 + bob, 10, 1);
            } else {
                // Hachimaki headband
                ctx.fillStyle = '#fff';
                ctx.fillRect(-4, -13 + bob, 8, 2);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(2, -13 + bob, 2, 2);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-4, -15 + bob, 8, 3);
            }
            break;
        case CivilizationType.LaMa:
            if (age >= 3) {
                // Roman galea with crest
                ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58';
                ctx.fillRect(-5, -15 + bob, 10, 6);
                // Cheek guards
                ctx.fillRect(-6, -10 + bob, 3, 4);
                ctx.fillRect(3, -10 + bob, 3, 4);
                // Crest (red plume)
                ctx.fillStyle = age >= 4 ? '#dd2222' : '#aa3333';
                ctx.fillRect(-1, -21 + bob, 2, 8);
                ctx.fillRect(-3, -20 + bob, 6, 2);
                // Gold trim
                if (age >= 4) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-5, -15 + bob, 10, 1);
                }
            } else if (age >= 2) {
                ctx.fillStyle = '#5a5a58';
                ctx.fillRect(-4, -14 + bob, 8, 5);
                ctx.fillStyle = '#333';
                ctx.fillRect(-3, -10 + bob, 6, 1);
            } else {
                ctx.fillStyle = '#333';
                ctx.fillRect(-4, -13 + bob, 8, 4);
            }
            break;
        case CivilizationType.Viking:
            if (age >= 3) {
                // Viking spectacle helm
                ctx.fillStyle = age >= 4 ? '#5a5a58' : '#4a4a48';
                ctx.fillRect(-5, -15 + bob, 10, 6);
                // Nose guard
                ctx.fillStyle = '#6a6a68';
                ctx.fillRect(0, -12 + bob, 2, 5);
                // Eye guards
                ctx.fillRect(-4, -11 + bob, 3, 2);
                ctx.fillRect(2, -11 + bob, 3, 2);
                // Horns (age 4)
                if (age >= 4) {
                    ctx.fillStyle = '#eee';
                    ctx.fillRect(-8, -17 + bob, 2, 5);
                    ctx.fillRect(6, -17 + bob, 2, 5);
                    ctx.fillRect(-9, -18 + bob, 2, 3);
                    ctx.fillRect(7, -18 + bob, 2, 3);
                }
            } else if (age >= 2) {
                ctx.fillStyle = '#4a4a48';
                ctx.fillRect(-4, -14 + bob, 8, 5);
            } else {
                // Messy hair
                ctx.fillStyle = '#b89050';
                ctx.fillRect(-4, -14 + bob, 8, 4);
                ctx.fillRect(-5, -12 + bob, 2, 4);
            }
            break;
    }

    // Shield (left hand) — CIVILIZATION SPECIFIC
    if (age >= 3) {
        switch (civ) {
            case CivilizationType.BaTu:
                // Round ornate shield
                ctx.fillStyle = cv.accent;
                ctx.beginPath();
                ctx.arc(-8, 2 + bob, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(-8, 2 + bob, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case CivilizationType.DaiMinh:
                // Rectangular shield with dragon
                ctx.fillStyle = '#aa1111';
                ctx.fillRect(-11, -3 + bob, 5, 14);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-10, 1 + bob, 3, 3);
                break;
            case CivilizationType.Yamato:
                // No shield (two-handed yari style) — arm guard instead
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-9, -3 + bob, 3, 8);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-9, -3 + bob, 3, 1);
                break;
            case CivilizationType.LaMa:
                // Scutum (tall rectangular shield)
                ctx.fillStyle = '#8b0000';
                ctx.fillRect(-11, -5 + bob, 5, 16);
                // Gold eagle emblem
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-10, 0 + bob, 3, 4);
                // Gold edges
                ctx.strokeStyle = '#daa520';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(-11, -5 + bob, 5, 16);
                break;
            case CivilizationType.Viking:
                // Round wooden shield
                ctx.fillStyle = '#6a5a3a';
                ctx.beginPath();
                ctx.arc(-7, 2 + bob, 7, 0, Math.PI * 2);
                ctx.fill();
                // Metal boss
                ctx.fillStyle = '#8a8a88';
                ctx.beginPath();
                ctx.arc(-7, 2 + bob, 3, 0, Math.PI * 2);
                ctx.fill();
                // Painted stripe
                ctx.fillStyle = cv.accent;
                ctx.fillRect(-8, -1 + bob, 2, 6);
                break;
            default:
                ctx.fillStyle = cv.bodyMid;
                ctx.fillRect(-10, -4 + bob, 5, 14);
                break;
        }
    } else if (age >= 2) {
        // Simple round shield
        ctx.fillStyle = cv.bodyMid;
        ctx.fillRect(-9, -2 + bob, 4, 10);
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-8, 1 + bob, 2, 2);
    }

    // Spear (right hand)
    const spearColor = age >= 4 ? '#ddd' : age >= 3 ? '#ccc' : age >= 2 ? '#bbb' : '#aaa';
    const handleColor = age >= 3 ? '#5a3a18' : '#8B5E3C';
    ctx.fillStyle = handleColor;
    ctx.fillRect(6, -8 + bob, 2, 22);
    ctx.fillStyle = spearColor;
    // Spear head
    ctx.beginPath();
    ctx.moveTo(6, -14 + bob);
    ctx.lineTo(7, -8 + bob);
    ctx.lineTo(8, -14 + bob);
    ctx.closePath();
    ctx.fill();
    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(5, -8 + bob, 4, 2);
    }

    // Legs
    ctx.fillStyle = age >= 3 ? '#4a4a48' : '#6a5040';
    ctx.fillRect(-5, 10, 4, 6 + legOffset);
    ctx.fillRect(1, 10, 4, 6 - legOffset);
    if (age >= 2) {
        ctx.fillStyle = age >= 3 ? '#3a3a38' : '#4a3a28';
        ctx.fillRect(-6, 14 + legOffset, 5, 3);
        ctx.fillRect(0, 14 - legOffset, 5, 3);
    }

    // Upgrade stars
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -24 + bob);
    }

    // Age 4: Glory aura
    if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
