import type { Unit } from '../../../Unit';
// Bypassed UnitState import due to Vite HMR issues
import type { CivColors } from '../../shared';

export function drawQiJiguangComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();
    ctx.translate(0, 4); // anchor balance

    const attackState = unit.state === 5 /* UnitState.Attacking */;
    const walkBob = moving ? Math.sin(bob * 0.5) * 2.5 : 0;
    const legSwing = moving ? Math.sin(bob * 0.6) * 5 : 0;
    const capeWave = Math.sin(unit.animTimer * 5) * 4;

    // ==========================================
    // CHÂN LONG KHÍ (Golden Dragon Aura)
    // ==========================================
    const pulse = Math.sin(unit.animTimer * 4) * 0.15 + 0.25;
    ctx.globalAlpha = pulse;

    // Golden glow
    const auraGradient = ctx.createRadialGradient(0, Math.max(0, bob) - 5, 5, 0, Math.max(0, bob) - 5, 25);
    auraGradient.addColorStop(0, '#ffd700');
    auraGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, Math.max(0, bob) - 5, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ==========================================
    // ÁO CHOÀNG (Long Flowing Red Cape)
    // ==========================================
    ctx.save();
    ctx.fillStyle = '#9e1a1a'; // Deep Ming Red
    ctx.beginPath();
    ctx.moveTo(-6, -7 + walkBob);
    ctx.quadraticCurveTo(-20, -2 + walkBob + capeWave, -18, 14 + walkBob - capeWave * 0.5);
    ctx.quadraticCurveTo(-10, 16 + walkBob, -4, -2 + walkBob);
    ctx.fill();

    // Cape shadow/fold
    ctx.fillStyle = '#730c0c';
    ctx.beginPath();
    ctx.moveTo(-7, -6 + walkBob);
    ctx.quadraticCurveTo(-16, 0 + walkBob + capeWave, -15, 10 + walkBob - capeWave * 0.5);
    ctx.quadraticCurveTo(-8, 12 + walkBob, -5, 0 + walkBob);
    ctx.fill();
    ctx.restore();

    // Body Stance
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.02);
        ctx.rotate(0.05);
    }

    // Animation Phase (Heavy two-handed chop)
    let attackRot = 0;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (attackProgress < 0.3) {
            attackRot = (-Math.PI / 1.5) * (attackProgress / 0.3);
        } else if (attackProgress < 0.5) {
            attackRot = -Math.PI / 1.2; // High overhead
        } else {
            let t = (attackProgress - 0.5) / 0.5;
            attackRot = -Math.PI / 1.2 + (Math.PI / 1.2 + Math.PI / 3) * t;
        }
    }

    // Colors
    const goldArmorColor = ctx.createLinearGradient(-8, -5, 8, 5);
    goldArmorColor.addColorStop(0, '#b8860b');
    goldArmorColor.addColorStop(0.5, '#ffe55c');
    goldArmorColor.addColorStop(1, '#b8860b');
    const skinTone = cv.skinColor;

    // RIGHT ARM & CHANGDAO (Drawn behind body when swinging)
    ctx.save();
    ctx.translate(-2, -4 + walkBob);
    if (attackState) {
        ctx.rotate(attackRot); // Slash rotation
    } else {
        const reachRot = (60 * Math.PI / 180) + (moving ? Math.sin(bob * 0.6) * 0.05 : 0);
        ctx.rotate(reachRot);
    }

    // Arm Sleeve
    ctx.fillStyle = '#222'; ctx.fillRect(-2, 0, 4, 8);
    // Golden Pauldron / Bracer
    ctx.fillStyle = goldArmorColor; ctx.fillRect(-2.5, 0, 5, 4);
    ctx.fillStyle = '#b8860b'; ctx.fillRect(-2, 4, 4, 6);
    // Hand
    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 10, 3, 3);

    // Changdao (Ming Long Saber)
    ctx.translate(0, 13);
    ctx.fillStyle = '#4a2511'; ctx.fillRect(-1.5, -6, 3, 14); // Very long grip
    ctx.fillStyle = goldArmorColor;
    ctx.beginPath(); ctx.arc(0, -6, 2, 0, Math.PI * 2); ctx.fill(); // Pommel
    ctx.fillRect(-3, 8, 6, 2); // Tsuba/Guard

    // Blade
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(-1, 10);
    ctx.lineTo(-1, 38); // Massive length
    ctx.quadraticCurveTo(0, 42, 2, 36);
    ctx.lineTo(2, 10);
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(1, 10, 1, 26);

    // Hỏa Long Kiếm Khí (Fire Dragon Slash FX)
    if (attackState && attackProgress > 0.4 && attackProgress < 0.8) {
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(255, 204, 0, 0.6)';
        ctx.beginPath(); ctx.moveTo(1, 10); ctx.quadraticCurveTo(20, 20, 10, 45); ctx.lineTo(-1, 38); ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.restore();

    // ==========================================
    // CHÂN (Legs - Elite Size)
    // ==========================================
    ctx.fillStyle = '#111';
    ctx.fillRect(-5 + legSwing, 6, 4.5, 11);
    ctx.fillRect(1 - legSwing, 6, 4.5, 11);

    // Golden Greaves
    ctx.fillStyle = goldArmorColor;
    ctx.fillRect(-5.5 + legSwing, 10, 5.5, 6);
    ctx.fillRect(0.5 - legSwing, 10, 5.5, 6);

    // Boots
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.ellipse(-3 + legSwing, 18, 4.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3 - legSwing, 18, 4.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // ==========================================
    // THÂN (Torso - Ming Lamellar & Skirt)
    // ==========================================
    ctx.fillStyle = '#222';
    ctx.fillRect(-7, -7 + walkBob, 14, 11);

    // Golden Mountain Scale Armor Cuirass
    ctx.fillStyle = goldArmorColor;
    ctx.fillRect(-7.5, -6 + walkBob, 15, 9);

    // Scale details
    ctx.fillStyle = '#b8860b';
    for (let x = -6; x <= 6; x += 3) {
        for (let y = -4; y <= 2; y += 3) {
            ctx.fillRect(x, y + walkBob, 2, 2);
        }
    }

    // Waist / Belt
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-8, 2 + walkBob, 16, 4);
    ctx.fillStyle = '#cc2222'; // Red Sash
    ctx.fillRect(-8, 3 + walkBob, 16, 2);
    // Jade Buckle
    ctx.fillStyle = '#22cc88';
    ctx.fillRect(-2, 2.5 + walkBob, 4, 3);

    // Armor Skirt (Tassets)
    ctx.fillStyle = goldArmorColor;
    ctx.beginPath();
    ctx.moveTo(-8, 6 + walkBob); ctx.lineTo(8, 6 + walkBob);
    ctx.lineTo(10, 12 + walkBob); ctx.lineTo(-10, 12 + walkBob);
    ctx.fill();
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1;
    ctx.strokeRect(-9, 11 + walkBob, 18, 1);

    // LEFT ARM (Resting / Ready)
    ctx.save();
    ctx.translate(4.5, -4 + walkBob);
    const leftArmRot = moving && !attackState ? (15 * Math.PI / 180) + Math.sin(bob * 0.8) * 0.05 : (20 * Math.PI / 180);
    ctx.rotate(leftArmRot);

    ctx.fillStyle = '#222'; ctx.fillRect(-2, 0, 4, 8);
    ctx.fillStyle = goldArmorColor; ctx.fillRect(-2.5, 0, 5, 4);
    ctx.fillStyle = '#b8860b'; ctx.fillRect(-2, 4, 4, 4);
    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 8, 3, 3);
    ctx.restore();

    // ==========================================
    // ĐẦU (Head - Ming Officer Helmet)
    // ==========================================
    ctx.fillStyle = '#222'; ctx.fillRect(-3.5, -9 + walkBob, 7, 2.5); // Neck guard
    ctx.fillStyle = skinTone; ctx.fillRect(-3.5, -14 + walkBob, 7, 5); // Face (Width 7)

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2.5, -12 + walkBob, 1.5, 1);
    ctx.fillRect(1, -12 + walkBob, 1.5, 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -12 + walkBob, 0.5, 0.5);
    ctx.fillRect(1.5, -12 + walkBob, 0.5, 0.5);

    // Ming Helmet
    ctx.fillStyle = '#181614';
    ctx.beginPath(); ctx.ellipse(0, -14 + walkBob, 6, 2, 0, 0, Math.PI * 2); ctx.fill(); // Brim
    ctx.fillStyle = goldArmorColor;
    ctx.beginPath(); ctx.arc(0, -14 + walkBob, 5, Math.PI, 0); ctx.fill(); // Dome

    // Tall Red Plume
    ctx.strokeStyle = '#e60000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -19 + walkBob);
    ctx.quadraticCurveTo(6, -24 + walkBob + capeWave * 0.5, 8, -16 + walkBob - capeWave * 0.5);
    ctx.stroke();

    ctx.restore();
}
