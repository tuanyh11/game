// ============================================================
//  Viking (Norse) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState, CIV_UNIT_MODIFIERS } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";

// ======== VIKING SCOUT — Berserker Scout with dual axes ========
export function drawScout_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) { attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed); }

    let bodyTilt = 0, rArmRot = 0.1, lArmRot = 0.1, armOffX = 0, armOffY = 0;
    if (attackState) {
        if (attackProgress < 0.2) {
            const t = attackProgress / 0.2, ease = t * t;
            rArmRot = 0.1 + (-Math.PI / 1.1 - 0.1) * ease; lArmRot = 0.1 + (-Math.PI / 1.3 - 0.1) * ease;
            bodyTilt = -0.15 * ease; armOffY = -4 * ease;
        } else if (attackProgress < 0.42) {
            const t = (attackProgress - 0.2) / 0.22, e = 1 - Math.pow(1 - t, 4);
            rArmRot = (-Math.PI / 1.1) * (1 - e) + (Math.PI / 2) * e;
            lArmRot = (-Math.PI / 1.3) * (1 - e) + (Math.PI / 2.5) * e;
            bodyTilt = -0.15 * (1 - e) + 0.3 * e; armOffX = 7 * e; armOffY = -4 * (1 - e) + 3 * e;
        } else if (attackProgress < 0.57) {
            const t = (attackProgress - 0.42) / 0.15, sh = Math.sin(t * Math.PI * 4) * 0.06 * (1 - t);
            rArmRot = (Math.PI / 2) + sh; lArmRot = (Math.PI / 2.5) + sh;
            bodyTilt = 0.3 + sh; armOffX = 7 - t * 2; armOffY = 3;
        } else {
            const t = (attackProgress - 0.57) / 0.43, e = t * t * (3 - 2 * t);
            rArmRot = (Math.PI / 2) * (1 - e) + 0.1 * e; lArmRot = (Math.PI / 2.5) * (1 - e) + 0.1 * e;
            bodyTilt = 0.3 * (1 - e); armOffX = 5 * (1 - e); armOffY = 3 * (1 - e);
        }
    }
    if (bodyTilt !== 0) { ctx.translate(0, 10 + bob); ctx.rotate(bodyTilt); ctx.translate(0, -(10 + bob)); }

    // Wolf pelt cape
    if (age >= 2) {
        ctx.fillStyle = '#4a3a2a';
        const capeWave = moving ? Math.sin(unit.animTimer * 12) * 3 : Math.sin(unit.animTimer * 3) * 1;
        ctx.fillRect(-10, -4 + bob, 6, 16 + capeWave);
        ctx.fillStyle = '#6a5a3a'; ctx.fillRect(-11, -2 + bob, 3, 12 + capeWave * 0.8); ctx.fillRect(-7, 2 + bob, 2, 10 + capeWave * 1.2);
    }

    // Legs
    ctx.fillStyle = age >= 3 ? '#3a3a28' : '#4a4a38';
    ctx.fillRect(-5, 9, 4, 7 + legOffset); ctx.fillRect(1, 9, 4, 7 - legOffset);
    ctx.fillStyle = '#5a4a30'; ctx.fillRect(-5, 12 + legOffset, 4, 3); ctx.fillRect(1, 12 - legOffset, 4, 3);
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(-6, 14 + legOffset, 5, 3); ctx.fillRect(0, 14 - legOffset, 5, 3);

    // Body
    if (age >= 3) {
        ctx.fillStyle = cv.bodyDark; ctx.fillRect(-7, -4 + bob, 14, 13);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let i = 0; i < 4; i++) ctx.fillRect(-6, -2 + bob + i * 3, 12, 1);
    } else {
        ctx.fillStyle = cv.skinColor; ctx.fillRect(-7, -4 + bob, 14, 13);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(-6, 0 + bob, 12, 1); ctx.fillRect(-1, 0 + bob, 2, 8);
    }
    ctx.fillStyle = '#5a4a2a'; ctx.fillRect(-9, -6 + bob, 18, 5);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-8, -5 + bob, 16, 2);
    ctx.fillStyle = '#3a2010'; ctx.fillRect(-7, 6 + bob, 14, 3);
    ctx.fillStyle = '#999'; ctx.fillRect(-2, 5.5 + bob, 4, 4);
    ctx.fillStyle = '#5a4a30'; ctx.fillRect(4, 7 + bob, 4, 4); ctx.fillRect(4.5, 9 + bob, 3, 2);
    if (age >= 3) { ctx.fillStyle = cv.accent + '44'; ctx.fillRect(-3, -2 + bob, 2, 5); ctx.fillRect(1, -2 + bob, 2, 5); }
    if (age >= 4) { ctx.fillStyle = '#e0d8c0'; ctx.fillRect(-3, -4 + bob, 6, 1); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -4 + bob, 1, 1); ctx.fillRect(1, -4 + bob, 1, 1); }

    // Head
    ctx.fillStyle = cv.skinColor; ctx.fillRect(-4, -13 + bob, 8, 9);
    ctx.fillStyle = (moving || age >= 3) ? '#ffea00' : '#fff'; ctx.fillRect(-3, -10 + bob, 2, 1.5); ctx.fillRect(1, -10 + bob, 2, 1.5);
    ctx.fillStyle = '#111'; ctx.fillRect(-2.5, -10 + bob, 1, 1); ctx.fillRect(1.5, -10 + bob, 1, 1);
    ctx.fillStyle = '#222'; ctx.fillRect(-4, -11 + bob, 4, 1); ctx.fillRect(0, -11 + bob, 4, 1);
    ctx.fillStyle = age >= 3 ? '#aa1111' : cv.accent + '99'; ctx.fillRect(-4, -8 + bob, 2, 3); ctx.fillRect(2, -8 + bob, 2, 3); ctx.fillRect(-1, -7 + bob, 2, 4);
    ctx.fillStyle = '#c85a17'; ctx.fillRect(-4, -5 + bob, 8, 4); ctx.fillRect(-3, -1 + bob, 6, 3); ctx.fillRect(-1, 2 + bob, 2, 2);
    ctx.fillStyle = '#a04010'; ctx.fillRect(-3, -4 + bob, 1, 6); ctx.fillRect(1, -4 + bob, 1, 6);
    if (age >= 3) {
        ctx.fillStyle = '#555'; ctx.fillRect(-5, -17 + bob, 10, 5); ctx.fillStyle = '#333'; ctx.fillRect(-6, -13 + bob, 12, 1); ctx.fillRect(-1, -17 + bob, 2, 5);
        ctx.fillStyle = '#666'; ctx.fillRect(-5, -12 + bob, 10, 2); ctx.fillRect(-1, -12 + bob, 2, 5); ctx.fillRect(-4, -10 + bob, 2, 2); ctx.fillRect(2, -10 + bob, 2, 2);
        if (age >= 4) { ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.moveTo(-5, -15 + bob); ctx.quadraticCurveTo(-11, -18 + bob, -11, -12 + bob); ctx.lineTo(-7, -15 + bob); ctx.fill();
            ctx.beginPath(); ctx.moveTo(5, -15 + bob); ctx.quadraticCurveTo(11, -18 + bob, 11, -12 + bob); ctx.lineTo(7, -15 + bob); ctx.fill(); }
    } else { ctx.fillStyle = '#c85a17'; ctx.fillRect(-3, -16 + bob, 6, 4); ctx.fillRect(-4, -15 + bob, 8, 2); }

    // ── RIGHT AXE ARM ──
    ctx.save(); ctx.translate(6, -2 + bob); ctx.rotate(rArmRot); ctx.translate(armOffX, armOffY);
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(-1.5, 0, 3, 12); ctx.fillStyle = '#222'; ctx.fillRect(-1.5, 4, 3, 4);
    ctx.fillStyle = age >= 4 ? '#e6e6e6' : age >= 3 ? '#b0b0b0' : '#888';
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(6, -3); ctx.lineTo(7, 4); ctx.quadraticCurveTo(3, 2, 1, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(6, -2, 1, 6);
    if (age >= 4) { ctx.fillStyle = '#aa0000'; ctx.fillRect(6, 1, 1, 4);
        ctx.globalAlpha = 0.5 + Math.sin(unit.animTimer * 8) * 0.3; ctx.fillStyle = '#ff4400'; ctx.fillRect(2, -1, 2, 2); ctx.globalAlpha = 1; }
    // Slash arc — right axe
    if (attackState && attackProgress > 0.2 && attackProgress < 0.57) {
        const a = attackProgress < 0.42 ? 0.55 : 0.55 * (1 - (attackProgress - 0.42) / 0.15);
        // Outer blood arc
        ctx.fillStyle = `rgba(180, 30, 30, ${a})`;
        ctx.beginPath();
        ctx.moveTo(2, -2);
        ctx.quadraticCurveTo(12, -10, 6, -18);
        ctx.lineTo(4, -16);
        ctx.quadraticCurveTo(10, -8, 2, 2);
        ctx.closePath(); ctx.fill();
        // Inner bright core
        ctx.fillStyle = `rgba(255, 120, 60, ${a * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(3, -1);
        ctx.quadraticCurveTo(10, -8, 5, -14);
        ctx.lineTo(4, -12);
        ctx.quadraticCurveTo(8, -6, 3, 1);
        ctx.closePath(); ctx.fill();
        // Impact sparks
        if (attackProgress > 0.38 && attackProgress < 0.52) {
            const sp = (attackProgress - 0.38) / 0.14;
            ctx.fillStyle = `rgba(255, 200, 50, ${0.7 * (1 - sp)})`;
            for (let i = 0; i < 3; i++) {
                const sx = 6 + Math.cos(sp * 4 + i * 2) * (4 + i * 3);
                const sy = -2 + Math.sin(sp * 3 + i * 1.5) * (3 + i * 2);
                ctx.fillRect(sx, sy, 1.5, 1.5);
            }
        }
    }
    ctx.restore();

    // ── LEFT AXE ARM ──
    ctx.save(); ctx.translate(-6, -2 + bob); ctx.rotate(-lArmRot); ctx.translate(-armOffX, armOffY);
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(-1.5, 0, 3, 11); ctx.fillStyle = '#222'; ctx.fillRect(-1.5, 4, 3, 4);
    ctx.fillStyle = age >= 4 ? '#e6e6e6' : age >= 3 ? '#b0b0b0' : '#888';
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-6, -3); ctx.lineTo(-7, 3); ctx.quadraticCurveTo(-3, 2, -1, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-7, -2, 1, 4);
    if (age >= 4) { ctx.fillStyle = '#aa0000'; ctx.fillRect(-7, 0, 1, 3);
        ctx.globalAlpha = 0.5 + Math.sin(unit.animTimer * 8) * 0.3; ctx.fillStyle = '#ff4400'; ctx.fillRect(-4, -1, 2, 2); ctx.globalAlpha = 1; }
    // Slash arc — left axe
    if (attackState && attackProgress > 0.22 && attackProgress < 0.57) {
        const a = attackProgress < 0.42 ? 0.45 : 0.45 * (1 - (attackProgress - 0.42) / 0.15);
        ctx.fillStyle = `rgba(180, 30, 30, ${a})`;
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.quadraticCurveTo(-12, -10, -6, -18);
        ctx.lineTo(-4, -16);
        ctx.quadraticCurveTo(-10, -8, -2, 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255, 120, 60, ${a * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(-3, -1);
        ctx.quadraticCurveTo(-10, -8, -5, -14);
        ctx.lineTo(-4, -12);
        ctx.quadraticCurveTo(-8, -6, -3, 1);
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 2) { ctx.globalAlpha = 0.15; ctx.fillStyle = '#8a7a60'; for (let i = 0; i < 3; i++) { ctx.fillRect(-12 - i * 3, 10 + bob + i * 3, 3, 2); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

export function drawSwords_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Dynamic Attack Posture Calculation (Heavy broadsword chop)
    let bodyTilt = 0;
    let rightArmRot = 0.1;
    let leftArmRot = -0.1;
    let swordOffsetX = 0;
    let swordOffsetY = 0;
    let shieldOffsetX = 0;

    if (attackState) {
        if (attackProgress < 0.3) {
            // Windup: haul sword back over shoulder, brace shield
            const t = attackProgress / 0.3;
            rightArmRot = (0.1) * (1 - t) + (-Math.PI / 1.5) * t;
            leftArmRot = (-0.1) * (1 - t) + (-Math.PI / 6) * t;
            bodyTilt = -0.15 * t;
            swordOffsetX = 2 * t;
            swordOffsetY = 4 * t;
            shieldOffsetX = -2 * t;
        } else if (attackProgress < 0.6) {
            // Strike: heavy downward chop
            const t = (attackProgress - 0.3) / 0.3;
            rightArmRot = (-Math.PI / 1.5) * (1 - t) + (Math.PI / 3) * t;
            leftArmRot = (-Math.PI / 6) * (1 - t) + (Math.PI / 12) * t;
            bodyTilt = -0.15 * (1 - t) + 0.2 * t;
            swordOffsetX = 2 * (1 - t) + 5 * t;
            swordOffsetY = 4 * (1 - t) + 2 * t;
        } else {
            // Recover: heft it back up
            const t = (attackProgress - 0.6) / 0.4;
            rightArmRot = (Math.PI / 3) * (1 - t) + 0.1 * t;
            leftArmRot = (Math.PI / 12) * (1 - t) + -0.1 * t;
            bodyTilt = 0.2 * (1 - t) + 0 * t;
            swordOffsetX = 5 * (1 - t);
            swordOffsetY = 2 * (1 - t);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#f2d1aa';
    const tunicColor = cv.bodyMid;
    const armorPrimary = age >= 3 ? '#666' : '#5c4033'; // Chainmail vs Leather

    // ── LEGS ──
    ctx.fillStyle = '#3a2f26';
    ctx.fillRect(-6, 12 + bob, 5, 5 + legOff);
    ctx.fillRect(1, 12 + bob, 5, 5 - legOff);

    // Cross-gartered boots
    ctx.fillStyle = '#6b4c2a';
    ctx.fillRect(-6, 17 + bob + legOff, 5, 4);
    ctx.fillRect(1, 17 + bob - legOff, 5, 4);
    ctx.fillStyle = '#3a2010'; // straps
    ctx.fillRect(-6, 18 + bob + legOff, 5, 0.5); ctx.fillRect(-6, 20 + bob + legOff, 5, 0.5);
    ctx.fillRect(1, 18 + bob - legOff, 5, 0.5); ctx.fillRect(1, 20 + bob - legOff, 5, 0.5);
    ctx.fillStyle = '#1e140c'; // shoes
    ctx.fillRect(-7, 21 + bob + legOff, 6, 2);
    ctx.fillRect(0, 21 + bob - legOff, 6, 2);



    // ── TORSO (Chainmail / Leather Tunic) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-7, -5 + bob, 14, 18); // Tunic length

    // Armor overlay
    if (age >= 3) {
        // Hauberk
        ctx.fillStyle = armorPrimary;
        ctx.fillRect(-7, -5 + bob, 14, 14);
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Chain link texture
        for (let r = 0; r < 5; r++) {
            ctx.fillRect(-7, -4 + bob + r * 3, 14, 1);
        }
    } else {
        // Leather harness
        ctx.fillStyle = armorPrimary;
        ctx.fillRect(-7, -2 + bob, 14, 8);
        ctx.fillStyle = '#4a2f1d';
        ctx.fillRect(-4, -5 + bob, 2, 8);
        ctx.fillRect(2, -5 + bob, 2, 8);
    }

    // Heavy Ring Belt
    ctx.fillStyle = '#221100';
    ctx.fillRect(-7, 7 + bob, 14, 2.5);
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(-2, 8 + bob, 1.5, 0, Math.PI * 2); ctx.stroke();

    // ── PELT / CLOAK ──
    ctx.fillStyle = age >= 4 ? '#3d3124' : '#5c4e3a';
    ctx.beginPath();
    ctx.moveTo(-9, -4 + bob); ctx.lineTo(-10, 4 + bob); ctx.lineTo(-7, 6 + bob);
    ctx.lineTo(7, 6 + bob); ctx.lineTo(10, 4 + bob); ctx.lineTo(9, -4 + bob);
    ctx.closePath();
    ctx.fill();

    // ── FRONT/SWORD ARM (Right Arm holding Broadsword) ──
    ctx.save();
    ctx.translate(5, -2 + bob);
    ctx.rotate(rightArmRot);
    ctx.translate(swordOffsetX, swordOffsetY);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);
    // Hand
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1.5, 6, 3, 3);

    // Ulfberht Broadsword
    ctx.translate(-1, 9);
    // Point sword moderately forward, rather than straight up the arm
    ctx.rotate(Math.PI / 2.5);

    // Pommel (Lobed)
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
    // Grip
    ctx.fillStyle = '#312012';
    ctx.fillRect(-1, -6, 2, 6);
    // Crossguard
    ctx.fillStyle = '#555';
    ctx.fillRect(-3, -1.5, 6, 1.5);

    // Blade (Wide, straight, tapering tip)
    ctx.fillStyle = age >= 4 ? '#ebebeb' : '#cccccc';
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(-1.5, 20);
    ctx.lineTo(0, 23); // point
    ctx.lineTo(1.5, 20);
    ctx.lineTo(2, 0);
    ctx.fill();

    // Fuller (Blood groove)
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-0.5, 0, 1, 18);

    // Swing effect
    if (attackState && attackProgress > 0.3 && attackProgress < 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        // Adjust swing arc for downward-pointing sword math
        ctx.moveTo(0, 5); ctx.quadraticCurveTo(20, 10, 26, -5);
        ctx.lineTo(26, -2); ctx.quadraticCurveTo(15, 12, 0, 5);
        ctx.fill();
    }
    ctx.restore();

    // ── HEAD & HELMET (Spectacle Helm) ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -13 + bob, 8, 9);
    // Pale eyes
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(-2, -11 + bob, 1, 1);
    ctx.fillRect(1, -11 + bob, 1, 1);

    // Thick Beard (Fiery red/blond)
    ctx.fillStyle = age >= 4 ? '#b3c6cf' : '#d48a33';
    ctx.beginPath(); ctx.moveTo(-4, -6 + bob); ctx.quadraticCurveTo(0, -2 + bob, 4, -6 + bob); ctx.lineTo(0, -4 + bob); ctx.fill();

    if (age >= 3) {
        // Spangenhelm Dome
        ctx.fillStyle = age >= 4 ? '#555' : '#666';
        ctx.beginPath(); ctx.arc(0, -13 + bob, 5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-6, -14 + bob, 12, 1); // Rim

        // Spectacle Guard
        ctx.fillStyle = '#999';
        ctx.fillRect(-2, -14 + bob, 4, 1); // Brow
        ctx.fillRect(-0.5, -13 + bob, 1, 4); // Nasal
        ctx.beginPath(); ctx.arc(-2, -11 + bob, 1.5, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(2, -11 + bob, 1.5, Math.PI, 0); ctx.stroke();

        if (age >= 4) {
            // Ceremonial Horns (for aesthetic pop)
            ctx.fillStyle = '#e8dcc4';
            ctx.beginPath(); ctx.moveTo(-4, -15 + bob); ctx.quadraticCurveTo(-10, -18 + bob, -8, -24 + bob); ctx.quadraticCurveTo(-6, -18 + bob, -2, -15 + bob); ctx.fill();
            ctx.beginPath(); ctx.moveTo(4, -15 + bob); ctx.quadraticCurveTo(10, -18 + bob, 8, -24 + bob); ctx.quadraticCurveTo(6, -18 + bob, 2, -15 + bob); ctx.fill();
        }
    } else {
        ctx.fillStyle = '#d48a33';
        ctx.fillRect(-5, -15 + bob, 10, 3);
    }

    // ── FRONT ARM & SHIELD (Round Shield) ──
    ctx.save();
    ctx.translate(-5, -1 + bob);
    ctx.rotate(leftArmRot);

    // Front arm sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);

    // Painted Wooden Round Shield
    if (age >= 2) {
        ctx.translate(-3 + shieldOffsetX, 4);
        const shieldR = age >= 3 ? 8 : 6;

        // Wood Base
        ctx.fillStyle = '#5c4033';
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.fill();

        // Clan Motif Painting (Halved)
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(0, 0, shieldR, Math.PI / 2, Math.PI * 1.5); ctx.fill();

        // Iron Rim
        ctx.strokeStyle = '#222'; ctx.lineWidth = age >= 4 ? 2 : 1;
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.stroke();

        // Central Boss
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (VIKING) - Norse Spearman / Huskarl
// ============================================================
export function drawSpears_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();

    // Attack animation parameters (Straight, powerful underhand thrust copied from La Ma)
    let attackProgress = 0;
    if (unit.state === UnitState.Attacking && isInAttackRange) {
        const attackCycle = unit.attackAnimTimer % unit.civAttackSpeed;
        // Make the entire animation take 95% of the cooldown so it feels more deliberate
        const attackDuration = unit.civAttackSpeed * 0.95;
        if (attackCycle < attackDuration) {
            attackProgress = attackCycle / attackDuration;
        }
    }

    // Realistic Straight-Line Spear Thrust Animation
    let bodyRot = 0;
    let spearAngle = 0;
    let spearOffset = { x: 0, y: 0 };
    let rightArmRot = 0;
    let leftArmRot = 0;
    let leftElbowBend = -Math.PI / 2;
    let rightElbowBend = 0;

    if (attackProgress > 0) {
        if (attackProgress < 0.4) {
            // Windup: coil back, left arm bends more, right arm pulls back
            const t = attackProgress / 0.4;
            const ease = t * t * (3 - 2 * t);
            bodyRot = ease * -0.2;
            spearOffset.x = ease * -14;
            spearOffset.y = ease * -2;
            spearAngle = ease * 0.05;
            rightArmRot = ease * 0.3;
            leftArmRot = ease * 0.15;
            leftElbowBend = -Math.PI / 2 + ease * 0.3; // Bend tighter
            rightElbowBend = ease * -0.2;
        } else if (attackProgress < 0.6) {
            // Strike: explosive forward, arms extend
            const t = (attackProgress - 0.4) / 0.2;
            const easeOut = 1 - Math.pow(1 - t, 4);
            bodyRot = -0.2 + easeOut * 0.35;
            spearOffset.x = -14 + easeOut * 32;
            spearOffset.y = -2 + easeOut * 2;
            spearAngle = 0.05 - easeOut * 0.05;
            rightArmRot = 0.3 - easeOut * 0.9;
            leftArmRot = 0.15 - easeOut * 0.5;
            leftElbowBend = (-Math.PI / 2 + 0.3) - easeOut * 0.8; // Straighten out
            rightElbowBend = -0.2 - easeOut * 0.3;
        } else if (attackProgress < 0.75) {
            // Impact/Hold
            const t = (attackProgress - 0.6) / 0.15;
            bodyRot = 0.15 + t * 0.02;
            spearOffset.x = 18 + t * 2;
            spearAngle = 0;
            rightArmRot = -0.6 + t * 0.05;
            leftArmRot = -0.35;
            leftElbowBend = -Math.PI / 2 - 0.5; // Extended
            rightElbowBend = -0.5;
        } else {
            // Recovery: return to L-shape
            const t = (attackProgress - 0.75) / 0.25;
            const easeIn = t * t * t;
            bodyRot = 0.17 * (1 - easeIn);
            spearOffset.x = 20 * (1 - easeIn);
            spearAngle = 0;
            rightArmRot = -0.55 * (1 - easeIn);
            leftArmRot = -0.35 * (1 - easeIn);
            leftElbowBend = (-Math.PI / 2 - 0.5) + easeIn * 0.5; // Back to L
            rightElbowBend = -0.5 * (1 - easeIn);
        }
    } else {
        const breath = Math.sin(unit.animTimer * 2) * 0.02;
        bodyRot = breath;
        spearAngle = breath * 0.5;
        leftArmRot = 0.1;
        rightArmRot = 0.1;
        leftElbowBend = -Math.PI / 2;
        rightElbowBend = 0;
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = age >= 3 ? cv.bodyDark : cv.bodyMid;
    const paddingColor = '#5c4a33';
    const armorMetal = age >= 4 ? '#5a5a58' : '#777777';
    const furColor = '#4a3a2a';


    // ── LEGS ──
    // Loose wool trousers and leg wraps (Winingas)
    ctx.fillStyle = paddingColor;
    ctx.fillRect(-4, 6, 3, 6 + legOff);
    ctx.fillRect(1, 6, 3, 6 - legOff);

    // Winingas (wraps)
    ctx.fillStyle = '#222';
    ctx.fillRect(-4.5, 8 + Math.max(0, legOff), 4, 5);
    ctx.fillRect(0.5, 8 + Math.max(0, -legOff), 4, 5);
    ctx.strokeStyle = '#5a5a58'; ctx.lineWidth = 0.5; // X pattern
    ctx.beginPath(); ctx.moveTo(-4.5, 8 + legOff); ctx.lineTo(0.5, 13 + legOff); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.5, 8 - legOff); ctx.lineTo(4.5, 13 - legOff); ctx.stroke();

    // Leather Shoes
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-4, 11 + legOff, 3, 1);
    ctx.fillRect(1, 11 - legOff, 3, 1);

    // ── BODY (Gambeson & Mail) ──
    // Tunic skirt
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-5, -6 + bob, 10, 14);

    // Fur mantle (shoulders/back)
    if (age >= 3) {
        ctx.fillStyle = furColor;
        ctx.fillRect(-6, -5 + bob, 12, 5);
    }

    // Chainmail Shirt (Byrnie)
    if (age >= 2) {
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-5, -6 + bob, 10, 11);
        // Links
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 3; c++) {
                ctx.beginPath(); ctx.arc(-3 + c * 3 + (r % 2), -4 + bob + r * 2.2, 1, 0, Math.PI); ctx.fill();
            }
        }
    }

    // Heavy leather belt
    ctx.fillStyle = '#222';
    ctx.fillRect(-5, 4 + bob, 10, 2);
    ctx.fillStyle = '#a0a0a0'; // Buckle
    ctx.fillRect(-1, 3.5 + bob, 2, 3);
    ctx.fillStyle = '#222'; ctx.fillRect(0, 4 + bob, 1, 2);

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -13 + bob, 6, 7); // Neck/Face

    // Bushy Blonde/Red Beard
    ctx.fillStyle = '#b85c14'; // Reddish brown
    ctx.fillRect(-3.5, -9 + bob, 7, 3); // simple

    if (age >= 3) {
        // Gjermundbu style Helmet (Spectacle helm)
        ctx.fillStyle = armorMetal;
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill(); // Dome
        ctx.fillRect(-5, -11 + bob, 10, 1.5); // Rim

        // Spectacle guard
        ctx.fillRect(-4.5, -9.5 + bob, 2.5, 4);
        ctx.fillRect(2, -9.5 + bob, 2.5, 4);
        ctx.fillStyle = skinColor;
        ctx.fillRect(-3.5, -9 + bob, 1.5, 2);

    } else if (age >= 2) {
        // Spangenhelm
        ctx.fillStyle = '#5a5a58';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill();
        ctx.fillRect(-5, -11 + bob, 10, 1.5);
    } else {
        // Bareheaded
        ctx.fillStyle = '#222';
        ctx.fillRect(-4, -14 + bob, 8, 3);
    }

    // ── LEFT ARM (L-shape) — drawn on top of body ──
    ctx.save();
    ctx.translate(-5, -5 + bob);
    ctx.rotate(0.8 + leftArmRot);
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 3);
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-2, 3, 4, 3);
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(0, 4, 5, 4);
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(5, 6, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── RIGHT ARM (straight down to spear) — drawn on top of body ──
    ctx.save();
    ctx.translate(6, -5 + bob);
    ctx.rotate(-0.5 + rightArmRot);
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-1.5, 0, 3, 4);
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-1.5, 4, 3, 5);
    if (age >= 3) { ctx.fillStyle = armorMetal; ctx.fillRect(-1.5, 8, 3, 1); }
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── SPEAR (Krókspjót) — drawn on top of body ──
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    ctx.translate(0, 4 + bob);
    ctx.rotate(spearAngle);
    ctx.fillStyle = '#7c5f40';
    const poleLength = age >= 3 ? 30 : 26;
    ctx.fillRect(-poleLength * 0.4, -1, poleLength, 2);
    ctx.fillStyle = '#444'; ctx.fillRect(-poleLength * 0.4 - 2, -0.5, 2, 1);
    const shaftEnd = poleLength * 0.6;
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#cccccc';
    const bladeLen = age >= 3 ? 8 : 6;
    ctx.fillRect(shaftEnd, -1.5, 3, 3);
    if (age >= 3) { ctx.beginPath(); ctx.moveTo(shaftEnd + 1, -1.5); ctx.lineTo(shaftEnd + 2, -4); ctx.lineTo(shaftEnd + 3, -1.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(shaftEnd + 1, 1.5); ctx.lineTo(shaftEnd + 2, 4); ctx.lineTo(shaftEnd + 3, 1.5); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(shaftEnd + 3, 0); ctx.quadraticCurveTo(shaftEnd + 6, -3, shaftEnd + 3 + bladeLen, 0); ctx.quadraticCurveTo(shaftEnd + 6, 3, shaftEnd + 3, 0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(shaftEnd + 4, -0.5, bladeLen - 2, 1);
    ctx.restore();

    // ── FRONT ARM & SHIELD (Heavy Viking Round Shield) ──
    ctx.save();
    ctx.translate(-3, -2 + bob);
    // Arm rotates slightly opposite body for balance
    ctx.rotate(leftArmRot);

    // Complete Shield
    // Braced against the body/leg, facing forward
    ctx.translate(-2, 4);
    const shieldR = age >= 3 ? 9 : 8; // Very large

    // Wood Base
    ctx.fillStyle = '#3a2010'; // Darker, heavier wood
    ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.fill();

    // Painted pattern (Swirls or quarters)
    ctx.fillStyle = cv.accent;
    ctx.beginPath(); ctx.arc(0, 0, shieldR, Math.PI * 0.75, Math.PI * 1.75); ctx.fill();

    ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5; // Wood planks
    for (let x = -shieldR + 2; x < shieldR; x += 3) {
        ctx.beginPath(); ctx.moveTo(x, -shieldR); ctx.lineTo(x, shieldR); ctx.stroke();
    }

    // Heavy Iron Rim
    ctx.strokeStyle = '#5a5a58'; ctx.lineWidth = age >= 4 ? 2 : 1.5;
    ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.stroke();

    if (age >= 3) {
        // Iron studs
        ctx.fillStyle = '#ccc';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath(); ctx.arc(Math.cos(i * Math.PI / 4) * (shieldR - 1), Math.sin(i * Math.PI / 4) * (shieldR - 1), 1, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Central Iron Boss (Umbone)
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // Shield & Arm

    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore();
}

// ============================================================
//  DRAW ARCHER (VIKING) - Norse Bowman / Hunter
// ============================================================
export function drawArchers_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();

    let isAttacking = false;
    if (unit.state === UnitState.Attacking && isInAttackRange) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
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
    const tunicColor = cv.bodyMid;
    const leatherColor = '#5c4033';
    const armorMetal = age >= 4 ? '#5a5a58' : '#777777';

    // ── QUIVER (Cylindrical leather quiver on back/hip) ──
    ctx.save();
    ctx.translate(-7, -2 + bob);
    ctx.rotate(0.2); // Slanted across back
    ctx.fillStyle = '#4a3018'; // Dark leather
    ctx.fillRect(-2, -6, 5, 16);
    ctx.fillStyle = '#2a1a0f'; // Strap wrapping
    ctx.fillRect(-2, 0, 5, 2);
    // Rough arrows (Hunter style)
    ctx.fillStyle = '#aaa'; // Arrowhead/shaft
    ctx.fillRect(-1.5, -9, 1, 3);
    ctx.fillRect(1.5, -8, 1, 2);
    ctx.fillStyle = '#7a3a2a'; // Red/Brown fletching
    ctx.fillRect(-2, -10, 4, 3);
    ctx.fillRect(1, -9, 3, 2);
    ctx.restore();

    // ── LEGS ──
    ctx.fillStyle = '#4a3a2a'; // Brown trousers
    ctx.fillRect(-5, 6, 4, 7 + legOff);
    ctx.fillRect(1, 6, 4, 7 - legOff);

    // Winingas (Leg wraps)
    ctx.fillStyle = '#222';
    ctx.fillRect(-5.5, 9 + legOff, 5, 3);
    ctx.fillRect(0.5, 9 - legOff, 5, 3);
    ctx.strokeStyle = '#5c4033'; ctx.lineWidth = 0.5; // X-pattern
    ctx.beginPath(); ctx.moveTo(-5.5, 9 + legOff); ctx.lineTo(-0.5, 12 + legOff); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.5, 9 - legOff); ctx.lineTo(5.5, 12 - legOff); ctx.stroke();

    // Shoes
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-5.5, 12 + legOff, 5, 2);
    ctx.fillRect(0.5, 12 - legOff, 5, 2);

    // ── BODY (Tunic & Fur/Armor) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    if (age >= 3) {
        // Chainmail Shirt over Tunic
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-6, -5 + bob, 12, 11);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.beginPath(); ctx.arc(-4 + c * 3 + (r % 2), -3 + bob + r * 2.5, 1, 0, Math.PI); ctx.fill();
            }
        }
    } else if (age >= 2) {
        // Leather chest piece
        ctx.fillStyle = leatherColor;
        ctx.fillRect(-5, -4 + bob, 10, 8);
    }

    if (age >= 2) {
        // Fur mantle (Wolf/Bear pelt around shoulders)
        ctx.fillStyle = age >= 4 ? '#3d3124' : '#7a6a4a';
        ctx.beginPath();
        ctx.moveTo(-7, -5 + bob); ctx.lineTo(0, 0 + bob); ctx.lineTo(7, -5 + bob);
        ctx.lineTo(8, -1 + bob); ctx.lineTo(0, 3 + bob); ctx.lineTo(-8, -1 + bob); ctx.fill();
    }

    // Heavy belt
    ctx.fillStyle = '#222';
    ctx.fillRect(-6, 5 + bob, 12, 2);
    ctx.fillStyle = '#8a8a88'; // Iron buckle
    ctx.fillRect(-1, 5 + bob, 2, 2);

    // Accessory: Hand Axe or Horn on belt
    if (age >= 3) {
        ctx.fillStyle = '#e0d8c0';
        ctx.beginPath(); ctx.moveTo(4, 7 + bob); ctx.quadraticCurveTo(7, 10 + bob, 5, 13 + bob); ctx.lineTo(4, 11 + bob); ctx.fill();
    }

    // ── HEAD & HOOD/HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 8); // Neck/Face

    // Bushy Beard
    ctx.fillStyle = '#b85c14'; // Reddish blonde
    ctx.fillRect(-3, -7 + bob, 6, 3);

    if (age >= 3) {
        // Spectacle Helmet
        ctx.fillStyle = armorMetal;
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill(); // Dome
        ctx.fillStyle = '#aaaaab';
        ctx.fillRect(-2, -11 + bob, 4, 3); // Nose guard
        ctx.beginPath(); ctx.arc(-2.5, -9 + bob, 1.5, Math.PI, 0); ctx.stroke(); // Left eye
        ctx.beginPath(); ctx.arc(2.5, -9 + bob, 1.5, Math.PI, 0); ctx.stroke(); // Right eye

        if (age >= 4) {
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.moveTo(-4, -13 + bob); ctx.lineTo(-7, -16 + bob); ctx.lineTo(-5, -12 + bob); ctx.fill();
            ctx.beginPath(); ctx.moveTo(4, -13 + bob); ctx.lineTo(7, -16 + bob); ctx.lineTo(5, -12 + bob); ctx.fill();
        }
    } else {
        ctx.fillStyle = '#4a3a28';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill();
        ctx.fillRect(-5, -11 + bob, 10, 4);
        ctx.fillStyle = '#7a6a4a';
        ctx.fillRect(-5, -12 + bob, 10, 1.5);
    }

    // ── FRONT ARM (Right — holding Longbow) — drawn FIRST ──
    ctx.save();
    let bowArmRot = 0;

    if (isAttacking) {
        bowArmRot = -Math.PI / 2 + 0.2;
    } else {
        bowArmRot = -Math.PI / 4;
    }

    ctx.translate(4, -4 + bob); // Right shoulder
    ctx.rotate(bowArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Heavy fur-trimmed Bracer
    ctx.fillStyle = leatherColor;
    ctx.fillRect(-2, 5, 4, 5);
    ctx.fillStyle = '#7a6a4a';
    ctx.fillRect(-2.5, 5, 5, 1);

    // ── THE BOW (Viking Heavy Longbow) — drawn before hand ──
    ctx.save();
    ctx.translate(0, 11);
    ctx.rotate(-bowArmRot + bowAngle);

    // Shift bow so the wooden grip aligns with the hand
    ctx.translate(-10.5, 0);

    // Thick single piece of Yew
    ctx.strokeStyle = age >= 4 ? '#2a1a0f' : '#4a3018';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Leather wrapped grip
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(10.5, -2, 3, 4);

    if (age >= 4) {
        ctx.globalAlpha = 0.6 + Math.sin(unit.animTimer * 5) * 0.4;
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(8.5, -8, 1, 2);
        ctx.fillRect(8.5, 6, 1, 2);
        ctx.globalAlpha = 1;
    }

    // ── BOWSTRING & ARROW ──
    const bowTopY = -11;
    const bowBotY = 11;
    const bowTopX = 8.5;
    const bowBotX = 8.5;

    const maxPullDist = 14;
    const stringMidX = bowTopX - pullback * maxPullDist;
    const stringMidY = 0;

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
        const arrowLen = 16;

        ctx.save();
        ctx.fillStyle = '#ccaa77';
        ctx.fillRect(stringMidX, -0.5, arrowLen, 1.5);

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(stringMidX + arrowLen, -1.5);
        ctx.lineTo(stringMidX + arrowLen + 3, 0);
        ctx.lineTo(stringMidX + arrowLen, 1.5);
        ctx.fill();

        ctx.fillStyle = '#aa2222';
        ctx.fillRect(stringMidX, -1.5, 3, 3);
        ctx.restore();
    }

    ctx.restore(); // End bow context

    // Hand gripping bow grip
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End Front Arm

    // ── BACK ARM (Left — string draw) — drawn LAST (on top) ──
    ctx.save();
    ctx.translate(-4, -4 + bob); // Left shoulder

    let shoulderRot = 0;
    let elbowBend = 0;
    if (isAttacking) {
        shoulderRot = 0.0 - pullback * 0.4;
        elbowBend = -Math.PI / 4 - pullback * (Math.PI / 2.5);
    } else {
        shoulderRot = 0.1;
        elbowBend = -Math.PI / 5;
    }
    ctx.rotate(shoulderRot);

    // Upper arm
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);

    // Elbow → forearm
    ctx.save();
    ctx.translate(0, 5);
    ctx.rotate(elbowBend);

    // Forearm with leather bracer
    ctx.fillStyle = leatherColor;
    ctx.fillRect(-1.5, 0, 3, 4);
    ctx.fillStyle = '#7a6a4a'; // Fur trim
    ctx.fillRect(-1.5, 0, 3, 0.8);
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 6, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End forearm
    ctx.restore(); // End back arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Viking Archer context
}

// ============================================================
//  DRAW KNIGHT (VIKING) - Norse Heavy Chieftain Cavalry
// ============================================================
export function drawKnight_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (isAttacking) {
        const pullPhase = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        attackProgress = Math.max(0, Math.min(1, pullPhase));
    }

    // Ngựa Viking (Fjord horse - mập, bờm cắt phẳng, màu dun vàng/trắng xám)
    const horseColor = age >= 4 ? '#dcd6ce' : '#c4a67b';
    const horseDark = age >= 4 ? '#aa9f91' : '#947650';

    const hx = -2;
    const hy = 18 + bob;

    const legBob = moving ? Math.sin(unit.animTimer * 18) * 5 : 0;

    // ── HORSE (NGỰA TÚC BỰ PHI TRẦN) ──
    ctx.save();
    ctx.translate(hx, hy);

    const rearing = isAttacking && attackProgress < 0.6 ? -0.15 : 0;
    ctx.rotate(rearing);
    ctx.translate(0, rearing ? -4 : 0);

    // Chân sau
    ctx.fillStyle = horseDark;
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-12 - legBob, 6); ctx.lineTo(-8 - legBob, 8); ctx.lineTo(-5, -8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(10 + legBob * 0.5, 8); ctx.lineTo(14 + legBob * 0.5, 8); ctx.lineTo(12, -8); ctx.fill();

    // Đuôi ngựa (Dày và ngắn)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.quadraticCurveTo(-26 - legBob, -10, -22 - legBob, 6);
    ctx.quadraticCurveTo(-18, -2, -16, -14);
    ctx.fill();

    // Thân ngựa (Cơ bắp nở nang)
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(-18, -12); // mông
    ctx.quadraticCurveTo(-8, -18, 14, -18); // lưng
    ctx.quadraticCurveTo(24, -18, 24, -8); // ngực trước
    ctx.quadraticCurveTo(12, 6, -12, 4); // bụng
    ctx.quadraticCurveTo(-24, 4, -18, -12); // đùi sau
    ctx.fill();

    // Bóng khối 
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.moveTo(24, -8); ctx.quadraticCurveTo(12, 6, -12, 4); ctx.quadraticCurveTo(-8, 0, 18, -12); ctx.fill();

    // Sọc đen dọc sống lưng ngựa (Đặc trưng ngựa Fjord)
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.moveTo(-16, -16); ctx.quadraticCurveTo(-4, -18, 14, -17); ctx.lineTo(14, -15); ctx.quadraticCurveTo(-4, -16, -16, -14); ctx.fill();

    // Cổ và Đầu ngựa
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(14, -15);
    ctx.quadraticCurveTo(20, -26, 18, -34); // gáy
    ctx.lineTo(24, -32); // chỏm tai
    ctx.lineTo(30, -20); // mũi
    ctx.lineTo(22, -10); // cổ dưới
    ctx.fill();

    // Bờm ngựa (Cắt lươn / roached mane hai màu đen trắng)
    ctx.fillStyle = '#eee'; // Viền ngoài
    ctx.beginPath(); ctx.moveTo(14, -15); ctx.lineTo(18, -36); ctx.lineTo(14, -34); ctx.quadraticCurveTo(8, -20, 14, -15); ctx.fill();
    ctx.fillStyle = '#222'; // Dải đen giữa
    ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(18, -35); ctx.lineTo(15, -33); ctx.quadraticCurveTo(10, -20, 15, -15); ctx.fill();

    // ── GIÁP NGỰA (VIKING LEATHER BARDING) ──
    if (age >= 3) {
        // Tấm thảm lót lưng bằng lông thú
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(12, -4); ctx.lineTo(-14, -4); ctx.fill();
        ctx.fillStyle = '#6a5a4a'; ctx.fillRect(-14, -6, 26, 2); // Viền lông xù
        ctx.strokeStyle = cv.accent; ctx.lineWidth = 1; ctx.stroke();

        if (age >= 4) {
            // Bao ngực bằng da thuộc nạm đinh
            ctx.fillStyle = '#3a2010';
            ctx.beginPath(); ctx.moveTo(18, -14); ctx.lineTo(26, -16); ctx.lineTo(24, -6); ctx.lineTo(14, -4); ctx.fill();
            ctx.fillStyle = '#aaa'; ctx.fillRect(20, -12, 1, 1); ctx.fillRect(22, -10, 1, 1); ctx.fillRect(24, -8, 1, 1);

            // Mặt nạ ngựa bằng da/xương
            ctx.fillStyle = '#3a2010';
            ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(30, -20); ctx.lineTo(26, -30); ctx.fill();
        }
    }

    // Chân trước
    ctx.fillStyle = horseColor;
    const stompLift = (isAttacking && attackProgress > 0.1 && attackProgress < 0.8) ? -8 : 0;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 + legBob, 10); ctx.lineTo(-8 + legBob, 12); ctx.lineTo(-6, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(14 - legBob, 12 + stompLift); ctx.lineTo(18 - legBob, 12 + stompLift); ctx.lineTo(18, -6); ctx.fill();
    if (age >= 4) {
        // Lông chân sau (Feathering)
        ctx.fillStyle = '#eee'; ctx.fillRect(-14 + legBob, 6, 4, 3);
        ctx.fillRect(14 - legBob, 8 + stompLift, 4, 3);
    }

    // Dây cương (Da thô)
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(20, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(12, -14); ctx.stroke();

    ctx.restore(); // END HORSE

    // ── RIDER (VIKING CHIEFTAIN/HUSCARL RIDER) ──
    const riderY = hy - 20;
    ctx.save();
    ctx.translate(hx, riderY);
    ctx.rotate(rearing * 0.8);

    // Áo choàng lông gấu sau lưng
    if (age >= 2) {
        ctx.fillStyle = '#3a2515';
        const capeWave = moving ? Math.sin(unit.animTimer * 15) * 5 : 0;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(-14, 6 + capeWave, -16 + capeWave, 18);
        ctx.lineTo(-10 + capeWave, 20);
        ctx.quadraticCurveTo(-6, 8 + capeWave, 0, 4);
        ctx.fill();
        // Viền tuyết/xám
        ctx.fillStyle = '#8a8580'; ctx.fillRect(-14 + capeWave, 16, 4, 4);
    }

    // Tay phải (cầm cương / khiên)
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.skinColor;
    ctx.fillRect(-6, 4, 4, 10);

    // Khiên tròn Bắc Âu lớn bên hông (Bọc mép sắt)
    if (age >= 2) {
        ctx.save();
        ctx.translate(-8, 12);
        const shieldColor = age >= 4 ? cv.bodyDark : cv.accent;
        ctx.fillStyle = shieldColor;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 12, -0.1, 0, Math.PI * 2); ctx.fill();
        // Ván gỗ
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(-3, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, -10); ctx.lineTo(3, 10); ctx.stroke();
        // Boss khiên sắt
        ctx.fillStyle = '#888'; ctx.beginPath(); ctx.ellipse(0, 0, 2, 4, -0.1, 0, Math.PI * 2); ctx.fill();
        // Viền kim loại
        ctx.strokeStyle = age >= 4 ? '#aaa' : '#666'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 11.5, -0.1, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    // Thân người (Chainmail or Leather)
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.bodyMid;
    ctx.fillRect(-5, 0, 10, 14);

    if (age >= 4) {
        // Tấm thắt lưng da rộng có họa tiết thắt bím Runic
        ctx.fillStyle = '#2a1a0a'; ctx.fillRect(-5, 9, 10, 3);
        ctx.fillStyle = '#daa520'; ctx.fillRect(0, 10, 2, 1); // Buckle
        // Hauberk chainmail dài xuống vạt
        ctx.fillStyle = '#7a7a78';
        ctx.fillRect(-5, 12, 10, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (let r = 0; r < 2; r++) {
            ctx.fillRect(-5, 13 + r * 2, 10, 1);
        }
    }

    // Chân & Giày da trói dây
    ctx.fillStyle = '#4a3018'; // Quần len/sợi thô
    ctx.fillRect(-2, 14, 6, 8);
    // Ủng da thú/wraps
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(-2, 18, 6, 6);
    ctx.fillStyle = '#111';
    ctx.fillRect(-2, 22, 1, 3); // Dây buộc chéo
    ctx.fillRect(1, 21, 1, 3);

    // Đầu
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -6, 6, 6); // Mặt & Cổ

    // Râu ria quai nón đặc trưng Viking
    ctx.fillStyle = age >= 3 ? '#bbaa44' : '#aa4422'; // Tóc vàng hoặc đỏ
    ctx.fillRect(-1, -1, 5, 4); // Râu cằm
    ctx.fillRect(-3, -3, 3, 3); // Tóc gáy

    // Mũ bảo hiểm (Spectacle Helmet / Gjermundbu)
    ctx.fillStyle = age >= 4 ? '#888' : '#555';
    ctx.beginPath(); ctx.arc(0, -6, 4.5, Math.PI, 0); ctx.fill(); // Dome tròn
    // Vành nón sắt
    ctx.fillRect(-5, -6, 10, 1.5);
    if (age >= 3) {
        // Kính che nhãn (Ngụy trang Spectacles)
        ctx.fillRect(-2, -5, 5, 2);
        ctx.fillStyle = cv.skinColor; ctx.fillRect(0, -5, 1, 1); // Hở mắt

        if (age >= 4) {
            // Sừng nhỏ hoặc phù điêu sắt chọc chéo (trang trí viễn tưởng)
            ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-6, -14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(3, -9); ctx.lineTo(6, -14); ctx.stroke();
        }
    }

    // Tay trái (cầm Rìu chiến lớn / Dane Axe)
    ctx.save();
    let armRot = 0;
    if (isAttacking) {
        if (attackProgress < 0.4) {
            // Đưa rìu vung ngược ra sau lưng để chặt
            armRot = -Math.PI / 1.5 + (attackProgress * 3);
        } else {
            // Bổ mạnh xuống chéo
            armRot = Math.PI / 2.5;
        }
    } else {
        armRot = moving ? Math.PI / 8 + Math.sin(unit.animTimer * 18) * 0.1 : Math.PI / 4;
    }

    ctx.translate(2, 2);
    ctx.rotate(armRot);

    // Cánh tay & Giáp vai
    if (age >= 3) {
        ctx.fillStyle = '#6a6a68'; // Chainmail sleeve
        ctx.fillRect(-2, 0, 4, 12);
        ctx.fillStyle = '#3a2515'; // Đệm lông thú chỏm vai
        ctx.fillRect(-3, -2, 6, 4);
    } else {
        ctx.fillStyle = cv.skinColor; // Tay trần cơ bắp
        ctx.fillRect(-2, 0, 4, 12);
        ctx.fillStyle = cv.bodyMid;
        ctx.fillRect(-3, -2, 6, 3); // Lót vai vải
    }

    // Vũ khí (Heavy Battle Axe / Dane Axe)
    ctx.translate(0, 10);
    ctx.fillStyle = '#5c3a21'; // Cán gỗ tần bì dài
    ctx.fillRect(-1.5, -4, 3, 26);
    ctx.fillStyle = '#888'; ctx.fillRect(-1.5, -4, 3, 2); // Khuyên sắt bọc đuôi cán

    if (age >= 3) {
        // Lưỡi rìu lớn sắc bén (Bearded Axe)
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath();
        ctx.moveTo(1.5, -1);
        ctx.lineTo(8, -4); // Góc mỏ neo trên
        ctx.quadraticCurveTo(8, 2, 8, 8); // Cạnh chém thẳng dài
        ctx.lineTo(1.5, 4); // Cổ rìu thụt vào dưới
        ctx.fill();

        ctx.fillStyle = '#dddddd';
        ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(8, -4); ctx.quadraticCurveTo(8, 2, 8, 8); ctx.lineTo(6, 4); ctx.fill(); // Lưỡi vát
    } else {
        // Giáo xiên hoặc rìu con
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(4, -2); ctx.lineTo(4, 4); ctx.lineTo(-2, 2); ctx.fill();
    }

    ctx.restore(); // END Tay trái

    ctx.restore(); // END RIDER

    drawKnightsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // END MAIN KNIGHT
}
