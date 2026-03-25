// ============================================================
//  Villager Renderer — shared across all civilizations
//  Extracted from UnitRenderer.ts (lines 91-267)
// ============================================================

import { CivilizationType, UnitState } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";

export function drawVillager(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3 : 0;
    const civ = cv.civ;

    // Body — civilization colored
    const bodyColor = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    // Civilization-specific body details
    switch (civ) {
        case CivilizationType.BaTu:
            ctx.fillStyle = cv.accent + '88';
            ctx.fillRect(-7, 5 + bob, 14, 5);
            if (age >= 2) {
                ctx.fillStyle = '#c9a84c';
                ctx.fillRect(-6, 2 + bob, 12, 2);
            }
            break;
        case CivilizationType.DaiMinh:
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-3, -4 + bob, 6, 3);
            if (age >= 2) {
                ctx.fillStyle = '#dd3333';
                ctx.fillRect(-6, 4 + bob, 12, 2);
            }
            break;
        case CivilizationType.Yamato:
            ctx.fillStyle = age >= 3 ? '#222' : '#333';
            ctx.fillRect(-6, 3 + bob, 12, 3);
            ctx.fillStyle = cv.accent + '44';
            ctx.fillRect(-5, -3 + bob, 4, 7);
            break;
        case CivilizationType.LaMa:
            if (age >= 2) {
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-6, 4 + bob, 12, 2);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-2, 3 + bob, 3, 3);
            }
            break;
        case CivilizationType.Viking:
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(-6, -4 + bob, 12, 3);
            if (age >= 2) {
                ctx.fillStyle = '#5a3a10';
                ctx.fillRect(-6, 4 + bob, 12, 2);
            }
            break;
    }

    // Head (compact)
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -8 + bob, 2, 2);

    // Hair / Headwear — CIVILIZATION SPECIFIC
    switch (civ) {
        case CivilizationType.BaTu:
            ctx.fillStyle = age >= 3 ? '#f0e8d0' : '#e0d8c0';
            ctx.fillRect(-5, -15 + bob, 10, 5);
            ctx.fillRect(-3, -17 + bob, 6, 3);
            if (age >= 2) {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(0, -15 + bob, 3, 3);
            }
            if (age >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-5, -11 + bob, 10, 1);
            }
            break;
        case CivilizationType.DaiMinh:
            if (age >= 2) {
                ctx.fillStyle = '#c9a84c';
                ctx.beginPath();
                ctx.moveTo(0, -19 + bob);
                ctx.lineTo(-6, -11 + bob);
                ctx.lineTo(6, -11 + bob);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#8a6a30';
                ctx.fillRect(-1, -11 + bob, 2, 2);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(-4, -14 + bob, 8, 4);
                ctx.fillRect(-2, -16 + bob, 4, 3);
            }
            break;
        case CivilizationType.Yamato:
            if (age >= 3) {
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-5, -15 + bob, 10, 5);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-5, -11 + bob, 10, 2);
            } else {
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
                ctx.fillStyle = '#6a5030';
                ctx.fillRect(-5, -14 + bob, 10, 4);
                ctx.fillRect(-3, -16 + bob, 6, 3);
                if (age >= 4) {
                    ctx.fillStyle = '#dd4444';
                    ctx.fillRect(3, -17 + bob, 2, 4);
                }
            } else {
                ctx.fillStyle = '#5a3010';
                ctx.fillRect(-4, -13 + bob, 8, 3);
            }
            break;
        case CivilizationType.Viking:
            if (age >= 3) {
                ctx.fillStyle = '#4a3a28';
                ctx.fillRect(-5, -15 + bob, 10, 5);
                ctx.fillStyle = '#8a7a5a';
                ctx.fillRect(-6, -11 + bob, 12, 2);
                if (age >= 4) {
                    ctx.fillStyle = '#ddd';
                    ctx.fillRect(-6, -16 + bob, 2, 4);
                    ctx.fillRect(4, -16 + bob, 2, 4);
                }
            } else {
                ctx.fillStyle = '#b89050';
                ctx.fillRect(-4, -14 + bob, 8, 4);
                ctx.fillRect(-5, -12 + bob, 2, 5);
            }
            break;
    }

    // === ARMS ===
    const isWorking = unit.state === UnitState.Gathering || unit.state === UnitState.Building;
    const armSwing = moving ? Math.sin(unit.animTimer * 22) * 2.5 : 0;

    // Right arm work swing (synced with tool animation)
    let rightArmSwing = armSwing;
    if (isWorking) {
        rightArmSwing = unit.state === UnitState.Building
            ? Math.sin(unit.buildSwingTimer * 8) * 4
            : Math.sin(unit.gatherEffectTimer * 14) * 3.5;
    }

    // Left arm (upper = body color, lower = skin)
    // Left arm stays still when working, swings when walking
    const leftSwing = isWorking ? 0 : armSwing;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-9, -2 + bob, 3, 7 - leftSwing);  // upper arm
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-9, 5 + bob - leftSwing, 3, 4);    // forearm/hand

    // Right arm (swings with tool when working)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(6, -2 + bob, 3, 7 - rightArmSwing);   // upper arm
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(6, 5 + bob - rightArmSwing, 3, 4);     // forearm/hand

    // Legs
    ctx.fillStyle = age >= 3 ? '#5a4030' : '#6a5040';
    ctx.fillRect(-5, 10, 4, 6 + legOffset);
    ctx.fillRect(1, 10, 4, 6 - legOffset);

    // Boots
    if (age >= 2) {
        ctx.fillStyle = civ === CivilizationType.Viking ? '#5a4a30' : (age >= 4 ? '#4a3020' : '#3a2818');
        ctx.fillRect(-6, 14 + legOffset, 5, 3);
        ctx.fillRect(0, 14 - legOffset, 5, 3);
    }

    // === MILITIA ARMOR & HELMET (Town Bell active) ===
    if (unit.isMilitia) {
        // Body armor overlay — chainmail/plate
        ctx.globalAlpha = 0.7;
        switch (civ) {
            case CivilizationType.BaTu:
                // Golden lamellar armor
                ctx.fillStyle = '#b89040';
                ctx.fillRect(-6, -2 + bob, 12, 10);
                ctx.fillStyle = '#9a7030';
                for (let i = 0; i < 3; i++) ctx.fillRect(-5, i * 3 + bob, 10, 1);
                break;
            case CivilizationType.DaiMinh:
                // Red lacquered brigandine
                ctx.fillStyle = '#8a2020';
                ctx.fillRect(-6, -2 + bob, 12, 10);
                ctx.fillStyle = '#c9a84c';
                ctx.fillRect(-6, -2 + bob, 12, 2);
                ctx.fillRect(-6, 6 + bob, 12, 2);
                break;
            case CivilizationType.Yamato:
                // Dark samurai dō
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-6, -2 + bob, 12, 10);
                ctx.fillStyle = '#444';
                for (let i = 0; i < 4; i++) ctx.fillRect(-5, i * 2.5 - 1 + bob, 10, 1);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-6, 6 + bob, 12, 2);
                break;
            case CivilizationType.LaMa:
                // Roman lorica segmentata
                ctx.fillStyle = '#8a8888';
                ctx.fillRect(-6, -2 + bob, 12, 10);
                ctx.fillStyle = '#6a6868';
                for (let i = 0; i < 4; i++) ctx.fillRect(-5, i * 2.5 - 1 + bob, 10, 1);
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-2, 0 + bob, 4, 8);
                break;
            case CivilizationType.Viking:
                // Chainmail hauberk
                ctx.fillStyle = '#5a5a58';
                ctx.fillRect(-6, -2 + bob, 12, 10);
                ctx.fillStyle = '#777';
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        ctx.fillRect(-4 + j * 3, i * 2 - 1 + bob, 1, 1);
                    }
                }
                break;
        }
        ctx.globalAlpha = 1;

        // Helmet overlay (drawn over head)
        switch (civ) {
            case CivilizationType.BaTu:
                // Persian-style pointed helm
                ctx.fillStyle = '#c9a040';
                ctx.fillRect(-5, -14 + bob, 10, 6);
                ctx.fillRect(-3, -17 + bob, 6, 4);
                ctx.fillRect(-1, -19 + bob, 2, 3);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-5, -10 + bob, 10, 2);
                break;
            case CivilizationType.DaiMinh:
                // Ming kettle helm
                ctx.fillStyle = '#8a6a30';
                ctx.fillRect(-6, -13 + bob, 12, 5);
                ctx.fillRect(-7, -9 + bob, 14, 2);
                ctx.fillStyle = '#dd3333';
                ctx.fillRect(0, -16 + bob, 2, 5);
                break;
            case CivilizationType.Yamato:
                // Kabuto (samurai helmet)
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-5, -15 + bob, 10, 7);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-6, -10 + bob, 12, 2);
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-2, -17 + bob, 4, 3);
                // Neck guard
                ctx.fillStyle = '#333';
                ctx.fillRect(-6, -9 + bob, 2, 4);
                ctx.fillRect(4, -9 + bob, 2, 4);
                break;
            case CivilizationType.LaMa:
                // Roman galea
                ctx.fillStyle = '#8a8888';
                ctx.fillRect(-5, -15 + bob, 10, 7);
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(-2, -18 + bob, 4, 4);
                ctx.fillRect(-1, -20 + bob, 2, 3);
                // Cheek guards
                ctx.fillStyle = '#7a7878';
                ctx.fillRect(-6, -10 + bob, 2, 4);
                ctx.fillRect(4, -10 + bob, 2, 4);
                break;
            case CivilizationType.Viking:
                // Norse spangenhelm with nose guard
                ctx.fillStyle = '#5a5a58';
                ctx.fillRect(-5, -15 + bob, 10, 7);
                ctx.fillStyle = '#777';
                ctx.fillRect(-1, -16 + bob, 2, 8);
                ctx.fillRect(-5, -12 + bob, 10, 2);
                // Nose guard
                ctx.fillStyle = '#5a5a58';
                ctx.fillRect(-1, -10 + bob, 2, 4);
                break;
        }
    }
}
