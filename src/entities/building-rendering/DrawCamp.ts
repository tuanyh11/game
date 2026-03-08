// ============================================================
//  Camp (Market) Renderer — Civilization-specific market drawing
//  Each civ has unique warehouse/storage style
// ============================================================

import type { Building } from "../Building";
import { CivilizationType, C } from "../../config/GameConfig";
import { getCivBuildingColors, CivBuildingColors } from "./BuildingColors";

export function drawCamp(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string): void {
    const age = b.age;
    const isWood = accent === C.wood;
    const cc = getCivBuildingColors(b);
    switch (b.civilization) {
        case CivilizationType.BaTu: drawCamp_BaTu(ctx, x, y, w, h, cc, age, isWood, accent); break;
        case CivilizationType.DaiMinh: drawCamp_DaiMinh(ctx, x, y, w, h, cc, age, isWood, accent); break;
        case CivilizationType.Yamato: drawCamp_Yamato(ctx, x, y, w, h, cc, age, isWood, accent); break;
        case CivilizationType.Viking: drawCamp_Viking(ctx, x, y, w, h, cc, age, isWood, accent); break;
        default: drawCamp_LaMa(ctx, x, y, w, h, cc, age, isWood, accent); break;
    }
}

function drawResourcePile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, age: number, isWood: boolean, accent: string): void {
    if (isWood) {
        const logColors = age >= 3
            ? ['#5a4828', '#6a5830', '#4a3820', '#7a6838']
            : ['#6a4828', '#7a5830', '#5a3820', '#8a6838'];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4 - row; col++) {
                const lx = x + 8 + col * 10 + row * 5;
                const ly = y + h - 20 - row * 8;
                ctx.fillStyle = logColors[(row + col) % logColors.length];
                ctx.fillRect(lx, ly, 9, 7);
                ctx.fillStyle = '#c9a060';
                ctx.fillRect(lx + 3, ly + 2, 3, 3);
            }
        }
    } else {
        const oreColors = accent === C.gold
            ? ['#c9a040', '#dab050', '#b09030', '#e0c060']
            : ['#7a8a9a', '#8a9aaa', '#6a7a8a', '#9aaaba'];
        for (let i = 0; i < 6; i++) {
            const ox = x + 8 + (i % 3) * 14 + (i > 2 ? 7 : 0);
            const oy = y + h - 18 - (i > 2 ? 10 : 0);
            ctx.fillStyle = oreColors[i % oreColors.length];
            ctx.beginPath();
            ctx.arc(ox + 5, oy + 4, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(ox + 3, oy + 1, 3, 2);
        }
    }
}

// ---- BA TƯ: Persian bazaar-style storage ----
function drawCamp_BaTu(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number, isWood: boolean, accent: string): void {
    ctx.fillStyle = '#b0a080';
    ctx.fillRect(x + 4, y + h - 6, w - 8, 6);

    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 22);
    ctx.fillStyle = cc.wallHi;
    ctx.fillRect(x + 6, y + 14, 3, h - 22);
    ctx.fillStyle = 'rgba(201,168,76,0.08)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 6, y + 18 + i * 12, w - 12, 1);

    // Flat roof + small dome
    ctx.fillStyle = cc.roofDark;
    ctx.fillRect(x - 2, y + 6, w + 4, 10);
    ctx.fillStyle = cc.roofMain;
    ctx.fillRect(x, y + 4, w, 8);
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x - 2, y + 3, w + 4, 2);

    // Small archway opening
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(x + w / 2 - 10, y + h - 30, 20, 24);
    ctx.fillStyle = '#2a1e14';
    ctx.fillRect(x + w / 2 - 8, y + h - 28, 16, 20);
    ctx.fillStyle = cc.accentColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - 30, 10, Math.PI, 0);
    ctx.fill();

    drawResourcePile(ctx, x, y, w, h, age, isWood, accent);

    // Sign with accent
    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(x + 10, y + 16, 2, 18);
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x + 4, y + 14, 16, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, y + 16, 12, 6);

    if (age >= 4) {
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = cc.accentColor;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ---- ĐẠI TỐNG: Chinese storehouse with curved eaves ----
function drawCamp_DaiMinh(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number, isWood: boolean, accent: string): void {
    ctx.fillStyle = '#5a5a58';
    ctx.fillRect(x - 2, y + h - 6, w + 4, 6);

    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 22);
    ctx.fillStyle = '#8a2222';
    ctx.fillRect(x + 4, y + 12, 4, h - 18);
    ctx.fillRect(x + w - 8, y + 12, 4, h - 18);

    // Curved eave roof
    const ov = age >= 3 ? 8 : 4;
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - ov, y + 16);
    ctx.quadraticCurveTo(x + w / 2, y - 2, x + w + ov, y + 16);
    ctx.lineTo(x + w + ov, y + 20);
    ctx.quadraticCurveTo(x + w / 2, y + 2, x - ov, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(x - ov + 2, y + 14);
    ctx.quadraticCurveTo(x + w / 2, y, x + w + ov - 2, y + 14);
    ctx.lineTo(x + w + ov - 2, y + 18);
    ctx.quadraticCurveTo(x + w / 2, y + 4, x - ov + 2, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofLight;
    ctx.fillRect(x - ov, y + 12, 3, 3);
    ctx.fillRect(x + w + ov - 3, y + 12, 3, 3);

    ctx.fillStyle = '#1a1008';
    ctx.fillRect(x + w / 2 - 10, y + h - 30, 20, 24);
    ctx.fillStyle = '#2a1e14';
    ctx.fillRect(x + w / 2 - 8, y + h - 28, 16, 20);
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(x + w / 2 - 1, y + h - 28, 2, 20);

    drawResourcePile(ctx, x, y, w, h, age, isWood, accent);

    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(x + 10, y + 16, 2, 18);
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(x + 4, y + 14, 16, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, y + 16, 12, 6);

    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - ov, y + 13, w + ov * 2, 2);
    }
}

// ---- YAMATO: Clean wood storehouse ----
function drawCamp_Yamato(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number, isWood: boolean, accent: string): void {
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(x + 2, y + h - 6, w - 4, 6);

    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 22);
    // Wood frame
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(x + 4, y + 12, w - 8, 2);
    ctx.fillRect(x + 4, y + 12, 3, h - 18);
    ctx.fillRect(x + w - 7, y + 12, 3, h - 18);

    // Steep roof
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 14);
    ctx.lineTo(x + w / 2, y - 6);
    ctx.lineTo(x + w + 6, y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 12);
    ctx.lineTo(x + w / 2, y - 4);
    ctx.lineTo(x + w + 4, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(x - 4, y + 12, w + 8, 2);

    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - 8, y + h - 28, 16, 22);
    ctx.fillStyle = '#f0e8d0';
    ctx.fillRect(x + w / 2 - 6, y + h - 26, 6, 18);
    ctx.fillRect(x + w / 2 + 1, y + h - 26, 6, 18);
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(x + w / 2 - 1, y + h - 28, 2, 22);

    drawResourcePile(ctx, x, y, w, h, age, isWood, accent);

    ctx.fillStyle = '#2a2018';
    ctx.fillRect(x + 10, y + 16, 2, 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 4, y + 14, 16, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, y + 16, 12, 6);
}

// ---- LA MÃ: Classical stone warehouse ----
function drawCamp_LaMa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number, isWood: boolean, accent: string): void {
    const baseColor = age >= 2 ? '#5a5a58' : '#4a4540';

    ctx.fillStyle = baseColor;
    ctx.fillRect(x + 4, y + h - 6, w - 8, 6);
    if (age >= 2) {
        ctx.fillStyle = '#6a6a68';
        ctx.fillRect(x + 4, y + h - 6, w - 8, 2);
    }

    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 22);
    ctx.fillStyle = cc.wallHi;
    ctx.fillRect(x + 6, y + 14, 3, h - 22);

    // Stone block texture
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let row = 0; row < 3; row++) {
        const by = y + 20 + row * 16;
        ctx.fillRect(x + 6, by, w - 12, 1);
    }

    // Small columns
    if (age >= 2) {
        for (const cx of [x + 8, x + w - 12]) {
            ctx.fillStyle = cc.wallHi;
            ctx.fillRect(cx, y + 14, 4, h - 22);
            ctx.fillStyle = cc.accentColor;
            ctx.fillRect(cx - 1, y + 12, 6, 2);
        }
    }

    // Flat roof + pediment
    ctx.fillStyle = cc.roofDark;
    ctx.fillRect(x - 2, y + 6, w + 4, 10);
    ctx.fillStyle = cc.roofMain;
    ctx.fillRect(x, y + 4, w, 8);
    ctx.fillStyle = cc.roofLight;
    ctx.fillRect(x, y + 4, w, 3);
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x - 2, y + 3, w + 4, 2);

    ctx.fillStyle = '#0a0a08';
    ctx.fillRect(x + w / 2 - 10, y + h - 32, 20, 26);
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(x + w / 2 - 8, y + h - 30, 16, 22);
    if (age >= 3) {
        ctx.fillStyle = '#5a5a58';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - 32, 10, Math.PI, 0);
        ctx.fill();
    }

    drawResourcePile(ctx, x, y, w, h, age, isWood, accent);

    ctx.fillStyle = '#4a4a48';
    ctx.fillRect(x + 10, y + 16, 2, 18);
    ctx.fillStyle = '#6a6a68';
    ctx.fillRect(x + 4, y + 14, 16, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, y + 16, 12, 6);

    if (age >= 3) {
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(x + 4, y + 12, 4, h - 18);
        ctx.fillRect(x + w - 8, y + 12, 4, h - 18);
    }

    if (age >= 4) {
        ctx.fillStyle = cc.accentColor;
        ctx.fillRect(x - 2, y + 2, w + 4, 2);
    }
}

// ---- VIKING: Wooden storehouse with earth roof ----
function drawCamp_Viking(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number, isWood: boolean, accent: string): void {
    ctx.fillStyle = '#3a3028';
    ctx.fillRect(x + 2, y + h - 6, w - 4, 6);

    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 22);
    // Log lines
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 6, y + 16 + i * 8, w - 12, 2);
    // Corner logs
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 2, y + 12, 4, h - 18);
    ctx.fillRect(x + w - 6, y + 12, 4, h - 18);
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(x, y + 14 + i * 14, 3, 6);
        ctx.fillRect(x + w - 3, y + 14 + i * 14, 3, 6);
    }

    // A-frame thatch roof
    const ov = age >= 3 ? 8 : 4;
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - ov - 2, y + 14);
    ctx.lineTo(x + w / 2, y - 8);
    ctx.lineTo(x + w + ov + 2, y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(x - ov, y + 12);
    ctx.lineTo(x + w / 2, y - 6);
    ctx.lineTo(x + w + ov, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofLight;
    ctx.beginPath();
    ctx.moveTo(x - ov + 2, y + 10);
    ctx.lineTo(x + w / 2, y - 4);
    ctx.lineTo(x + w / 2, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + w / 2 - 2, y - 8, 4, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 2 - i, y + 2 + i * 4, w - 4 + i * 2, 1);

    ctx.fillStyle = '#1a1410';
    ctx.fillRect(x + w / 2 - 8, y + h - 28, 16, 22);
    ctx.fillStyle = '#2a1e14';
    ctx.fillRect(x + w / 2 - 6, y + h - 26, 12, 18);
    ctx.fillStyle = '#555';
    ctx.fillRect(x + w / 2 - 6, y + h - 22, 12, 2);

    drawResourcePile(ctx, x, y, w, h, age, isWood, accent);

    ctx.fillStyle = '#4a3828';
    ctx.fillRect(x + 10, y + 16, 2, 18);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 4, y + 14, 16, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, y + 16, 12, 6);

    if (age >= 4) {
        ctx.fillStyle = cc.accentColor;
        ctx.fillRect(x - ov, y + 11, w + ov * 2, 2);
    }
}
