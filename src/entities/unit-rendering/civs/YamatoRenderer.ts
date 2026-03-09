// ============================================================
//  Yamato (Japan) — Civilization-specific unit renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";
import type { CivColors } from "../shared";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish, drawKnightsFinish } from "../draw-swords-finish";

// ======== YAMATO SCOUT — Shinobi (ninja-like stealth scout) ========
export function drawScout_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOffset: number, lvl: number, cv: CivColors): void {
    // Tattered scarf trailing behind — civ accent colored
    if (age >= 2) {
        ctx.fillStyle = cv.accent + '88';
        const scarfWave = moving ? Math.sin(unit.animTimer * 16) * 3 : 0;
        ctx.fillRect(-8, -6 + bob, 2, 12 + scarfWave);
    }

    // Body — CIV COLORED stealth outfit
    ctx.fillStyle = age >= 3 ? cv.bodyDark : age >= 2 ? cv.bodyMid : cv.bodyLight;
    ctx.fillRect(-5, -4 + bob, 10, 13);
    // Chest wrap accent
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-4, -2 + bob, 8, 3);
    // Arm wraps (age 3+)
    if (age >= 3) {
        ctx.fillStyle = age >= 4 ? '#2a2a2a' : '#3a3a3a';
        ctx.fillRect(-7, -2 + bob, 3, 5);
        ctx.fillRect(5, -2 + bob, 3, 5);
        if (age >= 4) {
            ctx.fillStyle = cv.accent;
            ctx.fillRect(-7, -2 + bob, 3, 1);
            ctx.fillRect(5, -2 + bob, 3, 1);
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
        ctx.fillRect(-6, 1 + bob, 1, 3); // kunai blades
    }

    // Head
    ctx.fillStyle = cv.skinColor;
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(1, -9 + bob, 2, 2);

    // Ninja face mask + headband
    ctx.fillStyle = '#1a1a1a';
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

    // Short ninjato (straight blade) — quality improves
    ctx.fillStyle = '#333';
    ctx.fillRect(5, -1 + bob, 2, 4); // handle
    ctx.fillStyle = age >= 4 ? '#f0f0f0' : age >= 3 ? '#ddd' : '#ccc';
    ctx.fillRect(5, -9 + bob, 2, 9); // straight blade
    ctx.fillStyle = '#333';
    ctx.fillRect(4, -1 + bob, 4, 1); // square guard
    if (age >= 4) {
        // Poison blade glow
        ctx.globalAlpha = 0.3 + Math.sin(unit.animTimer * 6) * 0.15;
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(5, -8 + bob, 2, 7);
        ctx.globalAlpha = 1;
    }

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

    // Legs — civ colored dark leggings
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-4, 9, 3, 7 + legOffset);
    ctx.fillRect(1, 9, 3, 7 - legOffset);
    // Tabi shoes
    ctx.fillStyle = '#222';
    ctx.fillRect(-5, 14 + legOffset, 4, 3);
    ctx.fillRect(0, 14 - legOffset, 4, 3);

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
export function drawSwords_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const attackState = unit.state === 2; // UnitState.Attacking
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
        if (attackProgress < 0.3) {
            // Windup: raise sword high above head
            const t = attackProgress / 0.3;
            armRot = (Math.PI / 12) * (1 - t) + (-Math.PI / 1.5) * t;
            bodyTilt = -0.1 * t;
            swordOffsetY = -5 * t;
        } else if (attackProgress < 0.6) {
            // Strike: fast downward slash
            const t = (attackProgress - 0.3) / 0.3;
            armRot = (-Math.PI / 1.5) * (1 - t) + (Math.PI / 3) * t;
            bodyTilt = -0.1 * (1 - t) + 0.15 * t;
            swordOffsetY = -5 * (1 - t) + 2 * t;
            swordOffsetX = 4 * t;
        } else {
            // Recover
            const t = (attackProgress - 0.6) / 0.4;
            armRot = (Math.PI / 3) * (1 - t) + (Math.PI / 12) * t;
            bodyTilt = 0.15 * (1 - t) + 0 * t;
            swordOffsetY = 2 * (1 - t);
            swordOffsetX = 4 * (1 - t);
        }
    }

    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    const skinColor = cv.skinColor || '#e8cfa6';
    const armorPrimary = age >= 3 ? '#b02a2a' : '#8a2323'; // Red lacquered armor
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
    ctx.translate(4, -2 + bob);
    ctx.rotate(armRot);
    ctx.translate(swordOffsetX, swordOffsetY);

    // Front Arm (Sleeve & Sode)
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

    // Forearm / Hand
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1.5, 6, 3, 4);

    // Katana Hilt (Tsuka)
    ctx.translate(0, 10);
    // Two-handed grip illusion: draw hilt extending downwards
    ctx.fillStyle = '#111'; // Samegawa
    ctx.fillRect(-1.5, -4, 3, 10);
    ctx.fillStyle = '#d4a373'; // Ito
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-1.5, -3 + i * 2, 3, 1);
    }

    // Tsuba
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#444';
    ctx.fillRect(-3, -5, 6, 2);

    // Blade
    ctx.fillStyle = '#ebebeb';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(-4, -20, 0, -42); // Curved edge
    ctx.lineTo(2, -40);
    ctx.quadraticCurveTo(-2, -20, 2, -5); // Straight back
    ctx.fill();

    // Hamon
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-1, -5);
    ctx.quadraticCurveTo(-4.5, -20, -1, -38);
    ctx.lineTo(-0.5, -5);
    ctx.fill();

    // Attack swing trail
    if (attackState && attackProgress > 0.3 && attackProgress < 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.quadraticCurveTo(15, -30, 0, -42);
        ctx.lineTo(-2, -40);
        ctx.quadraticCurveTo(10, -30, 0, -5);
        ctx.fill();
    }

    ctx.restore();

    drawSwordsFinish(unit, ctx, age, bob, legOff, lvl, cv);
    ctx.restore();
}

// ============================================================
//  DRAW SPEARSMAN (YAMATO) - Yari Ashigaru (Long Spear)
// ============================================================
export function drawSpears_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();

    // Attack animation parameters (Two-handed Thrust)
    let attackProgress = 0;
    if (unit.state === UnitState.Attacking) {
        const attackCycle = unit.animTimer % unit.attackCooldown;
        const attackDuration = unit.civAttackSpeed * 0.4;
        if (attackCycle < attackDuration) {
            attackProgress = attackCycle / attackDuration;
        }
    }

    // Yari Thrust Animation Logic
    let bodyRot = 0;
    let spearAngle = 0;
    let spearOffset = { x: 0, y: 0 };
    let rightArmRot = 0; // Back arm (pushing)
    let leftArmRot = 0;  // Front arm (guiding)

    if (attackProgress > 0) {
        if (attackProgress < 0.3) {
            // Windup: Pull back, gather power
            const t = attackProgress / 0.3;
            bodyRot = t * -0.15;
            spearOffset.x = t * -6; // Pull back far
            spearOffset.y = t * -1;
            spearAngle = t * 0.05; // Level out
            rightArmRot = t * 0.2; // Back arm bends
            leftArmRot = t * -0.2; // Front arm extends slightly back
        } else if (attackProgress < 0.6) {
            // Strike: Snap thrust forward
            const t = (attackProgress - 0.3) / 0.3;
            const easeOut = 1 - Math.pow(1 - t, 3);
            bodyRot = -0.15 + easeOut * 0.3; // Lean forward
            spearOffset.x = -6 + easeOut * 18; // Very long reach
            spearOffset.y = -1 + easeOut * 0;
            spearAngle = 0.05 - easeOut * 0.05;
            rightArmRot = 0.2 - easeOut * 0.8; // Back arm pushes hard
            leftArmRot = -0.2 + easeOut * -0.1; // Front arm guides
        } else {
            // Recovery
            const t = (attackProgress - 0.6) / 0.4;
            const easeIn = t * t;
            bodyRot = 0.15 * (1 - easeIn);
            spearOffset.x = 12 * (1 - easeIn);
            spearAngle = 0 * (1 - easeIn);
            rightArmRot = -0.6 * (1 - easeIn);
            leftArmRot = -0.3 * (1 - easeIn);
        }
    } else {
        // Idle stance: Yari held diagonally across body or pointing forward
        const breath = Math.sin(unit.animTimer * 2) * 0.05;
        bodyRot = breath;
        spearAngle = -0.2 + breath * 0.3; // Pointed somewhat up/forward
        leftArmRot = -0.4; // Holding spear raised
    }

    ctx.rotate(bodyRot);

    // Colors
    const skinColor = cv.skinColor;
    const armorDark = age >= 3 ? '#161616' : '#2b2b2b'; // Okegawa Do lacquer
    const armorLace = '#cc3333'; // Red lacing
    const clothColor = age >= 4 ? '#222' : '#333'; // Underclothes

    // ── BACK ARM (Right Arm - Pushing Base) ──
    ctx.save();
    ctx.translate(3, -3 + bob);
    ctx.rotate(Math.PI / 6 + rightArmRot);

    // Sleeve (Kote)
    ctx.fillStyle = clothColor;
    ctx.fillRect(-2, 0, 4, 6);
    // Chain/Plate Bracer
    ctx.fillStyle = '#222';
    ctx.fillRect(-2.5, 6, 5, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-2, 6, 4, 5); // texture
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 12, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── SPEAR (Yari) ──
    // The Yari is very long. We draw it before the front arm so the front arm holds it over the body.
    ctx.save();
    ctx.translate(spearOffset.x, spearOffset.y);
    // Position exactly between the hands
    ctx.translate(0, -1 + bob);
    ctx.rotate(spearAngle);

    // Yari Pole (very long)
    ctx.fillStyle = '#1a1a2a'; // Extemely dark lacquered wood
    const poleLength = age >= 3 ? 42 : 36;
    ctx.fillRect(-poleLength * 0.3, -1, poleLength, 2);

    // Metal band / Ishizuki (butt cap)
    ctx.fillStyle = '#cc2222'; // Red lacquered band
    ctx.fillRect(-poleLength * 0.3, -1.5, 2, 3);
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.moveTo(-poleLength * 0.3, -1); ctx.lineTo(-poleLength * 0.3 - 4, 0); ctx.lineTo(-poleLength * 0.3, 1); ctx.fill();

    // Spear blade and upper shaft binding
    const shaftEnd = poleLength * 0.7;

    if (age >= 3) {
        // Red lacquer reinforcing wrap near blade
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(shaftEnd - 4, -1.5, 6, 3);
        // Tachi-uchi (metal reinforcing bands)
        ctx.fillStyle = '#888';
        ctx.fillRect(shaftEnd - 3, -1.5, 1, 3);
        ctx.fillRect(shaftEnd - 1, -1.5, 1, 3);
    }

    // Su-yari blade (straight, double-edged)
    ctx.fillStyle = age >= 4 ? '#eeeeee' : '#cccccc';
    const bladeLen = age >= 3 ? 12 : 9;
    ctx.beginPath();
    ctx.moveTo(shaftEnd + 2, 0);
    ctx.lineTo(shaftEnd + 4, -2);
    ctx.lineTo(shaftEnd + 2 + bladeLen, 0);
    ctx.lineTo(shaftEnd + 4, 2);
    ctx.fill();

    // Blood groove
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(shaftEnd + 3, -0.5, bladeLen - 3, 1);

    ctx.restore();

    // ── FRONT ARM (Left Arm - Guiding/Aiming) ──
    ctx.save();
    ctx.translate(-4, -2 + bob);
    ctx.rotate(Math.PI / 4 + leftArmRot); // Reaching across body forward

    // Sleeve
    ctx.fillStyle = clothColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Forearm (Kote)
    ctx.fillStyle = '#222';
    ctx.fillRect(-2.5, 5, 5, 5);
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill(); // Hand gripping pole
    ctx.restore();


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


    drawSpearsFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore();
}

// ============================================================
//  DRAW ARCHER (YAMATO) - Yumi Archer (Samurai / Ashigaru)
// ============================================================
export function drawArchers_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, legOff: number, lvl: number, cv: CivColors): void {
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

    // Colors
    const skinColor = cv.skinColor;
    const kimonoColor = age >= 3 ? '#161616' : '#2b2b2b'; // Dark blue/black
    const hakamaColor = age >= 3 ? '#222' : '#333';
    const obiColor = age >= 4 ? '#cc3333' : '#553333';

    // ── BACK ARM (Right Arm - Drawing the string) ──
    ctx.save();
    let drawArmRot = 0;
    let drawHandX = 0;
    let drawHandY = 0;

    if (isAttacking) {
        // Draw hand pulls back past the ear in traditional Japanese style
        drawArmRot = -0.1 - pullback * 0.7;
        drawHandX = 10 - pullback * 11;
        drawHandY = -3;
    } else {
        drawArmRot = 0.3;
        drawHandX = 6;
        drawHandY = 0;
    }

    ctx.translate(drawHandX, drawHandY + bob);
    ctx.rotate(drawArmRot);

    // Sleeve
    ctx.fillStyle = kimonoColor;
    ctx.fillRect(-2, -2, 5, 8);
    // Yugake (archery glove)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-2, 6, 4, 3);
    ctx.fillStyle = '#cc3333'; ctx.fillRect(-2, 6, 4, 1);

    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── QUIVER (Yebira - Open woven quiver worn on right hip/back) ──
    ctx.save();
    ctx.translate(-7, 2 + bob);
    ctx.rotate(0.3);
    ctx.fillStyle = '#1a1a1a'; // Black lacquer frame
    ctx.fillRect(-3, -2, 6, 10);
    ctx.fillStyle = age >= 3 ? '#e0d8c0' : '#8a6a30'; // Woven wicker inside
    ctx.fillRect(-2, -1, 4, 8);
    // Arrows stacked
    ctx.fillStyle = '#ffffff'; // White fletching
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-2 + i * 2, -5 + i, 1, 6);
        ctx.fillStyle = '#222'; // Shaft
        ctx.fillRect(-1.5 + i * 2, -1 + i, 0.5, 4);
        ctx.fillStyle = '#ffffff';
    }
    ctx.restore();

    // ── LEGS (Hakama & Tabi) ──
    // Wide Hakama trousers
    ctx.fillStyle = hakamaColor;
    ctx.beginPath(); ctx.moveTo(-6, 4 + bob); ctx.lineTo(-8, 11 + legOff); ctx.lineTo(-2, 11 + legOff); ctx.lineTo(-3, 4 + bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, 4 + bob); ctx.lineTo(-1, 11 - legOff); ctx.lineTo(6, 11 - legOff); ctx.lineTo(4, 4 + bob); ctx.fill();

    // Tabi socks and Waraji sandals
    ctx.fillStyle = '#eeeeee'; // White socks
    ctx.fillRect(-6.5, 11 + legOff, 4, 3);
    ctx.fillRect(1.5, 11 - legOff, 4, 3);
    ctx.fillStyle = '#d4b872'; // Straw sandals
    ctx.fillRect(-7, 13 + legOff, 5, 1);
    ctx.fillRect(1, 13 - legOff, 5, 1);

    // ── BODY (Kimono / Karuta Armor) ──
    ctx.fillStyle = kimonoColor;
    ctx.fillRect(-6, -4 + bob, 12, 11);

    // White under-kimono V-neck
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath(); ctx.moveTo(-3, -4 + bob); ctx.lineTo(0, 1 + bob); ctx.lineTo(3, -4 + bob); ctx.fill();

    if (age >= 2) {
        // Dou (Chest armor) - lighter for archers
        ctx.fillStyle = '#2a2a2a'; // Karuta tatami armor
        ctx.fillRect(-5, -3 + bob, 10, 8);
        ctx.fillStyle = '#cc3333'; // Crimson lacing
        for (let r = 0; r < 3; r++) {
            ctx.fillRect(-5, -1 + bob + r * 3, 10, 0.5);
        }
    }

    // Obi (Sash)
    ctx.fillStyle = obiColor;
    ctx.fillRect(-6, 3 + bob, 12, 3);

    // ── HEAD & HAT ──
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -12 + bob, 6, 8); // Neck/Face

    ctx.fillStyle = '#111'; // Hair
    ctx.fillRect(-3, -13 + bob, 6, 2);

    if (age >= 3) {
        // Flat lacquer Jingasa
        ctx.fillStyle = age >= 4 ? '#1a1a1a' : '#2a2a2a';
        ctx.beginPath(); ctx.arc(0, -11 + bob, 7, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(-7, -11 + bob, 14, 1); // Red rim

        if (age >= 4) {
            // Gold clan crest (Mon)
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.arc(0, -13 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    } else {
        // Deep straw Kasa
        ctx.fillStyle = '#d4b872';
        ctx.beginPath(); ctx.moveTo(-8, -10 + bob); ctx.lineTo(0, -16 + bob); ctx.lineTo(8, -10 + bob); ctx.fill();
        ctx.strokeStyle = '#a68b4b'; ctx.lineWidth = 0.5;
        for (let i = -6; i <= 6; i += 3) {
            ctx.beginPath(); ctx.moveTo(0, -16 + bob); ctx.lineTo(i, -10 + bob); ctx.stroke();
        }
    }
    // Hachimaki (Headband) underneath
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -9 + bob, 8, 2);
    ctx.fillStyle = '#cc3333'; // Rising sun
    ctx.fillRect(-1, -9 + bob, 2, 2);


    // ── FRONT ARM (Left Arm - Holding Yumi Bow) ──
    ctx.save();
    let bowArmRot = 0;

    if (isAttacking) {
        // Japanese archery pushes the bow forward as the other hand pulls back
        bowArmRot = -Math.PI / 2 + 0.2;
    } else {
        bowArmRot = -Math.PI / 3;
    }

    ctx.translate(-2, -3 + bob);
    ctx.rotate(bowArmRot);

    // Sleeve (tied back or form fitting to avoid bowstring interference)
    ctx.fillStyle = kimonoColor;
    ctx.fillRect(-2, 0, 4, 5);
    // Kote (Armored sleeve)
    if (age >= 2) {
        ctx.fillStyle = '#222';
        ctx.fillRect(-1.5, 5, 3, 5);
        ctx.fillStyle = '#cc3333'; ctx.fillRect(-1.5, 7, 3, 0.5);
    }

    // Hand gripping bow
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, 11, 2, 0, Math.PI * 2); ctx.fill();


    // ── THE BOW (Yumi - Asymmetric Japanese Longbow) ──
    // Held below the center
    ctx.translate(0, 11);
    ctx.rotate(-bowArmRot + bowAngle);

    // Shift bow down so the grip at Y=-7 aligns with the hand at Y=0
    ctx.translate(0, 7);

    ctx.strokeStyle = age >= 4 ? '#111111' : '#8a5a2a'; // Black lacquer or bamboo
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    // Upper limb (much longer)
    ctx.arc(0, -2, 16, -Math.PI * 0.55, -Math.PI * 0.1);
    // Lower limb (shorter)
    ctx.arc(0, -8, 10, Math.PI * 0.1, Math.PI * 0.45);
    ctx.stroke();

    // Grip (Toh)
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-1, -7, 2, 3);

    // Rattan wrapping decorations
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(-1, -14, 2, 1);
    ctx.fillRect(-1, 0, 2, 1);

    // ── BOWSTRING & ARROW ──
    const bowTopY = -15.5;
    const bowBotY = 1.5;
    const bowTopX = 1.5;
    const bowBotX = 0;

    const maxPullDist = 13;
    const stringMidX = bowTopX - pullback * maxPullDist;
    const stringMidY = -6; // Gripped slightly below center

    // Draw String
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bowTopX, bowTopY);
    ctx.lineTo(stringMidX, stringMidY);
    ctx.lineTo(bowBotX, bowBotY);
    ctx.stroke();

    // Draw Arrow (Ya)
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        const arrowLen = 16; // Japanese arrows are notably long

        ctx.save();
        ctx.translate(stringMidX, stringMidY);
        // Slightly point arrow depending on draw
        ctx.rotate(0.05 * (1 - pullback));

        // Bamboo Shaft
        ctx.fillStyle = '#e8d898';
        ctx.fillRect(0, -0.5, arrowLen, 1);

        // Yajiri (Arrowhead)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(arrowLen, -1.5);
        ctx.lineTo(arrowLen + 4, 0);
        ctx.lineTo(arrowLen, 1.5);
        ctx.fill();

        // White Eagle Fletching
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -1.5, 3, 3);
        ctx.fillStyle = '#222'; // Black banding
        ctx.fillRect(1, -1.5, 0.5, 3);
        ctx.restore();
    }

    ctx.restore(); // Bow & Front Arm

    drawArchersFinish(unit, ctx, age, bob, legOff, lvl, cv);

    ctx.restore(); // Main Yamato Archer context
}

// ============================================================
//  DRAW KNIGHT (YAMATO) - Samurai Cavalry
// ============================================================
export function drawKnight_Yamato(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, legOff: number, lvl: number, cv: CivColors): void {
    ctx.save();
    ctx.scale(0.85, 0.85);

    const isAttacking = unit.state === UnitState.Attacking;
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
