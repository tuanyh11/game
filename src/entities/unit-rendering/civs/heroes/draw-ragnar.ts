import type { Unit } from '../../../Unit';
// Bypassed UnitState import due to Vite HMR issues
import type { CivColors } from '../../shared';

export function drawRagnarComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();
    ctx.translate(0, 4); // Anchor balance

    const attackState = unit.state === 5 /* UnitState.Attacking */;
    const walkBob = moving ? Math.sin(bob * 0.5) * 2 : 0;
    const legSwing = moving ? Math.sin(bob * 0.7) * 4.5 : 0;
    const windWave = Math.sin(unit.animTimer * 4) * 2;

    // ==========================================
    // BÃO TUYẾT SINH TỬ (Frost & Blood Aura)
    // ==========================================
    const pulse = Math.sin(unit.animTimer * 6) * 0.2 + 0.3;
    ctx.globalAlpha = pulse;

    // Frosty blue baseline
    const auraGradient = ctx.createRadialGradient(0, Math.max(0, bob) - 2, 0, 0, Math.max(0, bob) - 2, 25);
    auraGradient.addColorStop(0, '#a5f2f3');
    auraGradient.addColorStop(0.5, '#4a90e2');
    auraGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, Math.max(0, bob) - 2, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Animation Phase
    let attackRot = 0;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (attackProgress < 0.2) {
            attackRot = (-Math.PI / 4) * (attackProgress / 0.2); // Recovery
        } else if (attackProgress < 0.6) {
            attackRot = -Math.PI / 1.5; // Windup overhead
        } else {
            let t = (attackProgress - 0.6) / 0.4;
            attackRot = -Math.PI / 1.5 + (Math.PI / 1.5 + Math.PI / 4) * t; // Brutal chop
        }
    }

    // ==========================================
    // ÁO LÔNG ÁC THÚ (Bear Pelt Cloak Background)
    // ==========================================
    ctx.fillStyle = '#3a2010'; // Dark brown fur cape
    ctx.beginPath();
    ctx.moveTo(-6, -7 + walkBob);
    ctx.quadraticCurveTo(-16, 0 + walkBob + windWave, -15, 14 + walkBob - windWave);
    ctx.lineTo(-8, 12 + walkBob);
    ctx.fill();

    // Body Stance
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.03);
        ctx.rotate(0.2); // Berserker charge
    } else if (attackState) {
        ctx.rotate(0.15); // Lean into chop
    }

    const skinTone = cv.skinColor;

    // ==========================================
    // CHÂN (Elite size leather pants & boots)
    // ==========================================
    ctx.fillStyle = '#1e1a18';
    ctx.fillRect(-6.5 + legSwing, 6, 5.5, 11); // Left
    ctx.fillRect(1.5 - legSwing, 6, 5.5, 11);  // Right

    // Leather boots with fur trims
    ctx.fillStyle = '#4a2c16';
    ctx.fillRect(-7 + legSwing, 12, 6.5, 6);
    ctx.fillRect(1 - legSwing, 12, 6.5, 6);

    // Fur string ties
    ctx.fillStyle = '#8b6f59';
    ctx.fillRect(-7.5 + legSwing, 13, 7.5, 1.5);
    ctx.fillRect(0.5 - legSwing, 13, 7.5, 1.5);

    // ==========================================
    // THÂN (Elite Muscular Frame & Tattoos)
    // ==========================================
    // Torso Base (Width 13, matching Ninja)
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.moveTo(-6.5, -6 + walkBob); ctx.lineTo(6.5, -6 + walkBob);
    ctx.lineTo(5.5, 7 + walkBob); ctx.lineTo(-5.5, 7 + walkBob);
    ctx.fill();

    // Warpaint / Runic Tattoos (Blue)
    ctx.fillStyle = '#2d5a88';
    ctx.fillRect(-4, -4 + walkBob, 2, 5);
    ctx.fillRect(2, -3 + walkBob, 3, 2);
    ctx.fillRect(-2, -1 + walkBob, 4, 1.5);

    // Thick leather belt with buckle
    ctx.fillStyle = '#22140a';
    ctx.fillRect(-7.5, 5 + walkBob, 15, 3.5);
    ctx.fillStyle = '#9e9e9e'; // Iron buckle
    ctx.fillRect(-2.5, 5.5 + walkBob, 5, 2.5);

    // Animal tooth necklace dangling
    ctx.fillStyle = '#e8dcc7';
    ctx.fillRect(-2, -3 + walkBob, 1.5, 2);
    ctx.fillRect(2, -3 + walkBob, 1.5, 2);
    ctx.fillRect(0, -1 + walkBob, 1.5, 2.5);

    // ==========================================
    // LEFT ARM & BLOOD AXE (Off-hand defensive/chop)
    // ==========================================
    ctx.save();
    ctx.translate(4, -2 + walkBob);
    if (attackState && attackProgress < 0.5) {
        ctx.rotate(-Math.PI / 4);
        ctx.translate(2, -2);
    } else {
        const leftRot = moving ? (20 * Math.PI / 180) + Math.sin(bob * 0.8) * 0.1 : (30 * Math.PI / 180);
        ctx.rotate(leftRot);
    }

    ctx.fillStyle = skinTone; ctx.fillRect(0, 0, 3.5, 8); // Arm
    ctx.fillStyle = '#2d5a88'; ctx.fillRect(0.5, 2, 2.5, 2); // Tattoo
    ctx.fillStyle = skinTone; ctx.fillRect(0.5, 8, 2.5, 2.5); // Hand

    ctx.translate(1, 10);
    ctx.fillStyle = '#3d2616'; ctx.fillRect(-1.5, -2, 2.5, 12); // Handle
    // Axe Head
    ctx.fillStyle = '#788496';
    ctx.beginPath(); ctx.moveTo(-0.5, 6); ctx.lineTo(-10, 2); ctx.lineTo(-11, 12); ctx.lineTo(-0.5, 10); ctx.fill();
    // Blood Runes
    ctx.fillStyle = '#d12424';
    ctx.fillRect(-4, 6, 2, 2);
    ctx.restore();

    // ==========================================
    // ĐẦU (Braids & Warpaint - Elite Face Size)
    // ==========================================
    ctx.fillStyle = skinTone; ctx.fillRect(-2.5, -9 + walkBob, 5, 4); // Neck
    // Face 7x5
    ctx.fillStyle = skinTone; ctx.fillRect(-3.5, -14 + walkBob, 7, 6);

    // Blue warpaint across eyes
    ctx.fillStyle = '#2d5a88';
    ctx.fillRect(-4, -12 + walkBob, 8, 2.5);

    // Glowing intense icy eyes
    ctx.fillStyle = '#a5f2f3';
    ctx.fillRect(-2.5, -11.5 + walkBob, 1.5, 1);
    ctx.fillRect(1, -11.5 + walkBob, 1.5, 1);

    // Beard (Blonde/Reddish)
    ctx.fillStyle = '#c89a58';
    ctx.fillRect(-4, -9 + walkBob, 8, 3.5);
    ctx.fillRect(-2.5, -6 + walkBob, 2, 3); // Braid tail
    ctx.fillRect(1, -6 + walkBob, 2, 3);    // Braid tail

    // Hair (Shaved sides, braided mohawk/ponytail)
    ctx.fillStyle = '#c89a58';
    ctx.fillRect(-2, -15 + walkBob, 4, 3);
    ctx.beginPath();
    ctx.moveTo(0, -14 + walkBob);
    ctx.quadraticCurveTo(5, -12 + walkBob, 4, -5 + walkBob + windWave * 0.5);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#c89a58';
    ctx.stroke();

    // ==========================================
    // RIGHT ARM & FROST AXE (Main attack)
    // ==========================================
    ctx.save();
    ctx.translate(-4.5, -2 + walkBob);

    if (attackState) {
        ctx.rotate(attackRot);
        ctx.translate(-2, -2);
    } else {
        const walkRot = moving ? -Math.sin(bob * 0.6) * 0.5 : -0.1;
        ctx.rotate(walkRot);
    }

    ctx.fillStyle = skinTone; ctx.fillRect(-2, 0, 3.5, 8); // Arm
    ctx.fillStyle = '#2d5a88'; ctx.fillRect(-1.5, 2, 2.5, 2); // Tattoo
    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 8, 2.5, 2.5); // Hand

    ctx.translate(-0.5, 10);
    ctx.fillStyle = '#3d2616'; ctx.fillRect(-1, -2, 2.5, 14); // Handle

    // Axe Head
    ctx.fillStyle = '#788496';
    ctx.beginPath(); ctx.moveTo(1, 6); ctx.lineTo(10, 2); ctx.lineTo(11, 12); ctx.lineTo(1, 10); ctx.fill();
    // Ice Runes
    ctx.fillStyle = '#a5f2f3'; ctx.fillRect(4, 6, 2, 2);

    // --- SLASH IMPACT (Frost & Blood burst) ---
    if (attackState && attackProgress > 0.4 && attackProgress < 0.8) {
        ctx.shadowColor = '#a5f2f3'; ctx.shadowBlur = 10;
        ctx.strokeStyle = '#e0ffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 10, 24, -Math.PI / 8, Math.PI / 2); ctx.stroke(); // Ice

        ctx.shadowColor = '#d12424';
        ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 10, 22, Math.PI / 2, Math.PI + Math.PI / 8); ctx.stroke(); // Blood
        ctx.shadowBlur = 0;
    }

    ctx.restore();
    ctx.restore();
}
