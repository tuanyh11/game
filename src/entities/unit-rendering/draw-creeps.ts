// ============================================================
//  Creep Renderers — Enhanced pixel art for neutral monsters
//  Wolf (fierce), Skeleton (undead warrior), Ogre (heavy brute),
//  Dragon West (European), Dragon East (Asian/Chinese)
//  Each has unique attack animation
// ============================================================

import { UnitType } from "../../config/GameConfig";

// Main dispatcher
export function drawCreep(
    ctx: CanvasRenderingContext2D,
    type: UnitType,
    totalBob: number,
    animTimer: number,
    isAttacking: boolean,
    attackProgress: number,
    isMoving: boolean = false,
): void {
    switch (type) {
        case UnitType.CreepWolf: drawWolf(ctx, totalBob, animTimer, isAttacking, attackProgress, isMoving); break;
        case UnitType.CreepSkeleton: drawSkeleton(ctx, totalBob, animTimer, isAttacking, attackProgress, isMoving); break;
        case UnitType.CreepOgre: drawOgre(ctx, totalBob, animTimer, isAttacking, attackProgress, isMoving); break;
        case UnitType.CreepDragon: drawDragonWest(ctx, totalBob, animTimer, isAttacking, attackProgress, isMoving); break;
        case UnitType.CreepDragonEast: drawDragonEast(ctx, totalBob, animTimer, isAttacking, attackProgress, isMoving); break;
    }
}

// ===== WOLF — Fierce armored war-wolf, spiked collar, battle-scarred =====
// Attack: Lunge forward + claw swipe + jaw snap
function drawWolf(ctx: CanvasRenderingContext2D, bob: number, t: number, atk: boolean, atkP: number, moving: boolean): void {
    const y = bob;
    // Two-stage attack: lunge (0-0.5) then claw+bite (0.5-1)
    const lungeX = atk ? Math.sin(atkP * Math.PI) * 8 : 0;
    const biteOpen = atk ? Math.max(0, Math.sin((atkP - 0.3) * Math.PI * 1.4)) * 4 : 0;
    const clawSwipe = atk && atkP > 0.4 ? Math.sin((atkP - 0.4) * Math.PI / 0.6) * 0.6 : 0;

    ctx.save();
    ctx.translate(lungeX, 0);

    // ---- Rage aura (when attacking) ----
    if (atk) {
        const rageAlpha = Math.sin(atkP * Math.PI) * 0.12;
        ctx.fillStyle = `rgba(255, 20, 0, ${rageAlpha})`;
        ctx.beginPath();
        ctx.ellipse(2, -2 + y, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- Tail (bushy, dark-tipped, battle-stiff when attacking) ----
    const tailWag = atk ? -0.4 : Math.sin(t * 4) * 0.35;
    ctx.save();
    ctx.translate(-10, -4 + y);
    ctx.rotate(tailWag);
    // Bushy tail
    ctx.fillStyle = '#4a4540';
    ctx.beginPath();
    ctx.ellipse(-4, 0, 5, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3530';
    ctx.beginPath();
    ctx.ellipse(-7, -0.5, 3, 1.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Dark tip
    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.ellipse(-9, -1, 2, 1.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ---- Body — thick, muscular, battle-hardened ----
    // Shadow underneath
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 5 + y, 10, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body (larger, muscular)
    ctx.fillStyle = '#4e4a44';
    ctx.beginPath();
    ctx.ellipse(0, -2 + y, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back ridge (darker, raised fur)
    ctx.fillStyle = '#2e2a25';
    ctx.beginPath();
    ctx.ellipse(0, -5 + y, 10, 3, 0, Math.PI, 0);
    ctx.fill();
    // Bristled hackles (raised when attacking)
    const hackleH = atk ? 3 : 1.5;
    ctx.fillStyle = '#3a3630';
    for (let i = 0; i < 7; i++) {
        const hx = -6 + i * 2;
        ctx.beginPath();
        ctx.moveTo(hx, -5 + y);
        ctx.lineTo(hx + 0.5, -5 - hackleH + Math.sin(t * 8 + i) * 0.5 + y);
        ctx.lineTo(hx + 1.5, -5 + y);
        ctx.fill();
    }
    // Belly (lighter grey-brown)
    ctx.fillStyle = '#6a6558';
    ctx.beginPath();
    ctx.ellipse(0, 0 + y, 7, 2.5, 0, 0, Math.PI);
    ctx.fill();

    // ---- Battle scars ----
    ctx.strokeStyle = 'rgba(120, 50, 50, 0.5)';
    ctx.lineWidth = 0.7;
    // Scar 1 - across flank
    ctx.beginPath();
    ctx.moveTo(-3, -3 + y);
    ctx.lineTo(1, -1 + y);
    ctx.stroke();
    // Scar 2 - on shoulder
    ctx.beginPath();
    ctx.moveTo(4, -4 + y);
    ctx.lineTo(6, -2 + y);
    ctx.stroke();

    // ---- LEATHER + STUDDED SHOULDER ARMOR ----
    // Left shoulder guard
    ctx.fillStyle = '#5a4030';
    ctx.beginPath();
    ctx.ellipse(-5, -4 + y, 3.5, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.ellipse(-5, -4.5 + y, 3, 1.5, -0.2, Math.PI, 0);
    ctx.fill();
    // Metal studs
    ctx.fillStyle = '#8a8890';
    ctx.beginPath(); ctx.arc(-6.5, -4 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-4, -5 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5, -3 + y, 0.6, 0, Math.PI * 2); ctx.fill();

    // Right shoulder guard  
    ctx.fillStyle = '#5a4030';
    ctx.beginPath();
    ctx.ellipse(5, -4 + y, 3.5, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.ellipse(5, -4.5 + y, 3, 1.5, 0.2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#8a8890';
    ctx.beginPath(); ctx.arc(6.5, -4 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -5 + y, 0.7, 0, Math.PI * 2); ctx.fill();

    // ---- Legs (muscular, running animation) ----
    const legPhase = moving ? t * 14 : 0;
    // Front legs (thicker, armored paws)
    const fLeg1 = moving ? Math.sin(legPhase) * 3 : 0;
    const fLeg2 = moving ? Math.sin(legPhase + Math.PI) * 3 : 0;
    ctx.fillStyle = '#4e4a44';
    ctx.fillRect(5, 2 + y + fLeg1, 2.5, 5);
    ctx.fillRect(2, 2 + y + fLeg2, 2.5, 5);
    // Claws (prominent)
    ctx.fillStyle = '#2a2520';
    ctx.fillRect(5, 6.5 + y + fLeg1, 1, 2);
    ctx.fillRect(6.5, 6.5 + y + fLeg1, 1, 2);
    ctx.fillRect(2, 6.5 + y + fLeg2, 1, 2);
    ctx.fillRect(3.5, 6.5 + y + fLeg2, 1, 2);

    // Back legs (thicker haunches)
    ctx.fillStyle = '#4e4a44';
    const bLeg1 = moving ? Math.sin(legPhase + Math.PI * 0.5) * 3 : 0;
    const bLeg2 = moving ? Math.sin(legPhase + Math.PI * 1.5) * 3 : 0;
    ctx.fillRect(-6, 1 + y + bLeg1, 3, 6);
    ctx.fillRect(-3.5, 1 + y + bLeg2, 3, 6);
    ctx.fillStyle = '#2a2520';
    ctx.fillRect(-6, 6.5 + y + bLeg1, 1, 2);
    ctx.fillRect(-4.5, 6.5 + y + bLeg1, 1, 2);
    ctx.fillRect(-3.5, 6.5 + y + bLeg2, 1, 2);
    ctx.fillRect(-2, 6.5 + y + bLeg2, 1, 2);

    // ---- CLAW SWIPE EFFECT (attack) ----
    if (atk && clawSwipe > 0.1) {
        ctx.save();
        ctx.translate(12, -2 + y);
        ctx.rotate(clawSwipe);
        ctx.strokeStyle = `rgba(255, 220, 180, ${clawSwipe * 0.8})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 2);
            ctx.quadraticCurveTo(5, i * 2 - 2, 8, i * 2 + 1);
            ctx.stroke();
        }
        ctx.restore();
    }

    // ---- Head (larger, angular, menacing) ----
    ctx.fillStyle = '#524e48';
    ctx.beginPath();
    ctx.ellipse(9, -5 + y, 5, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Darker top
    ctx.fillStyle = '#3a3630';
    ctx.beginPath();
    ctx.ellipse(9, -6.5 + y, 4.5, 2.5, -0.1, Math.PI, 0);
    ctx.fill();

    // ---- SPIKED IRON COLLAR ----
    ctx.fillStyle = '#4a4a50';
    ctx.beginPath();
    ctx.ellipse(4, -3 + y, 3.5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Collar band
    ctx.fillStyle = '#3a3a40';
    ctx.strokeStyle = '#5a5a60';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(4, -3 + y, 3.5, 3, 0.3, Math.PI * 0.3, Math.PI * 1.7);
    ctx.stroke();
    // Spikes on collar
    ctx.fillStyle = '#7a7a80';
    for (let i = 0; i < 4; i++) {
        const sa = Math.PI * 0.4 + i * 0.35;
        const sx = 4 + Math.cos(sa + 0.3) * 3.5;
        const sy = -3 + y + Math.sin(sa + 0.3) * 3;
        const spDir = sa + 0.3;
        ctx.beginPath();
        ctx.moveTo(sx - Math.sin(spDir) * 1, sy + Math.cos(spDir) * 1);
        ctx.lineTo(sx + Math.cos(spDir) * 4, sy + Math.sin(spDir) * 4);
        ctx.lineTo(sx + Math.sin(spDir) * 1, sy - Math.cos(spDir) * 1);
        ctx.fill();
    }
    // Metal ring on collar
    ctx.fillStyle = '#8a8a90';
    ctx.beginPath();
    ctx.arc(4, 0 + y, 1, 0, Math.PI * 2);
    ctx.fill();

    // ---- Snout (elongated, wrinkled when snarling) ----
    ctx.fillStyle = '#5a5650';
    ctx.fillRect(12, -6 + y, 6, 3);
    ctx.fillStyle = '#4a4640';
    ctx.fillRect(12, -7 + y, 5, 2); // nose bridge

    // Snarl wrinkles
    ctx.strokeStyle = '#3a3630';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(11, -6 + y + i * 1);
        ctx.lineTo(13, -5.5 + y + i * 0.8);
        ctx.stroke();
    }

    // Nose (wet, dark)
    ctx.fillStyle = '#1a1510';
    ctx.beginPath();
    ctx.ellipse(17, -5 + y, 1.5, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nose highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(16.5, -5.5 + y, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // ---- Jaw + BITE attack ----
    ctx.fillStyle = '#4a4640';
    ctx.fillRect(12, -3.5 + y + biteOpen, 5, 2);
    // Upper fangs (long, curved)
    ctx.fillStyle = '#f0ece0';
    ctx.beginPath();
    ctx.moveTo(13, -3.5 + y); ctx.lineTo(12.5, -1 + y); ctx.lineTo(13.5, -3.5 + y);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -3.5 + y); ctx.lineTo(14.5, -1 + y); ctx.lineTo(15.5, -3.5 + y);
    ctx.fill();
    // Lower fangs
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath();
    ctx.moveTo(13, -2.5 + y + biteOpen); ctx.lineTo(12.8, -4.5 + y + biteOpen * 0.5); ctx.lineTo(13.5, -2.5 + y + biteOpen);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -2.5 + y + biteOpen); ctx.lineTo(14.8, -4.5 + y + biteOpen * 0.5); ctx.lineTo(15.5, -2.5 + y + biteOpen);
    ctx.fill();
    // Smaller teeth
    ctx.fillStyle = '#ddd';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(13.5 + i * 0.7, -3.5 + y, 0.5, 0.8);
        ctx.fillRect(13.5 + i * 0.7, -2.5 + y + biteOpen, 0.5, 0.7);
    }

    // Gums/mouth interior
    if (biteOpen > 0.5) {
        ctx.fillStyle = '#8a2020';
        ctx.fillRect(12.5, -3 + y, 4, biteOpen * 0.8);
        // Tongue
        ctx.fillStyle = '#cc3333';
        ctx.beginPath();
        ctx.ellipse(14, -2 + y + biteOpen * 0.3, 1.5, biteOpen * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Saliva drip (when attacking)
    if (atk) {
        const drip = (t * 3) % 1;
        ctx.fillStyle = `rgba(200, 210, 220, ${0.5 * (1 - drip)})`;
        ctx.beginPath();
        ctx.arc(14, -1 + y + drip * 5, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- Ears (torn, battle-damaged, alert) ----
    ctx.fillStyle = '#4e4a44';
    // Left ear (torn notch)
    ctx.beginPath();
    ctx.moveTo(7, -8 + y);
    ctx.lineTo(7.5, -13 + y);
    ctx.lineTo(8, -11 + y); // torn notch
    ctx.lineTo(8.5, -13 + y);
    ctx.lineTo(9, -8 + y);
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(10, -8 + y);
    ctx.lineTo(11, -13 + y);
    ctx.lineTo(12, -8 + y);
    ctx.fill();
    // Inner ear (reddish)
    ctx.fillStyle = '#6a3a3a';
    ctx.beginPath();
    ctx.moveTo(10.3, -8.5 + y);
    ctx.lineTo(11, -12 + y);
    ctx.lineTo(11.7, -8.5 + y);
    ctx.fill();

    // ---- Eyes — BLOOD-RED FURY ----
    const eyeGlow = 0.85 + Math.sin(t * 4) * 0.15;
    const eyeIntensity = atk ? 1 : eyeGlow;
    // Large glow aura
    ctx.fillStyle = `rgba(255, 10, 0, ${eyeIntensity * 0.25})`;
    ctx.beginPath();
    ctx.arc(10, -7 + y, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eye shape (angular, fierce)
    ctx.fillStyle = `rgba(255, 20, 5, ${eyeIntensity})`;
    ctx.beginPath();
    ctx.moveTo(9, -7 + y);
    ctx.lineTo(10, -8 + y);
    ctx.lineTo(12, -7 + y);
    ctx.lineTo(10, -6 + y);
    ctx.closePath();
    ctx.fill();
    // Bright slit pupil
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(10, -7.5 + y, 0.7, 1.5);
    // Eyeshine reflection
    ctx.fillStyle = 'rgba(255,255,200,0.4)';
    ctx.fillRect(10.5, -7.5 + y, 0.4, 0.4);

    // ---- Fury particles when attacking ----
    if (atk) {
        for (let i = 0; i < 4; i++) {
            const px = 5 + Math.cos(t * 8 + i * 1.5) * 6;
            const py = -6 + y + Math.sin(t * 6 + i * 2) * 4;
            const alpha = Math.sin(atkP * Math.PI) * 0.3;
            ctx.fillStyle = `rgba(255, ${50 + i * 20}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// ===== SKELETON — Undead necromantic warrior, dark soul-fire =====
function drawSkeleton(ctx: CanvasRenderingContext2D, bob: number, t: number, atk: boolean, atkP: number, moving: boolean): void {
    const y = bob;
    // Attack: Wide sword slash arc
    const slashAngle = atk ? (atkP < 0.5 ? atkP * 2 * -1.8 : (1 - atkP) * 2 * -1.8) : 0;

    // ---- NECROTIC AURA ----
    const auraAlpha = 0.04 + Math.sin(t * 1.5) * 0.02;
    ctx.fillStyle = `rgba(20, 60, 20, ${auraAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, -3 + y, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- HEAVY TATTERED CLOAK (behind body) ----
    ctx.fillStyle = '#1a1518';
    ctx.beginPath();
    ctx.moveTo(-6, -8 + y);
    ctx.lineTo(-9, 8 + y + Math.sin(t * 2.5) * 1.5);
    ctx.lineTo(-6, 10 + y + Math.sin(t * 2 + 1) * 1);
    ctx.lineTo(0, 10 + y + Math.sin(t * 2 + 2) * 0.8);
    ctx.lineTo(6, 10 + y - Math.sin(t * 2 + 0.5) * 1);
    ctx.lineTo(9, 8 + y - Math.sin(t * 2.5 + 1) * 1.5);
    ctx.lineTo(6, -8 + y);
    ctx.closePath();
    ctx.fill();
    // Cloak tattered edges
    ctx.fillStyle = '#0f0d10';
    for (let i = 0; i < 7; i++) {
        const ex = -8 + i * 2.5;
        const ey = 8 + y + Math.sin(t * 1.8 + i * 0.8) * 2;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + 1, ey + 3);
        ctx.lineTo(ex + 2, ey);
        ctx.fill();
    }
    // Cloak rune sigils (faintly glowing)
    const runeGlow = 0.1 + Math.sin(t * 2) * 0.06;
    ctx.fillStyle = `rgba(40, 180, 60, ${runeGlow})`;
    ctx.fillRect(-3, 2 + y, 1.5, 2);
    ctx.fillRect(-2, 0 + y, 1, 1);
    ctx.fillRect(2, 3 + y, 1.5, 2);
    ctx.fillRect(3, 1 + y, 1, 1);

    // ---- SHOULDER PAULDRON (left) ----
    ctx.fillStyle = '#3a3540';
    ctx.beginPath();
    ctx.ellipse(-5, -7 + y, 3, 2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2530';
    ctx.beginPath();
    ctx.ellipse(-5, -7.5 + y, 2.5, 1.2, -0.2, Math.PI, 0);
    ctx.fill();
    // Spike on pauldron
    ctx.fillStyle = '#4a4550';
    ctx.beginPath();
    ctx.moveTo(-5, -8 + y);
    ctx.lineTo(-5.5, -12 + y);
    ctx.lineTo(-4, -8.5 + y);
    ctx.fill();

    // ---- RIBCAGE / TORSO (cracked, dark bones) ----
    ctx.fillStyle = '#c0b8a0';
    ctx.fillRect(-3.5, -7 + y, 7, 9);
    // Spine (individual vertebrae)
    ctx.fillStyle = '#a09880';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-1, -6.5 + y + i * 1.8, 2, 1.2);
    }
    // Ribs (curved, detailed)
    ctx.strokeStyle = '#9a9078';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
        const ry = -6 + y + i * 1.8;
        ctx.beginPath();
        ctx.moveTo(-3.5, ry);
        ctx.quadraticCurveTo(-1, ry + 1, 0, ry + 0.3);
        ctx.quadraticCurveTo(1, ry + 1, 3.5, ry);
        ctx.stroke();
    }
    // Bone cracks
    ctx.strokeStyle = 'rgba(60, 50, 40, 0.4)';
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(-2, -5 + y); ctx.lineTo(-1, -3 + y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -4 + y); ctx.lineTo(3, -2 + y); ctx.stroke();

    // Dark energy in chest
    const chestGlow = 0.1 + Math.sin(t * 2.5) * 0.05;
    ctx.fillStyle = `rgba(30, 150, 50, ${chestGlow})`;
    ctx.beginPath();
    ctx.arc(0, -3 + y, 2, 0, Math.PI * 2);
    ctx.fill();

    // ---- SKULL (cracked, menacing) ----
    // Main skull
    ctx.fillStyle = '#ddd8c8';
    ctx.beginPath();
    ctx.arc(0, -11 + y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Darker temple areas
    ctx.fillStyle = '#c8c0b0';
    ctx.beginPath();
    ctx.arc(-2, -12 + y, 3, Math.PI * 0.7, Math.PI * 1.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -12 + y, 3, Math.PI * 1.5, Math.PI * 0.3);
    ctx.fill();

    // Skull cracks
    ctx.strokeStyle = 'rgba(80, 70, 60, 0.5)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-1, -15 + y); ctx.lineTo(-2, -12 + y); ctx.lineTo(-1, -10 + y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -14 + y); ctx.lineTo(3, -11 + y); ctx.stroke();

    // Brow ridges
    ctx.fillStyle = '#b8b0a0';
    ctx.fillRect(-4, -13 + y, 3.5, 1);
    ctx.fillRect(0.5, -13 + y, 3.5, 1);

    // Eye sockets (deep, angular)
    ctx.fillStyle = '#0a0808';
    ctx.beginPath();
    ctx.moveTo(-3.5, -12.5 + y);
    ctx.lineTo(-1.8, -13.5 + y);
    ctx.lineTo(-0.5, -12 + y);
    ctx.lineTo(-1.8, -10.5 + y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.5, -12 + y);
    ctx.lineTo(1.8, -13.5 + y);
    ctx.lineTo(3.5, -12.5 + y);
    ctx.lineTo(1.8, -10.5 + y);
    ctx.closePath();
    ctx.fill();

    // GREEN SOUL-FIRE EYES
    const eyeGlow = 0.7 + Math.sin(t * 4) * 0.3;
    const eyeFlare = atk ? 1 : eyeGlow;
    // Glow aura
    ctx.fillStyle = `rgba(40, 200, 60, ${eyeFlare * 0.2})`;
    ctx.beginPath(); ctx.arc(-1.8, -12 + y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.8, -12 + y, 5, 0, Math.PI * 2); ctx.fill();
    // Eye cores
    ctx.fillStyle = `rgba(50, 220, 80, ${eyeFlare})`;
    ctx.beginPath(); ctx.arc(-1.8, -12 + y, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.8, -12 + y, 1.2, 0, Math.PI * 2); ctx.fill();
    // Bright center
    ctx.fillStyle = `rgba(150, 255, 150, ${eyeFlare * 0.7})`;
    ctx.beginPath(); ctx.arc(-1.8, -12.2 + y, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.8, -12.2 + y, 0.5, 0, Math.PI * 2); ctx.fill();

    // Nose hole
    ctx.fillStyle = '#2a2520';
    ctx.beginPath();
    ctx.moveTo(-0.5, -9.5 + y);
    ctx.lineTo(0, -10.5 + y);
    ctx.lineTo(0.5, -9.5 + y);
    ctx.closePath();
    ctx.fill();

    // Jaw (hinged, opens wide when attacking)
    const jawOpen = atk ? Math.sin(atkP * Math.PI) * 3 : 0;
    ctx.fillStyle = '#c8c0b0';
    ctx.beginPath();
    ctx.moveTo(-3, -8 + y);
    ctx.lineTo(-3.5, -7 + y + jawOpen);
    ctx.lineTo(3.5, -7 + y + jawOpen);
    ctx.lineTo(3, -8 + y);
    ctx.closePath();
    ctx.fill();
    // Scar across jaw
    ctx.strokeStyle = 'rgba(80, 70, 60, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-2, -7.5 + y + jawOpen * 0.5);
    ctx.lineTo(1, -7 + y + jawOpen * 0.5);
    ctx.stroke();
    // Upper teeth
    ctx.fillStyle = '#e0d8c8';
    for (let i = 0; i < 5; i++) {
        const tx = -2.5 + i * 1.2;
        ctx.beginPath();
        ctx.moveTo(tx, -8 + y);
        ctx.lineTo(tx + 0.3, -7 + y);
        ctx.lineTo(tx + 0.6, -8 + y);
        ctx.fill();
    }
    // Lower teeth
    ctx.fillStyle = '#d8d0c0';
    for (let i = 0; i < 4; i++) {
        const tx = -2 + i * 1.2;
        ctx.beginPath();
        ctx.moveTo(tx, -7 + y + jawOpen);
        ctx.lineTo(tx + 0.3, -8 + y + jawOpen * 0.5);
        ctx.lineTo(tx + 0.6, -7 + y + jawOpen);
        ctx.fill();
    }

    // Green glow from mouth when attacking
    if (jawOpen > 0.5) {
        ctx.fillStyle = `rgba(30, 180, 50, ${Math.sin(atkP * Math.PI) * 0.3})`;
        ctx.fillRect(-2, -7.5 + y, 4, jawOpen * 0.5);
    }

    // ---- BATTLE-WORN SHIELD (left arm) ----
    ctx.fillStyle = '#3a3a45';
    ctx.beginPath();
    ctx.moveTo(-8, -8 + y);
    ctx.lineTo(-9, -2 + y);
    ctx.lineTo(-8, 3 + y);
    ctx.lineTo(-4, 3 + y);
    ctx.lineTo(-3, -2 + y);
    ctx.lineTo(-4, -8 + y);
    ctx.closePath();
    ctx.fill();
    // Shield face
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(-8, -7 + y, 4.5, 9);
    // Shield boss
    ctx.fillStyle = '#6a6a75';
    ctx.beginPath(); ctx.arc(-5.5, -2.5 + y, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a5a65';
    ctx.beginPath(); ctx.arc(-5.5, -2.5 + y, 1, 0, Math.PI * 2); ctx.fill();
    // Skull emblem on shield
    ctx.fillStyle = '#8a8590';
    ctx.beginPath(); ctx.arc(-5.5, -5 + y, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3a45';
    ctx.fillRect(-6.2, -5.3 + y, 0.5, 0.5);
    ctx.fillRect(-5.2, -5.3 + y, 0.5, 0.5);
    // Shield dents / battle damage
    ctx.strokeStyle = 'rgba(30, 30, 35, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-7, -4 + y); ctx.lineTo(-6, -3 + y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 0 + y); ctx.lineTo(-4, 1 + y); ctx.stroke();
    // Bone arm holding shield
    ctx.fillStyle = '#c0b8a0';
    ctx.fillRect(-5, -7 + y, 1.5, 5);

    // ---- DARK BLADE (right arm) — SLASH ATTACK ----
    ctx.save();
    ctx.translate(5, -5 + y);
    ctx.rotate(slashAngle);

    // Bone arm
    ctx.fillStyle = '#c0b8a0';
    ctx.fillRect(-1, -2, 2, 6);
    // Skeletal hand (finger bones)
    ctx.fillStyle = '#b0a890';
    ctx.fillRect(-1.5, 3.5, 0.8, 2);
    ctx.fillRect(-0.5, 3.5, 0.8, 2.5);
    ctx.fillRect(0.5, 3.5, 0.8, 2);

    // Sword handle (wrapped)
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(-0.5, 5, 1.5, 3.5);
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-0.5, 5.5, 1.5, 0.5);
    ctx.fillRect(-0.5, 6.5, 1.5, 0.5);
    // Pommel
    ctx.fillStyle = '#5a5060';
    ctx.beginPath(); ctx.arc(0.2, 5, 1, 0, Math.PI * 2); ctx.fill();
    // Guard (ornate)
    ctx.fillStyle = '#5a5060';
    ctx.fillRect(-2.5, 8, 5.5, 1.5);
    ctx.fillStyle = '#6a6070';
    ctx.beginPath(); ctx.arc(-2.5, 8.7, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 8.7, 1, 0, Math.PI * 2); ctx.fill();

    // Blade (dark, notched)
    ctx.fillStyle = '#6a6568';
    ctx.beginPath();
    ctx.moveTo(-0.7, 9.5);
    ctx.lineTo(0.7, 9.5);
    ctx.lineTo(0.5, 20);
    ctx.lineTo(0, 21);
    ctx.lineTo(-0.5, 20);
    ctx.closePath();
    ctx.fill();
    // Blade edge
    ctx.fillStyle = '#8a8588';
    ctx.fillRect(0.1, 9.5, 0.5, 11);
    // Fuller (groove)
    ctx.fillStyle = '#4a4548';
    ctx.fillRect(-0.2, 10, 0.5, 8);
    // Notches (battle damage)
    ctx.fillStyle = '#3a3538';
    ctx.fillRect(-0.7, 12, 0.8, 0.5);
    ctx.fillRect(-0.6, 15, 0.6, 0.4);
    ctx.fillRect(0.3, 17, 0.6, 0.4);

    // Green soul-fire slash trail
    if (atk) {
        const trailAlpha = 0.5 * Math.sin(atkP * Math.PI);
        ctx.strokeStyle = `rgba(50, 200, 80, ${trailAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 14, 10, slashAngle - 0.6, slashAngle + 0.6);
        ctx.stroke();
        // Inner trail
        ctx.strokeStyle = `rgba(100, 255, 120, ${trailAlpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 14, 8, slashAngle - 0.4, slashAngle + 0.4);
        ctx.stroke();
    }

    ctx.restore();

    // ---- LEGS (bone, armored knees) ----
    ctx.fillStyle = '#c0b8a0';
    const legAnim = moving ? Math.sin(t * 6) * 1.5 : 0;
    ctx.fillRect(-2.5, 2 + y + legAnim, 2, 7);
    ctx.fillRect(1, 2 + y - legAnim, 2, 7);
    // Knee guards
    ctx.fillStyle = '#4a4550';
    ctx.fillRect(-3, 4 + y + legAnim, 3, 2);
    ctx.fillRect(0.5, 4 + y - legAnim, 3, 2);
    // Feet
    ctx.fillStyle = '#a09880';
    ctx.fillRect(-3, 8.5 + y + legAnim, 3, 1.5);
    ctx.fillRect(0.5, 8.5 + y - legAnim, 3, 1.5);

    // ---- SOUL PARTICLES (green, ghostly) ----
    for (let i = 0; i < 5; i++) {
        const px = Math.sin(t * 1.0 + i * 1.3) * 10;
        const py = -14 + y - Math.abs(Math.sin(t * 0.7 + i * 1.2)) * 8;
        const alpha = 0.12 + Math.sin(t * 2.5 + i) * 0.07;
        ctx.fillStyle = `rgba(40, 200, 60, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

}

// ===== OGRE — Massive green brute, bone armor, ground-slam attack =====
function drawOgre(ctx: CanvasRenderingContext2D, bob: number, t: number, atk: boolean, atkP: number, moving: boolean): void {
    const y = bob;
    // Attack: Overhead club slam
    const slamPhase = atk ? atkP : 0;
    const clubAngle = atk ? (slamPhase < 0.4 ? slamPhase / 0.4 * -1.8 : (slamPhase < 0.6 ? -1.8 + (slamPhase - 0.4) / 0.2 * 3.0 : 1.2 * (1 - (slamPhase - 0.6) / 0.4))) : 0;

    // ---- RAGE AURA ----
    const rageAlpha = 0.03 + Math.sin(t * 1.5) * 0.015;
    ctx.fillStyle = `rgba(40, 20, 5, ${rageAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, -2 + y, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- MASSIVE BODY ----
    // Main torso (dark swamp green)
    ctx.fillStyle = '#2a5520';
    ctx.beginPath();
    ctx.ellipse(0, -4 + y, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Muscle definition (chest)
    ctx.fillStyle = '#1f4a18';
    ctx.beginPath();
    ctx.ellipse(-3, -7 + y, 3, 4, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3, -7 + y, 3, 4, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Belly (lighter, thick hide)
    ctx.fillStyle = '#3a6a2a';
    ctx.beginPath();
    ctx.ellipse(0, -1 + y, 7, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly button / scar
    ctx.fillStyle = '#2a5a1a';
    ctx.beginPath();
    ctx.ellipse(0, 1 + y, 1.5, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Battle scars
    ctx.strokeStyle = 'rgba(80, 30, 20, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-4, -8 + y); ctx.lineTo(-2, -4 + y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -6 + y); ctx.lineTo(3, -2 + y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -2 + y); ctx.lineTo(-3, 2 + y); ctx.stroke();

    // Skin warts/bumps (textured)
    ctx.fillStyle = '#1f4a15';
    for (let i = 0; i < 8; i++) {
        const bx = Math.cos(i * 0.85 + 0.5) * 6;
        const by = -4 + y + Math.sin(i * 1.2 + 0.3) * 7;
        ctx.beginPath();
        ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- HEAVY ARMOR SHOULDER PADS ----
    // Left shoulder (iron banded + bone spikes)
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath();
    ctx.ellipse(-10, -9 + y, 5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(-13, -10 + y, 7, 2);
    ctx.fillRect(-13, -8 + y, 7, 1);
    // Iron rivets
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath(); ctx.arc(-12, -9 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-8, -9 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    // Bone spikes (larger)
    ctx.fillStyle = '#c0b8a0';
    ctx.beginPath();
    ctx.moveTo(-11, -11 + y); ctx.lineTo(-10, -16 + y); ctx.lineTo(-9, -11 + y); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-9, -11 + y); ctx.lineTo(-8.5, -15 + y); ctx.lineTo(-7.5, -11 + y); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-13, -10 + y); ctx.lineTo(-13.5, -14 + y); ctx.lineTo(-12, -10 + y); ctx.fill();

    // Right shoulder
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath();
    ctx.ellipse(10, -9 + y, 5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(6, -10 + y, 7, 2);
    ctx.fillRect(6, -8 + y, 7, 1);
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath(); ctx.arc(8, -9 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -9 + y, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0b8a0';
    ctx.beginPath();
    ctx.moveTo(9, -11 + y); ctx.lineTo(10, -16 + y); ctx.lineTo(11, -11 + y); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, -11 + y); ctx.lineTo(12, -14 + y); ctx.lineTo(13, -11 + y); ctx.fill();

    // ---- STUDDED LEATHER BELT + TROPHY SKULL ----
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(-8, 4 + y, 16, 3.5);
    // Studs
    ctx.fillStyle = '#6a6a72';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(-6 + i * 3, 5.5 + y, 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // Belt buckle skull
    ctx.fillStyle = '#c8c0a8';
    ctx.beginPath(); ctx.arc(0, 5.5 + y, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1515';
    ctx.fillRect(-1, 5 + y, 0.7, 0.7);
    ctx.fillRect(0.3, 5 + y, 0.7, 0.7);
    ctx.fillStyle = '#c8c0a8';
    ctx.fillRect(-0.5, 6 + y, 1, 0.5);

    // ---- HEAD (massive, brutish) ----
    ctx.fillStyle = '#2a5520';
    ctx.beginPath();
    ctx.arc(0, -17 + y, 6, 0, Math.PI * 2);
    ctx.fill();
    // Darker top
    ctx.fillStyle = '#1f4a18';
    ctx.beginPath();
    ctx.ellipse(0, -19 + y, 5.5, 3, 0, Math.PI, 0);
    ctx.fill();

    // Heavy brow ridge
    ctx.fillStyle = '#1a4010';
    ctx.fillRect(-5.5, -20.5 + y, 11, 3);
    // Deep-set brow shadow
    ctx.fillStyle = '#153510';
    ctx.fillRect(-5, -19 + y, 10, 1.5);

    // WAR PAINT (red marks)
    ctx.fillStyle = 'rgba(150, 30, 20, 0.4)';
    ctx.fillRect(-5, -17.5 + y, 2, 4);
    ctx.fillRect(3, -17.5 + y, 2, 4);

    // Bloodshot amber eyes
    const eyeRage = atk ? 1 : 0.8 + Math.sin(t * 3) * 0.15;
    // Eye whites (yellowish, bloodshot)
    ctx.fillStyle = '#e0c860';
    ctx.fillRect(-3.5, -18 + y, 2.5, 2);
    ctx.fillRect(1, -18 + y, 2.5, 2);
    // Blood veins in eyes
    ctx.strokeStyle = `rgba(200, 40, 20, ${eyeRage * 0.4})`;
    ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.moveTo(-3.5, -17.5 + y); ctx.lineTo(-2.5, -17 + y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3.5, -17.5 + y); ctx.lineTo(2.5, -17 + y); ctx.stroke();
    // Dark pupils
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-2.8, -17.8 + y, 1.2, 1.4);
    ctx.fillRect(1.6, -17.8 + y, 1.2, 1.4);
    // Eye glow
    ctx.fillStyle = `rgba(255, 180, 0, ${eyeRage * 0.15})`;
    ctx.beginPath(); ctx.arc(-2.2, -17 + y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.2, -17 + y, 4, 0, Math.PI * 2); ctx.fill();

    // Wide flattened nose
    ctx.fillStyle = '#1a4010';
    ctx.beginPath();
    ctx.moveTo(-2, -15.5 + y);
    ctx.quadraticCurveTo(0, -14.5 + y, 2, -15.5 + y);
    ctx.lineTo(2, -13.5 + y);
    ctx.quadraticCurveTo(0, -14 + y, -2, -13.5 + y);
    ctx.closePath();
    ctx.fill();
    // Nostrils
    ctx.fillStyle = '#0f3008';
    ctx.beginPath(); ctx.arc(-1, -14 + y, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1, -14 + y, 0.8, 0, Math.PI * 2); ctx.fill();

    // HUGE TUSKS (curved, prominent)
    ctx.fillStyle = '#e0d8c0';
    // Left tusk
    ctx.beginPath();
    ctx.moveTo(-3, -13 + y);
    ctx.quadraticCurveTo(-4.5, -10 + y, -3.5, -8 + y);
    ctx.lineTo(-2.5, -8.5 + y);
    ctx.quadraticCurveTo(-3, -10.5 + y, -2, -13 + y);
    ctx.closePath();
    ctx.fill();
    // Right tusk
    ctx.beginPath();
    ctx.moveTo(3, -13 + y);
    ctx.quadraticCurveTo(4.5, -10 + y, 3.5, -8 + y);
    ctx.lineTo(2.5, -8.5 + y);
    ctx.quadraticCurveTo(3, -10.5 + y, 2, -13 + y);
    ctx.closePath();
    ctx.fill();
    // Tusk shine
    ctx.fillStyle = 'rgba(255, 255, 240, 0.3)';
    ctx.fillRect(-3.2, -12 + y, 0.5, 3);
    ctx.fillRect(2.7, -12 + y, 0.5, 3);

    // Jaw / mouth
    ctx.fillStyle = '#1a4010';
    ctx.fillRect(-3, -13 + y, 6, 1.5);

    // ---- THICK ARMS ----
    ctx.fillStyle = '#2a5520';
    // Left arm
    ctx.fillRect(-11, -6 + y, 4, 12);
    ctx.fillStyle = '#1f4a18';
    ctx.fillRect(-11.5, 5 + y, 5, 3.5); // fist
    // Forearm wraps
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(-11, 0 + y, 4, 1.5);
    ctx.fillRect(-11, 2.5 + y, 4, 1.5);

    // Right arm + MASSIVE WAR CLUB (attack animated)
    ctx.save();
    ctx.translate(10, -6 + y);
    ctx.rotate(clubAngle);

    ctx.fillStyle = '#2a5520';
    ctx.fillRect(-1.5, -2, 4, 12);
    ctx.fillStyle = '#1f4a18';
    ctx.fillRect(-2, 9, 5, 3.5); // fist
    // Forearm wraps
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(-1.5, 3, 4, 1.5);
    ctx.fillRect(-1.5, 5.5, 4, 1.5);

    // Massive war club (handle)
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-1, 11, 3.5, 14);
    // Leather wrap on handle
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(-1, 12, 3.5, 1);
    ctx.fillRect(-1, 14, 3.5, 1);
    // Club head (huge, spiked)
    ctx.fillStyle = '#2a1508';
    ctx.beginPath();
    ctx.ellipse(1, 26, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iron bands on club
    ctx.strokeStyle = '#5a5a62';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(1, 23, 5.5, 3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(1, 28, 5, 3, 0, 0, Math.PI * 2); ctx.stroke();
    // Metal spikes (larger, nastier)
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath(); ctx.moveTo(-5, 24); ctx.lineTo(-8, 23); ctx.lineTo(-5, 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7, 24); ctx.lineTo(10, 23); ctx.lineTo(7, 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, 30); ctx.lineTo(-4, 33); ctx.lineTo(-1, 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 30); ctx.lineTo(5, 33); ctx.lineTo(6, 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(1, 34); ctx.lineTo(2, 30); ctx.fill();
    // Blood stains on club
    ctx.fillStyle = 'rgba(120, 20, 10, 0.3)';
    ctx.beginPath(); ctx.arc(-3, 25, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, 27, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // ---- LEGS (massive, armored) ----
    ctx.fillStyle = '#2a5520';
    const legAnim = moving ? Math.sin(t * 4) * 1.5 : 0;
    ctx.fillRect(-5.5, 7 + y + legAnim, 4.5, 9);
    ctx.fillRect(1, 7 + y - legAnim, 4.5, 9);
    // Leg wraps / guards
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(-5.5, 9 + y + legAnim, 4.5, 2);
    ctx.fillRect(1, 9 + y - legAnim, 4.5, 2);
    ctx.fillRect(-5.5, 13 + y + legAnim, 4.5, 1.5);
    ctx.fillRect(1, 13 + y - legAnim, 4.5, 1.5);
    // Massive feet with toe claws
    ctx.fillStyle = '#1f4a18';
    ctx.fillRect(-7, 15 + y + legAnim, 7, 3);
    ctx.fillRect(0, 15 + y - legAnim, 7, 3);
    // Toe claws
    ctx.fillStyle = '#a09878';
    ctx.beginPath(); ctx.moveTo(-6, 18 + y + legAnim); ctx.lineTo(-7, 19.5 + y + legAnim); ctx.lineTo(-5, 18 + y + legAnim); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, 18 + y + legAnim); ctx.lineTo(-3.5, 19.5 + y + legAnim); ctx.lineTo(-2, 18 + y + legAnim); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, 18 + y - legAnim); ctx.lineTo(1.5, 19.5 + y - legAnim); ctx.lineTo(3, 18 + y - legAnim); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, 18 + y - legAnim); ctx.lineTo(4.5, 19.5 + y - legAnim); ctx.lineTo(6, 18 + y - legAnim); ctx.fill();

    // ---- GROUND SLAM IMPACT ----
    if (atk && slamPhase > 0.45 && slamPhase < 0.7) {
        const impactAlpha = (1 - Math.abs(slamPhase - 0.55) / 0.15) * 0.7;
        // Shockwave ring
        ctx.strokeStyle = `rgba(180, 140, 60, ${impactAlpha})`;
        ctx.lineWidth = 2.5;
        const impactR = (slamPhase - 0.45) / 0.25 * 25;
        ctx.beginPath();
        ctx.arc(14, 16 + y, impactR, 0, Math.PI * 2);
        ctx.stroke();
        // Inner ring
        ctx.strokeStyle = `rgba(220, 180, 80, ${impactAlpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(14, 16 + y, impactR * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        // Debris
        for (let i = 0; i < 6; i++) {
            const dx = 14 + Math.cos(i * 1.1) * impactR * 0.9;
            const dy = 15 + y + Math.sin(i * 1.1) * impactR * 0.6;
            ctx.fillStyle = `rgba(100, 80, 50, ${impactAlpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(dx, dy, 1.5 + Math.sin(i) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Ground crack
        ctx.strokeStyle = `rgba(60, 40, 20, ${impactAlpha * 0.5})`;
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) {
            const ca = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(14, 16 + y);
            ctx.lineTo(14 + Math.cos(ca) * impactR * 0.5, 16 + y + Math.sin(ca) * impactR * 0.4);
            ctx.stroke();
        }
    }
}

// ===== EUROPEAN DRAGON — Dark lord of the skies, terrifying fire-breather =====
function drawDragonWest(ctx: CanvasRenderingContext2D, bob: number, t: number, atk: boolean, atkP: number, moving: boolean): void {
    const y = bob;
    const breathe = Math.sin(t * 1.5) * 1.5;

    // ---- DARK AURA (ambient menace) ----
    const auraAlpha = 0.06 + Math.sin(t * 1.2) * 0.02;
    ctx.fillStyle = `rgba(80, 10, 0, ${auraAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, -5 + y, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- TAIL (behind body, thick, spiked) ----
    const tailSway = Math.sin(t * 1.2) * 5;
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath();
    ctx.moveTo(-8, 2 + y);
    ctx.quadraticCurveTo(-14 + tailSway * 0.3, -1 + y, -20 + tailSway * 0.5, -4 + y);
    ctx.quadraticCurveTo(-26 + tailSway * 0.8, -7 + y, -30 + tailSway, -9 + y);
    ctx.lineTo(-30 + tailSway, -6 + y);
    ctx.quadraticCurveTo(-24 + tailSway * 0.7, -3 + y, -18 + tailSway * 0.4, 1 + y);
    ctx.quadraticCurveTo(-12, 4 + y, -8, 5 + y);
    ctx.closePath();
    ctx.fill();
    // Tail spikes
    ctx.fillStyle = '#3a1a10';
    for (let i = 0; i < 4; i++) {
        const tp = i / 4;
        const tx = -10 - tp * 18 + tailSway * tp * 0.8;
        const ty = 0 + y - tp * 8;
        ctx.beginPath();
        ctx.moveTo(tx - 1, ty + 1);
        ctx.lineTo(tx, ty - 3);
        ctx.lineTo(tx + 1, ty + 1);
        ctx.fill();
    }
    // Tail blade tip
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.moveTo(-30 + tailSway, -9 + y);
    ctx.lineTo(-35 + tailSway, -12 + y);
    ctx.lineTo(-33 + tailSway, -8 + y);
    ctx.lineTo(-36 + tailSway, -6 + y);
    ctx.lineTo(-30 + tailSway, -6 + y);
    ctx.closePath();
    ctx.fill();

    // ---- MASSIVE WINGS (dark bat-like, torn edges) ----
    const wingFlap = Math.sin(t * 1.0) * 0.25;

    // Left wing
    ctx.save();
    ctx.translate(-10, -18 + y);
    ctx.rotate(-0.35 + wingFlap);
    // Wing bones
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-24, -20);
    ctx.lineTo(-18, -10);
    ctx.lineTo(-28, -14);
    ctx.lineTo(-20, -5);
    ctx.lineTo(-26, -4);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();
    // Membrane panels (dark red translucent)
    ctx.fillStyle = '#2a0808';
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.lineTo(-22, -18);
    ctx.lineTo(-16, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#250505';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-26, -12);
    ctx.lineTo(-18, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#200505';
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.lineTo(-24, -2);
    ctx.lineTo(-14, 2);
    ctx.closePath();
    ctx.fill();
    // Wing veins (blood-red)
    ctx.strokeStyle = '#3a1010';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-1, -1); ctx.lineTo(-22, -18);
    ctx.moveTo(-3, 0); ctx.lineTo(-26, -12);
    ctx.moveTo(-5, 1); ctx.lineTo(-24, -2);
    ctx.stroke();
    // Torn membrane holes
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(-14, -10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-18, -6, 1.5, 0, Math.PI * 2); ctx.fill();
    // Wing claw tips
    ctx.fillStyle = '#4a3020';
    ctx.beginPath(); ctx.moveTo(-24, -20); ctx.lineTo(-26, -22); ctx.lineTo(-23, -19); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-28, -14); ctx.lineTo(-30, -15); ctx.lineTo(-27, -13); ctx.fill();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.translate(10, -18 + y);
    ctx.rotate(0.35 - wingFlap);
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, -8);
    ctx.lineTo(24, -20);
    ctx.lineTo(18, -10);
    ctx.lineTo(28, -14);
    ctx.lineTo(20, -5);
    ctx.lineTo(26, -4);
    ctx.lineTo(16, 0);
    ctx.lineTo(10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a0808';
    ctx.beginPath();
    ctx.moveTo(2, -1); ctx.lineTo(22, -18); ctx.lineTo(16, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#250505';
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(26, -12); ctx.lineTo(18, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#200505';
    ctx.beginPath();
    ctx.moveTo(8, 1); ctx.lineTo(24, -2); ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a1010';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(1, -1); ctx.lineTo(22, -18);
    ctx.moveTo(3, 0); ctx.lineTo(26, -12);
    ctx.stroke();
    ctx.fillStyle = '#4a3020';
    ctx.beginPath(); ctx.moveTo(24, -20); ctx.lineTo(26, -22); ctx.lineTo(23, -19); ctx.fill();
    ctx.restore();

    // ---- MASSIVE BODY (dark, armored) ----
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath();
    ctx.ellipse(0, -6 + y + breathe, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armored chest plates
    ctx.fillStyle = '#2a1510';
    ctx.beginPath();
    ctx.ellipse(0, -3 + y + breathe, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lava cracks on body (glowing)
    const lavaGlow = 0.4 + Math.sin(t * 2) * 0.2;
    ctx.strokeStyle = `rgba(255, 60, 10, ${lavaGlow})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4, -8 + y + breathe); ctx.lineTo(-2, -3 + y + breathe);
    ctx.moveTo(3, -10 + y + breathe); ctx.lineTo(5, -5 + y + breathe);
    ctx.moveTo(-1, -4 + y + breathe); ctx.lineTo(2, 1 + y + breathe);
    ctx.stroke();
    // Lava glow spots
    ctx.fillStyle = `rgba(255, 80, 10, ${lavaGlow * 0.3})`;
    ctx.beginPath(); ctx.arc(-3, -5 + y + breathe, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -7 + y + breathe, 2, 0, Math.PI * 2); ctx.fill();

    // Scale armor rows
    ctx.fillStyle = '#120605';
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 5; col++) {
            const sx = -4 + col * 2;
            const sy = -12 + y + breathe + row * 3;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 1, sy - 1);
            ctx.lineTo(sx + 2, sy);
            ctx.lineTo(sx + 1, sy + 1);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Spine ridge (large, jagged)
    ctx.fillStyle = '#0a0505';
    for (let i = 0; i < 8; i++) {
        const sy = -20 + y + i * 3.5;
        const sH = 3 + Math.sin(i * 0.8) * 1;
        ctx.beginPath();
        ctx.moveTo(-1.5, sy + 2);
        ctx.lineTo(0, sy - sH);
        ctx.lineTo(1.5, sy + 2);
        ctx.fill();
    }

    // ---- HEAD (massive, crowned with horns) ----
    // Neck
    ctx.fillStyle = '#1a0a08';
    ctx.fillRect(-4, -22 + y, 8, 6);

    // Main skull
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath();
    ctx.moveTo(-6, -24 + y);
    ctx.quadraticCurveTo(-7, -30 + y, 0, -32 + y);
    ctx.quadraticCurveTo(7, -30 + y, 6, -24 + y);
    ctx.closePath();
    ctx.fill();

    // Snout (elongated, angular)
    ctx.fillStyle = '#180808';
    ctx.beginPath();
    ctx.moveTo(-4, -26 + y);
    ctx.lineTo(-3, -32 + y);
    ctx.lineTo(3, -32 + y);
    ctx.lineTo(4, -26 + y);
    ctx.closePath();
    ctx.fill();

    // Jaw (open when breathing fire)
    const jawOpen = atk ? Math.sin(atkP * Math.PI) * 3 : 0;
    ctx.fillStyle = '#150606';
    ctx.beginPath();
    ctx.moveTo(-4, -25 + y);
    ctx.lineTo(-3, -25 + y + jawOpen);
    ctx.lineTo(3, -25 + y + jawOpen);
    ctx.lineTo(4, -25 + y);
    ctx.closePath();
    ctx.fill();

    // Mouth interior (glowing when attacking)
    if (jawOpen > 0.5) {
        ctx.fillStyle = `rgba(255, 80, 10, ${Math.sin(atkP * Math.PI) * 0.7})`;
        ctx.fillRect(-2.5, -25 + y, 5, jawOpen * 0.7);
    }

    // Upper teeth (sharp fangs)
    ctx.fillStyle = '#d0c8b0';
    for (let i = 0; i < 4; i++) {
        const tx = -2 + i * 1.3;
        ctx.beginPath();
        ctx.moveTo(tx, -26 + y);
        ctx.lineTo(tx + 0.3, -24 + y);
        ctx.lineTo(tx + 0.8, -26 + y);
        ctx.fill();
    }
    // Lower fangs
    if (jawOpen > 0.3) {
        ctx.fillStyle = '#c0b8a0';
        for (let i = 0; i < 3; i++) {
            const tx = -1.5 + i * 1.3;
            ctx.beginPath();
            ctx.moveTo(tx, -24.5 + y + jawOpen);
            ctx.lineTo(tx + 0.3, -26 + y + jawOpen * 0.5);
            ctx.lineTo(tx + 0.8, -24.5 + y + jawOpen);
            ctx.fill();
        }
    }

    // Nose ridges
    ctx.fillStyle = '#100505';
    ctx.fillRect(-2, -31 + y, 1, 2);
    ctx.fillRect(1, -31 + y, 1, 2);

    // ---- CROWN OF HORNS ----
    ctx.fillStyle = '#3a2010';
    // Main horns (large, curved back)
    ctx.beginPath(); ctx.moveTo(-5, -28 + y); ctx.quadraticCurveTo(-9, -34 + y, -8, -38 + y); ctx.lineTo(-6, -36 + y); ctx.quadraticCurveTo(-7, -32 + y, -4, -28 + y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -28 + y); ctx.quadraticCurveTo(9, -34 + y, 8, -38 + y); ctx.lineTo(6, -36 + y); ctx.quadraticCurveTo(7, -32 + y, 4, -28 + y); ctx.fill();
    // Secondary horns
    ctx.fillStyle = '#2a1508';
    ctx.beginPath(); ctx.moveTo(-3, -30 + y); ctx.lineTo(-5, -35 + y); ctx.lineTo(-2, -31 + y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3, -30 + y); ctx.lineTo(5, -35 + y); ctx.lineTo(2, -31 + y); ctx.fill();
    // Brow spikes
    ctx.fillStyle = '#3a2010';
    ctx.beginPath(); ctx.moveTo(-6, -27 + y); ctx.lineTo(-8, -29 + y); ctx.lineTo(-5, -27.5 + y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -27 + y); ctx.lineTo(8, -29 + y); ctx.lineTo(5, -27.5 + y); ctx.fill();

    // Horn highlights
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(-7.5, -36 + y, 0.8, 3);
    ctx.fillRect(6.7, -36 + y, 0.8, 3);

    // ---- EYES — MOLTEN MAGMA ----
    const eyeGlow = 0.85 + Math.sin(t * 3.5) * 0.15;
    const eyeFlare = atk ? 1 : eyeGlow;
    // Eye socket shadow
    ctx.fillStyle = '#0a0303';
    ctx.beginPath(); ctx.ellipse(-3, -28 + y, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, -28 + y, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    // Magma glow aura
    ctx.fillStyle = `rgba(255, 40, 0, ${eyeFlare * 0.3})`;
    ctx.beginPath(); ctx.arc(-3, -28 + y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -28 + y, 5, 0, Math.PI * 2); ctx.fill();
    // Eye shape (angular slits)
    ctx.fillStyle = `rgba(255, 50, 0, ${eyeFlare})`;
    ctx.beginPath();
    ctx.moveTo(-4.5, -28 + y); ctx.lineTo(-3, -29.5 + y); ctx.lineTo(-1.5, -28 + y); ctx.lineTo(-3, -27 + y);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1.5, -28 + y); ctx.lineTo(3, -29.5 + y); ctx.lineTo(4.5, -28 + y); ctx.lineTo(3, -27 + y);
    ctx.closePath(); ctx.fill();
    // Bright slit pupils
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-3.3, -28.5 + y, 0.6, 1.5);
    ctx.fillRect(2.7, -28.5 + y, 0.6, 1.5);

    // ---- SMOKE FROM NOSTRILS ----
    for (let i = 0; i < 3; i++) {
        const st = (t * 2 + i * 1.5) % 5;
        if (st < 3.5) {
            const alpha = 0.12 * (1 - st / 3.5);
            const sx = -0.5 + Math.sin(st * 2 + i) * 2;
            ctx.fillStyle = `rgba(40, 30, 30, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sx, -32 + y - st * 3, 2 + st * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- LEGS (muscular, clawed) ----
    ctx.fillStyle = '#1a0a08';
    const legAnim = moving ? Math.sin(t * 3) * 1.5 : 0;
    // Front legs
    ctx.fillRect(-8, 4 + y + legAnim, 5, 9);
    ctx.fillRect(3, 4 + y - legAnim, 5, 9);
    // Leg armor plates
    ctx.fillStyle = '#2a1510';
    ctx.fillRect(-7, 5 + y + legAnim, 3.5, 3);
    ctx.fillRect(4, 5 + y - legAnim, 3.5, 3);
    // Massive claws
    ctx.fillStyle = '#2a1a10';
    for (let l = 0; l < 2; l++) {
        const lx = l === 0 ? -8 : 3;
        const la = l === 0 ? legAnim : -legAnim;
        for (let c = 0; c < 3; c++) {
            ctx.beginPath();
            ctx.moveTo(lx + c * 2, 12.5 + y + la);
            ctx.lineTo(lx + c * 2 + 0.8, 15 + y + la);
            ctx.lineTo(lx + c * 2 + 1.6, 12.5 + y + la);
            ctx.fill();
        }
    }

    // ---- DEVASTATING FIRE BREATH ATTACK ----
    if (atk) {
        const fireInt = Math.sin(atkP * Math.PI);
        const fireLen = fireInt * 40;

        // Heat distortion wave
        ctx.strokeStyle = `rgba(255, 100, 20, ${fireInt * 0.15})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(15, -26 + y, fireLen * 0.7, -0.5, 0.5);
        ctx.stroke();

        // Main fire stream
        for (let i = 0; i < 12; i++) {
            const fx = 4 + i * fireLen / 12;
            const fy = -27 + y + Math.sin(t * 25 + i * 0.6) * (i * 0.5);
            const fSize = (5 - i * 0.35) * fireInt;
            if (fSize <= 0) continue;

            // Outer fire (dark red/orange)
            ctx.fillStyle = `rgba(200, ${30 + i * 12}, 0, ${(0.7 - i * 0.05) * fireInt})`;
            ctx.beginPath();
            ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
            ctx.fill();
            // Mid fire (orange)
            ctx.fillStyle = `rgba(255, ${80 + i * 15}, 0, ${(0.6 - i * 0.04) * fireInt})`;
            ctx.beginPath();
            ctx.arc(fx, fy, fSize * 0.65, 0, Math.PI * 2);
            ctx.fill();
            // Inner fire (bright yellow)
            ctx.fillStyle = `rgba(255, ${200 + i * 5}, 50, ${(0.5 - i * 0.03) * fireInt})`;
            ctx.beginPath();
            ctx.arc(fx, fy, fSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // White-hot core at mouth
        ctx.fillStyle = `rgba(255, 255, 220, ${0.7 * fireInt})`;
        ctx.beginPath();
        ctx.arc(4, -27 + y, 3 * fireInt, 0, Math.PI * 2);
        ctx.fill();

        // Ember particles
        for (let i = 0; i < 6; i++) {
            const ex = 5 + Math.random() * fireLen * 0.8;
            const ey = -27 + y + (Math.random() - 0.5) * 10;
            ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 20, ${fireInt * 0.5})`;
            ctx.beginPath();
            ctx.arc(ex, ey, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- Ambient embers (always, from body cracks) ----
    for (let i = 0; i < 3; i++) {
        const ex = Math.sin(t * 1.5 + i * 2) * 6;
        const ey = -10 + y - ((t * 8 + i * 10) % 20);
        const alpha = 0.2 + Math.sin(t * 3 + i) * 0.1;
        ctx.fillStyle = `rgba(255, ${60 + i * 30}, 10, ${alpha})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}
// ===== ASIAN DRAGON — Mighty storm emperor, serpentine fury =====
function drawDragonEast(ctx: CanvasRenderingContext2D, bob: number, t: number, atk: boolean, atkP: number, moving: boolean): void {
    const y = bob;

    // ---- STORM AURA (ambient power) ----
    const stormAlpha = 0.04 + Math.sin(t * 1.5) * 0.02;
    ctx.fillStyle = `rgba(40, 20, 80, ${stormAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, -3 + y, 35, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- LONG SERPENTINE BODY (12 segments, thick, undulating) ----
    const segments = 12;
    const segPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < segments; i++) {
        const phase = t * 1.8 + i * 0.7;
        const amplitude = moving ? 4 : 2;
        const sx = -i * 4.5;
        const sy = y - 5 + Math.sin(phase) * amplitude + i * 0.3;
        segPoints.push({ x: sx, y: sy });
    }

    // Storm clouds beneath dragon
    for (let i = 0; i < 5; i++) {
        const cx = -i * 10 + Math.sin(t * 0.4 + i) * 4;
        const cy = y + 10 + Math.sin(t * 0.6 + i * 1.5) * 2;
        const alpha = 0.06 + Math.sin(t * 0.5 + i * 2) * 0.03;
        ctx.fillStyle = `rgba(100, 80, 140, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- Ornate TAIL FAN ----
    const tail = segPoints[segments - 1];
    ctx.fillStyle = '#6a1515';
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(tail.x - 8, tail.y - 8);
    ctx.lineTo(tail.x - 5, tail.y - 3);
    ctx.lineTo(tail.x - 10, tail.y - 4);
    ctx.lineTo(tail.x - 6, tail.y);
    ctx.lineTo(tail.x - 10, tail.y + 3);
    ctx.lineTo(tail.x - 5, tail.y + 2);
    ctx.lineTo(tail.x - 8, tail.y + 7);
    ctx.closePath();
    ctx.fill();
    // Fan details
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.moveTo(tail.x - 2, tail.y);
    ctx.lineTo(tail.x - 7, tail.y - 6);
    ctx.lineTo(tail.x - 4, tail.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tail.x - 2, tail.y);
    ctx.lineTo(tail.x - 7, tail.y + 5);
    ctx.lineTo(tail.x - 4, tail.y + 1);
    ctx.closePath();
    ctx.fill();

    // Draw body from tail to head
    for (let i = segPoints.length - 1; i >= 0; i--) {
        const seg = segPoints[i];
        const width = 3.5 + (segments - i) * 0.4;

        // Body segment (dark crimson)
        ctx.fillStyle = i % 2 === 0 ? '#7a1515' : '#951e1e';
        ctx.beginPath();
        ctx.ellipse(seg.x, seg.y, width, width * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker back ridge
        ctx.fillStyle = i % 2 === 0 ? '#5a0e0e' : '#6a1212';
        ctx.beginPath();
        ctx.ellipse(seg.x, seg.y - width * 0.4, width * 0.8, width * 0.25, 0, Math.PI, 0);
        ctx.fill();

        // Golden belly armor plates
        ctx.fillStyle = '#c89020';
        ctx.beginPath();
        ctx.ellipse(seg.x, seg.y + width * 0.35, width * 0.55, width * 0.25, 0, 0, Math.PI);
        ctx.fill();
        // Belly scale lines
        ctx.strokeStyle = '#a07018';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(seg.x - width * 0.4, seg.y + width * 0.3);
        ctx.lineTo(seg.x + width * 0.4, seg.y + width * 0.3);
        ctx.stroke();
    }

    // ---- Dorsal fins / spines (larger, sharper) ----
    for (let i = 0; i < segments - 1; i++) {
        const seg = segPoints[i];
        const finH = 4 + Math.sin(t * 2.5 + i) * 1.5;
        const finColor = i % 3 === 0 ? '#cc3030' : '#aa2525';
        ctx.fillStyle = finColor;
        ctx.beginPath();
        ctx.moveTo(seg.x - 2, seg.y - 3.5);
        ctx.lineTo(seg.x, seg.y - 3.5 - finH);
        ctx.lineTo(seg.x + 2, seg.y - 3.5);
        ctx.fill();
        // Fin highlight
        ctx.fillStyle = '#dd5050';
        ctx.beginPath();
        ctx.moveTo(seg.x - 0.5, seg.y - 4);
        ctx.lineTo(seg.x, seg.y - 3.5 - finH + 1);
        ctx.lineTo(seg.x + 0.5, seg.y - 4);
        ctx.fill();
    }

    // ---- POWERFUL LEGS (4 legs, clawed) ----
    const p1 = segPoints[1];
    const p2 = segPoints[2];
    const p6 = segPoints[5];
    const p7 = segPoints[6];
    ctx.fillStyle = '#7a1515';
    // Front pair
    ctx.fillRect(p1.x - 2.5, p1.y + 3, 2.5, 6);
    ctx.fillRect(p2.x + 0.5, p2.y + 3, 2.5, 6);
    // Back pair
    ctx.fillRect(p6.x - 2.5, p6.y + 3, 2.5, 6);
    ctx.fillRect(p7.x + 0.5, p7.y + 3, 2.5, 6);
    // Golden claws (prominent, sharp)
    ctx.fillStyle = '#daa520';
    for (const p of [p1, p2, p6, p7]) {
        const lx = p === p1 || p === p6 ? p.x - 2.5 : p.x + 0.5;
        for (let c = 0; c < 3; c++) {
            ctx.beginPath();
            ctx.moveTo(lx + c * 0.8, p.y + 9);
            ctx.lineTo(lx + c * 0.8 + 0.4, p.y + 11);
            ctx.lineTo(lx + c * 0.8 + 0.8, p.y + 9);
            ctx.fill();
        }
    }

    // ---- HEAD (massive, fierce dragon face) ----
    const head = segPoints[0];
    const hx = head.x + 7;
    const hy = head.y - 2;

    // Main head (larger)
    ctx.fillStyle = '#8a1a1a';
    ctx.beginPath();
    ctx.ellipse(hx, hy, 6.5, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Darker top
    ctx.fillStyle = '#6a1010';
    ctx.beginPath();
    ctx.ellipse(hx, hy - 2, 6, 3, -0.1, Math.PI, 0);
    ctx.fill();

    // Long snout
    ctx.fillStyle = '#8a1a1a';
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy - 3);
    ctx.lineTo(hx + 14, hy - 2);
    ctx.lineTo(hx + 14, hy + 1);
    ctx.lineTo(hx + 5, hy + 2);
    ctx.closePath();
    ctx.fill();
    // Snout ridge
    ctx.fillStyle = '#6a1010';
    ctx.fillRect(hx + 6, hy - 3.5, 7, 1.5);

    // Nostrils
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.arc(hx + 13, hy - 1.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + 13, hy + 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Jaw (opens when attacking)
    const jawOpen = atk ? Math.sin(atkP * Math.PI) * 3.5 : 0;
    ctx.fillStyle = '#7a1515';
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy + 2);
    ctx.lineTo(hx + 13, hy + 1 + jawOpen);
    ctx.lineTo(hx + 5, hy + 2 + jawOpen * 0.8);
    ctx.closePath();
    ctx.fill();

    // Mouth interior
    if (jawOpen > 0.5) {
        ctx.fillStyle = `rgba(80, 150, 255, ${Math.sin(atkP * Math.PI) * 0.5})`;
        ctx.fillRect(hx + 6, hy + 1, 6, jawOpen * 0.6);
    }

    // Sharp fangs
    ctx.fillStyle = '#f0e8d0';
    // Upper fangs
    ctx.beginPath(); ctx.moveTo(hx + 8, hy + 0.5); ctx.lineTo(hx + 7.5, hy + 3); ctx.lineTo(hx + 8.5, hy + 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + 10, hy + 0.5); ctx.lineTo(hx + 9.5, hy + 2.5); ctx.lineTo(hx + 10.5, hy + 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + 12, hy); ctx.lineTo(hx + 11.5, hy + 2); ctx.lineTo(hx + 12.5, hy); ctx.fill();

    // ---- GOLDEN ANTLERS (large, branching, majestic) ----
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 1.2;
    for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(hx - 1, hy - 5);
        ctx.scale(side, 1);

        // Main antler trunk
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(2, -6, 3, -12);
        ctx.stroke();
        // Branch 1
        ctx.beginPath();
        ctx.moveTo(1.5, -5);
        ctx.quadraticCurveTo(4, -6, 6, -8);
        ctx.stroke();
        // Branch 2
        ctx.beginPath();
        ctx.moveTo(2.5, -9);
        ctx.quadraticCurveTo(5, -10, 7, -12);
        ctx.stroke();
        // Branch 3 (top)
        ctx.beginPath();
        ctx.moveTo(3, -12);
        ctx.lineTo(5, -14);
        ctx.stroke();

        // Golden tips
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(6, -8, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -12, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -14, 0.8, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    // ---- FLOWING MANE (crimson + gold) ----
    for (let i = 0; i < 8; i++) {
        const mx = hx - 2 - i * 2;
        const my = hy - 4 + Math.sin(t * 3 + i * 0.8) * 2;
        const mLen = 4 + Math.sin(t * 2 + i) * 1.5;
        const isGold = i % 3 === 0;
        ctx.fillStyle = isGold ? 'rgba(218, 165, 32, 0.7)' : 'rgba(180, 30, 30, 0.6)';
        ctx.beginPath();
        ctx.ellipse(mx, my, 1.8, mLen, 0.4 + Math.sin(t + i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- WHISKERS (long, powerful, flowing) ----
    ctx.lineWidth = 1;
    for (let side = -1; side <= 1; side += 2) {
        const wy = hy + side * 2.5;
        const whiskerFlow = Math.sin(t * 1.5 + side) * 4;
        // Main whisker
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(hx + 14, wy);
        ctx.quadraticCurveTo(hx + 22, wy + side * 3 + whiskerFlow, hx + 30, wy + side * 5 + whiskerFlow);
        ctx.stroke();
        // Secondary whisker
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(hx + 13, wy + side * 0.5);
        ctx.quadraticCurveTo(hx + 19, wy + side * 4 + whiskerFlow * 0.8, hx + 25, wy + side * 6 + whiskerFlow * 1.2);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    // ---- EYES — BLAZING GOLDEN FURY ----
    const eyeGlow = 0.85 + Math.sin(t * 3) * 0.15;
    const eyeFlare = atk ? 1 : eyeGlow;
    // Eye glow aura
    ctx.fillStyle = `rgba(255, 200, 0, ${eyeFlare * 0.25})`;
    ctx.beginPath();
    ctx.arc(hx + 4, hy - 2.5, 5, 0, Math.PI * 2);
    ctx.fill();
    // Eye shape (angular, fierce)
    ctx.fillStyle = `rgba(255, 215, 0, ${eyeFlare})`;
    ctx.beginPath();
    ctx.moveTo(hx + 2, hy - 2.5);
    ctx.lineTo(hx + 4, hy - 4);
    ctx.lineTo(hx + 6, hy - 2.5);
    ctx.lineTo(hx + 4, hy - 1.5);
    ctx.closePath();
    ctx.fill();
    // Red slit pupil
    ctx.fillStyle = '#cc1100';
    ctx.fillRect(hx + 3.7, hy - 3.5, 0.6, 2);
    // Eyeshine
    ctx.fillStyle = 'rgba(255,255,200,0.5)';
    ctx.fillRect(hx + 4.5, hy - 3.5, 0.4, 0.4);

    // Nostril smoke
    for (let i = 0; i < 2; i++) {
        const st = (t * 2 + i * 2) % 4;
        if (st < 2.5) {
            const alpha = 0.1 * (1 - st / 2.5);
            ctx.fillStyle = `rgba(100, 80, 140, ${alpha})`;
            ctx.beginPath();
            ctx.arc(hx + 14 + Math.sin(st + i) * 2, hy - 2 - st * 2.5, 1.5 + st * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- DIVINE PEARL (floating, glowing) ----
    if (!atk) {
        const pearlFloat = Math.sin(t * 2) * 2;
        const pearlGlow = 0.5 + Math.sin(t * 3) * 0.2;
        // Outer glow
        ctx.fillStyle = `rgba(150, 200, 255, ${pearlGlow * 0.15})`;
        ctx.beginPath();
        ctx.arc(hx + 18, hy - 1 + pearlFloat, 6, 0, Math.PI * 2);
        ctx.fill();
        // Pearl
        ctx.fillStyle = `rgba(200, 230, 255, ${pearlGlow})`;
        ctx.beginPath();
        ctx.arc(hx + 18, hy - 1 + pearlFloat, 3, 0, Math.PI * 2);
        ctx.fill();
        // Pearl inner light
        ctx.fillStyle = `rgba(255, 255, 255, ${pearlGlow * 0.7})`;
        ctx.beginPath();
        ctx.arc(hx + 17, hy - 2 + pearlFloat, 1.2, 0, Math.PI * 2);
        ctx.fill();
        // Sparkles
        for (let i = 0; i < 3; i++) {
            const sa = t * 2 + i * 2.1;
            const sr = 4 + Math.sin(t * 3 + i) * 1;
            ctx.fillStyle = `rgba(200, 220, 255, ${0.3 + Math.sin(t * 4 + i) * 0.15})`;
            ctx.beginPath();
            ctx.arc(hx + 18 + Math.cos(sa) * sr, hy - 1 + pearlFloat + Math.sin(sa) * sr, 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- DEVASTATING LIGHTNING ATTACK ----
    if (atk) {
        const boltInt = Math.sin(atkP * Math.PI);
        const boltAlpha = boltInt * 0.9;

        // Thunder aura expanding ring
        ctx.strokeStyle = `rgba(100, 180, 255, ${boltInt * 0.2})`;
        ctx.lineWidth = 2;
        const ringR = boltInt * 25;
        ctx.beginPath();
        ctx.arc(hx + 20, hy, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // Energy orb at mouth (larger)
        ctx.fillStyle = `rgba(80, 160, 255, ${boltAlpha})`;
        ctx.beginPath();
        ctx.arc(hx + 16, hy, 4 * boltInt, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(180, 220, 255, ${boltAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(hx + 16, hy, 2 * boltInt, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${boltAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(hx + 16, hy, 1 * boltInt, 0, Math.PI * 2);
        ctx.fill();

        // Main lightning bolt (thick, jagged)
        if (boltInt > 0.2) {
            // Outer glow bolt
            ctx.strokeStyle = `rgba(80, 150, 255, ${boltAlpha * 0.5})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            let bx = hx + 18;
            let by = hy;
            ctx.moveTo(bx, by);
            for (let i = 0; i < 7; i++) {
                bx += 5 + Math.sin(t * 15 + i * 3) * 2;
                by += Math.sin(t * 12 + i * 2.5) * 5;
                ctx.lineTo(bx, by);
            }
            ctx.stroke();

            // Core bolt (bright)
            ctx.strokeStyle = `rgba(150, 220, 255, ${boltAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            bx = hx + 18;
            by = hy;
            ctx.moveTo(bx, by);
            for (let i = 0; i < 7; i++) {
                bx += 5 + Math.sin(t * 15 + i * 3) * 2;
                by += Math.sin(t * 12 + i * 2.5) * 5;
                ctx.lineTo(bx, by);
            }
            ctx.stroke();

            // White hot center
            ctx.strokeStyle = `rgba(230, 245, 255, ${boltAlpha * 0.7})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            bx = hx + 18;
            by = hy;
            ctx.moveTo(bx, by);
            for (let i = 0; i < 7; i++) {
                bx += 5 + Math.sin(t * 15 + i * 3) * 2;
                by += Math.sin(t * 12 + i * 2.5) * 5;
                ctx.lineTo(bx, by);
            }
            ctx.stroke();

            // Branch bolts
            ctx.strokeStyle = `rgba(120, 190, 255, ${boltAlpha * 0.4})`;
            ctx.lineWidth = 1;
            for (let b = 0; b < 3; b++) {
                const startSeg = 2 + b * 2;
                let bbx = hx + 18 + startSeg * 5;
                let bby = hy + Math.sin(t * 12 + startSeg * 2.5) * 4;
                ctx.beginPath();
                ctx.moveTo(bbx, bby);
                for (let j = 0; j < 3; j++) {
                    bbx += 3 + Math.random() * 2;
                    bby += (Math.random() - 0.5) * 8;
                    ctx.lineTo(bbx, bby);
                }
                ctx.stroke();
            }
        }

        // Electric particles
        for (let i = 0; i < 5; i++) {
            const ex = hx + 16 + Math.cos(t * 8 + i * 1.3) * (boltInt * 15);
            const ey = hy + Math.sin(t * 6 + i * 1.7) * (boltInt * 8);
            ctx.fillStyle = `rgba(150, 210, 255, ${boltAlpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(ex, ey, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body glow (energy channeling through body)
        for (let i = 0; i < 4; i++) {
            const seg = segPoints[i];
            ctx.fillStyle = `rgba(100, 180, 255, ${boltInt * 0.08})`;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
