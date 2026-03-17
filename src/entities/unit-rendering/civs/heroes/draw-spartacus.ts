import type { Unit } from '../../../Unit';
import type { CivColors } from '../../shared';

export function drawSpartacusComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();
    ctx.translate(0, 4);

    const atk = unit.state === 5 /* UnitState.Attacking */;
    const wB = moving ? Math.sin(bob * 0.5) * 2 : 0;
    const lS = moving ? Math.sin(bob * 0.7) * 4.5 : 0;
    const cW = Math.cos(unit.animTimer * 6) * 3;
    const skin = cv.skinColor;
    const T = unit.animTimer;

    // ============ LOI THAN MODE CHECK ============
    const jupiter = unit.lamaJupiterTimer > 0;
    const jPulse = jupiter ? Math.sin(T * 8) * 0.5 + 0.5 : 0; // fast electric pulse

    // ============ AURA ============
    if (jupiter) {
        // ELECTRIC AURA — intense blue-white
        const outerPulse = Math.sin(T * 6) * 0.15 + 0.35;
        ctx.globalAlpha = outerPulse;
        const ag2 = ctx.createRadialGradient(0, 0, 3, 0, 0, 35);
        ag2.addColorStop(0, '#88ddff'); ag2.addColorStop(0.5, '#0088ff44'); ag2.addColorStop(1, 'transparent');
        ctx.fillStyle = ag2;
        ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.fill();
        // Inner white core
        ctx.globalAlpha = outerPulse * 0.6;
        const ag3 = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
        ag3.addColorStop(0, '#ffffff'); ag3.addColorStop(1, 'transparent');
        ctx.fillStyle = ag3;
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    } else {
        // Normal gold aura
        const pulse = Math.sin(T * 5) * 0.2 + 0.3;
        ctx.globalAlpha = pulse;
        const ag = ctx.createRadialGradient(0, Math.max(0, bob), 5, 0, Math.max(0, bob), 25);
        ag.addColorStop(0, '#e6c200'); ag.addColorStop(1, 'transparent');
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(0, Math.max(0, bob), 25, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ============ LIGHTNING BOLTS AROUND BODY (Lôi Thần only) ============
    if (jupiter) {
        ctx.save();
        ctx.globalAlpha = 0.7 + jPulse * 0.3;
        // Draw 3 random lightning arcs that change every few frames
        const seed = Math.floor(T * 12); // changes ~12 times per second
        for (let bolt = 0; bolt < 3; bolt++) {
            // Pseudo-random based on time seed
            const s = seed + bolt * 37;
            const startAngle = ((s * 7 + bolt * 13) % 360) * Math.PI / 180;
            const startR = 8 + (s % 5);
            const endR = 22 + ((s * 3) % 10);
            const sx = Math.cos(startAngle) * startR;
            const sy = Math.sin(startAngle) * startR;
            const ex = Math.cos(startAngle + 0.3) * endR;
            const ey = Math.sin(startAngle + 0.3) * endR;

            // Zigzag lightning path
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            const segments = 4;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const mx = sx + (ex - sx) * t;
                const my = sy + (ey - sy) * t;
                // Zigzag offset perpendicular to bolt direction
                const perpX = -(ey - sy);
                const perpY = (ex - sx);
                const len = Math.hypot(perpX, perpY) || 1;
                const zigzag = ((((s + i * 11) % 7) - 3) / 3) * 5;
                ctx.lineTo(mx + perpX / len * zigzag, my + perpY / len * zigzag);
            }
            ctx.stroke();

            // Glow layer
            ctx.strokeStyle = '#00ccff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const mx = sx + (ex - sx) * t;
                const my = sy + (ey - sy) * t;
                const perpX = -(ey - sy);
                const perpY = (ex - sx);
                const len = Math.hypot(perpX, perpY) || 1;
                const zigzag = ((((s + i * 11) % 7) - 3) / 3) * 5;
                ctx.lineTo(mx + perpX / len * zigzag, my + perpY / len * zigzag);
            }
            ctx.stroke();
            ctx.globalAlpha = 0.7 + jPulse * 0.3;
        }

        // Small spark dots
        for (let i = 0; i < 5; i++) {
            const sparkSeed = seed * 3 + i * 17;
            const sa = ((sparkSeed * 7) % 360) * Math.PI / 180;
            const sr = 10 + (sparkSeed % 20);
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#00eeff';
            ctx.globalAlpha = 0.5 + (sparkSeed % 5) * 0.1;
            ctx.fillRect(Math.cos(sa) * sr - 0.5, Math.sin(sa) * sr - 0.5, 1.5, 1.5);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ============ ATTACK PROGRESS ============
    let ap = 0, bodyLean = 0, lungeX = 0;
    let handX = -10, handY = 1, bladeAngle = -Math.PI / 2; // Sword horizontal, arm pulled far back
    let shieldX = 5, shieldY = -4, shieldRot = 0.3;

    if (atk) {
        ap = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        // Straight-line stab: blade stays horizontal (-π/2)
        bladeAngle = -Math.PI / 2;
        if (ap < 0.3) {
            // Windup: pull sword further back
            const t = ap / 0.3, e = t * t * (3 - 2 * t);
            handX = -10 - 6 * e; handY = 1;
            bodyLean = -0.1 * e; lungeX = -3 * e;
            shieldX = 5 + 2 * e; shieldRot = 0.3;
        } else if (ap < 0.5) {
            // Strike: explosive forward thrust
            const t = (ap - 0.3) / 0.2, e = 1 - Math.pow(1 - t, 4);
            handX = -16 + 38 * e; handY = 1;
            bodyLean = -0.1 + 0.25 * e; lungeX = -3 + 10 * e;
            shieldX = 7 - 2 * e; shieldRot = 0.3 - 0.1 * e;
        } else if (ap < 0.65) {
            // Impact hold: sword fully extended
            const t = (ap - 0.5) / 0.15;
            handX = 22 + t * 2; handY = 1;
            bodyLean = 0.15; lungeX = 7;
            shieldX = 5; shieldRot = 0.2;
        } else {
            // Recovery: pull back to idle
            const t = (ap - 0.65) / 0.35, e = t * t * (3 - 2 * t);
            handX = 24 * (1 - e) + (-10) * e; handY = 1;
            bodyLean = 0.15 * (1 - e); lungeX = 7 * (1 - e);
            shieldX = 5; shieldRot = 0.2 + 0.1 * e;
        }
    } else if (moving) {
        bodyLean = 0.08; handX += Math.sin(bob * 0.6) * 2;
    }

    ctx.translate(lungeX, 0);
    if (bodyLean !== 0) {
        ctx.translate(0, 4 + wB); ctx.rotate(bodyLean); ctx.translate(0, -(4 + wB));
    } else if (moving) {
        ctx.scale(1, 1 - Math.abs(wB) * 0.03);
    }

    // ============ COLOR PALETTE (normal vs Lôi Thần) ============
    const capeColor = jupiter ? '#1a1a3a' : cv.bodyMid;       // Team color cape
    const armorMain = jupiter ? '#2a3a5a' : cv.bodyDark;       // Dark team vs leather
    const armorTrim = jupiter ? '#4488cc' : '#5c3a21';       // Electric blue vs brown
    const armorAccent = jupiter ? '#00ccff' : '#d4af37';     // Cyan vs gold
    const legArmor = jupiter ? '#3a4a6a' : '#b8860b';        // Steel greaves
    const bootColor = jupiter ? '#2a3a5a' : '#5c3a21';       // Steel boots
    const shieldBase = jupiter ? '#1a2a4a' : cv.bodyDark;      // Dark team vs crimson
    const shieldGold = jupiter ? '#00ddff' : '#daa520';      // Electric cyan vs gold
    const shieldGoldBright = jupiter ? '#88ffff' : '#ffd700';
    const helmetColor = jupiter ? '#3a4a6a' : '#b8860b';     // Storm steel
    const crestColor = jupiter ? '#00aaff' : cv.bodyLight;      // Team color crest
    const bracerColor = jupiter ? '#4488cc' : '#5c3a21';
    const strapColor = jupiter ? '#3366aa' : '#5c3a21';

    // ============ CAPE ============
    ctx.save();
    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(-5, -7 + wB);
    ctx.quadraticCurveTo(-16, -2 + wB + cW, -14, 12 + wB - cW);
    ctx.lineTo(-6, 9 + wB);
    ctx.fill();
    // Cape electric trim during Jupiter
    if (jupiter) {
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + jPulse * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-5, -7 + wB);
        ctx.quadraticCurveTo(-16, -2 + wB + cW, -14, 12 + wB - cW);
        ctx.stroke();
    }
    ctx.restore();

    // ============ LEGS ============
    ctx.fillStyle = skin;
    ctx.fillRect(-6.5 + lS, 6, 5.5, 11);
    ctx.fillRect(1.5 - lS, 6, 5.5, 11);
    ctx.fillStyle = legArmor;
    ctx.fillRect(-7 + lS, 10, 6.5, 5);
    ctx.fillRect(1 - lS, 10, 6.5, 5);
    // Leg armor glow trim (Jupiter)
    if (jupiter) {
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 + jPulse * 0.15})`;
        ctx.fillRect(-7 + lS, 10, 6.5, 1);
        ctx.fillRect(1 - lS, 10, 6.5, 1);
    }
    ctx.fillStyle = bootColor;
    ctx.fillRect(-7.5 + lS, 15, 7.5, 1.5);
    ctx.fillRect(0.5 - lS, 15, 7.5, 1.5);

    // ============ TORSO ============
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-6.5, -6 + wB); ctx.lineTo(6.5, -6 + wB);
    ctx.lineTo(5.5, 7 + wB); ctx.lineTo(-5.5, 7 + wB); ctx.fill();
    // Leather strap / electric strap
    ctx.strokeStyle = strapColor; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-5, -5 + wB); ctx.lineTo(5, 0 + wB); ctx.stroke();
    // Armor body
    ctx.fillStyle = armorMain; ctx.fillRect(-7.5, 1 + wB, 15, 6);
    // Jupiter: chest plate overlay
    if (jupiter) {
        ctx.fillStyle = '#2a3a5a';
        ctx.fillRect(-6.5, -5 + wB, 13, 12);
        // Chest plate highlights
        ctx.fillStyle = `rgba(0, 200, 255, ${0.1 + jPulse * 0.15})`;
        ctx.fillRect(-6, -4 + wB, 12, 1);
        ctx.fillRect(-6, 2 + wB, 12, 1);
        // Center lightning rune
        ctx.strokeStyle = `rgba(0, 220, 255, ${0.4 + jPulse * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -3 + wB); ctx.lineTo(-2, 0 + wB);
        ctx.lineTo(1, 0 + wB); ctx.lineTo(-1, 4 + wB);
        ctx.stroke();
    }
    // Pteruges
    ctx.fillStyle = armorTrim;
    for (let i = 0; i < 4; i++) ctx.fillRect(-6 + i * 4, 7 + wB, 2.5, 4);
    // Pauldron
    ctx.fillStyle = armorAccent;
    ctx.beginPath(); ctx.arc(-4, -6 + wB, 4, Math.PI, 0); ctx.fill();
    if (jupiter) {
        // Second pauldron (right shoulder) during Jupiter
        ctx.beginPath(); ctx.arc(4, -6 + wB, 4, Math.PI, 0); ctx.fill();
        // Pauldron glow
        ctx.fillStyle = `rgba(0, 200, 255, ${0.2 + jPulse * 0.2})`;
        ctx.beginPath(); ctx.arc(-4, -6 + wB, 3, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -6 + wB, 3, Math.PI, 0); ctx.fill();
    }

    // ============ SWORD ARM ============
    const shoulderX = -3, shoulderY = -4 + wB;
    const hx = handX, hy = handY + wB;

    ctx.save();
    const bx = hx * 0.7 + shoulderX * 0.3;
    const by = hy * 0.7 + shoulderY * 0.3;
    // Upper arm (thicker, shows muscle)
    ctx.strokeStyle = skin; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(bx, by); ctx.stroke();
    // Bicep highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(shoulderX + 0.5, shoulderY); ctx.lineTo(bx + 0.5, by); ctx.stroke();
    // Forearm with bracer
    ctx.strokeStyle = bracerColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(hx, hy); ctx.stroke();
    // Bracer gold trim
    ctx.strokeStyle = armorAccent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx - 1, by); ctx.lineTo(bx + 1, by); ctx.stroke();
    // Fist
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(hx, hy, 2.5, 0, Math.PI * 2); ctx.fill();
    // Knuckle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.arc(hx + 0.5, hy + 1, 1.5, 0, Math.PI * 2); ctx.fill();

    // GLADIUS
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(bladeAngle);
    ctx.fillStyle = '#4a2511'; ctx.fillRect(-1, 0, 2, 3.5);
    ctx.fillStyle = '#8B4513'; ctx.fillRect(-0.5, 0.5, 1, 2.5);
    ctx.fillStyle = armorAccent; ctx.fillRect(-1.2, -0.8, 2.5, 1.2); // Pommel
    ctx.fillStyle = armorAccent; ctx.fillRect(-2, 3.5, 4, 1.2); // Guard
    // Blade
    const bladeColor = jupiter ? '#aaddff' : '#e0e0e0';
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(-1, 4.7); ctx.lineTo(-1.5, 12);
    ctx.lineTo(0, 17); ctx.lineTo(1.5, 12);
    ctx.lineTo(1, 4.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = jupiter ? '#ffffff' : '#fff'; ctx.fillRect(-0.1, 4.7, 0.4, 11);
    ctx.fillStyle = jupiter ? '#66bbff' : '#bbb'; ctx.fillRect(0.5, 5, 0.3, 8);
    // Electric blade glow (Jupiter)
    if (jupiter) {
        ctx.globalAlpha = 0.3 + jPulse * 0.3;
        ctx.strokeStyle = '#00ccff'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-1, 4.7); ctx.lineTo(-1.5, 12);
        ctx.lineTo(0, 17); ctx.lineTo(1.5, 12);
        ctx.lineTo(1, 4.7); ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Thrust trail
    if (atk && ap > 0.18 && ap < 0.55) {
        const eff = ap < 0.4 ? 0.5 : 0.5 * (1 - (ap - 0.4) / 0.15);
        if (jupiter) {
            // Electric thrust trail
            ctx.fillStyle = `rgba(0, 200, 255, ${eff * 0.5})`;
            ctx.beginPath(); ctx.moveTo(-1, 15); ctx.lineTo(0, 30); ctx.lineTo(1, 15); ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${eff * 0.4})`;
            ctx.beginPath(); ctx.moveTo(-0.3, 16); ctx.lineTo(0, 26); ctx.lineTo(0.3, 16); ctx.fill();
        } else {
            ctx.fillStyle = `rgba(255, 215, 0, ${eff * 0.35})`;
            ctx.beginPath(); ctx.moveTo(-1, 15); ctx.lineTo(0, 27); ctx.lineTo(1, 15); ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${eff * 0.25})`;
            ctx.beginPath(); ctx.moveTo(-0.3, 16); ctx.lineTo(0, 24); ctx.lineTo(0.3, 16); ctx.fill();
        }
    }
    ctx.restore(); // Gladius
    ctx.restore(); // Sword arm

    // ============ SHIELD ARM ============
    ctx.save();
    const shShouldX = 4, shShouldY = -4 + wB;
    const shHandX = shieldX, shHandY = shieldY + wB + 5;
    ctx.strokeStyle = skin; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(shShouldX, shShouldY); ctx.lineTo(shHandX, shHandY); ctx.stroke();

    ctx.translate(shHandX, shHandY);
    ctx.rotate(shieldRot);
    ctx.fillStyle = shieldBase; ctx.fillRect(-4, -7, 9, 16);
    ctx.strokeStyle = shieldGold; ctx.lineWidth = 0.8; ctx.strokeRect(-4, -7, 9, 16);
    ctx.fillStyle = shieldGold;
    ctx.beginPath(); ctx.arc(0.5, 1, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shieldGoldBright;
    ctx.beginPath(); ctx.arc(0.5, 1, 1, 0, Math.PI * 2); ctx.fill();
    // Shield decorations
    if (jupiter) {
        // Lightning bolt emblem on shield
        ctx.strokeStyle = `rgba(0, 220, 255, ${0.5 + jPulse * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0.5, -4); ctx.lineTo(-1, -1); ctx.lineTo(1, -1); ctx.lineTo(0.5, 4);
        ctx.stroke();
        // Electric rim glow
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.2 + jPulse * 0.2})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(-4, -7, 9, 16);
    } else {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-2, -1, 1.2, 0.6); ctx.fillRect(2, -1, 1.2, 0.6);
    }
    ctx.restore();

    // ============ HEAD ============
    ctx.fillStyle = skin; ctx.fillRect(-2.5, -9 + wB, 5, 4);
    ctx.fillStyle = skin; ctx.fillRect(-3.5, -14 + wB, 7, 6);

    // Eyes
    if (jupiter) {
        // Glowing electric eyes
        ctx.fillStyle = `rgba(0, 220, 255, ${0.7 + jPulse * 0.3})`;
        ctx.fillRect(-2, -12.5 + wB, 1.8, 1);
        ctx.fillRect(1.5, -12.5 + wB, 1.8, 1);
        // Eye glow
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 + jPulse * 0.1})`;
        ctx.beginPath(); ctx.arc(-1, -12 + wB, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2.5, -12 + wB, 3, 0, Math.PI * 2); ctx.fill();
    } else if (atk && ap > 0.15 && ap < 0.55) {
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-2, -12.5 + wB, 1.5, 0.7);
        ctx.fillRect(1.5, -12.5 + wB, 1.5, 0.7);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -12 + wB, 1.5, 1);
        ctx.fillRect(1.5, -12 + wB, 1.5, 1);
        ctx.fillStyle = '#000';
        ctx.fillRect(-1.5, -12 + wB, 0.5, 0.5);
        ctx.fillRect(2, -12 + wB, 0.5, 0.5);
    }

    // Galea helmet
    ctx.fillStyle = helmetColor;
    ctx.beginPath(); ctx.arc(0, -13 + wB, 4, Math.PI, 0); ctx.fill();
    ctx.fillRect(-4, -13 + wB, 8, 1.5);
    ctx.fillRect(-4.5, -12 + wB, 1.5, 4);
    ctx.fillRect(3, -12 + wB, 1.5, 4);
    if (jupiter) {
        // Helmet glow trim
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 + jPulse * 0.15})`;
        ctx.fillRect(-4, -13 + wB, 8, 0.8);
    }

    // Crest
    ctx.fillStyle = crestColor;
    ctx.beginPath();
    ctx.moveTo(-3, -15 + wB);
    ctx.quadraticCurveTo(0, -21 + wB, 6, -14 + wB);
    ctx.lineTo(4, -13 + wB);
    ctx.quadraticCurveTo(0, -18 + wB, -1, -15 + wB);
    ctx.fill();
    // Crest electric effect
    if (jupiter) {
        ctx.strokeStyle = `rgba(0, 220, 255, ${0.3 + jPulse * 0.3})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-3, -15 + wB);
        ctx.quadraticCurveTo(0, -21 + wB, 6, -14 + wB);
        ctx.stroke();
    }

    ctx.restore();
}
