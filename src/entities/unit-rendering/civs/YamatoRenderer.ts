// ============================================================
//  Yamato (Japan) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";

// ======== YAMATO SCOUT — Shinobi (ninja-like stealth scout) ========
export function drawScout_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Attack posture
    let bodyTilt = 0;
    let armRot = 0.1; // Idle: arm at side
    let armOffX = 0;
    let armOffY = 0;

    if (attackState) {
        if (attackProgress < 0.15) {
            // Crouch & prepare
            const t = attackProgress / 0.15;
            const ease = t * t;
            armRot = 0.1 * (1 - ease) + (-Math.PI / 1.3) * ease; // Arm back
            bodyTilt = -0.1 * ease;
            armOffY = -3 * ease;
        } else if (attackProgress < 0.35) {
            // Quick forward slash
            const t = (attackProgress - 0.15) / 0.2;
            const easeOut = 1 - Math.pow(1 - t, 4);
            armRot = (-Math.PI / 1.3) * (1 - easeOut) + (Math.PI / 2.5) * easeOut;
            bodyTilt = -0.1 * (1 - easeOut) + 0.2 * easeOut;
            armOffX = 8 * easeOut;
            armOffY = -3 * (1 - easeOut) + 2 * easeOut;
        } else if (attackProgress < 0.5) {
            // Hold
            const t = (attackProgress - 0.35) / 0.15;
            const shake = Math.sin(t * Math.PI * 5) * 0.03 * (1 - t);
            armRot = (Math.PI / 2.5) + shake;
            bodyTilt = 0.2 + shake;
            armOffX = 8 - t * 2;
            armOffY = 2;
        } else {
            // Recover
            const t = (attackProgress - 0.5) / 0.5;
            const ease = t * t * (3 - 2 * t);
            armRot = (Math.PI / 2.5) * (1 - ease) + 0.1 * ease;
            bodyTilt = 0.2 * (1 - ease);
            armOffX = 6 * (1 - ease);
            armOffY = 2 * (1 - ease);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 10 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(10 + bob));
    }

    // Tattered scarf trailing behind — civ accent colored
    if (age >= 2) {
        ctx.fillStyle = cv.accent + '88';
        const scarfWave = moving ? Math.sin(unit.animTimer * 16) * 3 : 0;
        ctx.fillRect(-8, -6 + bob, 2, 12 + scarfWave);
    }

    // Legs — civ colored leggings
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    // Tabi shoes
    ctx.fillStyle = cv.accent;
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

    // Body — CIV COLORED outfit
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    // Chest wrap accent
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-4, -2 + bob, 8, 3);
    // Left arm (static)
    if (age >= 3) {
        ctx.fillStyle = cv.bodyMid;
        ctx.fillRect(-7, -2 + bob, 3, 5);
        if (age >= 4) {
            ctx.fillStyle = cv.accent;
            ctx.fillRect(-7, -2 + bob, 3, 1);
        }
    }
    // Obi belt — civ accent
    ctx.fillStyle = cv.accent;
    ctx.fillRect(-5, 4 + bob, 10, 2);
    // Kunai holster (side)
    if (age >= 2) {
        ctx.fillStyle = '#444';
        ctx.fillRect(-6, 1 + bob, 2, 5);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-6, 1 + bob, 1, 3);
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -9 + bob, 2, 2);

    // Ninja face mask + headband
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-4, -8 + bob, 8, 5); // face mask
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -13 + bob, 8, 2); // hachimaki
    ctx.fillStyle = cv.accent;
    ctx.fillRect(3, -13 + bob, 2, 3); // civ-colored ties
    // Only eyes visible
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -10 + bob, 6, 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, -10 + bob, 2, 1);
    ctx.fillRect(1, -10 + bob, 2, 1);

    // ── RIGHT ARM + NINJATO (animated) ──
    ctx.save();
    ctx.translate(5, -2 + bob);
    ctx.rotate(armRot);
    ctx.translate(armOffX, armOffY);

    // Arm wrap
    ctx.fillStyle = age >= 3 ? (age >= 4 ? '#2a2a2a' : '#3a3a3a') : cv.bodyMid;
    ctx.fillRect(-2, 0, 4, 5);
    // Hand
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-1.5, 5, 3, 3);

    // Ninjato (straight Japanese short blade)
    ctx.save();
    ctx.translate(0, 8);
    ctx.rotate(0.1);

    // Handle (black cord wrap)
    ctx.fillStyle = '#111';
    ctx.fillRect(-1.5, -3, 3, 6);
    ctx.fillStyle = '#333';
    ctx.fillRect(-1.5, -2, 3, 1);
    ctx.fillRect(-1.5, 0, 3, 1);
    ctx.fillRect(-1.5, 2, 3, 1);

    // Square guard (tsuba)
    ctx.fillStyle = age >= 4 ? '#888' : '#555';
    ctx.fillRect(-2.5, -4, 5, 1.5);

    // Straight blade
    const bladeCol = age >= 4 ? '#f0f0f0' : age >= 3 ? '#ddd' : '#ccc';
    ctx.fillStyle = bladeCol;
    ctx.fillRect(-1.5, -4, 3, -18); // Main blade body
    // Edge shine
    ctx.fillStyle = '#fff';
    ctx.fillRect(-1.5, -20, 0.5, 16);
    // Tip (angled cut — ninjato-style)
    ctx.beginPath();
    ctx.moveTo(-1.5, -22);
    ctx.lineTo(1.5, -22);
    ctx.lineTo(1.5, -18);
    ctx.lineTo(-1.5, -22);
    ctx.fill();
    // Fuller groove
    ctx.fillStyle = age >= 4 ? '#ccc' : '#aaa';
    ctx.fillRect(-0.5, -20, 0.5, 14);

    // Poison glow (age 4)
    if (age >= 4) {
        ctx.globalAlpha = 0.25 + Math.sin(unit.animTimer * 6) * 0.12;
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(-1.5, -22, 3, 18);
        ctx.globalAlpha = 1;
    }

    // Slash trail
    if (attackState && attackProgress > 0.15 && attackProgress < 0.5) {
        const trailAlpha = attackProgress < 0.35 ? 0.5 : 0.5 * (1 - (attackProgress - 0.35) / 0.15);
        ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha})`;
        ctx.beginPath();
        ctx.moveTo(1, -18);
        ctx.lineTo(3, -24);
        ctx.lineTo(1, -28);
        ctx.lineTo(-1, -24);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore(); // ninjato
    ctx.restore(); // arm

    // Shuriken on belt (age 3+)
    if (age >= 3) {
        ctx.fillStyle = '#aaa';
        ctx.save();
        ctx.translate(-2, 5 + bob);
        ctx.rotate(unit.animTimer * 4);
        for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 2;
            ctx.fillRect(Math.cos(a) * 2 - 0.5, Math.sin(a) * 2 - 0.5, 1, 1);
        }
        ctx.fillRect(-0.5, -0.5, 1, 1);
        ctx.restore();
    }

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    // Ninja speed after-images — civ colored
    if (moving && age >= 3) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-12, -4 + bob, 6, 13);
        ctx.fillRect(-18, -4 + bob, 4, 11);
        ctx.globalAlpha = 1;
    }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

// ======== YAMATO SWORDSMAN — Samurai (侍) ========
export function drawSwords_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Dynamic Attack Posture Calculation (Overhead Katana Strike)
    let bodyTilt = 0;
    let armRot = Math.PI / 12; // Idle: holding sword up slightly
    let swordOffsetX = 0;
    let swordOffsetY = 0;

    if (attackState) {
        if (attackProgress < 0.25) {
            // Phase 1 — WIND-UP: Deep breath, raise katana high overhead
            const t = attackProgress / 0.25;
            const ease = t * t; // Accelerating ease-in
            armRot = (Math.PI / 12) * (1 - ease) + (-Math.PI / 1.2) * ease; // Arm way behind head
            bodyTilt = -0.2 * ease; // Lean back further
            swordOffsetY = -8 * ease; // Sword rises high
            swordOffsetX = -3 * ease; // Pull back slightly
        } else if (attackProgress < 0.45) {
            // Phase 2 — EXPLOSIVE STRIKE: Fast downward diagonal slash
            const t = (attackProgress - 0.25) / 0.2;
            const easeOut = 1 - Math.pow(1 - t, 3); // Explosive ease-out
            armRot = (-Math.PI / 1.2) * (1 - easeOut) + (Math.PI / 2.2) * easeOut; // Wide arc swing
            bodyTilt = -0.2 * (1 - easeOut) + 0.25 * easeOut; // Strong forward lean
            swordOffsetY = -8 * (1 - easeOut) + 4 * easeOut; // Sword comes down
            swordOffsetX = -3 * (1 - easeOut) + 10 * easeOut; // Lunge forward!
        } else if (attackProgress < 0.6) {
            // Phase 3 — IMPACT HOLD: Brief pause at lowest point (power feel)
            const t = (attackProgress - 0.45) / 0.15;
            const shake = Math.sin(t * Math.PI * 4) * 0.03 * (1 - t); // Micro vibration
            armRot = (Math.PI / 2.2) + shake;
            bodyTilt = 0.25 + shake;
            swordOffsetY = 4;
            swordOffsetX = 10 - t * 2; // Slight pullback
        } else {
            // Phase 4 — RECOVER: Smooth return to ready stance
            const t = (attackProgress - 0.6) / 0.4;
            const ease = t * t * (3 - 2 * t); // Smooth step
            armRot = (Math.PI / 2.2) * (1 - ease) + (Math.PI / 12) * ease;
            bodyTilt = 0.25 * (1 - ease);
            swordOffsetY = 4 * (1 - ease);
            swordOffsetX = 8 * (1 - ease);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#e8cfa6';
    const armorPrimary = age >= 3 ? cv.bodyDark : cv.bodyMid; // Red lacquered armor -> player color
    const armorLacing = age >= 3 ? '#111' : '#333';
    const clothColor = '#1a1a1a'; // Dark underclothes

    // ── LEGS & HAKAMA ──
    ctx.fillStyle = clothColor;
    ctx.fillRect(-6, 12 + bob, 5, 5 + legOff);
    ctx.fillRect(1, 12 + bob, 5, 5 - legOff);

    // Kyahan (Shin guards)
    ctx.fillStyle = armorPrimary;
    ctx.fillRect(-5, 17 + bob + legOff, 3, 5);
    ctx.fillRect(2, 17 + bob - legOff, 3, 5);
    ctx.fillStyle = armorLacing;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-5, 18 + bob + legOff + i * 1.5, 3, 0.5);
        ctx.fillRect(2, 18 + bob - legOff + i * 1.5, 3, 0.5);
    }

    // Tabi socks & Waraji sandals
    ctx.fillStyle = '#eee';
    ctx.fillRect(-6, 22 + bob + legOff, 5, 2);
    ctx.fillRect(1, 22 + bob - legOff, 5, 2);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(-6, 23 + bob + legOff, 5, 1);
    ctx.fillRect(1, 23 + bob - legOff, 5, 1);

    // ── SASHIMONO (Back Banner - Age 3+) ──
    if (age >= 3) {
        ctx.save();
        ctx.translate(-4, -6 + bob);
        ctx.rotate(-0.05);
        // Pole
        ctx.fillStyle = '#3a2a10';
        ctx.fillRect(0, -20, 1.5, 30);
        // Banner
        ctx.fillStyle = cv.accent;
        ctx.fillRect(1.5, -19, 12, 18);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        ctx.strokeRect(1.5, -19, 12, 18);

        // Clan Mon
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(7.5, -10, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = cv.accent;
            ctx.beginPath(); ctx.arc(7.5, -10, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // ── BACK ARM (Left Arm) ──
    // Samurais often wield Katana with two hands, but in 2D profile we fake it
    // by just showing the front arm holding it, or both merging at the hilt.
    ctx.fillStyle = clothColor;
    ctx.fillRect(-4, -2 + bob, 3, 6); // Just a sleeve visible behind

    // ── TORSO (Do) ──
    // Underclothes
    ctx.fillStyle = clothColor;
    ctx.fillRect(-6, -5 + bob, 12, 15);

    // Chest armor (Do)
    ctx.fillStyle = armorPrimary;
    ctx.fillRect(-7, -4 + bob, 14, 11);

    // Horizontal lacing lines
    ctx.fillStyle = armorLacing;
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-7, -2 + bob + i * 2.5, 14, 1);
    }

    // Kusazuri (Tasselled Skirt Armor)
    ctx.fillStyle = armorPrimary;
    ctx.fillRect(-8, 7 + bob, 4, 6);
    ctx.fillRect(-2, 7 + bob, 4, 6);
    ctx.fillRect(4, 7 + bob, 4, 6);

    ctx.fillStyle = armorLacing;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-8, 8 + bob + i * 2, 4, 0.5);
        ctx.fillRect(-2, 8 + bob + i * 2, 4, 0.5);
        ctx.fillRect(4, 8 + bob + i * 2, 4, 0.5);
    }

    // Waist tie (Obi)
    ctx.fillStyle = '#eee';
    ctx.fillRect(-7, 5 + bob, 14, 2);

    // ── HEAD & KABUTO ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 7, 7);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1, -10 + bob, 1.5, 1.5);

    if (age >= 3) {
        // Mempo (Mask)
        ctx.fillStyle = '#222';
        ctx.fillRect(-4, -8 + bob, 8, 3.5);
        ctx.fillStyle = '#b31515'; // Red grimace
        ctx.fillRect(-2, -7 + bob, 5, 1);

        // Kabuto Helmet Dome
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(0, -12 + bob, 6, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-7, -13 + bob, 14, 1); // Rim

        // Shikoro (Neck Guard)
        ctx.fillStyle = armorPrimary;
        ctx.fillRect(-8, -12 + bob, 5, 6);
        ctx.fillRect(4, -12 + bob, 4, 6);
        ctx.fillStyle = armorLacing;
        ctx.fillRect(-8, -10 + bob, 5, 0.5); ctx.fillRect(-8, -8 + bob, 5, 0.5);
        ctx.fillRect(4, -10 + bob, 4, 0.5); ctx.fillRect(4, -8 + bob, 4, 0.5);

        // Maedate (Front Crest - Golden Horns)
        if (age >= 4) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.moveTo(-6, -24 + bob); ctx.quadraticCurveTo(0, -12 + bob, 6, -24 + bob); ctx.lineTo(4, -14 + bob); ctx.lineTo(-4, -14 + bob); ctx.fill();
            ctx.fillStyle = armorPrimary;
            ctx.beginPath(); ctx.arc(0, -15 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    } else if (age >= 2) {
        // Jingasa
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.moveTo(-8, -11 + bob); ctx.lineTo(8, -11 + bob); ctx.lineTo(0, -17 + bob); ctx.fill();
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1; ctx.stroke();
    } else {
        // Topknot (Chonmage)
        ctx.fillStyle = '#111';
        ctx.fillRect(-4, -14 + bob, 8, 2);
        ctx.fillRect(-2, -16 + bob, 4, 2);
        ctx.fillStyle = '#eee'; ctx.fillRect(-4, -13 + bob, 8, 1); // Headband
    }

    // ── FRONT ARM & WEAPON (Katana) ──
    ctx.save();
    ctx.translate(6, -3 + bob);
    ctx.rotate(armRot);
    ctx.translate(swordOffsetX, swordOffsetY); // Arm + sword move together

    // Front Arm with Kote (Samurai arm armor)
    if (attackState) {
        // Attacking: longer curved arm
        ctx.lineCap = 'round';
        // Upper arm sleeve
        ctx.strokeStyle = clothColor; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(3, 6, 0, 11); ctx.stroke();
        // Sode (shoulder plate)
        if (age >= 3) {
            ctx.strokeStyle = armorPrimary; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(2, 3, 0, 5); ctx.stroke();
            // Lacing lines
            ctx.strokeStyle = armorLacing; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(2, 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(2, 3); ctx.stroke();
        }
        // Kote (arm armor) — iron splints
        if (age >= 2) {
            ctx.strokeStyle = age >= 3 ? '#444' : '#555'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, 8);
            ctx.quadraticCurveTo(2, 10, 0, 13); ctx.stroke();
            // Splint lines
            ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(-1, 9); ctx.lineTo(-1, 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(1, 9); ctx.lineTo(1, 12); ctx.stroke();
        }
        // Tekko (hand guard)
        ctx.fillStyle = age >= 3 ? '#444' : skinColor;
        ctx.beginPath(); ctx.arc(0, 14, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = skinColor;
        ctx.beginPath(); ctx.arc(0, 14, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
        // Idle: rectangle arm with armor
        ctx.fillStyle = clothColor;
        ctx.fillRect(-2, 0, 4, 6);
        // Sode (Shoulder Plate)
        if (age >= 3) {
            ctx.fillStyle = armorPrimary;
            ctx.fillRect(-3, -1, 6, 7);
            ctx.fillStyle = armorLacing;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-3, 1 + i * 2, 6, 0.5);
            }
        }
        // Kote forearm armor
        if (age >= 2) {
            ctx.fillStyle = age >= 3 ? '#444' : '#555';
            ctx.fillRect(-2, 5, 4, 4);
            // Iron splints
            ctx.fillStyle = '#333';
            ctx.fillRect(-1.5, 5.5, 0.5, 3);
            ctx.fillRect(1, 5.5, 0.5, 3);
        } else {
            ctx.fillStyle = skinColor;
            ctx.fillRect(-1.5, 6, 3, 3);
        }
        // Hand
        ctx.fillStyle = skinColor;
        ctx.fillRect(-1.5, 8, 3, 2);
    }

    // Katana — hand at end of arm, sword extends from hand
    ctx.translate(0, attackState ? 14 : 10);

    // ── HANDLE (Tsuka) — extends below hand ──
    // Samegawa (Ray skin base)
    ctx.fillStyle = '#222';
    ctx.fillRect(-1.5, -3, 3, 10);
    // Ito wrapping (Silk cord)
    ctx.fillStyle = age >= 4 ? '#cc2222' : '#8a3333';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-1.5, -2 + i * 2, 3, 1);
    }
    // Menuki ornament
    if (age >= 3) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-0.5, 2, 1, 1);
    }

    // ── HAND gripping handle ──
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 1, 2.5, 0, Math.PI * 2); ctx.fill();

    // Kashira (pommel cap — bottom)
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#555';
    ctx.fillRect(-2, 7, 4, 2);

    // ── TSUBA (Guard) — above handle ──
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#555';
    ctx.beginPath();
    ctx.ellipse(0, -4, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(-1, -5, 2, 2);

    // Habaki (blade collar)
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#888';
    ctx.fillRect(-1.5, -7, 3, 2);

    // ── BLADE (Katana) ──
    const bladeColor = age >= 4 ? '#f0f0f0' : '#ddd';
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(-1.5, -7);
    ctx.lineTo(-1.5, -25);
    ctx.quadraticCurveTo(-1, -29, 1, -31);
    ctx.lineTo(2, -29);
    ctx.quadraticCurveTo(2.5, -21, 1.5, -7);
    ctx.closePath();
    ctx.fill();

    // Shinogi (Ridge line — divides flat from bevel)
    ctx.strokeStyle = age >= 4 ? '#ccc' : '#bbb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-0.5, -26);
    ctx.stroke();

    // Hamon (Temper line — wavy pattern along cutting edge)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(1.5, -6);
    ctx.quadraticCurveTo(3, -10, 1.5, -14);
    ctx.quadraticCurveTo(3, -18, 1.5, -22);
    ctx.quadraticCurveTo(2, -26, 0.5, -28);
    ctx.lineTo(0, -26);
    ctx.quadraticCurveTo(1.5, -22, 0.5, -18);
    ctx.quadraticCurveTo(1.5, -14, 0.5, -10);
    ctx.lineTo(0.5, -6);
    ctx.closePath();
    ctx.fill();

    // Cutting edge highlight (Ha)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(1.5, -7);
    ctx.quadraticCurveTo(2.5, -18, 1.5, -27);
    ctx.lineTo(1, -27);
    ctx.quadraticCurveTo(2, -18, 1, -7);
    ctx.closePath();
    ctx.fill();

    // Kissaki tip highlight
    if (age >= 4) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.quadraticCurveTo(-0.5, -29, 1, -30);
        ctx.lineTo(2, -28);
        ctx.closePath();
        ctx.fill();
    }

    // Attack swing trail — wider arc, brighter
    if (attackState && attackProgress > 0.25 && attackProgress < 0.6) {
        const trailAlpha = attackProgress < 0.45 ? 0.5 : 0.5 * (1 - (attackProgress - 0.45) / 0.15);
        // Wide white slash arc
        ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha})`;
        ctx.beginPath();
        ctx.moveTo(1, -6);
        ctx.quadraticCurveTo(16, -16, 2, -30);
        ctx.lineTo(-1, -28);
        ctx.quadraticCurveTo(12, -16, -1, -6);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(1, -8);
        ctx.quadraticCurveTo(10, -16, 1, -26);
        ctx.lineTo(0, -24);
        ctx.quadraticCurveTo(8, -16, 0, -8);
        ctx.fill();
    }

    ctx.restore();

    // ── LEFT ARM (two-handed katana grip — curves to meet handle) ──
    {
        const rShX = 6, rShY = -3 + bob;
        const handleDist = 10 + (attackState ? 0 : 0);
        const handleX = rShX + Math.cos(armRot + Math.PI / 2) * handleDist;
        const handleY = rShY + Math.sin(armRot + Math.PI / 2) * handleDist;
        const leftShoulderX = -5, leftShoulderY = -2 + bob;
        const cpX = (leftShoulderX + handleX) * 0.5 + 4;
        const cpY = (leftShoulderY + handleY) * 0.5 + 4;
        ctx.save();
        ctx.lineCap = 'round';
        // Upper arm (cloth sleeve)
        ctx.strokeStyle = clothColor; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.quadraticCurveTo(cpX, cpY, handleX, handleY); ctx.stroke();
        // Sode armor overlay on upper part
        if (age >= 3) {
            ctx.strokeStyle = armorPrimary; ctx.lineWidth = 4;
            const midX = (leftShoulderX + cpX) * 0.5;
            const midY = (leftShoulderY + cpY) * 0.5;
            ctx.beginPath(); ctx.moveTo(leftShoulderX, leftShoulderY);
            ctx.lineTo(midX, midY); ctx.stroke();
        }
        // Forearm
        ctx.strokeStyle = skinColor; ctx.lineWidth = 3.5;
        const fmX = (cpX + handleX) * 0.5, fmY = (cpY + handleY) * 0.5;
        ctx.beginPath(); ctx.moveTo(fmX, fmY);
        ctx.lineTo(handleX, handleY); ctx.stroke();
        // Fist gripping handle
        ctx.fillStyle = skinColor;
        ctx.beginPath(); ctx.arc(handleX, handleY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (YAMATO) - Yari Ashigaru (Long Spear)
// ============================================================
export function drawSpears_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();

    // Attack animation parameters (Two-handed Thrust)
    let attackProgress = 0;
    if (unit.state === UnitState.Attacking && isInAttackRange) {
        const attackCycle = unit.attackAnimTimer % unit.civAttackSpeed;
        // Make the entire animation take 95% of the cooldown so it feels more deliberate
        const attackDuration = unit.civAttackSpeed * 0.95;
        if (attackCycle < attackDuration) {
            attackProgress = attackCycle / attackDuration;
        }
    }

    // Realistic Straight-Line Spear Thrust Animation
    let bodyRot = 0;
    let spearAngle = 0;
    let spearOffset = { x: 0, y: 0 };
    let rightArmRot = 0;
    let leftArmRot = 0;
    let leftElbowBend = -Math.PI / 2;
    let rightElbowBend = 0;
    if (attackProgress > 0) {
        if (attackProgress < 0.4) {
            // Windup: coil back, left arm bends more, right arm pulls back
            const t = attackProgress / 0.4;
            const ease = t * t * (3 - 2 * t);
            bodyRot = ease * -0.2;
            spearOffset.x = ease * -14;
            spearOffset.y = ease * -2;
            spearAngle = ease * 0.05;
            rightArmRot = ease * 0.3;
            leftArmRot = ease * 0.15;
            leftElbowBend = -Math.PI / 2 + ease * 0.3; // Bend tighter
            rightElbowBend = ease * -0.2;
        } else if (attackProgress < 0.6) {
            // Strike: explosive forward, arms extend
            const t = (attackProgress - 0.4) / 0.2;
            const easeOut = 1 - Math.pow(1 - t, 4);
            bodyRot = -0.2 + easeOut * 0.35;
            spearOffset.x = -14 + easeOut * 32;
            spearOffset.y = -2 + easeOut * 2;
            spearAngle = 0.05 - easeOut * 0.05;
            rightArmRot = 0.3 - easeOut * 0.9;
            leftArmRot = 0.15 - easeOut * 0.5;
            leftElbowBend = (-Math.PI / 2 + 0.3) - easeOut * 0.8; // Straighten out
            rightElbowBend = -0.2 - easeOut * 0.3;
        } else if (attackProgress < 0.75) {
            // Impact/Hold
            const t = (attackProgress - 0.6) / 0.15;
            bodyRot = 0.15 + t * 0.02;
            spearOffset.x = 18 + t * 2;
            spearAngle = 0;
            rightArmRot = -0.6 + t * 0.05;
            leftArmRot = -0.35;
            leftElbowBend = -Math.PI / 2 - 0.5; // Extended
            rightElbowBend = -0.5;
        } else {
            // Recovery: return to L-shape
            const t = (attackProgress - 0.75) / 0.25;
            const easeIn = t * t * t;
            bodyRot = 0.17 * (1 - easeIn);
            spearOffset.x = 20 * (1 - easeIn);
            spearAngle = 0;
            rightArmRot = -0.55 * (1 - easeIn);
            leftArmRot = -0.35 * (1 - easeIn);
            leftElbowBend = (-Math.PI / 2 - 0.5) + easeIn * 0.5; // Back to L
            rightElbowBend = -0.5 * (1 - easeIn);
        }
    } else {
        const breath = Math.sin(unit.animTimer * 2) * 0.02;
        bodyRot = breath;
        spearAngle = breath * 0.5;
        leftArmRot = 0.1;
        rightArmRot = 0.1;
        leftElbowBend = -Math.PI / 2;
        rightElbowBend = 0;
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const armorDark = age >= 3 ? cv.bodyDark : cv.bodyMid; // Okegawa Do lacquer -> player color
    const armorLace = '#cc3333'; // Red lacing
    const clothColor = age >= 4 ? '#222' : '#333'; // Underclothes



    // ── LEGS ──
    // Hakama / Leggings (Kyahan)
    ctx.fillStyle = '#333';
    ctx.fillRect(-5, 6, 4, 6 + legOff);
    ctx.fillRect(1, 6, 4, 6 - legOff);

    // Straw sandals (Waraji) & Kyahan wrapping
    ctx.fillStyle = '#444'; // Wrap
    ctx.fillRect(-5.5, 8 + Math.max(0, legOff), 5, 4);
    ctx.fillRect(0.5, 8 + Math.max(0, -legOff), 5, 4);

    ctx.fillStyle = '#dcb67a'; // Straw
    ctx.fillRect(-5, 12 + legOff, 4, 1);
    ctx.fillRect(1, 12 - legOff, 4, 1);


    // ── BODY (Do) ──
    ctx.fillStyle = clothColor;
    ctx.fillRect(-5, -6 + bob, 10, 14);

    // Ashigaru Okegawa Do (Simple cuirass)
    ctx.fillStyle = armorDark;
    ctx.fillRect(-5.5, -5 + bob, 11, 11);

    // Horizontal ridges or lacing
    if (age >= 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 4; i++) ctx.fillRect(-5, -3 + bob + i * 2.5, 10, 1);
    }

    // Clan Mon on chest
    if (age >= 2) {
        ctx.fillStyle = '#ffd700'; // Gold circle
        ctx.beginPath(); ctx.arc(0, -1 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = cv.accent; // Inner color
        ctx.beginPath(); ctx.arc(0, -1 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // Kusazuri (Tassets)
    ctx.fillStyle = armorDark;
    ctx.fillRect(-6, 6 + bob, 3, 4);
    ctx.fillRect(-1.5, 6 + bob, 3, 4);
    ctx.fillRect(3, 6 + bob, 3, 4);

    ctx.fillStyle = armorLace;
    ctx.fillRect(-6, 7 + bob, 3, 0.5); ctx.fillRect(-6, 9 + bob, 3, 0.5);
    ctx.fillRect(-1.5, 7 + bob, 3, 0.5); ctx.fillRect(-1.5, 9 + bob, 3, 0.5);
    ctx.fillRect(3, 7 + bob, 3, 0.5); ctx.fillRect(3, 9 + bob, 3, 0.5);


    // ── HEAD & JINGASA ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -13 + bob, 6, 8); // Neck/Head

    // Head gear
    if (age >= 3) {
        // Higher tier gets a simple Kabuto
        ctx.fillStyle = armorDark;
        ctx.beginPath(); ctx.arc(0, -12 + bob, 4.5, Math.PI, 0); ctx.fill(); // Dome
        ctx.fillRect(-6, -12 + bob, 12, 1); // Rim
        ctx.fillStyle = armorDark; // Shikoro (neck guard)
        ctx.fillRect(-5, -11 + bob, 10, 3);
        ctx.fillStyle = armorLace;
        ctx.fillRect(-5, -9 + bob, 10, 0.5);
    } else {
        // Jingasa (Flat conical hat)
        ctx.fillStyle = armorDark;
        ctx.beginPath();
        ctx.moveTo(-7, -11 + bob);
        ctx.lineTo(7, -11 + bob);
        ctx.lineTo(0, -16 + bob);
        ctx.fill();

        if (age >= 2) {
            // Gold clan mon on hat
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(0, -13 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }


    // ── SASHIMONO (Back Banner) ──
    // Spearmen, especially Ashigaru, famously wore these to identify formations.
    if (age >= 2) {
        ctx.save();
        ctx.translate(0, -5 + bob); // Attach to upper back

        // Bamboo pole
        ctx.fillStyle = '#222';
        ctx.fillRect(-8, -20, 1, 26);

        // Banner wind animation
        const wave = Math.sin(unit.animTimer * 5) * 2;

        ctx.fillStyle = cv.accent;
        ctx.fillRect(-7, -19, 8 + wave * 0.3, 15);

        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.5;
        ctx.strokeRect(-7, -19, 8 + wave * 0.3, 15);

        // White Clan Mon on banner
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-3 + wave * 0.15, -14, 2, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }


    // ── LEFT ARM (L-shape) — drawn on top of body ──
    ctx.save();
    ctx.translate(-5, -5 + bob);
    ctx.rotate(0.8 + leftArmRot);
    ctx.fillStyle = clothColor;
    ctx.fillRect(-2, 0, 4, 3);
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, 3, 4, 3);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 4, 5, 4);
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(5, 6, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── RIGHT ARM (straight down to spear) — drawn on top of body ──
    ctx.save();
    ctx.translate(6, -5 + bob);
    ctx.rotate(-0.5 + rightArmRot);
    ctx.fillStyle = clothColor;
    ctx.fillRect(-1.5, 0, 3, 4);
    ctx.fillStyle = '#222';
    ctx.fillRect(-1.5, 4, 3, 5);
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── SPEAR (Yari) — drawn on top of body ──
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    ctx.translate(0, 4 + bob);
    ctx.rotate(spearAngle);
    ctx.fillStyle = '#1a1a2a';
    const poleLength = age >= 3 ? 42 : 36;
    ctx.fillRect(-poleLength * 0.3, -1, poleLength, 2);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(-poleLength * 0.3, -1.5, 2, 3);
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.moveTo(-poleLength * 0.3, -1); ctx.lineTo(-poleLength * 0.3 - 4, 0); ctx.lineTo(-poleLength * 0.3, 1); ctx.fill();
    const shaftEnd = poleLength * 0.7;
    if (age >= 3) { ctx.fillStyle = '#cc2222'; ctx.fillRect(shaftEnd - 4, -1.5, 6, 3); ctx.fillStyle = '#888'; ctx.fillRect(shaftEnd - 3, -1.5, 1, 3); ctx.fillRect(shaftEnd - 1, -1.5, 1, 3); }
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#cccccc';
    const bladeLen = age >= 3 ? 12 : 9;
    ctx.beginPath(); ctx.moveTo(shaftEnd + 2, 0); ctx.lineTo(shaftEnd + 4, -2); ctx.lineTo(shaftEnd + 2 + bladeLen, 0); ctx.lineTo(shaftEnd + 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(shaftEnd + 3, -0.5, bladeLen - 3, 1);
    ctx.restore();

    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore();
}

// ============================================================
//  DRAW ARCHER (YAMATO) - Yumi Archer (Samurai / Ashigaru)
// ============================================================
export function drawArchers_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();

    let isAttacking = unit.state === UnitState.Attacking && isInAttackRange;

    let pullback = 0; // 0 to 1
    let bowAngle = 0;

    if (isAttacking) {
        // Attack Cooldown goes from civAttackSpeed down to 0
        const maxCd = unit.civAttackSpeed;
        const currentCd = unit.attackCooldown;
        const pullPhase = 1 - (currentCd / maxCd);

        // Japanese archery (Kyūdō) has a very distinct, deliberate draw
        if (pullPhase > 0.2 && pullPhase < 0.9) {
            pullback = (pullPhase - 0.2) / 0.7;
        } else if (pullPhase >= 0.9) {
            pullback = 1;
        } else {
            pullback = 0;
        }
    }

    let bodyRot = 0;
    if (isAttacking) {
        bodyRot = -0.15 + pullback * 0.15; // Turn slightly sideway to draw
        bowAngle = -0.05 + pullback * 0.05;
    } else {
        bodyRot = Math.sin(unit.animTimer * 2) * 0.05;
        bowAngle = 0.1;
    }

    ctx.rotate(bodyRot);

    // Colors — elegant, restrained palette
    const skinColor = cv.skinColor;
    const kimonoColor = age >= 3 ? '#1a1a2e' : '#2b2b3b'; // Deep indigo
    const hakamaColor = age >= 3 ? '#1e1e2e' : '#2a2a3a';
    const armorColor = age >= 4 ? cv.bodyDark : cv.bodyMid;
    const lacquerAccent = '#cc3333'; // Crimson accent
    const goldTrim = '#daa520';

    // ── QUIVER (Utsubo — slim lacquered tube) ──
    ctx.save();
    ctx.translate(-6, 0 + bob);
    ctx.rotate(0.2);
    ctx.fillStyle = age >= 3 ? '#2a1a08' : '#3a2a10';
    ctx.fillRect(-2, -2, 4, 10);
    if (age >= 3) {
        ctx.fillStyle = goldTrim;
        ctx.fillRect(-2, -2, 4, 1);
        ctx.fillRect(-2, 7, 4, 1);
    }
    // Arrows peeking out
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -5, 0.8, 4);
    ctx.fillRect(0.5, -4, 0.8, 3);
    ctx.fillStyle = '#e8d898';
    ctx.fillRect(-0.8, -1, 0.5, 4);
    ctx.fillRect(0.7, 0, 0.5, 3);
    ctx.restore();

    // ── LEGS (Hakama) ──
    ctx.fillStyle = hakamaColor;
    ctx.beginPath(); ctx.moveTo(-5, 4 + bob); ctx.lineTo(-7, 11 + legOff); ctx.lineTo(-1, 11 + legOff); ctx.lineTo(-2, 4 + bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, 4 + bob); ctx.lineTo(-1, 11 - legOff); ctx.lineTo(6, 11 - legOff); ctx.lineTo(4, 4 + bob); ctx.fill();
    // Subtle pleat highlights
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(-4, 5 + bob, 0.5, 6 + legOff);
    ctx.fillRect(2, 5 + bob, 0.5, 6 - legOff);

    // Kyahan wraps (age 2+)
    if (age >= 2) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-6, 9 + legOff, 4, 2);
        ctx.fillRect(0, 9 - legOff, 4, 2);
    }

    // Tabi + Waraji
    ctx.fillStyle = '#eee';
    ctx.fillRect(-6, 11 + legOff, 4, 2);
    ctx.fillRect(0, 11 - legOff, 4, 2);
    ctx.fillStyle = '#c4a860';
    ctx.fillRect(-6.5, 12.5 + legOff, 5, 1);
    ctx.fillRect(-0.5, 12.5 - legOff, 5, 1);

    // ── BODY (Kimono + light Karuta armor) ──
    ctx.fillStyle = kimonoColor;
    ctx.fillRect(-5, -4 + bob, 10, 11);

    // Juban collar (white V-neck)
    ctx.fillStyle = '#eee';
    ctx.beginPath(); ctx.moveTo(-3, -4 + bob); ctx.lineTo(0, 0 + bob); ctx.lineTo(3, -4 + bob); ctx.fill();

    if (age >= 2) {
        // Light Karuta chest piece (slim, doesn't extend to shoulders)
        ctx.fillStyle = armorColor;
        ctx.fillRect(-4, -3 + bob, 8, 7);
        // Odoshi lacing (thin crimson threads)
        ctx.fillStyle = lacquerAccent;
        ctx.fillRect(-4, -1.5 + bob, 8, 0.5);
        ctx.fillRect(-4, 1 + bob, 8, 0.5);
        ctx.fillRect(-4, 3.5 + bob, 8, 0.5);
    }

    // Tasuki cord (cross-body cord to tie back sleeves for archery)
    if (age >= 3) {
        ctx.strokeStyle = lacquerAccent;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-4, -3 + bob); ctx.lineTo(4, 3 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, -3 + bob); ctx.lineTo(-4, 3 + bob);
        ctx.stroke();
    }

    // Obi sash
    ctx.fillStyle = age >= 3 ? '#993333' : '#553333';
    ctx.fillRect(-5, 4 + bob, 10, 2);
    if (age >= 3) {
        ctx.fillStyle = goldTrim;
        ctx.fillRect(-1, 4 + bob, 2, 2);
    }

    // ── HEAD ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -11 + bob, 6, 7);
    // Eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(-1.5, -8 + bob, 1, 1);
    ctx.fillRect(0.5, -8 + bob, 1, 1);
    // Hair
    ctx.fillStyle = '#111';
    ctx.fillRect(-3, -12 + bob, 6, 2);

    if (age >= 3) {
        // Toppai-gata Jingasa (Peaked war hat — elegant pointed shape)
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.moveTo(-6, -10 + bob);    // Left base
        ctx.lineTo(0, -17 + bob);      // Peak
        ctx.lineTo(6, -10 + bob);      // Right base
        ctx.closePath();
        ctx.fill();
        // Gold trim on brim edge
        ctx.strokeStyle = goldTrim; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-6.5, -10 + bob); ctx.lineTo(6.5, -10 + bob);
        ctx.stroke();

        if (age >= 4) {
            // Maedate crest (small gold ornament on front)
            ctx.fillStyle = goldTrim;
            ctx.beginPath();
            ctx.moveTo(0, -17 + bob);
            ctx.lineTo(-1.5, -19 + bob);
            ctx.lineTo(0, -18.5 + bob);
            ctx.lineTo(1.5, -19 + bob);
            ctx.closePath();
            ctx.fill();
        }
    } else {
        // Straw Kasa
        ctx.fillStyle = '#d4b872';
        ctx.beginPath(); ctx.moveTo(-8, -10 + bob); ctx.lineTo(0, -15 + bob); ctx.lineTo(8, -10 + bob); ctx.fill();
        ctx.strokeStyle = '#a68b4b'; ctx.lineWidth = 0.4;
        for (let i = -5; i <= 5; i += 3) {
            ctx.beginPath(); ctx.moveTo(0, -15 + bob); ctx.lineTo(i, -10 + bob); ctx.stroke();
        }
    }

    // Hachimaki headband
    ctx.fillStyle = '#fff';
    ctx.fillRect(-3.5, -8 + bob, 7, 1.2);
    ctx.fillStyle = lacquerAccent;
    ctx.beginPath(); ctx.arc(0, -7.4 + bob, 0.8, 0, Math.PI * 2); ctx.fill();

    // ── FRONT ARM (Right — holding Yumi) — drawn FIRST (behind back arm) ──
    ctx.save();
    let bowArmRot = 0;
    if (isAttacking) {
        bowArmRot = -Math.PI / 2 + 0.2;
    } else {
        bowArmRot = -Math.PI / 3;
    }

    ctx.translate(3, -3 + bob);
    ctx.rotate(bowArmRot);

    // Sleeve
    ctx.fillStyle = kimonoColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Kote forearm guard
    if (age >= 2) {
        ctx.fillStyle = age >= 3 ? armorColor : '#3a3a3a';
        ctx.fillRect(-1.5, 5, 3, 4);
        ctx.fillStyle = lacquerAccent;
        ctx.fillRect(-1.5, 7, 3, 0.4);
    }

    // ── YUMI BOW (Asymmetric longbow) ──
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(-bowArmRot + bowAngle);

    const gripY = 0;
    const bowTopY = gripY - 18;
    const bowBotY = gripY + 10;

    const bowColor = age >= 4 ? '#111' : '#8a5a2a';

    // Main bow — single continuous curve
    ctx.strokeStyle = bowColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, bowTopY);
    ctx.quadraticCurveTo(6, gripY - 8, 0, gripY);
    ctx.quadraticCurveTo(4, gripY + 5, 0, bowBotY);
    ctx.stroke();

    // 3D highlight (inner edge)
    ctx.strokeStyle = age >= 4 ? '#444' : '#b8884a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-0.5, bowTopY + 1);
    ctx.quadraticCurveTo(5, gripY - 8, -0.5, gripY);
    ctx.quadraticCurveTo(3, gripY + 5, -0.5, bowBotY - 1);
    ctx.stroke();

    // Grip wrapping (Nigiri)
    ctx.fillStyle = lacquerAccent;
    ctx.fillRect(-1.5, gripY - 2, 3, 4);
    ctx.fillStyle = '#222';
    ctx.fillRect(-0.5, gripY - 1, 1, 0.5);
    ctx.fillRect(-0.5, gripY + 1, 1, 0.5);

    // Nock tips
    ctx.fillStyle = '#eee';
    ctx.fillRect(-1, bowTopY, 2, 1.5);
    ctx.fillRect(-1, bowBotY - 1, 2, 1.5);

    // ── BOWSTRING & ARROW ──
    const stringTopX = 1;
    const stringBotX = 0.5;

    const maxPullDist = 13;
    const stringMidX = stringTopX - pullback * maxPullDist;
    const stringMidY = gripY - 1; // Arrow nocked at the grip (center of bow)

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(stringTopX, bowTopY);
    ctx.lineTo(stringMidX, stringMidY);
    ctx.lineTo(stringBotX, bowBotY);
    ctx.stroke();

    // Arrow (Ya)
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        const arrowLen = 16;

        ctx.save();
        ctx.translate(stringMidX, stringMidY);
        ctx.rotate(0.05 * (1 - pullback));

        ctx.fillStyle = '#e8d898';
        ctx.fillRect(0, -0.5, arrowLen, 1);
        ctx.fillStyle = '#c8b878';
        ctx.fillRect(5, -0.5, 0.4, 1);
        ctx.fillRect(10, -0.5, 0.4, 1);

        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(arrowLen, -1.5);
        ctx.lineTo(arrowLen + 4, 0);
        ctx.lineTo(arrowLen, 1.5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -1.5); ctx.lineTo(3, -0.8); ctx.lineTo(3, -0.5); ctx.lineTo(0, -0.5); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 1.5); ctx.lineTo(3, 0.8); ctx.lineTo(3, 0.5); ctx.lineTo(0, 0.5); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.fillRect(1, -1.5, 0.4, 1);
        ctx.fillRect(1, 0.5, 0.4, 1);

        ctx.restore();
    }

    ctx.restore(); // End bow context

    // Hand gripping the bow grip (on top of Nigiri)
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 10, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End Front Arm

    // ── BACK ARM (Left — string draw) — drawn LAST (on top of everything) ──
    ctx.save();
    ctx.translate(-4, -3 + bob);

    let shoulderRot = 0;
    let elbowBend = 0;
    if (isAttacking) {
        // Shoulder rotates toward bow grip, stays at chest level
        shoulderRot = 0.0 - pullback * 0.4;
        elbowBend = -Math.PI / 4 - pullback * (Math.PI / 2.5);
    } else {
        // Idle: arm hangs slightly forward toward the bow
        shoulderRot = 0.1;
        elbowBend = -Math.PI / 5;
    }
    ctx.rotate(shoulderRot);

    // Upper arm (shoulder to elbow) — with Kote armor
    ctx.fillStyle = kimonoColor;
    ctx.fillRect(-2, 0, 4, 5);
    if (age >= 2) {
        ctx.fillStyle = age >= 3 ? armorColor : '#3a3a3a';
        ctx.fillRect(-2, 1, 4, 3);
        ctx.fillStyle = lacquerAccent;
        ctx.fillRect(-2, 2.5, 4, 0.5);
    }

    // Elbow → forearm
    ctx.save();
    ctx.translate(0, 5);
    ctx.rotate(elbowBend);

    // Forearm with Kote guard
    if (age >= 2) {
        ctx.fillStyle = age >= 3 ? armorColor : '#3a3a3a';
        ctx.fillRect(-1.5, 0, 3, 4);
        ctx.fillStyle = lacquerAccent;
        ctx.fillRect(-1.5, 1.5, 3, 0.5);
    } else {
        ctx.fillStyle = kimonoColor;
        ctx.fillRect(-1.5, 0, 3, 4);
    }
    // Yugake glove
    ctx.fillStyle = '#d4b090';
    ctx.fillRect(-1.5, 4, 3, 2);
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 7, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End forearm
    ctx.restore(); // End back arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Yamato Archer context
}

// ============================================================
//  DRAW KNIGHT (YAMATO) - Samurai Cavalry
// ============================================================
export function drawKnight_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors, isInAttackRange: boolean = false): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking && isInAttackRange;
    let attackProgress = 0;
    if (isAttacking) {
        const pullPhase = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        attackProgress = Math.max(0, Math.min(1, pullPhase));
    }

    // Ngựa Yamato (Dark Bay / Kiso horse)
    const horseColor = age >= 4 ? '#4a2a18' : '#5a3020';
    const horseDark = age >= 4 ? '#2a1a10' : '#3a2018';

    const hx = -2;
    const hy = 18 + bob;

    const legBob = moving ? Math.sin(unit.animTimer * 18) * 5 : 0;

    // ── HORSE (NGỰA) ──
    ctx.save();
    ctx.translate(hx, hy);

    const rearing = isAttacking && attackProgress < 0.6 ? -0.15 : 0;
    ctx.rotate(rearing);
    ctx.translate(0, rearing ? -4 : 0);

    // Chân sau
    ctx.fillStyle = horseDark;
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-12 - legBob, 6); ctx.lineTo(-8 - legBob, 8); ctx.lineTo(-5, -8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(10 + legBob * 0.5, 8); ctx.lineTo(14 + legBob * 0.5, 8); ctx.lineTo(12, -8); ctx.fill();

    // Đuôi ngựa
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-18, -14); ctx.quadraticCurveTo(-30 - legBob, -10, -26 - legBob, 6); ctx.quadraticCurveTo(-20, -2, -16, -14); ctx.fill();

    // Thân ngựa
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.quadraticCurveTo(-8, -18, 14, -18);
    ctx.quadraticCurveTo(24, -18, 24, -8);
    ctx.quadraticCurveTo(12, 6, -12, 4);
    ctx.quadraticCurveTo(-24, 4, -18, -12);
    ctx.fill();

    // Bóng khối 
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.moveTo(24, -8); ctx.quadraticCurveTo(12, 6, -12, 4); ctx.quadraticCurveTo(-8, 0, 18, -12); ctx.fill();

    // Cổ và Đầu
    ctx.beginPath();
    ctx.moveTo(14, -15);
    ctx.quadraticCurveTo(20, -26, 18, -34);
    ctx.lineTo(24, -32);
    ctx.lineTo(30, -20);
    ctx.lineTo(22, -10);
    ctx.fill();

    // Bờm ngựa
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(14, -15); ctx.lineTo(18, -34); ctx.lineTo(14, -32); ctx.quadraticCurveTo(8, -20, 14, -15); ctx.fill();

    // ── GIÁP NGỰA (YAMATO UMAYOROI) ──
    if (age >= 3) {
        // Yên cương & Tấm lót da đen viền đỏ
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(12, -4); ctx.lineTo(-14, -4); ctx.fill();
        ctx.strokeStyle = '#cc3333'; ctx.lineWidth = 1; ctx.stroke();

        if (age >= 4) {
            // Giáp Umayoroi
            ctx.fillStyle = '#1a1a2a'; // Deep indigo 
            ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(18, -14); ctx.lineTo(14, 0); ctx.lineTo(-18, 0); ctx.fill();

            // Lacing (Odoshi) - Chỉ buộc đỏ
            ctx.fillStyle = '#cc3333';
            for (let r = 0; r < 4; r++) {
                ctx.fillRect(-18, -14 + r * 3.5, 34 - r * 2, 1);
            }

            // Giáp cổ 
            ctx.fillStyle = '#1a1a2a';
            ctx.beginPath(); ctx.moveTo(14, -18); ctx.lineTo(18, -32); ctx.lineTo(22, -18); ctx.fill();
            ctx.fillStyle = '#cc3333'; ctx.fillRect(16, -26, 4, 1); ctx.fillRect(15, -22, 5, 1);

            // Mặt nạ rồng (Bamen)
            ctx.fillStyle = cv.bodyDark;
            ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(30, -20); ctx.lineTo(26, -30); ctx.fill();
            ctx.fillStyle = '#ffd700'; ctx.fillRect(26, -30, 1, 3); // Sừng vàng
        }
    }

    // Chân trước
    ctx.fillStyle = horseColor;
    const stompLift = (isAttacking && attackProgress > 0.1 && attackProgress < 0.8) ? -8 : 0;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 + legBob, 10); ctx.lineTo(-8 + legBob, 12); ctx.lineTo(-6, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(14 - legBob, 12 + stompLift); ctx.lineTo(18 - legBob, 12 + stompLift); ctx.lineTo(18, -6); ctx.fill();

    // Dây cương
    ctx.strokeStyle = '#cc3333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(20, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(12, -14); ctx.stroke();

    ctx.restore(); // END HORSE

    // ── RIDER (SAMURAI) ──
    const riderY = hy - 20;
    ctx.save();
    ctx.translate(hx, riderY);
    ctx.rotate(rearing * 0.8);

    // Horō (Cloak/Balloon on back to catch arrows)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid;
        const capeWave = moving ? Math.sin(unit.animTimer * 15) * 4 : 0;
        ctx.beginPath();
        ctx.arc(-8, 6, 8, Math.PI * 1.2, Math.PI * 0.8, true);
        ctx.quadraticCurveTo(-15 + capeWave, 20, -8, 20);
        ctx.fill();
        ctx.strokeStyle = cv.accent; ctx.lineWidth = 1; ctx.stroke();
    } else if (age >= 2) {
        ctx.fillStyle = cv.bodyMid;
        ctx.fillRect(-6, 4, 3, 12);
    }

    // Tay phải (cầm cương)
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.skinColor;
    ctx.fillRect(-6, 4, 4, 10);

    // Thân người (O-yoroi Armor)
    ctx.fillStyle = age >= 3 ? cv.bodyDark : cv.bodyMid;
    ctx.fillRect(-5, 0, 10, 14);

    if (age >= 4) {
        ctx.fillStyle = cv.accent; // Odoshi chest lacing
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-4, 2 + i * 3, 8, 1);
        }
        // Kusazuri (Tassets)
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-6, 12, 12, 6);
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-6, 13, 12, 1); ctx.fillRect(-6, 16, 12, 1);
    }

    // Chân (Hakama & Suneate)
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, 14, 6, 8);
    if (age >= 3) {
        ctx.fillStyle = '#c9a84c'; // Suneate (shin guards)
        ctx.fillRect(0, 16, 4, 5);
        ctx.fillStyle = '#111'; // Waraji (sandals)
        ctx.fillRect(-2, 22, 5, 2);
    } else {
        ctx.fillStyle = '#4a2a10';
        ctx.fillRect(-2, 20, 6, 4);
    }

    // Đầu
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -6, 6, 6);

    // Mũ bảo hiểm (Kabuto)
    ctx.fillStyle = age >= 4 ? '#1a1a2a' : '#2a2a3a';
    ctx.beginPath(); ctx.arc(0, -6, 5, Math.PI, 0); ctx.fill(); // Dome
    // Shikoro (neck guard)
    ctx.fillRect(-6, -6, 12, 4);
    if (age >= 3) {
        ctx.fillStyle = '#cc3333'; ctx.fillRect(-6, -5, 12, 1); ctx.fillRect(-6, -3, 12, 1);
    }
    if (age >= 4) {
        // Maedate (Vàng)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-3, -7); ctx.lineTo(3, -7); ctx.fill();
    }

    // Tay trái (cầm Naginata or Yari)
    ctx.save();
    let armRot = 0;
    if (isAttacking) {
        if (attackProgress < 0.4) {
            // Vung kiếm/giáo ra sau
            armRot = -Math.PI / 2 + (attackProgress * 2);
        } else {
            // Chém mạnh xuống
            armRot = Math.PI / 3;
        }
    } else {
        armRot = moving ? Math.PI / 8 + Math.sin(unit.animTimer * 18) * 0.1 : Math.PI / 6;
    }

    ctx.translate(2, 2);
    ctx.rotate(armRot);

    // Sode (Giáp vai lớn hình chữ nhật đặc trưng Nhật)
    if (age >= 3) {
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-3, -2, 6, 8);
        ctx.fillStyle = cv.accent;
        ctx.fillRect(-3, 0, 6, 1); ctx.fillRect(-3, 3, 6, 1); ctx.fillRect(-3, 6, 6, 1);
    } else {
        ctx.fillStyle = cv.bodyMid; ctx.fillRect(-3, -2, 6, 4);
    }

    // Cánh tay
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-2, 0, 4, 12);

    // Vũ khí (Naginata - Thanh đao dài)
    ctx.translate(0, 10);
    ctx.fillStyle = '#3a1a05'; // Cán gỗ đen đỏ
    ctx.fillRect(-1.5, -16, 3, 32);
    if (age >= 3) {
        ctx.fillStyle = '#daa520'; ctx.fillRect(-2, 14, 4, 3); // Tsuba (chắn tay) của Naginata

        // Lưỡi đao cong sắc bén chém xuống
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath();
        ctx.moveTo(-1, 17);
        ctx.lineTo(-3, 32);
        ctx.lineTo(2, 34);
        ctx.quadraticCurveTo(0, 24, 1, 17);
        ctx.fill();
        ctx.fillStyle = '#dddddd';
        ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(2, 34); ctx.quadraticCurveTo(0, 24, 1, 17); ctx.fill();
    } else {
        // Yari đơn giản
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(-2, 16); ctx.lineTo(2, 16); ctx.lineTo(0, 24); ctx.fill();
    }

    ctx.restore(); // END Tay trái

    ctx.restore(); // END RIDER

    drawKnightsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // END MAIN KNIGHT
}
