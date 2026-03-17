import type { Unit } from '../../../Unit';
// Bypassed UnitState import due to Vite HMR issues
import type { CivColors } from '../../shared';

export function drawMusashiComplete(unit: Unit, ctx: CanvasRenderingContext2D, bob: number, moving: boolean, legSwingRaw: number, cv: CivColors): void {
    ctx.save();

    const attackState = unit.state === 5 /* UnitState.Attacking */;
    const walkBob = moving ? Math.sin(bob * 0.5) * 1.5 : 0;
    const legSwing = moving ? Math.sin(bob * 0.7) * 4 : 0;
    const windSway = Math.sin(unit.animTimer * 4) * 2;
    const breathe = Math.sin(unit.animTimer * 3) * 0.5;

    // ── ATTACK PHASES (overhead two-handed slash) ──
    let attackProgress = 0;
    let bodyLean = 0, swordArmRot = -0.1, lungeX = 0;

    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        if (attackProgress < 0.2) {
            // Raise katana overhead
            const t = attackProgress / 0.2, e = t * t * (3 - 2 * t);
            swordArmRot = -0.1 + (-Math.PI * 0.85 + 0.1) * e; // Arm goes up & back
            bodyLean = -0.12 * e; lungeX = -2 * e;
        } else if (attackProgress < 0.4) {
            // Slam down — explosive forward overhead chop
            const t = (attackProgress - 0.2) / 0.2, e = 1 - Math.pow(1 - t, 4);
            swordArmRot = -Math.PI * 0.85 + (Math.PI * 0.85 + Math.PI * 0.55) * e; // Swing from above to below
            bodyLean = -0.12 + 0.35 * e; lungeX = -2 + 10 * e;
        } else if (attackProgress < 0.55) {
            // Impact hold
            const t = (attackProgress - 0.4) / 0.15;
            swordArmRot = Math.PI * 0.55 + t * 0.05;
            bodyLean = 0.23; lungeX = 8 - t;
        } else {
            // Recovery — bring back to idle
            const t = (attackProgress - 0.55) / 0.45, e = t * t * (3 - 2 * t);
            swordArmRot = Math.PI * 0.55 * (1 - e) + (-0.1) * e;
            bodyLean = 0.23 * (1 - e); lungeX = 7 * (1 - e);
        }
    }

    // ── AURA ──
    const pulse = Math.sin(unit.animTimer * 4) * 0.1 + 0.15;
    ctx.globalAlpha = pulse;
    const aG = ctx.createRadialGradient(0, bob - 3, 2, 0, bob - 3, 24);
    aG.addColorStop(0, '#8ab4f8'); aG.addColorStop(1, 'transparent');
    ctx.fillStyle = aG;
    ctx.beginPath(); ctx.arc(0, bob - 3, 24, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // ── BODY TRANSFORM ──
    ctx.translate(lungeX, 3);
    if (bodyLean !== 0) {
        ctx.translate(0, 8 + walkBob); ctx.rotate(bodyLean); ctx.translate(0, -(8 + walkBob));
    } else if (moving) {
        ctx.rotate(0.12); ctx.translate(0, 3);
    } else {
        ctx.translate(0, 3 + breathe);
    }

    const skin = cv.skinColor;

    // ━━━━━━━ KATANA SAYA (behind body, diagonal across back) ━━━━━━━
    if (!attackState || attackProgress > 0.5) {
        ctx.save();
        ctx.translate(2, 4 + walkBob);
        ctx.rotate(-2.2); // ~126° — diagonal up-left across the back
        ctx.fillStyle = '#111'; ctx.fillRect(-1, 0, 2.5, 18);
        // Koiguchi (mouth)
        ctx.fillStyle = '#d4af37'; ctx.fillRect(-1.5, -0.5, 3.5, 1.5);
        // Kojiri (tip)
        ctx.fillStyle = '#d4af37'; ctx.fillRect(-1.5, 17, 3.5, 1);
        // Lacquer shine
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-0.2, 2, 0.6, 14);
        // Sageo cord
        ctx.strokeStyle = '#aa1818'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(1, 2); ctx.quadraticCurveTo(4, 4, 5, 7); ctx.stroke();
        ctx.restore();
    }

    // ━━━━━━━━━━ HAORI 飛風 (Phi Phong — wind cloak) ━━━━━━━━━━
    // Dramatic diagonal cape flowing from right shoulder across back
    const capeW = moving ? Math.sin(unit.animTimer * 10) * 4 : windSway * 0.8;
    const capeFlutter = Math.sin(unit.animTimer * 7) * 2;
    // Main body — asymmetric diagonal drape
    ctx.fillStyle = cv.bodyDark;
    ctx.beginPath();
    ctx.moveTo(5, -6 + walkBob);              // Right shoulder origin
    ctx.lineTo(-7, -4 + walkBob);             // Across to left shoulder
    ctx.quadraticCurveTo(-12 + capeW, 4 + walkBob, -14 + capeW * 1.5, 16 + walkBob + capeFlutter);
    ctx.lineTo(-10 + capeW * 1.2, 18 + walkBob + capeFlutter * 1.3);
    ctx.quadraticCurveTo(-8 + capeW, 10 + walkBob, -5, 6 + walkBob);
    ctx.lineTo(5, 2 + walkBob);               // Back to right side
    ctx.fill();
    // Inner lining (deep red glimpse)
    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath();
    ctx.moveTo(-5, -3 + walkBob);
    ctx.quadraticCurveTo(-9 + capeW * 0.5, 5 + walkBob, -11 + capeW, 14 + walkBob + capeFlutter * 0.8);
    ctx.lineTo(-8 + capeW * 0.8, 12 + walkBob + capeFlutter * 0.6);
    ctx.quadraticCurveTo(-7, 3 + walkBob, -4, -1 + walkBob);
    ctx.fill();
    // Gold edge trim (faded)
    ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-7, -4 + walkBob);
    ctx.quadraticCurveTo(-12 + capeW, 4 + walkBob, -14 + capeW * 1.5, 16 + walkBob + capeFlutter);
    ctx.stroke();
    // Torn bottom edge detail
    ctx.strokeStyle = '#1a1a30'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-14 + capeW * 1.5, 16 + walkBob + capeFlutter);
    ctx.lineTo(-12 + capeW * 1.3, 17 + walkBob + capeFlutter);
    ctx.lineTo(-10 + capeW * 1.2, 18 + walkBob + capeFlutter * 1.3);
    ctx.stroke();

    // ━━━━━━━━━━ LEGS ━━━━━━━━━━
    // Hakama (dark indigo, quality fabric)
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5.5 + legSwing, 7, 5, 10);
    ctx.fillRect(0.5 - legSwing, 7, 5, 10);
    // Hakama pleats
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-4.5 + legSwing, 7, 0.8, 10);
    ctx.fillRect(-2.5 + legSwing, 7, 0.8, 10);
    ctx.fillRect(1.5 - legSwing, 7, 0.8, 10);
    ctx.fillRect(3.5 - legSwing, 7, 0.8, 10);
    // Shin guards (samurai element — partial kote)
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-5 + legSwing, 13, 4, 3);
    ctx.fillRect(1 - legSwing, 13, 4, 3);
    ctx.fillStyle = '#555'; // metal edge
    ctx.fillRect(-5 + legSwing, 13, 4, 0.5);
    ctx.fillRect(1 - legSwing, 13, 4, 0.5);
    // Waraji sandals
    ctx.fillStyle = '#8a7050';
    ctx.fillRect(-6 + legSwing, 16.5, 5.5, 1.5);
    ctx.fillRect(0.5 - legSwing, 16.5, 5.5, 1.5);

    // ━━━━━━━━━━ TORSO ━━━━━━━━━━
    // Base body
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-6, -5 + walkBob); ctx.lineTo(6, -5 + walkBob);
    ctx.lineTo(5.5, 7 + walkBob); ctx.lineTo(-5.5, 7 + walkBob); ctx.fill();

    // Kimono — one side properly worn (samurai), other loose (ronin)
    // Left side: proper dark kimono flap
    ctx.fillStyle = cv.bodyDark;
    ctx.beginPath();
    ctx.moveTo(-6, -6 + walkBob); ctx.lineTo(1, -6 + walkBob);
    ctx.lineTo(0, 5 + walkBob); ctx.lineTo(-5.5, 7 + walkBob); ctx.fill();
    // Right side: loose, exposing chest slightly
    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath();
    ctx.moveTo(1, -5 + walkBob); ctx.lineTo(6, -5 + walkBob);
    ctx.lineTo(5.5, 7 + walkBob); ctx.lineTo(2, 6 + walkBob); ctx.fill();

    // Chest opening — V-shape showing skin & scar
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-0.5, -6 + walkBob); ctx.lineTo(2, -6 + walkBob);
    ctx.lineTo(1.5, 1 + walkBob); ctx.lineTo(0, 2 + walkBob); ctx.fill();
    // X-scar on chest (battle mark)
    ctx.strokeStyle = '#b06060'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-0.5, -4 + walkBob); ctx.lineTo(2, 1 + walkBob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -4 + walkBob); ctx.lineTo(-0.5, 1 + walkBob); ctx.stroke();

    // Left shoulder armor (samurai element — one-sided sode)
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-8, -6 + walkBob, 4, 6);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-8, -4 + walkBob, 4, 1); // Lame plate line
    ctx.fillRect(-8, -2 + walkBob, 4, 1);
    // Gold rivets
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-8, -6 + walkBob, 4, 0.5);
    ctx.fillRect(-7, -5 + walkBob, 1, 1);
    ctx.fillRect(-5, -5 + walkBob, 1, 1);

    // Obi (quality silk sash — red with gold)
    ctx.fillStyle = '#aa1818';
    ctx.fillRect(-6, 4.5 + walkBob, 12, 3);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-2, 4 + walkBob, 1, 3.5); // Gold thread accent
    ctx.fillStyle = '#881111';
    ctx.fillRect(-5, 4 + walkBob, 3, 3.5); // Knot shadow
    // Sash tail flowing
    ctx.strokeStyle = '#aa1818'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, 6 + walkBob);
    ctx.quadraticCurveTo(9, 4 + walkBob + windSway, 12, 9 + walkBob - windSway); ctx.stroke();

    // (Scabbard is rendered behind body — see BACK LAYER above)

    // ━━━━━━━━━━ LEFT ARM ━━━━━━━━━━
    // During attack: left arm is drawn inside the right arm+katana group below
    if (!attackState) {
        // Idle: normal relaxed left arm
        ctx.save();
        ctx.translate(5, -3 + walkBob);
        ctx.rotate(moving ? 0.15 + Math.sin(bob * 0.8) * 0.12 : 0.2);
        ctx.fillStyle = cv.bodyMid; ctx.fillRect(-1, 0, 3.5, 5);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-1, 3, 3.5, 2);
        ctx.fillStyle = '#444'; ctx.fillRect(-1, 3, 3.5, 0.5);
        ctx.fillStyle = skin; ctx.fillRect(-0.5, 5, 3, 2);
        ctx.fillStyle = skin; ctx.fillRect(0, 7, 2.5, 2);
        ctx.restore();
    }

    // ━━━━━━━━━━ HEAD ━━━━━━━━━━
    ctx.fillStyle = skin; ctx.fillRect(-2, -8 + walkBob, 4, 3); // Neck
    ctx.fillStyle = skin; ctx.fillRect(-3, -13 + walkBob, 6, 6); // Face

    // Face cloth (covering mouth & chin)
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(-3.5, -9 + walkBob, 7, 3); // Main cloth over lower face
    ctx.fillStyle = '#151525';
    ctx.fillRect(-3.5, -8 + walkBob, 7, 1); // Fold shadow
    // Cloth drape hanging below chin
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath();
    ctx.moveTo(-3.5, -6 + walkBob); ctx.lineTo(3.5, -6 + walkBob);
    ctx.lineTo(3, -4 + walkBob + windSway * 0.2);
    ctx.lineTo(-3, -4 + walkBob - windSway * 0.15);
    ctx.fill();

    // Eyes
    if (attackState && attackProgress > 0.12 && attackProgress < 0.5) {
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(-2, -11.5 + walkBob, 1.5, 0.7);
        ctx.fillRect(1, -11.5 + walkBob, 1.5, 0.7);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -11 + walkBob, 1.5, 1);
        ctx.fillRect(1, -11 + walkBob, 1.5, 1);
        ctx.fillStyle = '#222';
        ctx.fillRect(-1.5, -11 + walkBob, 0.5, 0.5);
        ctx.fillRect(1.5, -11 + walkBob, 0.5, 0.5);
    }

    // Hair — half-tied topknot (samurai) with loose wild strands (ronin)
    ctx.fillStyle = '#111';
    // Main hair mass
    ctx.fillRect(-4, -17 + walkBob, 8, 5);
    // Topknot (mage — samurai tradition, messy version)
    ctx.beginPath();
    ctx.moveTo(-1, -17 + walkBob); ctx.lineTo(0, -21 + walkBob);
    ctx.lineTo(2, -19 + walkBob); ctx.lineTo(1, -17 + walkBob); ctx.fill();
    ctx.fillStyle = '#cc2222'; // Red hair tie
    ctx.fillRect(-0.5, -17.5 + walkBob, 2, 1);
    // Loose wild bangs (ronin wildness)
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-4, -13 + walkBob); ctx.lineTo(-5.5, -10 + walkBob); ctx.lineTo(-3, -12 + walkBob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -13 + walkBob); ctx.lineTo(5.5, -11 + walkBob); ctx.lineTo(3, -12 + walkBob); ctx.fill();
    // Longer loose strands blowing in wind
    ctx.save(); ctx.translate(0, -14 + walkBob);
    ctx.beginPath(); ctx.moveTo(-4, -3);
    ctx.quadraticCurveTo(-6, 0 + windSway, -7, 5 + windSway);
    ctx.lineTo(-5, 4 + windSway * 0.8); ctx.quadraticCurveTo(-5, -1, -2, -3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -3);
    ctx.quadraticCurveTo(5, -1 + windSway * 0.4, 5.5, 3 + windSway * 0.6);
    ctx.lineTo(4, 2 + windSway * 0.4); ctx.quadraticCurveTo(4, -1, 2, -3); ctx.fill();
    ctx.restore();

    // Hachimaki (white headband)
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(-4, -15.5 + walkBob, 8, 1.5);
    // Hinomaru (rising sun on headband)
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(0, -14.8 + walkBob, 0.8, 0, Math.PI * 2); ctx.fill();
    // Headband tails flowing back
    ctx.save(); ctx.fillStyle = '#f0f0f0';
    ctx.translate(-2, -15 + walkBob);
    ctx.rotate(0.1 + Math.sin(unit.animTimer * 7) * 0.2);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -1 - windSway, -10 - windSway, -3 + Math.cos(unit.animTimer * 9) * 1.5);
    ctx.quadraticCurveTo(-5, 1, 0, 1.5); ctx.fill();
    ctx.restore();

    // ━━━━━━━━━━ RIGHT ARM + KATANA ━━━━━━━━━━
    ctx.save();
    const rightShoulderX = -5, rightShoulderY = -3 + walkBob;
    ctx.translate(rightShoulderX, rightShoulderY);
    ctx.rotate(swordArmRot);

    if (attackState) {
        // Right arm as curved stroke (curves inward toward body center)
        ctx.lineCap = 'round';
        // Upper arm
        ctx.strokeStyle = cv.bodyDark; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-3, 5, 0, 10); ctx.stroke();
        // Kote bracer
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 7);
        ctx.quadraticCurveTo(-2, 9, 0, 11); ctx.stroke();
        // Fist
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(0, 11, 2.2, 0, Math.PI * 2); ctx.fill();
    } else {
        // Idle: rectangle arm
        ctx.fillStyle = cv.bodyDark; ctx.fillRect(-2, 0, 3.5, 5);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-2, 4, 3.5, 2.5);
        ctx.fillStyle = '#444'; ctx.fillRect(-2, 4, 3.5, 0.5);
        ctx.fillStyle = skin; ctx.fillRect(-1.5, 6.5, 3, 2.5);
        ctx.fillStyle = skin; ctx.fillRect(-1, 9, 2.5, 2);
    }

    // Katana (drawn only during attack)
    if (attackState) {
        ctx.save(); ctx.translate(-0.5, 11);
        // Tsuka (handle)
        ctx.fillStyle = '#111'; ctx.fillRect(-1, -3, 2, 7);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-1, -2, 2, 0.8); ctx.fillRect(-1, 0, 2, 0.8); ctx.fillRect(-1, 2, 2, 0.8);
        ctx.fillStyle = '#d4af37'; ctx.fillRect(-1, -3.5, 2, 1);
        // Tsuba (ornate guard)
        ctx.fillStyle = '#d4af37';
        ctx.beginPath(); ctx.ellipse(0, 4.5, 2.5, 1.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8941f';
        ctx.beginPath(); ctx.ellipse(0, 4.5, 1.3, 0.7, 0, 0, Math.PI * 2); ctx.fill();
        // Blade
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.moveTo(-1, 5.5); ctx.quadraticCurveTo(-1.5, 18, -2, 30);
        ctx.lineTo(-0.5, 31); ctx.quadraticCurveTo(1.2, 18, 1, 5.5); ctx.closePath(); ctx.fill();
        // Hamon
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-0.3, 7);
        ctx.quadraticCurveTo(0.2, 12, -0.3, 17);
        ctx.quadraticCurveTo(-0.8, 22, -0.3, 27); ctx.stroke();
        // Shinogi + edge
        ctx.fillStyle = '#fff'; ctx.fillRect(-0.2, 6, 0.4, 23);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-1, 7, 0.5, 22);
        ctx.restore();
    }

    // ── SLASH EFFECTS ──
    if (attackState && attackProgress > 0.12 && attackProgress < 0.5) {
        const eff = attackProgress < 0.35 ? 0.65 : 0.65 * (1 - (attackProgress - 0.35) / 0.15);
        ctx.strokeStyle = `rgba(138, 180, 248, ${eff})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 18, 20, -Math.PI * 0.3, Math.PI * 0.6); ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${eff * 0.7})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 18, 18, -Math.PI * 0.2, Math.PI * 0.5); ctx.stroke();
        for (let i = 0; i < 3; i++) {
            const ang = -0.15 + i * 0.35;
            ctx.strokeStyle = `rgba(138, 180, 248, ${eff * (0.4 - i * 0.1)})`; ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 16, 18 + Math.sin(ang) * 16);
            ctx.lineTo(Math.cos(ang) * 28, 18 + Math.sin(ang) * 28); ctx.stroke();
        }
        if (attackProgress > 0.3) {
            const sp = (attackProgress - 0.3) / 0.2;
            ctx.fillStyle = `rgba(255, 220, 100, ${0.6 * (1 - sp)})`;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(Math.cos(sp * 5 + i * 1.5) * (5 + i * 3), 28 + Math.sin(sp * 4 + i * 2) * (3 + i * 3), 1, 1);
            }
        }
    }

    ctx.restore(); // right arm

    // ━━━━ LEFT ARM (two-handed grip — curves inward to meet right arm) ━━━━
    if (attackState) {
        const handleDist = 8;
        const handleX = rightShoulderX + Math.cos(swordArmRot + Math.PI / 2) * handleDist;
        const handleY = rightShoulderY + Math.sin(swordArmRot + Math.PI / 2) * handleDist;
        const leftShoulderX = 5, leftShoulderY = -3 + walkBob;
        // Control point curves inward (toward the right arm)
        const cpX = (leftShoulderX + handleX) * 0.5 + 3;
        const cpY = (leftShoulderY + handleY) * 0.5 + 5;
        ctx.save();
        ctx.lineCap = 'round';
        // Upper arm (kimono sleeve)
        ctx.strokeStyle = cv.bodyMid; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.quadraticCurveTo(cpX, cpY, handleX, handleY); ctx.stroke();
        // Kote bracer overlay
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3.5;
        const midX = (cpX + handleX) * 0.5, midY = (cpY + handleY) * 0.5;
        ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(handleX, handleY); ctx.stroke();
        // Fist on handle
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(handleX, handleY, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.globalAlpha = 0.03; ctx.fillStyle = '#8ab4f8';
    ctx.beginPath(); ctx.arc(0, walkBob, 15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
}
