// ============================================================
//  Elite Unit Renderers — drawChuKoNu, drawImmortal, drawNinja,
//  drawCenturion, drawUlfhednar
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState, TILE_SIZE } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";

/**
 * Lấy góc quay của cánh tay/vũ khí dựa trên tiến trình đòn đánh (từ 0.0 đến 1.0).
 * Đòn đánh tung ra vào đúng khoảnh khắc progress đạt 1.0 (sát thương được tính).
 */
function getAttackAngle(unit: Unit, idleRot: number, windupRot: number, strikeRot: number): number {
    if (unit.state !== UnitState.Attacking) return idleRot;

    // Progress từ 0.0 (vừa chém xong) đến 1.0 (chuẩn bị hit)
    const progress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);

    if (progress < 0.2) {
        // Recovery: Thu vũ khí về sau khi chém trúng (Strike -> Idle)
        let t = progress / 0.2;
        return strikeRot * (1 - t) + idleRot * t;
    } else if (progress < 0.8) {
        // Wind-up: Vung vũ khí lấy đà (Idle -> Windup)
        let t = (progress - 0.2) / 0.6;
        return idleRot * (1 - t) + windupRot * t;
    } else {
        // Strike: Bổ/Chém dứt khoát nhanh (Windup -> Strike)
        let t = (progress - 0.8) / 0.2;
        // Thêm gia tốc Ease-In để đòn chém có độ nén và lực
        t = t * t;
        return windupRot * (1 - t) + strikeRot * t;
    }
}

/** Cẩm Y Vệ — Đại Minh imperial guard, red flying fish robe, concealed dao */
export function drawChuKoNu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    ctx.save();
    ctx.scale(0.85, 0.85); // Thu nhỏ 15%
    ctx.save();
    ctx.translate(0, 4); // Anchor point balance

    let attackState = false;
    if (unit.state === UnitState.Attacking) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            const bldgRadius = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * 32 * 0.4 : 0;
            if (dist <= unit.civRange + bldgRadius + 20) {
                attackState = true;
            }
        }
    }
    const walkBob = moving ? Math.sin(bob * 0.5) * 2.5 : 0;
    const legSwing = moving ? Math.sin(bob * 0.6) * 5 : 0;

    let attackProgress = 0;
    let attackRot = 0;

    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        // Chém từ đầu xuống không vượt quá chân (Từ trên đỉnh đầu chém thẳng xuống)
        // sword vung ra không quá 75 độ (Khoảng 75 độ tính từ phương thẳng đứng)
        if (attackProgress < 0.3) {
            // Rút kiếm vung lên trên đầu
            attackRot = (-Math.PI / 1.2) * (attackProgress / 0.3);
        } else if (attackProgress < 0.5) {
            // Giữ thế trên đỉnh đầu
            attackRot = -Math.PI / 1.1; // Góc cao vung qua đầu
        } else {
            // Chém gập xuống phía trước nhưng không quá chân (không quá 75 độ = ~1.3 radians)
            let t = (attackProgress - 0.5) / 0.5;
            attackRot = -Math.PI / 1.1 + (Math.PI / 1.1 + Math.PI / 3) * t;
        }
    }

    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.02);
        ctx.rotate(0.05);
    }
    if (attackState) {
        // Lean body with the slash
        let bodyLean = 0;
        if (attackProgress < 0.3) {
            bodyLean = -0.08 * (attackProgress / 0.3); // lean back during windup
        } else if (attackProgress < 0.5) {
            bodyLean = -0.08; // hold back lean
        } else {
            const t = (attackProgress - 0.5) / 0.5;
            bodyLean = -0.08 + 0.2 * t; // lean forward during slash
        }
        ctx.rotate(bodyLean);
    }

    const cv = getCivColors(unit);
    const robeBase = cv.bodyMid;
    const goldAccent = cv.bodyLight;
    const steelMetal = age >= 4 ? '#fff' : '#ddd';
    const darkLeather = cv.bodyDark;
    const skinTone = cv.skinColor || '#d2a688';

    // ---- RIGHT ARM & XIU CHUN DAO (Sword) ----
    // When idle: drawn here (behind body). When attacking: drawn after body (on top).
    if (!attackState) {
        ctx.save();
        ctx.translate(-2, -4 + walkBob);
        const reachRot = (80 * Math.PI / 180) + (moving ? Math.sin(bob * 0.6) * 0.05 : 0);
        ctx.rotate(reachRot);
        ctx.fillStyle = robeBase; ctx.fillRect(-2, 0, 4, 8);
        ctx.fillStyle = darkLeather; ctx.fillRect(-1.5, 4, 3, 6);
        ctx.fillStyle = goldAccent; ctx.fillRect(-1.5, 4, 3, 1); ctx.fillRect(-1.5, 9, 3, 1);
        ctx.fillStyle = '#4a3320'; ctx.fillRect(-1.5, 10, 3, 3);
        ctx.restore();
    }

    // ---- LEGS & BOOTS ----
    ctx.fillStyle = '#111';
    ctx.fillRect(-5 + legSwing, 6, 4.5, 11);
    ctx.fillRect(1 - legSwing, 6, 4.5, 11);

    ctx.fillStyle = age >= 4 ? goldAccent : '#333';
    ctx.fillRect(-5.5 + legSwing, 10, 5.5, 6);
    ctx.fillRect(0.5 - legSwing, 10, 5.5, 6);

    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.ellipse(-3 + legSwing, 18, 4.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3 - legSwing, 18, 4.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eee';
    ctx.fillRect(-6 + legSwing, 19, 5, 1);
    ctx.fillRect(1 - legSwing, 19, 5, 1);

    // ---- LOWER ROBE (Flying Fish Skirt) ----
    ctx.fillStyle = robeBase;
    ctx.beginPath();
    ctx.moveTo(-6.5, 2 + walkBob);
    ctx.lineTo(6.5, 2 + walkBob);
    ctx.lineTo(10, 11 + walkBob);
    ctx.lineTo(-10, 11 + walkBob);
    ctx.fill();

    ctx.strokeStyle = goldAccent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10, 11 + walkBob); ctx.lineTo(10, 11 + walkBob); ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.fillRect(-1, 5 + walkBob, 2, 7);

    // ---- UPPER TORSO (Flying Fish Tunic & Belt) ----
    ctx.fillStyle = robeBase;
    ctx.fillRect(-7, -7 + walkBob, 14, 11);

    if (age >= 4) {
        ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(0, -2 + walkBob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-3, -3 + walkBob, 6, 1);
        ctx.fillRect(-1, -4 + walkBob, 2, 4);
        ctx.globalAlpha = 1;
    }

    ctx.fillStyle = darkLeather;
    ctx.fillRect(-7.5, 2 + walkBob, 15, 3.5);
    ctx.fillStyle = age >= 4 ? goldAccent : '#ddd';
    ctx.fillRect(-3, 1.5 + walkBob, 6, 4.5);
    ctx.fillStyle = '#111';
    ctx.fillRect(-1, 2.5 + walkBob, 2, 2.5);

    ctx.fillStyle = '#bb1111';
    ctx.beginPath();
    ctx.moveTo(-6, 5 + walkBob);
    ctx.quadraticCurveTo(-8, 10 + walkBob, -5 - legSwing * 0.5, 14 + walkBob);
    ctx.lineTo(-4 - legSwing * 0.5, 14 + walkBob);
    ctx.lineTo(-4, 5 + walkBob);
    ctx.fill();

    ctx.fillStyle = darkLeather;
    ctx.beginPath(); ctx.moveTo(-8, -7 + walkBob); ctx.lineTo(8, -7 + walkBob); ctx.lineTo(3, 0 + walkBob); ctx.lineTo(-3, 0 + walkBob); ctx.fill();
    ctx.strokeStyle = goldAccent; ctx.lineWidth = 1; ctx.stroke();

    // ---- SCABBARD (always visible at belt) ----
    ctx.save();
    ctx.translate(3, 3 + walkBob);
    ctx.rotate(30 * Math.PI / 180);
    ctx.fillStyle = '#1a0d00';
    ctx.beginPath(); ctx.roundRect(-2, -5, 4, 24, 1); ctx.fill();
    ctx.fillStyle = goldAccent;
    ctx.fillRect(-2.5, -4, 5, 2);
    ctx.fillRect(-2.5, 14, 5, 3);
    ctx.strokeStyle = '#d00'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(-4, 8); ctx.stroke();
    if (!attackState) {
        // Sword hilt visible in scabbard when idle
        ctx.translate(0, -4);
        ctx.fillStyle = '#3a2010'; ctx.fillRect(-1, -6, 2, 6);
        ctx.fillStyle = goldAccent;
        ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // ---- LEFT ARM (idle only — during attack, hands on sword) ----
    if (!attackState) {
        ctx.save();
        ctx.translate(4.5, -4 + walkBob);
        const leftArmRot = moving ? (15 * Math.PI / 180) + Math.sin(bob * 0.8) * 0.05 : (20 * Math.PI / 180);
        ctx.rotate(leftArmRot);
        ctx.fillStyle = robeBase; ctx.fillRect(-2, 0, 4, 8);
        ctx.fillStyle = darkLeather; ctx.fillRect(-1.5, 4, 3, 5);
        ctx.fillStyle = goldAccent; ctx.fillRect(-1.5, 4, 3, 1); ctx.fillRect(-1.5, 8, 3, 1);
        ctx.fillStyle = skinTone; ctx.fillRect(-1, 9, 2.5, 2.5);
        ctx.restore();
    }

    // ---- HEAD, MASK & HAT (Doupeng) ----
    ctx.fillStyle = '#111'; ctx.fillRect(-3.5, -9 + walkBob, 7, 2.5);
    ctx.fillStyle = skinTone; ctx.fillRect(-3.5, -14 + walkBob, 7, 5);

    if (age >= 4) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.moveTo(-4, -13 + walkBob); ctx.lineTo(4, -13 + walkBob); ctx.lineTo(3, -9 + walkBob); ctx.lineTo(-3, -9 + walkBob); ctx.fill();
        ctx.fillStyle = goldAccent;
        ctx.fillRect(-1.5, -10 + walkBob, 1, 1); ctx.fillRect(0.5, -10 + walkBob, 1, 1);
        ctx.fillRect(-3.5, -13 + walkBob, 7, 0.5);
        ctx.fillStyle = '#ff1111';
        ctx.fillRect(-2, -12 + walkBob, 1.5, 1); ctx.fillRect(0.5, -12 + walkBob, 1.5, 1);
    } else {
        ctx.fillStyle = '#000'; ctx.fillRect(-2.5, -12.5 + walkBob, 1.5, 1.5); ctx.fillRect(1, -12.5 + walkBob, 1.5, 1.5);
        ctx.fillStyle = '#fff'; ctx.fillRect(-2.5, -12.5 + walkBob, 0.5, 0.5); ctx.fillRect(1, -12.5 + walkBob, 0.5, 0.5);
    }

    // Ming Doupeng (Hat)
    ctx.fillStyle = '#181614';
    ctx.beginPath(); ctx.ellipse(0, -15 + walkBob, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); // Brim
    ctx.beginPath(); ctx.moveTo(-5.5, -15 + walkBob); ctx.lineTo(5.5, -15 + walkBob); ctx.lineTo(0, -21 + walkBob); ctx.fill(); // Dome

    // Tassels
    ctx.fillStyle = goldAccent;
    ctx.beginPath(); ctx.arc(0, -21 + walkBob, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e60000'; ctx.lineWidth = 1;
    const sway = Math.sin(unit.animTimer * 6) * 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -15 + walkBob); ctx.quadraticCurveTo(-6, -10 + walkBob, -5 - sway, -6 + walkBob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -15 + walkBob); ctx.quadraticCurveTo(6, -10 + walkBob, 5 - sway, -6 + walkBob); ctx.stroke();

    if (age >= 4) {
        ctx.globalAlpha = 0.12 + Math.sin(unit.animTimer * 4) * 0.04;
        const aura = ctx.createRadialGradient(0, walkBob, 6, 0, walkBob, 20);
        aura.addColorStop(0, '#ff0033'); aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura; ctx.fillRect(-20, -20 + walkBob, 40, 40);
        ctx.globalAlpha = 1;
    }

    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = goldAccent;
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++) {
            ctx.beginPath(); ctx.arc(-11, 6 + walkBob - i * 4, 1.2, 0, Math.PI * 2); ctx.fill();
        }
    }
    // ---- RIGHT ARM + SWORD (attack only, drawn on top of body) ----
    if (attackState) {
        ctx.save();
        ctx.translate(-5, -3 + walkBob);
        ctx.rotate(attackRot);
        // Arm (extended)
        ctx.fillStyle = robeBase; ctx.fillRect(-2, 0, 4, 10);
        ctx.fillStyle = darkLeather; ctx.fillRect(-1.5, 6, 3, 7);
        ctx.fillStyle = goldAccent; ctx.fillRect(-1.5, 6, 3, 1); ctx.fillRect(-1.5, 12, 3, 1);
        ctx.fillStyle = '#4a3320'; ctx.fillRect(-1.5, 13, 3, 3);
        // Sword
        ctx.translate(0, 16);
        ctx.fillStyle = '#3a2010'; ctx.fillRect(-1, 0, 2, -6);
        ctx.fillStyle = goldAccent;
        ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-2.5, 0, 5, 1.5);
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(-1, 1.5); ctx.lineTo(-1, 16);
        ctx.quadraticCurveTo(0, 20, 2, 18); ctx.lineTo(2, 1.5); ctx.fill();
        ctx.fillStyle = steelMetal; ctx.fillRect(1, 2, 1, 15);
        ctx.fillStyle = '#222'; ctx.fillRect(-0.5, 3, 0.5, 10);
        if (attackProgress > 0.6) {
            ctx.globalAlpha = 0.4; ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(1, 15); ctx.quadraticCurveTo(12, 12, 6, 2); ctx.lineTo(2, 2); ctx.fill();
            ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(200, 0, 0, 0.8)';
            ctx.beginPath(); ctx.arc(1.5, 12, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // ---- LEFT ARM (two-handed grip on sword) ----
        const rShX = -5, rShY = -3 + walkBob;
        const handleDist = 12;
        const handleX = rShX + Math.cos(attackRot + Math.PI / 2) * handleDist;
        const handleY = rShY + Math.sin(attackRot + Math.PI / 2) * handleDist;
        const leftShX = 4.5, leftShY = -3 + walkBob;
        const cpX = (leftShX + handleX) * 0.5 + 3;
        const cpY = (leftShY + handleY) * 0.5 + 5;
        ctx.save();
        ctx.lineCap = 'round';
        // Upper arm (robe sleeve)
        ctx.strokeStyle = robeBase; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(leftShX, leftShY);
        ctx.quadraticCurveTo(cpX, cpY, handleX, handleY); ctx.stroke();
        // Bracer overlay
        ctx.strokeStyle = darkLeather; ctx.lineWidth = 3.5;
        const midX = (cpX + handleX) * 0.5, midY = (cpY + handleY) * 0.5;
        ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(handleX, handleY); ctx.stroke();
        // Fist
        ctx.fillStyle = skinTone;
        ctx.beginPath(); ctx.arc(handleX, handleY, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    ctx.restore();
    ctx.restore(); // Restore outer scale wrapper
}

/** Bất Tử Quân — Persian Immortal Elite, golden scale armor, turban, wicker shield and shamshir */
export function drawImmortal(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    ctx.save();
    ctx.scale(0.85, 0.85); // Thu nhỏ 15%
    let attackState = false;
    if (unit.state === UnitState.Attacking) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            const bldgRadius = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * 32 * 0.4 : 0;
            if (dist <= unit.civRange + bldgRadius + 20) {
                attackState = true;
            }
        }
    }
    const isBlocking = unit.magiCastActive || unit.passiveCooldown > 0; // Guarding while casting or shielding
    const walkBob = moving ? Math.sin(bob * 0.5) * 2.5 : 0;
    const legSwing = moving ? Math.sin(bob * 0.6) * 5 : 0;
    const robeSway = moving ? Math.cos(bob * 0.3) * 3 : Math.sin(unit.animTimer * 2) * 1;

    // Animation Phase for Shamshir/Kopis
    let attackRot = 0;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        // Correct overhead downward slash
        if (attackProgress < 0.2) {
            // Recover from previous strike
            let recoverT = attackProgress / 0.2;
            attackRot = (Math.PI / 4) * (1 - recoverT) + (-Math.PI / 8) * recoverT;
        } else if (attackProgress < 0.7) {
            // Windup backwards (overhead)
            let windupT = (attackProgress - 0.2) / 0.5;
            attackRot = (-Math.PI / 8) * (1 - windupT) + (-Math.PI / 1.1) * windupT;
        } else {
            // Brutal downward chop
            let strikeT = (attackProgress - 0.7) / 0.3;
            // Add ease-in for impact
            strikeT = strikeT * strikeT;
            attackRot = (-Math.PI / 1.1) * (1 - strikeT) + (Math.PI / 3) * strikeT;
        }
    }

    // Colors & Materials
    const cv = getCivColors(unit);
    const goldArmorColor = cv.bodyLight;
    const darkGold = cv.bodyDark;
    const clothBase = cv.bodyMid;
    const turbanColor = cv.bodyDark;
    const skinTone = cv.skinColor || '#a67b5b';

    let magicAura = 0;
    if (unit.magiCastActive) {
        magicAura = Math.random() * 0.5 + 0.5; // Pulsing glow
    }

    ctx.save();
    ctx.translate(0, 3);

    // Combat leaning posture
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.02);
        ctx.rotate(0.08);
    } else if (attackState) {
        ctx.rotate(0.12);
    }

    // ── MAGICAL AURA (WHEN CASTING) ──
    if (unit.magiCastActive) {
        ctx.globalAlpha = magicAura * 0.6;
        const aura = ctx.createRadialGradient(0, 5, 5, 0, 5, 25);
        aura.addColorStop(0, '#ffaa00');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(0, 5, 25, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ── LEGS & LONG ROBE ──
    ctx.fillStyle = clothBase;

    // Rear leg
    ctx.beginPath(); ctx.ellipse(-4 + legSwing, 12, 4.5, 6, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; // Boots
    ctx.beginPath(); ctx.ellipse(-4 + legSwing, 17, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = goldArmorColor; ctx.fillRect(-6 + legSwing, 12, 4, 4);

    // Flowing Robe Tail (Áo choàng dài chấm gót)
    ctx.fillStyle = clothBase;
    ctx.beginPath();
    ctx.moveTo(-7, 5 + walkBob);
    ctx.quadraticCurveTo(-14 + robeSway, 10 + walkBob, -12 + robeSway, 18 + walkBob);
    ctx.lineTo(-4 + robeSway, 18 + walkBob);
    ctx.lineTo(8, 5 + walkBob);
    ctx.fill();

    // Front leg
    ctx.fillStyle = clothBase;
    ctx.beginPath(); ctx.ellipse(4 - legSwing, 12, 4.5, 6, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(4 - legSwing, 17, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = goldArmorColor; ctx.fillRect(2 - legSwing, 12, 4, 4);

    // ── TORSO (Golden Scale Armor) ──
    ctx.fillStyle = '#111'; // Undershirt
    ctx.fillRect(-7.5, -2 + walkBob, 15, 12);

    // Scale Armor Cuirass (Áo giáp vảy vàng)
    ctx.fillStyle = goldArmorColor;
    ctx.beginPath();
    ctx.moveTo(-8, -6 + walkBob);
    ctx.lineTo(8, -6 + walkBob);
    ctx.lineTo(9.5, 6 + walkBob);
    ctx.lineTo(0, 10 + walkBob); // Pointed waist
    ctx.lineTo(-9.5, 6 + walkBob);
    ctx.fill();

    // Draw individual scales
    ctx.strokeStyle = darkGold;
    ctx.lineWidth = 0.5;
    for (let y = -5; y <= 8; y += 2.5) {
        ctx.beginPath();
        for (let x = -7; x <= 7; x += 3.5) {
            // Offset every other row
            const ox = (Math.abs(y % 5) === 0) ? x + 1.75 : x;
            if (Math.abs(ox) < 9 - (y * 0.2)) {
                ctx.arc(ox, y + walkBob, 1.8, 0, Math.PI);
            }
        }
        ctx.stroke();
    }

    // Golden Belt and Sash
    ctx.fillStyle = '#111';
    ctx.fillRect(-8, 5 + walkBob, 16, 2.5);
    ctx.fillStyle = darkGold;
    ctx.fillRect(-2.5, 4.5 + walkBob, 5, 3.5);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-1.5, 5.5 + walkBob, 3, 1.5);

    // Red Sash
    ctx.fillStyle = '#8b0000';
    ctx.beginPath(); ctx.moveTo(0, 7.5 + walkBob); ctx.quadraticCurveTo(4, 12, 6, 17 + walkBob); ctx.lineTo(2, 17 + walkBob); ctx.lineTo(-1, 7.5 + walkBob); ctx.fill();

    // ── FRONT ARM (Left — holds bow) — anchored at left shoulder ──
    ctx.save();
    let bowArmRot = 0;
    if (attackState) {
        bowArmRot = -Math.PI / 2 + 0.2; // Raise arm to aim
    } else {
        bowArmRot = moving ? (-Math.PI / 6 + Math.sin(bob * 0.8) * 0.05) : -Math.PI / 6;
    }
    ctx.translate(5, -2 + walkBob); // Left shoulder pivot
    ctx.rotate(bowArmRot);

    // Upper arm (sleeve)
    ctx.fillStyle = clothBase;
    ctx.fillRect(-2, 0, 4, 7);
    ctx.fillStyle = goldArmorColor;
    ctx.fillRect(-2.5, 0, 5, 3); // Pauldron
    ctx.fillStyle = darkGold;
    ctx.fillRect(-1.5, 5, 3, 3); // Bracer

    // Hand
    ctx.fillStyle = skinTone;
    ctx.beginPath(); ctx.arc(0, 9, 2, 0, Math.PI * 2); ctx.fill();

    // Bow — drawn at hand position
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(-bowArmRot + (attackState ? 0.05 * Math.min(attackProgress * 3, 1) : 0.15));

    // Golden Recurve Bow
    ctx.strokeStyle = goldArmorColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(8, -7, 2, 0);
    ctx.quadraticCurveTo(8, 7, 0, 14);
    ctx.stroke();

    // Bow grip
    ctx.fillStyle = '#6a3020';
    ctx.fillRect(-1, -2, 2, 4);

    // Bowstring & Arrow
    let bowPull = 0;
    if (attackState && attackProgress < 0.9) {
        bowPull = Math.min(attackProgress * 12, 8);
    }

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-bowPull, 0);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Arrow on bow
    if (attackState && attackProgress < 0.9) {
        ctx.fillStyle = '#111';
        ctx.fillRect(-bowPull, -0.5, 16 + bowPull, 1);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-bowPull, -1.5, 3, 3); // Fletching
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.moveTo(16, -1.5); ctx.lineTo(20, 0); ctx.lineTo(16, 1.5); ctx.fill();
    }

    ctx.restore(); // End bow context
    ctx.restore(); // End front arm

    // ── BACK ARM (Right — pulls bowstring) — anchored at right shoulder ──
    ctx.save();
    ctx.translate(-4, -2 + walkBob); // Right shoulder pivot

    let shoulderRot = 0;
    let elbowBend = 0;
    if (attackState) {
        const pullProgress = Math.min(attackProgress * 3, 1.0);
        const release = attackProgress > 0.9;
        if (release) {
            shoulderRot = 0.3; // Follow through
            elbowBend = -Math.PI / 5;
        } else {
            shoulderRot = -pullProgress * 0.5;
            elbowBend = -Math.PI / 4 - pullProgress * (Math.PI / 2.5);
        }
    } else {
        shoulderRot = moving ? -Math.sin(bob * 0.6) * 0.15 : -0.1;
        elbowBend = -Math.PI / 5;
    }
    ctx.rotate(shoulderRot);

    // Upper arm (sleeve)
    ctx.fillStyle = clothBase;
    ctx.fillRect(-2, 0, 4, 7);
    ctx.fillStyle = goldArmorColor;
    ctx.fillRect(-2.5, -1, 5, 3); // Pauldron

    // Elbow → forearm
    ctx.save();
    ctx.translate(0, 7);
    ctx.rotate(elbowBend);

    // Forearm + bracer
    ctx.fillStyle = darkGold;
    ctx.fillRect(-1.5, 0, 3, 4);
    // Hand
    ctx.fillStyle = skinTone;
    ctx.beginPath(); ctx.arc(0, 5.5, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End forearm
    ctx.restore(); // End back arm

    // Quiver on back
    if (!attackState) {
        ctx.save();
        ctx.translate(-5, -5 + walkBob);
        ctx.rotate(-45 * Math.PI / 180);
        ctx.fillStyle = darkGold;
        ctx.fillRect(-2, -5, 4, 18); // Quiver body
        ctx.fillStyle = '#111';
        ctx.fillRect(-2, -5, 4, 2); // Quiver rim

        // Arrows sticking out
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1.5, -9, 1, 4);
        ctx.fillRect(0.5, -8, 1, 3);
        ctx.restore();
    }

    // ── HEAD & TURBAN ──
    ctx.fillStyle = skinTone; ctx.fillRect(-3, -10 + walkBob, 6, 4); // Neck

    // Turban base
    ctx.fillStyle = turbanColor;
    ctx.beginPath(); ctx.arc(0, -12 + walkBob, 5.5, 0, Math.PI * 2); ctx.fill();

    // Turban wraps (Khăn quấn)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(0, -14 + walkBob, 6.5, 3.5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(0, -15 + walkBob, 5.5, 3, 0.2, 0, Math.PI * 2); ctx.fill();

    // Golden pin/jewel on turban
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.arc(0, -14 + walkBob, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(0, -14 + walkBob, 0.8, 0, Math.PI * 2); ctx.fill();

    // Iron Mesh Mask (Mặt nạ lưới sắt bao phủ nửa dưới khuôn mặt)
    if (age >= 4) {
        ctx.fillStyle = 'rgba(20, 20, 20, 0.8)'; // Dark veil base
        ctx.beginPath(); ctx.moveTo(-5, -10 + walkBob); ctx.lineTo(5, -10 + walkBob); ctx.lineTo(3, -5 + walkBob); ctx.lineTo(-3, -5 + walkBob); ctx.fill();

        ctx.strokeStyle = '#777'; ctx.lineWidth = 0.5;
        // Draw mesh grid
        for (let x = -4; x <= 4; x += 1.5) { ctx.beginPath(); ctx.moveTo(x, -10 + walkBob); ctx.lineTo(x * 0.6, -5 + walkBob); ctx.stroke(); }
        for (let y = -9; y <= -5; y += 1.5) { ctx.beginPath(); ctx.moveTo(-4 + (y + 10) * 0.5, y + walkBob); ctx.lineTo(4 - (y + 10) * 0.5, y + walkBob); ctx.stroke(); }
    } else {
        // Red scarf covering mouth
        ctx.fillStyle = '#8b0000';
        ctx.beginPath(); ctx.moveTo(-5, -10 + walkBob); ctx.lineTo(5, -10 + walkBob); ctx.lineTo(4, -6 + walkBob); ctx.lineTo(-4, -6 + walkBob); ctx.fill();
    }

    // Cold, piercing eyes
    ctx.fillStyle = unit.magiCastActive ? '#ffaa00' : '#fff'; // Glows golden when casting
    ctx.fillRect(-2.5, -12 + walkBob, 1.5, 1);
    ctx.fillRect(1.5, -12 + walkBob, 1.5, 1);
    if (!unit.magiCastActive) {
        ctx.fillStyle = '#000';
        ctx.fillRect(-2, -12 + walkBob, 0.5, 0.5);
        ctx.fillRect(2, -12 + walkBob, 0.5, 0.5);
    } else {
        // Eye flares
        ctx.fillStyle = 'rgba(255, 170, 0, 0.5)';
        ctx.beginPath(); ctx.arc(-2, -11.5 + walkBob, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2, -11.5 + walkBob, 2, 0, Math.PI * 2); ctx.fill();
    }

    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = goldArmorColor;
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++) {
            ctx.beginPath(); ctx.arc(12, 4 + walkBob - i * 4, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.restore();
    ctx.restore(); // Restore outer scale wrapper
}


/** Ninja — Yamato shinobi, sleek dark outfit, katana, flowing scarf */
export function drawNinja(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    ctx.save();
    ctx.scale(0.85, 0.85); // Thu nhỏ 15%
    let attackState = false;
    if (unit.state === UnitState.Attacking) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            const bldgRadius = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * 32 * 0.4 : 0;
            if (dist <= unit.civRange + bldgRadius + 20) {
                attackState = true;
            }
        }
    }
    const walkBob = moving ? Math.sin(bob * 0.5) * 2 : 0;
    const legSwing = moving ? Math.sin(bob * 0.7) * 4.5 : 0;
    const windSway = Math.sin(unit.animTimer * 5) * 2.5;

    // Advanced Stealth Materials
    let darkBase = ctx.createLinearGradient(0, -10, 0, 15);
    darkBase.addColorStop(0, age >= 4 ? '#050508' : '#111114');
    darkBase.addColorStop(1, age >= 4 ? '#1a1a24' : '#222228');

    let clothHighlight = age >= 4 ? '#252535' : '#33333d';
    let obiColor = unit.slotColor || (age >= 4 ? '#990000' : '#881111');
    const skinTone = '#ffcdaf';

    // Animation Phase
    let attackRot = 0;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (attackProgress < 0.2) {
            // Recover
            let t = attackProgress / 0.2;
            attackRot = (-Math.PI / 4) * (1 - t) + (-Math.PI / 8) * t;
        } else if (attackProgress < 0.7) {
            // Windup arm HIGH UP (overhead ready to stab/slash down)
            let t = (attackProgress - 0.2) / 0.5;
            attackRot = (-Math.PI / 8) * (1 - t) + (-Math.PI * 0.85) * t;
        } else {
            // Lightning fast downward strike
            let t = (attackProgress - 0.7) / 0.3;
            t = t * t; // ease in
            attackRot = (-Math.PI * 0.85) * (1 - t) + (-Math.PI / 4) * t;
        }
    }

    // Shadow Clone Afterimages
    if (moving) {
        ctx.globalAlpha = 0.15 + Math.sin(unit.animTimer * 20) * 0.05;
        ctx.save(); ctx.translate(-8, 0); ctx.rotate(-0.05); ctx.fillStyle = '#000000'; ctx.fillRect(-4, -10, 8, 20); ctx.restore();
        ctx.save(); ctx.translate(-16, 0); ctx.rotate(-0.1); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-3, -8, 6, 16); ctx.restore();
        ctx.globalAlpha = 1;

        // Speed lines
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = age >= 4 ? '#8a2be2' : '#4169e1';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const trailY = Math.random() * 20 - 5;
            const trailLen = 10 + Math.random() * 8;
            ctx.moveTo(-5, trailY + walkBob); ctx.lineTo(-5 - trailLen, trailY + walkBob); ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    ctx.save();
    // Aggressive stealth crouch
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.03);
        ctx.rotate(0.2); // Chạy thì chúi người
        ctx.translate(0, 4);
    } else if (attackState) {
        ctx.rotate(0.15); // Lean into attack
        ctx.translate(0, 4);
    } else {
        // Đứng yên thì thẳng người, oai vệ, nhịp thở bồng bềnh
        ctx.rotate(0);
        ctx.translate(0, 4 + Math.sin(unit.animTimer * 5) * 0.5);
    }

    // Flowing Headband Tails
    ctx.fillStyle = obiColor;
    ctx.save();
    ctx.translate(-2, -12 + walkBob);
    ctx.rotate((moving ? 0.4 : 0.1) + Math.sin(unit.animTimer * 8) * 0.3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -3 - windSway, -14 - windSway * 2, -5 + Math.cos(unit.animTimer * 10) * 2); ctx.quadraticCurveTo(-6, 2, 0, 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 1); ctx.quadraticCurveTo(-5, 0 - windSway, -11 - windSway * 1.5, -2 + Math.sin(unit.animTimer * 9) * 2); ctx.quadraticCurveTo(-4, 3, 0, 3); ctx.fill();
    ctx.restore();

    // ── LEGS ──
    ctx.fillStyle = darkBase;
    ctx.fillRect(-5.5 + legSwing, 6, 4.5, 11);
    ctx.fillRect(1.5 - legSwing, 6, 4.5, 11);

    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(-5.5 + legSwing, 10 + i * 2); ctx.lineTo(-1 + legSwing, 11.5 + i * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-1 + legSwing, 10 + i * 2); ctx.lineTo(-5.5 + legSwing, 11.5 + i * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(1.5 - legSwing, 10 + i * 2); ctx.lineTo(6 - legSwing, 11.5 + i * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6 - legSwing, 10 + i * 2); ctx.lineTo(1.5 - legSwing, 11.5 + i * 2); ctx.stroke();
    }

    ctx.fillStyle = '#050505';
    ctx.fillRect(-6.5 + legSwing, 17, 5.5, 2);
    ctx.fillRect(0.5 - legSwing, 17, 5.5, 2);
    ctx.fillStyle = skinTone;
    ctx.fillRect(-2 + legSwing, 17, 0.5, 1);
    ctx.fillRect(5 - legSwing, 17, 0.5, 1);

    // ── TORSO ──
    ctx.fillStyle = darkBase;
    ctx.beginPath(); ctx.moveTo(-6.5, -6 + walkBob); ctx.lineTo(6.5, -6 + walkBob); ctx.lineTo(5.5, 7 + walkBob); ctx.lineTo(-5.5, 7 + walkBob); ctx.fill();

    ctx.strokeStyle = clothHighlight; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3, -6 + walkBob); ctx.lineTo(1, 2 + walkBob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, -6 + walkBob); ctx.lineTo(-1, 2 + walkBob); ctx.stroke();

    if (age >= 4) {
        ctx.fillStyle = '#222'; ctx.fillRect(-2.5, -7 + walkBob, 5, 2.5);
        ctx.fillStyle = '#888';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-2, -6.5 + i + walkBob, 4, 0.5);
            ctx.fillRect(-1.5 + i * 1.5, -7 + walkBob, 0.5, 2);
        }
    }

    ctx.fillStyle = obiColor; ctx.fillRect(-6.5, 4.5 + walkBob, 13, 3.5);
    ctx.fillStyle = '#660000'; ctx.fillRect(-4, 4 + walkBob, 4, 4); ctx.fillRect(-4, 8 + walkBob, 2, 3);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-6.5, 5 + walkBob, 3, 4); ctx.fillRect(4.5, 5 + walkBob, 2.5, 4);
    ctx.fillStyle = '#555'; ctx.fillRect(-5.5, 6 + walkBob, 1, 1);

    // ── LEFT ARM (Shuriken / Defensive Posture) ──
    ctx.save();
    ctx.translate(4, -2 + walkBob);

    if (attackState && attackProgress < 0.5) {
        ctx.rotate(-Math.PI / 4); // Throwing/preparing motion
        ctx.translate(2, -2);
    } else {
        const leftRot = moving ? (20 * Math.PI / 180) + Math.sin(bob * 0.8) * 0.1 : (30 * Math.PI / 180);
        ctx.rotate(leftRot);
    }

    ctx.fillStyle = darkBase; ctx.fillRect(0, 0, 3.5, 8);
    ctx.fillStyle = clothHighlight; ctx.fillRect(0, 4, 3.5, 4);
    ctx.fillStyle = skinTone; ctx.fillRect(0.5, 8, 2.5, 2.5);
    ctx.fillStyle = '#111'; ctx.fillRect(0.5, 8, 2.5, 1.5);

    if (attackState && attackProgress < 0.5) {
        ctx.fillStyle = '#eee';
        ctx.beginPath(); ctx.moveTo(1.5, 10); ctx.lineTo(2.5, 12); ctx.lineTo(4, 12.5); ctx.lineTo(2.5, 13); ctx.lineTo(1.5, 15); ctx.lineTo(0.5, 13); ctx.lineTo(-1, 12.5); ctx.lineTo(0.5, 12); ctx.fill();
    }
    ctx.restore();

    // ── RIGHT ARM & REVERSE-GRIP NINJATO ──
    ctx.save();
    ctx.translate(-4.5, -2 + walkBob);

    if (attackState) {
        ctx.rotate(attackRot);
        ctx.translate(-4, -2);
    } else {
        const walkRot = moving ? -Math.sin(bob * 0.6) * 0.5 : -0.1;
        ctx.rotate(walkRot);
    }

    ctx.fillStyle = darkBase; ctx.fillRect(-2, 0, 3.5, 8);
    ctx.fillStyle = clothHighlight; ctx.fillRect(-2, 5, 3.5, 4);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-2, 7); ctx.lineTo(1.5, 7); ctx.stroke();

    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 9, 2.5, 2.5);
    ctx.fillStyle = '#111'; ctx.fillRect(-1.5, 9, 2.5, 1.5);

    if (attackState) {
        ctx.translate(-1, 10);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-1.5, -5, 2.5, 7);
        ctx.fillStyle = '#a1a1a1';
        ctx.beginPath(); ctx.moveTo(-1.5, -4); ctx.lineTo(-0.25, -3); ctx.lineTo(1, -4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1.5, -2); ctx.lineTo(-0.25, -1); ctx.lineTo(1, -2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(-0.25, 1); ctx.lineTo(1, 0); ctx.fill();

        ctx.fillStyle = '#444'; ctx.fillRect(-2, -6, 3.5, 1.5);
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-3, 2, 5.5, 2);

        const bladeColor = ctx.createLinearGradient(-1, 0, 1, 0);
        bladeColor.addColorStop(0, '#555'); bladeColor.addColorStop(0.5, '#eee'); bladeColor.addColorStop(1, '#888');

        ctx.fillStyle = bladeColor;
        ctx.beginPath(); ctx.moveTo(-1.5, 4); ctx.lineTo(-1.5, 16); ctx.lineTo(1, 14); ctx.lineTo(1, 4); ctx.fill();

        ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, 4);
        for (let i = 5; i < 14; i += 2) { ctx.lineTo(0.5, i); ctx.lineTo(-0.5, i + 1); }
        ctx.stroke();

        if (age >= 4) {
            ctx.shadowColor = '#8a2be2'; ctx.shadowBlur = 5 + Math.sin(unit.animTimer * 10) * 3;
            ctx.strokeStyle = '#d8b2ff'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(1, 4); ctx.lineTo(1, 14); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-1.5, 4); ctx.lineTo(-1.5, 16); ctx.lineTo(0.5, 16); ctx.fill();

        // Speed motion blur on slash
        if (attackProgress > 0.5) {
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.moveTo(1, 14); ctx.lineTo(8, 12); ctx.lineTo(1, 6); ctx.fill();
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#990000'; ctx.globalAlpha = 0.8;
            ctx.beginPath(); ctx.arc(-0.5, 12, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    ctx.restore();

    // ---- SCABBARD (Saya) SLUNG ON BACK ----
    ctx.save();
    ctx.translate(0, -4 + walkBob);
    ctx.rotate(Math.PI / 3.5);

    ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.roundRect(-2, -8, 4, 30, 1.5); ctx.fill();
    ctx.fillStyle = obiColor; ctx.fillRect(-2, -5, 4, 1.5); ctx.fillRect(-2, 3, 4, 1.5);
    ctx.fillStyle = '#333'; ctx.fillRect(-2, 21, 4, 1.5);

    if (!attackState) {
        ctx.translate(0, -8);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-1.5, -8, 3, 8);
        ctx.fillStyle = '#a1a1a1';
        ctx.beginPath(); ctx.moveTo(-1.5, -6); ctx.lineTo(0, -5); ctx.lineTo(1.5, -6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1.5, -4); ctx.lineTo(0, -3); ctx.lineTo(1.5, -4); ctx.fill();
        ctx.fillStyle = '#444'; ctx.fillRect(-2, -9, 4, 1.5);
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-3, -1, 6, 1.5);
    }
    ctx.restore();

    // ── HEAD ──
    ctx.fillStyle = darkBase; ctx.beginPath(); ctx.arc(0, -12 + walkBob, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -16 + walkBob); ctx.lineTo(1, -16 + walkBob); ctx.lineTo(0, -12 + walkBob); ctx.fill();

    ctx.fillStyle = skinTone; ctx.fillRect(-3, -13 + walkBob, 7, 3);
    ctx.fillStyle = clothHighlight; ctx.fillRect(-4, -10 + walkBob, 9, 5);
    ctx.beginPath(); ctx.moveTo(-4, -10 + walkBob); ctx.lineTo(-1, -12 + walkBob); ctx.lineTo(5, -10 + walkBob); ctx.fill();

    ctx.fillStyle = '#fff'; ctx.fillRect(-2, -12 + walkBob, 2, 1); ctx.fillRect(2, -12 + walkBob, 2, 1);
    ctx.fillStyle = '#111'; ctx.fillRect(-1, -12 + walkBob, 1, 1); ctx.fillRect(2, -12 + walkBob, 1, 1);

    if (age >= 4) {
        ctx.globalAlpha = 0.6 + Math.sin(unit.animTimer * 10) * 0.4;
        ctx.fillStyle = '#ff1133';
        ctx.fillRect(-1.5, -12 + walkBob, 1.5, 1.5); ctx.fillRect(2.5, -12 + walkBob, 1.5, 1.5);

        if (moving) {
            ctx.beginPath(); ctx.moveTo(-1, -11.5 + walkBob); ctx.quadraticCurveTo(-6, -12 + walkBob, -10 - Math.random() * 4, -13 + walkBob); ctx.lineTo(-1, -10.5 + walkBob); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = '#6600cc';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++) ctx.fillRect(-9, 4 + walkBob - i * 3, 2, 2);
    }
    ctx.restore();
    ctx.restore(); // Restore outer scale wrapper
}

/** Centurion — La Mã commander, red-crested helmet, scutum shield, gladius */
export function drawCenturion(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    ctx.save();
    ctx.scale(0.85, 0.85); // Thu nhỏ 15%
    const attackState = unit.state === UnitState.Attacking;
    const walkBob = moving ? Math.sin(bob * 0.5) * 2 : 0;
    const legSwing = moving ? Math.sin(bob * 0.6) * 5 : 0;

    // Animation Phase (Gladius/Spear)
    let attackRot = 0;
    let attackProgress = 0;
    let attackThrust = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    let isRangedThrow = false;
    let isMeleeThrust = false;

    if (unit.centurionMode === 'spear') {
        const cd = unit.centurionPilumCooldown;
        isRangedThrow = cd > 0 && cd < 3.0 && Boolean(
            (unit.attackTarget && Math.hypot(unit.attackTarget.x - unit.x, unit.attackTarget.y - unit.y) > 40) ||
            (unit.attackBuildingTarget && Math.hypot(unit.attackBuildingTarget.x - unit.x, unit.attackBuildingTarget.y - unit.y) > 40)
        );
        isMeleeThrust = attackState && !isRangedThrow;
    }

    if (isRangedThrow) {
        const cd = unit.centurionPilumCooldown;
        if (cd > 0.15) {
            const prepProgress = 1 - ((cd - 0.15) / 0.85);
            attackRot = (-Math.PI / 6) - prepProgress * (Math.PI / 3);
        } else {
            const swingProgress = cd <= 0 ? 1 : 1 - (cd / 0.15);
            attackRot = (-Math.PI / 2) + swingProgress * Math.PI;
        }
    } else if (isMeleeThrust) {
        if (attackProgress < 0.4) {
            // Windup: rotate arm to horizontal, pull bident back
            const t = attackProgress / 0.4;
            const ease = t * t * (3 - 2 * t);
            attackRot = ease * (Math.PI / 2 - 0.3); // Rotate toward horizontal (forward)
            attackThrust = ease * 10; // Pull back along weapon axis
        } else if (attackProgress < 0.6) {
            // Strike: explosive forward thrust (horizontal)
            const t = (attackProgress - 0.4) / 0.2;
            const easeOut = 1 - Math.pow(1 - t, 4);
            attackRot = (Math.PI / 2 - 0.3) + easeOut * 0.3; // Fully horizontal
            attackThrust = 10 - easeOut * 30; // Lunge forward hard
        } else if (attackProgress < 0.75) {
            // Impact hold
            const t = (attackProgress - 0.6) / 0.15;
            attackRot = Math.PI / 2;
            attackThrust = -20 - t * 2;
        } else {
            // Recovery: pull back to idle
            const t = (attackProgress - 0.75) / 0.25;
            const easeIn = t * t * t;
            attackRot = (Math.PI / 2) * (1 - easeIn) + (-Math.PI / 6) * easeIn;
            attackThrust = -22 * (1 - easeIn);
        }
    } else if (unit.centurionMode === 'sword') {
        if (attackState) {
            if (attackProgress < 0.2) {
                let t = attackProgress / 0.2;
                attackRot = (Math.PI / 4) * (1 - t) + (-Math.PI / 10) * t;
            } else if (attackProgress < 0.6) {
                let t = (attackProgress - 0.2) / 0.4;
                attackRot = (-Math.PI / 10) * (1 - t) + (-Math.PI / 1.5) * t; // Windup overhead
            } else {
                let t = (attackProgress - 0.6) / 0.4;
                t = t * t;
                attackRot = (-Math.PI / 1.5) * (1 - t) + (Math.PI / 6) * t; // Strike down
            }
        }
    }

    const cv = getCivColors(unit);
    const ironColor = '#8899aa';
    const brassColor = age >= 4 ? '#ffd700' : '#b8860b';
    const darkRed = cv.bodyDark;
    const brightRed = cv.bodyMid;
    const skinTone = '#d29676';
    const leather = '#5a3a1a';

    ctx.save();
    ctx.translate(0, 4);

    if (moving && !attackState) {
        ctx.rotate(0.05);
    }

    if (age >= 3) {
        ctx.fillStyle = darkRed;
        const capeWave = moving ? Math.sin(bob * 0.8) * 3 : 0;
        ctx.beginPath();
        ctx.moveTo(-5, -6 + walkBob);
        ctx.quadraticCurveTo(-15, 0, -12 + capeWave, 16 + walkBob);
        ctx.lineTo(-6 + capeWave, 18 + walkBob);
        ctx.lineTo(2, 6 + walkBob);
        ctx.fill();
    }

    ctx.fillStyle = '#111';
    ctx.fillRect(-5 + legSwing, 8, 4.5, 9);
    ctx.fillRect(1 - legSwing, 8, 4.5, 9);

    if (age >= 4) {
        ctx.fillStyle = brassColor;
        ctx.fillRect(-5.5 + legSwing, 10, 5.5, 6);
        ctx.fillRect(0.5 - legSwing, 10, 5.5, 6);
    } else {
        ctx.fillStyle = skinTone;
        ctx.fillRect(-4.5 + legSwing, 10, 3.5, 6);
        ctx.fillRect(1.5 - legSwing, 10, 3.5, 6);
    }

    ctx.fillStyle = '#4a2f1d';
    ctx.fillRect(-5.5 + legSwing, 17, 5.5, 2);
    ctx.fillRect(0.5 - legSwing, 17, 5.5, 2);
    ctx.fillStyle = skinTone;
    ctx.fillRect(-4.5 + legSwing, 17.5, 1, 1);
    ctx.fillRect(2.5 - legSwing, 17.5, 1, 1);

    // Apply upper-body lean AFTER legs (only torso/arms/head tilt)
    if (isMeleeThrust) {
        let bodyLean = 0;
        if (attackProgress < 0.4) {
            bodyLean = -(attackProgress / 0.4) * 0.2;
        } else if (attackProgress < 0.6) {
            const t = (attackProgress - 0.4) / 0.2;
            bodyLean = -0.2 + t * 0.5;
        } else if (attackProgress < 0.75) {
            bodyLean = 0.3;
        } else {
            const t = (attackProgress - 0.75) / 0.25;
            bodyLean = 0.3 * (1 - t);
        }
        ctx.rotate(bodyLean);
    }

    ctx.fillStyle = darkRed;
    ctx.fillRect(-6, 2 + walkBob, 12, 6);
    ctx.fillStyle = leather;
    for (let x = -5; x <= 5; x += 3) {
        ctx.fillRect(x, 4 + walkBob, 2, 6);
        ctx.fillStyle = brassColor;
        ctx.fillRect(x, 8 + walkBob, 2, 1);
        ctx.fillStyle = leather;
    }

    ctx.fillStyle = darkRed;
    ctx.fillRect(-6.5, -6 + walkBob, 13, 10);
    ctx.fillStyle = ironColor;
    ctx.fillRect(-7, -5 + walkBob, 14, 9);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = -4; y <= 3; y += 2) {
        ctx.fillRect(-7, y + walkBob, 14, 0.5);
    }

    ctx.fillStyle = leather;
    ctx.fillRect(-7.5, 2 + walkBob, 15, 3);
    ctx.fillStyle = brassColor;
    ctx.fillRect(-2, 1.5 + walkBob, 4, 4);
    for (let x = -2; x <= 2; x += 2) {
        ctx.fillRect(x, 5 + walkBob, 1, 5);
        ctx.beginPath(); ctx.arc(x + 0.5, 10 + walkBob, 1, 0, Math.PI * 2); ctx.fill();
    }

    // LEFT ARM & SCUTUM SHIELD
    ctx.save();
    ctx.translate(8, -2 + walkBob);

    if (unit.centurionShielding) {
        ctx.translate(-2, 0);
    } else {
        const shieldBob = moving ? Math.sin(bob * 0.8) * 1 : 0;
        ctx.translate(0, shieldBob);
    }

    ctx.fillStyle = brightRed;
    if (unit.slotColor) {
        ctx.fillStyle = unit.slotColor;
    }

    ctx.beginPath();
    ctx.roundRect(-3, -11, 10, 24, 2);
    ctx.fill();

    ctx.strokeStyle = brassColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-3, -11, 10, 24, 2); ctx.stroke();

    ctx.fillStyle = ironColor;
    ctx.fillRect(-1, -2, 6, 6);
    ctx.fillStyle = brassColor;
    ctx.beginPath(); ctx.arc(2, 1, 2, 0, Math.PI * 2); ctx.fill();

    if (age >= 3) {
        ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(-3, -4); ctx.lineTo(-3, -8); ctx.lineTo(-1, -4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(-3, 6); ctx.lineTo(-3, 10); ctx.lineTo(-1, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(5, 1); ctx.lineTo(7, -4); ctx.lineTo(7, -8); ctx.lineTo(5, -4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(5, 1); ctx.lineTo(7, 6); ctx.lineTo(7, 10); ctx.lineTo(5, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(1, -10); ctx.lineTo(3, -12); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(3, 12); ctx.lineTo(1, 14); ctx.fill();
    }
    ctx.restore();

    // RIGHT ARM & WEAPON (behind body, opposite shield)
    ctx.save();
    ctx.translate(-5, -1 + walkBob);

    let currentRot = moving && !attackState ? -Math.sin(bob * 0.6) * 0.2 : 0;
    if (attackState || isRangedThrow) {
        currentRot = attackRot;
    } else if (unit.centurionMode === 'spear') {
        currentRot = Math.PI / 2.5; // Nearly horizontal, combat stance
    }
    ctx.rotate(currentRot);

    // Shoulder plate (pauldron)
    ctx.fillStyle = ironColor;
    ctx.fillRect(-3, -3, 6, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-3, -1, 6, 0.5);

    // Upper arm
    ctx.fillStyle = skinTone;
    ctx.fillRect(-2, 1, 4, 5);

    // Forearm with leather bracer
    ctx.fillStyle = leather; ctx.fillRect(-2.5, 5, 5, 5);
    ctx.fillStyle = brassColor; ctx.fillRect(-2.5, 5, 5, 1);
    ctx.fillStyle = brassColor; ctx.fillRect(-2.5, 9, 5, 1);

    // Hand gripping spear shaft
    ctx.fillStyle = skinTone;
    ctx.fillRect(-2, 10, 4, 3);
    // Fingers wrapping around shaft
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(-1.5, 10.5, 3, 0.5);
    ctx.fillRect(-1.5, 12, 3, 0.5);

    if (unit.centurionMode === 'spear') {
        if (unit.centurionPilumCooldown <= 1.5 || !isRangedThrow) {
            ctx.translate(0, 10 + attackThrust);
            if (isRangedThrow && attackState) {
                ctx.translate(0, -10);
            }

            // ═══ CENTURION HASTA — Elite Roman Spear ═══
            // Polished ash shaft
            const shaftGrad = ctx.createLinearGradient(-2, 0, 2, 0);
            shaftGrad.addColorStop(0, '#2a1808');
            shaftGrad.addColorStop(0.3, '#5a3818');
            shaftGrad.addColorStop(0.7, '#4a2e14');
            shaftGrad.addColorStop(1, '#2a1808');
            ctx.fillStyle = shaftGrad; ctx.fillRect(-1.5, -16, 3, 36);

            // Leather grip wrapping
            ctx.fillStyle = '#3a2010';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(-2, -2 + i * 4, 4, 1.5);
            }

            // Ornate brass collar (socket)
            ctx.fillStyle = brassColor;
            ctx.fillRect(-2.5, -16, 5, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(-2.5, -16, 5, 1);
            ctx.fillStyle = '#8a6a08';
            ctx.fillRect(-2.5, -14, 5, 0.5);

            // Iron tang
            ctx.fillStyle = ironColor; ctx.fillRect(-1, -20, 2, 5);

            // Elegant spearhead (compact leaf blade)
            const bladeGrad = ctx.createLinearGradient(-2.5, -26, 2.5, -26);
            bladeGrad.addColorStop(0, age >= 4 ? '#ccc' : '#999');
            bladeGrad.addColorStop(0.4, age >= 4 ? '#f5f5f5' : '#ddd');
            bladeGrad.addColorStop(0.6, age >= 4 ? '#f5f5f5' : '#ddd');
            bladeGrad.addColorStop(1, age >= 4 ? '#aaa' : '#888');
            ctx.fillStyle = bladeGrad;
            ctx.beginPath();
            ctx.moveTo(0, -32);          // Sharp tip
            ctx.quadraticCurveTo(-1.5, -29, -2.5, -26); // Smooth left edge
            ctx.lineTo(-2.5, -23);       // Max width
            ctx.quadraticCurveTo(-1.5, -21, -1, -20); // Taper to tang
            ctx.lineTo(1, -20);
            ctx.quadraticCurveTo(1.5, -21, 2.5, -23);
            ctx.lineTo(2.5, -26);
            ctx.quadraticCurveTo(1.5, -29, 0, -32);
            ctx.closePath(); ctx.fill();

            // Blood groove (fuller)
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(-0.6, -30, 0.4, 9);
            ctx.fillRect(0.2, -30, 0.4, 9);

            // Center ridge (raised)
            ctx.fillStyle = age >= 4 ? '#fff' : '#eee';
            ctx.fillRect(-0.2, -31, 0.4, 10);

            // Edge highlights
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(-2.5, -26); ctx.quadraticCurveTo(-1.5, -29, 0, -32); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(2.5, -26); ctx.quadraticCurveTo(1.5, -29, 0, -32); ctx.stroke();

            // Decorative brass pommel spike
            ctx.fillStyle = brassColor;
            ctx.fillRect(-2, 12, 4, 2.5);
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-2, 12, 4, 0.5);
            ctx.fillStyle = ironColor;
            ctx.beginPath(); ctx.moveTo(-1, 14.5); ctx.lineTo(0, 18); ctx.lineTo(1, 14.5); ctx.fill();
        }
    } else {
        ctx.translate(0, 11);
        ctx.fillStyle = '#3a2010'; ctx.fillRect(-1.5, -3, 3, -4);
        ctx.fillStyle = brassColor;
        ctx.beginPath(); ctx.arc(0, -7, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -3, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = ironColor;
        ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(-1.5, 12); ctx.lineTo(0, 16); ctx.lineTo(1.5, 12); ctx.lineTo(2, -1); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 16); ctx.lineTo(-1.5, 12); ctx.lineTo(-2, -1); ctx.fill(); ctx.globalAlpha = 1;

        if (attackState && attackProgress > 0.6) {
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.moveTo(0, 16); ctx.quadraticCurveTo(8, 12, 4, -2); ctx.lineTo(-2, -1); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(200, 0, 0, 0.7)';
            ctx.beginPath(); ctx.arc(0, 14, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();

    // HEAD & GALEA
    ctx.fillStyle = skinTone;
    ctx.fillRect(-3, -11 + walkBob, 6, 6);

    ctx.fillStyle = ironColor;
    ctx.beginPath(); ctx.arc(0, -12 + walkBob, 5.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(-6, -12 + walkBob, 12, 3);

    ctx.fillStyle = brassColor;
    ctx.fillRect(-6.5, -11 + walkBob, 13, 1.5);
    ctx.fillRect(-4, -13 + walkBob, 8, 1);

    ctx.fillStyle = ironColor;
    ctx.beginPath(); ctx.moveTo(-5.5, -9 + walkBob); ctx.lineTo(-3.5, -4 + walkBob); ctx.lineTo(-2.5, -4 + walkBob); ctx.lineTo(-2.5, -9 + walkBob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5.5, -9 + walkBob); ctx.lineTo(3.5, -4 + walkBob); ctx.lineTo(2.5, -4 + walkBob); ctx.lineTo(2.5, -9 + walkBob); ctx.fill();

    ctx.fillStyle = '#111';
    ctx.fillRect(-2, -9 + walkBob, 1, 1); ctx.fillRect(1, -9 + walkBob, 1, 1);

    // TRANSVERSAL CREST
    ctx.save();
    ctx.translate(0, -17 + walkBob);

    ctx.fillStyle = brassColor;
    ctx.fillRect(-1.5, 0, 3, 3);

    const plumeGradient = ctx.createLinearGradient(-7, 0, 7, 0);
    plumeGradient.addColorStop(0, cv.bodyDark);
    plumeGradient.addColorStop(0.5, cv.bodyLight);
    plumeGradient.addColorStop(1, cv.bodyDark);
    ctx.fillStyle = plumeGradient;

    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.quadraticCurveTo(-9, -5, -4, -7);
    ctx.quadraticCurveTo(0, -8, 4, -7);
    ctx.quadraticCurveTo(9, -5, 7, 0);
    ctx.quadraticCurveTo(4, -1, 0, -1);
    ctx.quadraticCurveTo(-4, -1, -7, 0);
    ctx.fill();

    ctx.strokeStyle = cv.bodyDark; ctx.lineWidth = 0.5;
    for (let c = -6; c <= 6; c += 2) {
        ctx.beginPath(); ctx.moveTo(c, -1); ctx.lineTo(c * 1.2, -6); ctx.stroke();
    }
    ctx.restore();

    if (typeof unit.centurionMeleeHits === 'number' && unit.centurionMeleeHits > 0) {
        ctx.fillStyle = unit.centurionMeleeHits >= 3 ? '#ff2222' : '#ffaa00';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(-14, -20 + bob, 3 + unit.centurionMeleeHits, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    if (age >= 4) {
        ctx.globalAlpha = 0.05 + Math.sin(unit.animTimer * 3) * 0.03;
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(0, 0 + bob, 20, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = brassColor;
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++) {
            ctx.beginPath(); ctx.arc(12, 6 + bob - i * 4, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.restore();
    ctx.restore(); // Restore outer scale wrapper
}


/** Viking Ulfhednar — Sói cuồng nộ, đội lốt chó sói, cởi trần xăm mình, song rìu đẫm máu */
export function drawUlfhednar(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    ctx.save();
    ctx.scale(0.85, 0.85); // Thu nhỏ 15%
    let attackState = false;
    if (unit.state === UnitState.Attacking) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            const bldgRadius = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * 32 * 0.4 : 0;
            if (dist <= unit.civRange + bldgRadius + 20) {
                attackState = true;
            }
        }
    }
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 5 : 0;
    const breatheSway = Math.sin(unit.animTimer * 5) * 1.5;

    const rage = unit.ulfhednarRageActive;
    let bloodHue = rage ? '#ff0000' : '#880000';
    let tattooColor = rage ? ctx.createLinearGradient(0, -5, 0, 5) : '#1a4e6e';
    if (rage) {
        (tattooColor as CanvasGradient).addColorStop(0, '#00ffff');
        (tattooColor as CanvasGradient).addColorStop(1, '#0088ff');
    }

    const cv = getCivColors(unit);
    const skinColor = '#c28359';
    const shadowSkin = '#8f5a38';

    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    let bodyTilt = moving ? 0.25 : 0.05; // Giảm độ hưng phấn, đứng thẳng hơn khi Idle
    if (attackState) {
        // Savage lunging
        if (attackProgress < 0.2) bodyTilt = 0.05; // Windup
        else if (attackProgress < 0.5) bodyTilt = 0.4; // Strike 1 lunge
        else if (attackProgress < 0.7) bodyTilt = 0.2; // Recover
        else bodyTilt = 0.5; // Strike 2 lunge
    }

    ctx.save();
    ctx.translate(0, 16 + bob);
    ctx.rotate(bodyTilt);
    ctx.translate(0, -(16 + bob));

    // ── ĐÔI CHÂN ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-5.5, 10 + bob, 5, 8 + legOffset);
    ctx.fillRect(1.5, 10 + bob, 5, 8 - legOffset);

    ctx.fillStyle = shadowSkin;
    ctx.beginPath(); ctx.ellipse(-3, 13 + bob + legOffset, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, 13 + bob - legOffset, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5.5, 12 + bob + legOffset, 5.5, 5);
    ctx.fillRect(1.5, 12 + bob - legOffset, 5.5, 5);
    ctx.fillStyle = cv.accent;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-5.5, 12 + bob + legOffset, 5.5, 2);
    ctx.fillRect(1.5, 12 + bob - legOffset, 5.5, 2);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#221100'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(-5.5, 12.5 + bob + legOffset + i * 1.5); ctx.lineTo(0, 13.5 + bob + legOffset + i * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(1.5, 12.5 + bob - legOffset + i * 1.5); ctx.lineTo(7, 13.5 + bob - legOffset + i * 1.5); ctx.stroke();
    }

    ctx.fillStyle = '#22140a';
    ctx.beginPath(); ctx.roundRect(-6.5, 18 + bob + legOffset, 7, 3, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(0.5, 18 + bob - legOffset, 7, 3, 2); ctx.fill();

    // ── THÂN HÌNH CỞI TRẦN VẠM VỠ ──
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.moveTo(-7.5, -4 + bob - breatheSway); ctx.lineTo(7.5, -4 + bob - breatheSway); ctx.lineTo(6, 4 + bob); ctx.lineTo(7, 10 + bob); ctx.lineTo(-7, 10 + bob); ctx.lineTo(-6, 4 + bob); ctx.fill();

    ctx.fillStyle = shadowSkin;
    ctx.beginPath(); ctx.ellipse(-3.5, -1 + bob - breatheSway / 2, 3, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.5, -1 + bob - breatheSway / 2, 3, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    for (let r = 0; r < 4; r++) { ctx.fillRect(-4.5, 2 + bob + r * 1.5, 4, 1); ctx.fillRect(0.5, 2 + bob + r * 1.5, 4, 1); }
    ctx.fillRect(-0.5, -3 + bob, 1, 10);
    ctx.fillStyle = '#5c3a21'; ctx.beginPath(); ctx.arc(0, 8 + bob, 0.8, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#a6594d'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-6, -2 + bob); ctx.lineTo(2, 4 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -1 + bob); ctx.lineTo(1, 5 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 0 + bob); ctx.lineTo(7, 2 + bob); ctx.stroke();

    ctx.strokeStyle = tattooColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = rage ? 0.9 + Math.sin(unit.animTimer * 15) * 0.1 : 0.7;
    ctx.beginPath(); ctx.moveTo(-6.5, -4 + bob); ctx.quadraticCurveTo(-2, 0 + bob, -5, 5 + bob); ctx.stroke();
    ctx.beginPath(); ctx.arc(-5, 0 + bob, 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6.5, -4 + bob); ctx.quadraticCurveTo(2, 0 + bob, 5, 5 + bob); ctx.stroke();
    ctx.globalAlpha = 1;

    // ── THẮT LƯNG VÀ KILT DA THÚ ──
    ctx.fillStyle = cv.bodyDark; ctx.fillRect(-7.5, 10 + bob, 15, 3.5);
    ctx.fillStyle = cv.bodyLight; ctx.beginPath(); ctx.arc(0, 11.5 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 11.5 + bob, 1, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath(); ctx.moveTo(-7, 13 + bob); ctx.lineTo(7, 13 + bob); ctx.lineTo(10, 18 + bob); ctx.lineTo(4, 16 + bob); ctx.lineTo(0, 19 + bob); ctx.lineTo(-4, 16 + bob); ctx.lineTo(-10, 18 + bob); ctx.fill();

    const peltGradient = ctx.createLinearGradient(0, 13 + bob, 0, 18 + bob);
    peltGradient.addColorStop(0, '#665544'); peltGradient.addColorStop(1, '#332a22');
    ctx.fillStyle = peltGradient;
    ctx.beginPath(); ctx.moveTo(-5, 13 + bob); ctx.lineTo(5, 13 + bob); ctx.lineTo(6, 17 + bob); ctx.lineTo(1, 15 + bob); ctx.lineTo(-1, 18 + bob); ctx.lineTo(-6, 17 + bob); ctx.fill();

    ctx.fillStyle = '#221a11'; ctx.beginPath(); ctx.moveTo(-9, -4 + bob); ctx.quadraticCurveTo(-12, 5 + bob, -8, 8 + bob); ctx.fill();

    // ── ĐẦU & LỐT SÓI (Wolf Pelt Headdress) ──
    const peltSway = moving ? Math.cos(unit.animTimer * 12) * 2 : 0;

    ctx.save();
    ctx.translate(0, -9 + bob - breatheSway * 0.5);
    ctx.rotate(-0.15 + (moving ? 0.05 : 0));

    ctx.fillStyle = cv.bodyDark;
    ctx.beginPath(); ctx.moveTo(-5, -3); ctx.quadraticCurveTo(-14, 3 - peltSway, -13, 8 + peltSway); ctx.quadraticCurveTo(-8, 3, -4, 4); ctx.fill();

    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath(); ctx.arc(0, -6, 6, Math.PI, Math.PI * 2); ctx.lineTo(6.5, -1); ctx.lineTo(-6.5, -1); ctx.fill();

    ctx.fillStyle = cv.bodyDark;
    ctx.beginPath(); ctx.moveTo(-3.5, -10.5); ctx.lineTo(-6.5, -16); ctx.lineTo(-1, -10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3.5, -10.5); ctx.lineTo(6.5, -16); ctx.lineTo(1, -10); ctx.fill();

    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(6, -2, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(5, -4); ctx.stroke();

    ctx.fillStyle = rage ? '#ff0000' : '#882222';
    ctx.beginPath(); ctx.ellipse(-2.5, -7, 1.5, 0.8, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.5, -7, 1.5, 0.8, -0.2, 0, Math.PI * 2); ctx.fill();
    if (rage) {
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(-2.5, -7, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1.5, -7, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#eaddca';
    ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(4.5, 1.5); ctx.lineTo(3, -1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(-4.5, 1.5); ctx.lineTo(-3, -1); ctx.fill();
    ctx.restore();

    ctx.fillStyle = skinColor; ctx.fillRect(-4, -10 + bob, 7, 5.5);

    ctx.fillStyle = rage ? '#ff0000' : '#ffffff';
    ctx.fillRect(-2.5, -8.5 + bob, 1.5, 1); ctx.fillRect(1.5, -8.5 + bob, 1.5, 1);
    if (!rage) { ctx.fillStyle = '#000'; ctx.fillRect(-2, -8.5 + bob, 0.5, 0.5); ctx.fillRect(2, -8.5 + bob, 0.5, 0.5); }

    ctx.fillStyle = rage ? bloodHue : '#111';
    ctx.globalAlpha = 0.8; ctx.fillRect(-4, -8 + bob, 8, 1.5); ctx.globalAlpha = 1;

    ctx.fillStyle = '#b84514';
    ctx.beginPath(); ctx.moveTo(-5, -5 + bob); ctx.lineTo(5, -5 + bob); ctx.lineTo(3.5, 0 + bob); ctx.lineTo(0.5, 3 + bob); ctx.lineTo(-2.5, 0 + bob); ctx.fill();
    ctx.fillStyle = cv.bodyLight; ctx.fillRect(-1.5, 0 + bob, 4, 1);

    // ── CÁNH TAY TRẦN VÀ SONG RÌU LỆT SAO NẶNG TRỊCH ──

    // Animation physics calculations for axes
    let leftRot = -Math.PI / 10;
    let rightRot = -Math.PI / 10;
    let leftTrans = { x: 0, y: 0 };
    let rightTrans = { x: 0, y: 0 };

    if (attackState) {
        // Alternating combo: Right axe swings 0.0->0.5, Left axe swings 0.5->1.0
        // Corrected to downward chops
        if (attackProgress < 0.2) {
            // Windup Right (Up/Back)
            let t = attackProgress / 0.2;
            rightRot = -Math.PI / 10 * (1 - t) + (-Math.PI / 1.2) * t;
            leftRot = -Math.PI / 10;
        } else if (attackProgress < 0.5) {
            // Strike Right (Downward Chop)
            let t = (attackProgress - 0.2) / 0.3;
            t = t * t; // ease in
            rightRot = (-Math.PI / 1.2) * (1 - t) + (Math.PI / 4) * t;
            rightTrans = { x: 2, y: 1 };
            leftRot = -Math.PI / 10;
        } else if (attackProgress < 0.7) {
            // Windup Left (Up/Back), Right arm recovers slightly
            let t = (attackProgress - 0.5) / 0.2;
            rightRot = (Math.PI / 4) * (1 - t) + (-Math.PI / 8) * t;
            leftRot = -Math.PI / 10 * (1 - t) + (-Math.PI / 1.2) * t;
            leftTrans = { x: -2, y: -2 };
        } else {
            // Strike Left (Downward Chop)
            let t = (attackProgress - 0.7) / 0.3;
            t = t * t; // ease in
            rightRot = (-Math.PI / 8) * (1 - t) + (-Math.PI / 10) * t; // Resume idle
            leftRot = (-Math.PI / 1.2) * (1 - t) + (Math.PI / 4) * t;
            leftTrans = { x: 1, y: 3 };
        }
    } else {
        leftRot = moving ? Math.sin(bob * 0.6) * 0.5 : 0;
        rightRot = moving ? -Math.sin(bob * 0.6) * 0.5 : 0;
    }

    // TAY TRÁI (Nằm khuất phía sau)
    ctx.save();
    ctx.translate(5.5, -2 + bob - breatheSway);
    ctx.rotate(leftRot);
    ctx.translate(leftTrans.x, leftTrans.y);

    ctx.fillStyle = skinColor; ctx.fillRect(0, 0, 4, 8.5);
    ctx.fillStyle = shadowSkin; ctx.fillRect(1, 0, 1, 8.5);

    ctx.fillStyle = '#6b5c4d'; ctx.fillRect(-1, 4, 5.5, 4.5);
    ctx.fillStyle = bloodHue; ctx.globalAlpha = 0.85; ctx.fillRect(-1, 5, 5.5, 3); ctx.globalAlpha = 1;

    ctx.fillStyle = '#4a2f1d'; ctx.fillRect(0.5, 8.5, 3, 3);

    if (attackState) {
        ctx.translate(2, 10.5);
        ctx.rotate(Math.PI / 5);
        ctx.fillStyle = '#2b1a10'; ctx.fillRect(-1, -5, 2.5, 17);
        ctx.fillStyle = '#4a2f1d'; for (let i = 0; i < 4; i++) ctx.fillRect(-1.5, -2 + i * 3, 3.5, 1);

        ctx.fillStyle = age >= 4 ? '#ccc' : '#888';
        ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(8, -6); ctx.lineTo(10, -2); ctx.lineTo(9, 6); ctx.quadraticCurveTo(4, 5, 2, 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(10, -2); ctx.lineTo(9, 6); ctx.lineTo(7.5, -2); ctx.fill(); ctx.globalAlpha = 1;

        ctx.fillStyle = bloodHue; ctx.globalAlpha = rage ? 0.9 : 0.6;
        ctx.beginPath(); ctx.arc(6, -1, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(5, -4, 4, 6); ctx.globalAlpha = 1;

        if (attackProgress > 0.7) {
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(20, -10); ctx.lineTo(9, 6); ctx.fill(); ctx.globalAlpha = 1;
        }
    }
    ctx.restore();

    // TAY PHẢI (Nằm trước ngực)
    ctx.save();
    ctx.translate(-5.5, -2 + bob - breatheSway);
    ctx.rotate(rightRot);
    ctx.translate(rightTrans.x, rightTrans.y);

    ctx.fillStyle = skinColor; ctx.fillRect(-4, 0, 4.5, 9);
    ctx.globalAlpha = rage ? 0.9 + Math.sin(unit.animTimer * 12) * 0.1 : 0.7; ctx.fillStyle = tattooColor; ctx.fillRect(-3.5, 1, 3, 2.5); ctx.globalAlpha = 1;

    ctx.fillStyle = '#6b5c4d'; ctx.fillRect(-4.5, 4.5, 5.5, 4.5);
    ctx.fillStyle = bloodHue; ctx.globalAlpha = 0.9; ctx.fillRect(-4.5, 6, 5.5, 2.5); ctx.globalAlpha = 1;

    ctx.fillStyle = '#221100'; ctx.fillRect(-3.5, 9, 3, 3);

    if (attackState) {
        ctx.translate(-2, 11);
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = '#2b1a10'; ctx.fillRect(-1.5, -5, 3, 19);
        ctx.fillStyle = '#3a1f0d'; ctx.fillRect(-0.5, -4, 1.5, 16);
        ctx.fillStyle = age >= 4 ? '#d4af37' : '#555'; ctx.beginPath(); ctx.arc(0, 15, 2, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = age >= 4 ? '#e6e6e6' : '#a0a0a0';
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(10, -8); ctx.lineTo(12, -2); ctx.lineTo(10, 8); ctx.quadraticCurveTo(4, 6, 2, 1); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(12, -2); ctx.lineTo(10, 8); ctx.lineTo(8.5, -2); ctx.fill();

        ctx.globalAlpha = attackState ? 0.95 : (rage ? 0.8 : 0.4); ctx.fillStyle = bloodHue;
        ctx.beginPath(); ctx.arc(7, -2, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(8, 4, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(5, -5, 5, 5); ctx.globalAlpha = 1;

        if (rage) {
            ctx.strokeStyle = '#55ccff'; ctx.lineWidth = 1.5; ctx.shadowColor = '#0088ff'; ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.moveTo(9, -7); ctx.lineTo(6, -1); ctx.lineTo(8, 4); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (attackProgress > 0.2 && attackProgress < 0.5) {
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(24, 6); ctx.lineTo(10, 8); ctx.fill(); ctx.globalAlpha = 1;
        }
    }
    ctx.restore();

    // VẼ 2 RÌU GIẮT SAU LƯNG KHI KHÔNG TẤN CÔNG
    if (!attackState) {
        ctx.save();
        ctx.translate(0, 5 + bob);

        const axeWood = '#2b1a10';
        const axeSteel = age >= 4 ? '#a0a0a0' : '#888';

        ctx.save();
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = axeWood; ctx.fillRect(-1, -8, 2, 16);
        ctx.fillStyle = axeSteel; ctx.beginPath(); ctx.moveTo(1, -6); ctx.lineTo(8, -8); ctx.lineTo(9, -2); ctx.lineTo(8, 4); ctx.quadraticCurveTo(4, 3, 1, 0); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(0, -2);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = axeWood; ctx.fillRect(-1.5, -10, 3, 20);
        ctx.fillStyle = axeSteel; ctx.beginPath(); ctx.moveTo(1.5, -8); ctx.lineTo(10, -10); ctx.lineTo(12, -4); ctx.lineTo(10, 6); ctx.quadraticCurveTo(5, 4, 1.5, -1); ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    // ── RAGE EFFECTS ──
    if (rage || age >= 4) {
        const pulseSpeed = rage ? 15 : 6;
        ctx.globalAlpha = rage ? (0.35 + Math.sin(unit.animTimer * pulseSpeed) * 0.2) : (0.15 + Math.sin(unit.animTimer * 5) * 0.08);
        const auraT = ctx.createRadialGradient(0, bob, 6, 0, bob, 22);
        auraT.addColorStop(0, rage ? '#ff1100' : '#bb3333');
        auraT.addColorStop(1, 'transparent');
        ctx.fillStyle = auraT;
        ctx.beginPath(); ctx.arc(0, 0 + bob, rage ? 22 : 18, 0, Math.PI * 2); ctx.fill();

        if (rage) {
            ctx.globalAlpha = 0.8; ctx.fillStyle = '#ff2222';
            for (let p = 0; p < 4; p++) {
                const px = Math.sin(unit.animTimer * 12 + p * 2.5) * 18;
                const py = Math.cos(unit.animTimer * 9 - p * 3) * 16;
                ctx.beginPath(); ctx.arc(px, bob + py - p * 2, 1.5 + Math.random(), 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = rage ? tattooColor : '#ffd700';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++) {
            ctx.beginPath(); ctx.arc(12, 4 + bob - i * 4.5, 1.8, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.restore();
    ctx.restore(); // Restore outer scale wrapper
}

