// ============================================================
//  Elite Unit Renderers — drawChuKoNu, drawImmortal, drawNinja,
//  drawCenturion, drawUlfhednar
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType, UnitState, TILE_SIZE } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";

/** Cẩm Y Vệ — Đại Minh imperial guard, red flying fish robe, concealed dao */
export function drawChuKoNu(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3.5 : 0;
    let redBase = age >= 4 ? '#8a0a0a' : '#aa2222';
    if (unit.slotColor) { const sc = unit.slotColor; const r = parseInt(sc.slice(1, 3), 16), g = parseInt(sc.slice(3, 5), 16), b2 = parseInt(sc.slice(5, 7), 16); redBase = `rgb(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b2 * 0.7)})`; }

    // Legs — dark pants under robe
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(-3, 10 + bob, 3, 9 + legOffset);
    ctx.fillRect(1, 10 + bob, 3, 9 - legOffset);
    // Boots — black official boots
    ctx.fillStyle = '#111';
    ctx.fillRect(-4, 18 + bob + legOffset, 4, 3);
    ctx.fillRect(0, 18 + bob - legOffset, 4, 3);
    // Boot trim
    ctx.fillStyle = '#333';
    ctx.fillRect(-4, 18 + bob + legOffset, 4, 1);
    ctx.fillRect(0, 18 + bob - legOffset, 4, 1);

    // Robe lower (飛魚服 — Flying Fish Robe) — flows below waist
    ctx.fillStyle = redBase;
    ctx.fillRect(-6, 5 + bob, 13, 8);
    // Robe slit
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 8 + bob, 1, 5);

    // Body — red flying fish robe
    ctx.fillStyle = redBase;
    ctx.fillRect(-6, -5 + bob, 13, 16);
    // Robe pattern — diagonal cross pattern
    ctx.fillStyle = 'rgba(255,200,50,0.15)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-5 + i * 2.5, -4 + bob + i * 2, 2, 2);
    }
    // Gold collar
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#c9a84c';
    ctx.fillRect(-6, -5 + bob, 13, 2);
    // Gold waist sash (玉带)
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-6, 5 + bob, 13, 2);
    ctx.fillStyle = age >= 4 ? '#ffd700' : '#dab84c';
    ctx.fillRect(-2, 4 + bob, 5, 4); // belt buckle jade piece

    // Dragon emblem on chest (龍紋)
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-2, -2 + bob, 5, 5);
    ctx.fillRect(-1, -3 + bob, 3, 1);
    ctx.fillRect(-1, 3 + bob, 3, 1);
    ctx.fillRect(-3, 0 + bob, 1, 2);
    ctx.fillRect(3, 0 + bob, 1, 2);

    // Arms — red sleeves with gold cuffs
    ctx.fillStyle = redBase;
    ctx.fillRect(-8, -3 + bob, 3, 10);
    ctx.fillRect(6, -3 + bob, 3, 10);
    // Gold cuffs
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-8, 5 + bob, 3, 2);
    ctx.fillRect(6, 5 + bob, 3, 2);
    // Hands
    ctx.fillStyle = '#e8c090';
    ctx.fillRect(-8, 7 + bob, 3, 2);
    ctx.fillRect(6, 7 + bob, 3, 2);

    // Head — face
    ctx.fillStyle = '#e8c090';
    ctx.fillRect(-4, -13 + bob, 8, 9);
    // Eyes — sharp, observant
    ctx.fillStyle = '#111';
    ctx.fillRect(-3, -9 + bob, 2, 1.5);
    ctx.fillRect(1, -9 + bob, 2, 1.5);
    // Eyebrows — thick, stern
    ctx.fillStyle = '#222';
    ctx.fillRect(-4, -11 + bob, 3, 1);
    ctx.fillRect(1, -11 + bob, 3, 1);
    // Mustache
    ctx.fillStyle = '#333';
    ctx.fillRect(-3, -5 + bob, 6, 1);
    ctx.fillRect(-2, -4 + bob, 1, 1);
    ctx.fillRect(1, -4 + bob, 1, 1);

    // Elaborate Jinyiwei Hat (Conical / domed with wide brim) - Scaled down
    ctx.fillStyle = redBase;
    // Brim
    ctx.beginPath();
    ctx.ellipse(0, -14 + bob, 8.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#c9a84c';
    ctx.stroke();

    // Dome
    ctx.beginPath();
    ctx.ellipse(0, -16.5 + bob, 5.5, 4, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gold emblem on hat
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-1.5, -17 + bob, 3, 2.5);
    ctx.fillRect(-0.5, -18 + bob, 1, 4);

    // Feather (Plume) on the hat
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(3, -15 + bob);
    ctx.quadraticCurveTo(7, -20 + bob, 10, -19 + bob);
    ctx.quadraticCurveTo(8, -16 + bob, 4, -14 + bob);
    ctx.fill();
    ctx.fillStyle = '#ff3333'; // red tip on feather
    ctx.beginPath();
    ctx.moveTo(6, -17 + bob);
    ctx.quadraticCurveTo(9, -20 + bob, 10, -19 + bob);
    ctx.quadraticCurveTo(8, -16 + bob, 7, -16 + bob);
    ctx.fill();

    // Concealed Ming Jian sword (straight sword) on back/hip
    ctx.save();
    ctx.translate(-5, 3 + bob);
    ctx.rotate(0.3);
    // Straight Scabbard
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(-1.5, -4, 3, 20);
    // Gold fittings
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-2, -4, 4, 2); // throat
    ctx.fillRect(-2, 4, 4, 2);  // mid ring
    ctx.fillRect(-2, 14, 4, 2); // tip (chape)
    // Crossguard
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-3, -6, 6, 2);
    // Handle (crimson wrap)
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(-1, -11, 2, 5);
    ctx.fillStyle = '#881111';
    ctx.fillRect(-1, -10, 2, 1);
    ctx.fillRect(-1, -8, 2, 1);
    // Pommel
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-1.5, -12, 3, 2);
    // Red tassel dropping from pommel
    ctx.fillStyle = '#dd3333';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(-3, -16, -2, -18);
    ctx.quadraticCurveTo(1, -15, 0, -12);
    ctx.fill();
    ctx.restore();

    // Age 4: imperial golden aura
    if (age >= 4) {
        ctx.globalAlpha = 0.06 + Math.sin(unit.animTimer * 3) * 0.03;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Upgrade badge
    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++) {
            ctx.fillRect(-8, 6 + bob - i * 4, 2, 2);
        }
    }
}

/** Phù Thuỷ Tối Thượng — Persian Supreme Sorcerer, mystical robe, crystal staff */
export function drawImmortal(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const legOffset = moving ? Math.sin(unit.animTimer * 18) * 3 : 0;
    const casting = unit.magiCastActive;
    let robeBase = casting ? '#1a2a5a' : (age >= 4 ? '#1e1040' : '#1a1a3a');
    const goldAccent = casting ? '#88ccff' : '#c9a84c';
    if (unit.slotColor && !casting) { const sc = unit.slotColor; const r = parseInt(sc.slice(1, 3), 16), g = parseInt(sc.slice(3, 5), 16), b2 = parseInt(sc.slice(5, 7), 16); robeBase = `rgb(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b2 * 0.4)})`; }

    // ── MYSTICAL TRAIL / MIST (behind body) ──
    if (moving || casting) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = casting ? '#4488ff' : '#6644aa';
        for (let t = 0; t < 3; t++) {
            const tx = -6 - t * 4 + Math.sin(unit.animTimer * 4 + t) * 3;
            const ty = 4 + bob + t * 3;
            ctx.beginPath();
            ctx.arc(tx, ty, 4 - t, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ── ROBE — flowing mystical robe ──
    // Lower robe / skirt
    ctx.fillStyle = robeBase;
    ctx.fillRect(-7, 5 + bob, 14, 14 + legOffset * 0.3);
    // Robe flutter at bottom
    ctx.fillRect(-8, 16 + bob, 4, 4 + Math.sin(unit.animTimer * 5) * 2);
    ctx.fillRect(5, 16 + bob, 4, 3 - Math.sin(unit.animTimer * 5) * 2);
    // Gold trim on robe bottom
    ctx.fillStyle = goldAccent;
    ctx.fillRect(-7, 17 + bob, 14, 1);

    // Upper robe / tunic
    ctx.fillStyle = robeBase;
    ctx.fillRect(-6, -5 + bob, 12, 12);
    // Rune patterns on chest
    ctx.fillStyle = casting ? '#44aaff' : '#4444aa';
    ctx.fillRect(-4, -3 + bob, 1, 6);
    ctx.fillRect(3, -3 + bob, 1, 6);
    ctx.fillRect(-2, -1 + bob, 4, 1);
    ctx.fillRect(-2, 2 + bob, 4, 1);
    // Center orb on chest
    ctx.fillStyle = casting ? '#88ddff' : '#8866cc';
    ctx.fillRect(-1, -1 + bob, 2, 2);

    // Gold collar / sash
    ctx.fillStyle = goldAccent;
    ctx.fillRect(-6, -5 + bob, 12, 2);
    ctx.fillRect(-3, -3 + bob, 6, 1);

    // ── SLEEVES — wide sorcerer sleeves ──
    ctx.fillStyle = robeBase;
    ctx.fillRect(-10, -4 + bob, 4, 12);
    ctx.fillRect(6, -4 + bob, 4, 12);
    // Sleeve flare at wrist
    ctx.fillRect(-11, 5 + bob, 5, 4);
    ctx.fillRect(6, 5 + bob, 5, 4);
    // Gold trim on sleeves
    ctx.fillStyle = goldAccent;
    ctx.fillRect(-11, 5 + bob, 5, 1);
    ctx.fillRect(6, 5 + bob, 5, 1);
    // Hands peeking from sleeves
    ctx.fillStyle = '#d4a87a';
    ctx.fillRect(-10, 7 + bob, 3, 2);
    ctx.fillRect(7, 7 + bob, 3, 2);

    // ── HEAD — face ──
    ctx.fillStyle = '#d4a87a';
    ctx.fillRect(-4, -12 + bob, 8, 9);
    // Arcane eyes — glowing
    ctx.fillStyle = casting ? '#ff4400' : (age >= 4 ? '#ffaa00' : '#888');
    ctx.fillRect(-3, -9 + bob, 2, 2);
    ctx.fillRect(1, -9 + bob, 2, 2);
    // Eye glow during cast
    if (casting) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-4, -10 + bob, 3, 3);
        ctx.fillRect(1, -10 + bob, 3, 3);
        ctx.globalAlpha = 1;
    }
    // Mystical beard (long, white/grey)
    ctx.fillStyle = age >= 4 ? '#ddd' : '#999';
    ctx.fillRect(-3, -5 + bob, 6, 3);
    ctx.fillRect(-2, -3 + bob, 4, 3);
    ctx.fillRect(-1, -1 + bob, 2, 2);

    // ── ZOROASTRIAN MAGI ATTIRE ──
    // Matha (traditional white/cream cap)
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(-5, -20 + bob, 10, 8);
    // Cap folds/texture
    ctx.fillStyle = '#e0e0d8';
    ctx.fillRect(-4, -18 + bob, 8, 2);
    ctx.fillRect(-5, -14 + bob, 10, 2);
    // Golden flame symbol on the cap
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(0, -18 + bob);
    ctx.quadraticCurveTo(-2, -15 + bob, 0, -14 + bob);
    ctx.quadraticCurveTo(2, -15 + bob, 0, -18 + bob);
    ctx.fill();

    // Padam (white cloth veil over mouth to protect sacred fire)
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(-5, -6 + bob, 10, 5);
    // Veil folds
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-3, -5 + bob, 1, 4);
    ctx.fillRect(2, -5 + bob, 1, 4);

    // ── SACRED FIRE SCEPTER (Afarghanyu) ──
    const staffFloat = Math.sin(unit.animTimer * 3) * 1.5;
    // Staff shaft
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(9, -20 + bob + staffFloat, 2, 28);
    // Gold spiral wrapping
    ctx.fillStyle = '#daa520';
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(9, -18 + bob + staffFloat + i * 3, 2, 1);
    }
    // Base pommel
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(8, 7 + bob + staffFloat, 4, 2);
    // Golden fire Chalice/Urn at the top
    ctx.fillStyle = '#daa520';
    ctx.fillRect(8, -22 + bob + staffFloat, 4, 2); // urn base
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(6, -26 + bob + staffFloat);
    ctx.lineTo(14, -26 + bob + staffFloat);
    ctx.lineTo(12, -22 + bob + staffFloat);
    ctx.lineTo(8, -22 + bob + staffFloat);
    ctx.closePath();
    ctx.fill();
    // Raging Eternal Flame (Atar) inside the chalice
    ctx.fillStyle = casting ? '#ff2200' : '#ff4400';
    ctx.beginPath();
    ctx.moveTo(10, -32 + bob + staffFloat);
    ctx.quadraticCurveTo(5, -28 + bob + staffFloat, 10, -26 + bob + staffFloat);
    ctx.quadraticCurveTo(15, -28 + bob + staffFloat, 10, -32 + bob + staffFloat);
    ctx.fill();
    // Inner bright yellow flame
    ctx.fillStyle = casting ? '#ffffff' : '#ffcc00';
    ctx.globalAlpha = 0.6 + Math.sin(unit.animTimer * 12) * 0.4;
    ctx.beginPath();
    ctx.moveTo(10, -30 + bob + staffFloat);
    ctx.quadraticCurveTo(7, -27 + bob + staffFloat, 10, -26 + bob + staffFloat);
    ctx.quadraticCurveTo(13, -27 + bob + staffFloat, 10, -30 + bob + staffFloat);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Orbiting fire embers around staff crystal
    if (casting || age >= 4) {
        for (let p = 0; p < 3; p++) {
            const pAngle = unit.animTimer * (casting ? 8 : 4) + p * (Math.PI * 2 / 3);
            const pr = casting ? 7 : 5;
            const px = 10 + Math.cos(pAngle) * pr;
            const py = -26 + bob + staffFloat + Math.sin(pAngle) * pr;
            ctx.fillStyle = casting ? '#ff8800' : '#ffcc00';
            ctx.fillRect(px - 1, py - 1, 2, 2);
        }
    }

    // ── CASTING AURA ──
    if (casting) {
        // Ice ring
        ctx.globalAlpha = 0.25 + Math.sin(unit.animTimer * 6) * 0.1;
        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2 + bob, 18 + Math.sin(unit.animTimer * 8) * 3, 0, Math.PI * 2);
        ctx.stroke();
        // Heal ring (green)
        ctx.strokeStyle = '#44ff88';
        ctx.beginPath();
        ctx.arc(0, 2 + bob, 14 + Math.sin(unit.animTimer * 6 + 1) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    } else if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = '#8866cc';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ── UPGRADE MARKS ──
    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++)
            ctx.fillRect(-9, 6 + bob - i * 4, 2, 2);
    }
}


/** Ninja — Yamato shinobi, sleek dark outfit, katana, flowing scarf */
export function drawNinja(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const legOffset = moving ? Math.sin(unit.animTimer * 24) * 4 : 0;
    const windSway = Math.sin(unit.animTimer * 3) * 2;
    let darkBase = age >= 4 ? '#0e0e28' : '#16162e';
    let accentColor = age >= 4 ? '#cc2244' : '#882244';
    if (unit.slotColor) { const sc = unit.slotColor; const r = parseInt(sc.slice(1, 3), 16), g = parseInt(sc.slice(3, 5), 16), b2 = parseInt(sc.slice(5, 7), 16); darkBase = `rgb(${Math.round(r * 0.3)},${Math.round(g * 0.3)},${Math.round(b2 * 0.3)})`; accentColor = sc; }

    // ---- Flowing scarf (behind body, dynamic) ----
    ctx.fillStyle = accentColor;
    ctx.save();
    ctx.translate(-3, -13 + bob);
    ctx.rotate(Math.sin(unit.animTimer * 5) * 0.15);
    ctx.fillRect(-2, 0, 3, 14 + windSway);
    ctx.fillRect(-3, 10 + windSway, 3, 6);
    ctx.fillRect(-4, 14 + windSway, 2, 4);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-5, 16 + windSway, 2, 3);
    ctx.globalAlpha = 1;
    ctx.restore();

    // ---- Legs — slim tabi pants with wraps ----
    ctx.fillStyle = darkBase;
    ctx.fillRect(-3, 10 + bob, 3, 9 + legOffset);
    ctx.fillRect(1, 10 + bob, 3, 9 - legOffset);
    // Tabi split-toe boots
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-4, 18 + bob + legOffset, 2, 3);
    ctx.fillRect(-2, 18 + bob + legOffset, 2, 3);
    ctx.fillRect(0, 18 + bob - legOffset, 2, 3);
    ctx.fillRect(2, 18 + bob - legOffset, 2, 3);
    // Shin wraps (sarashi)
    ctx.fillStyle = '#3a3a4e';
    for (let s = 0; s < 3; s++) {
        ctx.fillRect(-3, 11 + bob + s * 3 + legOffset * (s % 2 === 0 ? 1 : 0), 3, 1);
        ctx.fillRect(1, 11 + bob + s * 3 - legOffset * (s % 2 === 0 ? 1 : 0), 3, 1);
    }

    // Kunai holster on right thigh
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(3, 11 + bob - legOffset, 2, 5);
    ctx.fillStyle = '#888';
    ctx.fillRect(3, 11 + bob - legOffset, 1, 3);

    // ---- Katana on back (diagonal, behind body) ----
    ctx.save();
    ctx.translate(3, -4 + bob);
    ctx.rotate(-0.45);
    // Scabbard (saya)
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(-1.5, -24, 3, 22);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-1.5, -24, 3, 1); // scabbard top accent
    ctx.fillRect(-1.5, -3, 3, 1); // scabbard bottom accent
    // Handle (tsuka) — wrapped
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(-1.5, -2, 3, 8);
    // Diamond wrap pattern on handle
    ctx.fillStyle = '#444';
    ctx.fillRect(-1, -1, 1, 1);
    ctx.fillRect(0.5, 1, 1, 1);
    ctx.fillRect(-1, 3, 1, 1);
    ctx.fillRect(0.5, 5, 1, 1);
    // Guard (tsuba) — ornate
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#887744';
    ctx.fillRect(-3, -3, 6, 2);
    // Pommel
    ctx.fillStyle = accentColor;
    ctx.fillRect(-1, 6, 2, 1);
    ctx.restore();

    // ---- Body — tight shinobi shozoku ----
    ctx.fillStyle = darkBase;
    ctx.fillRect(-5, -4 + bob, 11, 15);
    // Chest armor plate (subtle)
    ctx.fillStyle = age >= 4 ? '#1a1a3a' : '#1e1e36';
    ctx.fillRect(-4, -3 + bob, 9, 6);
    // Diagonal chest strap
    ctx.fillStyle = '#3a3a4e';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(-4 + i * 1.5, -3 + bob + i * 2, 1.5, 2);
    }
    // Obi (waist sash)
    ctx.fillStyle = accentColor;
    ctx.fillRect(-5, 7 + bob, 11, 3);
    ctx.fillStyle = age >= 4 ? '#dd3355' : '#993355';
    ctx.fillRect(-4, 7 + bob, 3, 3); // knot
    // Smoke bomb pouch on belt
    ctx.fillStyle = '#333';
    ctx.fillRect(3, 7 + bob, 3, 2);
    ctx.fillStyle = '#555';
    ctx.fillRect(3, 7 + bob, 1.5, 1.5);
    ctx.fillRect(4.5, 7 + bob, 1.5, 1.5);

    // ---- Arms — wrapped with tekko (hand guards) ----
    ctx.fillStyle = darkBase;
    ctx.fillRect(-7, -2 + bob, 3, 10);
    ctx.fillRect(5, -2 + bob, 3, 10);
    // Arm wraps
    ctx.fillStyle = '#3a3a4e';
    ctx.fillRect(-7, 0 + bob, 3, 1);
    ctx.fillRect(-7, 3 + bob, 3, 1);
    ctx.fillRect(-7, 6 + bob, 3, 1);
    ctx.fillRect(5, 0 + bob, 3, 1);
    ctx.fillRect(5, 3 + bob, 3, 1);
    ctx.fillRect(5, 6 + bob, 3, 1);
    // Tekko (metal hand guards)
    ctx.fillStyle = '#555';
    ctx.fillRect(-8, 6 + bob, 4, 3);
    ctx.fillRect(5, 6 + bob, 4, 3);
    ctx.fillStyle = '#777';
    ctx.fillRect(-8, 6 + bob, 4, 1);
    ctx.fillRect(5, 6 + bob, 4, 1);

    // ---- Head — masked shinobi hood (compact) ----
    // Hood base (zukin)
    ctx.fillStyle = '#0e0e1e';
    ctx.fillRect(-4, -12 + bob, 8, 9);
    // Face mask (men) — only eyes exposed
    ctx.fillStyle = '#111';
    ctx.fillRect(-4, -8 + bob, 8, 4);
    // Skin around eyes
    ctx.fillStyle = '#c9a87a';
    ctx.fillRect(-3, -7 + bob, 6, 3);
    // Eyes — sharp, intense
    ctx.fillStyle = age >= 4 ? '#ff2244' : '#fff';
    ctx.fillRect(-2, -6 + bob, 2, 2);
    ctx.fillRect(1, -6 + bob, 2, 2);
    // Pupils
    ctx.fillStyle = age >= 4 ? '#aa0022' : '#111';
    ctx.fillRect(-1, -6 + bob, 1, 2);
    ctx.fillRect(2, -6 + bob, 1, 2);
    // Eye glint
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -6 + bob, 0.5, 0.5);
    ctx.fillRect(1, -6 + bob, 0.5, 0.5);

    // Hood top — pointed
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(-4, -14 + bob, 8, 3);
    ctx.fillRect(-3, -15 + bob, 6, 2);
    ctx.fillRect(-2, -16 + bob, 4, 2);

    // Hachimaki headband
    ctx.fillStyle = accentColor;
    ctx.fillRect(-5, -11 + bob, 10, 2);
    // Headband tails (flowing)
    ctx.save();
    ctx.translate(5, -10 + bob);
    ctx.rotate(Math.sin(unit.animTimer * 6) * 0.2);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, 5, 2);
    ctx.fillRect(3, 1, 4, 1.5);
    ctx.globalAlpha = 0.6;
    ctx.fillRect(6, 2, 3, 1);
    ctx.globalAlpha = 1;
    ctx.restore();

    // ---- Shuriken on chest (iconic) ----
    if (age >= 3) {
        ctx.fillStyle = '#aaa';
        ctx.save();
        ctx.translate(-1, 2 + bob);
        ctx.rotate(unit.animTimer * 0.5);
        ctx.fillRect(-1, -4, 2, 8);  // vertical
        ctx.fillRect(-4, -1, 8, 2);  // horizontal
        // Points
        ctx.fillRect(-2, -3, 1, 1);
        ctx.fillRect(1, 2, 1, 1);
        ctx.fillRect(-3, 1, 1, 1);
        ctx.fillRect(2, -2, 1, 1);
        ctx.restore();
    }

    // ---- Age 4: Shadow aura with purple energy ----
    if (age >= 4) {
        ctx.globalAlpha = 0.08 + Math.sin(unit.animTimer * 4) * 0.04;
        ctx.fillStyle = '#6600cc';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        // Inner glow
        ctx.fillStyle = '#aa00ff';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ---- Moving: shadow afterimages ----
    if (moving) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#4400aa';
        ctx.fillRect(-8, -4 + bob, 3, 14);
        ctx.globalAlpha = 0.04;
        ctx.fillRect(-12, -2 + bob, 3, 10);
        ctx.globalAlpha = 1;
    }

    // Upgrade stars
    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = '#8800ff';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++)
            ctx.fillRect(-7, 6 + bob - i * 4, 2, 2);
    }
}

/** Centurion — La Mã commander, red-crested helmet, scutum shield, gladius */
export function drawCenturion(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const legOffset = moving ? Math.sin(unit.animTimer * 20) * 3 : 0;
    let tunicColor = '#8a2222';
    let shieldColor = '#aa2222';
    let shieldLight = '#cc3333';
    if (unit.slotColor) { const sc = unit.slotColor; const r = parseInt(sc.slice(1, 3), 16), g = parseInt(sc.slice(3, 5), 16), b2 = parseInt(sc.slice(5, 7), 16); tunicColor = `rgb(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b2 * 0.6)})`; shieldColor = `rgb(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b2 * 0.7)})`; shieldLight = sc; }

    let bodyTilt = 0;
    let frontLegLift = 0;
    let frontLegFwd = 0;

    if (unit.centurionMode === 'spear' && unit.state === UnitState.Attacking) {
        const cd = unit.centurionPilumCooldown;
        if (cd > 2.7) {
            bodyTilt = 0.2 * ((3.0 - cd) / 0.3);
        } else if (cd > 1.0) {
            bodyTilt = 0;
        } else if (cd > 0.15) {
            const prepProgress = 1 - ((cd - 0.15) / 0.85);
            bodyTilt = -0.25 * prepProgress;
            frontLegLift = prepProgress * 6;
            frontLegFwd = prepProgress * 3;
        } else {
            const swingProgress = cd <= 0 ? 1 : 1 - (cd / 0.15);
            bodyTilt = -0.25 + (0.45 * swingProgress);
            frontLegLift = 6 * (1 - swingProgress);
            frontLegFwd = 3 * (1 - swingProgress);
        }
    }

    ctx.save();
    if (bodyTilt !== 0) {
        ctx.translate(0, 16 + bob);
        ctx.rotate(bodyTilt);
        ctx.translate(0, -(16 + bob));
    }

    // Legs — tunic + sandals
    ctx.fillStyle = tunicColor;
    ctx.fillRect(-4, 10 + bob, 4, 7 + legOffset);
    ctx.fillRect(1 + frontLegFwd, 10 + bob - frontLegLift, 4, 7 - legOffset);
    // Greaves (shin armor)
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#aa8844';
    ctx.fillRect(-4, 13 + bob + legOffset, 4, 4);
    ctx.fillRect(1 + frontLegFwd, 13 + bob - legOffset - frontLegLift, 4, 4);
    // Sandals
    ctx.fillStyle = '#5a3020';
    ctx.fillRect(-5, 16 + bob + legOffset, 5, 3);
    ctx.fillRect(0 + frontLegFwd, 16 + bob - legOffset - frontLegLift, 5, 3);

    // Large Scutum shield (behind body, on RIGHT side)
    ctx.fillStyle = shieldColor;
    ctx.fillRect(5, -8 + bob, 7, 20); // Changed from -12 to 5
    ctx.fillStyle = shieldLight;
    ctx.fillRect(6, -7 + bob, 5, 18); // Changed from -11 to 6
    // Shield golden eagle emblem
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(7, -2 + bob, 3, 3);  // Changed from -10 to 7
    ctx.fillRect(6, -1 + bob, 5, 1);  // Changed from -11 to 6
    ctx.fillRect(7, 1 + bob, 1, 3);   // Changed from -10 to 7
    ctx.fillRect(9, 1 + bob, 1, 3);   // Changed from -8 to 9
    // Shield boss (center circle)
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(7, 0 + bob, 3, 3);   // Changed from -10 to 7

    // Body — tunic with segmented armor (lorica segmentata)
    ctx.fillStyle = shieldLight;
    ctx.fillRect(-6, -5 + bob, 12, 16);
    // Metal segmented plates
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#aa8844';
    ctx.fillRect(-6, -5 + bob, 12, 2);
    ctx.fillRect(-6, -1 + bob, 12, 2);
    ctx.fillRect(-6, 3 + bob, 12, 2);
    ctx.fillRect(-6, 7 + bob, 12, 2);
    // Belt
    ctx.fillStyle = '#5a3020';
    ctx.fillRect(-6, 8 + bob, 12, 2);
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-2, 8 + bob, 4, 2); // belt buckle

    // Cape (moved to left side)
    ctx.fillStyle = shieldColor;
    ctx.fillRect(-9, -4 + bob, 4, 16);

    // Shoulder armor
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#aa8844';
    ctx.fillRect(-8, -5 + bob, 4, 5);
    ctx.fillRect(4, -5 + bob, 4, 5);

    // Head
    ctx.fillStyle = '#d4a87a';
    ctx.fillRect(-4, -12 + bob, 8, 9);
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, -8 + bob, 2, 2);
    ctx.fillRect(1, -8 + bob, 2, 2);

    // Centurion helmet with red crest (transverse)
    ctx.fillStyle = age >= 4 ? '#c9a84c' : '#aa8844';
    ctx.fillRect(-5, -16 + bob, 10, 6);
    // Face guard
    ctx.fillRect(-5, -11 + bob, 2, 4);
    ctx.fillRect(3, -11 + bob, 2, 4);
    // Nose guard
    ctx.fillStyle = '#888';
    ctx.fillRect(-1, -11 + bob, 2, 5);
    // CREST (transverse — goes side to side, not front to back)
    ctx.fillStyle = shieldLight;
    ctx.fillRect(-7, -19 + bob, 14, 4);
    ctx.fillStyle = shieldColor;
    ctx.fillRect(-6, -20 + bob, 12, 2);

    // Weapon — mode-dependent
    if (unit.centurionShielding) {
        // ⚔ SHIELD RAISED STANCE (Holding up shield on RIGHT arm)
        ctx.fillStyle = shieldColor;
        ctx.fillRect(-2, -12 + bob, 10, 24); // Moved visual center to right
        ctx.fillStyle = shieldLight;
        ctx.fillRect(-1, -11 + bob, 8, 22);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(1, -2 + bob, 4, 4);
        ctx.fillRect(0, -1 + bob, 6, 2);
        ctx.fillStyle = '#ffee88';
        ctx.fillRect(1, 0 + bob, 4, 3);
        // Spear overhead (moved to LEFT arm)
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-8, -20 + bob, 2, 26);
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(-7, -22 + bob);
        ctx.lineTo(-9, -18 + bob);
        ctx.lineTo(-5, -18 + bob);
        ctx.closePath();
        ctx.fill();
        // Golden glow
        ctx.globalAlpha = 0.15 + Math.sin(unit.animTimer * 6) * 0.08;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else if (unit.centurionMode === 'sword') {
        // ⚔ SWORD MODE — Gladius (on LEFT arm)
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-9, -4 + bob, 2, 14);
        ctx.fillStyle = '#eee';
        ctx.fillRect(-9, -3 + bob, 2, 2); // blade shine
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(-8, -6 + bob);
        ctx.lineTo(-10, -3 + bob);
        ctx.lineTo(-6, -3 + bob);
        ctx.closePath();
        ctx.fill();
        // Guard
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(-11, -4 + bob, 6, 2);
        // Pommel
        ctx.fillRect(-10, 10 + bob, 4, 3);
        // Melee hit counter glow (shows progress to explosion)
        if (unit.centurionMeleeHits > 0) {
            for (let hi = 0; hi < unit.centurionMeleeHits; hi++) {
                ctx.fillStyle = hi >= 3 ? '#ff4400' : '#ffaa00';
                ctx.fillRect(-8 + hi * 4, -24 + bob, 3, 3);
            }
        }
        // Red combat aura
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#ff2200';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else {
        // 🏹 SPEAR MODE — Pilum (only draw on body when NOT attacking AND NOT on cooldown)
        const isAttackingInRange = unit.state === UnitState.Attacking && (
            (unit.attackTarget && unit.attackTarget.alive && Math.hypot(unit.attackTarget.x - unit.x, unit.attackTarget.y - unit.y) <= unit.centurionSpearRange) ||
            (unit.attackBuildingTarget && unit.attackBuildingTarget.alive && Math.hypot(unit.attackBuildingTarget.x - unit.x, unit.attackBuildingTarget.y - unit.y) <= unit.centurionSpearRange + (unit.attackBuildingTarget.tileW * TILE_SIZE * 0.4))
        );
        if (!isAttackingInRange && unit.centurionPilumCooldown <= 0) {
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(-9, -14 + bob, 2, 28); // Moved to left side (-9 instead of 7)

            // Iron shank
            ctx.fillStyle = '#a0a8b8';
            ctx.fillRect(-8.5, -26 + bob, 1, 12);

            // Weight block
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(-10, -15 + bob, 4, 3);
            ctx.fillStyle = '#8a8888';
            ctx.fillRect(-10.5, -14 + bob, 5, 1);

            // Spearhead
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(-8, -32 + bob);
            ctx.lineTo(-10, -26 + bob);
            ctx.lineTo(-6, -26 + bob);
            ctx.closePath();
            ctx.fill();

            // Head shine
            ctx.fillStyle = '#fff';
            ctx.fillRect(-8, -31 + bob, 0.5, 5);
        }
    }

    // Age 4 imperial glow
    if (age >= 4) {
        ctx.globalAlpha = 0.07 + Math.sin(unit.animTimer * 3) * 0.04;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++)
            ctx.fillRect(8, 6 + bob - i * 4, 2, 2);
    }

    ctx.restore();
}

/** Ulfhednar — Thunder warrior (Thor-inspired), winged helmet, sword, armored */
export function drawUlfhednar(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 4 : 0;
    const rage = unit.ulfhednarRageActive;
    let capeColor = rage ? '#2255cc' : '#aa2222';
    let capeHighlight = rage ? '#3366dd' : '#cc3333';
    if (unit.slotColor && !rage) { capeColor = unit.slotColor; const sc = unit.slotColor; const r = parseInt(sc.slice(1, 3), 16), g = parseInt(sc.slice(3, 5), 16), b2 = parseInt(sc.slice(5, 7), 16); capeHighlight = `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b2 + 40)})`; }

    // ── RED CAPE (behind body) ──
    ctx.fillStyle = capeColor;
    ctx.fillRect(-10, -6 + bob, 5, 20);
    ctx.fillRect(6, -6 + bob, 5, 18);
    // Cape bottom flutter
    const capeFlutter = Math.sin(unit.animTimer * 6) * 2;
    ctx.fillRect(-11, 12 + bob + capeFlutter, 6, 4);
    ctx.fillRect(6, 11 + bob - capeFlutter, 6, 4);
    // Cape highlight
    ctx.fillStyle = capeHighlight;
    ctx.fillRect(-10, -6 + bob, 5, 3);
    ctx.fillRect(6, -6 + bob, 5, 3);

    // ── LEGS — armored boots ──
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(-4, 10 + bob, 4, 8 + legOffset);
    ctx.fillRect(1, 10 + bob, 4, 8 - legOffset);
    // Metal shin guards
    ctx.fillStyle = '#777';
    ctx.fillRect(-4, 11 + bob + legOffset, 4, 3);
    ctx.fillRect(1, 11 + bob - legOffset, 4, 3);
    // Boots
    ctx.fillStyle = '#333';
    ctx.fillRect(-5, 17 + bob + legOffset, 5, 3);
    ctx.fillRect(0, 17 + bob - legOffset, 5, 3);
    ctx.fillStyle = '#555';
    ctx.fillRect(-5, 17 + bob + legOffset, 5, 1);
    ctx.fillRect(0, 17 + bob - legOffset, 5, 1);

    // ── BODY — chainmail armor over tunic ──
    // Dark tunic base
    ctx.fillStyle = rage ? '#1a2a4a' : '#2a2a3a';
    ctx.fillRect(-6, -4 + bob, 12, 15);
    // Chainmail overlay
    ctx.fillStyle = rage ? '#5588bb' : '#666';
    ctx.fillRect(-6, -4 + bob, 12, 10);
    // Chainmail pattern (small dots)
    ctx.fillStyle = rage ? '#6699cc' : '#888';
    for (let cy = 0; cy < 4; cy++) {
        for (let cx = 0; cx < 5; cx++) {
            ctx.fillRect(-5 + cx * 2.5, -3 + cy * 2.5 + bob, 1, 1);
        }
    }
    // Armor chest plate center
    ctx.fillStyle = rage ? '#4477aa' : '#777';
    ctx.fillRect(-3, -3 + bob, 6, 8);
    ctx.fillStyle = rage ? '#5588bb' : '#888';
    ctx.fillRect(-2, -2 + bob, 4, 6);

    // ── GOLDEN BELT with emblem ──
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-6, 8 + bob, 12, 3);
    ctx.fillStyle = '#dab85c';
    ctx.fillRect(-6, 8 + bob, 12, 1);
    // Belt buckle — lightning bolt emblem
    ctx.fillStyle = rage ? '#88ccff' : '#ffd700';
    ctx.fillRect(-1, 8 + bob, 2, 3);
    ctx.fillRect(-2, 9 + bob, 1, 1);
    ctx.fillRect(1, 9 + bob, 1, 1);

    // ── ARMS — muscular with metal bracers ──
    ctx.fillStyle = '#c4a070'; // skin
    ctx.fillRect(-9, -3 + bob, 3, 10);
    ctx.fillRect(6, -3 + bob, 3, 10);
    // Metal bracers/gauntlets
    ctx.fillStyle = rage ? '#5588bb' : '#777';
    ctx.fillRect(-9, 2 + bob, 3, 4);
    ctx.fillRect(6, 2 + bob, 3, 4);
    ctx.fillStyle = rage ? '#6699cc' : '#999';
    ctx.fillRect(-9, 2 + bob, 3, 1);
    ctx.fillRect(6, 2 + bob, 3, 1);
    // Shoulder pauldrons
    ctx.fillStyle = rage ? '#5588bb' : '#888';
    ctx.fillRect(-9, -4 + bob, 4, 3);
    ctx.fillRect(6, -4 + bob, 4, 3);
    ctx.fillStyle = rage ? '#6699cc' : '#aaa';
    ctx.fillRect(-9, -4 + bob, 4, 1);
    ctx.fillRect(6, -4 + bob, 4, 1);

    // ── HEAD — face ──
    ctx.fillStyle = '#c4a070';
    ctx.fillRect(-4, -12 + bob, 8, 9);
    // Eyes — glowing electric during rage
    ctx.fillStyle = rage ? '#44ddff' : (age >= 4 ? '#ff6600' : '#fff');
    ctx.fillRect(-3, -8 + bob, 2, 2);
    ctx.fillRect(1, -8 + bob, 2, 2);
    ctx.fillStyle = rage ? '#88eeff' : '#111';
    ctx.fillRect(-2, -8 + bob, 1, 2);
    ctx.fillRect(2, -8 + bob, 1, 2);
    // Golden beard (Thor-like)
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(-3, -5 + bob, 6, 3);
    ctx.fillRect(-2, -3 + bob, 4, 2);
    ctx.fillRect(-1, -3 + bob, 2, 2);

    // ── VIKING HELMET — winged ──
    ctx.fillStyle = '#888';
    ctx.fillRect(-5, -16 + bob, 10, 6);
    // Helmet dome
    ctx.fillStyle = '#999';
    ctx.fillRect(-4, -17 + bob, 8, 3);
    ctx.fillRect(-3, -18 + bob, 6, 2);
    // Helmet brim
    ctx.fillStyle = '#777';
    ctx.fillRect(-6, -11 + bob, 12, 2);
    // Nose guard
    ctx.fillStyle = '#aaa';
    ctx.fillRect(-1, -12 + bob, 2, 4);
    // ── HELMET WINGS — iconic! ──
    const wingColor = rage ? '#44aaff' : '#ccc';
    const wingGlow = rage ? '#88ddff' : '#ddd';
    // Left wing
    ctx.fillStyle = wingColor;
    ctx.fillRect(-9, -18 + bob, 3, 2);
    ctx.fillRect(-11, -20 + bob, 3, 3);
    ctx.fillRect(-12, -22 + bob, 2, 3);
    ctx.fillStyle = wingGlow;
    ctx.fillRect(-10, -19 + bob, 2, 1);
    ctx.fillRect(-12, -22 + bob, 1, 2);
    // Right wing
    ctx.fillStyle = wingColor;
    ctx.fillRect(6, -18 + bob, 3, 2);
    ctx.fillRect(8, -20 + bob, 3, 3);
    ctx.fillRect(10, -22 + bob, 2, 3);
    ctx.fillStyle = wingGlow;
    ctx.fillRect(8, -19 + bob, 2, 1);
    ctx.fillRect(11, -22 + bob, 1, 2);

    // ── SWORD — large Viking sword ──
    const swordBob = rage ? Math.sin(unit.animTimer * 10) * 1.5 : 0;
    // Blade
    ctx.fillStyle = rage ? '#88ccff' : '#ccc';
    ctx.fillRect(9, -12 + bob + swordBob, 2, 18);
    // Blade edge highlight
    ctx.fillStyle = rage ? '#aaddff' : '#eee';
    ctx.fillRect(9, -12 + bob + swordBob, 1, 18);
    // Sword tip
    ctx.fillStyle = rage ? '#88ccff' : '#ccc';
    ctx.beginPath();
    ctx.moveTo(10, -14 + bob + swordBob);
    ctx.lineTo(9, -12 + bob + swordBob);
    ctx.lineTo(11, -12 + bob + swordBob);
    ctx.closePath();
    ctx.fill();
    // Cross-guard
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(7, 5 + bob + swordBob, 6, 2);
    // Grip
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(9, 7 + bob + swordBob, 2, 4);
    // Pommel
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(8, 11 + bob + swordBob, 4, 2);

    // Sword lightning crackle during rage
    if (rage) {
        ctx.globalAlpha = 0.7 + Math.sin(unit.animTimer * 15) * 0.3;
        ctx.strokeStyle = '#88eeff';
        ctx.lineWidth = 1;
        const sx = 10, sy = -10 + bob + swordBob;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 2, sy + 4);
        ctx.lineTo(sx + 2, sy + 7);
        ctx.lineTo(sx - 1, sy + 12);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // ── RAGE EFFECTS — electric aura ──
    if (rage || age >= 4) {
        const pulseSpeed = rage ? 8 : 5;
        ctx.globalAlpha = rage ? (0.2 + Math.sin(unit.animTimer * pulseSpeed) * 0.1) : (0.1 + Math.sin(unit.animTimer * 5) * 0.06);
        ctx.fillStyle = rage ? '#4488ff' : '#ff6600';
        ctx.beginPath();
        ctx.arc(0, 0 + bob, rage ? 20 : 16, 0, Math.PI * 2);
        ctx.fill();
        // Rotating electric arcs during rage
        if (rage) {
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = '#88ccff';
            ctx.lineWidth = 1.5;
            for (let arc = 0; arc < 4; arc++) {
                const arcAngle = unit.animTimer * 5 + arc * (Math.PI * 0.5);
                const r1 = 12 + Math.sin(unit.animTimer * 14 + arc * 2) * 5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(arcAngle) * 4, bob + Math.sin(arcAngle) * 4);
                ctx.lineTo(Math.cos(arcAngle + 0.2) * r1, bob + Math.sin(arcAngle + 0.2) * r1);
                ctx.lineTo(Math.cos(arcAngle + 0.5) * (r1 + 2), bob + Math.sin(arcAngle + 0.5) * (r1 + 2));
                ctx.stroke();
            }
            // Inner glow ring
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#88ddff';
            ctx.beginPath();
            ctx.arc(0, -2 + bob, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ── UPGRADE MARKS ──
    if (unit.upgradeLevel > 0) {
        ctx.fillStyle = rage ? '#88ccff' : '#ffd700';
        for (let i = 0; i < Math.min(unit.upgradeLevel, 3); i++)
            ctx.fillRect(-9, 6 + bob - i * 4, 2, 2);
    }
}
