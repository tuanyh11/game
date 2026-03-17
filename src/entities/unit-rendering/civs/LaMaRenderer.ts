// ============================================================
//  La Mã (Roman) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";

// ======== LA MÃ SCOUT — Roman Equites (mounted scout with spear) ========
export function drawScout_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) { attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed); }

    let bodyTilt = 0, armRot = 0.1, armOffX = 0, armOffY = 0;
    if (attackState) {
        if (attackProgress < 0.18) {
            const t = attackProgress / 0.18, ease = t * t;
            armRot = 0.1 + (-Math.PI / 1.2 - 0.1) * ease; bodyTilt = -0.12 * ease; armOffY = -5 * ease;
        } else if (attackProgress < 0.4) {
            const t = (attackProgress - 0.18) / 0.22, e = 1 - Math.pow(1 - t, 4);
            armRot = (-Math.PI / 1.2) * (1 - e) + (Math.PI / 2.2) * e;
            bodyTilt = -0.12 * (1 - e) + 0.25 * e; armOffX = 7 * e; armOffY = -5 * (1 - e) + 3 * e;
        } else if (attackProgress < 0.55) {
            const t = (attackProgress - 0.4) / 0.15, sh = Math.sin(t * Math.PI * 6) * 0.04 * (1 - t);
            armRot = (Math.PI / 2.2) + sh; bodyTilt = 0.25 + sh; armOffX = 7 - t * 2; armOffY = 3;
        } else {
            const t = (attackProgress - 0.55) / 0.45, e = t * t * (3 - 2 * t);
            armRot = (Math.PI / 2.2) * (1 - e) + 0.1 * e; bodyTilt = 0.25 * (1 - e);
            armOffX = 5 * (1 - e); armOffY = 3 * (1 - e);
        }
    }
    if (bodyTilt !== 0) { ctx.translate(0, 10 + bob); ctx.rotate(bodyTilt); ctx.translate(0, -(10 + bob)); }

    // Cape
    if (age >= 2) {
        ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid;
        const capeWave = moving ? Math.sin(unit.animTimer * 14) * 2 : 0;
        ctx.fillRect(-8, -2 + bob, 3, 14 + capeWave);
        if (age >= 4) { ctx.fillStyle = cv.secondary; ctx.fillRect(-8, -2 + bob, 3, 1); }
    }

    // Legs
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-4, 9, 3, 7 + legOffset); ctx.fillRect(1, 9, 3, 7 - legOffset);
    ctx.fillStyle = age >= 4 ? '#6a6a68' : '#4a4a48';
    ctx.fillRect(-5, 14 + legOffset, 4, 3); ctx.fillRect(0, 14 - legOffset, 4, 3);

    // Body
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    ctx.fillStyle = age >= 4 ? '#5a4020' : '#4a3020';
    ctx.fillRect(-4, 0 + bob, 2, 9); ctx.fillRect(2, -3 + bob, 2, 8);
    if (age >= 2) { ctx.fillStyle = cv.secondary; ctx.fillRect(-5, 5 + bob, 10, 2); ctx.fillStyle = '#ffd700'; ctx.fillRect(-1, 4 + bob, 2, 3); }
    if (age >= 3) { ctx.fillStyle = cv.bodyLight; for (let i = 0; i < 4; i++) ctx.fillRect(-5 + i * 3, 7 + bob, 2, 3); }
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58'; ctx.fillRect(-7, -4 + bob, 3, 6);
        if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.fillRect(-7, -4 + bob, 3, 1); }
    }

    // Shield
    if (age >= 2) {
        ctx.fillStyle = cv.bodyLight; ctx.beginPath(); ctx.arc(-7, 2 + bob, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = cv.secondary; ctx.beginPath(); ctx.arc(-7, 2 + bob, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Head & helmet
    ctx.fillStyle = cv.skinColor; ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222'; ctx.fillRect(1, -9 + bob, 2, 2);
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58'; ctx.fillRect(-5, -15 + bob, 10, 5); ctx.fillRect(-6, -11 + bob, 2, 4); ctx.fillRect(4, -11 + bob, 2, 4);
        ctx.fillStyle = age >= 4 ? cv.bodyLight : cv.bodyMid; ctx.fillRect(-1, -19 + bob, 2, 5);
        if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.fillRect(-5, -15 + bob, 10, 1); }
    } else { ctx.fillStyle = '#333'; ctx.fillRect(-4, -14 + bob, 8, 3); }

    // ── RIGHT ARM + GLADIUS (Đại Minh style holding) ──
    ctx.save(); ctx.translate(5, -2 + bob); ctx.rotate(armRot); ctx.translate(armOffX, armOffY);
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#6a6a68' : '#5a5a58'; ctx.fillRect(-2, -1, 4, 5);
        if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.fillRect(-2, -1, 4, 1); }
    }
    ctx.fillStyle = cv.skinColor; ctx.fillRect(-1.5, 4, 3, 3);
    ctx.save(); ctx.translate(0, 7); ctx.rotate(0.05);
    // Grip
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1.2, -2, 2.4, 5);
    ctx.fillStyle = '#4a2a10'; ctx.fillRect(-1.2, -1, 2.4, 0.8); ctx.fillRect(-1.2, 1.5, 2.4, 0.8);
    // Pommel
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#6a4a2a';
    ctx.beginPath(); ctx.arc(0, 3, 1.8, 0, Math.PI * 2); ctx.fill();
    // Cross-guard
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#8a6a3a'; ctx.fillRect(-2.5, -3, 5, 1.5);
    // Gladius blade — extends UP from guard (like Đại Minh dao)
    ctx.fillStyle = age >= 4 ? '#e8e8e8' : '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(-1.5, -3); ctx.quadraticCurveTo(-2, -12, -2, -18);
    ctx.lineTo(0, -20);
    ctx.lineTo(2, -18); ctx.quadraticCurveTo(2, -12, 1.5, -3);
    ctx.closePath(); ctx.fill();
    // Center ridge
    ctx.fillStyle = age >= 4 ? '#ddd' : '#aaa'; ctx.fillRect(-0.4, -18, 0.8, 15);
    // Edge highlight
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-1.5, -5); ctx.quadraticCurveTo(-2, -12, -2, -18); ctx.stroke();
    // Slash trail
    if (attackState && attackProgress > 0.18 && attackProgress < 0.55) {
        const a = attackProgress < 0.4 ? 0.5 : 0.5 * (1 - (attackProgress - 0.4) / 0.15);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`; ctx.beginPath();
        ctx.moveTo(-1, -16); ctx.lineTo(-1, -24); ctx.lineTo(1, -24); ctx.lineTo(1, -16); ctx.fill();
    }
    ctx.restore(); ctx.restore();

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 3) { ctx.globalAlpha = 0.15; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-10 - i * 4, -4 + bob + i * 5); ctx.lineTo(-14 - i * 4, -4 + bob + i * 5); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== LA MÃ SWORDSMAN — Legionnaire (Lính lê dương) ========
export function drawSwords_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Dynamic Attack Posture Calculation
    let bodyTilt = 0;
    let rightArmRot = 0.15; // Idle: arm at side, gladius pointing down naturally
    let leftArmRot = 0; // Shield arm
    let swordThrustX = 0;
    let swordThrustY = 0;
    let swordRot = 0.15; // Gladius angle: 0.15 = hangs down, -PI/2 = points forward
    let shieldPush = 0; // Shield forward offset

    if (attackState) {
        if (attackProgress < 0.15) {
            // Phase 1 — SHIELD BASH: Ram shield forward, cock sword back
            const t = attackProgress / 0.15;
            const ease = t * t;
            rightArmRot = 0.15 + (Math.PI / 2.5) * ease; // Arm pulls WAY back
            swordRot = 0.15 + 0.3 * ease; // Sword tilts back too
            leftArmRot = (-Math.PI / 3.5) * ease; // Shield SHOVES forward
            shieldPush = 5 * ease; // Shield physically moves forward
            bodyTilt = -0.15 * ease; // Lean back
            swordThrustX = -4 * ease; // Sword arm pulls back
        } else if (attackProgress < 0.4) {
            // Phase 2 — EXPLOSIVE THRUST: Lunge with gladius pointing straight forward
            const t = (attackProgress - 0.15) / 0.25;
            const easeOut = 1 - Math.pow(1 - t, 4); // Very explosive ease-out
            rightArmRot = (0.15 + Math.PI / 2.5) * (1 - easeOut) + (-Math.PI / 2.5) * easeOut; // Arm SHOOTS forward
            swordRot = 0.45 * (1 - easeOut) + (-Math.PI / 2.5) * easeOut; // Gladius rotates to point FORWARD
            leftArmRot = (-Math.PI / 3.5) * (1 - easeOut) + (Math.PI / 10) * easeOut; // Shield tucks
            shieldPush = 5 * (1 - easeOut) + 2 * easeOut;
            bodyTilt = -0.15 * (1 - easeOut) + 0.3 * easeOut; // BIG forward lean
            swordThrustX = -4 * (1 - easeOut) + 14 * easeOut; // DEEP lunge forward
            swordThrustY = -3 * easeOut; // Stab slightly up
        } else if (attackProgress < 0.55) {
            // Phase 3 — IMPACT HOLD: Sword buried, body fully committed
            const t = (attackProgress - 0.4) / 0.15;
            const shake = Math.sin(t * Math.PI * 6) * 0.05 * (1 - t); // Vibration
            rightArmRot = (-Math.PI / 2.5) + shake;
            swordRot = (-Math.PI / 2.5) + shake;
            leftArmRot = (Math.PI / 10);
            shieldPush = 2;
            bodyTilt = 0.3 + shake;
            swordThrustX = 14 - t * 3; // Slight twist
            swordThrustY = -3;
        } else {
            // Phase 4 — RECOVER: Pull gladius out, return to guard stance
            const t = (attackProgress - 0.55) / 0.45;
            const ease = t * t * (3 - 2 * t); // Smooth step
            rightArmRot = (-Math.PI / 2.5) * (1 - ease) + 0.15 * ease;
            swordRot = (-Math.PI / 2.5) * (1 - ease) + 0.15 * ease;
            leftArmRot = (Math.PI / 10) * (1 - ease);
            shieldPush = 2 * (1 - ease);
            bodyTilt = 0.3 * (1 - ease);
            swordThrustX = 11 * (1 - ease);
            swordThrustY = -3 * (1 - ease);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#c28e67';
    const tunicColor = cv.bodyMid;
    const armorMetal = age >= 3 ? '#999' : '#777';
    const armorBrass = age >= 3 ? '#e6ba17' : '#b28d15';

    // ── LEGS ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-5, 12 + bob, 4, 5 + legOff);
    ctx.fillRect(1, 12 + bob, 4, 5 - legOff);

    // Caligae (Sandals)
    ctx.fillStyle = '#4a2f1d';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-5, 17 + bob + legOff + i * 2, 4, 1);
        ctx.fillRect(1, 17 + bob - legOff + i * 2, 4, 1);
    }
    ctx.fillRect(-3.5, 17 + bob + legOff, 1, 5);
    ctx.fillRect(2.5, 17 + bob - legOff, 1, 5);
    ctx.fillStyle = '#221100';
    ctx.fillRect(-6, 22 + bob + legOff, 6, 2);
    ctx.fillRect(0, 22 + bob - legOff, 6, 2);



    // ── TORSO (Lorica Segmentata) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-7, -5 + bob, 14, 16); // Tunic core

    // Pteruges (Leather strips)
    ctx.fillStyle = '#4a2f1d';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-6 + i * 3, 10 + bob, 2, 4);
    }

    // Plate armor bounds
    ctx.fillStyle = armorMetal;
    ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
        const yOffset = -3 + bob + i * 2.5;
        ctx.beginPath();
        ctx.moveTo(-7, yOffset);
        ctx.quadraticCurveTo(0, yOffset + 0.5, 7, yOffset);
        ctx.lineTo(6.5, yOffset + 2);
        ctx.quadraticCurveTo(0, yOffset + 2.5, -6.5, yOffset + 2);
        ctx.fill(); ctx.stroke();
    }

    // Brass hinges
    ctx.fillStyle = armorBrass;
    ctx.fillRect(-3, -4 + bob, 1.5, 12);
    ctx.fillRect(1.5, -4 + bob, 1.5, 12);

    // Belt
    ctx.fillStyle = '#221100';
    ctx.fillRect(-7, 7 + bob, 14, 2.5);
    ctx.fillStyle = armorBrass;
    ctx.fillRect(-2, 7 + bob, 4, 2.5); // Buckle
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-4 + i * 4, 9.5 + bob, 1, 4); // Groin apron studs
    }

    // ── FRONT/SWORD ARM (Right Arm holding Gladius) ──
    ctx.save();
    ctx.translate(5, -2 + bob);
    ctx.rotate(rightArmRot);
    ctx.translate(swordThrustX, swordThrustY);

    // Upper arm (tunic sleeve)
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Forearm (skin)
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1.5, 5, 3, 5);

    // Gladius — BLADE extends DOWN from hand (positive Y = away from arm)
    // When arm rotates forward for thrust, blade tip leads toward enemy
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(swordRot); // Dynamic angle!

    // Hand gripping
    ctx.fillStyle = skinColor;
    ctx.fillRect(-2, -2, 4, 4);

    // Pommel (above hand, toward arm)
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#6a4a2a';
    ctx.beginPath(); ctx.arc(0, -6, 2, 0, Math.PI * 2); ctx.fill();

    // Grip (between pommel and guard)
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-1.5, -5, 3, 6);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(-1.5, -4, 3, 1);
    ctx.fillRect(-1.5, -1, 3, 1);

    // Guard (at hand level)
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#8a6a3a';
    ctx.fillRect(-3.5, 1, 7, 2);

    // Blade (extends DOWN — positive Y — leaf-shaped Gladius)
    ctx.fillStyle = age >= 4 ? '#e8e8e8' : '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(-2, 3);        // Left base at guard
    ctx.lineTo(-2.5, 10);     // Widen
    ctx.lineTo(-2, 16);       // Narrow
    ctx.lineTo(0, 20);        // TIP (pointing away from body!)
    ctx.lineTo(2, 16);        // Right narrow
    ctx.lineTo(2.5, 10);      // Right widen
    ctx.lineTo(2, 3);         // Right base
    ctx.closePath();
    ctx.fill();

    // Center ridge
    ctx.fillStyle = age >= 4 ? '#ddd' : '#aaa';
    ctx.fillRect(-0.5, 4, 1, 15);

    // Edge highlights
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2.5, 6, 0.5, 8);
    ctx.fillRect(2, 6, 0.5, 8);

    // Blood groove
    ctx.fillStyle = age >= 4 ? '#bbb' : '#999';
    ctx.fillRect(-1, 5, 0.5, 10);
    ctx.fillRect(0.5, 5, 0.5, 10);

    // Thrust trail + impact effect
    if (attackState && attackProgress > 0.15 && attackProgress < 0.55) {
        const trailAlpha = attackProgress < 0.4 ? 0.6 : 0.6 * (1 - (attackProgress - 0.4) / 0.15);
        // Speed lines extending from blade tip
        ctx.strokeStyle = `rgba(255, 255, 255, ${trailAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-1, 20); ctx.lineTo(-1, 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(1, 20); ctx.lineTo(1, 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 30); ctx.stroke();
        // Impact spark at tip
        if (attackProgress > 0.35 && attackProgress < 0.52) {
            const sparkSize = 4 + Math.random() * 2;
            ctx.fillStyle = `rgba(255, 220, 100, ${trailAlpha})`;
            ctx.beginPath(); ctx.arc(0, 22, sparkSize, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 200, ${trailAlpha * 0.8})`;
            ctx.beginPath(); ctx.arc(0, 22, sparkSize * 0.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.restore(); // Gladius sub-transform
    ctx.restore(); // Sword arm transform

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3.5, -12 + bob, 7, 7);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1.5, -10 + bob, 1, 1);
    ctx.fillRect(0.5, -10 + bob, 1, 1);

    if (age >= 2) {
        ctx.fillStyle = age >= 3 ? armorMetal : '#a67d3d'; // Iron vs Bronze
        ctx.beginPath(); ctx.arc(0, -12 + bob, 5, Math.PI, Math.PI * 2); ctx.fill(); // Dome
        ctx.fillRect(-6, -12 + bob, 12, 1.5); // Visor rim
        ctx.fillStyle = armorBrass;
        ctx.fillRect(-6, -13 + bob, 12, 1);

        ctx.fillStyle = age >= 3 ? armorMetal : '#a67d3d';
        ctx.fillRect(-5, -11 + bob, 2, 4); // Cheek guard L
        ctx.fillRect(3, -11 + bob, 2, 4);  // Cheek guard R
        ctx.fillRect(-6, -11 + bob, 12, 1.5); // Neck guard flare

        // Crest for age 4
        if (age >= 4) {
            ctx.fillStyle = cv.bodyLight;
            ctx.beginPath();
            ctx.moveTo(-3, -17 + bob);
            ctx.lineTo(3, -17 + bob);
            ctx.lineTo(5, -24 + bob);
            ctx.lineTo(-5, -24 + bob);
            ctx.fill();
        }
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(-4, -14 + bob, 8, 3);
    }

    // ── FRONT ARM & SHIELD (Scutum) ──
    ctx.save();
    ctx.translate(-5 - shieldPush, -1 + bob); // shieldPush moves shield forward
    ctx.rotate(leftArmRot);

    // Front arm (Bicep/Forearm hiding behind shield mostly)
    ctx.fillStyle = tunicColor; ctx.fillRect(-2, 0, 4, 5);

    // Complete Scutum Shield Redesign
    ctx.translate(-2, 3);
    const shieldW = 9;
    const shieldH = age >= 3 ? 22 : 18;

    ctx.fillStyle = armorBrass;
    ctx.beginPath(); ctx.roundRect(-shieldW / 2 - 1, -shieldH / 2 - 1, shieldW + 2, shieldH + 2, 1); ctx.fill();

    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath(); ctx.roundRect(-shieldW / 2, -shieldH / 2, shieldW, shieldH, 1); ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(shieldW / 2 - 3, -shieldH / 2, 3, shieldH);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-shieldW / 2, -shieldH / 2, 2, shieldH);

    if (age >= 3) {
        // Boss
        ctx.fillStyle = armorMetal;
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = armorBrass;
        ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();

        // Wing/Lightning Decals
        ctx.fillStyle = '#daa520';
        ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(-3, -8); ctx.lineTo(-1, -5); ctx.fill(); // Top Left
        ctx.beginPath(); ctx.moveTo(1, -4); ctx.lineTo(3, -8); ctx.lineTo(1, -5); ctx.fill();   // Top Right
        ctx.beginPath(); ctx.moveTo(-1, 4); ctx.lineTo(-2, 8); ctx.lineTo(-1, 5); ctx.fill();   // Bot Left
        ctx.beginPath(); ctx.moveTo(1, 4); ctx.lineTo(2, 8); ctx.lineTo(1, 5); ctx.fill();     // Bot Right
    } else {
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (LA MA) - Triarii (Heavy Thrusting Spear)
// ============================================================
export function drawSpears_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();

    // Attack animation parameters (Straight, powerful underhand thrust)
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
    const armorMetal = age >= 4 ? cv.bodyDark : cv.bodyMid; // Replaced static gray with player colors
    const armorBrass = age >= 3 ? '#b89947' : '#907a4a';
    const tunicColor = cv.bodyDark;
    const skin = cv.skinColor;
    const leather = '#4a2e15';


    // ── LEGS ──
    // Leg coloring (Sandals + greaves)
    ctx.fillStyle = skin;
    ctx.fillRect(-4, 6, 3, 6 + legOff);
    ctx.fillRect(1, 6, 3, 6 - legOff);

    // Bronze Greaves (Ocreae) for Triarii
    if (age >= 2) {
        ctx.fillStyle = armorBrass;
        ctx.fillRect(-4.5, 8 + Math.max(0, legOff), 4, 5);
        ctx.fillRect(0.5, 8 + Math.max(0, -legOff), 4, 5);
    }
    // Sandal straps
    ctx.fillStyle = leather;
    ctx.fillRect(-4, 11 + legOff, 3, 1);
    ctx.fillRect(1, 11 - legOff, 3, 1);

    // ── BODY (Torso) ──
    // Red Wool Tunic Base
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-5, -6 + bob, 10, 14);

    // Chainmail (Lorica Hamata)
    if (age >= 2) {
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-5, -6 + bob, 10, 11);

        ctx.fillStyle = 'rgba(255,255,255,0.1)'; // Mail texture
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 3; c++) {
                ctx.beginPath(); ctx.arc(-3 + c * 3 + (r % 2), -4 + bob + r * 2.2, 1, 0, Math.PI); ctx.fill();
            }
        }
    }

    // Pteruges (Leather skirt strips)
    ctx.fillStyle = '#6a4020';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-4.5 + i * 3, 5 + bob, 2, 4);
    }

    // Belt (Cingulum)
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-5, 4 + bob, 10, 2);
    ctx.fillStyle = '#daa520'; // Medallions
    for (let i = -1; i <= 1; i++) ctx.fillRect(-0.5 + i * 3, 4.5 + bob, 1, 1);

    // ── HEAD & HELMET ──
    ctx.fillStyle = skin;
    ctx.fillRect(-3, -13 + bob, 6, 7);

    if (age >= 2) {
        // Montefortino / Coolus Helm
        ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid; // Use player color for helmets
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill(); // Dome
        ctx.fillRect(-5, -11 + bob, 10, 1.5); // Rim

        // Cheek guards
        ctx.fillRect(-4.5, -9.5 + bob, 2.5, 4);
        ctx.fillRect(2, -9.5 + bob, 2.5, 4);
        ctx.fillStyle = skin; // Skin peeking
        ctx.fillRect(-3.5, -9 + bob, 1.5, 2);

        if (age >= 3) {
            // Longitudinal Crest (Front-to-back, less prominent than centurion/swordsman)
            // Stiff crest holder
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(-1, -14 + bob, 2, 3);

            // Horsehair plume sweeping back slightly
            ctx.fillStyle = (age === 4) ? '#111' : cv.bodyMid; // Elite gets black plume
            ctx.beginPath();
            ctx.moveTo(-1.5, -14 + bob);
            ctx.lineTo(1.5, -14 + bob);
            ctx.lineTo(4, -18 + bob);
            ctx.lineTo(-2, -18 + bob);
            ctx.fill();
        }
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(-4, -14 + bob, 8, 3);
    }

    // ── LEFT ARM (L-shape) — drawn on top of body ──
    ctx.save();
    ctx.translate(-5, -5 + bob);
    ctx.rotate(0.8 + leftArmRot);
    ctx.fillStyle = age >= 3 ? armorMetal : tunicColor;
    ctx.fillRect(-2, 0, 4, 3);
    ctx.fillStyle = skin;
    ctx.fillRect(-2, 3, 4, 3);
    if (age >= 2) { ctx.fillStyle = leather; ctx.fillRect(-2, 3, 4, 3); }
    ctx.fillRect(0, 4, 5, 4);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(5, 6, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── RIGHT ARM (straight down to spear) — drawn on top of body ──
    ctx.save();
    ctx.translate(6, -5 + bob);
    ctx.rotate(-0.5 + rightArmRot);
    ctx.fillStyle = age >= 3 ? armorMetal : tunicColor;
    ctx.fillRect(-1.5, 0, 3, 4);
    ctx.fillStyle = skin;
    ctx.fillRect(-1.5, 4, 3, 5);
    if (age >= 2) { ctx.fillStyle = leather; ctx.fillRect(-1.5, 5, 3, 3); }
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── HASTA (Spear) — drawn on top of body ──
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    ctx.translate(0, 4 + bob);
    ctx.rotate(spearAngle);
    ctx.fillStyle = '#3a2010';
    const poleLength = age >= 3 ? 34 : 28;
    ctx.fillRect(-poleLength * 0.4, -1, poleLength, 2);
    ctx.fillStyle = '#555555';
    ctx.beginPath(); ctx.moveTo(-poleLength * 0.4, -1); ctx.lineTo(-poleLength * 0.4 - 3, 0); ctx.lineTo(-poleLength * 0.4, 1); ctx.fill();
    const tipBase = poleLength * 0.6;
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#bbbbbb';
    ctx.fillRect(tipBase, -1.5, 3, 3);
    ctx.beginPath(); ctx.moveTo(tipBase + 3, 0); ctx.quadraticCurveTo(tipBase + 6, -3, tipBase + 12, 0); ctx.quadraticCurveTo(tipBase + 6, 3, tipBase + 3, 0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(tipBase + 4, -0.5, 6, 1);
    ctx.restore();

    // ── FRONT ARM & SHIELD (Scutum) ──
    ctx.save();
    ctx.translate(-3, -2 + bob);
    // Arm rotates slightly opposite body for balance
    ctx.rotate(leftArmRot);

    // Complete Scutum Shield (Roman Tower Shield)
    // Braced against the body/leg, facing forward
    ctx.translate(-2, 4);
    const shieldW = 9;
    const shieldH = age >= 3 ? 20 : 16;

    // Rim
    ctx.fillStyle = armorBrass;
    ctx.beginPath(); ctx.roundRect(-shieldW / 2 - 1, -shieldH / 2 - 1, shieldW + 2, shieldH + 2, 1); ctx.fill();

    // Body (Deep Red)
    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath(); ctx.roundRect(-shieldW / 2, -shieldH / 2, shieldW, shieldH, 1); ctx.fill();

    // Curve shading (It's a cylinder section)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(shieldW / 2 - 3, -shieldH / 2, 3, shieldH);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-shieldW / 2, -shieldH / 2, 2, shieldH);

    if (age >= 3) {
        // Boss (Umbone)
        ctx.fillStyle = armorMetal;
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = armorBrass;
        ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();

        // Simple Triarii Wing/Laurel Decals
        ctx.fillStyle = '#daa520';
        // Laurel wreaths
        ctx.lineWidth = 1; ctx.strokeStyle = '#daa520';
        ctx.beginPath(); ctx.arc(0, -6, 2, Math.PI * 0.7, Math.PI * 2.3); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 6, 2, Math.PI * 0.7, Math.PI * 2.3); ctx.stroke();
    } else {
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    }

    // ctx.restore(); // Shield & Arm

    ctx.restore(); // Shield & Arm

    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Triarii context
}

// ============================================================
//  DRAW ARCHER (LA MÃ) - Roman Sagittarius (Auxiliary Archer)
// ============================================================
export function drawArchers_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
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
            // Drawing the bow
            pullback = (pullPhase - 0.3) / 0.6;
        } else if (pullPhase >= 0.9) {
            // Holding at full draw just before release
            pullback = 1;
        } else {
            // Just released or recovering
            pullback = 0;
        }
    }

    // Body rotation based on action
    let bodyRot = 0;
    if (isAttacking) {
        bodyRot = -0.1 + pullback * 0.2; // Lean into the shot slightly
        bowAngle = -0.1 + pullback * 0.1;
    } else {
        bodyRot = Math.sin(unit.animTimer * 2) * 0.05; // Idle breathing
        bowAngle = 0.2; // Bow resting somewhat forward
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = cv.bodyMid;
    const armorMetal = age >= 3 ? '#5a5a58' : '#777'; // Chainmail (Lorica Hamata)
    const leatherColor = '#6a4020';
    const brassColor = '#daa520';

    // ── QUIVER (Corytos - Roman cylindrical quiver worn on back/hip) ──
    ctx.save();
    ctx.translate(-8, -2 + bob);
    ctx.rotate(0.2); // Slanted across back
    ctx.fillStyle = '#8B5E3C'; // Stiff leather
    ctx.fillRect(-2, -6, 4, 14);
    ctx.fillStyle = brassColor; // Brass cap and base
    ctx.fillRect(-2.5, -6, 5, 2);
    ctx.fillRect(-2, 6, 4, 2);
    // Arrows in quiver
    ctx.fillStyle = cv.bodyMid; // Team-colored fletching
    ctx.fillRect(-1, -9, 2, 3);
    ctx.fillRect(1, -8, 1, 2);
    ctx.restore();

    // ── LEGS ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-5, 6, 4, 7 + legOff);
    ctx.fillRect(1, 6, 4, 7 - legOff);

    // Caligae (Roman sandals)
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-5.5, 12 + legOff, 5, 2);
    ctx.fillRect(0.5, 12 - legOff, 5, 2);
    ctx.fillStyle = leatherColor; // Straps
    ctx.fillRect(-5, 9 + legOff, 4, 1); ctx.fillRect(-5, 11 + legOff, 4, 1);
    ctx.fillRect(1, 9 - legOff, 4, 1); ctx.fillRect(1, 11 - legOff, 4, 1);

    // ── BODY (Tunic & Lorica Hamata) ──
    // Red tunic skirt
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    if (age >= 2) {
        // Chainmail body
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-6, -5 + bob, 12, 11);

        // Mail rings texture
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.beginPath(); ctx.arc(-4 + c * 3 + (r % 2), -3 + bob + r * 2.5, 1, 0, Math.PI); ctx.fill();
            }
        }
    } else {
        // Leather jerkin
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(-6, -4 + bob, 12, 10);
    }

    // Cingulum (Military Belt)
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-6, 5 + bob, 12, 2);
    ctx.fillStyle = brassColor; // Brass buckle
    ctx.fillRect(-1, 5 + bob, 2, 2);

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -13 + bob, 6, 9); // Neck/Face

    // Close cropped hair/beard common for Romans
    ctx.fillStyle = '#111';
    ctx.fillRect(-3, -14 + bob, 6, 2); // Hair
    ctx.fillRect(-3, -7 + bob, 6, 1.5); // Stubble

    if (age >= 3) {
        // Simple Infantry Helmet (Coolus/Galea without crest)
        ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid; // Use player color for helmets
        ctx.beginPath(); ctx.arc(0, -12 + bob, 4.5, Math.PI, 0); ctx.fill(); // Dome
        ctx.fillRect(-5, -12 + bob, 10, 1.5); // Rim
        ctx.fillRect(-6, -11 + bob, 12, 1); // Neck guard

        // Cheek guards
        ctx.beginPath(); ctx.moveTo(-4.5, -10 + bob); ctx.lineTo(-2.5, -5 + bob); ctx.lineTo(-4.5, -5 + bob); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4.5, -10 + bob); ctx.lineTo(2.5, -5 + bob); ctx.lineTo(4.5, -5 + bob); ctx.fill();
    } else {
        // Phrygian leather cap / barehead
        ctx.fillStyle = leatherColor;
        ctx.beginPath();
        ctx.arc(0, -12 + bob, 4, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-2, -15 + bob); ctx.quadraticCurveTo(4, -19 + bob, 5, -15 + bob); ctx.lineTo(2, -12 + bob); ctx.fill();
    }

    // ── FRONT ARM (Right — holding bow) — drawn FIRST ──
    ctx.save();
    let bowArmRot = 0;

    if (isAttacking) {
        bowArmRot = -Math.PI / 2 + 0.2; // Pointing forward toward target
    } else {
        bowArmRot = -Math.PI / 6; // Relaxed
    }

    ctx.translate(4, -4 + bob); // Right shoulder
    ctx.rotate(bowArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Bracer
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-2, 5, 4, 5);
    if (age >= 3) {
        ctx.fillStyle = brassColor;
        ctx.fillRect(-2, 6, 4, 1);
        ctx.fillRect(-2, 9, 4, 1);
    }

    // ── THE BOW (Roman Composite Bow) — drawn before hand ──
    ctx.save();
    ctx.translate(0, 11); // Move to hand position
    ctx.rotate(-bowArmRot + bowAngle); // Adjust bow relative to world

    // Draw the bow stave
    ctx.strokeStyle = age >= 4 ? '#b8860b' : '#8B5E3C'; // Golden/Bronze or Wood
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -5, 6, Math.PI * 0.6, Math.PI * 1.5, true); // Upper limb
    ctx.arc(0, 5, 6, Math.PI * 0.5, Math.PI * 1.4, false); // Lower limb
    ctx.stroke();

    // Brass grip
    ctx.fillStyle = brassColor;
    ctx.fillRect(-1.5, -2, 3, 4);

    // Bow bone tips (Siyahs)
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath(); ctx.arc(1.5, -11, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.5, 11, 1.5, 0, Math.PI * 2); ctx.fill();

    // ── BOWSTRING & ARROW ──
    const bowTopY = -11;
    const bowBotY = 11;
    const bowTopX = 1.5;
    const bowBotX = 1.5;

    const maxPullDist = 12;
    const stringMidX = bowTopX - pullback * maxPullDist;
    const stringMidY = 0;

    // Draw String
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bowTopX, bowTopY);
    ctx.lineTo(stringMidX, stringMidY);
    ctx.lineTo(bowBotX, bowBotY);
    ctx.stroke();

    // Draw Arrow
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        const arrowLen = 14;

        ctx.save();
        ctx.fillStyle = age >= 4 ? '#ddc060' : '#bb9966';
        ctx.fillRect(stringMidX, -0.5, arrowLen, 1);

        ctx.fillStyle = '#aaaaaa';
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

    // Hand gripping the bow grip (on top of brass grip)
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
    if (age >= 3) {
        ctx.fillStyle = brassColor;
        ctx.fillRect(-1.5, 1, 3, 0.5);
        ctx.fillRect(-1.5, 3, 3, 0.5);
    }
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 6, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End forearm
    ctx.restore(); // End back arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Archer context
}

// ============================================================
//  DRAW KNIGHT (LA MÃ) - Roman Cavalry (Equites / Cataphract)
// ============================================================
export function drawKnight_LaMa(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    // Khung hình kỵ binh (scale để vừa vặn)
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (isAttacking) {
        const pullPhase = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        attackProgress = Math.max(0, Math.min(1, pullPhase));
    }

    // Ngựa La Mã (Ngựa xám/trắng)
    const horseColor = age >= 4 ? '#d8d4c8' : '#a8a498';
    const horseDark = age >= 4 ? '#989488' : '#7a7668';

    const hx = -2;
    const hy = 18 + bob; // Vị trí gốc của ngựa

    // Chuyển động chân ngựa
    const legBob = moving ? Math.sin(unit.animTimer * 18) * 5 : 0;

    // ── HORSE (NGỰA) ──
    ctx.save();
    ctx.translate(hx, hy);

    // Ngựa chồm lên khi tấn công
    const rearing = isAttacking && attackProgress < 0.6 ? -0.15 : 0;
    ctx.rotate(rearing);
    ctx.translate(0, rearing ? -4 : 0);

    // Chân sau (Back legs)
    ctx.fillStyle = horseDark;
    // Chân sau bên khuất
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-12 - legBob, 6); ctx.lineTo(-8 - legBob, 8); ctx.lineTo(-5, -8); ctx.fill();
    // Chân trước bên khuất
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(10 + legBob * 0.5, 8); ctx.lineTo(14 + legBob * 0.5, 8); ctx.lineTo(12, -8); ctx.fill();

    // Đuôi ngựa
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.quadraticCurveTo(-30 - legBob, -10, -26 - legBob, 6);
    ctx.quadraticCurveTo(-20, -2, -16, -14);
    ctx.fill();

    // Thân ngựa (Cơ bắp mạnh mẽ)
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(-18, -12); // mông
    ctx.quadraticCurveTo(-8, -18, 14, -18); // lưng
    ctx.quadraticCurveTo(24, -18, 24, -8); // ngực trước
    ctx.quadraticCurveTo(12, 6, -12, 4); // bụng
    ctx.quadraticCurveTo(-24, 4, -18, -12); // đùi sau
    ctx.fill();

    // Bóng khối dưới bụng ngựa
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(24, -8); ctx.quadraticCurveTo(12, 6, -12, 4); ctx.quadraticCurveTo(-8, 0, 18, -12); ctx.fill();

    // Cổ và Đầu ngựa
    ctx.beginPath();
    ctx.moveTo(14, -15);
    ctx.quadraticCurveTo(20, -26, 18, -34); // gáy
    ctx.lineTo(24, -32); // chỏm tai
    ctx.lineTo(30, -20); // mũi
    ctx.lineTo(22, -10); // cổ dưới
    ctx.fill();

    // Bờm ngựa
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath();
    ctx.moveTo(14, -15); ctx.lineTo(18, -34); ctx.lineTo(14, -32);
    ctx.quadraticCurveTo(8, -20, 14, -15); ctx.fill();

    // ── GIÁP NGỰA (ROMAN BARDING) ──
    if (age >= 3) {
        // Tấm thảm lót lưng đỏ (Trapper)
        ctx.fillStyle = '#8b0000';
        ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(12, -4); ctx.lineTo(-14, -4); ctx.fill();
        ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1; ctx.stroke(); // Viền vàng

        if (age >= 4) {
            // Giáp vảy Cataphract (Lorica Squamata che kín ngựa)
            ctx.fillStyle = '#7a7a78';
            ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(18, -14); ctx.lineTo(14, 0); ctx.lineTo(-18, 0); ctx.fill();

            // Vẽ vân vảy
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 8; c++) {
                    ctx.beginPath(); ctx.arc(-16 + c * 4 + (r % 2) * 2, -14 + r * 3, 2, 0, Math.PI); ctx.fill();
                }
            }

            // Giáp cổ (Crinet)
            ctx.fillStyle = '#7a7a78';
            ctx.beginPath(); ctx.moveTo(14, -18); ctx.lineTo(18, -32); ctx.lineTo(22, -18); ctx.fill();

            // Mặt nạ sắt ngựa (Chanfron)
            ctx.fillStyle = '#6a6a68';
            ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(30, -20); ctx.lineTo(26, -30); ctx.fill();
            ctx.fillStyle = '#daa520'; ctx.fillRect(27, -26, 2, 2); // Nút rốn bằng vàng
        }
    }

    // Chân trước (Màu sáng hơn vì ở gần người xem)
    ctx.fillStyle = horseColor;
    const stompLift = (isAttacking && attackProgress > 0.1 && attackProgress < 0.8) ? -8 : 0;
    // Chân sau bên ngoài (trái sau)
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 + legBob, 10); ctx.lineTo(-8 + legBob, 12); ctx.lineTo(-6, -4); ctx.fill();
    // Chân trước bên ngoài (phải trước)
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(14 - legBob, 12 + stompLift); ctx.lineTo(18 - legBob, 12 + stompLift); ctx.lineTo(18, -6); ctx.fill();

    // Dây cương
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(20, -32); ctx.stroke(); // Dây má
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(12, -14); ctx.stroke(); // Dây cầm cương

    ctx.restore(); // END HORSE

    // ── RIDER (ROMAN EQUITES/CATAPHRACT) ──
    const riderY = hy - 20; // Ngồi trên lưng ngựa
    ctx.save();
    ctx.translate(hx, riderY);
    ctx.rotate(rearing * 0.8); // Người ngả theo ngựa
    
    // Áo choàng đỏ (Cape) tung bay
    if (age >= 2) {
        ctx.fillStyle = '#aa1111';
        ctx.beginPath();
        const capeWave = moving ? Math.sin(unit.animTimer * 15) * 6 : 0;
        ctx.moveTo(-4, 4);
        ctx.quadraticCurveTo(-14, 10 + capeWave, -16 + capeWave, 20);
        ctx.lineTo(-8 + capeWave, 22);
        ctx.quadraticCurveTo(-6, 10 + capeWave, 0, 4);
        ctx.fill();
    }

    // Tay phải (cầm khiên hoặc dây cương ẩn qua thân)
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.skinColor;
    ctx.fillRect(-6, 4, 4, 10);

    // Khiên nghiêng che hông (Parma/Scutum nhỏ)
    if (age >= 2) {
        ctx.fillStyle = cv.bodyMid; // Màu người chơi
        ctx.beginPath(); ctx.ellipse(-6, 12, 4, 8, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#daa520';
        ctx.beginPath(); ctx.ellipse(-6, 12, 1, 3, -0.2, 0, Math.PI * 2); ctx.fill(); // Núm khiên
        ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(-6, 12, 3.5, 7.5, -0.2, 0, Math.PI * 2); ctx.stroke();
    }

    // Thân người (Torso)
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.bodyMid; // Giáp hoặc Áo xít
    ctx.fillRect(-5, 0, 10, 14);

    if (age >= 4) {
        // Lorica Segmentata (Giáp phiến ngang)
        ctx.fillStyle = cv.bodyDark;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-6, 2 + i * 2.5, 12, 1.5);
            ctx.fillStyle = cv.bodyMid; ctx.fillRect(-6, 2 + i * 2.5, 12, 0.5); // Highlight
            ctx.fillStyle = cv.bodyDark;
        }
    } else if (age >= 3) {
        // Lorica Hamata (Giáp xích)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-5, 0, 10, 14);
    }

    // Chân & Giày cưỡi ngựa (Caligae)
    ctx.fillStyle = cv.bodyDark; // Quần / Tunic
    ctx.fillRect(-2, 14, 6, 8);
    ctx.fillStyle = '#4a2a10'; // Giày da
    ctx.fillRect(0, 20, 6, 4);
    ctx.fillRect(-2, 22, 2, 2); // Gót


    // Đầu
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -6, 6, 6); // Mặt / Cổ

    // Mũ bảo hiểm (Galea)
    ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid;
    ctx.beginPath(); ctx.arc(0, -6, 5, Math.PI, 0); ctx.fill(); // Chóp mũ
    ctx.fillRect(-6, -6, 12, 2); // Vành mũ rủ nghiêng
    ctx.fillRect(-5, -4, 3, 5); // Ốp má (Cheek guard)

    if (age >= 3) {
        // Lông mào đỏ mọc dọc (Transverse/Sagittal Crest)
        ctx.fillStyle = '#dd2222';
        ctx.fillRect(-2, -16, 4, 6);
        ctx.beginPath(); ctx.arc(0, -16, 5, Math.PI, 0); ctx.fill(); // Lông chải ngược
    }

    // Tay trái (cầm vũ khí vung lên)
    ctx.save();
    let armRot = 0;
    if (isAttacking) {
        if (attackProgress < 0.4) {
            // Đưa vũ khí ra sau chuẩn bị đâm/chém
            armRot = -Math.PI / 2 + (attackProgress * 2);
        } else {
            // Lao mạnh vũ khí tới trước
            armRot = Math.PI / 3;
        }
    } else {
        // Tầm cầm nghiêng nhẹ lúc cưỡi
        armRot = moving ? Math.PI / 8 + Math.sin(unit.animTimer * 18) * 0.1 : Math.PI / 10;
    }

    ctx.translate(2, 2); // Điểm xoay vai
    ctx.rotate(armRot);

    // Giáp vai
    if (age >= 4) {
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-3, -2, 6, 6);
        ctx.fillStyle = '#999'; ctx.fillRect(-3, -2, 6, 1);
    } else if (age >= 3) {
        ctx.fillStyle = '#5a5a58'; ctx.fillRect(-3, -2, 6, 4);
    }

    // Cánh tay
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-2, 0, 4, 12);

    // Vũ khí (Kiếm Spatha hoặc Giáo)
    ctx.translate(0, 10);
    if (age >= 3) {
        // Kiếm dài La Mã (Roman Spatha) vung chém
        ctx.fillStyle = '#3a1a05'; ctx.fillRect(-1.5, -2, 3, 4); // Cán
        ctx.fillStyle = '#daa520'; ctx.fillRect(-4, 2, 8, 1); // Quai bảo vệ bằng đồng
        ctx.beginPath(); ctx.arc(0, -4, 2, 0, Math.PI * 2); ctx.fill(); // Chuôi

        // Lưỡi kiếm
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(2, 3); ctx.lineTo(0, 24); ctx.fill();
        ctx.fillStyle = '#dddddd'; // Vát khối
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(2, 3); ctx.lineTo(0, 24); ctx.fill();
    } else {
        // Giáo cưỡi ngựa đơn giản (Contus nhẹ)
        ctx.fillStyle = '#5c3a21'; ctx.fillRect(-1, -12, 2, 32);
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(-3, 20); ctx.lineTo(3, 20); ctx.lineTo(0, 28); ctx.fill();
    }

    ctx.restore(); // END Tay trái

    ctx.restore(); // END RIDER

    drawKnightsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // END MAIN KNIGHT
}
