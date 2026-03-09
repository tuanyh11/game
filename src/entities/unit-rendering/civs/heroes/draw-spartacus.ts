import type { Unit } from '../../../Unit';
// Bypassed UnitState import due to Vite HMR issues
import type { CivColors } from '../../shared';

export function drawSpartacusComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();
    ctx.translate(0, 4); // Anchor balance

    const attackState = unit.state === 5 /* UnitState.Attacking */;
    const walkBob = moving ? Math.sin(bob * 0.5) * 2 : 0;
    const legSwing = moving ? Math.sin(bob * 0.7) * 4.5 : 0;
    const capeWave = Math.cos(unit.animTimer * 6) * 3;

    // ==========================================
    // HÀO QUANG ĐẤU SĨ (Glorious Sand Aura)
    // ==========================================
    const pulse = Math.sin(unit.animTimer * 5) * 0.2 + 0.3;
    ctx.globalAlpha = pulse;
    const auraGradient = ctx.createRadialGradient(0, Math.max(0, bob), 5, 0, Math.max(0, bob), 25);
    auraGradient.addColorStop(0, '#e6c200');
    auraGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, Math.max(0, bob), 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ==========================================
    // ÁO CHOÀNG (Red Gladiator Cape)
    // ==========================================
    ctx.save();
    ctx.fillStyle = '#b01010'; // Deep crimson
    ctx.beginPath();
    ctx.moveTo(-5, -7 + walkBob);
    ctx.quadraticCurveTo(-16, -2 + walkBob + capeWave, -14, 12 + walkBob - capeWave);
    ctx.lineTo(-6, 9 + walkBob);
    ctx.fill();
    ctx.restore();

    // Body Stance (Gladiator combat ready)
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.03);
        ctx.rotate(0.1);
    } else if (attackState) {
        ctx.rotate(0.2); // Heavy lunge
    }

    // Animation Phase (Gladius thrust)
    let attackRot = 0;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (attackProgress < 0.2) {
            attackRot = (-Math.PI / 4) * (1 - attackProgress / 0.2);
        } else if (attackProgress < 0.6) {
            attackRot = -Math.PI / 8; // Pull back
        } else {
            let t = (attackProgress - 0.6) / 0.4;
            attackRot = -Math.PI / 8 + (Math.PI / 3) * t; // Fast thrust
        }
    }

    const skinTone = cv.skinColor;

    // ==========================================
    // CHÂN (Elite Size Bare Legs & Greaves)
    // ==========================================
    ctx.fillStyle = skinTone;
    ctx.fillRect(-6.5 + legSwing, 6, 5.5, 11); // Left
    ctx.fillRect(1.5 - legSwing, 6, 5.5, 11);  // Right

    // Golden Greaves (Bronze shin guards)
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(-7 + legSwing, 10, 6.5, 5);
    ctx.fillRect(1 - legSwing, 10, 6.5, 5);

    // Leather sandal straps
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-7.5 + legSwing, 15, 7.5, 1.5);
    ctx.fillRect(0.5 - legSwing, 15, 7.5, 1.5);
    ctx.fillRect(-5 + legSwing, 10, 1.5, 5);
    ctx.fillRect(3 - legSwing, 10, 1.5, 5);

    // ==========================================
    // THÂN (Elite Muscular Frame & Roman Armor)
    // ==========================================
    ctx.fillStyle = skinTone; // Chest base
    ctx.beginPath();
    ctx.moveTo(-6.5, -6 + walkBob); ctx.lineTo(6.5, -6 + walkBob);
    ctx.lineTo(5.5, 7 + walkBob); ctx.lineTo(-5.5, 7 + walkBob);
    ctx.fill();

    // Chest brace / Leather strap across chest
    ctx.strokeStyle = '#5c3a21'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-5, -5 + walkBob); ctx.lineTo(5, 0 + walkBob); ctx.stroke();

    // Leather subarmalis (waist padding)
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(-7.5, 1 + walkBob, 15, 6);

    // Pteruges (Leather skirt strips)
    ctx.fillStyle = '#5c3a21';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-6 + i * 4, 7 + walkBob, 2.5, 4);
    }

    // Single Golden Pauldron (Left shoulder)
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.arc(-4, -6 + walkBob, 4, Math.PI, 0); ctx.fill();

    // ==========================================
    // LEFT ARM (Shield - Parma)
    // ==========================================
    ctx.save();
    ctx.translate(4, -2 + walkBob);
    if (attackState && attackProgress < 0.5) {
        ctx.translate(2, -2);
    } else {
        const leftRot = moving ? (20 * Math.PI / 180) + Math.sin(bob * 0.8) * 0.1 : (30 * Math.PI / 180);
        ctx.rotate(leftRot);
    }

    ctx.fillStyle = skinTone; ctx.fillRect(0, 0, 3.5, 8); // Arm

    // Golden Shield (Parma, small and round for parrying)
    ctx.translate(2, 6);
    ctx.fillStyle = '#b8860b';
    ctx.beginPath(); ctx.ellipse(-2, 0, 3, 9, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffdf00';
    ctx.beginPath(); ctx.ellipse(-3, 0, 1.5, 3, 0.2, 0, Math.PI * 2); ctx.fill(); // Boss
    ctx.restore();

    // ==========================================
    // ĐẦU (Galea Helmet & Red Crest - Elite Face Size)
    // ==========================================
    ctx.fillStyle = skinTone; ctx.fillRect(-2.5, -9 + walkBob, 5, 4); // Neck
    ctx.fillStyle = skinTone; ctx.fillRect(-3.5, -14 + walkBob, 7, 6); // Face

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -12 + walkBob, 1.5, 1);
    ctx.fillRect(1.5, -12 + walkBob, 1.5, 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1.5, -12 + walkBob, 0.5, 0.5);
    ctx.fillRect(2, -12 + walkBob, 0.5, 0.5);

    // Bronze Galea (Helmet) wrapper
    ctx.fillStyle = '#b8860b';
    ctx.beginPath(); ctx.arc(0, -13 + walkBob, 4, Math.PI, 0); ctx.fill(); // Dome
    ctx.fillRect(-4, -13 + walkBob, 8, 1.5); // Brow guard
    ctx.fillRect(-4.5, -12 + walkBob, 1.5, 4); // Cheek guards
    ctx.fillRect(3, -12 + walkBob, 1.5, 4);

    // Red Crest (Crista)
    ctx.fillStyle = '#d12424';
    ctx.beginPath();
    ctx.moveTo(-3, -15 + walkBob);
    ctx.quadraticCurveTo(0, -21 + walkBob, 6, -14 + walkBob);
    ctx.lineTo(4, -13 + walkBob);
    ctx.quadraticCurveTo(0, -18 + walkBob, -1, -15 + walkBob);
    ctx.fill();

    // ==========================================
    // RIGHT ARM & GLADIUS
    // ==========================================
    ctx.save();
    ctx.translate(-4.5, -2 + walkBob);

    if (attackState) {
        ctx.rotate(attackRot);
        ctx.translate(-2, -2); // Lunge offset
    } else {
        const walkRot = moving ? -Math.sin(bob * 0.6) * 0.5 : -0.1;
        ctx.rotate(walkRot);
    }

    ctx.fillStyle = skinTone; ctx.fillRect(-2, 0, 3.5, 8); // Arm
    ctx.fillStyle = skinTone; ctx.fillRect(-1.5, 8, 2.5, 2.5); // Hand

    // Gladius
    ctx.translate(-0.5, 10);
    ctx.fillStyle = '#4a2511'; ctx.fillRect(-1, 0, 2, 4); // Handle
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-2, 4, 4, 1.5); // Guard
    ctx.fillRect(-1.5, -1, 3, 1.5); // Pommel

    // Blade (Thick, leaf-shaped)
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(-1, 5.5);
    ctx.lineTo(-1.5, 16);
    ctx.lineTo(0, 22);
    ctx.lineTo(1.5, 16);
    ctx.lineTo(1, 5.5);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 5.5, 0.5, 14);

    // --- THRUST FX (Lightning fast dash) ---
    if (attackState && attackProgress > 0.4 && attackProgress < 0.8) {
        ctx.strokeStyle = '#ffdf00'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(5, 12); ctx.lineTo(35, 18); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(8, 13); ctx.lineTo(30, 16); ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
}
