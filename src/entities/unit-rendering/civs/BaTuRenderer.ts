// ============================================================
//  Ba Tư (Persian) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";

// ======== BA TƯ SCOUT — Desert Rider with curved saber ========
export function drawScout_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Flowing desert cape (behind body) — grows with age
    if (age >= 2) {
        ctx.fillStyle = cv.bodyDark + '88';
        const capeWave = moving ? Math.sin(unit.animTimer * 14) * 3 : 0;
        const capeLen = age >= 4 ? 18 : age >= 3 ? 16 : 14;
        ctx.fillRect(-9, -2 + bob, 4, capeLen + capeWave);
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-9, -2 + bob, 1, capeLen + capeWave); // accent edge
        if (age >= 3) {
            // Cape pattern
            ctx.fillStyle = 'rgba(255,215,0,0.12)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-8, 2 + bob + i * 4, 2, 2);
            }
        }
    }

    // Body — CIV COLORED with golden trim
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    // Golden sash (BaTu accent)
    ctx.fillStyle = cv.accent;
    ctx.fillRect(-5, 2 + bob, 10, 2);
    // Scale pattern
    if (age >= 2) {
        ctx.fillStyle = 'rgba(255,215,0,0.15)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-4, -3 + bob + i * 3, 8, 1);
        }
    }
    // Shoulder guards (age 3+)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#c9a040' : '#8a6a30';
        ctx.fillRect(-7, -4 + bob, 3, 5);
        ctx.fillRect(5, -4 + bob, 3, 5);
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-7, -4 + bob, 3, 1);
            ctx.fillRect(5, -4 + bob, 3, 1);
        }
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -8 + bob, 2, 2);

    // Turban with jewel — grows more ornate with age
    ctx.fillStyle = age >= 4 ? '#f0e8d0' : age >= 3 ? '#e8e0c8' : '#e0d8c0';
    ctx.fillRect(-4, -14 + bob, 8, 4);
    ctx.fillRect(-3, -16 + bob, 6, 3);
    ctx.fillStyle = age >= 4 ? '#ff2222' : '#ff4444';
    ctx.fillRect(0, -14 + bob, 3, 3); // jewel
    if (age >= 3) {
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-4, -10 + bob, 8, 1); // gold band
        // Feather
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(3, -17 + bob, 2, 5);
        if (age >= 4) {
            // Second feather + gold tip
            ctx.fillRect(1, -18 + bob, 2, 4);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(3, -17 + bob, 2, 1);
            ctx.fillRect(1, -18 + bob, 2, 1);
        }
    }

    // Curved scimitar weapon — blade quality improves with age
    ctx.fillStyle = cv.accent;
    ctx.fillRect(5, -2 + bob, 2, 4); // handle
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : age >= 3 ? '#ddd' : '#ccc';
    ctx.beginPath();
    ctx.moveTo(5, -10 + bob);
    ctx.quadraticCurveTo(9, -4 + bob, 6, -1 + bob);
    ctx.lineTo(8, -1 + bob);
    ctx.quadraticCurveTo(11, -4 + bob, 7, -10 + bob);
    ctx.closePath();
    ctx.fill();
    if (age >= 3) {
        ctx.fillStyle = cv.accent;
        ctx.fillRect(4, -2 + bob, 4, 2); // gold guard
    }
    if (age >= 4) {
        // Blade shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(6, -8 + bob, 1, 6);
        // Arm bracelet
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, 0 + bob, 3, 1);
    }

    // Legs — flowing pants
    ctx.fillStyle = cv.secondary;
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    // Pointed shoes — better with age
    ctx.fillStyle = age >= 4 ? '#8a6a40' : '#6a5030';
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

    // Upgrade stars + effects
    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 2) { ctx.globalAlpha = 0.15; ctx.fillStyle = cv.accent; for (let i = 0; i < 3; i++) { ctx.fillRect(-12 - i * 3, 10 + bob + i * 3, 4, 2); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.08; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

export function drawSwords_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === 2; // UnitState.Attacking
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Dynamic Attack Posture Calculation (Fluid scimitar swing)
    let bodyTilt = 0;
    let rightArmRot = 0.2; // Relaxed carry
    let leftArmRot = 0;
    let swordOffsetX = 0;
    let swordOffsetY = 0;
    let shieldOffsetX = 0;

    if (attackState) {
        if (attackProgress < 0.3) {
            // Windup: sweeping low to high
            const t = attackProgress / 0.3;
            rightArmRot = (0.2) * (1 - t) + (Math.PI / 1.5) * t;
            leftArmRot = (-Math.PI / 6) * t;
            bodyTilt = -0.1 * t;
            swordOffsetX = -3 * t;
            swordOffsetY = 2 * t;
            shieldOffsetX = -2 * t;
        } else if (attackProgress < 0.6) {
            // Strike: rapid downward diagonal cut
            const t = (attackProgress - 0.3) / 0.3;
            rightArmRot = (Math.PI / 1.5) * (1 - t) + (-Math.PI / 4) * t;
            leftArmRot = (-Math.PI / 6) * (1 - t) + (Math.PI / 10) * t;
            bodyTilt = -0.1 * (1 - t) + 0.15 * t;
            swordOffsetX = -3 * (1 - t) + 5 * t;
            swordOffsetY = 2 * (1 - t) - 2 * t;
        } else {
            // Recover: spin step or flourish back to idle
            const t = (attackProgress - 0.6) / 0.4;
            rightArmRot = (-Math.PI / 4) * (1 - t) + 0.2 * t;
            leftArmRot = (Math.PI / 10) * (1 - t) + 0 * t;
            bodyTilt = 0.15 * (1 - t) + 0 * t;
            swordOffsetX = 5 * (1 - t);
            swordOffsetY = -2 * (1 - t);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#a87c51';
    const tunicColor = cv.bodyDark;
    const armorPrimary = age >= 3 ? '#b8944d' : '#8a7044'; // Bronze/Gold scales
    const sashColor = cv.accent;

    // ── LEGS ──
    // Baggy trousers (Shalwar)
    ctx.fillStyle = age >= 3 ? cv.bodyLight : '#755c4d';
    ctx.beginPath();
    // Back leg
    ctx.moveTo(-6, 12 + bob); ctx.quadraticCurveTo(-8, 16 + legOff, -5, 20 + bob + legOff);
    ctx.lineTo(-2, 20 + bob + legOff); ctx.lineTo(-1, 12 + bob); ctx.fill();
    // Front leg
    ctx.beginPath();
    ctx.moveTo(1, 12 + bob); ctx.quadraticCurveTo(-1, 16 - legOff, 2, 20 + bob - legOff);
    ctx.lineTo(5, 20 + bob - legOff); ctx.lineTo(6, 12 + bob); ctx.fill();

    // Soft Pointed Boots
    ctx.fillStyle = '#4a3320';
    ctx.beginPath(); ctx.moveTo(-6, 19 + bob + legOff); ctx.lineTo(-1, 19 + bob + legOff); ctx.lineTo(-1, 23 + bob + legOff); ctx.lineTo(-8, 23 + bob + legOff); ctx.lineTo(-8, 20 + bob + legOff); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 19 + bob - legOff); ctx.lineTo(6, 19 + bob - legOff); ctx.lineTo(6, 23 + bob - legOff); ctx.lineTo(-1, 23 + bob - legOff); ctx.lineTo(-1, 20 + bob - legOff); ctx.fill();
    if (age >= 4) {
        ctx.fillStyle = '#ffd700'; // Gold curled toes
        ctx.fillRect(-9, 21 + bob + legOff, 2, 2);
        ctx.fillRect(-2, 21 + bob - legOff, 2, 2);
    }

    // ── BACK ARM (Right Arm holding Scimitar) ──
    ctx.save();
    ctx.translate(4, -2 + bob);
    ctx.rotate(rightArmRot);
    ctx.translate(swordOffsetX, swordOffsetY);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 7);
    // Gold Cuff
    if (age >= 3) {
        ctx.fillStyle = armorPrimary;
        ctx.fillRect(-2.5, 5, 5, 2);
    }
    // Hand
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1.5, 7, 3, 3);

    // Scimitar
    ctx.translate(0, 10);
    ctx.rotate(Math.PI / 10); // Slight slant

    // Pommel & Handle
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 6, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(-1, 0, 2, 6);
    // Crossguard (Quillons)
    ctx.fillStyle = armorPrimary;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, -1); ctx.lineTo(-4, -2); ctx.lineTo(-1, 1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3, -1); ctx.lineTo(4, -2); ctx.lineTo(1, 1); ctx.fill();

    // Curved Blade
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : '#cccccc';
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(-1, -10);
    ctx.quadraticCurveTo(-2, -20, 5, -28); // Sweeping tip
    ctx.lineTo(3, -27); // Thickness
    ctx.quadraticCurveTo(2, -15, 1, 0);
    ctx.fill();

    // Pattern Welded effect (Damascus steel lines)
    if (age >= 4) {
        ctx.strokeStyle = '#rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(0, -2 - i * 5); ctx.quadraticCurveTo(0, -10 - i * 5, 3, -15 - i * 5); ctx.stroke();
        }
    }

    // Trail effect
    if (attackState && attackProgress >= 0.3 && attackProgress < 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(3, -10);
        ctx.quadraticCurveTo(20, -10, 10, -28);
        ctx.lineTo(5, -28);
        ctx.quadraticCurveTo(15, -15, 0, 0);
        ctx.fill();
    }
    ctx.restore();

    // ── TORSO (Scale Armor / Jawshan) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-7, -5 + bob, 14, 18); // Tunic skirt extends low

    // Lamellar / Scale Armor core
    ctx.fillStyle = age >= 3 ? armorPrimary : '#887459';
    ctx.beginPath();
    ctx.moveTo(-6, -4 + bob);
    ctx.lineTo(6, -4 + bob);
    ctx.lineTo(7, 6 + bob);
    ctx.quadraticCurveTo(0, 10 + bob, -7, 6 + bob);
    ctx.fill();

    // Draw individual scales
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            ctx.beginPath(); ctx.arc(-4 + c * 3 + (r % 2 ? 1.5 : 0), -2 + bob + r * 2.5, 1.5, 0, Math.PI); ctx.fill();
        }
    }

    // Sash
    ctx.fillStyle = sashColor;
    ctx.fillRect(-7, 6 + bob, 14, 3);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(-7, 7 + bob, 14, 0.5);

    // ── HEAD & HELMET (Kulah Khud) ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 8);
    // Eyes & prominent brow
    ctx.fillStyle = '#222';
    ctx.fillRect(-3, -11 + bob, 6, 1); // Brow
    ctx.fillRect(-2, -9 + bob, 4, 1); // Eyes
    // Beard
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-4, -5 + bob); ctx.quadraticCurveTo(0, -1 + bob, 4, -5 + bob); ctx.lineTo(0, -3 + bob); ctx.fill();

    if (age >= 3) {
        // Steel Bowl
        ctx.fillStyle = age >= 4 ? '#d6cba7' : '#999';
        ctx.beginPath(); ctx.arc(0, -12 + bob, 5.5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-6, -13 + bob, 12, 1.5);

        // Tall Spire
        ctx.fillStyle = '#eee';
        ctx.beginPath(); ctx.moveTo(-1, -17 + bob); ctx.lineTo(0, -25 + bob); ctx.lineTo(1, -17 + bob); ctx.fill();

        // Chainmail Aventail
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.moveTo(-6, -12 + bob); ctx.quadraticCurveTo(-8, -4 + bob, -4, 0 + bob); ctx.lineTo(4, 0 + bob); ctx.quadraticCurveTo(8, -4 + bob, 6, -12 + bob); ctx.fill();
        // Face opening
        ctx.fillStyle = skinColor;
        ctx.fillRect(-3, -11 + bob, 6, 5);
        ctx.fillStyle = '#111'; ctx.fillRect(-2, -9 + bob, 4, 1); // Eyes again

        if (age >= 4) {
            // Plumes
            ctx.fillStyle = sashColor;
            ctx.beginPath(); ctx.moveTo(-5, -14 + bob); ctx.quadraticCurveTo(-10, -18 + bob, -8, -26 + bob); ctx.quadraticCurveTo(-4, -18 + bob, -2, -16 + bob); ctx.fill();
            ctx.beginPath(); ctx.moveTo(5, -14 + bob); ctx.quadraticCurveTo(10, -18 + bob, 8, -26 + bob); ctx.quadraticCurveTo(4, -18 + bob, 2, -16 + bob); ctx.fill();
        }
    } else if (age >= 2) {
        // Leather helm
        ctx.fillStyle = '#8a6a44';
        ctx.beginPath(); ctx.arc(0, -12 + bob, 5, Math.PI, Math.PI * 2); ctx.fill();
    } else {
        // Turban
        ctx.fillStyle = '#eee';
        ctx.beginPath(); ctx.ellipse(0, -14 + bob, 5.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = sashColor; ctx.beginPath(); ctx.arc(0, -14 + bob, 2, 0, Math.PI * 2); ctx.fill();
    }

    // ── FRONT ARM & SHIELD (Sipar) ──
    ctx.save();
    ctx.translate(-5, -1 + bob);
    ctx.rotate(leftArmRot);

    // Front arm sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);

    // Round Sipar Shield
    if (age >= 2) {
        ctx.translate(-3 + shieldOffsetX, 4);

        const shieldR = age >= 3 ? 8 : 6;
        ctx.fillStyle = '#222'; // Iron/Steel base
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.fill();

        ctx.lineWidth = age >= 4 ? 1.5 : 1;
        ctx.strokeStyle = armorPrimary;
        ctx.stroke();

        if (age >= 3) {
            // Gold sunburst pattern
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill(); // Umbo

            // Four outer bosses
            ctx.fillStyle = '#eee';
            const off = shieldR * 0.55;
            ctx.beginPath(); ctx.arc(-off, -off, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(off, -off, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(-off, off, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(off, off, 1, 0, Math.PI * 2); ctx.fill();

            if (age >= 4) {
                // Engravings
                ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 0.5;
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * Math.PI / 4) * shieldR, Math.sin(i * Math.PI / 4) * shieldR); ctx.stroke();
                }
            }
        }
    } else {
        // No shield age 1
        ctx.fillStyle = skinColor;
        ctx.fillRect(-1.5, 6, 3, 3);
    }

    ctx.restore();

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (BA TƯ) - Persian Immortal / Sparabara (Spear & Wicker Shield)
// ============================================================
export function drawSpears_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();

    // Attack animation parameters (Thrust with spear over shield)
    let attackProgress = 0;
    if (unit.state === UnitState.Attacking) {
        const attackCycle = unit.animTimer % unit.attackCooldown;
        const attackDuration = unit.civAttackSpeed * 0.4;
        if (attackCycle < attackDuration) {
            attackProgress = attackCycle / attackDuration;
        }
    }

    // Spear Thrust Animation Logic (Overarm or underarm thrust)
    let bodyRot = 0;
    let spearAngle = 0;
    let spearOffset = { x: 0, y: 0 };
    let rightArmRot = 0; // Arm holding spear (Back arm)
    let leftArmRot = 0;  // Arm holding Spara shield (Front arm)

    if (attackProgress > 0) {
        if (attackProgress < 0.3) {
            // Windup: Pull spear back, raise shield slightly
            const t = attackProgress / 0.3;
            bodyRot = t * -0.1;
            spearOffset.x = t * -4;
            spearOffset.y = t * -1;
            spearAngle = t * -0.1;
            rightArmRot = t * -0.3;
            leftArmRot = t * -0.1;
        } else if (attackProgress < 0.6) {
            // Strike: Overhead/high level thrust
            const t = (attackProgress - 0.3) / 0.3;
            const easeOut = 1 - Math.pow(1 - t, 3);
            bodyRot = -0.1 + easeOut * 0.2;
            spearOffset.x = -4 + easeOut * 12; // Moderate reach
            spearOffset.y = -1 + easeOut * 1;
            spearAngle = -0.1 + easeOut * 0.2;
            rightArmRot = -0.3 + easeOut * 0.6;
            leftArmRot = -0.1 + easeOut * 0.1; // Brace shield
        } else {
            // Recovery
            const t = (attackProgress - 0.6) / 0.4;
            const easeIn = t * t;
            bodyRot = 0.1 * (1 - easeIn);
            spearOffset.x = 8 * (1 - easeIn);
            spearOffset.y = 0 * (1 - easeIn);
            spearAngle = 0.1 * (1 - easeIn);
            rightArmRot = 0.3 * (1 - easeIn);
            leftArmRot = 0 * (1 - easeIn);
        }
    } else {
        // Idle stance: Shield planted (if Sparabara style), spear held ready
        const breath = Math.sin(unit.animTimer * 2) * 0.05;
        bodyRot = breath;
        spearAngle = breath * 0.2 - 0.1; // Pointing forward/up
        leftArmRot = 0;
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = age >= 3 ? cv.bodyDark : cv.bodyMid;
    const pantsColor = cv.accent; // Colorful patterned pants common in Persian art
    const armorMetal = age >= 4 ? '#333333' : '#666666'; // Bronze/Iron scale
    const goldTrim = '#d4af37';

    // ── BACK ARM (Right Arm - Spear) ──
    ctx.save();
    ctx.translate(2, -4 + bob);
    ctx.rotate(Math.PI / 4 + rightArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);
    // Forearm bracer (Iron/Bronze)
    ctx.fillStyle = armorMetal;
    ctx.fillRect(-2.5, 6, 5, 4);
    if (age >= 3) {
        ctx.fillStyle = goldTrim;
        ctx.fillRect(-2.5, 9, 5, 1);
    }
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── SPEAR (Dory / Persian Spear) ──
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    ctx.translate(0, -1 + bob);
    ctx.rotate(spearAngle);

    // Wood Pole
    ctx.fillStyle = '#4a2e15';
    const poleLength = age >= 3 ? 32 : 28;
    ctx.fillRect(-poleLength * 0.4, -1, poleLength, 2);

    // Apple butt-spike (Melophoroi / "Apple Bearers") - iconic for Immortals
    if (age >= 3) {
        ctx.fillStyle = goldTrim;
        ctx.beginPath(); ctx.arc(-poleLength * 0.4 - 1, 0, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8860b'; // shading
        ctx.beginPath(); ctx.arc(-poleLength * 0.4 - 1, 0, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
        // Standard bronze ferrule
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(-poleLength * 0.4 - 2, -1, 2, 2);
    }

    // Spear Head (Leaf/Kite shaped)
    const shaftEnd = poleLength * 0.6;
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#cccccc';
    const bladeLen = age >= 3 ? 9 : 7;
    ctx.beginPath();
    ctx.moveTo(shaftEnd, 0);
    ctx.lineTo(shaftEnd + 3, -2);
    ctx.lineTo(shaftEnd + bladeLen, 0);
    ctx.lineTo(shaftEnd + 3, 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(shaftEnd, -0.5, bladeLen - 2, 1); // ridge

    ctx.restore();

    // ── LEGS (Anaxyrides - Trousers) ──
    ctx.fillStyle = pantsColor;
    // Baggy trousers
    ctx.fillRect(-5, 6, 5, 7 + legOff);
    ctx.fillRect(1, 6, 5, 7 - legOff);

    // Pattern on pants (simple dots or stripes for elite)
    if (age >= 3) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-5, 8 + legOff, 5, 1); ctx.fillRect(-5, 11 + legOff, 5, 1);
        ctx.fillRect(1, 8 - legOff, 5, 1); ctx.fillRect(1, 11 - legOff, 5, 1);
    }

    // Soft Leather Boots
    ctx.fillStyle = '#5c3a21'; // Leather color
    ctx.fillRect(-5.5, 13 + legOff, 6, 2);
    ctx.fillRect(0.5, 13 - legOff, 6, 2);
    if (age >= 3) {
        ctx.fillStyle = goldTrim;
        ctx.fillRect(-5.5, 14 + legOff, 6, 0.5);
        ctx.fillRect(0.5, 14 - legOff, 6, 0.5);
    }

    // ── BODY (Tunic & Scale Armor) ──
    // Tunic skirts
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -6 + bob, 12, 15);

    // Scale Armor Cuirass (covered by tunic or worn over)
    if (age >= 2) {
        ctx.fillStyle = armorMetal; // Scale armor
        ctx.fillRect(-6, -5 + bob, 12, 11);

        ctx.fillStyle = 'rgba(255,255,255,0.15)'; // Scales texture
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.beginPath(); ctx.arc(-4 + c * 3 + (r % 2), -4 + bob + r * 2.2, 1.2, 0, Math.PI); ctx.fill();
            }
        }
    } else {
        // Quilted linen/fabric
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-6, 2 + bob, 12, 1);
    }

    // Belt
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-6, 5 + bob, 12, 2);

    // ── HEAD & TIARA (Headpiece) ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 7);

    // Beard (Persian style, dark, thick)
    ctx.fillStyle = '#111';
    ctx.fillRect(-3, -7 + bob, 6, 3);
    ctx.fillRect(3, -9 + bob, 1, 3); // sideburns/mustache

    if (age >= 3) {
        // Fluted Bronze/Gold Helmet for elites
        ctx.fillStyle = age >= 4 ? goldTrim : armorMetal;
        ctx.beginPath();
        // Dome
        ctx.arc(0, -11 + bob, 4.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-5, -11 + bob, 10, 1.5); // Rim

        // Cheek plates
        ctx.fillRect(-4.5, -9.5 + bob, 2, 4);

        // Ribs (fluting)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-2, -15 + bob, 1, 4);
        ctx.fillRect(0, -15 + bob, 1, 4);
        ctx.fillRect(2, -15 + bob, 1, 4);
    } else {
        // Soft felt cap (Tiara) - folded forward
        ctx.fillStyle = age >= 2 ? goldTrim : '#888'; // Yellow/Gold turban/headwrap
        ctx.beginPath();
        ctx.moveTo(-5, -11 + bob);
        ctx.quadraticCurveTo(-2, -16 + bob, 4, -14 + bob);
        ctx.lineTo(4, -11 + bob);
        ctx.fill();
        // Wrap/Band
        ctx.fillStyle = '#b31515';
        ctx.fillRect(-5.5, -12 + bob, 11, 2);
    }

    // ── FRONT ARM & SHIELD (Spara / Gerrhon) ──
    ctx.save();
    ctx.translate(-3, -2 + bob);
    ctx.rotate(leftArmRot);

    // Front arm (hidden mostly behind shield)
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);

    // Large Wicker Spara Shield (Rectangular, tall)
    if (age >= 2) {
        ctx.translate(-3, 3);
        const shieldW = 8;
        const shieldH = age >= 3 ? 20 : 16;

        // Leather rim
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(-shieldW / 2 - 1, -shieldH / 2 - 1, shieldW + 2, shieldH + 2);

        // Wicker body
        ctx.fillStyle = '#cdaa7d'; // Straw/Wicker color
        ctx.fillRect(-shieldW / 2, -shieldH / 2, shieldW, shieldH);

        // Weave texture (criss-cross)
        ctx.strokeStyle = '#8b6508'; ctx.lineWidth = 0.5;
        for (let y = -shieldH / 2 + 2; y < shieldH / 2; y += 3) {
            ctx.beginPath(); ctx.moveTo(-shieldW / 2, y); ctx.lineTo(shieldW / 2, y); ctx.stroke();
        }
        for (let x = -shieldW / 2 + 2; x < shieldW / 2; x += 2) {
            ctx.beginPath(); ctx.moveTo(x, -shieldH / 2); ctx.lineTo(x, shieldH / 2); ctx.stroke();
        }

        if (age >= 3) {
            // Leather patches / decorative rosettes
            ctx.fillStyle = '#b31515';
            ctx.beginPath(); ctx.arc(0, -shieldH / 4, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, shieldH / 4, 2, 0, Math.PI * 2); ctx.fill();

            if (age >= 4) {
                // Elite Immortals get bronze plating over the wicker
                ctx.fillStyle = 'rgba(255, 215, 0, 0.4)'; // Gold wash
                ctx.fillRect(-shieldW / 2, -shieldH / 2, shieldW, shieldH);
            }
        }
    } else {
        // Simple round wooden target for age 1
        ctx.translate(-2, 4);
        ctx.fillStyle = '#5c3a21';
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); // Iron boss
    }

    ctx.restore();

    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore();
}

// ============================================================
//  DRAW ARCHER (BA TƯ) - Persian Bowman (Kamandaran)
// ============================================================
export function drawArchers_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();

    let isAttacking = false;
    if (unit.state === UnitState.Attacking) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            // Allow a small buffer (20px) over civRange for attack animation
            const bldgRadius = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * 32 * 0.4 : 0;
            if (dist <= unit.civRange + bldgRadius + 20) {
                isAttacking = true;
            }
        }
    }

    let pullback = 0; // 0 to 1
    let bowAngle = 0;

    if (isAttacking) {
        // Attack Cooldown goes from civAttackSpeed down to 0
        const maxCd = unit.civAttackSpeed;
        const currentCd = unit.attackCooldown;
        const pullPhase = 1 - (currentCd / maxCd);

        if (pullPhase > 0.3 && pullPhase < 0.9) {
            pullback = (pullPhase - 0.3) / 0.6;
        } else if (pullPhase >= 0.9) {
            pullback = 1;
        } else {
            pullback = 0;
        }
    }

    let bodyRot = 0;
    if (isAttacking) {
        bodyRot = -0.1 + pullback * 0.15; // Lean into the shot
        bowAngle = -0.05 + pullback * 0.05;
    } else {
        bodyRot = Math.sin(unit.animTimer * 2) * 0.05;
        bowAngle = 0.15; // Bow resting forward
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = age >= 3 ? '#2c5263' : '#3a6478'; // Persian Teal base
    const armorMetal = age >= 4 ? '#d4af37' : '#c9a84c'; // Gold scales
    const sashColor = age >= 4 ? '#b02a2a' : '#8a2b2b'; // Deep crimson

    // ── BACK ARM (Right Arm - Drawing the string) ──
    ctx.save();
    let drawArmRot = 0;
    let drawHandX = 0;
    let drawHandY = 0;

    if (isAttacking) {
        // Arm pulls back
        drawArmRot = -0.2 - pullback * 0.8;
        drawHandX = 10 - pullback * 12;
        drawHandY = -4 + pullback * 1;
    } else {
        drawArmRot = 0.2;
        drawHandX = 6;
        drawHandY = -2;
    }

    ctx.translate(drawHandX, drawHandY + bob);
    ctx.rotate(drawArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, -2, 5, 7);

    if (age >= 2) {
        // Ornate pauldrons (right side)
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-2, -3, 5, 2);

        // Bracer
        ctx.fillStyle = '#aa8a3a';
        ctx.fillRect(-2, 3, 4, 5);
        ctx.fillStyle = '#fff'; // Fine white trim
        ctx.fillRect(-2, 4, 4, 0.5);
    }

    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 9, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── QUIVER (Luxurious Leather Quiver) ──
    ctx.save();
    ctx.translate(-7, -1 + bob);
    ctx.rotate(0.2); // Slanted across back/hip
    ctx.fillStyle = '#8a3a20'; // Reddish leather
    ctx.beginPath();
    ctx.moveTo(-1, -6); ctx.lineTo(3, -6); ctx.lineTo(2, 8); ctx.lineTo(-2, 8); ctx.fill();
    ctx.fillStyle = armorMetal; // Gold rims
    ctx.fillRect(-1.5, -6, 5, 1.5);
    ctx.fillRect(-1.5, -2, 4, 1);
    ctx.fillRect(-1.5, 5, 3, 1);

    // Arrows in quiver
    ctx.fillStyle = armorMetal; // Gold fletching
    ctx.fillRect(0, -9, 2, 3);
    ctx.fillRect(2, -8, 1, 2);

    if (age >= 3) {
        // Blue tassel hanging from quiver
        ctx.fillStyle = '#22aaff';
        ctx.fillRect(-2, 0, 1.5, 4);
    }
    ctx.restore();

    // ── LEGS ──
    ctx.fillStyle = '#4a3a2a'; // Dark loose pants
    ctx.fillRect(-5, 6, 4, 7 + legOff);
    ctx.fillRect(1, 6, 4, 7 - legOff);

    // Soft Leather Boots with curled toes
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-5.5, 12 + legOff, 6, 2);
    ctx.fillRect(0.5, 12 - legOff, 6, 2);
    ctx.beginPath(); ctx.moveTo(0.5, 14 + legOff); ctx.quadraticCurveTo(-1.5, 14 + legOff, -2.5, 12 + legOff); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6.5, 14 - legOff); ctx.quadraticCurveTo(4.5, 14 - legOff, 3.5, 12 - legOff); ctx.fill();

    // ── BODY (Tunic & Scale Armor) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    if (age >= 3) {
        // Gold threaded geometric patterns
        ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
        for (let r = 0; r < 4; r++) {
            ctx.fillRect(-5 + (r % 2), -2 + bob + r * 3, 2, 2);
            ctx.fillRect(1 + (r % 2), -2 + bob + r * 3, 2, 2);
        }

        // Scale Mail Vest (Gereh-sazi)
        ctx.fillStyle = armorMetal; // Gold scales
        ctx.beginPath();
        ctx.moveTo(-6, -4 + bob); ctx.lineTo(6, -4 + bob);
        ctx.lineTo(4, 5 + bob); ctx.lineTo(-4, 5 + bob); ctx.fill();
        // Scale texture
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-4, -2 + bob + i * 3, 8, 0.5);
            for (let j = 0; j < 4; j++) ctx.fillRect(-4 + j * 2 + (i % 2), -2 + bob + i * 3, 0.5, 2);
        }
    } else {
        ctx.fillStyle = 'rgba(201, 168, 76, 0.3)'; // simpler embroidery
        ctx.fillRect(-6, -1 + bob, 12, 1);
        ctx.fillRect(-6, 2 + bob, 12, 1);
    }

    // Wide Persian Waist Sash with intricate hanging cloth
    ctx.fillStyle = sashColor;
    ctx.fillRect(-7, 6 + bob, 14, 3);
    ctx.fillRect(-3, 9 + bob, 6, 4); // Cloth hanging down
    ctx.fillStyle = '#ffd700'; // Gold fringes
    ctx.fillRect(-3, 13 + bob, 6, 1);

    // Accessory: Jeweled Curved Dagger (Jambiya)
    if (age >= 3) {
        ctx.fillStyle = tunicColor; // Teal sheath
        ctx.beginPath(); ctx.moveTo(4, 7 + bob); ctx.quadraticCurveTo(7, 9 + bob, 8, 12 + bob); ctx.lineTo(6, 11 + bob); ctx.fill();
        ctx.fillStyle = armorMetal; // Gold hilt
        ctx.fillRect(3, 6 + bob, 2, 2);
        ctx.fillStyle = '#ff2222'; // Ruby pommel
        ctx.fillRect(4, 5 + bob, 1, 1);
    }

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 8); // Neck/Face

    // Persian Beard
    ctx.fillStyle = '#111';
    ctx.fillRect(-3, -7 + bob, 6, 3);
    ctx.fillRect(3, -9 + bob, 1, 3); // sideburns/mustache

    if (age >= 3) {
        // Pointed Kulah Turban with jewels and chainmail veil
        ctx.fillStyle = tunicColor; // Match robe
        ctx.fillRect(-5, -15 + bob, 10, 5); // Turban base

        ctx.beginPath(); // Pointed top
        ctx.moveTo(-5, -15 + bob); ctx.lineTo(0, -20 + bob); ctx.lineTo(5, -15 + bob); ctx.fill();

        // Gold trim
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-5, -11 + bob, 10, 1.5);

        // Chainmail aventail covering neck
        ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
        ctx.fillRect(-5, -10 + bob, 2, 5); // Back of neck

        // Central Jewel & Peacock Feather
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, -16 + bob, 3, 3); // Setting
        ctx.fillStyle = age >= 4 ? '#ff2222' : '#22ddff'; // Ruby or Sapphire
        ctx.fillRect(0, -15 + bob, 1, 1);

        if (age >= 4) {
            // Tall feather
            ctx.fillStyle = '#22aa88';
            ctx.beginPath();
            ctx.moveTo(0, -16 + bob); ctx.quadraticCurveTo(-4, -22 + bob, -2, -26 + bob);
            ctx.quadraticCurveTo(2, -20 + bob, 1, -16 + bob); ctx.fill();
        }
    } else {
        // Soft felt cap (Tiara)
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(-5, -11 + bob);
        ctx.quadraticCurveTo(-2, -15 + bob, 3, -13 + bob);
        ctx.lineTo(3, -11 + bob);
        ctx.fill();
        ctx.fillStyle = sashColor; // Wrap/Band
        ctx.fillRect(-5, -12 + bob, 9, 2);
    }

    // ── FRONT ARM (Left Arm - Holding Bow) ──
    ctx.save();
    let bowArmRot = 0;

    if (isAttacking) {
        bowArmRot = -Math.PI / 2 + 0.2; // Pointing forward
    } else {
        bowArmRot = -Math.PI / 6; // Relaxed
    }

    ctx.translate(-2, -4 + bob);
    ctx.rotate(bowArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Arm guard / Bracer
    ctx.fillStyle = armorMetal;
    ctx.fillRect(-2, 5, 4, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-1, 5, 2, 5);

    // Hand gripping bow
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();


    // ── THE BOW (Persian Recurve Composite Bow) ──
    // Highly distinct triple-curve bow (Deflexed grip, highly curved limbs, stiff Siyahs)
    ctx.translate(0, 11);
    ctx.rotate(-bowArmRot + bowAngle);

    const bc = age >= 4 ? '#d4af37' : '#c9a84c'; // Gold/Brass base

    // Base core
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Sharply curved limbs
    ctx.arc(4, 0, 11, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Gold/Teal decorative banding
    ctx.strokeStyle = bc;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(4, 0, 11, -Math.PI * 0.35, -Math.PI * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, 0, 11, Math.PI * 0.1, Math.PI * 0.35); ctx.stroke();
    ctx.strokeStyle = '#2c5263'; // Teal accents
    ctx.beginPath(); ctx.arc(4, 0, 11, -Math.PI * 0.1, Math.PI * 0.1); ctx.stroke();

    // Siyahs (stiff recurved tips bending sharply away from string)
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#bbbbbb'; // Bone/Horn tips
    // Upper
    ctx.beginPath(); ctx.moveTo(6, -10); ctx.lineTo(10, -11); ctx.lineTo(9, -9); ctx.fill();
    // Lower
    ctx.beginPath(); ctx.moveTo(6, 10); ctx.lineTo(10, 11); ctx.lineTo(9, 9); ctx.fill();

    // Leather Grip
    ctx.fillStyle = '#6a3020';
    ctx.fillRect(-2, -2, 5, 4);

    // ── BOWSTRING & ARROW ──
    const bowTopY = -11;
    const bowBotY = 11;
    const bowTopX = 10;
    const bowBotX = 10;

    const maxPullDist = 14;
    const stringMidX = bowTopX - pullback * maxPullDist;
    const stringMidY = 0;

    // String
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bowTopX, bowTopY);
    ctx.lineTo(stringMidX, stringMidY);
    ctx.lineTo(bowBotX, bowBotY);
    ctx.stroke();

    // Arrow
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        const arrowLen = 15;

        ctx.save();
        ctx.fillStyle = age >= 4 ? '#ddc060' : '#bb9966';
        ctx.fillRect(stringMidX, -0.5, arrowLen, 1);

        // Persian steel broadhead
        ctx.fillStyle = '#44aaff';
        ctx.beginPath();
        ctx.moveTo(stringMidX + arrowLen, -1.5);
        ctx.lineTo(stringMidX + arrowLen + 3, 0);
        ctx.lineTo(stringMidX + arrowLen, 1.5);
        ctx.fill();

        // Gold Fletching
        ctx.fillStyle = armorMetal;
        ctx.fillRect(stringMidX, -1.5, 3, 3);
        ctx.restore();
    }

    ctx.restore(); // Bow & Front Arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Ba Tu Archer context
}

// ============================================================
//  DRAW KNIGHT (BA TƯ) - Persian Savaran / Cataphract
// ============================================================
export function drawKnight_BaTu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking;
    let attackProgress = 0;
    if (isAttacking) {
        const pullPhase = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        attackProgress = Math.max(0, Math.min(1, pullPhase));
    }

    // Ngựa Ba Tư (Thường là ngựa Nisean to lớn, màu đốm hoặc xám đen thẫm)
    const horseColor = age >= 4 ? '#33302a' : '#4a4235';
    const horseDark = age >= 4 ? '#1a1815' : '#2a2218';

    const hx = -2;
    const hy = 18 + bob;

    const legBob = moving ? Math.sin(unit.animTimer * 18) * 5 : 0;

    // ── HORSE (NGỰA) ──
    ctx.save();
    ctx.translate(hx, hy);

    const rearing = isAttacking && attackProgress < 0.6 ? -0.15 : 0;
    ctx.rotate(rearing);
    ctx.translate(0, rearing ? -4 : 0);

    // Chân sau
    ctx.fillStyle = horseDark;
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-12 - legBob, 6); ctx.lineTo(-8 - legBob, 8); ctx.lineTo(-5, -8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(10 + legBob * 0.5, 8); ctx.lineTo(14 + legBob * 0.5, 8); ctx.lineTo(12, -8); ctx.fill();

    // Đuôi ngựa (Buộc nơ ruy băng lụa Sassanid)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.quadraticCurveTo(-26 - legBob, -10, -22 - legBob, 4);
    ctx.quadraticCurveTo(-18, -2, -16, -14);
    ctx.fill();

    if (age >= 3) {
        // Ruy băng (Kustis / ribbons)
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.moveTo(-20 - legBob, -5); ctx.lineTo(-30 - legBob, 0); ctx.lineTo(-24 - legBob, -2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-20 - legBob, -5); ctx.lineTo(-28 - legBob, -8); ctx.lineTo(-22 - legBob, -6); ctx.fill();
    }

    // Thân ngựa
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.quadraticCurveTo(-8, -18, 14, -18);
    ctx.quadraticCurveTo(24, -18, 24, -8);
    ctx.quadraticCurveTo(12, 6, -12, 4);
    ctx.quadraticCurveTo(-24, 4, -18, -12);
    ctx.fill();

    // Cổ và Đầu
    ctx.beginPath();
    ctx.moveTo(14, -15);
    ctx.quadraticCurveTo(20, -26, 18, -34);
    ctx.lineTo(24, -32);
    ctx.lineTo(30, -20);
    ctx.lineTo(22, -10);
    ctx.fill();

    // Bờm ngựa
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(14, -15); ctx.lineTo(18, -34); ctx.lineTo(14, -32); ctx.quadraticCurveTo(8, -20, 14, -15); ctx.fill();

    // ── GIÁP NGỰA (PERSIAN BARDING - LAMELLAR) ──
    if (age >= 3) {
        if (age >= 4) {
            // Half-barding lamellar (Giáp bao bọc nửa thân trước và cổ)
            ctx.fillStyle = '#a08a55'; // Bronze/Brass lamellar
            ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(18, -14); ctx.lineTo(14, 0); ctx.lineTo(-4, 0); ctx.fill();

            // Vẽ vân vảy lamellar (chữ nhật nhỏ lõm)
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 5; c++) {
                    ctx.fillRect(0 + c * 3 + (r % 2) * 1.5, -14 + r * 3, 2, 2.5);
                }
            }

            // Giáp cổ 
            ctx.fillStyle = '#a08a55';
            ctx.beginPath(); ctx.moveTo(14, -18); ctx.lineTo(18, -32); ctx.lineTo(22, -18); ctx.fill();

            // Mặt nạ sắt (Chanfron có chóp nhọn)
            ctx.fillStyle = '#6a6a68';
            ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(30, -20); ctx.lineTo(26, -30); ctx.fill();
            ctx.fillStyle = '#daa520'; ctx.fillRect(26, -30, 1, 3); // Chóp đồng
        } else {
            // Tấm thảm lót lưng lụa Ba Tư mĩ miều
            ctx.fillStyle = cv.bodyDark;
            ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(12, -4); ctx.lineTo(-14, -4); ctx.fill();
            ctx.strokeStyle = cv.accent; ctx.lineWidth = 1; ctx.stroke();
        }
    }

    // Chân trước
    ctx.fillStyle = horseColor;
    const stompLift = (isAttacking && attackProgress > 0.1 && attackProgress < 0.8) ? -8 : 0;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 + legBob, 10); ctx.lineTo(-8 + legBob, 12); ctx.lineTo(-6, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(14 - legBob, 12 + stompLift); ctx.lineTo(18 - legBob, 12 + stompLift); ctx.lineTo(18, -6); ctx.fill();

    // Dây cương
    ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(20, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(12, -14); ctx.stroke();

    ctx.restore(); // END HORSE

    // ── RIDER (PERSIAN SAVARAN) ──
    const riderY = hy - 20;
    ctx.save();
    ctx.translate(hx, riderY);
    ctx.rotate(rearing * 0.8);

    // Dải lụa Kusti trên lưng kỵ sĩ
    if (age >= 2) {
        ctx.fillStyle = cv.accent + 'dd';
        const capeWave = moving ? Math.sin(unit.animTimer * 15) * 5 : 0;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(-14, 6 + capeWave, -18 + capeWave, 16);
        ctx.lineTo(-15 + capeWave, 18);
        ctx.quadraticCurveTo(-10, 8 + capeWave, -2, 4);
        ctx.fill();
    }

    // Tay phải (cầm cương / khiên nhỏ)
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.skinColor;
    ctx.fillRect(-6, 4, 4, 10);

    // Thân người (Mail and plate - Giáp xích lồng phiến)
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.bodyMid;
    ctx.fillRect(-5, 0, 10, 14);

    if (age >= 4) {
        // Gương ngực tròn nạm viền vàng (Chahar-aina)
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0, 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1; ctx.stroke();

        ctx.fillStyle = '#daa520';
        ctx.fillRect(-5, 12, 10, 1);
        ctx.fillStyle = '#7a7a78';
        ctx.fillRect(-6, 14, 12, 4); // Skirt chainmail
    }

    // Chân & Quần rộng (Shalwar baggy pants)
    ctx.fillStyle = cv.bodyDark; // Quần rộng đặc trưng Á Rập/Ba Tư
    ctx.beginPath(); ctx.moveTo(-3, 14); ctx.quadraticCurveTo(4, 14, 3, 20); ctx.lineTo(-1, 20); ctx.quadraticCurveTo(-4, 18, -3, 14); ctx.fill();

    // Ủng da cưỡi ngựa
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-1, 20, 4, 5);

    // Đầu
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -6, 6, 6); // Mặt & Cổ

    // Mũ bảo hiểm (Spangenhelm hoặc mũ chóp nhọn Sassanid)
    ctx.fillStyle = age >= 4 ? '#888' : '#444';
    ctx.beginPath(); ctx.arc(0, -6, 4.5, Math.PI, 0); ctx.fill(); // Dome tròn
    if (age >= 3) {
        ctx.beginPath(); ctx.moveTo(-1, -10); ctx.lineTo(1, -10); ctx.lineTo(0, -14); ctx.fill(); // Chóp nhọn
    }

    // Vành mũ và aventail bảo vệ cả cổ/mặt dưới
    ctx.fillRect(-5, -6, 10, 1.5);
    ctx.fillStyle = '#6a6a68'; // Chainmail aventail
    ctx.fillRect(-5, -4, 3, 6);
    ctx.fillRect(2, -4, 3, 6);
    ctx.fillRect(-2, -2, 4, 4); // Che luôn mũi cằm, chỉ hở mắt (Age 4)

    // Tay trái (cầm chùy sáu cạnh - Gorz / Khata)
    ctx.save();
    let armRot = 0;
    if (isAttacking) {
        if (attackProgress < 0.4) {
            // Kéo mace vung lên cao
            armRot = -Math.PI / 2 + (attackProgress * 2.5);
        } else {
            // Đập nát xướng
            armRot = Math.PI / 2.5;
        }
    } else {
        armRot = moving ? Math.PI / 8 + Math.sin(unit.animTimer * 18) * 0.1 : Math.PI / 5;
    }

    ctx.translate(2, 2);
    ctx.rotate(armRot);

    // Cánh tay
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.skinColor;
    ctx.fillRect(-2, 0, 4, 12);

    // Vũ khí (Gorz - Chùy sắt/Chùy đầu bò)
    ctx.translate(0, 10);
    ctx.fillStyle = '#3a2010'; // Cán thép/gỗ bọc thép
    ctx.fillRect(-1.5, -14, 3, 22);

    if (age >= 3) {
        // Đầu chùy sắt nặng (Mace head)
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.ellipse(0, 10, 4, 5, 0, 0, Math.PI * 2); ctx.fill(); // Ối chùy
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-2, 15, 4, 1); // Khuyết chóp xích
        // Bích đinh (Flanges)
        ctx.fillStyle = '#888';
        ctx.fillRect(-5, 8, 10, 1.5);
        ctx.fillRect(-1, 6, 2, 8);
    } else {
        // Quát (Kiếm cong hẹp xoắn) hoặc mác
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(-1, 8); ctx.quadraticCurveTo(-4, 14, 0, 20); ctx.quadraticCurveTo(2, 14, 1, 8); ctx.fill();
    }

    ctx.restore(); // END Tay trái

    ctx.restore(); // END RIDER

    drawKnightsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // END MAIN KNIGHT
}
