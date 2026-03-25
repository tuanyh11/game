// ============================================================
//  Shared swordsman finish — upgrade stars + age 4 aura
//  Extracted from UnitRenderer.ts
// ============================================================

import type { Unit } from "../Unit";
import { CivilizationType } from "../../config/GameConfig";
import type { CivColors } from "./shared";

// ============================================================
//  Fierce Armor Details — visual enhancements at upgrade level 3
//  Adds shoulder spikes, battle scars, reinforcement plates,
//  and civ-specific war markings
// ============================================================
export function drawFierceArmorDetails(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, lvl: number, cv: CivColors, isCavalry: boolean = false): void {
    if (lvl < 3) return;
    const civ = cv.civ;
    const t = unit.animTimer;

    // 1. SHOULDER SPIKES — small sharp triangles on both shoulders
    ctx.fillStyle = cv.metalDark;
    // Left shoulder spike
    ctx.beginPath(); ctx.moveTo(-6, -6 + bob); ctx.lineTo(-9, -12 + bob); ctx.lineTo(-4, -8 + bob); ctx.fill();
    // Right shoulder spike
    ctx.beginPath(); ctx.moveTo(6, -6 + bob); ctx.lineTo(9, -12 + bob); ctx.lineTo(4, -8 + bob); ctx.fill();

    // 2. CHEST REINFORCEMENT PLATE — dark metal across torso
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = cv.metalLight;
    ctx.fillRect(-5, -3 + bob, 10, 6);
    ctx.globalAlpha = 1;

    // 3. CIV-SPECIFIC BATTLE MARKINGS
    ctx.globalAlpha = 0.5;
    switch (civ) {
        case CivilizationType.BaTu:
            // Dark gold claw marks on armor
            ctx.strokeStyle = '#8a6a00'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-4, -2 + bob); ctx.lineTo(-1, 4 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-2, -2 + bob); ctx.lineTo(1, 4 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -2 + bob); ctx.lineTo(3, 4 + bob); ctx.stroke();
            break;
        case CivilizationType.DaiMinh:
            // Blood-red dragon scale pattern
            ctx.fillStyle = '#4a0000';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath(); ctx.arc(-2 + i * 2, 0 + bob, 1.5, 0, Math.PI); ctx.fill();
            }
            break;
        case CivilizationType.Yamato:
            // Oni face mark on chest
            ctx.fillStyle = '#3a0030';
            ctx.beginPath();
            ctx.moveTo(-3, -1 + bob); ctx.lineTo(0, 3 + bob); ctx.lineTo(3, -1 + bob);
            ctx.closePath(); ctx.fill();
            break;
        case CivilizationType.Viking:
            // Runic marks on armor
            ctx.strokeStyle = '#0a3a20'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(-2, -2 + bob); ctx.lineTo(0, 3 + bob); ctx.lineTo(2, -2 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-3, 0 + bob); ctx.lineTo(3, 0 + bob); ctx.stroke();
            break;
        default: // LaMa
            // Imperial eagle scratch
            ctx.strokeStyle = '#3a0020'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-3, -1 + bob); ctx.lineTo(0, -4 + bob); ctx.lineTo(3, -1 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -4 + bob); ctx.lineTo(0, 3 + bob); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 4. BLOOD SPLATTER on weapon arm side (small red dots)
    ctx.fillStyle = '#660000';
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(7, 2 + bob, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -1 + bob, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, 4 + bob, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
}

// Shared finish: upgrade stars + age4 aura
export function drawSwordsFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    drawFierceArmorDetails(unit, ctx, bob, lvl, cv);
    if (lvl > 0) {
        // At max upgrade (lvl 3), stars turn blood-red to signal fierce status
        ctx.fillStyle = lvl >= 3 ? '#ff2222' : '#ffd700';
        ctx.font = lvl >= 3 ? 'bold 8px sans-serif' : '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -25 + bob);
    }
    if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawSpearsFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    drawFierceArmorDetails(unit, ctx, bob, lvl, cv);
    if (lvl > 0) {
        ctx.fillStyle = lvl >= 3 ? '#ff2222' : '#ffd700';
        ctx.font = lvl >= 3 ? 'bold 8px sans-serif' : '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -27 + bob); // slightly higher for spears
    }
    if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = cv.accent;
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawArchersFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    drawFierceArmorDetails(unit, ctx, bob, lvl, cv);
    if (lvl > 0) {
        ctx.fillStyle = lvl >= 3 ? '#ff2222' : '#ffd700';
        ctx.font = lvl >= 3 ? 'bold 8px sans-serif' : '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -24 + bob);
    }
    if (age >= 4) {
        // Outer glow
        ctx.globalAlpha = 0.04 + Math.sin(unit.animTimer * 3) * 0.02;
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2); ctx.fill();
        // Inner glow
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 4 + 1) * 0.03;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(0, -2 + bob, 10, 0, Math.PI * 2); ctx.fill();
        // Bow glow
        ctx.globalAlpha = 0.1 + Math.sin(unit.animTimer * 5) * 0.05;
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(9, 0 + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawKnightsFinish(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, _legOff: number, lvl: number, cv: CivColors): void {
    drawFierceArmorDetails(unit, ctx, bob, lvl, cv, true);

    // === CAVALRY UPGRADE ARMOR OVERLAY ===
    // Adds progressively more elaborate barding & rider armor per upgrade level
    if (lvl > 0) {
        const civ = cv.civ;
        ctx.save();

        // --- Level 1: Horse blanket trim + rider shoulder accent ---
        if (lvl >= 1) {
            ctx.globalAlpha = 0.5;
            switch (civ) {
                case CivilizationType.BaTu:
                    // Golden trim on mane line
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-8, -6 + bob, 16, 2);
                    ctx.fillStyle = '#c9a84c';
                    ctx.fillRect(-6, 4 + bob, 12, 2);
                    break;
                case CivilizationType.DaiMinh:
                    // Red silk sash
                    ctx.fillStyle = '#cc2222';
                    ctx.fillRect(-8, -6 + bob, 16, 2);
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-4, -6 + bob, 8, 1);
                    break;
                case CivilizationType.Yamato:
                    // Dark lacquer trim
                    ctx.fillStyle = '#1a1a2a';
                    ctx.fillRect(-8, -6 + bob, 16, 2);
                    ctx.fillStyle = '#cc3333';
                    ctx.fillRect(-6, -5 + bob, 12, 1);
                    break;
                case CivilizationType.LaMa:
                    // Bronze band
                    ctx.fillStyle = '#8a7a50';
                    ctx.fillRect(-8, -6 + bob, 16, 2);
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(-4, -6 + bob, 8, 1);
                    break;
                case CivilizationType.Viking:
                    // Iron chain strip
                    ctx.fillStyle = '#6a6a68';
                    ctx.fillRect(-8, -6 + bob, 16, 2);
                    ctx.fillStyle = '#8a8a88';
                    for (let i = 0; i < 5; i++) ctx.fillRect(-7 + i * 3, -6 + bob, 1, 2);
                    break;
            }
            ctx.globalAlpha = 1;
        }

        // --- Level 2: Reinforced barding + civ emblem ---
        if (lvl >= 2) {
            ctx.globalAlpha = 0.45;
            switch (civ) {
                case CivilizationType.BaTu:
                    // Golden scale plates on flanks
                    ctx.fillStyle = '#b8860b';
                    ctx.fillRect(-10, 2 + bob, 20, 4);
                    ctx.fillStyle = '#ffd700';
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(-8 + i * 4, 4 + bob, 2, 0, Math.PI);
                        ctx.fill();
                    }
                    break;
                case CivilizationType.DaiMinh:
                    // Iron lamellar with red lacquer
                    ctx.fillStyle = '#333';
                    ctx.fillRect(-10, 2 + bob, 20, 4);
                    ctx.fillStyle = '#8a2222';
                    for (let i = 0; i < 6; i++) ctx.fillRect(-9 + i * 3, 3 + bob, 2, 2);
                    break;
                case CivilizationType.Yamato:
                    // Samurai horse kusazuri
                    ctx.fillStyle = '#222';
                    ctx.fillRect(-10, 2 + bob, 20, 4);
                    ctx.fillStyle = '#cc3333';
                    ctx.fillRect(-10, 5 + bob, 20, 1);
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-2, 2 + bob, 4, 4);
                    break;
                case CivilizationType.LaMa:
                    // Segmented bronze plates
                    ctx.fillStyle = '#7a7a78';
                    ctx.fillRect(-10, 2 + bob, 20, 4);
                    ctx.fillStyle = '#a8a088';
                    for (let i = 0; i < 4; i++) ctx.fillRect(-9, 2 + i + bob, 18, 1);
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(-2, 2 + bob, 4, 4);
                    break;
                case CivilizationType.Viking:
                    // Heavy chainmail barding
                    ctx.fillStyle = '#5a5a58';
                    ctx.fillRect(-10, 2 + bob, 20, 4);
                    ctx.fillStyle = '#777';
                    for (let i = 0; i < 5; i++) {
                        for (let j = 0; j < 3; j++) {
                            ctx.fillRect(-8 + i * 4, 2 + j + bob, 1, 1);
                        }
                    }
                    break;
            }
            ctx.globalAlpha = 1;
        }

        // --- Level 3: DARK ELITE CAVALRY — aggressive, menacing, heavy armor ---
        if (lvl >= 3) {
            // Civ accent colors for lvl 3
            const darkAccent = civ === CivilizationType.BaTu ? '#8a6a00'
                : civ === CivilizationType.DaiMinh ? '#8a1111'
                : civ === CivilizationType.Yamato ? '#3a0040'
                : civ === CivilizationType.Viking ? '#1a3a30'
                : '#3a1060'; // LaMa

            const brightAccent = civ === CivilizationType.BaTu ? '#ffd700'
                : civ === CivilizationType.DaiMinh ? '#ff3333'
                : civ === CivilizationType.Yamato ? '#cc3333'
                : civ === CivilizationType.Viking ? '#88ccaa'
                : '#daa520'; // LaMa

            // A. Dark smoke aura under horse
            ctx.globalAlpha = 0.12 + Math.sin(unit.animTimer * 2) * 0.05;
            ctx.fillStyle = '#0a0a0a';
            ctx.beginPath();
            ctx.ellipse(0, 10 + bob, 18, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // B. Full heavy barding — dark metal plates covering horse body
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#1a1a1e'; // near-black iron
            ctx.fillRect(-12, 0 + bob, 24, 8); // main body plates
            ctx.fillRect(-10, -4 + bob, 20, 4); // upper body plates
            // Dark metal rivet lines
            ctx.fillStyle = '#2a2a30';
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(-10 + i * 4, 1 + bob, 2, 6);
            }
            // Accent trim on barding edges
            ctx.fillStyle = brightAccent;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(-12, 0 + bob, 24, 1); // top edge
            ctx.fillRect(-12, 7 + bob, 24, 1); // bottom edge

            // C. Bladed shoulder pauldrons (menacing spikes)
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#1a1a1e';
            // Left pauldron with blade
            ctx.beginPath();
            ctx.moveTo(-8, -8 + bob); ctx.lineTo(-14, -16 + bob); ctx.lineTo(-5, -10 + bob);
            ctx.closePath(); ctx.fill();
            // Right pauldron with blade
            ctx.beginPath();
            ctx.moveTo(8, -8 + bob); ctx.lineTo(14, -16 + bob); ctx.lineTo(5, -10 + bob);
            ctx.closePath(); ctx.fill();
            // Pauldron edge highlight
            ctx.strokeStyle = brightAccent;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(-8, -8 + bob); ctx.lineTo(-14, -16 + bob); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, -8 + bob); ctx.lineTo(14, -16 + bob); ctx.stroke();

            // D. Face guard / visor (menacing slit)
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#1a1a1e';
            ctx.fillRect(-4, -20 + bob, 8, 5); // visor plate
            ctx.fillStyle = '#ff2200';
            ctx.globalAlpha = 0.4 + Math.sin(unit.animTimer * 4) * 0.15;
            ctx.fillRect(-3, -18 + bob, 6, 1.5); // glowing red eye slit

            // E. Crest on helmet — civ-specific
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = brightAccent;
            switch (civ) {
                case CivilizationType.BaTu:
                    // Golden crescent moon
                    ctx.beginPath();
                    ctx.arc(0, -26 + bob, 4, Math.PI * 0.2, Math.PI * 0.8);
                    ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffd700'; ctx.stroke();
                    break;
                case CivilizationType.DaiMinh:
                    // Dragon fang spike
                    ctx.beginPath();
                    ctx.moveTo(-2, -22 + bob); ctx.lineTo(0, -32 + bob); ctx.lineTo(2, -22 + bob);
                    ctx.closePath(); ctx.fill();
                    break;
                case CivilizationType.Yamato:
                    // Kabuto crest horns
                    ctx.beginPath();
                    ctx.moveTo(-3, -22 + bob); ctx.lineTo(-6, -30 + bob); ctx.lineTo(-1, -24 + bob); ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(3, -22 + bob); ctx.lineTo(6, -30 + bob); ctx.lineTo(1, -24 + bob); ctx.fill();
                    break;
                case CivilizationType.Viking:
                    // Skull emblem
                    ctx.fillStyle = '#aaa';
                    ctx.beginPath(); ctx.arc(0, -26 + bob, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#1a1a1e';
                    ctx.fillRect(-1.5, -27 + bob, 1, 1); ctx.fillRect(0.5, -27 + bob, 1, 1);
                    break;
                default: // LaMa
                    // Imperial eagle wings
                    ctx.beginPath();
                    ctx.moveTo(-1, -24 + bob); ctx.lineTo(-6, -30 + bob); ctx.lineTo(-2, -26 + bob); ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(1, -24 + bob); ctx.lineTo(6, -30 + bob); ctx.lineTo(2, -26 + bob); ctx.fill();
            }

            // F. Dark energy particles (subtle, menacing)
            ctx.globalAlpha = 0.25;
            for (let i = 0; i < 3; i++) {
                const px = Math.sin(unit.animTimer * 1.5 + i * 2.1) * 12;
                const py = bob + Math.cos(unit.animTimer * 2 + i * 1.7) * 6 + 2;
                ctx.fillStyle = darkAccent;
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Upgrade stars
        ctx.fillStyle = lvl >= 3 ? '#ff2222' : '#ffd700';
        ctx.font = lvl >= 3 ? 'bold 8px sans-serif' : '7px sans-serif';
        ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -35 + bob);
    }
    if (age >= 4) {
        // Large horse aura
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 2) * 0.03;
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.ellipse(0, 5 + bob, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}
