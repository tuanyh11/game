// ============================================================
//  Đại Minh (Ming Dynasty) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";
// ======== ĐẠI MINH SCOUT — 明朝 Khinh Kỵ (Ming Light Cavalry) ========
export function drawScout_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
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

    // ── LAYER 1: BACK BANNER (背旗) ──
    if (age >= 3) {
        const wave = moving ? Math.sin(unit.animTimer * 10) * 2 : 0;
        ctx.fillStyle = '#5a4020'; ctx.fillRect(-6, -22 + bob, 2, 28);
        if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(-5, -25 + bob); ctx.lineTo(-7, -22 + bob); ctx.lineTo(-3, -22 + bob); ctx.closePath(); ctx.fill(); }
        const bW = age >= 4 ? 8 : 6, bH = age >= 4 ? 13 : 10;
        ctx.fillStyle = age >= 4 ? '#cc1111' : '#aa2222'; ctx.fillRect(-6 - bW, -21 + bob + wave, bW, bH);
        ctx.fillStyle = '#ffd700'; ctx.fillRect(-6 - bW, -21 + bob + wave, bW, 1); ctx.fillRect(-6 - bW, -21 + bob + wave + bH - 1, bW, 1); ctx.fillRect(-6 - bW, -21 + bob + wave, 1, bH);
        ctx.fillStyle = '#ffd700';
        if (age >= 4) {
            ctx.fillRect(-12, -17 + bob + wave, 4, 1); ctx.fillRect(-11, -18 + bob + wave, 2, 5); ctx.fillRect(-13, -15 + bob + wave, 1, 3); ctx.fillRect(-9, -15 + bob + wave, 1, 3);
        } else { ctx.fillRect(-10, -17 + bob + wave, 3, 3); }
    }

    // ── LEGS ──
    ctx.fillStyle = age >= 3 ? '#4a3028' : age >= 2 ? '#5a4a38' : '#7a6a50';
    ctx.fillRect(-4, 9, 3, 7 + legOffset); ctx.fillRect(1, 9, 3, 7 - legOffset);
    ctx.fillStyle = age >= 3 ? '#2a2018' : '#4a3a28';
    ctx.fillRect(-5, 14 + legOffset, 4, 3); ctx.fillRect(0, 14 - legOffset, 4, 3);

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

    // Left shoulder only
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#8a1111' : '#883322'; ctx.fillRect(-8, -4 + bob, 3, 6);
        if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.fillRect(-8, -4 + bob, 3, 1); }
    }

    // ── HEAD ──
    ctx.fillStyle = '#e0c8a0'; ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#111'; ctx.fillRect(1, -9 + bob, 2, 2);

    // ── HEADGEAR ──
    if (age >= 4) {
        ctx.fillStyle = '#555'; ctx.fillRect(-6, -16 + bob, 12, 5);
        ctx.beginPath(); ctx.moveTo(0, -20 + bob); ctx.lineTo(-4, -16 + bob); ctx.lineTo(4, -16 + bob); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#444'; ctx.fillRect(-7, -12 + bob, 14, 2);
        ctx.fillStyle = '#ffd700'; ctx.fillRect(-7, -12 + bob, 14, 1); ctx.fillRect(-1, -20 + bob, 2, 1);
        ctx.fillStyle = '#dd1111'; ctx.fillRect(-1, -24 + bob, 2, 5); ctx.fillRect(-2, -23 + bob, 4, 2);
        ctx.fillStyle = '#555'; ctx.fillRect(-6, -11 + bob, 2, 3); ctx.fillRect(4, -11 + bob, 2, 3);
    } else if (age >= 3) {
        ctx.fillStyle = '#5a5a58'; ctx.fillRect(-5, -15 + bob, 10, 4); ctx.fillRect(-6, -12 + bob, 12, 2);
        ctx.fillStyle = '#ffd700'; ctx.fillRect(-1, -17 + bob, 2, 3);
        ctx.fillStyle = '#cc2222'; ctx.fillRect(0, -18 + bob, 1, 2);
    } else if (age >= 2) {
        ctx.fillStyle = '#5a5a58'; ctx.fillRect(-5, -14 + bob, 10, 3); ctx.fillRect(-6, -12 + bob, 12, 2);
    } else {
        ctx.fillStyle = '#c9a84c'; ctx.fillRect(-7, -14 + bob, 14, 2);
        ctx.fillStyle = '#b89040'; ctx.fillRect(-5, -16 + bob, 10, 3);
    }

    // ── RIGHT ARM + 柳葉刀 (animated) ──
    ctx.save(); ctx.translate(5, -2 + bob); ctx.rotate(armRot); ctx.translate(armOffX, armOffY);
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#8a1111' : '#883322'; ctx.fillRect(-2, -1, 4, 5);
        if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.fillRect(-2, -1, 4, 1); }
    }
    ctx.fillStyle = '#e0c8a0'; ctx.fillRect(-1.5, 4, 3, 3);
    ctx.save(); ctx.translate(0, 7); ctx.rotate(0.05);
    ctx.fillStyle = age >= 4 ? '#6a1818' : '#5a3a20'; ctx.fillRect(-1.5, -2, 3, 5);
    if (age >= 4) { ctx.fillStyle = '#ffd700'; ctx.fillRect(-1.5, -1, 3, 1); }
    ctx.fillStyle = age >= 4 ? '#ffd700' : age >= 3 ? '#c9a84c' : '#888'; ctx.fillRect(-2.5, -3, 5, 1.5);
    ctx.fillStyle = age >= 4 ? '#eee' : age >= 3 ? '#ddd' : '#ccc';
    ctx.beginPath(); ctx.moveTo(-1.5, -3); ctx.quadraticCurveTo(-2, -12, -4, -20);
    ctx.lineTo(-2, -19); ctx.quadraticCurveTo(0, -11, 1.5, -3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-1.5, -5); ctx.quadraticCurveTo(-2, -12, -4, -20); ctx.stroke();
    if (age >= 4) { ctx.fillStyle = '#cc1111'; ctx.fillRect(-1, 3, 1, 3); ctx.fillRect(1, 3, 1, 2); }
    if (attackState && attackProgress > 0.18 && attackProgress < 0.55) {
        const a = attackProgress < 0.4 ? 0.5 : 0.5 * (1 - (attackProgress - 0.4) / 0.15);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`; ctx.beginPath();
        ctx.moveTo(-1, -16); ctx.lineTo(-1, -24); ctx.lineTo(1, -24); ctx.lineTo(1, -16); ctx.fill();
    }
    ctx.restore(); ctx.restore();

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -26 + bob); }
    if (moving && age >= 2) { ctx.globalAlpha = 0.12; ctx.fillStyle = '#aa8866'; for (let i = 0; i < 3; i++) ctx.fillRect(-10 - i * 4, 12 + bob + i * 2, 3, 2); ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.07; ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== ĐẠI MINH SWORDSMAN — Đao binh (Dao swordsman) ========
export function drawSwords_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Dynamic Attack Posture Calculation (Side slash with Dao)
    let bodyTilt = 0;
    let rightArmRot = -0.1;
    let leftArmRot = 0;
    let swordOffsetX = 0;
    let swordOffsetY = 0;
    let shieldOffsetX = 0;

    if (attackState) {
        if (attackProgress < 0.25) {
            // Windup: pull sword back and across body, brace shield
            const t = attackProgress / 0.25;
            rightArmRot = (-0.1) * (1 - t) + (Math.PI / 4) * t;
            leftArmRot = (-Math.PI / 8) * t;
            bodyTilt = -0.15 * t;
            swordOffsetX = -4 * t;
            shieldOffsetX = -2 * t;
        } else if (attackProgress < 0.5) {
            // Strike: horizontal sweeping slash forward
            const t = (attackProgress - 0.25) / 0.25;
            rightArmRot = (Math.PI / 4) * (1 - t) + (-Math.PI / 2) * t;
            leftArmRot = (-Math.PI / 8) * (1 - t) + (Math.PI / 12) * t;
            bodyTilt = -0.15 * (1 - t) + 0.2 * t;
            swordOffsetX = -4 * (1 - t) + 6 * t;
            swordOffsetY = 3 * t;
        } else {
            // Recover
            const t = (attackProgress - 0.5) / 0.5;
            rightArmRot = (-Math.PI / 2) * (1 - t) + (-0.1) * t;
            leftArmRot = (Math.PI / 12) * (1 - t) + 0 * t;
            bodyTilt = 0.2 * (1 - t) + 0 * t;
            swordOffsetX = 6 * (1 - t);
            swordOffsetY = 3 * (1 - t);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#d5a176';
    const tunicColor = age >= 3 ? cv.bodyDark : cv.bodyMid;
    const armorTrim = age >= 4 ? '#ffd700' : '#bbbbbb';
    const rivetColor = age >= 4 ? '#ffd700' : '#888888';

    // ── LEGS & BOOTS ──
    ctx.fillStyle = '#222';
    ctx.fillRect(-5, 12 + bob, 4, 6 + legOff);
    ctx.fillRect(1, 12 + bob, 4, 6 - legOff);

    // Ming Cloth Boots
    ctx.fillStyle = '#111';
    ctx.fillRect(-6, 18 + bob + legOff, 5, 3);
    ctx.fillRect(0, 18 + bob - legOff, 5, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, 20 + bob + legOff, 5, 1);
    ctx.fillRect(0, 20 + bob - legOff, 5, 1);


    // ── TORSO (Dingjia Brigandine Armor) ──
    ctx.fillStyle = tunicColor;
    // Long coat
    ctx.fillRect(-7, -5 + bob, 14, 14);
    // Coat skirts
    ctx.fillRect(-8, 9 + bob, 6, 5);
    ctx.fillRect(2, 9 + bob, 6, 5);

    // Brigandine Rivets
    ctx.fillStyle = rivetColor;
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 4; c++) {
            ctx.fillRect(-5 + c * 3, -3 + bob + r * 2.5, 1, 1);
        }
    }
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            ctx.fillRect(-7 + c * 3, 10 + bob + r * 3, 1, 1);
            ctx.fillRect(3 + c * 3, 10 + bob + r * 3, 1, 1);
        }
    }

    // Mandarin Belt & Sash
    ctx.fillStyle = '#222';
    ctx.fillRect(-7, 6 + bob, 14, 2);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-6, 7 + bob, 12, 2);
    ctx.fillRect(-4, 9 + bob, 3, 5); // Hanging sash

    // ── BACK ARM + DAO (on top of body) ──
    ctx.save();
    ctx.translate(6, -3 + bob);
    ctx.rotate(rightArmRot);
    ctx.translate(swordOffsetX, swordOffsetY);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);
    // Forearm
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1.5, 6, 3, 4);

    // Yanmaodao (Dao Broadsword)
    ctx.translate(0, 10);
    ctx.rotate(-Math.PI / 6);

    // Grip
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(-1, -5, 2, 6);
    // Pommel Ring
    ctx.strokeStyle = armorTrim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.stroke();
    // Tassel
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(-4, -10, -3, -13); ctx.lineTo(-2, -13); ctx.fill();
    // Guard
    ctx.fillStyle = armorTrim;
    ctx.fillRect(-2, 1, 4, 1.5);

    // Dao Blade
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(-1, 2.5);
    ctx.lineTo(-1, 14); // Straight spine
    ctx.quadraticCurveTo(0, 18, 2, 16); // Upward curve
    ctx.lineTo(1.5, 2.5); // Cutting edge
    ctx.fill();
    ctx.fillStyle = '#fff'; // Shine
    ctx.fillRect(0.5, 3, 1, 12);

    // Swing effect
    if (attackState && attackProgress > 0.25 && attackProgress < 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 2); ctx.quadraticCurveTo(-15, 15, 2, 22);
        ctx.lineTo(4, 18); ctx.quadraticCurveTo(-10, 12, 1.5, 2);
        ctx.fill();
    }
    ctx.restore();

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -11 + bob, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1.5, -9 + bob, 1, 1);
    ctx.fillRect(0.5, -9 + bob, 1, 1);

    if (age >= 3) {
        // Ming Iron Hat (Zhanmadao style / Brigandine helm)
        ctx.fillStyle = age >= 4 ? '#cc2222' : '#5a5a58';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 5, Math.PI, Math.PI * 2); ctx.fill();
        // Wide brim
        ctx.fillRect(-7, -12 + bob, 14, 2);
        // Spire & Plume
        ctx.fillStyle = armorTrim;
        ctx.fillRect(-1, -18 + bob, 2, 3);
        if (age >= 4) {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(0, -18 + bob);
            ctx.quadraticCurveTo(-6, -22 + bob, -8, -14 + bob);
            ctx.quadraticCurveTo(-4, -18 + bob, 0, -16 + bob);
            ctx.fill();
        }
    } else if (age >= 2) {
        // Simple Iron Cap
        ctx.fillStyle = '#5a5a58';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-5.5, -12 + bob, 11, 1.5);
    } else {
        // Top Knot
        ctx.fillStyle = '#111';
        ctx.fillRect(-3, -14 + bob, 6, 3);
        ctx.fillRect(-1.5, -16 + bob, 3, 2);
    }

    // ── FRONT ARM & SHIELD (Rattan) ──
    ctx.save();
    ctx.translate(-4, -1 + bob);
    ctx.rotate(leftArmRot);

    // Front Arm
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);

    // Rattan Shield (Tengpai)
    if (age >= 2) {
        ctx.translate(-4 + shieldOffsetX, 4);

        ctx.fillStyle = age >= 3 ? '#b02a2a' : '#8b5a2b';
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2); ctx.fill();

        if (age >= 3) {
            // Painted Tiger Face Motif
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); // Snout
            ctx.fillStyle = '#111';
            ctx.fillRect(-2, -3, 4, 1); // Stripes
            ctx.fillRect(-2, 3, 4, 1);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-1, -1, 1, 1); ctx.fillRect(1, -1, 1, 1); // Eyes

            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2); ctx.stroke();
        } else {
            // Woven lines
            ctx.strokeStyle = '#5c4033'; ctx.lineWidth = 0.5;
            for (let i = -2; i <= 2; i += 2) {
                ctx.beginPath(); ctx.moveTo(i, -6); ctx.lineTo(i, 6); ctx.stroke();
            }
        }
    }

    ctx.restore();

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (DAI MINH) - Ming Qiang (Spearman)
// ============================================================
export function drawSpears_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();

    // Attack animation parameters (Two-handed Thrust / Slash hybrid)
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
    let rightArmRot = 0; // Back arm (shoulder rotation)
    let leftArmRot = 0;  // Front arm (shoulder rotation)
    let leftElbowBend = -Math.PI / 2; // L-shape: forearm points inward
    let rightElbowBend = 0; // Straight arm

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
        // Idle: L-shape left arm, straight right arm
        const breath = Math.sin(unit.animTimer * 2) * 0.02;
        bodyRot = breath;
        spearAngle = breath * 0.5;
        leftArmRot = 0.1;
        rightArmRot = 0.1;
        leftElbowBend = -Math.PI / 2; // L-shape
        rightElbowBend = 0; // Straight
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = age >= 3 ? cv.bodyDark : cv.bodyMid;
    const armorMetal = age >= 4 ? '#222222' : '#5a5a58';
    const armorGold = '#ffd700'; // Ming gold trim


    // ── LEGS ──
    // Loose trousers & Boots
    ctx.fillStyle = '#333';
    ctx.fillRect(-5, 7 + bob, 4, 6 + legOff);
    ctx.fillRect(1, 7 + bob, 4, 6 - legOff);

    // Typical Ming fabric boots
    ctx.fillStyle = '#111';
    ctx.fillRect(-5.5, 11 + legOff, 5, 3);
    ctx.fillRect(0.5, 11 - legOff, 5, 3);
    ctx.fillStyle = '#eee'; // White soles
    ctx.fillRect(-5.5, 13 + legOff, 5, 1);
    ctx.fillRect(0.5, 13 - legOff, 5, 1);


    // ── BODY (Dingjia Armor) ──
    // Inner robe
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -6 + bob, 12, 15);
    ctx.fillRect(-7, 9 + bob, 6, 4); // Skirt front
    ctx.fillRect(1, 9 + bob, 6, 4); // Skirt back

    // Brigandine Studs
    ctx.fillStyle = age >= 4 ? armorGold : '#aaaaaa';
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
            ctx.fillRect(-4 + c * 3 + (r % 2), -4 + bob + r * 2.5, 1, 1);
        }
    }
    // Skirt studs
    for (let r = 0; r < 2; r++) {
        ctx.fillRect(-5, 10 + bob + r * 2, 1, 1); ctx.fillRect(-2, 10 + bob + r * 2, 1, 1);
        ctx.fillRect(2, 10 + bob + r * 2, 1, 1); ctx.fillRect(5, 10 + bob + r * 2, 1, 1);
    }

    // Mandarin sash
    ctx.fillStyle = '#222';
    ctx.fillRect(-6, 6 + bob, 12, 2);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-5, 7 + bob, 10, 2);
    ctx.fillRect(-3, 9 + bob, 2, 4); // Hanging bit

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 7);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1.5, -9 + bob, 1, 1);
    ctx.fillRect(1, -9 + bob, 1, 1);

    if (age >= 3) {
        // Ming Conical Iron Hat
        ctx.fillStyle = age >= 4 ? '#cc2222' : '#5a5a58'; // Elites wear red lacquered helms
        ctx.beginPath(); ctx.arc(0, -11 + bob, 5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-7, -12 + bob, 14, 2); // Brim

        ctx.fillStyle = armorGold;
        ctx.fillRect(-1, -16 + bob, 2, 4); // Finial

        if (age >= 4) {
            // Flowing red plume
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(0, -16 + bob);
            ctx.quadraticCurveTo(-5, -20 + bob, -7, -12 + bob);
            ctx.quadraticCurveTo(-3, -16 + bob, 0, -14 + bob);
            ctx.fill();
        }
    } else if (age >= 2) {
        // Simple cap
        ctx.fillStyle = '#5a5a58';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-5.5, -12 + bob, 11, 1.5);
    } else {
        // Hair knot
        ctx.fillStyle = '#111';
        ctx.fillRect(-2.5, -15 + bob, 5, 3);
        ctx.fillRect(-1, -17 + bob, 2, 2);
    }

    // ── LEFT ARM (L-shape) — drawn on top of body ──
    ctx.save();
    ctx.translate(-5, -5 + bob);
    ctx.rotate(0.8 + leftArmRot);
    // Upper arm (shorter)
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 3);
    ctx.fillStyle = armorMetal;
    ctx.fillRect(-2, 3, 4, 3);
    // Forearm horizontal (shorter, just reaching spear)
    ctx.fillStyle = armorMetal;
    ctx.fillRect(0, 4, 5, 4);
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(5, 6, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── FRONT ARM (Right Arm - straight down to spear) — drawn on top of body ──
    ctx.save();
    ctx.translate(6, -5 + bob);
    ctx.rotate(-0.5 + rightArmRot); // diagonal toward right
    // Straight arm from shoulder down to spear
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-1.5, 0, 3, 4);
    ctx.fillStyle = armorMetal;
    ctx.fillRect(-1.5, 4, 3, 5);
    if (age >= 3) { ctx.fillStyle = armorGold; ctx.fillRect(-1.5, 8, 3, 1); }
    // Hand resting on spear
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── SPEAR (Qiang) — drawn on top of body ──
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    ctx.translate(0, 4 + bob);
    ctx.rotate(spearAngle);
    ctx.fillStyle = '#6a4a2a';
    const poleLength = age >= 3 ? 36 : 32;
    ctx.fillRect(-poleLength * 0.4, -1, poleLength, 2);
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.moveTo(-poleLength * 0.4, -1); ctx.lineTo(-poleLength * 0.4 - 2, -0.5); ctx.lineTo(-poleLength * 0.4 - 2, 0.5); ctx.lineTo(-poleLength * 0.4, 1); ctx.fill();
    const shaftEnd = poleLength * 0.6;
    ctx.fillStyle = '#dd2222';
    ctx.beginPath(); ctx.moveTo(shaftEnd, -1); ctx.quadraticCurveTo(shaftEnd - 3, -6, shaftEnd - 1, -8); ctx.quadraticCurveTo(shaftEnd + 1, -4, shaftEnd + 2, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(shaftEnd, 1); ctx.quadraticCurveTo(shaftEnd - 3, 6, shaftEnd - 1, 8); ctx.quadraticCurveTo(shaftEnd + 1, 4, shaftEnd + 2, 0); ctx.fill();
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#cccccc';
    const bladeLen = age >= 3 ? 8 : 6;
    ctx.beginPath(); ctx.moveTo(shaftEnd, 0); ctx.quadraticCurveTo(shaftEnd + 2, -2, shaftEnd + bladeLen, 0); ctx.quadraticCurveTo(shaftEnd + 2, 2, shaftEnd, 0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(shaftEnd, -0.5, bladeLen - 1, 1);
    ctx.restore();

    // Finish
    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore();
}

// ============================================================
//  DRAW ARCHER (ĐẠI MINH) - Zhuge Nu (Repeating Crossbowman)
// ============================================================
export function drawArchers_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
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

    // Crossbow animation:
    // With Zhuge Nu, the attacker pushes the lever forward and pulls it back repeatedly.
    // Rather than a slow draw and hold, it's a rhythmic pumping action.
    if (isAttacking) {
        const attackCycle = unit.animTimer % unit.attackCooldown;
        const attackDuration = unit.civAttackSpeed * 0.8;

        if (attackCycle < attackDuration) {
            // Pumping the lever (pulling it back)
            // It goes from 0 (forward) to 1 (pulled back) to 0 (released) quickly
            const t = attackCycle / attackDuration;
            if (t < 0.8) {
                pullback = t / 0.8; // Cocking
            } else {
                pullback = 1 - ((t - 0.8) / 0.2); // Firing
            }
        }
    }

    // Body rotation
    let bodyRot = 0;
    if (isAttacking) {
        bodyRot = -0.1 + pullback * 0.1; // Lean into the pump slightly
    } else {
        bodyRot = Math.sin(unit.animTimer * 2) * 0.05;
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const bodyBaseColor = age >= 3 ? cv.bodyDark : cv.bodyMid;
    const armorGold = '#d4af37';
    const armorMetal = age >= 4 ? '#5a5a58' : '#777777';

    // ── BACK ARM (Right Arm - Pumping the Zhuge Nu lever) ──
    ctx.save();
    let drawArmRot = 0;
    let drawHandX = 0;
    let drawHandY = 0;

    if (isAttacking) {
        // Pumping motion involves pushing and pulling the lever on top of the crossbow
        drawArmRot = 0.2 + pullback * -0.6; // Arm rotates back
        drawHandX = 10 + pullback * -4; // Hand moves back slightly
        drawHandY = -9 + pullback * -3; // Hand raises along the lever
    } else {
        drawArmRot = 0.4;
        drawHandX = 8;
        drawHandY = -4;
    }

    ctx.translate(drawHandX, drawHandY + bob);
    ctx.rotate(drawArmRot);

    // Sleeve
    ctx.fillStyle = bodyBaseColor;
    ctx.fillRect(-2, -2, 4, 7);
    ctx.fillStyle = '#cc2222'; // Red cuff
    ctx.fillRect(-2, 5, 4, 1);

    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── QUIVER/BOLT BOX (Waist, back side) ──
    ctx.save();
    ctx.translate(-7, 6 + bob);
    ctx.fillStyle = '#222'; // Black leather bolt case
    ctx.fillRect(-2, -3, 4, 6);
    ctx.fillStyle = '#aa2222'; // Red trim
    ctx.fillRect(-2, -3, 4, 1);
    ctx.fillRect(-2, 2, 4, 1);
    // Bolts
    ctx.fillStyle = '#aaa';
    ctx.fillRect(-1.5, -5, 1, 2); ctx.fillRect(0.5, -4, 1, 1);
    ctx.restore();

    // ── LEGS ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-5, 6, 4, 7 + legOff);
    ctx.fillRect(1, 6, 4, 7 - legOff);

    // Ming Boots
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-5.5, 12 + legOff, 5, 2);
    ctx.fillRect(0.5, 12 - legOff, 5, 2);
    // White soles
    ctx.fillStyle = '#eee';
    ctx.fillRect(-5.5, 13.5 + legOff, 5, 0.5);
    ctx.fillRect(0.5, 13.5 - legOff, 5, 0.5);

    // ── BODY (Dingjia - Brigandine Armor) ──
    ctx.fillStyle = bodyBaseColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    if (age >= 2) {
        // Brigandine Studs 
        ctx.fillStyle = age >= 4 ? armorGold : '#bbbbbb';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                ctx.fillRect(-4 + c * 3 + (r % 2), -2 + bob + r * 3, 1, 1);
            }
        }
    }

    // Belt & Royal Sash
    ctx.fillStyle = '#222';
    ctx.fillRect(-6, 4 + bob, 12, 2);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-5, 6 + bob, 10, 3);
    ctx.fillRect(-3, 9 + bob, 4, 3);

    // Shoulder guard (Pauldrons)
    if (age >= 3) {
        ctx.fillStyle = bodyBaseColor;
        ctx.fillRect(-6, -5 + bob, 3, 4);
        ctx.fillStyle = age >= 4 ? '#cc2222' : armorMetal;
        ctx.fillRect(-6, -5 + bob, 3, 1);
    }

    // ── HEAD & CAP ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 8); // Face

    // Narrow Mustache & Goatee
    if (age >= 3) {
        ctx.fillStyle = '#111';
        ctx.fillRect(-2, -9 + bob, 4, 0.5); // Mustache
        ctx.fillRect(-0.5, -6 + bob, 1, 2); // Goatee
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(-3, -13 + bob, 6, 2); // Hair
    }

    if (age >= 3) {
        // Zhanmao (Brimmed archer hat)
        ctx.fillStyle = age >= 4 ? '#222' : '#333';
        ctx.fillRect(-5, -15 + bob, 10, 4); // Dome
        ctx.fillStyle = age >= 4 ? '#cc2222' : '#222';
        ctx.fillRect(-7, -11 + bob, 14, 1.5); // Brim

        // Red Tassel
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(-1, -17 + bob, 2, 3);

        // Brass finial
        ctx.fillStyle = armorGold;
        ctx.fillRect(-0.5, -19 + bob, 1, 2);
    } else {
        // Simple cloth wrap
        ctx.fillStyle = '#222';
        ctx.fillRect(-5, -14 + bob, 10, 4);
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(-5, -11 + bob, 10, 1); // Tie
    }

    // ── FRONT ARM (Left Arm - Holding Crossbow steady) ──
    ctx.save();
    let bowArmRot = 0;

    if (isAttacking) {
        bowArmRot = -Math.PI / 2 + 0.2; // Forward, bracing the heavy crossbow
    } else {
        bowArmRot = -Math.PI / 6;
    }

    ctx.translate(-1, -3 + bob);
    ctx.rotate(bowArmRot);

    ctx.fillStyle = bodyBaseColor;
    ctx.fillRect(-2, 0, 4, 5);
    ctx.fillStyle = '#222'; // Bracer
    ctx.fillRect(-2, 5, 4, 5);
    if (age >= 3) {
        ctx.fillStyle = armorGold;
        ctx.fillRect(-2, 6, 4, 1);
    }

    // Hand gripping crossbow stock from bottom
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();

    // ── THE CROSSBOW (Zhuge Nu) ──
    ctx.translate(2, 11); // Offset to hold below the stock
    ctx.rotate(-bowArmRot); // Keep crossbow horizontal or slightly tilted down
    if (isAttacking) {
        ctx.rotate(0.05); // Aiming
    } else {
        ctx.rotate(-0.2); // Pointing somewhat down
    }

    // Heavy wooden stock
    ctx.fillStyle = age >= 4 ? '#5a1111' : '#3a2010'; // Red lacquered or dark wood
    ctx.fillRect(-3, -2, 14, 3);

    // Metal prod (the horizontal bow limb, viewed from side so it's a vertical line)
    ctx.fillStyle = age >= 3 ? '#a0a0a0' : '#888888';
    ctx.fillRect(8, -8, 2, 16);
    // Brass prod mounts
    ctx.fillStyle = armorGold;
    ctx.fillRect(7, -1, 4, 2);

    // Large wooden magazine on top
    ctx.fillStyle = '#4a2a18';
    ctx.fillRect(-2, -7, 8, 5);
    ctx.fillStyle = '#111'; // Iron banding
    ctx.fillRect(-2, -6, 8, 0.5);
    ctx.fillRect(-2, -3, 8, 0.5);

    // Lever mechanism sticking up and pivoting based on pullback
    // Pullback = 0 means lever is forward. Pullback = 1 means lever is pulled back.
    ctx.save();
    ctx.translate(4, -7); // Pivot point at front of magazine
    ctx.rotate(pullback * -1.0); // Pushing back (CCW)

    ctx.fillStyle = '#5a3a20'; // Lever
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, -4); ctx.lineTo(-1, -4); ctx.fill();
    ctx.fillRect(-2, -6, 2, 2); // Handle
    ctx.restore();

    // The string (moves back and forth)
    // Normally hidden inside the magazine stock, but we'll show a sliver for effect
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(9, -8);
    ctx.lineTo(9 - pullback * 6, -1);
    ctx.lineTo(9, 8);
    ctx.stroke();

    // If firing, show a bolt just leaving
    if (isAttacking && pullback < 0.2 && unit.attackCooldown < unit.civAttackSpeed * 0.1) {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(10, -2, 4, 1);
    }

    ctx.restore(); // Bow & Front Arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main DaiMinh Archer context
}

// ============================================================
//  DRAW KNIGHT (ĐẠI MINH) - Ming Heavy Cavalry (Thiết Kỵ)
// ============================================================
export function drawKnight_DaiMinh(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (isAttacking) {
        const pullPhase = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        attackProgress = Math.max(0, Math.min(1, pullPhase));
    }

    // Ngựa Minh (Thường là ngựa đen hoặc ngựa nâu sẫm, to lớn)
    const horseColor = age >= 4 ? '#2a2a2a' : '#3a2a20';
    const horseDark = age >= 4 ? '#111111' : '#22110a';

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

    // Đuôi ngựa (Cắt lươn hoặc buộc gọn kiểu Minh)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.quadraticCurveTo(-24 - legBob, -10, -26 - legBob, 0);
    ctx.quadraticCurveTo(-20, -2, -16, -14);
    ctx.fill();

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

    // ── GIÁP NGỰA (MING BARDING) ──
    if (age >= 3) {
        // Tấm thảm lót lưng lụa vàng/đỏ
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(12, -4); ctx.lineTo(-14, -4); ctx.fill();
        ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1; ctx.stroke();

        if (age >= 4) {
            // Giáp vải đinh tán (Brigandine barding)
            ctx.fillStyle = cv.bodyDark;
            ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(18, -14); ctx.lineTo(14, 0); ctx.lineTo(-18, 0); ctx.fill();

            // Đinh tán đồng (Brass rivets)
            ctx.fillStyle = '#daa520';
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 8; c++) {
                    ctx.fillRect(-16 + c * 4 + (r % 2) * 2, -14 + r * 4, 1, 1);
                }
            }

            // Lục lạc đồng trước ngực ngựa (Phu mã)
            ctx.fillStyle = '#cc2222'; ctx.beginPath(); ctx.arc(24, -8, 4, 0, Math.PI * 2); ctx.fill(); // Tua rua đỏ
            ctx.fillStyle = '#daa520'; ctx.beginPath(); ctx.arc(24, -12, 3, 0, Math.PI * 2); ctx.fill(); // Chuông

            // Mặt nạ sắt (Chanfron)
            ctx.fillStyle = '#6a6a68';
            ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(30, -20); ctx.lineTo(26, -30); ctx.fill();
        }
    }

    // Chân trước
    ctx.fillStyle = horseColor;
    const stompLift = (isAttacking && attackProgress > 0.1 && attackProgress < 0.8) ? -8 : 0;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 + legBob, 10); ctx.lineTo(-8 + legBob, 12); ctx.lineTo(-6, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(14 - legBob, 12 + stompLift); ctx.lineTo(18 - legBob, 12 + stompLift); ctx.lineTo(18, -6); ctx.fill();

    // Dây cương (Đỏ tía)
    ctx.strokeStyle = '#8b0000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(20, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(12, -14); ctx.stroke();

    ctx.restore(); // END HORSE

    // ── RIDER (MING CAVALRY) ──
    const riderY = hy - 20;
    ctx.save();
    ctx.translate(hx, riderY);
    ctx.rotate(rearing * 0.8);

    // Áo choàng đỏ sau lưng
    if (age >= 2) {
        ctx.fillStyle = '#aa2222';
        const capeWave = moving ? Math.sin(unit.animTimer * 15) * 6 : 0;
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.quadraticCurveTo(-14, 10 + capeWave, -16 + capeWave, 20);
        ctx.lineTo(-8 + capeWave, 22);
        ctx.quadraticCurveTo(-6, 10 + capeWave, 0, 4);
        ctx.fill();
    }

    // Tay phải (cầm cương)
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.skinColor;
    ctx.fillRect(-6, 4, 4, 10);

    // Thân người (Dingjia - Giáp mão đinh tán)
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.bodyMid;
    ctx.fillRect(-5, 0, 10, 14);

    if (age >= 4) {
        // Hộ tâm phiến (Gương ngực - Chest mirror)
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.arc(0, 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1; ctx.stroke();

        // Đinh tán trên áo giáp
        ctx.fillStyle = '#daa520';
        for (let r = 0; r < 4; r++) {
            ctx.fillRect(-4, 8 + r * 2, 1, 1);
            ctx.fillRect(3, 8 + r * 2, 1, 1);
        }

        // Thắt lưng (Đới)
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-5, 8, 10, 2);
    }

    // Chân & Ủng (Ming boots)
    ctx.fillStyle = '#333'; // Quần lụa đen
    ctx.fillRect(-2, 14, 6, 8);
    if (age >= 3) {
        ctx.fillStyle = '#111'; // Quan hài (Hài quan)
        ctx.fillRect(-2, 20, 6, 4);
        ctx.fillStyle = '#fff'; // Đế hài trắng đặc trưng
        ctx.fillRect(-2, 23, 6, 1);
    } else {
        ctx.fillStyle = '#4a2a10';
        ctx.fillRect(-2, 20, 6, 4);
    }

    // Đầu
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -6, 6, 6); // Mặt & Cổ

    // Mũ bảo hiểm (Ming Iron Helmet)
    ctx.fillStyle = age >= 4 ? '#6a6a68' : '#333';
    ctx.beginPath(); ctx.arc(0, -6, 4.5, Math.PI, 0); ctx.fill(); // Dome tròn
    // Vành mũ
    ctx.fillRect(-5, -6, 10, 1.5);

    // Tấm che gáy và tai (Cheek & Neck guards đinh tán)
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5, -4, 4, 6);
    if (age >= 4) {
        ctx.fillStyle = '#daa520'; ctx.fillRect(-4, -2, 1, 1); ctx.fillRect(-4, 0, 1, 1);
    }

    if (age >= 3) {
        // Hồng anh (Tua rua đỏ trên đỉnh mũ)
        ctx.fillStyle = '#dd2222';
        ctx.fillRect(-1, -12, 2, 4); // Cán
        ctx.beginPath(); ctx.arc(0, -9, 3, 0, Math.PI * 2); ctx.fill(); // Chùm nùn xoắn
    }

    // Tay trái (cầm Kích - Ji)
    ctx.save();
    let armRot = 0;
    if (isAttacking) {
        if (attackProgress < 0.4) {
            // Kéo trượng ra sau
            armRot = -Math.PI / 2 + (attackProgress * 2);
        } else {
            // Bổ mạnh xuống / Đâm tới
            armRot = Math.PI / 3;
        }
    } else {
        armRot = moving ? Math.PI / 8 + Math.sin(unit.animTimer * 18) * 0.1 : Math.PI / 6;
    }

    ctx.translate(2, 2);
    ctx.rotate(armRot);

    // Pauldron (Áo khoác vai)
    if (age >= 4) {
        ctx.fillStyle = cv.bodyDark; ctx.fillRect(-3, -2, 6, 5);
        ctx.fillStyle = '#daa520'; ctx.fillRect(-2, -1, 1, 1); ctx.fillRect(1, -1, 1, 1); // Đinh tán
    } else if (age >= 3) {
        ctx.fillStyle = cv.bodyMid; ctx.fillRect(-3, -2, 6, 4);
    }

    // Cánh tay
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-2, 0, 4, 12);

    // Vũ khí (Ji - Phương Thiên Họa Kích)
    ctx.translate(0, 10);
    ctx.fillStyle = '#3a1a05'; // Cán gỗ đen đỏ
    ctx.fillRect(-1.5, -16, 3, 40);

    if (age >= 3) {
        // Tua rua đỏ ở cố giáo
        ctx.fillStyle = '#e82222';
        ctx.fillRect(-3, -8, 6, 4);

        // Mũi giáo đâm (Speartip)
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath(); ctx.moveTo(-1.5, -8); ctx.lineTo(1.5, -8); ctx.lineTo(0, -18); ctx.fill();

        // Trăng khuyết bên hông càng kích (Ji blade)
        ctx.beginPath();
        ctx.moveTo(1, -6);
        ctx.quadraticCurveTo(8, -8, 1, -14); // Lưỡi rìu hình bán nguyệt
        ctx.lineTo(2, -10); // Khấc ráp thép
        ctx.fill();
    } else {
        // Thương đơn giản
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(2, -8); ctx.lineTo(0, -16); ctx.fill();
    }

    ctx.restore(); // END Tay trái

    ctx.restore(); // END RIDER

    drawKnightsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // END MAIN KNIGHT
}
