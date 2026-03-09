import type { Unit } from '../../../Unit';
import type { CivColors } from '../../shared';

export function drawZarathustraComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85); // Scale down slightly per user request
    ctx.translate(0, 4); // Anchor balance

    const yOffset = bob; // Grounded, no hovering
    const legSwing = moving ? Math.sin(unit.animTimer * 12) * 4 : 0;
    const walkBob = moving ? Math.sin(unit.animTimer * 6) * 1.5 : 0;

    const attackState = unit.state === 5 /* UnitState.Attacking */;
    const skinTone = cv.skinColor;
    const armorGold = '#d4af37';
    const darkGold = '#b8860b';

    // Body Stance
    if (moving && !attackState) {
        ctx.rotate(0.08); // Lean forward when running
    } else if (attackState) {
        ctx.rotate(0.12); // Lean into the shot
    }

    // ==========================================
    // ÁO CHOÀNG (Flowing Red Cape)
    // ==========================================
    const capeWave = moving ? Math.sin(unit.animTimer * 10) * 8 : Math.sin(unit.animTimer * 2) * 3;
    ctx.fillStyle = '#b81111'; // Imperial Red
    ctx.beginPath();
    ctx.moveTo(-6, yOffset - 8); // Shoulders
    ctx.quadraticCurveTo(-15 + capeWave, yOffset + 5, -12 + capeWave, yOffset + 24);
    ctx.lineTo(-4 + capeWave, yOffset + 22);
    ctx.lineTo(6, yOffset - 8);
    ctx.fill();

    // Cape golden pattern trim
    ctx.strokeStyle = armorGold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10 + capeWave, yOffset + 21);
    ctx.lineTo(-4 + capeWave, yOffset + 22);
    ctx.stroke();

    // ==========================================
    // CHÂN (Armored Legs & Boots)
    // ==========================================
    // Rear Leg
    ctx.fillStyle = '#3a2a18'; // Dark leather pants
    ctx.beginPath(); ctx.ellipse(-4 + legSwing, yOffset + 12, 4, 6, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; // Boots
    ctx.beginPath(); ctx.ellipse(-4 + legSwing, yOffset + 18, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = armorGold; // Knee guard
    ctx.fillRect(-6 + legSwing, yOffset + 11, 4, 3);

    // Front Leg
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath(); ctx.ellipse(4 - legSwing, yOffset + 12, 4, 6, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(4 - legSwing, yOffset + 18, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = armorGold;
    ctx.fillRect(2 - legSwing, yOffset + 11, 4, 3);

    // ==========================================
    // THÂN (Muscular Torso & Sun Armor)
    // ==========================================
    ctx.fillStyle = '#8b0000'; // Red undershirt waist
    ctx.fillRect(-6, yOffset + 4 + walkBob, 12, 6);

    // Golden Scale Cuirass
    const goldArmorColor = ctx.createLinearGradient(-6, -5, 6, 5);
    goldArmorColor.addColorStop(0, darkGold);
    goldArmorColor.addColorStop(0.5, '#ffe55c');
    goldArmorColor.addColorStop(1, darkGold);

    ctx.fillStyle = goldArmorColor;
    ctx.beginPath();
    ctx.moveTo(-7, yOffset - 8 + walkBob);
    ctx.lineTo(7, yOffset - 8 + walkBob);
    ctx.lineTo(8, yOffset + 4 + walkBob);
    ctx.lineTo(0, yOffset + 7 + walkBob); // Pointed crotch guard
    ctx.lineTo(-8, yOffset + 4 + walkBob);
    ctx.fill();

    // Draw scale pattern lines
    ctx.strokeStyle = '#8a6608';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-6, yOffset - 4 + i * 3 + walkBob);
        ctx.lineTo(6, yOffset - 4 + i * 3 + walkBob);
        ctx.stroke();
    }

    // Heavy Golden Belt
    ctx.fillStyle = '#111';
    ctx.fillRect(-7, yOffset + 4 + walkBob, 14, 2);
    ctx.fillStyle = armorGold;
    ctx.fillRect(-2, yOffset + 3 + walkBob, 4, 4);

    // ==========================================
    // LEFT ARM & MASSIVE HORN BOW
    // ==========================================
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    ctx.save();
    ctx.translate(5, yOffset - 2 + walkBob);

    if (attackState) {
        // Raise bow to aim horizontally
        const liftProgress = Math.min(attackProgress * 4, 1.0);
        ctx.rotate((-25 * Math.PI / 180) * liftProgress);
        ctx.translate(-2 * liftProgress, -6 * liftProgress);
    } else {
        const leftArmRot = moving ? Math.sin(unit.animTimer * 12) * 0.2 : (10 * Math.PI / 180);
        ctx.rotate(leftArmRot);
    }

    ctx.fillStyle = skinTone; ctx.fillRect(0, 0, 3.5, 8); // Bare muscular arm
    ctx.fillStyle = darkGold; ctx.fillRect(0.5, 4, 3, 5); // Golden Bracer
    ctx.fillStyle = armorGold; ctx.fillRect(-1, -1, 5.5, 4); // Sun Pauldron (shoulder pad)

    ctx.translate(1, 9);
    ctx.fillStyle = skinTone; ctx.fillRect(-1, 0, 2.5, 3); // Hand gripping bow

    // --- The Giant Sun Horn Bow ---
    ctx.strokeStyle = goldArmorColor;
    ctx.lineWidth = 2.5;

    let bowPull = 0;
    if (attackState && attackProgress < 0.95) {
        bowPull = Math.min(attackProgress * 12, 10); // Heavy draw tension
    }

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(10, -10, 2, 0); // Upper horn
    ctx.quadraticCurveTo(10, 10, 0, 22); // Lower horn
    ctx.stroke();

    // Bow string
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-bowPull, 0); // String pulled back
    ctx.lineTo(0, 22);
    ctx.stroke();

    // Flaming Arrow knocked on bow
    if (attackState && attackProgress < 0.95) {
        ctx.fillStyle = '#222';
        ctx.fillRect(-bowPull, -0.5, 24 + bowPull, 1.5); // Thick arrow shaft

        ctx.fillStyle = '#fff'; // Fletching
        ctx.fillRect(-bowPull, -2, 4, 4);

        // Flaming arrowhead
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.moveTo(24, -2.5); ctx.lineTo(30, 0); ctx.lineTo(24, 2.5); ctx.fill();
        ctx.fillStyle = '#ffd700'; // Inner flame core
        ctx.beginPath(); ctx.moveTo(25, -1); ctx.lineTo(28, 0); ctx.lineTo(25, 1); ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // QUIVER (Golden quiver strapped to back)
    // ==========================================
    ctx.save();
    ctx.translate(-4, yOffset - 5 + walkBob);
    ctx.rotate(-45 * Math.PI / 180);
    ctx.fillStyle = darkGold;
    ctx.fillRect(-2, -5, 5, 20); // Quiver body
    ctx.fillStyle = '#111';
    ctx.fillRect(-2, -5, 5, 2); // Quiver rim

    // Arrows in quiver
    ctx.fillStyle = '#eee';
    ctx.fillRect(-1.5, -9, 1.5, 4);
    ctx.fillRect(0.5, -8, 1.5, 3);
    ctx.fillRect(2, -10, 1.5, 5);
    ctx.restore();

    // ==========================================
    // RIGHT HAND (Draws the bow string)
    // ==========================================
    ctx.save();
    ctx.translate(-4, yOffset - 2 + walkBob);

    if (attackState) {
        const pullProgress = Math.min(attackProgress * 4, 1.0);
        const release = attackProgress > 0.95;

        if (release) {
            ctx.rotate(25 * Math.PI / 180); // Follow through snap
            ctx.translate(3, 3);
        } else {
            ctx.rotate((-50 * Math.PI / 180) * pullProgress); // Arm pulling string way back
            ctx.translate(-5 * pullProgress, -5 * pullProgress);
        }
    } else {
        const armRot = moving ? -Math.sin(unit.animTimer * 12) * 0.2 : -0.1;
        ctx.rotate(armRot);
    }

    ctx.fillStyle = skinTone; ctx.fillRect(-2, 0, 3.5, 8); // Bare arm
    ctx.fillStyle = darkGold; ctx.fillRect(-2.5, 4, 3, 5); // Bracer
    ctx.fillStyle = armorGold; ctx.fillRect(-3, -2, 5.5, 4); // Pauldron
    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 9, 2.5, 2.5); // Hand
    ctx.restore();

    // ==========================================
    // ĐẦU (Golden Persian Mask & Headpiece)
    // ==========================================
    ctx.fillStyle = skinTone; ctx.fillRect(-2.5, yOffset - 11 + walkBob, 5, 4); // Neck

    // Golden Face Mask (Immortal style)
    ctx.fillStyle = armorGold;
    ctx.beginPath();
    // Mask outline covering the face
    ctx.moveTo(-4, yOffset - 17 + walkBob);
    ctx.quadraticCurveTo(0, yOffset - 19 + walkBob, 4, yOffset - 17 + walkBob); // Top curve
    ctx.lineTo(4, yOffset - 9 + walkBob);
    ctx.lineTo(0, yOffset - 6 + walkBob); // Chin point
    ctx.lineTo(-4, yOffset - 9 + walkBob);
    ctx.fill();

    // Dark trim/shadow around mask edges
    ctx.strokeStyle = darkGold;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glowing golden eyes piercing through the mask
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 5;
    ctx.fillStyle = '#ffffff';
    // Eye slits
    ctx.fillRect(-2.5, yOffset - 13 + walkBob, 1.5, 0.8);
    ctx.fillRect(1, yOffset - 13 + walkBob, 1.5, 0.8);
    ctx.shadowBlur = 0;

    // Headpiece/Turban wrapping behind the mask
    ctx.fillStyle = '#8b0000'; // Imperial Red matching the cape
    ctx.beginPath();
    ctx.moveTo(-5, yOffset - 15 + walkBob);
    ctx.quadraticCurveTo(0, yOffset - 22 + walkBob, 5, yOffset - 15 + walkBob);
    ctx.lineTo(4, yOffset - 12 + walkBob);
    ctx.lineTo(-4, yOffset - 12 + walkBob);
    ctx.fill();

    // Sun Crown (Diadem on the forehead/turban)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(0, yOffset - 21 + walkBob);
    ctx.lineTo(-2, yOffset - 17 + walkBob);
    ctx.lineTo(2, yOffset - 17 + walkBob);
    ctx.fill();

    // Level indicator stars
    if (unit.heroLevel > 1) {
        ctx.fillStyle = armorGold;
        for (let i = 0; i < Math.min(unit.heroLevel, 5); i++) {
            ctx.beginPath(); ctx.arc(12, yOffset + 4 - i * 4, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.restore();
}
