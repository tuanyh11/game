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
        // Lean into the chop based on attack phase
        let lean = 0;
        if (attackProgress < 0.2) {
            lean = attackProgress / 0.2 * 0.12; // wind up
        } else if (attackProgress < 0.6) {
            lean = 0.12 + (attackProgress - 0.2) / 0.4 * 0.08; // strike lean
        } else {
            lean = 0.2 * (1 - (attackProgress - 0.6) / 0.4); // recover
        }
        ctx.scale(1, 1 + lean * 0.05);
        ctx.translate(0, -lean * 8);
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
    // THÂN (Heavy Viking Armor)
    // ==========================================
    // Chainmail base
    const armorBase = berserk ? '#5a2a20' : '#4a4a50';
    const armorLight = berserk ? '#7a3a28' : '#6a6a70';
    const armorDark = berserk ? '#3a1a10' : '#3a3a40';
    const metalColor = berserk ? '#8a4a30' : '#7a7a80';

    ctx.fillStyle = armorBase;
    ctx.beginPath();
    ctx.moveTo(-7, -6 + walkBob); ctx.lineTo(7, -6 + walkBob);
    ctx.lineTo(6, 7 + walkBob); ctx.lineTo(-6, 7 + walkBob);
    ctx.fill();

    // Chainmail ring texture
    ctx.fillStyle = armorLight;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            const cx = -5 + col * 2.5 + (row % 2) * 1.2;
            const cy = -4 + row * 2.5 + walkBob;
            ctx.beginPath(); ctx.arc(cx, cy, 0.8, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Iron chest plate overlay
    ctx.fillStyle = metalColor;
    ctx.beginPath();
    ctx.moveTo(-5, -5 + walkBob); ctx.lineTo(5, -5 + walkBob);
    ctx.lineTo(4, 2 + walkBob); ctx.lineTo(-4, 2 + walkBob);
    ctx.fill();
    // Plate shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-3, -4 + walkBob, 6, 1);

    // Valknut emblem on chest
    ctx.fillStyle = berserk ? '#ff4422' : '#a5f2f3';
    ctx.beginPath();
    ctx.moveTo(0, -3 + walkBob); ctx.lineTo(-2.5, 1 + walkBob); ctx.lineTo(2.5, 1 + walkBob);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = armorBase;
    ctx.beginPath();
    ctx.moveTo(0, -1.5 + walkBob); ctx.lineTo(-1.2, 0.5 + walkBob); ctx.lineTo(1.2, 0.5 + walkBob);
    ctx.closePath(); ctx.fill();

    // Iron shoulder guards (pauldrons) — symmetric
    ctx.fillStyle = metalColor;
    ctx.beginPath(); ctx.arc(-6, -5 + walkBob, 3.5, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -5 + walkBob, 3.5, Math.PI, 0); ctx.fill();
    // Pauldron rivets
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.arc(-6, -6 + walkBob, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -6 + walkBob, 0.5, 0, Math.PI * 2); ctx.fill();

    // Thick studded belt
    ctx.fillStyle = '#22140a';
    ctx.fillRect(-7.5, 4.5 + walkBob, 15, 3.5);
    ctx.fillStyle = '#8a8a90';
    for (let i = -6; i <= 6; i += 3) {
        ctx.beginPath(); ctx.arc(i, 6 + walkBob, 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // Iron wolf-head buckle
    ctx.fillStyle = berserk ? '#cc4400' : '#7a7a80';
    ctx.fillRect(-3, 5 + walkBob, 6, 3);
    ctx.fillStyle = berserk ? '#ff6600' : '#9e9e9e';
    ctx.fillRect(-2, 5.5 + walkBob, 4, 2);
    ctx.fillStyle = berserk ? '#ff2200' : '#4a90e2';
    ctx.beginPath(); ctx.arc(-0.8, 6.2 + walkBob, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0.8, 6.2 + walkBob, 0.4, 0, Math.PI * 2); ctx.fill();

    // Bone fang necklace over armor
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

    // Armored arm
    ctx.fillStyle = armorBase; ctx.fillRect(0, 0, 4, 4);
    ctx.fillStyle = skinTone; ctx.fillRect(0, 4, 4, 4);
    // Iron vambrace
    ctx.fillStyle = metalColor; ctx.fillRect(-0.5, 4, 4.5, 3);
    ctx.fillStyle = armorLight; ctx.fillRect(-0.5, 4, 4.5, 0.6);
    ctx.fillStyle = armorLight; ctx.fillRect(-0.5, 6.5, 4.5, 0.6);
    // Hand
    ctx.fillStyle = skinTone; ctx.fillRect(0.5, 7, 3, 3);

    ctx.translate(1, 10);
    // Axe handle
    ctx.fillStyle = '#3d2616'; ctx.fillRect(-1.5, -2, 2.5, 13);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1.5, 0, 2.5, 0.5);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1.5, 3, 2.5, 0.5);
    ctx.fillStyle = '#5a4020'; ctx.fillRect(-1.5, 6, 2.5, 0.5);
    // Axe Head
    ctx.fillStyle = berserk ? '#993333' : '#788496';
    ctx.beginPath();
    ctx.moveTo(-0.5, 5); ctx.lineTo(-8, 1); ctx.quadraticCurveTo(-12, 7, -8, 13);
    ctx.lineTo(-0.5, 11); ctx.fill();
    ctx.strokeStyle = berserk ? '#cc4444' : '#aabbcc'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-8, 1); ctx.quadraticCurveTo(-12, 7, -8, 13); ctx.stroke();
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
    // ĐẦU — Viking Helmet (symmetric)
    // ==========================================
    ctx.save();
    const hb = walkBob;

    // Chainmail aventail (neck guard hanging from helmet) — behind face
    ctx.fillStyle = armorDark;
    ctx.fillRect(-5, -8 + hb, 10, 3);
    ctx.fillStyle = armorLight;
    for (let i = 0; i < 4; i++) ctx.fillRect(-4 + i * 2, -7 + hb, 1, 2);

    // Thick neck
    ctx.fillStyle = skinTone;
    ctx.fillRect(-3, -9 + hb, 6, 4);

    // Face
    ctx.fillStyle = skinTone;
    ctx.fillRect(-4, -15 + hb, 8, 7);

    // War paint — thick bands across eyes
    ctx.fillStyle = berserk ? '#882222' : '#2d5a88';
    ctx.fillRect(-4.5, -13.5 + hb, 9, 2.5);
    ctx.fillRect(-3.5, -11 + hb, 1, 1.2);
    ctx.fillRect(2.5, -11 + hb, 1, 1);

    // Eyes
    if (berserk) {
        ctx.fillStyle = '#ff2200';
         
        ctx.fillRect(-3, -12.5 + hb, 2.2, 1.4);
        ctx.fillRect(1, -12.5 + hb, 2.2, 1.4);
        
    } else {
        ctx.fillStyle = '#a5f2f3';
        ctx.fillRect(-3, -12.5 + hb, 2, 1.2);
        ctx.fillRect(1.2, -12.5 + hb, 2, 1.2);
        ctx.fillStyle = '#1a3050';
        ctx.fillRect(-2.2, -12.3 + hb, 0.7, 0.7);
        ctx.fillRect(1.8, -12.3 + hb, 0.7, 0.7);
    }

    // Nose
    ctx.fillStyle = berserk ? '#c89880' : '#c8a878';
    ctx.fillRect(-0.5, -11.5 + hb, 1, 2);

    // Braided beard (symmetric, hanging down)
    ctx.fillStyle = berserk ? '#aa7744' : '#c89a58';
    ctx.fillRect(-4.5, -9 + hb, 9, 3);
    ctx.fillRect(-3, -6 + hb, 2.2, 4);
    ctx.fillRect(1, -6 + hb, 2.2, 4);
    ctx.fillStyle = berserk ? '#cc4400' : '#8a8a90';
    ctx.beginPath(); ctx.arc(-2, -3 + hb, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -3 + hb, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = berserk ? '#997744' : '#b8944e';
    ctx.fillRect(-1, -7 + hb, 2, 2);

    // === VIKING SPECTACLE HELMET (symmetric) ===
    const helmBase = berserk ? '#5a2a18' : '#5a5a60';
    const helmLight = berserk ? '#7a3a20' : '#7a7a82';
    const helmDark = berserk ? '#3a1a10' : '#3a3a40';

    // Helmet dome
    ctx.fillStyle = helmBase;
    ctx.beginPath();
    ctx.arc(0, -14 + hb, 5.5, Math.PI, 0);
    ctx.fill();
    // Helmet base band
    ctx.fillRect(-5.5, -14 + hb, 11, 2);

    // Center ridge (nasal to back)
    ctx.fillStyle = helmLight;
    ctx.fillRect(-0.8, -19 + hb, 1.6, 7);

    // Nose guard (nasal)
    ctx.fillStyle = helmLight;
    ctx.fillRect(-0.8, -14 + hb, 1.6, 5);

    // Eye guard frames (spectacle shape — symmetric)
    ctx.strokeStyle = helmLight; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(-2.5, -13 + hb, 2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(2.5, -13 + hb, 2, 0, Math.PI * 2); ctx.stroke();

    // Helmet rivets (symmetric)
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.arc(-4, -15 + hb, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -15 + hb, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-3, -17 + hb, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -17 + hb, 0.4, 0, Math.PI * 2); ctx.fill();

    // BERSERK: Glowing horns + red-hot helmet
    if (berserk) {
        // Burning horns
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(-5, -15 + hb); ctx.lineTo(-8, -22 + hb); ctx.lineTo(-4, -16 + hb);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, -15 + hb); ctx.lineTo(8, -22 + hb); ctx.lineTo(4, -16 + hb);
        ctx.fill();
        // Horn glow
        ctx.fillStyle = '#ff4400';
        ctx.globalAlpha = 0.4 + Math.sin(unit.animTimer * 8) * 0.2;
        ctx.beginPath(); ctx.arc(-7, -20 + hb, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -20 + hb, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Red hot edge
        ctx.strokeStyle = '#cc3300'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(0, -14 + hb, 5.5, Math.PI, 0); ctx.stroke();
    } else {
        // Normal: small iron horns
        ctx.fillStyle = '#8a8a88';
        ctx.beginPath();
        ctx.moveTo(-5, -15 + hb); ctx.lineTo(-7, -20 + hb); ctx.lineTo(-4, -16 + hb);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, -15 + hb); ctx.lineTo(7, -20 + hb); ctx.lineTo(4, -16 + hb);
        ctx.fill();
        // Frost rune on helmet
        ctx.fillStyle = '#a5f2f3';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(-0.3, -18 + hb, 0.6, 3);
        ctx.fillRect(-1.5, -16.5 + hb, 3, 0.5);
        ctx.globalAlpha = 1;
    }

    ctx.restore(); // End head

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
             
            ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 10, 24, -Math.PI / 8, Math.PI / 2); ctx.stroke();
            ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 10, 20, Math.PI / 2, Math.PI + Math.PI / 8); ctx.stroke();
            
        } else {
             
            ctx.strokeStyle = '#e0ffff'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 10, 24, -Math.PI / 8, Math.PI / 2); ctx.stroke();
            
            ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 10, 22, Math.PI / 2, Math.PI + Math.PI / 8); ctx.stroke();
            
        }
    }

    ctx.restore();
    ctx.restore();
}
