// ============================================================
//  Archer Renderer — Civilization-specific archer drawing
//  Enhanced with detailed armor, bow, quiver, and accessories
// ============================================================

import { CivilizationType } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";

export function drawArcher(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const civ = cv.civ;
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3 : 0;
    const lvl = unit.upgradeLevel;

    // ===== LEGS (drawn first — behind body) =====
    const legColor = age >= 3 ? cv.bodyDark : '#6a5040';
    ctx.fillStyle = legColor;
    ctx.fillRect(-5, 10, 4, 6 + legOffset);
    ctx.fillRect(1, 10, 4, 6 - legOffset);
    // Boots
    if (age >= 2) {
        ctx.fillStyle = age >= 3 ? '#3a3a30' : '#4a3a28';
        ctx.fillRect(-6, 14 + legOffset, 5, 3);
        ctx.fillRect(0, 14 - legOffset, 5, 3);
        // Boot toe detail
        if (age >= 3) {
            ctx.fillStyle = '#2a2a22';
            ctx.fillRect(-6, 16 + legOffset, 2, 1);
            ctx.fillRect(0, 16 - legOffset, 2, 1);
        }
    }
    // Age 3+: Greaves (shin guards)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a56';
        ctx.fillRect(-5, 11 + legOffset, 4, 3);
        ctx.fillRect(1, 11 - legOffset, 4, 3);
        // Greave highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(-5, 11 + legOffset, 1, 3);
        ctx.fillRect(1, 11 - legOffset, 1, 3);
    }

    // ===== QUIVER STRAP (behind body, diagonal across chest) =====
    ctx.fillStyle = civ === CivilizationType.DaiMinh ? '#5a2a2a'
        : civ === CivilizationType.BaTu ? '#8a6a30'
            : (age >= 4 ? '#5a4028' : '#4a3018');
    // Diagonal strap from right shoulder to left hip
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(5, -4 + bob);
    ctx.lineTo(6, -4 + bob);
    ctx.lineTo(-7, 8 + bob);
    ctx.lineTo(-8, 8 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ===== CAPE / CLOAK (age 3+, behind body) =====
    if (age >= 3) {
        const capeWave = moving ? Math.sin(unit.animTimer * 16) * 1.5 : Math.sin(unit.animTimer * 2) * 0.5;
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-8, -3 + bob, 3, 18 + capeWave);
        // Cape edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(-8, -3 + bob, 1, 16);
        // Cape bottom tatter (age 4)
        if (age >= 4) {
            ctx.fillStyle = cv.bodyDark;
            ctx.fillRect(-9, 14 + bob + capeWave, 2, 3);
            ctx.fillRect(-7, 15 + bob + capeWave, 2, 2);
        }
    }

    // ===== BODY ARMOR =====
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    // Body highlight (3D depth — left edge lit)
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-6, -4 + bob, 2, 14);

    // Armor texture — civ-specific
    switch (civ) {
        case CivilizationType.BaTu:
            // Desert robe with gold banding
            ctx.fillStyle = 'rgba(201,168,76,0.12)';
            for (let i = 0; i < 5; i++) ctx.fillRect(-5, -3 + bob + i * 3, 10, 1);
            // Gold collar
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(-6, -4 + bob, 12, 2);
            // Waist sash
            ctx.fillStyle = age >= 4 ? '#e8c860' : '#c9a84c';
            ctx.fillRect(-6, 6 + bob, 12, 2);
            if (age >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-6, 6 + bob, 12, 1);
            }
            break;
        case CivilizationType.DaiMinh:
            // Lamellar vest with red trim
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            for (let i = 0; i < 5; i++) ctx.fillRect(-5, -3 + bob + i * 3, 10, 1);
            // Red collar band
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(-6, -4 + bob, 12, 2);
            // Red sash at waist
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(-6, 7 + bob, 12, 2);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-2, 7 + bob, 4, 2); // gold buckle
            break;
        case CivilizationType.Yamato:
            // Clean dark cloth with subtle lines
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            for (let i = 0; i < 5; i++) ctx.fillRect(-5, -2 + bob + i * 3, 10, 1);
            // Red accent at collar
            if (age >= 2) {
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-6, -4 + bob, 12, 1);
            }
            // Obi (sash)
            ctx.fillStyle = age >= 3 ? '#1a1a2a' : '#2a2a3a';
            ctx.fillRect(-6, 6 + bob, 12, 3);
            break;
        case CivilizationType.Viking:
            // Leather jerkin with fur trim
            ctx.fillStyle = '#6a5a48';
            ctx.fillRect(-6, -4 + bob, 12, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(-6, -4 + bob, 12, 1);
            // Belt
            ctx.fillStyle = '#5a4a38';
            ctx.fillRect(-6, 7 + bob, 12, 2);
            ctx.fillStyle = '#8a8a88';
            ctx.fillRect(-1, 7 + bob, 2, 2); // buckle
            break;
        default: // LaMa
            // Leather armor with straps
            ctx.fillStyle = age >= 4 ? '#6a5030' : '#5a4020';
            ctx.fillRect(-5, 0 + bob, 2, 10);
            ctx.fillRect(3, -3 + bob, 2, 8);
            // Belt with pouch
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(-6, 7 + bob, 12, 2);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(0, 7 + bob, 2, 2); // buckle
    }

    // ===== SHOULDER GUARDS (age 2+) =====
    if (age >= 2) {
        switch (civ) {
            case CivilizationType.BaTu:
                // Ornate gold-trimmed pauldron (right side only — left holds bow)
                ctx.fillStyle = age >= 4 ? '#c9a84c' : cv.bodyMid;
                ctx.fillRect(5, -5 + bob, 4, 6);
                ctx.fillStyle = age >= 4 ? '#ffd700' : '#c9a84c';
                ctx.fillRect(5, -5 + bob, 4, 1);
                break;
            case CivilizationType.DaiMinh:
                // Lamellar shoulder piece
                ctx.fillStyle = age >= 4 ? '#8a2222' : cv.bodyMid;
                ctx.fillRect(5, -5 + bob, 4, 5);
                if (age >= 3) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(5, -5 + bob, 4, 1);
                }
                break;
            case CivilizationType.Yamato:
                // Sode (shoulder guard)
                ctx.fillStyle = age >= 4 ? '#1a1a2a' : cv.bodyMid;
                ctx.fillRect(5, -6 + bob, 4, 6);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(5, -6 + bob, 4, 1); // red lacing
                break;
            case CivilizationType.Viking:
                // Fur-trimmed leather
                ctx.fillStyle = age >= 3 ? '#5a4a38' : '#6a5a48';
                ctx.fillRect(5, -5 + bob, 4, 5);
                ctx.fillStyle = '#8a7a5a';
                ctx.fillRect(5, -5 + bob, 4, 2); // fur
                break;
            default: // LaMa
                // Leather spaulder
                ctx.fillStyle = age >= 4 ? '#6a5a48' : '#5a4a38';
                ctx.fillRect(5, -5 + bob, 4, 5);
                if (age >= 4) {
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(5, -5 + bob, 4, 1);
                }
        }
    }

    // ===== HEAD =====
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    // Eye
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -8 + bob, 2, 2);
    // Eyebrow
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -10 + bob, 3, 1);

    // ===== HEADGEAR — civ-specific =====
    switch (civ) {
        case CivilizationType.BaTu:
            // Turban with jewel
            ctx.fillStyle = age >= 4 ? '#c9a84c' : age >= 3 ? '#e0d8c0' : '#ddd';
            ctx.fillRect(-5, -15 + bob, 10, 6);
            ctx.fillRect(-4, -12 + bob, 8, 2);
            // Turban wrap lines
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(-4, -14 + bob, 8, 1);
            ctx.fillRect(-4, -12 + bob, 8, 1);
            if (age >= 3) {
                // Jewel
                ctx.fillStyle = age >= 4 ? '#ff4444' : '#44aaff';
                ctx.fillRect(-1, -16 + bob, 2, 2);
                // Gold setting
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-2, -16 + bob, 1, 2);
                ctx.fillRect(1, -16 + bob, 1, 2);
            }
            break;
        case CivilizationType.DaiMinh:
            // Guan hat / Round cap
            ctx.fillStyle = age >= 4 ? '#222' : age >= 3 ? '#2a2a2a' : '#333';
            ctx.fillRect(-5, -15 + bob, 10, 5);
            // Brim
            ctx.fillStyle = age >= 4 ? '#1a1a1a' : '#2a2a2a';
            ctx.fillRect(-6, -11 + bob, 12, 2);
            // Red accent
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(-5, -11 + bob, 10, 1);
            if (age >= 4) {
                // Gold ornament on top
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-1, -16 + bob, 2, 2);
            }
            break;
        case CivilizationType.Yamato:
            if (age >= 3) {
                // Light kabuto (archer version — no heavy crest)
                ctx.fillStyle = age >= 4 ? '#1a1a2a' : '#2a2a3a';
                ctx.fillRect(-5, -15 + bob, 10, 5);
                // Shikoro (side flaps)
                ctx.fillRect(-6, -11 + bob, 12, 2);
                // Red lacing
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-5, -13 + bob, 10, 1);
                if (age >= 4) {
                    // Small maedate (front ornament)
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-1, -17 + bob, 2, 3);
                }
            } else {
                // Hachimaki headband
                ctx.fillStyle = '#fff';
                ctx.fillRect(-4, -12 + bob, 8, 3);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-4, -11 + bob, 8, 1);
                // Hair
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-4, -15 + bob, 8, 3);
            }
            break;
        case CivilizationType.Viking:
            if (age >= 3) {
                // Leather cap with chin strap
                ctx.fillStyle = age >= 4 ? '#4a3a28' : '#3a2a1a';
                ctx.fillRect(-5, -15 + bob, 10, 5);
                // Nose guard
                ctx.fillStyle = '#6a6a68';
                ctx.fillRect(-1, -12 + bob, 2, 4);
                // Chin strap
                ctx.fillStyle = '#4a3a28';
                ctx.fillRect(-4, -7 + bob, 2, 2);
                ctx.fillRect(2, -7 + bob, 2, 2);
                if (age >= 4) {
                    // Metal band
                    ctx.fillStyle = '#8a8a88';
                    ctx.fillRect(-5, -13 + bob, 10, 1);
                }
            } else {
                // Messy hair / simple headband
                ctx.fillStyle = '#b89050';
                ctx.fillRect(-4, -14 + bob, 8, 4);
                ctx.fillRect(-5, -12 + bob, 2, 4);
                if (age >= 2) {
                    ctx.fillStyle = '#4a3a28';
                    ctx.fillRect(-4, -14 + bob, 8, 2);
                }
            }
            break;
        default: // LaMa
            if (age >= 3) {
                // Phrygian-style leather cap
                ctx.fillStyle = age >= 4 ? '#3a5a3a' : '#4a5a3a';
                ctx.fillRect(-5, -15 + bob, 10, 6);
                ctx.fillRect(-4, -12 + bob, 8, 2);
                // Folded tip
                ctx.fillStyle = age >= 4 ? '#2a4a2a' : '#3a4a30';
                ctx.fillRect(2, -17 + bob, 4, 3);
                if (age >= 4) {
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(-5, -15 + bob, 10, 1);
                }
            } else {
                // Simple hood
                ctx.fillStyle = age >= 2 ? '#4a5a3a' : '#5a6a4a';
                ctx.fillRect(-4, -14 + bob, 8, 4);
                ctx.fillRect(-5, -12 + bob, 10, 2);
            }
    }

    // ===== ARM GUARD / BRACER (bow arm, right side) =====
    if (age >= 2) {
        switch (civ) {
            case CivilizationType.BaTu:
                ctx.fillStyle = age >= 4 ? '#c9a84c' : '#aa8a3a';
                ctx.fillRect(6, 0 + bob, 3, 6);
                break;
            case CivilizationType.Yamato:
                // Yugake (glove)
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(6, 1 + bob, 3, 5);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(6, 1 + bob, 3, 1);
                break;
            case CivilizationType.DaiMinh:
                ctx.fillStyle = '#5a2a2a';
                ctx.fillRect(6, 0 + bob, 3, 5);
                break;
            case CivilizationType.Viking:
                ctx.fillStyle = '#5a4a38';
                ctx.fillRect(6, 0 + bob, 3, 6);
                ctx.fillStyle = '#7a6a4a';
                ctx.fillRect(6, 0 + bob, 3, 1); // fur trim
                break;
            default: // LaMa
                ctx.fillStyle = age >= 4 ? '#5a4a38' : '#4a3a28';
                ctx.fillRect(6, 0 + bob, 3, 5);
        }
    }

    // ===== BOW — civ-specific =====
    switch (civ) {
        case CivilizationType.BaTu: {
            // Recurve composite bow — ornate
            const bc = age >= 4 ? '#c9a040' : '#8a6a30';
            ctx.strokeStyle = bc;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(9, 0 + bob, 9, -Math.PI * 0.38, Math.PI * 0.38);
            ctx.stroke();
            // Recurve tips
            ctx.fillStyle = bc;
            ctx.fillRect(9, -8 + bob, 2, 2);
            ctx.fillRect(9, 6 + bob, 2, 2);
            // Nocking points
            ctx.fillStyle = age >= 4 ? '#ffd700' : '#ddc060';
            ctx.fillRect(9, -8 + bob, 1, 1);
            ctx.fillRect(9, 7 + bob, 1, 1);
            break;
        }
        case CivilizationType.DaiMinh: {
            // Repeating crossbow (Cho-ko-nu style)
            ctx.fillStyle = age >= 4 ? '#7a2222' : '#5a3a20';
            ctx.fillRect(7, -2 + bob, 8, 4); // stock
            ctx.fillStyle = '#444';
            ctx.fillRect(10, -5 + bob, 1, 10); // prod
            ctx.fillRect(7, -5 + bob, 5, 1); // top limb
            ctx.fillRect(7, 4 + bob, 5, 1); // bottom limb
            // Mechanism
            ctx.fillStyle = '#555';
            ctx.fillRect(8, -1 + bob, 2, 2);
            // Arrow magazine
            if (age >= 3) {
                ctx.fillStyle = age >= 4 ? '#8a2222' : '#6a3a30';
                ctx.fillRect(9, -7 + bob, 3, 3);
            }
            break;
        }
        case CivilizationType.Yamato: {
            // Tall asymmetric yumi bow (longer top)
            const bc = age >= 4 ? '#8a6020' : '#6a4020';
            ctx.strokeStyle = bc;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(9, -3 + bob, 11, -Math.PI * 0.48, Math.PI * 0.5);
            ctx.stroke();
            // Grip wrapping
            ctx.fillStyle = '#222';
            ctx.fillRect(9, -1 + bob, 2, 3);
            // Nocking points
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(9, -13 + bob, 1, 1);
            ctx.fillRect(9, 7 + bob, 1, 1);
            break;
        }
        case CivilizationType.Viking: {
            // Short hunting bow — thick and sturdy
            const bc = age >= 4 ? '#5a4020' : '#4a3018';
            ctx.strokeStyle = bc;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(9, 0 + bob, 8, -Math.PI * 0.35, Math.PI * 0.35);
            ctx.stroke();
            // Leather grip
            ctx.fillStyle = '#3a2a18';
            ctx.fillRect(8, -1 + bob, 2, 3);
            break;
        }
        default: {
            // LaMa — Roman composite bow
            const bc = age >= 4 ? '#c9a040' : age >= 3 ? '#6a4020' : '#8B5E3C';
            ctx.strokeStyle = bc;
            ctx.lineWidth = age >= 4 ? 1.8 : 1.4;
            ctx.beginPath();
            ctx.arc(9, 0 + bob, 9, -Math.PI * 0.4, Math.PI * 0.4);
            ctx.stroke();
            // Nocking points
            ctx.fillStyle = age >= 4 ? '#ffd700' : '#aaa';
            ctx.fillRect(9, -7 + bob, 1, 1);
            ctx.fillRect(9, 7 + bob, 1, 1);
        }
    }

    // Calculate bow drawn state if attacking
    let pullback = 0;
    if (unit.attackTarget || unit.attackBuildingTarget) {
        // Attack Cooldown goes from civAttackSpeed down to 0
        const maxCd = unit.civAttackSpeed;
        const currentCd = unit.attackCooldown;
        // Assume pullback happens in the last 60% of the cooldown, and releases at 0
        const pullPhase = 1 - (currentCd / maxCd);
        if (pullPhase > 0.4 && pullPhase < 1.0) {
            // Map 0.4 -> 1.0 to 0.0 -> 1.0
            const tension = (pullPhase - 0.4) / 0.6;
            // Max pullback distance is 6 pixels
            pullback = tension * 6;
        }
    }

    // Bowstring (shared — except crossbow)
    if (civ !== CivilizationType.DaiMinh) {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.7;
        const bowR = civ === CivilizationType.Viking ? 8 : civ === CivilizationType.Yamato ? 11 : 9;
        const bowX = 9;
        const bowY = civ === CivilizationType.Yamato ? -3 + bob : bob;
        const topAngle = civ === CivilizationType.Yamato ? -Math.PI * 0.48 : -Math.PI * 0.4;
        const botAngle = civ === CivilizationType.Yamato ? Math.PI * 0.5 : Math.PI * 0.4;
        ctx.beginPath();
        ctx.moveTo(bowX + bowR * Math.cos(topAngle), bowY + bowR * Math.sin(topAngle));
        ctx.lineTo(bowX + 1 - pullback, bowY); // Pulled back midpoint
        ctx.lineTo(bowX + bowR * Math.cos(botAngle), bowY + bowR * Math.sin(botAngle));
        ctx.stroke();

        // Arrow nocked on string
        // If pullback is 0 and we are attacking, it means we just fired. Hide the arrow briefly.
        const isAttacking = unit.attackTarget || unit.attackBuildingTarget;
        const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;

        if (!hideArrow) {
            const stringMidX = bowX + 1 - pullback;
            const stringMidY = bowY;
            // Arrow shaft
            ctx.fillStyle = age >= 4 ? '#ddc060' : '#aa9060';
            ctx.fillRect(stringMidX, stringMidY - 1 + bob * 0.5, 6, 1);
            // Arrowhead
            ctx.fillStyle = age >= 4 ? '#eee' : '#bbb';
            ctx.beginPath();
            ctx.moveTo(stringMidX + 6, stringMidY - 1.5 + bob * 0.5);
            ctx.lineTo(stringMidX + 8, stringMidY + bob * 0.5);
            ctx.lineTo(stringMidX + 6, stringMidY + 1.5 + bob * 0.5);
            ctx.closePath();
            ctx.fill();
            // Fletching
            ctx.fillStyle = civ === CivilizationType.Yamato ? '#cc3333'
                : civ === CivilizationType.BaTu ? '#c9a84c'
                    : civ === CivilizationType.Viking ? '#5a6a4a'
                        : '#8b0000';
            ctx.fillRect(stringMidX, stringMidY - 1.5 + bob * 0.5, 2, 2);
        }
    }

    // ===== QUIVER (back, left side) =====
    const quiverColor = civ === CivilizationType.DaiMinh ? '#5a2a2a'
        : civ === CivilizationType.BaTu ? '#8a6a30'
            : civ === CivilizationType.Yamato ? '#2a2a3a'
                : (age >= 4 ? '#5a4028' : '#4a3018');
    ctx.fillStyle = quiverColor;
    ctx.fillRect(-10, -10 + bob, 4, 18);
    // Quiver top rim
    ctx.fillStyle = cv.accent;
    ctx.fillRect(-10, -10 + bob, 4, 2);
    // Visible arrow tips sticking out
    ctx.fillStyle = '#bbb';
    ctx.fillRect(-9, -13 + bob, 1, 4);
    ctx.fillRect(-8, -14 + bob, 1, 5);
    ctx.fillRect(-7, -12 + bob, 1, 3);
    // Fletching colors on arrows
    const fletchColor = civ === CivilizationType.DaiMinh ? '#aa2222'
        : civ === CivilizationType.Yamato ? '#cc3333'
            : civ === CivilizationType.BaTu ? '#c9a84c'
                : civ === CivilizationType.Viking ? '#5a6a4a'
                    : '#8b0000';
    ctx.fillStyle = fletchColor;
    ctx.fillRect(-9, -13 + bob, 1, 2);
    ctx.fillRect(-8, -14 + bob, 1, 2);
    ctx.fillRect(-7, -12 + bob, 1, 2);

    // ===== CIV-SPECIFIC ACCESSORIES =====
    switch (civ) {
        case CivilizationType.BaTu:
            // Small curved dagger at waist
            if (age >= 3) {
                ctx.fillStyle = '#8a8888';
                ctx.fillRect(5, 7 + bob, 2, 5);
                ctx.fillStyle = '#c9a84c';
                ctx.fillRect(5, 7 + bob, 2, 1); // gold hilt
            }
            break;
        case CivilizationType.DaiMinh:
            // Tassel hanging from waist
            if (age >= 2) {
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-7, 8 + bob, 1, 4);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-7, 8 + bob, 1, 1);
            }
            break;
        case CivilizationType.Yamato:
            // Small tanto (short blade) at waist
            if (age >= 3) {
                ctx.fillStyle = '#1a1a2a';
                ctx.fillRect(5, 7 + bob, 1, 5); // sheath
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(5, 7 + bob, 1, 1); // tsuba
            }
            break;
        case CivilizationType.Viking:
            // Pouch on belt
            if (age >= 2) {
                ctx.fillStyle = '#5a4a38';
                ctx.fillRect(-7, 7 + bob, 3, 3);
                ctx.fillStyle = '#3a2a18';
                ctx.fillRect(-7, 8 + bob, 3, 1); // strap
            }
            // Age 4: Rune engraving glow
            if (age >= 4) {
                ctx.globalAlpha = 0.15 + Math.sin(unit.animTimer * 4) * 0.08;
                ctx.fillStyle = '#88ccff';
                ctx.fillRect(-4, -2 + bob, 2, 2);
                ctx.fillRect(2, 2 + bob, 2, 2);
                ctx.globalAlpha = 1;
            }
            break;
        default: // LaMa
            // Small leather pouch
            if (age >= 2) {
                ctx.fillStyle = '#5a4a38';
                ctx.fillRect(-7, 7 + bob, 3, 3);
            }
            // Age 4: Eagle badge
            if (age >= 4) {
                ctx.fillStyle = '#daa520';
                ctx.fillRect(2, -2 + bob, 3, 3);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(3, -1 + bob, 1, 1);
            }
    }

    // ===== UPGRADE STARS =====
    if (lvl > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -24 + bob);
    }

    // ===== AGE 4: ENHANCED GLOW AURA =====
    if (age >= 4) {
        // Outer glow
        ctx.globalAlpha = 0.04 + Math.sin(unit.animTimer * 3) * 0.02;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        // Inner glow
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 4 + 1) * 0.03;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -2 + bob, 10, 0, Math.PI * 2);
        ctx.fill();
        // Bow glow
        ctx.globalAlpha = 0.1 + Math.sin(unit.animTimer * 5) * 0.05;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(9, 0 + bob, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
