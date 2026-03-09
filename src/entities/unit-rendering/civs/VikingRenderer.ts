// ============================================================
//  Viking (Norse) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";

// ======== VIKING SCOUT — Berserker Scout with dual axes ========
export function drawScout_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Wolf pelt cape (behind body) - Massive and shaggy
    if (age >= 2) {
        ctx.fillStyle = '#4a3a2a'; // Darker base fur
        const capeWave = moving ? Math.sin(unit.animTimer * 12) * 3 : Math.sin(unit.animTimer * 3) * 1;
        ctx.fillRect(-10, -4 + bob, 6, 16 + capeWave);
        // Lớp lông sáng hơn đan xen
        ctx.fillStyle = '#6a5a3a';
        ctx.fillRect(-11, -2 + bob, 3, 12 + capeWave * 0.8);
        ctx.fillRect(-7, 2 + bob, 2, 10 + capeWave * 1.2);
    }

    // Muscular bare chest / Leather harness for Berserker feel (Age 1 & 2) or Chainmail (Age 3+)
    if (age >= 3) {
        // Heavy Chainmail over tunic
        ctx.fillStyle = cv.bodyDark;
        ctx.fillRect(-7, -4 + bob, 14, 13);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 4; i++) ctx.fillRect(-6, -2 + bob + i * 3, 12, 1); // Chain links
    } else {
        // Bare chest with leather straps
        ctx.fillStyle = cv.skinColor;
        ctx.fillRect(-7, -4 + bob, 14, 13);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; // Pecs/Abs shadow
        ctx.fillRect(-6, 0 + bob, 12, 1);
        ctx.fillRect(-1, 0 + bob, 2, 8);
    }

    // Heavy Fur Mantle over shoulders
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(-9, -6 + bob, 18, 5);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(-8, -5 + bob, 16, 2); // Fur texture

    // Broad Leather belt with iron buckle and pouches
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-7, 6 + bob, 14, 3);
    ctx.fillStyle = '#999'; // Iron buckle
    ctx.fillRect(-2, 5.5 + bob, 4, 4);
    // Pouch
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(4, 7 + bob, 4, 4);
    ctx.fillRect(4.5, 9 + bob, 3, 2);

    // War paint marks on body (age 3+) — civ accent
    if (age >= 3) {
        ctx.fillStyle = cv.accent + '44';
        ctx.fillRect(-3, -2 + bob, 2, 5);
        ctx.fillRect(1, -2 + bob, 2, 5);
        if (age >= 4) {
            // Extra war paint patterns
            ctx.fillStyle = cv.accent + '33';
            ctx.fillRect(-5, 1 + bob, 1, 4);
            ctx.fillRect(4, 1 + bob, 1, 4);
        }
    }
    // Bone necklace (age 4)
    if (age >= 4) {
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(-3, -4 + bob, 6, 1);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -4 + bob, 1, 1);
        ctx.fillRect(1, -4 + bob, 1, 1);
    }

    // Head — broader, fiercer
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -13 + bob, 8, 9);

    // Fierce glowing eyes in rage or normal eyes
    ctx.fillStyle = (moving || age >= 3) ? '#ffea00' : '#fff'; // Crazy eyes
    ctx.fillRect(-3, -10 + bob, 2, 1.5);
    ctx.fillRect(1, -10 + bob, 2, 1.5);
    ctx.fillStyle = '#111'; // Pupil
    ctx.fillRect(-2.5, -10 + bob, 1, 1);
    ctx.fillRect(1.5, -10 + bob, 1, 1);

    // Heavy unibrow/eyebrows
    ctx.fillStyle = '#222';
    ctx.fillRect(-4, -11 + bob, 4, 1);
    ctx.fillRect(0, -11 + bob, 4, 1);

    // War paint on face — Blood red or civ accent
    ctx.fillStyle = age >= 3 ? '#aa1111' : cv.accent + '99';
    ctx.fillRect(-4, -8 + bob, 2, 3);
    ctx.fillRect(2, -8 + bob, 2, 3);
    ctx.fillRect(-1, -7 + bob, 2, 4); // Chin stripe

    // Massive braided beard
    ctx.fillStyle = '#c85a17'; // Ginger/Auburn beard
    ctx.fillRect(-4, -5 + bob, 8, 4);
    ctx.fillRect(-3, -1 + bob, 6, 3);
    ctx.fillRect(-1, 2 + bob, 2, 2); // Braid tip
    // Beard texture lines
    ctx.fillStyle = '#a04010';
    ctx.fillRect(-3, -4 + bob, 1, 6);
    ctx.fillRect(1, -4 + bob, 1, 6);

    // Hair/headgear
    if (age >= 3) {
        // Heavy Iron Spangenhelm
        ctx.fillStyle = '#555';
        ctx.fillRect(-5, -17 + bob, 10, 5);
        ctx.fillStyle = '#333';
        ctx.fillRect(-6, -13 + bob, 12, 1); // Rim
        ctx.fillRect(-1, -17 + bob, 2, 5); // Center band

        // Solid Iron Spectacle guard (Che mắt mũi)
        ctx.fillStyle = '#666';
        ctx.fillRect(-5, -12 + bob, 10, 2); // Brow band
        ctx.fillRect(-1, -12 + bob, 2, 5); // Nasal
        ctx.fillRect(-4, -10 + bob, 2, 2); // Cheek left
        ctx.fillRect(2, -10 + bob, 2, 2); // Cheek right

        if (age >= 4) {
            // Intimidating downward-curved horns
            ctx.fillStyle = '#eee';
            ctx.beginPath();
            ctx.moveTo(-5, -15 + bob); ctx.quadraticCurveTo(-11, -18 + bob, -11, -12 + bob); ctx.lineTo(-7, -15 + bob); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(5, -15 + bob); ctx.quadraticCurveTo(11, -18 + bob, 11, -12 + bob); ctx.lineTo(7, -15 + bob); ctx.fill();
        }
    } else {
        // Wild shaved-side undercut with thick top hair
        ctx.fillStyle = '#c85a17';
        ctx.fillRect(-3, -16 + bob, 6, 4);
        ctx.fillRect(-4, -15 + bob, 8, 2);
    }

    // DUAL HAND AXES (distinctive Viking weapon) - Heavy bearded axes
    // Right axe
    ctx.fillStyle = '#4a2c11';
    ctx.fillRect(6, -4 + bob, 2.5, 12); // Thicker handle
    ctx.fillStyle = '#222'; // Leather wrap grip
    ctx.fillRect(6, 2 + bob, 2.5, 4);
    // Huge bearded axe head
    ctx.fillStyle = age >= 4 ? '#e6e6e6' : age >= 3 ? '#b0b0b0' : '#888';
    ctx.beginPath();
    ctx.moveTo(8, -2 + bob);
    ctx.lineTo(13, -5 + bob);
    ctx.lineTo(14, 2 + bob); // Beard hanging down
    ctx.quadraticCurveTo(10, 0 + bob, 8, 2 + bob);
    ctx.fill();
    ctx.fillStyle = '#fff'; // Razor edge
    ctx.fillRect(13, -4 + bob, 1, 6);

    // Left axe (in other hand)
    ctx.fillStyle = '#4a2c11';
    ctx.fillRect(-9, -3 + bob, 2.5, 11); // handle
    ctx.fillStyle = '#222';
    ctx.fillRect(-9, 2 + bob, 2.5, 4);
    // Axe head
    ctx.fillStyle = age >= 4 ? '#e6e6e6' : age >= 3 ? '#b0b0b0' : '#888';
    ctx.beginPath();
    ctx.moveTo(-6, -1 + bob);
    ctx.lineTo(-12, -4 + bob);
    ctx.lineTo(-13, 1 + bob);
    ctx.quadraticCurveTo(-9, 0 + bob, -6, 1 + bob);
    ctx.fill();
    ctx.fillStyle = '#fff'; // Razor edge
    ctx.fillRect(-13, -3 + bob, 1, 4);

    if (age >= 4) {
        // Blood drips on axes in Age 4
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(13, -1 + bob, 1, 4);
        ctx.fillRect(-13, -2 + bob, 1, 3);

        // Runic glow on axes — pulsing red/orange instead of blue for berserk
        ctx.globalAlpha = 0.5 + Math.sin(unit.animTimer * 8) * 0.3;
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(9, -3 + bob, 2, 2);
        ctx.fillRect(-9, -2 + bob, 2, 2);
        ctx.globalAlpha = 1;
    }

    // Thick legs — fur-wrapped
    ctx.fillStyle = age >= 3 ? '#3a3a28' : '#4a4a38';
    ctx.fillRect(-5, 9, 4, 7 + legOffset);
    ctx.fillRect(1, 9, 4, 7 - legOffset);
    // Fur wraps
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(-5, 12 + legOffset, 4, 3);
    ctx.fillRect(1, 12 - legOffset, 4, 3);
    // Heavy boots
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-6, 14 + legOffset, 5, 3);
    ctx.fillRect(0, 14 - legOffset, 5, 3);

    if (lvl > 0) { ctx.fillStyle = '#ffd700'; ctx.font = '7px sans-serif'; ctx.fillText('★'.repeat(lvl), -lvl * 3.5, -22 + bob); }
    if (moving && age >= 2) { ctx.globalAlpha = 0.15; ctx.fillStyle = '#8a7a60'; for (let i = 0; i < 3; i++) { ctx.fillRect(-12 - i * 3, 10 + bob + i * 3, 3, 2); } ctx.globalAlpha = 1; }
    if (age >= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = cv.accent; ctx.beginPath(); ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

export function drawSwords_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === 2; // UnitState.Attacking
    let attackProgress = 0;
    if (attackState) {
        attackProgress = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
    }

    // Dynamic Attack Posture Calculation (Heavy broadsword chop)
    let bodyTilt = 0;
    let rightArmRot = 0.1;
    let leftArmRot = -0.1;
    let swordOffsetX = 0;
    let swordOffsetY = 0;
    let shieldOffsetX = 0;

    if (attackState) {
        if (attackProgress < 0.3) {
            // Windup: haul sword back over shoulder, brace shield
            const t = attackProgress / 0.3;
            rightArmRot = (0.1) * (1 - t) + (-Math.PI / 1.5) * t;
            leftArmRot = (-0.1) * (1 - t) + (-Math.PI / 6) * t;
            bodyTilt = -0.15 * t;
            swordOffsetX = 2 * t;
            swordOffsetY = 4 * t;
            shieldOffsetX = -2 * t;
        } else if (attackProgress < 0.6) {
            // Strike: heavy downward chop
            const t = (attackProgress - 0.3) / 0.3;
            rightArmRot = (-Math.PI / 1.5) * (1 - t) + (Math.PI / 3) * t;
            leftArmRot = (-Math.PI / 6) * (1 - t) + (Math.PI / 12) * t;
            bodyTilt = -0.15 * (1 - t) + 0.2 * t;
            swordOffsetX = 2 * (1 - t) + 5 * t;
            swordOffsetY = 4 * (1 - t) + 2 * t;
        } else {
            // Recover: heft it back up
            const t = (attackProgress - 0.6) / 0.4;
            rightArmRot = (Math.PI / 3) * (1 - t) + 0.1 * t;
            leftArmRot = (Math.PI / 12) * (1 - t) + -0.1 * t;
            bodyTilt = 0.2 * (1 - t) + 0 * t;
            swordOffsetX = 5 * (1 - t);
            swordOffsetY = 2 * (1 - t);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#f2d1aa';
    const tunicColor = cv.bodyMid;
    const armorPrimary = age >= 3 ? '#666' : '#5c4033'; // Chainmail vs Leather

    // ── LEGS ──
    ctx.fillStyle = '#3a2f26';
    ctx.fillRect(-6, 12 + bob, 5, 5 + legOff);
    ctx.fillRect(1, 12 + bob, 5, 5 - legOff);

    // Cross-gartered boots
    ctx.fillStyle = '#6b4c2a';
    ctx.fillRect(-6, 17 + bob + legOff, 5, 4);
    ctx.fillRect(1, 17 + bob - legOff, 5, 4);
    ctx.fillStyle = '#3a2010'; // straps
    ctx.fillRect(-6, 18 + bob + legOff, 5, 0.5); ctx.fillRect(-6, 20 + bob + legOff, 5, 0.5);
    ctx.fillRect(1, 18 + bob - legOff, 5, 0.5); ctx.fillRect(1, 20 + bob - legOff, 5, 0.5);
    ctx.fillStyle = '#1e140c'; // shoes
    ctx.fillRect(-7, 21 + bob + legOff, 6, 2);
    ctx.fillRect(0, 21 + bob - legOff, 6, 2);



    // ── TORSO (Chainmail / Leather Tunic) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-7, -5 + bob, 14, 18); // Tunic length

    // Armor overlay
    if (age >= 3) {
        // Hauberk
        ctx.fillStyle = armorPrimary;
        ctx.fillRect(-7, -5 + bob, 14, 14);
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Chain link texture
        for (let r = 0; r < 5; r++) {
            ctx.fillRect(-7, -4 + bob + r * 3, 14, 1);
        }
    } else {
        // Leather harness
        ctx.fillStyle = armorPrimary;
        ctx.fillRect(-7, -2 + bob, 14, 8);
        ctx.fillStyle = '#4a2f1d';
        ctx.fillRect(-4, -5 + bob, 2, 8);
        ctx.fillRect(2, -5 + bob, 2, 8);
    }

    // Heavy Ring Belt
    ctx.fillStyle = '#221100';
    ctx.fillRect(-7, 7 + bob, 14, 2.5);
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(-2, 8 + bob, 1.5, 0, Math.PI * 2); ctx.stroke();

    // ── PELT / CLOAK ──
    ctx.fillStyle = age >= 4 ? '#3d3124' : '#5c4e3a';
    ctx.beginPath();
    ctx.moveTo(-9, -4 + bob); ctx.lineTo(-10, 4 + bob); ctx.lineTo(-7, 6 + bob);
    ctx.lineTo(7, 6 + bob); ctx.lineTo(10, 4 + bob); ctx.lineTo(9, -4 + bob);
    ctx.closePath();
    ctx.fill();

    // ── FRONT/SWORD ARM (Right Arm holding Broadsword) ──
    ctx.save();
    ctx.translate(5, -2 + bob);
    ctx.rotate(rightArmRot);
    ctx.translate(swordOffsetX, swordOffsetY);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);
    // Hand
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1.5, 6, 3, 3);

    // Ulfberht Broadsword
    ctx.translate(-1, 9);
    // Point sword moderately forward, rather than straight up the arm
    ctx.rotate(Math.PI / 2.5);

    // Pommel (Lobed)
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
    // Grip
    ctx.fillStyle = '#312012';
    ctx.fillRect(-1, -6, 2, 6);
    // Crossguard
    ctx.fillStyle = '#555';
    ctx.fillRect(-3, -1.5, 6, 1.5);

    // Blade (Wide, straight, tapering tip)
    ctx.fillStyle = age >= 4 ? '#ebebeb' : '#cccccc';
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(-1.5, 20);
    ctx.lineTo(0, 23); // point
    ctx.lineTo(1.5, 20);
    ctx.lineTo(2, 0);
    ctx.fill();

    // Fuller (Blood groove)
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-0.5, 0, 1, 18);

    // Swing effect
    if (attackState && attackProgress > 0.3 && attackProgress < 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        // Adjust swing arc for downward-pointing sword math
        ctx.moveTo(0, 5); ctx.quadraticCurveTo(20, 10, 26, -5);
        ctx.lineTo(26, -2); ctx.quadraticCurveTo(15, 12, 0, 5);
        ctx.fill();
    }
    ctx.restore();

    // ── HEAD & HELMET (Spectacle Helm) ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -13 + bob, 8, 9);
    // Pale eyes
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(-2, -11 + bob, 1, 1);
    ctx.fillRect(1, -11 + bob, 1, 1);

    // Thick Beard (Fiery red/blond)
    ctx.fillStyle = age >= 4 ? '#b3c6cf' : '#d48a33';
    ctx.beginPath(); ctx.moveTo(-4, -6 + bob); ctx.quadraticCurveTo(0, -2 + bob, 4, -6 + bob); ctx.lineTo(0, -4 + bob); ctx.fill();

    if (age >= 3) {
        // Spangenhelm Dome
        ctx.fillStyle = age >= 4 ? '#555' : '#666';
        ctx.beginPath(); ctx.arc(0, -13 + bob, 5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-6, -14 + bob, 12, 1); // Rim

        // Spectacle Guard
        ctx.fillStyle = '#999';
        ctx.fillRect(-2, -14 + bob, 4, 1); // Brow
        ctx.fillRect(-0.5, -13 + bob, 1, 4); // Nasal
        ctx.beginPath(); ctx.arc(-2, -11 + bob, 1.5, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(2, -11 + bob, 1.5, Math.PI, 0); ctx.stroke();

        if (age >= 4) {
            // Ceremonial Horns (for aesthetic pop)
            ctx.fillStyle = '#e8dcc4';
            ctx.beginPath(); ctx.moveTo(-4, -15 + bob); ctx.quadraticCurveTo(-10, -18 + bob, -8, -24 + bob); ctx.quadraticCurveTo(-6, -18 + bob, -2, -15 + bob); ctx.fill();
            ctx.beginPath(); ctx.moveTo(4, -15 + bob); ctx.quadraticCurveTo(10, -18 + bob, 8, -24 + bob); ctx.quadraticCurveTo(6, -18 + bob, 2, -15 + bob); ctx.fill();
        }
    } else {
        ctx.fillStyle = '#d48a33';
        ctx.fillRect(-5, -15 + bob, 10, 3);
    }

    // ── FRONT ARM & SHIELD (Round Shield) ──
    ctx.save();
    ctx.translate(-5, -1 + bob);
    ctx.rotate(leftArmRot);

    // Front arm sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);

    // Painted Wooden Round Shield
    if (age >= 2) {
        ctx.translate(-3 + shieldOffsetX, 4);
        const shieldR = age >= 3 ? 8 : 6;

        // Wood Base
        ctx.fillStyle = '#5c4033';
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.fill();

        // Clan Motif Painting (Halved)
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(0, 0, shieldR, Math.PI / 2, Math.PI * 1.5); ctx.fill();

        // Iron Rim
        ctx.strokeStyle = '#222'; ctx.lineWidth = age >= 4 ? 2 : 1;
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.stroke();

        // Central Boss
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (VIKING) - Norse Spearman / Huskarl
// ============================================================
export function drawSpears_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();

    // Attack animation parameters (Overarm thrust over Shield Wall)
    let attackProgress = 0;
    if (unit.state === UnitState.Attacking) {
        const attackCycle = unit.animTimer % unit.attackCooldown;
        const attackDuration = unit.civAttackSpeed * 0.4;
        if (attackCycle < attackDuration) {
            attackProgress = attackCycle / attackDuration;
        }
    }

    // Overhand Spear Thrust Animation
    let bodyRot = 0;
    let spearAngle = 0;
    let spearOffset = { x: 0, y: 0 };
    let rightArmRot = 0; // Back arm 
    let leftArmRot = 0;  // Front arm (Bracing shield)

    if (attackProgress > 0) {
        if (attackProgress < 0.3) {
            // Windup: Raise spear high, bring shield tight
            const t = attackProgress / 0.3;
            bodyRot = t * -0.15;
            spearOffset.x = t * -3;
            spearOffset.y = t * -4; // High grip
            spearAngle = t * 0.2; // Point down over shield
            rightArmRot = t * -0.6; // Arm raised
            leftArmRot = t * -0.2; // Shield close
        } else if (attackProgress < 0.6) {
            // Strike: Vicious stab downwards
            const t = (attackProgress - 0.3) / 0.3;
            const easeOut = 1 - Math.pow(1 - t, 3);
            bodyRot = -0.15 + easeOut * 0.3;
            spearOffset.x = -3 + easeOut * 10;
            spearOffset.y = -4 + easeOut * 4;
            spearAngle = 0.2 - easeOut * 0.4; // Tip drops into target
            rightArmRot = -0.6 + easeOut * 1.0;
            leftArmRot = -0.2 + easeOut * 0.1;
        } else {
            // Recovery
            const t = (attackProgress - 0.6) / 0.4;
            const easeIn = t * t;
            bodyRot = 0.15 * (1 - easeIn);
            spearOffset.x = 7 * (1 - easeIn);
            spearOffset.y = 0 * (1 - easeIn);
            spearAngle = -0.2 * (1 - easeIn);
            rightArmRot = 0.4 * (1 - easeIn);
            leftArmRot = -0.1 * (1 - easeIn);
        }
    } else {
        // Idle: Shield Wall brace stance
        // Vikings fought in tight formations. Shield covers body, spear rests over the top.
        const breath = Math.sin(unit.animTimer * 2) * 0.05;
        bodyRot = breath;
        spearAngle = 0.1 + breath * 0.1; // Pointing slightly down, resting on shield
        spearOffset.y = -2; // Held moderately high
        rightArmRot = -0.3; // Ready
        leftArmRot = -0.1; // Shield forward
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = age >= 3 ? cv.bodyDark : cv.bodyMid;
    const paddingColor = '#5c4a33'; // Leather/linen padding
    const armorMetal = age >= 4 ? '#5a5a58' : '#777777'; // Chainmail
    const furColor = '#4a3a2a'; // Deep brown wolf/bear pelt

    // ── BACK ARM (Right Arm - High grip for overhand spear) ──
    ctx.save();
    ctx.translate(3, -5 + bob);
    ctx.rotate(Math.PI / 4 + rightArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);
    // Hard leather bracer
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-2.5, 6, 5, 4);
    if (age >= 3) {
        ctx.fillStyle = armorMetal; // Metal bands
        ctx.fillRect(-2.5, 7, 5, 1);
        ctx.fillRect(-2.5, 9, 5, 1);
    }
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── SPEAR (Krókspjót / Viking Spear) ──
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    ctx.translate(0, -3 + bob); // Held higher over the shoulder/shield
    ctx.rotate(spearAngle);

    // Ash Pole
    ctx.fillStyle = '#7c5f40';
    const poleLength = age >= 3 ? 30 : 26;
    ctx.fillRect(-poleLength * 0.4, -1, poleLength, 2);

    // Iron ferrule (butt cap)
    ctx.fillStyle = '#444';
    ctx.fillRect(-poleLength * 0.4 - 2, -0.5, 2, 1);

    // Spear Head (Broad, heavy blade with 'wings')
    const shaftEnd = poleLength * 0.6;
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#cccccc';
    const bladeLen = age >= 3 ? 8 : 6;

    // Socket
    ctx.fillRect(shaftEnd, -1.5, 3, 3);

    if (age >= 3) {
        // Wings (Krókspjót style for hooking shields)
        ctx.beginPath();
        ctx.moveTo(shaftEnd + 1, -1.5); ctx.lineTo(shaftEnd + 2, -4); ctx.lineTo(shaftEnd + 3, -1.5); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(shaftEnd + 1, 1.5); ctx.lineTo(shaftEnd + 2, 4); ctx.lineTo(shaftEnd + 3, 1.5); ctx.fill();
    }

    // Blade
    ctx.beginPath();
    ctx.moveTo(shaftEnd + 3, 0);
    ctx.quadraticCurveTo(shaftEnd + 6, -3, shaftEnd + 3 + bladeLen, 0);
    ctx.quadraticCurveTo(shaftEnd + 6, 3, shaftEnd + 3, 0);
    ctx.fill();

    // Core ridge
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(shaftEnd + 4, -0.5, bladeLen - 2, 1);

    ctx.restore();


    // ── LEGS ──
    // Loose wool trousers and leg wraps (Winingas)
    ctx.fillStyle = paddingColor;
    ctx.fillRect(-5, 6, 4, 7 + legOff);
    ctx.fillRect(1, 6, 4, 7 - legOff);

    // Winingas (wraps)
    ctx.fillStyle = '#222';
    ctx.fillRect(-5.5, 9 + Math.max(0, legOff), 5, 4);
    ctx.fillRect(0.5, 9 + Math.max(0, -legOff), 5, 4);
    ctx.strokeStyle = '#5a5a58'; ctx.lineWidth = 0.5; // X pattern
    ctx.beginPath(); ctx.moveTo(-5.5, 9 + legOff); ctx.lineTo(-0.5, 13 + legOff); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.5, 9 - legOff); ctx.lineTo(5.5, 13 - legOff); ctx.stroke();

    // Leather Shoes
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-5.5, 13 + legOff, 6, 2);
    ctx.fillRect(0.5, 13 - legOff, 6, 2);

    // ── BODY (Gambeson & Mail) ──
    // Tunic skirt
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -5 + bob, 12, 13);

    // Fur mantle (shoulders/back)
    if (age >= 3) {
        ctx.fillStyle = furColor;
        ctx.fillRect(-7, -5 + bob, 14, 5);
        // Fur texture
        ctx.fillStyle = '#2a1a0a';
        for (let i = -6; i <= 6; i += 3) {
            ctx.beginPath(); ctx.moveTo(i, -1 + bob); ctx.lineTo(i - 1, 2 + bob); ctx.lineTo(i + 1, 1 + bob); ctx.fill();
        }
    }

    // Chainmail Shirt (Byrnie)
    if (age >= 2) {
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-6, -5 + bob, 12, 10);
        // Links
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.beginPath(); ctx.arc(-5 + c * 3 + (r % 2) * 1.5, -4 + bob + r * 2.5, 1.2, 0, Math.PI); ctx.fill();
            }
        }
    }

    // Heavy leather belt
    ctx.fillStyle = '#222';
    ctx.fillRect(-6, 5 + bob, 12, 2);
    ctx.fillStyle = '#a0a0a0'; // Buckle
    ctx.fillRect(-1, 4.5 + bob, 3, 3);
    ctx.fillStyle = '#222'; ctx.fillRect(0, 5 + bob, 1, 2);

    // ── HEAD & HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -13 + bob, 6, 8); // Neck/Face

    // Bushy Blonde/Red Beard
    ctx.fillStyle = '#b85c14'; // Reddish brown
    ctx.beginPath();
    ctx.moveTo(-4, -8 + bob);
    ctx.lineTo(4, -8 + bob);
    ctx.lineTo(2, -3 + bob);
    ctx.lineTo(-2, -3 + bob);
    ctx.fill();

    if (age >= 3) {
        // Gjermundbu style Helmet (Spectacle helm)
        ctx.fillStyle = armorMetal;
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, Math.PI * 2); ctx.fill(); // Dome
        ctx.fillRect(-5, -12 + bob, 10, 2); // Rim

        // Spectacle guard (eye protection)
        ctx.fillStyle = armorMetal;
        ctx.beginPath();
        ctx.moveTo(-4, -10 + bob);
        ctx.quadraticCurveTo(0, -7 + bob, 4, -10 + bob);
        ctx.lineTo(2, -11 + bob);
        ctx.lineTo(-2, -11 + bob);
        ctx.fill();

        // Eye holes
        ctx.fillStyle = skinColor;
        ctx.beginPath(); ctx.arc(-1.5, -9.5 + bob, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1.5, -9.5 + bob, 1, 0, Math.PI * 2); ctx.fill();

        // Mail aventail (neck guard)
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-5, -10 + bob, 2, 3);
        ctx.fillRect(3, -10 + bob, 2, 3);

    } else if (age >= 2) {
        // Spangenhelm (Simple conical)
        ctx.fillStyle = '#5a5a58';
        ctx.beginPath();
        ctx.moveTo(-5, -11 + bob);
        ctx.lineTo(5, -11 + bob);
        ctx.lineTo(0, -16 + bob);
        ctx.fill();
        // Nose guard
        ctx.fillRect(-0.5, -11 + bob, 1, 3);
    } else {
        // Bareheaded, wild hair
        ctx.fillStyle = '#b85c14';
        ctx.fillRect(-4, -15 + bob, 8, 4);
    }

    // ── FRONT ARM & SHIELD (Heavy Viking Round Shield) ──
    ctx.save();
    ctx.translate(-4, -1 + bob);
    ctx.rotate(leftArmRot);

    // Arm (hidden)
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 6);

    // Large Round Wooden Shield (braced for shield wall)
    if (age >= 2) {
        // Planted firmly in front
        ctx.translate(-2, 4);
        const shieldR = age >= 3 ? 9 : 8; // Very large

        // Wood Base
        ctx.fillStyle = '#3a2010'; // Darker, heavier wood
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.fill();

        // Painted pattern (Swirls or quarters)
        ctx.fillStyle = cv.accent;
        ctx.beginPath(); ctx.arc(0, 0, shieldR, Math.PI * 0.75, Math.PI * 1.75); ctx.fill();

        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5; // Wood planks
        for (let x = -shieldR + 2; x < shieldR; x += 3) {
            ctx.beginPath(); ctx.moveTo(x, -shieldR); ctx.lineTo(x, shieldR); ctx.stroke();
        }

        // Heavy Iron Rim
        ctx.strokeStyle = '#5a5a58'; ctx.lineWidth = age >= 4 ? 2 : 1.5;
        ctx.beginPath(); ctx.arc(0, 0, shieldR, 0, Math.PI * 2); ctx.stroke();

        if (age >= 3) {
            // Iron studs
            ctx.fillStyle = '#ccc';
            for (let i = 0; i < 8; i++) {
                ctx.beginPath(); ctx.arc(Math.cos(i * Math.PI / 4) * (shieldR - 1), Math.sin(i * Math.PI / 4) * (shieldR - 1), 1, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Central Iron Boss (Umbone)
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore();
}

// ============================================================
//  DRAW ARCHER (VIKING) - Norse Bowman / Hunter
// ============================================================
export function drawArchers_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();

    let isAttacking = false;
    if (unit.state === UnitState.Attacking) {
        const target = unit.attackTarget || unit.attackBuildingTarget;
        if (target) {
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            const bldgRadius = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * 32 * 0.4 : 0;
            if (dist <= unit.civRange + bldgRadius + 20) {
                isAttacking = true;
            }
        }
    }

    let pullback = 0; // 0 to 1
    let bowAngle = 0;

    if (isAttacking) {
        // Attack Cooldown goes from civAttackSpeed down to 0
        const maxCd = unit.civAttackSpeed;
        const currentCd = unit.attackCooldown;
        const pullPhase = 1 - (currentCd / maxCd);

        if (pullPhase > 0.3 && pullPhase < 0.9) {
            pullback = (pullPhase - 0.3) / 0.6;
        } else if (pullPhase >= 0.9) {
            pullback = 1;
        } else {
            pullback = 0;
        }
    }

    let bodyRot = 0;
    if (isAttacking) {
        bodyRot = -0.1 + pullback * 0.15; // Lean into the shot
        bowAngle = -0.05 + pullback * 0.05;
    } else {
        bodyRot = Math.sin(unit.animTimer * 2) * 0.05;
        bowAngle = 0.15; // Bow resting forward
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const tunicColor = '#3a5a48'; // Forest green tunic
    const leatherColor = '#5c4033';
    const armorMetal = age >= 4 ? '#5a5a58' : '#777777';

    // ── BACK ARM (Right Arm - Drawing the string) ──
    ctx.save();
    let drawArmRot = 0;
    let drawHandX = 0;
    let drawHandY = 0;

    if (isAttacking) {
        // Arm pulls back
        drawArmRot = -0.2 - pullback * 0.8;
        drawHandX = 3 - pullback * 14;
        drawHandY = -1;
    } else {
        drawArmRot = 0.2;
        drawHandX = 2;
        drawHandY = 0;
    }

    ctx.translate(drawHandX, drawHandY + bob);
    ctx.rotate(drawArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, -2, 5, 7);

    if (age >= 2) {
        // Leather bracer
        ctx.fillStyle = leatherColor;
        ctx.fillRect(-2, 3, 4, 5);
        ctx.fillStyle = '#7a6a4a'; // Fur trim
        ctx.fillRect(-2.5, 3, 5, 1);
    }

    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 9, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── QUIVER (Cylindrical leather quiver on back/hip) ──
    ctx.save();
    ctx.translate(-7, -2 + bob);
    ctx.rotate(0.2); // Slanted across back
    ctx.fillStyle = '#4a3018'; // Dark leather
    ctx.fillRect(-2, -6, 5, 16);
    ctx.fillStyle = '#2a1a0f'; // Strap wrapping
    ctx.fillRect(-2, 0, 5, 2);
    // Rough arrows (Hunter style)
    ctx.fillStyle = '#aaa'; // Arrowhead/shaft
    ctx.fillRect(-1.5, -9, 1, 3);
    ctx.fillRect(1.5, -8, 1, 2);
    ctx.fillStyle = '#7a3a2a'; // Red/Brown fletching
    ctx.fillRect(-2, -10, 4, 3);
    ctx.fillRect(1, -9, 3, 2);
    ctx.restore();

    // ── LEGS ──
    ctx.fillStyle = '#4a3a2a'; // Brown trousers
    ctx.fillRect(-5, 6, 4, 7 + legOff);
    ctx.fillRect(1, 6, 4, 7 - legOff);

    // Winingas (Leg wraps)
    ctx.fillStyle = '#222';
    ctx.fillRect(-5.5, 9 + legOff, 5, 3);
    ctx.fillRect(0.5, 9 - legOff, 5, 3);
    ctx.strokeStyle = '#5c4033'; ctx.lineWidth = 0.5; // X-pattern
    ctx.beginPath(); ctx.moveTo(-5.5, 9 + legOff); ctx.lineTo(-0.5, 12 + legOff); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.5, 9 - legOff); ctx.lineTo(5.5, 12 - legOff); ctx.stroke();

    // Shoes
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(-5.5, 12 + legOff, 5, 2);
    ctx.fillRect(0.5, 12 - legOff, 5, 2);

    // ── BODY (Tunic & Fur/Armor) ──
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-6, -4 + bob, 12, 14);

    if (age >= 3) {
        // Chainmail Shirt over Tunic
        ctx.fillStyle = armorMetal;
        ctx.fillRect(-6, -5 + bob, 12, 11);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.beginPath(); ctx.arc(-4 + c * 3 + (r % 2), -3 + bob + r * 2.5, 1, 0, Math.PI); ctx.fill();
            }
        }
    } else if (age >= 2) {
        // Leather chest piece
        ctx.fillStyle = leatherColor;
        ctx.fillRect(-5, -4 + bob, 10, 8);
    }

    if (age >= 2) {
        // Fur mantle (Wolf/Bear pelt around shoulders)
        ctx.fillStyle = age >= 4 ? '#3d3124' : '#7a6a4a';
        ctx.beginPath();
        ctx.moveTo(-7, -5 + bob); ctx.lineTo(0, 0 + bob); ctx.lineTo(7, -5 + bob);
        ctx.lineTo(8, -1 + bob); ctx.lineTo(0, 3 + bob); ctx.lineTo(-8, -1 + bob); ctx.fill();
    }

    // Heavy belt
    ctx.fillStyle = '#222';
    ctx.fillRect(-6, 5 + bob, 12, 2);
    ctx.fillStyle = '#8a8a88'; // Iron buckle
    ctx.fillRect(-1, 5 + bob, 2, 2);

    // Accessory: Hand Axe or Horn on belt
    if (age >= 3) {
        // Horn
        ctx.fillStyle = '#e0d8c0';
        ctx.beginPath(); ctx.moveTo(4, 7 + bob); ctx.quadraticCurveTo(7, 10 + bob, 5, 13 + bob); ctx.lineTo(4, 11 + bob); ctx.fill();
    }

    // ── HEAD & HOOD/HELMET ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 8); // Neck/Face

    // Bushy Beard
    ctx.fillStyle = '#b85c14'; // Reddish blonde
    ctx.fillRect(-3, -7 + bob, 6, 3);

    if (age >= 3) {
        // Spectacle Helmet
        ctx.fillStyle = armorMetal;
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill(); // Dome
        ctx.fillStyle = '#aaaaab';
        ctx.fillRect(-2, -11 + bob, 4, 3); // Nose guard
        ctx.beginPath(); ctx.arc(-2.5, -9 + bob, 1.5, Math.PI, 0); ctx.stroke(); // Left eye
        ctx.beginPath(); ctx.arc(2.5, -9 + bob, 1.5, Math.PI, 0); ctx.stroke(); // Right eye

        if (age >= 4) {
            // Raven wing details on helmet
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.moveTo(-4, -13 + bob); ctx.lineTo(-7, -16 + bob); ctx.lineTo(-5, -12 + bob); ctx.fill();
            ctx.beginPath(); ctx.moveTo(4, -13 + bob); ctx.lineTo(7, -16 + bob); ctx.lineTo(5, -12 + bob); ctx.fill();
        }
    } else {
        // Thick leather hunter's hood
        ctx.fillStyle = '#4a3a28';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 4.5, Math.PI, 0); ctx.fill();
        ctx.fillRect(-5, -11 + bob, 10, 4); // Neck flap
        ctx.fillStyle = '#7a6a4a'; // Fur trim
        ctx.fillRect(-5, -12 + bob, 10, 1.5);
    }

    // ── FRONT ARM (Left Arm - Holding Longbow) ──
    ctx.save();
    let bowArmRot = 0;

    if (isAttacking) {
        bowArmRot = -Math.PI / 2 + 0.2; // Pointing forward
    } else {
        bowArmRot = -Math.PI / 4; // Relaxed
    }

    ctx.translate(-2, -4 + bob);
    ctx.rotate(bowArmRot);

    // Sleeve
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Heavy fur-trimmed Bracer
    ctx.fillStyle = leatherColor;
    ctx.fillRect(-2, 5, 4, 5);
    ctx.fillStyle = '#7a6a4a';
    ctx.fillRect(-2.5, 5, 5, 1);

    // Hand gripping bow
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();

    // ── THE BOW (Viking Heavy Longbow) ──
    ctx.translate(0, 11);
    ctx.rotate(-bowArmRot + bowAngle);

    // Shift bow so the wooden grip aligns with the hand
    ctx.translate(-10.5, 0);

    // Thick single piece of Yew
    ctx.strokeStyle = age >= 4 ? '#2a1a0f' : '#4a3018';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Leather wrapped grip
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(10.5, -2, 3, 4);

    if (age >= 4) {
        // Glowing Norse runes on the bow
        ctx.globalAlpha = 0.6 + Math.sin(unit.animTimer * 5) * 0.4;
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(8.5, -8, 1, 2);
        ctx.fillRect(8.5, 6, 1, 2);
        ctx.globalAlpha = 1;
    }

    // ── BOWSTRING & ARROW ──
    const bowTopY = -11;
    const bowBotY = 11;
    const bowTopX = 8.5; // Bow curve apex is at x=12, tips bend back to ~8.5
    const bowBotX = 8.5;

    const maxPullDist = 14; // Deep draw for longbow
    const stringMidX = bowTopX - pullback * maxPullDist;
    const stringMidY = 0;

    // String
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bowTopX, bowTopY);
    ctx.lineTo(stringMidX, stringMidY);
    ctx.lineTo(bowBotX, bowBotY);
    ctx.stroke();

    // Arrow
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        const arrowLen = 16;

        ctx.save();
        // Thick pine shaft
        ctx.fillStyle = '#ccaa77';
        ctx.fillRect(stringMidX, -0.5, arrowLen, 1.5);

        // Heavy Iron Broadhead
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(stringMidX + arrowLen, -1.5);
        ctx.lineTo(stringMidX + arrowLen + 3, 0);
        ctx.lineTo(stringMidX + arrowLen, 1.5);
        ctx.fill();

        // Red/Brown Fletching
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(stringMidX, -1.5, 3, 3);
        ctx.restore();
    }

    ctx.restore(); // Bow & Front Arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Viking Archer context
}

// ============================================================
//  DRAW KNIGHT (VIKING) - Norse Heavy Chieftain Cavalry
// ============================================================
export function drawKnight_Viking(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking;
    let attackProgress = 0;
    if (isAttacking) {
        const pullPhase = 1.0 - (unit.attackCooldown / unit.civAttackSpeed);
        attackProgress = Math.max(0, Math.min(1, pullPhase));
    }

    // Ngựa Viking (Fjord horse - mập, bờm cắt phẳng, màu dun vàng/trắng xám)
    const horseColor = age >= 4 ? '#dcd6ce' : '#c4a67b';
    const horseDark = age >= 4 ? '#aa9f91' : '#947650';

    const hx = -2;
    const hy = 18 + bob;

    const legBob = moving ? Math.sin(unit.animTimer * 18) * 5 : 0;

    // ── HORSE (NGỰA TÚC BỰ PHI TRẦN) ──
    ctx.save();
    ctx.translate(hx, hy);

    const rearing = isAttacking && attackProgress < 0.6 ? -0.15 : 0;
    ctx.rotate(rearing);
    ctx.translate(0, rearing ? -4 : 0);

    // Chân sau
    ctx.fillStyle = horseDark;
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-12 - legBob, 6); ctx.lineTo(-8 - legBob, 8); ctx.lineTo(-5, -8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(10 + legBob * 0.5, 8); ctx.lineTo(14 + legBob * 0.5, 8); ctx.lineTo(12, -8); ctx.fill();

    // Đuôi ngựa (Dày và ngắn)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.quadraticCurveTo(-26 - legBob, -10, -22 - legBob, 6);
    ctx.quadraticCurveTo(-18, -2, -16, -14);
    ctx.fill();

    // Thân ngựa (Cơ bắp nở nang)
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(-18, -12); // mông
    ctx.quadraticCurveTo(-8, -18, 14, -18); // lưng
    ctx.quadraticCurveTo(24, -18, 24, -8); // ngực trước
    ctx.quadraticCurveTo(12, 6, -12, 4); // bụng
    ctx.quadraticCurveTo(-24, 4, -18, -12); // đùi sau
    ctx.fill();

    // Bóng khối 
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.moveTo(24, -8); ctx.quadraticCurveTo(12, 6, -12, 4); ctx.quadraticCurveTo(-8, 0, 18, -12); ctx.fill();

    // Sọc đen dọc sống lưng ngựa (Đặc trưng ngựa Fjord)
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.moveTo(-16, -16); ctx.quadraticCurveTo(-4, -18, 14, -17); ctx.lineTo(14, -15); ctx.quadraticCurveTo(-4, -16, -16, -14); ctx.fill();

    // Cổ và Đầu ngựa
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.moveTo(14, -15);
    ctx.quadraticCurveTo(20, -26, 18, -34); // gáy
    ctx.lineTo(24, -32); // chỏm tai
    ctx.lineTo(30, -20); // mũi
    ctx.lineTo(22, -10); // cổ dưới
    ctx.fill();

    // Bờm ngựa (Cắt lươn / roached mane hai màu đen trắng)
    ctx.fillStyle = '#eee'; // Viền ngoài
    ctx.beginPath(); ctx.moveTo(14, -15); ctx.lineTo(18, -36); ctx.lineTo(14, -34); ctx.quadraticCurveTo(8, -20, 14, -15); ctx.fill();
    ctx.fillStyle = '#222'; // Dải đen giữa
    ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(18, -35); ctx.lineTo(15, -33); ctx.quadraticCurveTo(10, -20, 15, -15); ctx.fill();

    // ── GIÁP NGỰA (VIKING LEATHER BARDING) ──
    if (age >= 3) {
        // Tấm thảm lót lưng bằng lông thú
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(16, -18); ctx.lineTo(12, -4); ctx.lineTo(-14, -4); ctx.fill();
        ctx.fillStyle = '#6a5a4a'; ctx.fillRect(-14, -6, 26, 2); // Viền lông xù
        ctx.strokeStyle = cv.accent; ctx.lineWidth = 1; ctx.stroke();

        if (age >= 4) {
            // Bao ngực bằng da thuộc nạm đinh
            ctx.fillStyle = '#3a2010';
            ctx.beginPath(); ctx.moveTo(18, -14); ctx.lineTo(26, -16); ctx.lineTo(24, -6); ctx.lineTo(14, -4); ctx.fill();
            ctx.fillStyle = '#aaa'; ctx.fillRect(20, -12, 1, 1); ctx.fillRect(22, -10, 1, 1); ctx.fillRect(24, -8, 1, 1);

            // Mặt nạ ngựa bằng da/xương
            ctx.fillStyle = '#3a2010';
            ctx.beginPath(); ctx.moveTo(24, -32); ctx.lineTo(30, -20); ctx.lineTo(26, -30); ctx.fill();
        }
    }

    // Chân trước
    ctx.fillStyle = horseColor;
    const stompLift = (isAttacking && attackProgress > 0.1 && attackProgress < 0.8) ? -8 : 0;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-14 + legBob, 10); ctx.lineTo(-8 + legBob, 12); ctx.lineTo(-6, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(14 - legBob, 12 + stompLift); ctx.lineTo(18 - legBob, 12 + stompLift); ctx.lineTo(18, -6); ctx.fill();
    if (age >= 4) {
        // Lông chân sau (Feathering)
        ctx.fillStyle = '#eee'; ctx.fillRect(-14 + legBob, 6, 4, 3);
        ctx.fillRect(14 - legBob, 8 + stompLift, 4, 3);
    }

    // Dây cương (Da thô)
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(20, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, -22); ctx.lineTo(12, -14); ctx.stroke();

    ctx.restore(); // END HORSE

    // ── RIDER (VIKING CHIEFTAIN/HUSCARL RIDER) ──
    const riderY = hy - 20;
    ctx.save();
    ctx.translate(hx, riderY);
    ctx.rotate(rearing * 0.8);

    // Áo choàng lông gấu sau lưng
    if (age >= 2) {
        ctx.fillStyle = '#3a2515';
        const capeWave = moving ? Math.sin(unit.animTimer * 15) * 5 : 0;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(-14, 6 + capeWave, -16 + capeWave, 18);
        ctx.lineTo(-10 + capeWave, 20);
        ctx.quadraticCurveTo(-6, 8 + capeWave, 0, 4);
        ctx.fill();
        // Viền tuyết/xám
        ctx.fillStyle = '#8a8580'; ctx.fillRect(-14 + capeWave, 16, 4, 4);
    }

    // Tay phải (cầm cương / khiên)
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.skinColor;
    ctx.fillRect(-6, 4, 4, 10);

    // Khiên tròn Bắc Âu lớn bên hông (Bọc mép sắt)
    if (age >= 2) {
        ctx.save();
        ctx.translate(-8, 12);
        const shieldColor = age >= 4 ? cv.bodyDark : cv.accent;
        ctx.fillStyle = shieldColor;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 12, -0.1, 0, Math.PI * 2); ctx.fill();
        // Ván gỗ
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(-3, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, -10); ctx.lineTo(3, 10); ctx.stroke();
        // Boss khiên sắt
        ctx.fillStyle = '#888'; ctx.beginPath(); ctx.ellipse(0, 0, 2, 4, -0.1, 0, Math.PI * 2); ctx.fill();
        // Viền kim loại
        ctx.strokeStyle = age >= 4 ? '#aaa' : '#666'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 11.5, -0.1, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    // Thân người (Chainmail or Leather)
    ctx.fillStyle = age >= 3 ? '#6a6a68' : cv.bodyMid;
    ctx.fillRect(-5, 0, 10, 14);

    if (age >= 4) {
        // Tấm thắt lưng da rộng có họa tiết thắt bím Runic
        ctx.fillStyle = '#2a1a0a'; ctx.fillRect(-5, 9, 10, 3);
        ctx.fillStyle = '#daa520'; ctx.fillRect(0, 10, 2, 1); // Buckle
        // Hauberk chainmail dài xuống vạt
        ctx.fillStyle = '#7a7a78';
        ctx.fillRect(-5, 12, 10, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (let r = 0; r < 2; r++) {
            ctx.fillRect(-5, 13 + r * 2, 10, 1);
        }
    }

    // Chân & Giày da trói dây
    ctx.fillStyle = '#4a3018'; // Quần len/sợi thô
    ctx.fillRect(-2, 14, 6, 8);
    // Ủng da thú/wraps
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(-2, 18, 6, 6);
    ctx.fillStyle = '#111';
    ctx.fillRect(-2, 22, 1, 3); // Dây buộc chéo
    ctx.fillRect(1, 21, 1, 3);

    // Đầu
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-3, -6, 6, 6); // Mặt & Cổ

    // Râu ria quai nón đặc trưng Viking
    ctx.fillStyle = age >= 3 ? '#bbaa44' : '#aa4422'; // Tóc vàng hoặc đỏ
    ctx.fillRect(-1, -1, 5, 4); // Râu cằm
    ctx.fillRect(-3, -3, 3, 3); // Tóc gáy

    // Mũ bảo hiểm (Spectacle Helmet / Gjermundbu)
    ctx.fillStyle = age >= 4 ? '#888' : '#555';
    ctx.beginPath(); ctx.arc(0, -6, 4.5, Math.PI, 0); ctx.fill(); // Dome tròn
    // Vành nón sắt
    ctx.fillRect(-5, -6, 10, 1.5);
    if (age >= 3) {
        // Kính che nhãn (Ngụy trang Spectacles)
        ctx.fillRect(-2, -5, 5, 2);
        ctx.fillStyle = cv.skinColor; ctx.fillRect(0, -5, 1, 1); // Hở mắt

        if (age >= 4) {
            // Sừng nhỏ hoặc phù điêu sắt chọc chéo (trang trí viễn tưởng)
            ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-6, -14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(3, -9); ctx.lineTo(6, -14); ctx.stroke();
        }
    }

    // Tay trái (cầm Rìu chiến lớn / Dane Axe)
    ctx.save();
    let armRot = 0;
    if (isAttacking) {
        if (attackProgress < 0.4) {
            // Đưa rìu vung ngược ra sau lưng để chặt
            armRot = -Math.PI / 1.5 + (attackProgress * 3);
        } else {
            // Bổ mạnh xuống chéo
            armRot = Math.PI / 2.5;
        }
    } else {
        armRot = moving ? Math.PI / 8 + Math.sin(unit.animTimer * 18) * 0.1 : Math.PI / 4;
    }

    ctx.translate(2, 2);
    ctx.rotate(armRot);

    // Cánh tay & Giáp vai
    if (age >= 3) {
        ctx.fillStyle = '#6a6a68'; // Chainmail sleeve
        ctx.fillRect(-2, 0, 4, 12);
        ctx.fillStyle = '#3a2515'; // Đệm lông thú chỏm vai
        ctx.fillRect(-3, -2, 6, 4);
    } else {
        ctx.fillStyle = cv.skinColor; // Tay trần cơ bắp
        ctx.fillRect(-2, 0, 4, 12);
        ctx.fillStyle = cv.bodyMid;
        ctx.fillRect(-3, -2, 6, 3); // Lót vai vải
    }

    // Vũ khí (Heavy Battle Axe / Dane Axe)
    ctx.translate(0, 10);
    ctx.fillStyle = '#5c3a21'; // Cán gỗ tần bì dài
    ctx.fillRect(-1.5, -4, 3, 26);
    ctx.fillStyle = '#888'; ctx.fillRect(-1.5, -4, 3, 2); // Khuyên sắt bọc đuôi cán

    if (age >= 3) {
        // Lưỡi rìu lớn sắc bén (Bearded Axe)
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath();
        ctx.moveTo(1.5, -1);
        ctx.lineTo(8, -4); // Góc mỏ neo trên
        ctx.quadraticCurveTo(8, 2, 8, 8); // Cạnh chém thẳng dài
        ctx.lineTo(1.5, 4); // Cổ rìu thụt vào dưới
        ctx.fill();

        ctx.fillStyle = '#dddddd';
        ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(8, -4); ctx.quadraticCurveTo(8, 2, 8, 8); ctx.lineTo(6, 4); ctx.fill(); // Lưỡi vát
    } else {
        // Giáo xiên hoặc rìu con
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(4, -2); ctx.lineTo(4, 4); ctx.lineTo(-2, 2); ctx.fill();
    }

    ctx.restore(); // END Tay trái

    ctx.restore(); // END RIDER

    drawKnightsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // END MAIN KNIGHT
}
