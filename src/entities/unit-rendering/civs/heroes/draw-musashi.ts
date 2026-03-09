import type { Unit } from '../../../Unit';
// Bypassed UnitState import due to Vite HMR issues
import type { CivColors } from '../../shared';

export function drawMusashiComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();

    const attackState = unit.state === 5 /* UnitState.Attacking */;
    const walkBob = moving ? Math.sin(bob * 0.5) * 2 : 0;
    const legSwing = moving ? Math.sin(bob * 0.7) * 4.5 : 0;
    const windSway = Math.sin(unit.animTimer * 5) * 2.5;

    // Animation Phase
    let attackRot = 0;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (attackProgress < 0.2) {
            let t = attackProgress / 0.2;
            attackRot = (-Math.PI / 4) * (1 - t) + (-Math.PI / 8) * t;
        } else if (attackProgress < 0.7) {
            let t = (attackProgress - 0.2) / 0.5;
            attackRot = (-Math.PI / 8) * (1 - t) + (-Math.PI * 0.85) * t;
        } else {
            let t = (attackProgress - 0.7) / 0.3;
            t = t * t;
            attackRot = (-Math.PI * 0.85) * (1 - t) + (Math.PI / 4) * t; // X-slash down
        }
    }

    // ==========================================
    // KHUYẾT NGUYỆT KIẾM Ý (Crescent Moon Aura)
    // ==========================================
    const pulse = Math.sin(unit.animTimer * 5) * 0.15 + 0.2;
    ctx.globalAlpha = pulse;
    const auraGradient = ctx.createRadialGradient(0, Math.max(0, bob) - 5, 2, 0, Math.max(0, bob) - 5, 25);
    auraGradient.addColorStop(0, '#8ab4f8');
    auraGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, Math.max(0, bob) - 5, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body Transformation & Stance (Ninja-style dynamic leaning)
    ctx.translate(0, 3);
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.03);
        ctx.rotate(0.2); // Ronin dash lean
        ctx.translate(0, 4);
    } else if (attackState) {
        ctx.rotate(0.15); // Lean into attack
        ctx.translate(0, 4);
    } else {
        ctx.rotate(0);
        ctx.translate(0, 4 + Math.sin(unit.animTimer * 5) * 0.5); // Breathing idle
    }

    const skinTone = cv.skinColor;
    const hakamaDark = '#12121e';
    const kimonoTorn = '#1a1a2e';

    // Flowing Headband Tails (Hachimaki)
    ctx.save();
    ctx.fillStyle = '#f8f8f8';
    ctx.translate(-2, -12 + walkBob);
    ctx.rotate((moving ? 0.4 : 0.1) + Math.sin(unit.animTimer * 8) * 0.3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -3 - windSway, -14 - windSway * 2, -5 + Math.cos(unit.animTimer * 10) * 2); ctx.quadraticCurveTo(-6, 2, 0, 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 1); ctx.quadraticCurveTo(-5, 0 - windSway, -11 - windSway * 1.5, -2 + Math.sin(unit.animTimer * 9) * 2); ctx.quadraticCurveTo(-4, 3, 0, 3); ctx.fill();
    ctx.restore();

    // ==========================================
    // CHÂN (Hakama & Geta based on Ninja legs)
    // ==========================================
    ctx.fillStyle = hakamaDark;
    ctx.fillRect(-6.5 + legSwing, 6, 5.5, 11); // Wider Hakama legs
    ctx.fillRect(1.5 - legSwing, 6, 5.5, 11);

    // Hakama folds
    ctx.fillStyle = '#1c1c2e';
    ctx.fillRect(-5 + legSwing, 6, 1, 11);
    ctx.fillRect(3 - legSwing, 6, 1, 11);

    // Geta (Wooden sandals)
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(-7.5 + legSwing, 16.5, 6.5, 2);
    ctx.fillRect(0.5 - legSwing, 16.5, 6.5, 2);
    // Bare feet
    ctx.fillStyle = skinTone;
    ctx.fillRect(-6 + legSwing, 15, 4, 1.5);
    ctx.fillRect(2 - legSwing, 15, 4, 1.5);
    // Red straps
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-4.5 + legSwing, 16, 1, 1);
    ctx.fillRect(3.5 - legSwing, 16, 1, 1);

    // ==========================================
    // THÂN (Elite Torso: Torn Kimono & Scars)
    // ==========================================
    // Base bare chest (Elite proportions)
    ctx.fillStyle = skinTone;
    ctx.beginPath(); ctx.moveTo(-6.5, -6 + walkBob); ctx.lineTo(6.5, -6 + walkBob); ctx.lineTo(5.5, 7 + walkBob); ctx.lineTo(-5.5, 7 + walkBob); ctx.fill();

    // Battle scars on bare chest
    ctx.strokeStyle = '#c85a5a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3, -4 + walkBob); ctx.lineTo(3, 1 + walkBob); ctx.stroke();

    // Remaining Kimono draped on left shoulder
    ctx.fillStyle = kimonoTorn;
    ctx.beginPath(); ctx.moveTo(-6.5, -6 + walkBob); ctx.lineTo(-1, -6 + walkBob); ctx.lineTo(-2, 5 + walkBob); ctx.lineTo(-5.5, 7 + walkBob); ctx.fill();

    // Obi (Bright red sash, sharp & wide)
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-6.5, 4.5 + walkBob, 13, 3.5);
    ctx.fillStyle = '#991111';
    ctx.fillRect(-4, 4 + walkBob, 3, 4);

    // Flying sash tail
    ctx.strokeStyle = '#cc2222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, 6 + walkBob);
    ctx.quadraticCurveTo(10, 4 + walkBob + windSway, 14, 10 + walkBob - windSway);
    ctx.stroke();

    // ==========================================
    // LEFT ARM & WAKIZASHI (Defensive/Reverse Grip)
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

    // Bare Left Arm
    ctx.fillStyle = skinTone; ctx.fillRect(0, 0, 3.5, 8);
    ctx.fillStyle = skinTone; ctx.fillRect(0.5, 8, 2.5, 2.5);

    // Wakizashi Handle
    ctx.translate(1, 10);
    ctx.fillStyle = '#111'; ctx.fillRect(-0.5, -4, 2, 6);
    ctx.fillStyle = '#d4af37'; ctx.fillRect(-1, 2, 3, 1); // Tsuba

    if (!attackState || attackProgress < 0.5) {
        // Wakizashi Blade (Reverse grip or resting)
        ctx.fillStyle = '#d0d0d0';
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-0.5, -16); ctx.quadraticCurveTo(1, -18, 1.5, -4); ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // ĐẦU (Head, Wild Hair, Hachimaki)
    // ==========================================
    // Neck
    ctx.fillStyle = skinTone; ctx.fillRect(-2.5, -9 + walkBob, 5, 4);

    // Face (Elite scale 7x5)
    ctx.fillStyle = skinTone; ctx.fillRect(-3.5, -14 + walkBob, 7, 6);

    // Eyes (Sharp, focused)
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -12 + walkBob, 1.5, 1);
    ctx.fillRect(1.5, -12 + walkBob, 1.5, 1);
    ctx.fillStyle = '#111';
    ctx.fillRect(-1.5, -12 + walkBob, 0.5, 0.5);
    ctx.fillRect(2, -12 + walkBob, 0.5, 0.5);

    // Wild Ronin Hair Back & Top
    ctx.fillStyle = '#181818';
    ctx.fillRect(-4.5, -18 + walkBob, 9, 5); // Top
    ctx.fillRect(-4.5, -14 + walkBob, 2, 8); // Left bangs
    ctx.fillRect(3.5, -14 + walkBob, 2, 6);  // Right bangs

    // High ponytail / topknot swaying
    ctx.beginPath();
    ctx.moveTo(0, -17 + walkBob);
    ctx.lineTo(-5, -23 + walkBob + windSway);
    ctx.lineTo(2, -22 + walkBob - windSway);
    ctx.fill();

    // Hachimaki (Headband front)
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(-4, -16 + walkBob, 8, 2);
    // Hinomaru
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(0, -15 + walkBob, 1, 0, Math.PI * 2); ctx.fill();


    // ==========================================
    // RIGHT ARM & KATANA
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

    // Right Arm (Kimono sleeve)
    ctx.fillStyle = kimonoTorn; ctx.fillRect(-2, 0, 3.5, 6);
    ctx.fillStyle = skinTone; ctx.fillRect(-2, 6, 3.5, 2);
    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 8, 2.5, 2.5); // Hand

    // Katana Handle
    ctx.translate(-1, 10);
    ctx.fillStyle = '#111'; ctx.fillRect(-1, 0, 2, 7);
    ctx.fillStyle = '#d4af37'; ctx.fillRect(-1.5, 7, 3, 1); // Tsuba

    // Katana Blade
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath(); ctx.moveTo(-0.5, 8); ctx.lineTo(-1, 28); ctx.quadraticCurveTo(1, 30, 1.5, 8); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-0.2, 8, 0.5, 18);

    // --- X-SLASH EFFECTS (Blue glowing trails) ---
    if (attackState && attackProgress > 0.4 && attackProgress < 0.9) {
        ctx.shadowColor = '#8ab4f8'; ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;

        ctx.beginPath(); ctx.moveTo(0, 15); ctx.quadraticCurveTo(15, 25, 20, 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(-15, 25, -20, 35); ctx.stroke();

        ctx.shadowBlur = 0;
    }

    ctx.restore();
    ctx.restore();
}
