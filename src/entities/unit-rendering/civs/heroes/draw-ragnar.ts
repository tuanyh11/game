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
    const berserk = unit.heroSkillActive[0] > 0;

    // ==========================================
    // AURA
    // ==========================================
    if (berserk) {
        // BERSERKER BLOOD AURA — pulsing red
        const bp = Math.sin(unit.animTimer * 8) * 0.15 + 0.4;
        ctx.globalAlpha = bp;
        const bg = ctx.createRadialGradient(0, -2, 2, 0, -2, 30);
        bg.addColorStop(0, '#ff2200');
        bg.addColorStop(0.4, '#cc000066');
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(0, -2, 30, 0, Math.PI * 2); ctx.fill();

        // Blood drip particles effect
        for (let i = 0; i < 4; i++) {
            const da = unit.animTimer * (3 + i * 0.6) + i * 1.5;
            const dr = 12 + Math.sin(unit.animTimer * 2 + i) * 5;
            ctx.globalAlpha = 0.3 + Math.sin(da) * 0.15;
            ctx.fillStyle = i % 2 === 0 ? '#ff3300' : '#cc1100';
            ctx.fillRect(Math.cos(da) * dr - 0.5, -2 + Math.sin(da) * dr * 0.35 - 0.5, 1.5, 1.5);
        }
        ctx.globalAlpha = 1;
    } else {
        // Normal frost aura
        const pulse = Math.sin(unit.animTimer * 6) * 0.2 + 0.3;
        ctx.globalAlpha = pulse;
        const auraGradient = ctx.createRadialGradient(0, Math.max(0, bob) - 2, 0, 0, Math.max(0, bob) - 2, 25);
        auraGradient.addColorStop(0, '#a5f2f3');
        auraGradient.addColorStop(0.5, '#4a90e2');
        auraGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(0, Math.max(0, bob) - 2, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Animation Phase
    let attackRot = 0;
    let attackRotLeft = 0; // for dual axe berserk
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (berserk) {
            // Dual axe — same animation as normal but both arms alternate
            // Right arm: same as normal
            if (attackProgress < 0.2) {
                attackRot = (-Math.PI / 4) * (attackProgress / 0.2);
            } else if (attackProgress < 0.6) {
                attackRot = -Math.PI / 1.5;
            } else {
                const t = (attackProgress - 0.6) / 0.4;
                attackRot = -Math.PI / 1.5 + (Math.PI / 1.5 + Math.PI / 4) * t;
            }
            // Left arm: same phases but offset 50%
            const lp = (attackProgress + 0.5) % 1;
            if (lp < 0.2) {
                attackRotLeft = (-Math.PI / 4) * (lp / 0.2);
            } else if (lp < 0.6) {
                attackRotLeft = -Math.PI / 1.5;
            } else {
                const t = (lp - 0.6) / 0.4;
                attackRotLeft = -Math.PI / 1.5 + (Math.PI / 1.5 + Math.PI / 4) * t;
            }
        } else {
            // Normal single attack
            if (attackProgress < 0.2) {
                attackRot = (-Math.PI / 4) * (attackProgress / 0.2);
            } else if (attackProgress < 0.6) {
                attackRot = -Math.PI / 1.5;
            } else {
                let t = (attackProgress - 0.6) / 0.4;
                attackRot = -Math.PI / 1.5 + (Math.PI / 1.5 + Math.PI / 4) * t;
            }
        }
    }

    // ==========================================
    // ÁO LÔNG ÁC THÚ (Bear Pelt Cloak Background)
    // ==========================================
    // ÁO LÔNG GẤU (Bear Pelt Cloak)
    // ==========================================
    ctx.fillStyle = berserk ? '#4a1510' : '#3a2010';
    ctx.beginPath();
    ctx.moveTo(-5, -7 + walkBob);
    ctx.quadraticCurveTo(-18, -1 + walkBob + windWave, -16, 16 + walkBob - windWave);
    ctx.quadraticCurveTo(-10, 18 + walkBob, -4, 8 + walkBob);
    ctx.fill();
    // Fur texture edge
    ctx.fillStyle = berserk ? '#5a2518' : '#4a3018';
    ctx.beginPath();
    ctx.moveTo(-6, -5 + walkBob);
    ctx.quadraticCurveTo(-14, 0 + walkBob + windWave * 0.7, -13, 13 + walkBob);
    ctx.quadraticCurveTo(-8, 14 + walkBob, -5, 4 + walkBob);
    ctx.fill();
    // Fur tufts along edge
    for (let i = 0; i < 4; i++) {
        const fy = 0 + i * 4 + walkBob;
        ctx.fillStyle = berserk ? '#6a3520' : '#5a4020';
        ctx.fillRect(-15 + i * 1.5, fy + windWave * 0.3, 2, 1.5);
    }
    // Claw clasp
    ctx.fillStyle = '#e8dcc7';
    ctx.beginPath(); ctx.arc(-5, -6 + walkBob, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = berserk ? '#cc4400' : '#8b6f59';
    ctx.beginPath(); ctx.arc(-5, -6 + walkBob, 1.2, 0, Math.PI * 2); ctx.fill();

    // Body Stance
    if (moving && !attackState) {
        ctx.scale(1, 1 - Math.abs(walkBob) * 0.03);
        ctx.rotate(berserk ? 0.3 : 0.2);
    } else if (attackState) {
        ctx.rotate(berserk ? 0.2 : 0.15);
    }

    const skinTone = berserk ? '#d4a090' : cv.skinColor;

    // ==========================================
    // CHÂN (Armored Viking legs)
    // ==========================================
    // Under pants
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-6.5 + legSwing, 6, 5.5, 11);
    ctx.fillRect(1.5 - legSwing, 6, 5.5, 11);
    // Leather wraps
    ctx.fillStyle = '#3a2616';
    ctx.fillRect(-6 + legSwing, 8, 5, 3);
    ctx.fillRect(1 - legSwing, 8, 5, 3);
    // Wrap cross-straps
    ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-6 + legSwing, 8); ctx.lineTo(-2 + legSwing, 11);
    ctx.moveTo(-2 + legSwing, 8); ctx.lineTo(-6 + legSwing, 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1 - legSwing, 8); ctx.lineTo(5 - legSwing, 11);
    ctx.moveTo(5 - legSwing, 8); ctx.lineTo(1 - legSwing, 11);
    ctx.stroke();
    // Iron shin guards
    ctx.fillStyle = '#5a5a60';
    ctx.fillRect(-6.5 + legSwing, 11, 5.5, 5);
    ctx.fillRect(1 - legSwing, 11, 5.5, 5);
    // Shin guard rivets
    ctx.fillStyle = '#8a8a90';
    ctx.beginPath(); ctx.arc(-4 + legSwing, 12.5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-4 + legSwing, 14.5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5 - legSwing, 12.5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5 - legSwing, 14.5, 0.5, 0, Math.PI * 2); ctx.fill();
    // Fur-trimmed boots
    ctx.fillStyle = '#4a2c16';
    ctx.fillRect(-7 + legSwing, 15, 6.5, 3.5);
    ctx.fillRect(1 - legSwing, 15, 6.5, 3.5);
    // Boot fur trim
    ctx.fillStyle = '#8b6f59';
    ctx.fillRect(-7.5 + legSwing, 15, 7.5, 1.5);
    ctx.fillRect(0.5 - legSwing, 15, 7.5, 1.5);
    // Boot soles
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(-3.5 + legSwing, 18.5, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.5 - legSwing, 18.5, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();

    // ==========================================
    // THÂN (Muscular Viking torso)
    // ==========================================
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.moveTo(-7, -6 + walkBob); ctx.lineTo(7, -6 + walkBob);
    ctx.lineTo(6, 7 + walkBob); ctx.lineTo(-6, 7 + walkBob);
    ctx.fill();
    // Muscle definition
    ctx.strokeStyle = berserk ? '#b88070' : '#b8996e'; ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -5 + walkBob); ctx.lineTo(0, 2 + walkBob); ctx.stroke(); // center line
    ctx.beginPath();
    ctx.moveTo(-3, -4 + walkBob); ctx.quadraticCurveTo(-4, -1 + walkBob, -3, 1 + walkBob); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -4 + walkBob); ctx.quadraticCurveTo(4, -1 + walkBob, 3, 1 + walkBob); ctx.stroke();

    // Norse rune tattoos — detailed
    ctx.fillStyle = berserk ? '#882222' : cv.bodyMid;
    // Tyr rune (↑ arrow) on left chest
    ctx.fillRect(-4, -4 + walkBob, 0.7, 4);
    ctx.fillRect(-5, -4 + walkBob, 2.7, 0.7);
    ctx.fillRect(-4.5, -3 + walkBob, 0.7, 1.5);
    ctx.fillRect(-2.6, -3 + walkBob, 0.7, 1.5);
    // Valknut triangle on right
    ctx.beginPath();
    ctx.moveTo(3, -4 + walkBob); ctx.lineTo(5, -1 + walkBob); ctx.lineTo(1, -1 + walkBob); ctx.closePath();
    ctx.fillStyle = berserk ? '#882222' : '#2d5a88';
    ctx.fill();
    // Arm band lines
    ctx.fillRect(-6.5, -2 + walkBob, 1, 0.5);
    ctx.fillRect(-6.5, -1 + walkBob, 1, 0.5);
    ctx.fillRect(5.5, -2 + walkBob, 1, 0.5);
    ctx.fillRect(5.5, -1 + walkBob, 1, 0.5);

    // Thick studded belt
    ctx.fillStyle = '#22140a';
    ctx.fillRect(-7.5, 4.5 + walkBob, 15, 3.5);
    // Belt studs
    ctx.fillStyle = '#8a8a90';
    for (let i = -6; i <= 6; i += 3) {
        ctx.beginPath(); ctx.arc(i, 6 + walkBob, 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // Iron wolf-head buckle
    ctx.fillStyle = berserk ? '#cc4400' : '#7a7a80';
    ctx.fillRect(-3, 5 + walkBob, 6, 3);
    ctx.fillStyle = berserk ? '#ff6600' : '#9e9e9e';
    ctx.fillRect(-2, 5.5 + walkBob, 4, 2);
    // Buckle wolf eyes
    ctx.fillStyle = berserk ? '#ff2200' : '#4a90e2';
    ctx.beginPath(); ctx.arc(-0.8, 6.2 + walkBob, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0.8, 6.2 + walkBob, 0.4, 0, Math.PI * 2); ctx.fill();

    // Bone fang necklace
    ctx.fillStyle = berserk ? '#ffccaa' : '#e8dcc7';
    for (let i = -2; i <= 2; i++) {
        const nx = i * 1.5;
        const ny = -3 + Math.abs(i) * 0.5 + walkBob;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(i * 0.15);
        ctx.fillRect(-0.5, 0, 1, 2.5 - Math.abs(i) * 0.3);
        ctx.restore();
    }
    // Center fang (bigger)
    ctx.fillStyle = berserk ? '#ffddbb' : '#f0e8d8';
    ctx.beginPath();
    ctx.moveTo(-0.6, -2 + walkBob); ctx.lineTo(0.6, -2 + walkBob);
    ctx.lineTo(0, 1 + walkBob); ctx.fill();

    // ==========================================
    // LEFT ARM & AXE
    // ==========================================
    ctx.save();
    ctx.translate(4, -2 + walkBob);
    if (berserk && attackState) {
        ctx.rotate(attackRotLeft);
        ctx.translate(1, -1);
    } else if (attackState && attackProgress < 0.5) {
        ctx.rotate(-Math.PI / 4);
        ctx.translate(2, -2);
    } else {
        const leftRot = moving ? (20 * Math.PI / 180) + Math.sin(bob * 0.8) * 0.1 : (30 * Math.PI / 180);
        ctx.rotate(berserk ? leftRot - 0.15 : leftRot);
    }

    // Muscular arm
    ctx.fillStyle = skinTone; ctx.fillRect(0, 0, 4, 8);
    // Tattoo band
    ctx.fillStyle = berserk ? '#882222' : '#2d5a88';
    ctx.fillRect(0.5, 1.5, 3, 0.6);
    ctx.fillRect(0.5, 2.5, 3, 0.6);
    // Leather vambrace
    ctx.fillStyle = '#3a2616'; ctx.fillRect(-0.5, 4, 4.5, 3);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-0.5, 4, 4.5, 0.6);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-0.5, 6.5, 4.5, 0.6);
    // Hand
    ctx.fillStyle = skinTone; ctx.fillRect(0.5, 7, 3, 3);

    ctx.translate(1, 10);
    // Axe handle — wrapped leather
    ctx.fillStyle = '#3d2616'; ctx.fillRect(-1.5, -2, 2.5, 13);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1.5, 0, 2.5, 0.5);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1.5, 3, 2.5, 0.5);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1.5, 6, 2.5, 0.5);
    // Axe Head — large Viking war axe
    ctx.fillStyle = berserk ? '#993333' : '#788496';
    ctx.beginPath();
    ctx.moveTo(-0.5, 5); ctx.lineTo(-8, 1); ctx.quadraticCurveTo(-12, 7, -8, 13);
    ctx.lineTo(-0.5, 11); ctx.fill();
    // Axe edge highlight
    ctx.strokeStyle = berserk ? '#cc4444' : '#aabbcc'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-8, 1); ctx.quadraticCurveTo(-12, 7, -8, 13); ctx.stroke();
    // Rune engraving on blade
    ctx.fillStyle = berserk ? '#ff4444' : '#d12424';
    ctx.fillRect(-6, 6, 2, 2);
    ctx.fillRect(-5, 5, 0.5, 4);

    // Berserk slash trail — left
    if (berserk && attackState && attackProgress > 0.35 && attackProgress < 0.7) {
        const eff = attackProgress < 0.55 ? (attackProgress - 0.35) / 0.2 : 1 - (attackProgress - 0.55) / 0.15;
        ctx.globalAlpha = eff * 0.4;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.moveTo(8, 4);
        ctx.quadraticCurveTo(16, 8, 14, 18); ctx.lineTo(2, 12); ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();

    // ==========================================
    // ĐẦU (Norse warrior head)
    // ==========================================
    // Thick neck
    ctx.fillStyle = skinTone; ctx.fillRect(-3, -9 + walkBob, 6, 4);
    // Neck tattoo
    ctx.fillStyle = berserk ? '#882222' : '#2d5a88';
    ctx.fillRect(-2, -7 + walkBob, 4, 0.5);
    // Face
    ctx.fillStyle = skinTone; ctx.fillRect(-4, -15 + walkBob, 8, 7);
    // Battle scar
    ctx.strokeStyle = berserk ? '#cc8888' : '#c8a888'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-3.5, -13 + walkBob); ctx.lineTo(-2, -10 + walkBob); ctx.stroke();

    // War paint — thick bands across eyes
    ctx.fillStyle = berserk ? '#882222' : '#2d5a88';
    ctx.fillRect(-4.5, -13 + walkBob, 9, 2.8);
    // Paint drip detail
    ctx.fillRect(-3.5, -10.2 + walkBob, 1, 1.5);
    ctx.fillRect(2.5, -10.2 + walkBob, 1, 1);

    // Eyes
    if (berserk) {
        ctx.fillStyle = '#ff2200';
        ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 5;
        ctx.fillRect(-3, -12 + walkBob, 2, 1.2);
        ctx.fillRect(1, -12 + walkBob, 2, 1.2);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#a5f2f3';
        ctx.fillRect(-3, -12 + walkBob, 1.8, 1);
        ctx.fillRect(1.2, -12 + walkBob, 1.8, 1);
        // Pupils
        ctx.fillStyle = '#1a3050';
        ctx.fillRect(-2.2, -11.8 + walkBob, 0.6, 0.6);
        ctx.fillRect(1.8, -11.8 + walkBob, 0.6, 0.6);
    }

    // Braided beard — detailed
    ctx.fillStyle = berserk ? '#aa7744' : '#c89a58';
    ctx.fillRect(-4.5, -9 + walkBob, 9, 3);
    // Beard braids
    ctx.fillRect(-3, -6 + walkBob, 2.2, 4);
    ctx.fillRect(1, -6 + walkBob, 2.2, 4);
    // Bead ties on braids
    ctx.fillStyle = berserk ? '#cc4400' : '#8a8a90';
    ctx.beginPath(); ctx.arc(-2, -3 + walkBob, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -3 + walkBob, 0.6, 0, Math.PI * 2); ctx.fill();
    // Center chin
    ctx.fillStyle = berserk ? '#997744' : '#b8944e';
    ctx.fillRect(-1, -7 + walkBob, 2, 2);

    // Hair — shaved sides with braided mohawk + flowing braids
    ctx.fillStyle = berserk ? '#aa7744' : '#c89a58';
    // Mohawk top
    ctx.fillRect(-2.5, -16 + walkBob, 5, 3.5);
    // Flowing braid behind
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = berserk ? '#aa7744' : '#c89a58';
    ctx.beginPath();
    ctx.moveTo(0, -14 + walkBob);
    ctx.quadraticCurveTo(6, -12 + walkBob, 5, -4 + walkBob + windWave * 0.5);
    ctx.stroke();
    // Second braid
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(1, -14.5 + walkBob);
    ctx.quadraticCurveTo(7, -10 + walkBob, 6, -2 + walkBob + windWave * 0.4);
    ctx.stroke();
    // Braid beads
    ctx.fillStyle = berserk ? '#cc4400' : '#8a8a90';
    ctx.beginPath(); ctx.arc(5, -5 + walkBob + windWave * 0.4, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -3 + walkBob + windWave * 0.3, 0.7, 0, Math.PI * 2); ctx.fill();
    // Shaved sides detail
    ctx.fillStyle = berserk ? '#886644' : '#a88048';
    ctx.fillRect(-4, -14.5 + walkBob, 1.5, 2);
    ctx.fillRect(2.5, -14.5 + walkBob, 1.5, 2);

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
        ctx.rotate(berserk ? walkRot - 0.1 : walkRot);
    }

    // Muscular arm
    ctx.fillStyle = skinTone; ctx.fillRect(-2.5, 0, 4, 8);
    // Tattoo band
    ctx.fillStyle = berserk ? '#882222' : '#2d5a88';
    ctx.fillRect(-2, 1.5, 3, 0.6);
    ctx.fillRect(-2, 2.5, 3, 0.6);
    // Leather vambrace
    ctx.fillStyle = '#3a2616'; ctx.fillRect(-3, 4, 4.5, 3);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-3, 4, 4.5, 0.6);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-3, 6.5, 4.5, 0.6);
    // Hand
    ctx.fillStyle = skinTone; ctx.fillRect(-2, 7, 3, 3);

    ctx.translate(-0.5, 10);
    // Axe handle — wrapped
    ctx.fillStyle = '#3d2616'; ctx.fillRect(-1, -2, 2.5, 14);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1, 0, 2.5, 0.5);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1, 3, 2.5, 0.5);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1, 6, 2.5, 0.5);

    // Axe Head — large curved Viking war axe
    ctx.fillStyle = berserk ? '#993333' : '#788496';
    ctx.beginPath();
    ctx.moveTo(-1, 5); ctx.lineTo(-8, 1); ctx.quadraticCurveTo(-12, 7, -8, 13);
    ctx.lineTo(-1, 11); ctx.fill();
    // Axe edge highlight
    ctx.strokeStyle = berserk ? '#cc4444' : '#aabbcc'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-8, 1); ctx.quadraticCurveTo(-12, 7, -8, 13); ctx.stroke();
    // Ice crystal / blood rune
    ctx.fillStyle = berserk ? '#ff4444' : '#a5f2f3';
    ctx.fillRect(-6, 6, 2, 2);
    ctx.fillRect(-5, 5, 0.5, 4);

    // --- SLASH IMPACT ---
    if (attackState && attackProgress > 0.4 && attackProgress < 0.8) {
        if (berserk) {
            // Blood slash effect
            ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 8;
            ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 10, 24, -Math.PI / 8, Math.PI / 2); ctx.stroke();
            ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 10, 20, Math.PI / 2, Math.PI + Math.PI / 8); ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            ctx.shadowColor = '#a5f2f3'; ctx.shadowBlur = 10;
            ctx.strokeStyle = '#e0ffff'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 10, 24, -Math.PI / 8, Math.PI / 2); ctx.stroke();
            ctx.shadowColor = '#d12424';
            ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 10, 22, Math.PI / 2, Math.PI + Math.PI / 8); ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    ctx.restore();
    ctx.restore();
}
