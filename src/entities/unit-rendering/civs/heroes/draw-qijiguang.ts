import type { Unit } from '../../../Unit';
import type { CivColors } from '../../shared';

export function drawQiJiguangComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();

    const atk = unit.state === 5;
    const wB = moving ? Math.sin(bob * 0.5) * 1.5 : 0;
    const lS = moving ? Math.sin(bob * 0.7) * 4 : 0;
    const cW = Math.sin(unit.animTimer * 4) * 2;
    const T = unit.animTimer;
    const breathe = Math.sin(T * 3) * 0.5;
    const skillActive = unit.heroSkillActive[0] > 0;
    const skin = skillActive ? '#c8b8d0' : cv.skinColor; // pale purple skin when transformed
    const mingRed = skillActive ? '#2a1a4a' : cv.bodyMid;  // team color cape/sash
    const darkRed = skillActive ? '#1a0a3a' : cv.bodyDark;   // deep team color accents
    const goldDk = skillActive ? '#4455aa' : '#8b6914';    // electric blue instead of dark gold
    const gold = skillActive ? '#6688cc' : '#c9a438';      // silver-blue instead of gold
    const goldBr = skillActive ? '#aaccff' : '#ffe066';    // lightning white instead of bright gold
    const steel = skillActive ? '#0a0a18' : '#2a2a30';     // pitch black instead of steel

    // ── ATTACK PHASES (same for normal and skill) ──
    let ap = 0, bodyLean = 0, rightArmRot = 0.2, lungeX = 0;

    if (atk) {
        ap = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (ap < 0.15) {
            const t = ap / 0.15, e = t * t;
            rightArmRot = -0.1 + (-Math.PI * 0.75 + 0.1) * e;
            bodyLean = -0.1 * e; lungeX = -1 * e;
        } else if (ap < 0.25) {
            rightArmRot = -Math.PI * 0.75;
            bodyLean = -0.1; lungeX = -1;
        } else if (ap < 0.45) {
            const t = (ap - 0.25) / 0.2, e = 1 - Math.pow(1 - t, 4);
            rightArmRot = (-Math.PI * 0.75) * (1 - e) + (Math.PI * 0.45) * e;
            bodyLean = -0.1 * (1 - e) + 0.15 * e;
            lungeX = -1 * (1 - e) + 6 * e;
        } else if (ap < 0.55) {
            const t = (ap - 0.45) / 0.1;
            const sh = Math.sin(t * Math.PI * 6) * 0.04 * (1 - t);
            rightArmRot = Math.PI * 0.45 + sh;
            bodyLean = 0.15 + sh; lungeX = 6 - t;
        } else {
            const t = (ap - 0.55) / 0.45, e = t * t * (3 - 2 * t);
            rightArmRot = (Math.PI * 0.45) * (1 - e) + (-0.1) * e;
            bodyLean = 0.15 * (1 - e); lungeX = 5 * (1 - e);
        }
    }

    // ── AURA ──
    if (skillActive) {
        // ═══ SUPER SAIYAN-STYLE TRANSFORMATION ═══
        ctx.save();

        // 1. Ground energy ring — expanding/pulsing
        const ringPulse = 0.6 + Math.sin(T * 8) * 0.15;
        ctx.globalAlpha = 0.25 * ringPulse;
        ctx.strokeStyle = '#44ffaa';
        ctx.lineWidth = 2;
        const ringR = 22 + Math.sin(T * 5) * 4;
        ctx.beginPath(); ctx.ellipse(0, 14, ringR, 5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#44ffaa';
        ctx.beginPath(); ctx.ellipse(0, 14, ringR - 2, 4, 0, 0, Math.PI * 2); ctx.fill();

        // 2. Rising energy column — tall flame pillar behind body
        ctx.globalAlpha = 0.12 + Math.sin(T * 6) * 0.05;
        const colGrd = ctx.createLinearGradient(0, 20, 0, -45);
        colGrd.addColorStop(0, '#44ffaa00');
        colGrd.addColorStop(0.3, '#44ffaa44');
        colGrd.addColorStop(0.6, '#88ffcc22');
        colGrd.addColorStop(1, '#ffffff00');
        ctx.fillStyle = colGrd;
        const colW = 14 + Math.sin(T * 7) * 3;
        ctx.fillRect(-colW / 2, -40, colW, 55);

        // 3. Inner energy glow — intense core
        ctx.globalAlpha = 0.35 + Math.sin(T * 8) * 0.1;
        const coreGrd = ctx.createRadialGradient(0, -4, 1, 0, -4, 20);
        coreGrd.addColorStop(0, '#ffffff');
        coreGrd.addColorStop(0.2, '#aaffdd');
        coreGrd.addColorStop(0.5, '#44ddaa66');
        coreGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrd;
        ctx.beginPath(); ctx.arc(0, -4, 20, 0, Math.PI * 2); ctx.fill();

        // 4. Flame-like energy streams — rising upward like SSJ aura
        for (let i = 0; i < 8; i++) {
            const fx = -6 + (i / 7) * 12;
            const phase = T * (6 + i * 0.5) + i * 1.1;
            const flameH = 18 + Math.sin(phase) * 8;
            const flameW = 2 + Math.sin(phase * 1.3) * 1;
            const fy = -6 - Math.abs(Math.sin(phase * 0.7)) * flameH;

            ctx.globalAlpha = 0.2 + Math.sin(phase) * 0.1;
            ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#88ffcc' : '#44ddaa';
            ctx.beginPath();
            ctx.moveTo(fx - flameW, 5);
            ctx.quadraticCurveTo(fx - flameW * 0.5, fy + flameH * 0.3, fx, fy);
            ctx.quadraticCurveTo(fx + flameW * 0.5, fy + flameH * 0.3, fx + flameW, 5);
            ctx.fill();
        }

        // 5. Electric lightning sparks — crackling randomly
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const sparkPhase = T * 12 + i * 3.7;
            const sparkOn = Math.sin(sparkPhase) > 0.3; // flicker on/off
            if (!sparkOn) continue;

            const sx = Math.sin(sparkPhase * 1.3 + i) * 14;
            const sy = -8 + Math.sin(sparkPhase * 0.9 + i * 2) * 12;
            ctx.globalAlpha = 0.5 + Math.sin(sparkPhase * 3) * 0.3;
            ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#aaffee';

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            // Zigzag lightning
            const segments = 3;
            let lx = sx, ly = sy;
            for (let s = 0; s < segments; s++) {
                const nx = lx + (Math.sin(sparkPhase * 2 + s * 4) * 6);
                const ny = ly + 4 + Math.sin(sparkPhase * 3 + s) * 3;
                ctx.lineTo(nx, ny);
                lx = nx; ly = ny;
            }
            ctx.stroke();
        }

        // 6. Rising energy particles — floating upward
        for (let i = 0; i < 6; i++) {
            const pPhase = (T * 2 + i * 0.8) % 1;
            const px = Math.sin(T * 3 + i * 2.1) * 12;
            const py = 10 - pPhase * 35;
            const pSize = (1 - pPhase) * 2.5;
            if (pSize > 0.3) {
                ctx.globalAlpha = (1 - pPhase) * 0.5;
                ctx.fillStyle = i % 2 === 0 ? '#aaffdd' : '#ffffff';
                ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();
            }
        }

        // 7. Spiky energy crown above head
        ctx.globalAlpha = 0.3 + Math.sin(T * 10) * 0.1;
        for (let i = 0; i < 5; i++) {
            const sa = -Math.PI * 0.8 + (i / 4) * Math.PI * 0.6;
            const sLen = 8 + Math.sin(T * 8 + i * 1.5) * 4;
            ctx.strokeStyle = '#aaffcc';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(Math.cos(sa) * 5, -18 + Math.sin(sa) * 3);
            ctx.lineTo(Math.cos(sa) * (5 + sLen), -18 + Math.sin(sa) * (3 + sLen * 0.3));
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    } else {
        const pulse = Math.sin(T * 4) * 0.12 + 0.2;
        ctx.globalAlpha = pulse;
        const ag = ctx.createRadialGradient(0, -3, 4, 0, -3, 24);
        ag.addColorStop(0, '#ffd700'); ag.addColorStop(0.6, '#ff660022'); ag.addColorStop(1, 'transparent');
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(0, -3, 24, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Body glow overlay when skill active
    const bodyGlow = skillActive;

    // ── BODY TRANSFORM ──
    ctx.translate(lungeX, 3);
    if (bodyLean !== 0) {
        ctx.translate(0, 8 + wB); ctx.rotate(bodyLean); ctx.translate(0, -(8 + wB));
    } else if (moving) {
        ctx.translate(0, 3 + breathe);
    } else {
        ctx.translate(0, 3 + breathe);
    }

    // ── CAPE (flowing war cloak) ──
    ctx.save();
    ctx.fillStyle = mingRed;
    ctx.beginPath();
    ctx.moveTo(-4, -7 + wB);
    ctx.quadraticCurveTo(-20, -1 + wB + cW, -17, 15 + wB - cW * 0.5);
    ctx.quadraticCurveTo(-10, 18 + wB, -3, 8 + wB);
    ctx.fill();
    // Inner silk lining
    ctx.fillStyle = darkRed;
    ctx.beginPath();
    ctx.moveTo(-5, -5 + wB);
    ctx.quadraticCurveTo(-16, 0 + wB + cW * 0.7, -14, 12 + wB - cW * 0.3);
    ctx.quadraticCurveTo(-8, 14 + wB, -4, 2 + wB);
    ctx.fill();
    // Gold trim edge
    ctx.strokeStyle = gold; ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-4, -7 + wB);
    ctx.quadraticCurveTo(-20, -1 + wB + cW, -17, 15 + wB - cW * 0.5);
    ctx.stroke();
    // Cape pattern — horizontal bands
    ctx.strokeStyle = goldDk; ctx.lineWidth = 0.3;
    for (let i = 0; i < 3; i++) {
        const cy = 2 + i * 4 + wB;
        ctx.beginPath();
        ctx.moveTo(-5, cy);
        ctx.quadraticCurveTo(-14, cy + 1 + cW * 0.3, -13, cy + 2);
        ctx.stroke();
    }
    ctx.restore();

    // ── LEGS (armored greaves) ──
    // Under-layer dark pants
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(-5.5 + lS, 7, 5, 11);
    ctx.fillRect(0.5 - lS, 7, 5, 11);
    // Armored greaves
    ctx.fillStyle = goldDk;
    ctx.fillRect(-6 + lS, 8.5, 5.5, 8);
    ctx.fillRect(0.5 - lS, 8.5, 5.5, 8);
    // Greave highlight
    ctx.fillStyle = gold;
    ctx.fillRect(-5.5 + lS, 9, 2, 7);
    ctx.fillRect(1 - lS, 9, 2, 7);
    // Greave edge lines
    ctx.fillStyle = '#6a4a10';
    ctx.fillRect(-5.5 + lS, 12, 5, 0.5);
    ctx.fillRect(0.5 - lS, 12, 5, 0.5);
    // Knee plates
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(-3 + lS, 9, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 - lS, 9, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = goldBr;
    ctx.beginPath(); ctx.arc(-3 + lS, 9, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 - lS, 9, 1.5, 0, Math.PI * 2); ctx.fill();
    // Knee rivets
    ctx.fillStyle = '#6a4a10';
    ctx.beginPath(); ctx.arc(-3 + lS, 9, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 - lS, 9, 0.5, 0, Math.PI * 2); ctx.fill();
    // Ankle guard
    ctx.fillStyle = goldDk;
    ctx.fillRect(-5.5 + lS, 15.5, 5, 1.2); ctx.fillRect(0.5 - lS, 15.5, 5, 1.2);
    // Boots
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(-3 + lS, 17.5, 3.8, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3 - lS, 17.5, 3.8, 2, 0, 0, Math.PI * 2); ctx.fill();

    // ── TORSO (lamellar armor) ──
    // Base layer
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(-7, -6 + wB); ctx.lineTo(7, -6 + wB);
    ctx.lineTo(6.5, 7 + wB); ctx.lineTo(-6.5, 7 + wB); ctx.fill();
    // Main armor plate
    ctx.fillStyle = goldDk; ctx.fillRect(-7.5, -5.5 + wB, 15, 10);
    // Lamellar scale rows — 4 rows of individual plates
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
            const sx = -6.5 + col * 2.3, sy = -4.5 + row * 2.4 + wB;
            // Scale plate
            ctx.fillStyle = row % 2 === col % 2 ? '#7a5a14' : '#6a4a10';
            ctx.beginPath();
            ctx.moveTo(sx, sy); ctx.lineTo(sx + 2, sy);
            ctx.lineTo(sx + 1.8, sy + 2); ctx.lineTo(sx + 0.2, sy + 2);
            ctx.closePath(); ctx.fill();
            // Highlight on each scale
            ctx.fillStyle = gold;
            ctx.fillRect(sx + 0.2, sy, 1.6, 0.5);
            // Rivet dot
            ctx.fillStyle = goldBr;
            ctx.beginPath(); ctx.arc(sx + 1, sy + 1, 0.3, 0, Math.PI * 2); ctx.fill();
        }
    }
    // Chest emblem — ornate center piece
    ctx.fillStyle = mingRed;
    ctx.beginPath();
    ctx.moveTo(0, -4.5 + wB); ctx.lineTo(3.5, -2 + wB);
    ctx.lineTo(3, 1.5 + wB); ctx.lineTo(0, 2.5 + wB);
    ctx.lineTo(-3, 1.5 + wB); ctx.lineTo(-3.5, -2 + wB);
    ctx.closePath(); ctx.fill();
    // Emblem inner detail — cross pattern
    ctx.fillStyle = goldBr;
    ctx.fillRect(-0.4, -3.5 + wB, 0.8, 5);
    ctx.fillRect(-2.5, -0.8 + wB, 5, 0.7);
    // Emblem border
    ctx.strokeStyle = gold; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -4.5 + wB); ctx.lineTo(3.5, -2 + wB);
    ctx.lineTo(3, 1.5 + wB); ctx.lineTo(0, 2.5 + wB);
    ctx.lineTo(-3, 1.5 + wB); ctx.lineTo(-3.5, -2 + wB);
    ctx.closePath(); ctx.stroke();

    // Wide sash + jade buckle
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-8, 3.5 + wB, 16, 3.5);
    ctx.fillStyle = mingRed; ctx.fillRect(-8, 4 + wB, 16, 2.2);
    // Sash pattern
    ctx.fillStyle = darkRed;
    ctx.fillRect(-8, 5 + wB, 16, 0.4);
    // Jade buckle
    ctx.fillStyle = '#22cc88';
    ctx.beginPath(); ctx.arc(0, 5 + wB, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#44eebb';
    ctx.beginPath(); ctx.arc(0, 5 + wB, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22cc88';
    ctx.beginPath(); ctx.arc(0, 5 + wB, 0.6, 0, Math.PI * 2); ctx.fill();

    // Tasset skirt — layered protective panels
    ctx.fillStyle = goldDk;
    ctx.beginPath(); ctx.moveTo(-7.5, 6.5 + wB); ctx.lineTo(7.5, 6.5 + wB);
    ctx.lineTo(10, 12 + wB); ctx.lineTo(-10, 12 + wB); ctx.fill();
    // Tasset vertical panels
    ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = 0.5;
    for (let i = -7; i <= 7; i += 2.5) {
        ctx.beginPath(); ctx.moveTo(i, 6.5 + wB); ctx.lineTo(i + 0.6, 12 + wB); ctx.stroke();
    }
    // Tasset bottom trim
    ctx.fillStyle = gold; ctx.fillRect(-9.5, 11 + wB, 19, 1);
    // Tasset highlight scales
    for (let i = -8; i <= 7; i += 3) {
        ctx.fillStyle = gold;
        ctx.fillRect(i, 7.5 + wB, 2, 0.5);
    }

    // Pauldrons — large layered shoulder guards
    // Left pauldron
    ctx.fillStyle = goldDk;
    ctx.beginPath(); ctx.arc(-4.5, -5.5 + wB, 4.2, Math.PI, 0); ctx.fill();
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(-4.5, -5.5 + wB, 3, Math.PI, 0); ctx.fill();
    ctx.fillStyle = goldBr;
    ctx.beginPath(); ctx.arc(-4.5, -5.5 + wB, 1.8, Math.PI, 0); ctx.fill();
    // Pauldron rivet
    ctx.fillStyle = '#6a4a10';
    ctx.beginPath(); ctx.arc(-4.5, -6 + wB, 0.6, 0, Math.PI * 2); ctx.fill();
    // Right pauldron
    ctx.fillStyle = goldDk;
    ctx.beginPath(); ctx.arc(4.5, -5.5 + wB, 4.2, Math.PI, 0); ctx.fill();
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(4.5, -5.5 + wB, 3, Math.PI, 0); ctx.fill();
    ctx.fillStyle = goldBr;
    ctx.beginPath(); ctx.arc(4.5, -5.5 + wB, 1.8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#6a4a10';
    ctx.beginPath(); ctx.arc(4.5, -6 + wB, 0.6, 0, Math.PI * 2); ctx.fill();

    // ── LEFT ARM (idle only — during attack, drawn as diagonal to handle below) ──
    if (!atk) {
        ctx.save();
        ctx.translate(5, -3 + wB);
        ctx.rotate(moving ? -0.15 + Math.sin(bob * 0.8) * 0.1 : -0.3);
        ctx.fillStyle = steel; ctx.fillRect(-1.5, 0, 3.5, 5);
        ctx.fillStyle = goldDk; ctx.fillRect(-1.5, 3, 3.5, 2.5);
        ctx.fillStyle = gold; ctx.fillRect(-1.5, 3, 3.5, 0.6);
        ctx.fillStyle = '#6a4a10'; ctx.fillRect(-1.5, 4.5, 3.5, 0.4);
        ctx.fillStyle = skin; ctx.fillRect(-1, 5.5, 3, 2);
        ctx.fillStyle = skin; ctx.fillRect(-0.5, 7.5, 2.5, 2);
        ctx.restore();
    }

    // ── HEAD ──
    // Neck
    ctx.fillStyle = skin; ctx.fillRect(-2, -8 + wB, 4, 2.5);
    // Chin guard
    ctx.fillStyle = goldDk; ctx.fillRect(-3.5, -7.5 + wB, 7, 1.5);
    ctx.fillStyle = gold; ctx.fillRect(-3, -7 + wB, 6, 0.5);
    // Face
    ctx.fillStyle = skin; ctx.fillRect(-3, -13 + wB, 6, 5.5);
    // Eyes
    if (skillActive) {
        ctx.fillStyle = '#44ffaa';
        ctx.shadowColor = '#44ffaa'; ctx.shadowBlur = 4;
        ctx.fillRect(-2.2, -11 + wB, 1.5, 0.9);
        ctx.fillRect(0.8, -11 + wB, 1.5, 0.9);
        ctx.shadowBlur = 0;
    } else if (atk && ap > 0.12 && ap < 0.5) {
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-2.2, -11 + wB, 1.5, 0.7);
        ctx.fillRect(0.8, -11 + wB, 1.5, 0.7);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2.2, -11 + wB, 1.5, 1);
        ctx.fillRect(0.8, -11 + wB, 1.5, 1);
        ctx.fillStyle = '#1a1a0a';
        ctx.fillRect(-1.5, -10.8 + wB, 0.5, 0.6);
        ctx.fillRect(1.3, -10.8 + wB, 0.5, 0.6);
    }
    // Brows
    ctx.fillStyle = '#1a1a0a';
    ctx.fillRect(-2.5, -12 + wB, 2, 0.5);
    ctx.fillRect(0.5, -12 + wB, 2, 0.5);
    // Beard
    ctx.fillStyle = '#2a2a20';
    ctx.fillRect(-1.5, -8.2 + wB, 3, 0.8);
    ctx.fillRect(-0.8, -7.4 + wB, 1.6, 0.6);

    // ── HELMET (Ming dynasty war helmet) ──
    // Helmet brim
    ctx.fillStyle = steel;
    ctx.beginPath(); ctx.ellipse(0, -12.5 + wB, 7, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = gold; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.ellipse(0, -12.5 + wB, 7, 2.2, 0, 0, Math.PI * 2); ctx.stroke();
    // Helmet dome — layered
    ctx.fillStyle = goldDk;
    ctx.beginPath(); ctx.arc(0, -13 + wB, 5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(0, -13.5 + wB, 3.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.fillStyle = goldBr;
    ctx.beginPath(); ctx.arc(0, -14 + wB, 2.5, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
    // Helmet front plate
    ctx.fillStyle = mingRed; ctx.fillRect(-2.2, -15 + wB, 4.4, 2.5);
    ctx.fillStyle = goldBr; ctx.fillRect(-1.5, -14.5 + wB, 3, 1.5);
    // Helmet rivet line
    ctx.fillStyle = '#6a4a10';
    ctx.beginPath(); ctx.arc(-3.5, -13.5 + wB, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -13.5 + wB, 0.4, 0, Math.PI * 2); ctx.fill();

    // War plume — tall feather
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(0, -17 + wB, 1.2, 0, Math.PI * 2); ctx.fill();
    // Plume outer
    ctx.fillStyle = '#cc1111';
    ctx.beginPath();
    ctx.moveTo(-1, -17 + wB);
    ctx.quadraticCurveTo(-2, -25 + wB + cW * 0.3, 0, -28 + wB + cW * 0.4);
    ctx.quadraticCurveTo(3, -25 + wB + cW * 0.3, 1.5, -17 + wB);
    ctx.fill();
    // Plume inner highlight
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(0, -18 + wB);
    ctx.quadraticCurveTo(-1, -24 + wB + cW * 0.3, 0.3, -27 + wB + cW * 0.4);
    ctx.quadraticCurveTo(2, -24 + wB + cW * 0.3, 0.8, -18 + wB);
    ctx.fill();

    // ━━━━━━━━━━ RIGHT ARM + SWORD ━━━━━━━━━━
    ctx.save();
    const rShX = -5, rShY = -3 + wB;
    ctx.translate(rShX, rShY);
    ctx.rotate(rightArmRot);

    if (atk) {
        // Right arm as curved stroke (curves inward)
        ctx.lineCap = 'round';
        ctx.strokeStyle = steel; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-3, 5, 0, 10); ctx.stroke();
        // Vambrace
        ctx.strokeStyle = goldDk; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 7);
        ctx.quadraticCurveTo(-2, 9, 0, 11); ctx.stroke();
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(0, 11, 2.2, 0, Math.PI * 2); ctx.fill();
    } else {
        // Idle: rectangle arm
        ctx.fillStyle = steel; ctx.fillRect(-2, 0, 4, 5.5);
        ctx.fillStyle = goldDk; ctx.fillRect(-2, 4, 4, 2.5);
        ctx.fillStyle = gold; ctx.fillRect(-2, 4, 4, 0.5);
        ctx.fillStyle = skin; ctx.fillRect(-1.5, 6.5, 3, 2.5);
        ctx.fillStyle = skin; ctx.fillRect(-1, 9, 2.5, 2);
    }

    // SWORD — always visible
    ctx.save(); ctx.translate(0, atk ? 11 : 9.5);
    // Grip (jade green)
    ctx.fillStyle = '#1a6a4a'; ctx.fillRect(-1, -3, 2, 5);
    ctx.fillStyle = '#33aa7a'; ctx.fillRect(-0.4, -2.5, 0.8, 4);
    // Pommel (gold + ruby)
    ctx.fillStyle = goldBr;
    ctx.beginPath(); ctx.arc(0, -3.5, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(0, -3.5, 0.5, 0, Math.PI * 2); ctx.fill();
    // Guard (cross-guard)
    ctx.fillStyle = gold; ctx.fillRect(-2.5, 2, 5, 1.2);
    ctx.fillStyle = goldBr; ctx.fillRect(-2, 2.2, 4, 0.5);
    ctx.fillStyle = goldDk; ctx.fillRect(-3, 1.8, 1, 1.6); ctx.fillRect(2, 1.8, 1, 1.6);
    // Blade (straight jian)
    ctx.fillStyle = '#d0d0dd';
    ctx.beginPath();
    ctx.moveTo(-1, 3.2); ctx.lineTo(-1.1, 20);
    ctx.lineTo(0, 23); ctx.lineTo(1.1, 20);
    ctx.lineTo(1, 3.2); ctx.closePath(); ctx.fill();
    // Blood groove
    ctx.fillStyle = '#aa2222'; ctx.fillRect(-0.2, 5, 0.5, 14);
    // Edge highlights
    ctx.fillStyle = '#fff'; ctx.fillRect(0.6, 3.2, 0.3, 18);
    ctx.fillStyle = '#bbbbcc'; ctx.fillRect(-0.7, 3.2, 0.25, 17);

    // Slash trail
    if (atk && ap > 0.25 && ap < 0.55) {
        const eff = ap < 0.4 ? (ap - 0.25) / 0.15 : 1 - (ap - 0.4) / 0.15;
        ctx.globalAlpha = eff * (skillActive ? 0.6 : 0.45);
        if (skillActive) {
            ctx.fillStyle = '#44ddaa';
            ctx.beginPath(); ctx.moveTo(1.5, 5);
            ctx.quadraticCurveTo(14, 10, 11, 28); ctx.lineTo(-1, 22); ctx.fill();
        }
        ctx.fillStyle = skillActive ? '#88ffcc' : '#ffcc00';
        ctx.beginPath(); ctx.moveTo(1, 7);
        ctx.quadraticCurveTo(10, 12, 7, 26); ctx.lineTo(0, 20); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(0.5, 8);
        ctx.quadraticCurveTo(6, 12, 4, 24); ctx.lineTo(0, 19); ctx.fill();
        ctx.globalAlpha = 1;
    }

    ctx.restore(); // sword
    ctx.restore(); // right arm

    // ── LEFT ARM (two-handed grip — curves inward to meet right arm) ──
    if (atk) {
        const handleDist = 8;
        const handleX = rShX + Math.cos(rightArmRot + Math.PI / 2) * handleDist;
        const handleY = rShY + Math.sin(rightArmRot + Math.PI / 2) * handleDist;
        const leftShoulderX = 5, leftShoulderY = -3 + wB;
        const cpX = (leftShoulderX + handleX) * 0.5 + 3;
        const cpY = (leftShoulderY + handleY) * 0.5 + 5;
        ctx.save();
        ctx.lineCap = 'round';
        // Upper arm
        ctx.strokeStyle = steel; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.quadraticCurveTo(cpX, cpY, handleX, handleY); ctx.stroke();
        // Vambrace overlay
        ctx.strokeStyle = goldDk; ctx.lineWidth = 3.5;
        const midX = (cpX + handleX) * 0.5, midY = (cpY + handleY) * 0.5;
        ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(handleX, handleY); ctx.stroke();
        // Fist
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(handleX, handleY, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    ctx.restore(); // main
}
