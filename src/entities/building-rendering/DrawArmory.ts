// ============================================================
//  Armory Renderer — Military equipment shop building
//  Displays weapon & armor racks, shield displays, and
//  a golden equipment glow to distinguish from Blacksmith
// ============================================================

import type { Building } from "../Building";
import { CivilizationType } from "../../config/GameConfig";
import { getCivBuildingColors } from "./BuildingColors";

export function drawArmory(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const cc = getCivBuildingColors(b);
    const age = b.age;

    // === FOUNDATION ===
    ctx.fillStyle = '#4a4848';
    ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
    ctx.fillStyle = '#5a5858';
    ctx.fillRect(x + 2, y + h - 8, w - 4, 3);

    // === WALLS ===
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 20);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 24);
    // Left highlight
    ctx.fillStyle = cc.wallHi;
    ctx.fillRect(x + 6, y + 14, 3, h - 24);

    // === ROOF — flat fortified style ===
    ctx.fillStyle = cc.roofDark;
    ctx.fillRect(x - 3, y + 4, w + 6, 14);
    ctx.fillStyle = cc.roofMain;
    ctx.fillRect(x - 1, y + 2, w + 2, 12);
    ctx.fillStyle = cc.roofLight;
    ctx.fillRect(x - 1, y + 2, w + 2, 3);
    // Battlements (crenellations)
    const crenW = 6, crenGap = 5;
    for (let cx2 = x; cx2 < x + w; cx2 += crenW + crenGap) {
        ctx.fillStyle = cc.roofDark;
        ctx.fillRect(cx2, y - 2, crenW, 6);
        ctx.fillStyle = cc.roofMain;
        ctx.fillRect(cx2 + 1, y - 1, crenW - 2, 4);
    }

    // === DOOR ===
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x + w / 2 - 8, y + h - 28, 16, 20);
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + w / 2 - 6, y + h - 26, 12, 16);
    // Iron bands on door
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(x + w / 2 - 6, y + h - 24, 12, 2);
    ctx.fillRect(x + w / 2 - 6, y + h - 18, 12, 2);

    // === WEAPON RACK (left side) ===
    // Post
    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(x + 10, y + 18, 2, 28);
    // Sword blades
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x + 6, y + 20, 10, 2);
    ctx.fillRect(x + 8, y + 28, 8, 2);
    if (age >= 3) ctx.fillRect(x + 6, y + 36, 10, 2);
    // Sword handles
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x + 6, y + 22, 2, 3);
    ctx.fillRect(x + 8, y + 30, 2, 3);

    // === ARMOR STAND (right side) ===
    // Stand post
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(x + w - 14, y + 18, 2, 28);
    // Chest plate armor shape
    ctx.fillStyle = '#888';
    ctx.fillRect(x + w - 20, y + 20, 12, 14);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(x + w - 18, y + 22, 8, 10);
    // Helmet on top
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.arc(x + w - 14, y + 20, 4, Math.PI, 0);
    ctx.fill();

    // === SHIELD on wall (team colored) ===
    ctx.fillStyle = cc.teamColor;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 6, y + 22);
    ctx.lineTo(x + w / 2 + 6, y + 22);
    ctx.lineTo(x + w / 2 + 6, y + 33);
    ctx.lineTo(x + w / 2, y + 37);
    ctx.lineTo(x + w / 2 - 6, y + 33);
    ctx.closePath();
    ctx.fill();
    // Shield emblem (crossed swords)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 4, y + 25);
    ctx.lineTo(x + w / 2 + 4, y + 33);
    ctx.moveTo(x + w / 2 + 4, y + 25);
    ctx.lineTo(x + w / 2 - 4, y + 33);
    ctx.stroke();

    // === GOLDEN GLOW (distinguishes from Blacksmith) ===
    if (age >= 3) {
        ctx.globalAlpha = 0.05 + Math.sin(Date.now() / 700) * 0.025;
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // === BANNER (hanging from roof) ===
    ctx.fillStyle = cc.teamColor;
    ctx.fillRect(x + 3, y + 10, 6, 18);
    // Banner wave
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x + 3, y + 14, 6, 2);
    ctx.fillRect(x + 3, y + 20, 6, 2);
    // Banner tip
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 28);
    ctx.lineTo(x + 6, y + 32);
    ctx.lineTo(x + 9, y + 28);
    ctx.closePath();
    ctx.fill();
}
