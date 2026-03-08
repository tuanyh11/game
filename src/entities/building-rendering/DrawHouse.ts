// ============================================================
//  House Renderer — Civilization-specific house drawing
//  Each civ has unique architectural style
// ============================================================

import type { Building } from "../Building";
import { CivilizationType } from "../../config/GameConfig";
import { getCivBuildingColors, CivBuildingColors } from "./BuildingColors";

export function drawHouse(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const civC = getCivBuildingColors(b);
    const age = b.age;
    switch (b.civilization) {
        case CivilizationType.BaTu: drawHouse_BaTu(ctx, x, y, w, h, civC, age); break;
        case CivilizationType.DaiMinh: drawHouse_DaiMinh(ctx, x, y, w, h, civC, age); break;
        case CivilizationType.Yamato: drawHouse_Yamato(ctx, x, y, w, h, civC, age); break;
        case CivilizationType.Viking: drawHouse_Viking(ctx, x, y, w, h, civC, age); break;
        default: drawHouse_LaMa(ctx, x, y, w, h, civC, age); break;
    }
}

// ---- BA TƯ: Flat-roofed sandstone with arched windows, dome ornament ----
function drawHouse_BaTu(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    // Foundation
    ctx.fillStyle = '#b0a080';
    ctx.fillRect(x + 4, y + h - 8, w - 8, 8);
    ctx.fillStyle = '#c0b090';
    ctx.fillRect(x + 4, y + h - 8, w - 8, 3);

    // Walls — sandstone
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 6, y + 20, w - 12, h - 28);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 8, y + 22, w - 16, h - 32);
    ctx.fillStyle = cc.wallHi;
    ctx.fillRect(x + 8, y + 22, 3, h - 32);

    // Sandstone horizontal bands
    ctx.fillStyle = 'rgba(201,168,76,0.08)';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 8, y + 30 + i * 14, w - 16, 1);
    }

    // Flat roof with parapet
    ctx.fillStyle = cc.roofDark;
    ctx.fillRect(x - 2, y + 12, w + 4, 12);
    ctx.fillStyle = cc.roofMain;
    ctx.fillRect(x, y + 10, w, 10);
    ctx.fillStyle = cc.roofLight;
    ctx.fillRect(x, y + 10, w, 3);
    // Golden parapet trim
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x - 2, y + 9, w + 4, 2);
    // Small crenellations
    for (let i = 0; i < Math.floor(w / 12); i++) {
        ctx.fillStyle = cc.wallMain;
        ctx.fillRect(x + 4 + i * 12, y + 4, 6, 7);
        ctx.fillStyle = cc.wallHi;
        ctx.fillRect(x + 4 + i * 12, y + 4, 3, 7);
    }

    // Small dome ornament on top
    if (age >= 2) {
        ctx.fillStyle = cc.roofMain;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 8, y + 10);
        ctx.quadraticCurveTo(x + w / 2, y - 6, x + w / 2 + 8, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + w / 2 - 1, y - 6, 2, 4);
    }

    // Arched windows
    for (const wx of [x + 14, x + w - 26]) {
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(wx, y + 30, 12, 14);
        ctx.fillStyle = '#ffc040';
        ctx.fillRect(wx + 2, y + 34, 8, 8);
        ctx.fillStyle = cc.accentColor;
        ctx.beginPath();
        ctx.arc(wx + 6, y + 30, 6, Math.PI, 0);
        ctx.fill();
    }

    // Door — horseshoe arch
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - 10, y + h - 34, 20, 26);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x + w / 2 - 8, y + h - 32, 16, 22);
    ctx.fillStyle = cc.accentColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - 34, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 + 3, y + h - 22, 3, 3);

    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - 2, y + 8, w + 4, 2);
    }
}

// ---- ĐẠI TỐNG: Curved red roof, red pillars, lattice windows ----
function drawHouse_DaiMinh(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    // Stone platform
    ctx.fillStyle = '#5a5a58';
    ctx.fillRect(x - 2, y + h - 8, w + 4, 8);
    ctx.fillStyle = '#6a6a68';
    ctx.fillRect(x, y + h - 10, w, 4);

    // Walls — gray plaster
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 6, y + 22, w - 12, h - 32);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 8, y + 24, w - 16, h - 36);
    // Red pillars
    ctx.fillStyle = '#8a2222';
    ctx.fillRect(x + 6, y + 22, 4, h - 32);
    ctx.fillRect(x + w - 10, y + 22, 4, h - 32);

    // Lattice windows
    for (const wx of [x + 16, x + w - 28]) {
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(wx, y + 30, 12, 12);
        ctx.fillStyle = '#ffc040';
        ctx.fillRect(wx + 2, y + 32, 8, 8);
        ctx.fillStyle = '#8a2222';
        ctx.fillRect(wx + 5, y + 30, 2, 12); // vertical bar
        ctx.fillRect(wx, y + 35, 12, 2); // horizontal bar
    }

    // Door
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(x + w / 2 - 10, y + h - 34, 20, 24);
    ctx.fillStyle = '#5a2818';
    ctx.fillRect(x + w / 2 - 8, y + h - 32, 16, 20);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 - 1, y + h - 32, 2, 20); // center divider

    // Curved pagoda roof
    const overhang = age >= 3 ? 10 : 6;
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - overhang, y + 24);
    ctx.quadraticCurveTo(x + w / 2, y - 4, x + w + overhang, y + 24);
    ctx.lineTo(x + w + overhang, y + 28);
    ctx.quadraticCurveTo(x + w / 2, y, x - overhang, y + 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(x - overhang + 2, y + 22);
    ctx.quadraticCurveTo(x + w / 2, y - 2, x + w + overhang - 2, y + 22);
    ctx.lineTo(x + w + overhang - 2, y + 26);
    ctx.quadraticCurveTo(x + w / 2, y + 2, x - overhang + 2, y + 26);
    ctx.closePath();
    ctx.fill();
    // Upturned eave tips
    ctx.fillStyle = cc.roofLight;
    ctx.fillRect(x - overhang, y + 20, 4, 3);
    ctx.fillRect(x + w + overhang - 4, y + 20, 4, 3);
    // Ridge ornament
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 - 1, y - 4, 2, 6);

    // Red horizontal band
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(x + 6, y + 21, w - 12, 2);

    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - overhang, y + 21, w + overhang * 2, 2);
    }
}

// ---- YAMATO: Dark steep roof, white shoji walls, clean minimalist ----
function drawHouse_Yamato(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    // Stone foundation
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
    ctx.fillStyle = '#c0b8a8';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 4);

    // White plaster walls + dark wood frame
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 24, w - 8, h - 34);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 26, w - 12, h - 38);
    // Dark wood frame beams
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(x + 4, y + 24, w - 8, 2);      // top beam
    ctx.fillRect(x + 4, y + 24, 3, h - 34);      // left beam
    ctx.fillRect(x + w - 7, y + 24, 3, h - 34);  // right beam
    ctx.fillRect(x + w / 2 - 1, y + 24, 2, h - 55); // center vertical

    // Shoji screen windows
    for (const wx of [x + 12, x + w / 2 + 4]) {
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(wx, y + 30, 14, 16);
        ctx.fillStyle = '#2a2018';
        ctx.fillRect(wx + 6, y + 30, 2, 16);
        ctx.fillRect(wx, y + 37, 14, 2);
    }

    // Sliding door
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - 12, y + h - 32, 24, 22);
    ctx.fillStyle = '#f0e8d0';
    ctx.fillRect(x + w / 2 - 10, y + h - 30, 10, 18);
    ctx.fillRect(x + w / 2 + 1, y + h - 30, 10, 18);
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(x + w / 2 - 1, y + h - 32, 2, 22);

    // Steep gabled roof
    const roofW = w + 12;
    const roofX = x - 6;
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(roofX - 2, y + 26);
    ctx.lineTo(x + w / 2, y - 6);
    ctx.lineTo(roofX + roofW + 2, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(roofX, y + 24);
    ctx.lineTo(x + w / 2, y - 4);
    ctx.lineTo(roofX + roofW, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofLight;
    ctx.beginPath();
    ctx.moveTo(roofX + 4, y + 22);
    ctx.lineTo(x + w / 2, y - 2);
    ctx.lineTo(x + w / 2, y + 22);
    ctx.closePath();
    ctx.fill();
    // Upturned eaves
    ctx.fillStyle = cc.roofDark;
    ctx.fillRect(roofX - 4, y + 22, 6, 4);
    ctx.fillRect(roofX + roofW - 2, y + 22, 6, 4);
    // Red accent line
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(roofX, y + 23, roofW, 2);

    // Ridge ornament
    ctx.fillStyle = cc.roofDark;
    ctx.fillRect(x + w / 2 - 2, y - 4, 4, 28);

    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + w / 2 - 1, y - 10, 2, 8);
    }
}

// ---- LA MÃ: Classical columns, triangular pediment, stone arch ----
function drawHouse_LaMa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    const beamColor = age >= 3 ? '#4a4a48' : '#3a2010';
    const baseColor = age >= 2 ? '#5a5a58' : '#5a5550';

    // Stone foundation with steps
    ctx.fillStyle = baseColor;
    ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
    ctx.fillStyle = '#6a6a68';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 3);
    ctx.fillRect(x + w / 2 - 14, y + h - 4, 28, 4);

    // Marble walls
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 6, y + 22, w - 12, h - 32);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 8, y + 24, w - 16, h - 36);
    ctx.fillStyle = cc.wallHi;
    ctx.fillRect(x + 8, y + 24, 3, h - 36);

    // Masonry texture
    if (age >= 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let row = 0; row < 4; row++) {
            const ry = y + 28 + row * 10;
            const offset = row % 2 === 0 ? 0 : 8;
            for (let col = 0; col < 4; col++) {
                ctx.fillRect(x + 10 + offset + col * 14, ry, 12, 1);
                ctx.fillRect(x + 10 + offset + col * 14, ry, 1, 9);
            }
        }
    }

    // Small columns at entrance
    if (age >= 2) {
        for (const cx of [x + 10, x + w - 14]) {
            ctx.fillStyle = cc.wallHi;
            ctx.fillRect(cx, y + 24, 4, h - 34);
            ctx.fillStyle = cc.accentColor;
            ctx.fillRect(cx - 1, y + 22, 6, 3);
            ctx.fillRect(cx - 1, y + h - 12, 6, 3);
        }
    }

    // Triangular pediment roof
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 24);
    ctx.lineTo(x + w / 2, y - 4);
    ctx.lineTo(x + w + 2, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(x, y + 22);
    ctx.lineTo(x + w / 2, y - 2);
    ctx.lineTo(x + w, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofLight;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 20);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + 20);
    ctx.closePath();
    ctx.fill();
    // Horizontal cornice
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x - 2, y + 21, w + 4, 2);

    // Arched windows
    const winGlow = age >= 3 ? '#ffc040' : '#88ccee';
    for (const wx of [x + 14, x + w - 26]) {
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(wx, y + 32, 12, 14);
        ctx.fillStyle = winGlow;
        ctx.fillRect(wx + 2, y + 34, 8, 10);
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(wx + 6, y + 32, 6, Math.PI, 0);
        ctx.fill();
    }

    // Arched door
    ctx.fillStyle = '#1a1808';
    ctx.fillRect(x + w / 2 - 10, y + h - 34, 20, 24);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x + w / 2 - 8, y + h - 32, 16, 20);
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - 34, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#c0a050';
    ctx.fillRect(x + w / 2 + 3, y + h - 22, 3, 3);

    if (age >= 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - 2, y + 20, w + 4, 2);
    }
}

// ---- VIKING: Log cabin, A-frame thatch roof, animal motifs ----
function drawHouse_Viking(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    // Earth/stone base
    ctx.fillStyle = '#3a3028';
    ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 4);

    // Log walls
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 20, w - 8, h - 28);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 22, w - 12, h - 32);
    // Horizontal log lines
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(x + 6, y + 24 + i * 8, w - 12, 2);
    }
    // Corner notch logs (protruding)
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 2, y + 20, 4, h - 28);
    ctx.fillRect(x + w - 6, y + 20, 4, h - 28);
    // Protruding log ends at corners
    ctx.fillStyle = '#4a3828';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(x, y + 22 + i * 12, 3, 6);
        ctx.fillRect(x + w - 3, y + 22 + i * 12, 3, 6);
    }

    // Small deep-set windows
    for (const wx of [x + 14, x + w - 24]) {
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(wx, y + 32, 10, 10);
        ctx.fillStyle = '#88aacc';
        ctx.fillRect(wx + 2, y + 34, 6, 6);
        ctx.fillStyle = cc.wallDark;
        ctx.fillRect(wx + 4, y + 32, 2, 10);
    }

    // Heavy wood door
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - 10, y + h - 34, 20, 24);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x + w / 2 - 8, y + h - 32, 16, 20);
    // Wood planks on door
    ctx.fillStyle = '#4a3828';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + w / 2 - 6 + i * 6, y + h - 30, 4, 16);
    }
    // Iron bands
    ctx.fillStyle = '#555';
    ctx.fillRect(x + w / 2 - 8, y + h - 28, 16, 2);
    ctx.fillRect(x + w / 2 - 8, y + h - 20, 16, 2);

    // A-frame thatched roof
    const overhang = age >= 3 ? 10 : 6;
    ctx.fillStyle = cc.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - overhang - 2, y + 22);
    ctx.lineTo(x + w / 2, y - 10);
    ctx.lineTo(x + w + overhang + 2, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofMain;
    ctx.beginPath();
    ctx.moveTo(x - overhang, y + 20);
    ctx.lineTo(x + w / 2, y - 8);
    ctx.lineTo(x + w + overhang, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.roofLight;
    ctx.beginPath();
    ctx.moveTo(x - overhang + 4, y + 18);
    ctx.lineTo(x + w / 2, y - 6);
    ctx.lineTo(x + w / 2, y + 18);
    ctx.closePath();
    ctx.fill();
    // Ridge beam
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + w / 2 - 2, y - 10, 4, 30);
    // Thatch texture
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 4 - i, y + 2 + i * 4, w - 8 + i * 2, 1);
    }

    // Dragon/animal head prow (Age 2+)
    if (age >= 2) {
        for (const side of [-1, 1]) {
            const dx = side < 0 ? x - overhang - 2 : x + w + overhang - 2;
            ctx.fillStyle = '#4a3a28';
            ctx.fillRect(dx, y + 10, 4, 12);
            ctx.fillStyle = '#5a4a38';
            ctx.fillRect(dx + (side < 0 ? -2 : 2), y + 6, 3, 8);
            if (age >= 3) {
                ctx.fillStyle = '#ff4444'; // eye
                ctx.fillRect(dx + (side < 0 ? -1 : 3), y + 8, 2, 2);
            }
        }
    }

    // Shield decoration (Age 3+)
    if (age >= 3) {
        ctx.fillStyle = cc.accentColor;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 36, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a8a88';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 36, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (age >= 4) {
        ctx.fillStyle = cc.accentColor;
        ctx.fillRect(x - overhang, y + 19, w + overhang * 2, 2);
    }
}
