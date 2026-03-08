// ============================================================
//  Town Center Renderers — Per-civilization TC drawing
//  Extracted from Building.ts
// ============================================================

import type { Building } from "../Building";
import { CivilizationType } from "../../config/GameConfig";
import { getCivBuildingColors, CivBuildingColors } from "./BuildingColors";

export function drawTownCenter(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const civC = getCivBuildingColors(b);
    const age = b.age;
    switch (b.civilization) {
        case CivilizationType.BaTu: drawTC_BaTu(ctx, x, y, w, h, civC, age); break;
        case CivilizationType.DaiMinh: drawTC_DaiMinh(ctx, x, y, w, h, civC, age); break;
        case CivilizationType.Yamato: drawTC_Yamato(ctx, x, y, w, h, civC, age); break;
        case CivilizationType.Viking: drawTC_Viking(ctx, x, y, w, h, civC, age); break;
        default: drawTC_LaMa(ctx, x, y, w, h, civC, age); break;
    }
}

// ---- BA TƯ: Onion domes, minarets, sandstone ----
function drawTC_BaTu(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    const { roofMain, roofLight, wallMain, wallDark, wallHi, teamColor, accentColor } = cc;

    if (age === 1) {
        // Age 1: Desert nomad camp (Tents)
        // Sand/dirt ground
        ctx.fillStyle = '#c2b280';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h - 10, w * 0.45, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main central tent
        ctx.fillStyle = '#e8d8c8'; // Off-white cloth
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 10); // Tent peak
        ctx.lineTo(x + 10, y + h - 15);
        ctx.lineTo(x + w - 10, y + h - 15);
        ctx.fill();

        // Tent dark shadowing / folds
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 10);
        ctx.lineTo(x + 20, y + h - 15);
        ctx.lineTo(x + w / 2 - 5, y + h - 15);
        ctx.fill();

        // Tent door flap
        ctx.fillStyle = '#2a1a10';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h - 35);
        ctx.lineTo(x + w / 2 - 12, y + h - 15);
        ctx.lineTo(x + w / 2 + 12, y + h - 15);
        ctx.fill();

        // Colored patterns on tent
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 22, y + h - 25);
        ctx.lineTo(x + w - 22, y + h - 25);
        ctx.stroke();

        // Tent poles sticking out
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 10);
        ctx.lineTo(x + w / 2, y + 2);
        ctx.stroke();

        // Campfire
        ctx.fillStyle = '#3a2415';
        ctx.beginPath();
        ctx.arc(x + w / 2 + 15, y + h - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(x + w / 2 + 15, y + h - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    if (age === 2) {
        // Age 2: Mud-brick settlement
        ctx.fillStyle = '#c2b280'; // Sand base
        ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

        // Adobe block walls
        ctx.fillStyle = '#d4b886'; // Mud-brick color
        ctx.fillRect(x + 8, y + 26, w - 16, h - 36);
        ctx.fillStyle = '#c0a068'; // Shadow
        ctx.fillRect(x + 8, y + 26, 6, h - 36);

        // Crude horizontal lines for mud bricks
        ctx.fillStyle = '#a88c58';
        for (let row = 0; row < 6; row++) {
            ctx.fillRect(x + 8, y + 36 + row * 6, w - 16, 1);
        }

        // Flat roof with simple battlements
        ctx.fillStyle = '#c0a068';
        ctx.fillRect(x + 6, y + 26, w - 12, 6);
        // Battlements
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + 8 + i * ((w - 24) / 4), y + 20, 8, 6);
        }

        // Simple arched wooden door
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 12, y + h - 36, 24, 26);
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - 36, 12, Math.PI, 0);
        ctx.fill();

        // Small square windows
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(x + 16, y + 40, 8, 10);
        ctx.fillRect(x + w - 24, y + 40, 8, 10);

        // Simple team banner
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + w / 2 - 10, y + 36, 20, 30);
        ctx.fillStyle = accentColor;
        ctx.fillRect(x + w / 2 - 10, y + 62, 20, 4);
        return;
    }

    // Age 3 and 4: Golden Age Mosque / Sassanid Palace
    // Foundation
    ctx.fillStyle = '#b0a080';
    ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

    // Main walls — sandstone
    ctx.fillStyle = wallDark;
    ctx.fillRect(x + 4, y + 18, w - 8, h - 28);
    ctx.fillStyle = wallMain;
    ctx.fillRect(x + 6, y + 20, w - 12, h - 32);
    ctx.fillStyle = wallHi;
    ctx.fillRect(x + 6, y + 20, 3, h - 32);

    // Intricate wall patterns (Age 4)
    if (age === 4) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.strokeRect(x + 12, y + 26 + i * 16, w - 24, 12);
        }
        ctx.globalAlpha = 1.0;
    }

    // Central grand onion dome
    const domeH = age === 4 ? 40 : 30; // Much taller in Age 4
    const domeW = age === 4 ? 24 : 16;
    ctx.fillStyle = roofMain; // Teal/Blue usually
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - domeW, y + 18);
    ctx.quadraticCurveTo(x + w / 2 - domeW - 4, y + 18 - domeH * 0.5, x + w / 2, y + 18 - domeH);
    ctx.quadraticCurveTo(x + w / 2 + domeW + 4, y + 18 - domeH * 0.5, x + w / 2 + domeW, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = roofLight;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - domeW + 6, y + 18);
    ctx.quadraticCurveTo(x + w / 2 - domeW + 2, y + 18 - domeH * 0.4, x + w / 2, y + 18 - domeH + 2);
    ctx.quadraticCurveTo(x + w / 2 + domeW - 12, y + 18 - domeH * 0.3, x + w / 2 + domeW - 12, y + 18);
    ctx.closePath();
    ctx.fill();

    // Dome gold spire
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 - 1, y + 18 - domeH - 8, 2, 10);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 18 - domeH - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    if (age === 4) { // Crescent moon on top
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 18 - domeH - 12, 4, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
    }

    // Side Domes (Age 4 only)
    if (age === 4) {
        for (const sx of [x + 20, x + w - 20]) {
            const sDomeH = 20;
            ctx.fillStyle = roofMain;
            ctx.beginPath();
            ctx.moveTo(sx - 10, y + 18);
            ctx.quadraticCurveTo(sx - 12, y + 18 - sDomeH * 0.5, sx, y + 18 - sDomeH);
            ctx.quadraticCurveTo(sx + 12, y + 18 - sDomeH * 0.5, sx + 10, y + 18);
            ctx.fill();
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(sx - 1, y + 18 - sDomeH - 6, 2, 8);
        }
    }

    // Minarets
    for (const side of [-1, 1]) {
        const mx = side < 0 ? x - 4 : x + w - 8;
        const mh = age === 4 ? 65 : 50; // Taller in age 4
        const my = y + h - mh;
        ctx.fillStyle = wallMain;
        ctx.fillRect(mx, my, 12, mh);
        ctx.fillStyle = wallHi;
        ctx.fillRect(mx, my, 3, mh);
        // Minaret balconies
        ctx.fillStyle = accentColor;
        ctx.fillRect(mx - 2, my + 14, 16, 3);
        if (age === 4) ctx.fillRect(mx - 2, my + 30, 16, 3);

        // Minaret roof
        ctx.fillStyle = roofMain;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(mx - 2, my - 8, mx + 6, my - 14);
        ctx.quadraticCurveTo(mx + 14, my - 8, mx + 12, my);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(mx + 5, my - 18, 2, 6);
    }

    // Islamic arch windows
    for (const wx of [x + 14, x + w - 28]) {
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(wx, y + 30, 12, 16);
        ctx.fillStyle = '#ffc040';
        ctx.fillRect(wx + 2, y + 34, 8, 10);
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(wx + 6, y + 30, 6, Math.PI, 0);
        ctx.fill();
        if (age === 4) { // Gold lattice
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(wx + 5, y + 34, 2, 10);
            ctx.fillRect(wx + 2, y + 38, 8, 2);
        }
    }

    // Arched door (Grand Iwan)
    const doorW = age === 4 ? 36 : 28;
    const doorH = age === 4 ? 40 : 32;
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - doorW / 2, y + h - doorH - 10, doorW, doorH + 10);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x + w / 2 - doorW / 2 + 2, y + h - doorH - 8, doorW - 4, doorH + 8);

    // Iwan Arch
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - doorH - 10, doorW / 2, Math.PI, 0);
    ctx.fill();

    if (age === 4) {
        // Gold trim around grand arch
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - doorH - 10, doorW / 2 + 2, Math.PI, 0);
        ctx.stroke();
        // Large hanging lantern
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + w / 2 - 1, y + h - doorH - 10, 2, 8);
        ctx.fillStyle = 'rgba(255,200,50,0.8)';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - doorH - 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Flag / Banners
    ctx.fillStyle = '#555';
    ctx.fillRect(x + w / 2 - 1, y - domeH - 22, 2, 12);
    ctx.fillStyle = teamColor;
    ctx.fillRect(x + w / 2 + 1, y - domeH - 22, 14, 8);

    // Age 4 Aura and extra gold trim
    if (age === 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + 4, y + 18, w - 8, 2);
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#40e0d0'; // Turquoise aura
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.75, h * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ---- ĐẠI TỐNG: Pagoda curved roofs, red tiles ----
function drawTC_DaiMinh(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    const { roofMain, roofLight, roofDark, wallMain, wallDark, wallHi, teamColor, accentColor } = cc;

    if (age === 1) {
        // Age 1: Bamboo village hall
        // Mud/Earth platform
        ctx.fillStyle = '#6b5c47';
        ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

        // Bamboo/Wood walls
        ctx.fillStyle = '#b8a078'; // Light bamboo wood
        ctx.fillRect(x + 8, y + 26, w - 16, h - 36);
        ctx.fillStyle = '#8c7853'; // Shadow/framework
        for (let ix = x + 12; ix < x + w - 8; ix += 8) {
            ctx.fillRect(ix, y + 26, 2, h - 36);
        }

        // Straw/Thatch curved roof
        ctx.fillStyle = '#9c8855'; // Dark thatch
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 26);
        ctx.quadraticCurveTo(x + w / 2, y + 10, x + w + 4, y + 26);
        ctx.lineTo(x + w / 2, y + 4);
        ctx.fill();

        ctx.fillStyle = '#c4b07b'; // Light thatch
        ctx.beginPath();
        ctx.moveTo(x, y + 24);
        ctx.quadraticCurveTo(x + w / 2, y + 12, x + w, y + 24);
        ctx.lineTo(x + w / 2, y + 6);
        ctx.fill();

        // Simple door
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 10, y + h - 30, 20, 20);

        // Bamboo poles sticking out
        ctx.fillStyle = '#a69066';
        ctx.fillRect(x - 2, y + 24, 4, 4);
        ctx.fillRect(x + w - 2, y + 24, 4, 4);
        return;
    }

    if (age === 2) {
        // Age 2: Provincial manor
        // Stone platform
        ctx.fillStyle = '#5a5a58';
        ctx.fillRect(x - 2, y + h - 8, w + 4, 8);

        // White plaster walls with wooden frame
        ctx.fillStyle = '#e8e8e0';
        ctx.fillRect(x + 6, y + 24, w - 12, h - 32);

        // Red wooden pillars (signature Ming style)
        ctx.fillStyle = '#8c2222';
        ctx.fillRect(x + 6, y + 24, 4, h - 32);
        ctx.fillRect(x + w - 10, y + 24, 4, h - 32);
        ctx.fillRect(x + w / 2 - 2, y + 24, 4, h - 48); // Center beam

        // Simple grey clay tile roof
        ctx.fillStyle = '#4a4a4f'; // Dark grey
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 26);
        ctx.quadraticCurveTo(x + w / 2, y + 8, x + w + 6, y + 26);
        ctx.lineTo(x + w / 2, y - 2);
        ctx.fill();

        ctx.fillStyle = '#6a6a6f'; // Main grey tiles
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 24);
        ctx.quadraticCurveTo(x + w / 2, y + 10, x + w + 2, y + 24);
        ctx.lineTo(x + w / 2, y);
        ctx.fill();

        // Wooden door
        ctx.fillStyle = '#3a1808';
        ctx.fillRect(x + w / 2 - 12, y + h - 36, 24, 28);
        ctx.fillStyle = '#5a2818';
        ctx.fillRect(x + w / 2 - 10, y + h - 34, 20, 24);

        // Circular window
        ctx.fillStyle = '#1a1008';
        ctx.beginPath();
        ctx.arc(x + 18, y + 42, 6, 0, Math.PI * 2);
        ctx.arc(x + w - 18, y + 42, 6, 0, Math.PI * 2);
        ctx.fill();

        // Window lattice cross
        ctx.strokeStyle = '#8c2222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 42); ctx.lineTo(x + 24, y + 42);
        ctx.moveTo(x + 18, y + 36); ctx.lineTo(x + 18, y + 48);
        ctx.moveTo(x + w - 24, y + 42); ctx.lineTo(x + w - 12, y + 42);
        ctx.moveTo(x + w - 18, y + 36); ctx.lineTo(x + w - 18, y + 48);
        ctx.stroke();

        // Flag
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + w / 2 + 2, y - 6, 12, 8);
        ctx.fillStyle = '#444';
        ctx.fillRect(x + w / 2 - 1, y - 6, 2, 8);
        return;
    }

    // Age 3 and 4: Imperial Pagoda Base / Forbidden Palace Gate
    // Stone platform
    ctx.fillStyle = '#5a5a58';
    ctx.fillRect(x - 4, y + h - 8, w + 8, 8);
    ctx.fillStyle = '#6a6a68';
    ctx.fillRect(x - 2, y + h - 10, w + 4, 4);
    ctx.fillStyle = '#7a7a78';
    ctx.fillRect(x + w / 2 - 16, y + h - 4, 32, 4);

    // Grand Staircase (Age 4)
    if (age === 4) {
        ctx.fillStyle = '#e0e0e0'; // Marble steps
        ctx.fillRect(x + w / 2 - 20, y + h - 8, 40, 2);
        ctx.fillRect(x + w / 2 - 24, y + h - 6, 48, 2);
        ctx.fillRect(x + w / 2 - 28, y + h - 4, 56, 4);
        // Center dragon carving slope (implied)
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(x + w / 2 - 8, y + h - 10, 16, 10);
    }

    // Walls with red pillars
    ctx.fillStyle = wallDark;
    ctx.fillRect(x + 4, y + 24, w - 8, h - 34);
    ctx.fillStyle = wallMain;
    ctx.fillRect(x + 6, y + 26, w - 12, h - 38);

    // Red pillars
    ctx.fillStyle = '#a01a1a'; // Imperial red
    const numPillars = age === 4 ? 6 : 4;
    const pGap = (w - 12) / (numPillars - 1);
    for (let i = 0; i < numPillars; i++) {
        ctx.fillRect(x + 4 + i * pGap, y + 24, 4, h - 34);
        if (age === 4) { // Gold bases and capitals
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(x + 3 + i * pGap, y + 24, 6, 2);
            ctx.fillRect(x + 3 + i * pGap, y + h - 12, 6, 2);
            ctx.fillStyle = '#a01a1a';
        }
    }

    // Lattice windows
    const windowXPos = age === 4 ? [x + 12, x + 28, x + w - 42, x + w - 26] : [x + 16, x + w - 30];
    for (const wx of windowXPos) {
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(wx, y + 30, 14, 14);
        ctx.fillStyle = '#ffc040'; // Interior glow
        ctx.fillRect(wx + 2, y + 32, 10, 10);
        ctx.fillStyle = '#a01a1a';
        ctx.fillRect(wx + 6, y + 30, 2, 14);
        ctx.fillRect(wx, y + 36, 14, 2);
    }

    // Imperial Door
    const dW = age === 4 ? 32 : 24;
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(x + w / 2 - dW / 2, y + h - 40, dW, 30);
    ctx.fillStyle = '#5a2818';
    ctx.fillRect(x + w / 2 - dW / 2 + 2, y + h - 38, dW - 4, 26);

    // Gold door studs
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 - 1, y + h - 38, 2, 26); // Center split
    for (let dy = 0; dy < 4; dy++) {
        ctx.fillRect(x + w / 2 - Math.floor(dW / 4), y + h - 34 + dy * 6, 2, 2);
        ctx.fillRect(x + w / 2 + Math.floor(dW / 4) - 2, y + h - 34 + dy * 6, 2, 2);
    }

    // Curved pagoda roof (Lower Tier)
    const roofY = y + 20;
    const overhang = age === 4 ? 18 : 14;

    ctx.fillStyle = roofDark;
    ctx.beginPath();
    ctx.moveTo(x - overhang, roofY + 6);
    ctx.quadraticCurveTo(x + w / 2, roofY - 16, x + w + overhang, roofY + 6);
    ctx.lineTo(x + w + overhang, roofY + 10);
    ctx.quadraticCurveTo(x + w / 2, roofY - 10, x - overhang, roofY + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofMain;
    ctx.beginPath();
    ctx.moveTo(x - overhang + 2, roofY + 4);
    ctx.quadraticCurveTo(x + w / 2, roofY - 14, x + w + overhang - 2, roofY + 4);
    ctx.lineTo(x + w + overhang - 2, roofY + 8);
    ctx.quadraticCurveTo(x + w / 2, roofY - 8, x - overhang + 2, roofY + 8);
    ctx.closePath();
    ctx.fill();

    // Upturned eave tips
    ctx.fillStyle = roofLight;
    for (const sx of [x - overhang, x + w + overhang - 4]) {
        ctx.fillRect(sx, roofY + 2, 4, 3);
        if (age === 4) { // Gold dragon ornaments on eaves
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(sx + 1, roofY, 2, 2);
            ctx.fillStyle = roofLight;
        }
    }

    // Lanterns hanging from lower eaves
    if (age === 4) {
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(x - overhang + 4, roofY + 12, 6, 8);
        ctx.fillRect(x + w + overhang - 10, roofY + 12, 6, 8);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - overhang + 4, roofY + 10, 6, 2);
        ctx.fillRect(x + w + overhang - 10, roofY + 10, 6, 2);
        ctx.fillRect(x - overhang + 6, roofY + 20, 2, 4); // Tassel
        ctx.fillRect(x + w + overhang - 8, roofY + 20, 2, 4);
    }

    // Upper tier(s)
    const topTierWidth = age === 4 ? 48 : 36;
    const tierY = roofY - 18;

    // Upper walls
    ctx.fillStyle = wallMain;
    ctx.fillRect(x + w / 2 - topTierWidth / 2, tierY, topTierWidth, 20);
    ctx.fillStyle = '#a01a1a';
    ctx.fillRect(x + w / 2 - topTierWidth / 2, tierY, 4, 20);
    ctx.fillRect(x + w / 2 + topTierWidth / 2 - 4, tierY, 4, 20);
    if (age === 4) {
        ctx.fillRect(x + w / 2 - 2, tierY, 4, 20);
    }

    // Upper roof
    ctx.fillStyle = roofMain;
    const upOverhang = topTierWidth / 2 + (age === 4 ? 10 : 6);
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - upOverhang, tierY + 2);
    ctx.quadraticCurveTo(x + w / 2, tierY - 14, x + w / 2 + upOverhang, tierY + 2);
    ctx.lineTo(x + w / 2 + upOverhang, tierY + 6);
    ctx.quadraticCurveTo(x + w / 2, tierY - 8, x + w / 2 - upOverhang, tierY + 6);
    ctx.closePath();
    ctx.fill();

    // Roof finial
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 - 1, tierY - 18, 2, 8);
    ctx.beginPath();
    ctx.arc(x + w / 2, tierY - 18, 4, 0, Math.PI * 2);
    ctx.fill();
    if (age === 4) {
        ctx.beginPath();
        ctx.arc(x + w / 2, tierY - 22, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Third Tier for Age 4
    if (age === 4) {
        const topH = 16;
        const topY2 = tierY - topH;
        ctx.fillStyle = wallMain;
        ctx.fillRect(x + w / 2 - 16, topY2, 32, topH);
        ctx.fillStyle = '#a01a1a';
        ctx.fillRect(x + w / 2 - 16, topY2, 4, topH);
        ctx.fillRect(x + w / 2 + 12, topY2, 4, topH);

        // Uppermost roof
        ctx.fillStyle = roofMain;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 22, topY2 + 2);
        ctx.quadraticCurveTo(x + w / 2, topY2 - 12, x + w / 2 + 22, topY2 + 2);
        ctx.lineTo(x + w / 2 + 22, topY2 + 6);
        ctx.quadraticCurveTo(x + w / 2, topY2 - 8, x + w / 2 - 22, topY2 + 6);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + w / 2 - 1, topY2 - 12, 2, 10);
        ctx.beginPath();
        ctx.arc(x + w / 2, topY2 - 14, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Flag
    const flagY = age === 4 ? y - 48 : y - 16;
    ctx.fillStyle = '#555';
    ctx.fillRect(x + w / 2 - 1, flagY - 12, 2, 14);
    ctx.fillStyle = teamColor;
    ctx.fillRect(x + w / 2 + 1, flagY - 12, 14, 8);

    // Royal Aura (Age 4)
    if (age === 4) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.75, h * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ---- YAMATO: Steep pagoda, dark wood, shoji ----
function drawTC_Yamato(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    const { roofMain, roofLight, roofDark, wallMain, wallDark, teamColor, accentColor } = cc;

    if (age === 1) {
        // Age 1: Jomon pit house
        // Earth surround
        ctx.fillStyle = '#5c4a3d';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h - 6, w * 0.45, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Massive thatch roof reaching the ground
        ctx.fillStyle = '#8b7a55'; // Dark thatch base
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h - 12);
        ctx.quadraticCurveTo(x + w / 2, y + 6, x + w - 4, y + h - 12);
        ctx.fill();

        ctx.fillStyle = '#a69066'; // Main thatch
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h - 14);
        ctx.quadraticCurveTo(x + w / 2, y + 10, x + w - 8, y + h - 14);
        ctx.fill();

        // Thatch texture lines
        ctx.strokeStyle = '#756340';
        ctx.lineWidth = 1;
        for (let ix = x + 16; ix < x + w - 16; ix += 6) {
            ctx.beginPath();
            ctx.moveTo(ix, y + h - 14);
            ctx.lineTo(x + w / 2 + (ix - x - w / 2) * 0.2, y + 20);
            ctx.stroke();
        }

        // Wooden smoke vent on top
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 8, y + 6, 16, 6);
        ctx.fillStyle = '#1a1005';
        ctx.fillRect(x + w / 2 - 6, y + 8, 12, 4);

        // Simple door hole
        ctx.fillStyle = '#1a1005';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - 18, 10, Math.PI, 0);
        ctx.fill();
        return;
    }

    if (age === 2) {
        // Age 2: Shinto shrine style
        // Raised wooden piles
        ctx.fillStyle = '#4a3018';
        const pGap = (w - 24) / 4;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + 10 + i * pGap, y + h - 16, 4, 16);
        }

        // Raised wooden floor
        ctx.fillStyle = '#5c4028';
        ctx.fillRect(x + 4, y + h - 20, w - 8, 4);

        // Unpainted dark wood walls
        ctx.fillStyle = '#8b6540'; // Lighter wood planks
        ctx.fillRect(x + 12, y + 36, w - 24, h - 56);
        ctx.fillStyle = '#3a2415'; // Dark frame
        ctx.fillRect(x + 12, y + 36, 4, h - 56);
        ctx.fillRect(x + w - 16, y + 36, 4, h - 56);

        // Bark-shingle roof (Straight, intersecting gables)
        ctx.fillStyle = '#4a3c31';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 40);
        ctx.lineTo(x + w / 2, y + 10);
        ctx.lineTo(x + w - 2, y + 40);
        ctx.closePath();
        ctx.fill();

        // Chigi (forked roof finials)
        ctx.strokeStyle = '#3a2415';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 26); ctx.lineTo(x + w / 2 + 10, y - 4);
        ctx.moveTo(x + w - 16, y + 26); ctx.lineTo(x + w / 2 - 10, y - 4);
        ctx.stroke();

        // Katsuogi (horizontal roof logs)
        ctx.fillStyle = '#4a3018';
        for (let ix = x + w / 2 - 12; ix <= x + w / 2 + 12; ix += 8) {
            ctx.fillRect(ix, y + 18 + Math.abs(ix - x - w / 2) * 0.4, 4, -6);
        }

        // Simple entrance steps and Torii-like frame
        ctx.fillStyle = '#a62b2b'; // Torii Red
        ctx.fillRect(x + w / 2 - 14, y + h - 36, 4, 20);
        ctx.fillRect(x + w / 2 + 10, y + h - 36, 4, 20);
        ctx.fillRect(x + w / 2 - 16, y + h - 36, 32, 4); // Top beam

        ctx.fillStyle = '#d4c4a8'; // simple screen
        ctx.fillRect(x + w / 2 - 8, y + h - 30, 16, 10);

        // Banner
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + w / 2 - 6, y + 32, 12, 16);
        return;
    }

    // Age 3 and 4: Sengoku Manor / Tenshu (Castle Keep)
    // Stone foundation (Musha-gaeshi - sloped)
    ctx.fillStyle = '#5a5a58';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h);
    ctx.lineTo(x + 8, y + h - 16);
    ctx.lineTo(x + w - 8, y + h - 16);
    ctx.lineTo(x + w - 2, y + h);
    ctx.fill();

    // Stonework lines
    ctx.strokeStyle = '#4a4a48';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let row = 0; row < 3; row++) {
        ctx.moveTo(x + 4 + row * 2, y + h - 4 - row * 5);
        ctx.lineTo(x + w - 4 - row * 2, y + h - 4 - row * 5);
    }
    ctx.stroke();

    if (age === 4) {
        // Giant Tenshu Base Expansion
        ctx.fillStyle = '#6a6a68';
        ctx.beginPath();
        ctx.moveTo(x - 8, y + h);
        ctx.lineTo(x + 4, y + h - 24);
        ctx.lineTo(x + w - 4, y + h - 24);
        ctx.lineTo(x + w + 8, y + h);
        ctx.fill();
        ctx.strokeStyle = '#5a5a58';
        ctx.stroke();
    }

    // White plaster walls + dark wood frame
    const wallBaseY = age === 4 ? y + h - 24 : y + h - 16;
    const baseW = age === 4 ? w - 8 : w - 16;
    const baseX = age === 4 ? x + 4 : x + 8;

    ctx.fillStyle = wallDark;
    ctx.fillRect(baseX, y + 26, baseW, wallBaseY - (y + 26));
    ctx.fillStyle = wallMain; // White plaster
    ctx.fillRect(baseX + 2, y + 28, baseW - 4, wallBaseY - (y + 28));

    // Heavy timber framing (Black/Dark Brown)
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(baseX, y + 26, baseW, 3); // Top beam
    ctx.fillRect(baseX, y + 26, 4, wallBaseY - (y + 26)); // Left corner
    ctx.fillRect(baseX + baseW - 4, y + 26, 4, wallBaseY - (y + 26)); // Right corner
    ctx.fillRect(x + w / 2 - 2, y + 26, 4, wallBaseY - (y + 26) - 20); // Center beam
    ctx.fillRect(baseX, wallBaseY - 3, baseW, 3); // Bottom beam

    // Horizontal bracings
    for (let by = y + 40; by < wallBaseY - 30; by += 20) {
        ctx.fillRect(baseX, by, baseW, 2);
    }

    // Shoji screens / Windows
    const winW = age === 4 ? 20 : 16;
    for (const wx of [baseX + 6, baseX + baseW - winW - 6]) {
        ctx.fillStyle = '#f0e8d0'; // Paper white
        ctx.fillRect(wx, y + 36, winW, 20);
        ctx.fillStyle = '#1a1816'; // Wood strips
        ctx.fillRect(wx + winW / 2 - 1, y + 36, 2, 20);
        ctx.fillRect(wx, y + 46, winW, 2);
    }

    // Grand Entrance Doors
    const doorW = age === 4 ? 32 : 24;
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - doorW / 2, wallBaseY - 26, doorW, 26);
    ctx.fillStyle = '#f0e8d0';
    ctx.fillRect(x + w / 2 - doorW / 2 + 2, wallBaseY - 24, doorW / 2 - 2, 22);
    ctx.fillRect(x + w / 2 + 1, wallBaseY - 24, doorW / 2 - 2, 22);
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(x + w / 2 - 1, wallBaseY - 26, 2, 26); // Center slider

    // Tiered Roofs
    // Lower Roof Tier
    const r1X = baseX - 6;
    const r1W = baseW + 12;
    const r1Y = y + 28;

    ctx.fillStyle = roofDark;
    ctx.beginPath();
    ctx.moveTo(r1X - 4, r1Y + 4);
    ctx.lineTo(x + w / 2, y + 8);
    ctx.lineTo(r1X + r1W + 4, r1Y + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofMain; // Greenish-grey for Yamato
    ctx.beginPath();
    ctx.moveTo(r1X, r1Y + 2);
    ctx.lineTo(x + w / 2, y + 10);
    ctx.lineTo(r1X + r1W, r1Y + 2);
    ctx.closePath();
    ctx.fill();

    // Roof ridges (tiles)
    ctx.fillStyle = roofLight;
    ctx.fillRect(r1X, r1Y, r1W, 2);
    ctx.fillRect(r1X - 4, r1Y + 2, 6, 3);
    ctx.fillRect(r1X + r1W - 2, r1Y + 2, 6, 3);

    // Second / Third Tiers
    if (age >= 3) {
        // Upper walls
        const tier2W = age === 4 ? 36 : 28;
        const tier2Y = y - 4;
        ctx.fillStyle = wallMain;
        ctx.fillRect(x + w / 2 - tier2W / 2, tier2Y, tier2W, 16);
        ctx.fillStyle = '#1a1816';
        ctx.fillRect(x + w / 2 - tier2W / 2, tier2Y, 3, 16);
        ctx.fillRect(x + w / 2 + tier2W / 2 - 3, tier2Y, 3, 16);
        ctx.fillRect(x + w / 2 - tier2W / 2, tier2Y + 14, tier2W, 2);

        // Upper window
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(x + w / 2 - 6, tier2Y + 4, 12, 10);
        ctx.fillStyle = '#1a1816';
        ctx.fillRect(x + w / 2 - 1, tier2Y + 4, 2, 10);

        // Upper roof
        ctx.fillStyle = roofMain;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - tier2W / 2 - 8, tier2Y + 2);
        ctx.lineTo(x + w / 2, tier2Y - 18);
        ctx.lineTo(x + w / 2 + tier2W / 2 + 8, tier2Y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = roofLight;
        ctx.fillRect(x + w / 2 - tier2W / 2 - 4, tier2Y, tier2W + 8, 2);

        if (age === 4) {
            // Golden Shachihoko (Roof fish ornaments)
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(x + w / 2 - 6, tier2Y - 16, 3, Math.PI, 0); // Left curving up
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + w / 2 + 6, tier2Y - 16, 3, Math.PI, 0); // Right curving up
            ctx.fill();
            ctx.fillRect(x + w / 2 - 1, tier2Y - 22, 2, 6); // Top finial
        } else {
            ctx.fillStyle = '#1a1816';
            ctx.fillRect(x + w / 2 - 1, tier2Y - 24, 2, 6);
        }
    }

    // Flags / Banners
    const flagY = age === 4 ? y - 36 : (age === 3 ? y - 24 : y - 8);
    // Tall banner poles
    for (const bx of [x + 2, x + w - 4]) {
        if (age === 4) {
            ctx.fillStyle = '#1a1816';
            ctx.fillRect(bx, y + 20, 2, 50);
            ctx.fillStyle = teamColor;
            ctx.fillRect(bx - 4, y + 22, 10, 26); // Nobori banner
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(bx + 1, y + 34, 3, 0, Math.PI * 2); // Clan symbol
            ctx.fill();
        }
    }

    // Main Team Color Banner
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(x + w / 2 - 1, flagY - 10, 2, 12);
    ctx.fillStyle = teamColor;
    ctx.fillRect(x + w / 2 + 1, flagY - 10, 14, 8);

    // Aura
    if (age === 4) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#ff6688'; // Cherry blossom aura
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.75, h * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ---- LA MÃ: Columns, pediment, classical ----
function drawTC_LaMa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    const { roofMain, roofLight, roofDark, wallMain, wallDark, wallHi, teamColor, accentColor } = cc;
    const stoneBase = '#5a5a58';

    if (age === 1) {
        // Age 1: Wooden fort outpost
        // Dirt mound foundation
        ctx.fillStyle = '#4a3c2c';
        ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

        // Log walls
        ctx.fillStyle = '#5c4033'; // Dark brown wood
        ctx.fillRect(x + 8, y + 24, w - 16, h - 34);
        ctx.fillStyle = '#6b4c3a'; // Lighter brown wood
        for (let row = 0; row < 6; row++) { // Horizontal logs
            ctx.fillRect(x + 8, y + 24 + row * 6, w - 16, 4);
        }

        // Simple wooden door
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(x + w / 2 - 10, y + h - 26, 20, 16);
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 8, y + h - 24, 16, 14);

        // Pitched thatch/wood roof
        ctx.fillStyle = '#4a3525'; // Dark roof shadow
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 24);
        ctx.lineTo(x + w / 2, y + 4);
        ctx.lineTo(x + w - 4, y + 24);
        ctx.fill();

        ctx.fillStyle = '#5c4530'; // Main roof
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 24);
        ctx.lineTo(x + w / 2, y + 8);
        ctx.lineTo(x + w - 6, y + 24);
        ctx.fill();

        // Simple team flag on a stick
        ctx.fillStyle = '#332211';
        ctx.fillRect(x + 14, y - 6, 2, 30);
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + 16, y - 4, 12, 6);
        return;
    }

    if (age === 2) {
        // Age 2: Early Republic forum
        // Stone base
        ctx.fillStyle = stoneBase;
        ctx.fillRect(x + 2, y + h - 10, w - 4, 10);

        // Brick/plaster walls
        ctx.fillStyle = '#c8a88c'; // Terracotta tinted plaster
        ctx.fillRect(x + 6, y + 22, w - 12, h - 32);
        ctx.fillStyle = '#b8987c'; // Shadow
        ctx.fillRect(x + 6, y + 22, 4, h - 32);

        // Small wooden columns
        const colGap = (w - 20) / 3;
        ctx.fillStyle = '#8b5a2b'; // Wood color
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(x + 10 + i * colGap - 1, y + 22, 3, h - 32);
        }

        // Simple wooden door
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 12, y + h - 30, 24, 20);
        ctx.fillStyle = '#1a1005'; // Door gap
        ctx.fillRect(x + w / 2 - 1, y + h - 30, 2, 20);

        // Terracotta tile roof
        const rx = x;
        const rw = w;
        ctx.fillStyle = roofDark; // Using standard Civ colors here for consistency
        ctx.fillRect(rx + 2, y + 10, rw - 4, 12);
        ctx.fillStyle = roofMain;
        ctx.fillRect(rx + 4, y + 8, rw - 8, 14);

        // Roof tiles lines
        ctx.fillStyle = roofLight;
        for (let i = 0; i < rw - 8; i += 4) {
            ctx.fillRect(rx + 4 + i, y + 8, 1, 14);
        }

        // Simple banner
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + w / 2 - 12, y + 26, 24, 8);
        ctx.fillStyle = accentColor;
        ctx.fillRect(x + w / 2 - 12, y + 32, 24, 2);
        return;
    }

    // Age 3 and 4: Classical Temple / Imperial Pantheon
    // Foundation with steps
    ctx.fillStyle = stoneBase;
    ctx.fillRect(x - 4, y + h - 10, w + 8, 10);
    ctx.fillStyle = '#6a6a68';
    ctx.fillRect(x - 2, y + h - 12, w + 4, 4);
    ctx.fillRect(x + w / 2 - 20, y + h - 4, 40, 4);

    // Marble walls
    ctx.fillStyle = wallDark;
    ctx.fillRect(x + 4, y + 18, w - 8, h - 28);
    ctx.fillStyle = wallMain;
    ctx.fillRect(x + 6, y + 20, w - 12, h - 32);
    ctx.fillStyle = wallHi;
    ctx.fillRect(x + 6, y + 20, 3, h - 32);

    // Masonry
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let row = 0; row < 6; row++) {
        const ry = y + 24 + row * 8;
        for (let col = 0; col < 6; col++) {
            ctx.fillRect(x + 8 + (row % 2) * 8 + col * 16, ry, 14, 1);
        }
    }

    // Columns
    const colCount = age === 4 ? 6 : 4;
    const colGap = (w - 16) / (colCount - 1);
    for (let i = 0; i < colCount; i++) {
        const cx = x + 8 + i * colGap;
        ctx.fillStyle = wallHi;
        ctx.fillRect(cx - 2, y + 20, 5, h - 30);
        ctx.fillStyle = accentColor;
        ctx.fillRect(cx - 4, y + 18, 9, 3);
        ctx.fillRect(cx - 3, y + h - 12, 7, 3);
        if (age === 4) { // Gold trims for Age 4 columns
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(cx - 3, y + 21, 7, 1);
            ctx.fillRect(cx - 2, y + h - 14, 5, 1);
        }
    }

    // Age 4: Imperial Dome
    if (age === 4) {
        const domeH = 25;
        // Back layer of dome
        ctx.fillStyle = roofDark;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 18, w * 0.45, Math.PI, 0);
        ctx.fill();
        // Front layer
        ctx.fillStyle = roofMain;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 18, w * 0.4, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = roofLight;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 18, w * 0.35, Math.PI, 0);
        ctx.fill();
        // Dome ribbed lines
        ctx.strokeStyle = '#daa520'; // Gold ribs
        ctx.lineWidth = 1.5;
        for (let i = 1; i < 5; i++) {
            const angle = Math.PI - (Math.PI / 5) * i;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y - w * 0.4 + 2);
            ctx.lineTo(x + w / 2 + Math.cos(angle) * w * 0.4, y + 18);
            ctx.stroke();
        }
        // Golden Oculus
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + w / 2 - 4, y - w * 0.4 - 4, 8, 6);
        ctx.fillStyle = '#111';
        ctx.fillRect(x + w / 2 - 2, y - w * 0.4 - 2, 4, 4);
    }

    // Triangular pediment
    ctx.fillStyle = roofDark;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 20);
    ctx.lineTo(x + w / 2, y - 10);
    ctx.lineTo(x + w + 6, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = roofMain;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 18);
    ctx.lineTo(x + w / 2, y - 8);
    ctx.lineTo(x + w + 4, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = roofLight;
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x + w / 2, y - 6);
    ctx.lineTo(x + w / 2, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(x - 6, y + 17, w + 12, 3);

    // Eagle emblem (Age 3/4)
    ctx.fillStyle = '#ffd700';
    ctx.font = age === 4 ? '12px sans-serif' : '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦅', x + w / 2, y + 8);
    ctx.textAlign = 'left';

    // Age 3/4 side towers & windows
    if (age === 4) {
        // Grand Imperial Door
        ctx.fillStyle = '#1a1808';
        ctx.fillRect(x + w / 2 - 18, y + h - 52, 36, 40);
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(x + w / 2 - 16, y + h - 50, 32, 38);
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(x + w / 2 - 14, y + h - 48, 14, 36);
        ctx.fillRect(x + w / 2 + 1, y + h - 48, 14, 36);
        ctx.fillStyle = '#daa520';
        ctx.fillRect(x + w / 2 - 3, y + h - 32, 2, 4); // Handle
        ctx.fillStyle = stoneBase;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - 52, 18, Math.PI, 0); // Larger arch
        ctx.fill();

        // Purple Banners (Age 4)
        const bannerCol = '#660066'; // Tyrian Purple
        for (const bx of [x + 12, x + w - 24]) {
            ctx.fillStyle = bannerCol;
            ctx.fillRect(bx, y + 28, 12, 28);
            // Gold fringe
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(bx, y + 54, 12, 2);
            ctx.fillRect(bx + 4, y + 32, 4, 8); // Motif
        }
    } else {
        // Age 3 Features
        // Arched windows
        for (const wx of [x + 14, x + w - 28]) {
            ctx.fillStyle = '#1a1008';
            ctx.fillRect(wx, y + 28, 14, 16);
            ctx.fillStyle = '#ffc040';
            ctx.fillRect(wx + 2, y + 32, 10, 10);
            ctx.fillStyle = stoneBase;
            ctx.beginPath();
            ctx.arc(wx + 7, y + 28, 7, Math.PI, 0);
            ctx.fill();
        }
        // Grand door
        ctx.fillStyle = '#1a1808';
        ctx.fillRect(x + w / 2 - 14, y + h - 48, 28, 36);
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(x + w / 2 - 12, y + h - 46, 24, 32);
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(x + w / 2 - 10, y + h - 44, 10, 28);
        ctx.fillRect(x + w / 2 + 1, y + h - 44, 10, 28);
        ctx.fillStyle = '#daa520';
        ctx.fillRect(x + w / 2 - 3, y + h - 32, 2, 4);
        ctx.fillStyle = stoneBase;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h - 48, 14, Math.PI, 0);
        ctx.fill();

        // Side columns/towers
        for (const side of [-1, 1]) {
            const tx = side < 0 ? x - 6 : x + w - 8;
            ctx.fillStyle = wallMain;
            ctx.fillRect(tx, y - 4, 14, 40);
            ctx.fillStyle = wallHi;
            ctx.fillRect(tx, y - 4, 3, 40);
            ctx.fillStyle = stoneBase;
            for (let b = 0; b < 3; b++) ctx.fillRect(tx + b * 5, y - 8, 4, 6);
            ctx.fillStyle = '#ffc040';
            ctx.fillRect(tx + 4, y + 8, 6, 6);
        }
    }

    // Flag
    const flagTopY = age === 4 ? y - 40 : y - 20;
    ctx.fillStyle = '#555';
    ctx.fillRect(x + w / 2 - 1, flagTopY - 8, 2, 12);
    ctx.fillStyle = teamColor;
    ctx.fillRect(x + w / 2 + 1, flagTopY - 8, 16, 8);
    ctx.fillStyle = accentColor;
    ctx.fillRect(x + w / 2 + 1, flagTopY - 3, 16, 3);

    // Age 4 Aura
    if (age === 4) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - 6, y + 14, w + 12, 2);
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.7, h * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// ---- VIKING: Longhouse A-frame, dragon prow ----
function drawTC_Viking(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cc: CivBuildingColors, age: number): void {
    const { roofMain, roofLight, roofDark, wallMain, wallDark, wallHi, teamColor, accentColor } = cc;

    if (age === 1) {
        // Age 1: Turf house
        // Submerged earth mound
        ctx.fillStyle = '#4a5e3a'; // Greenish brown turf
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h - 8, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Grass/Turf Roof
        ctx.fillStyle = '#5c7a3d'; // Lighter grass
        ctx.beginPath();
        ctx.moveTo(x + 6, y + h - 14);
        ctx.quadraticCurveTo(x + w / 2, y + 2, x + w - 6, y + h - 14);
        ctx.fill();

        // Roof texture (grass strands)
        ctx.strokeStyle = '#4a5e3a';
        ctx.lineWidth = 1;
        for (let ix = x + 12; ix < x + w - 12; ix += 6) {
            ctx.beginPath();
            ctx.moveTo(ix, y + h - 14);
            ctx.lineTo(ix + (Math.random() - 0.5) * 4, y + 14);
            ctx.stroke();
        }

        // Wooden door frame embedded in turf
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 10, y + h - 24, 20, 16);
        ctx.fillStyle = '#1a1005';
        ctx.fillRect(x + w / 2 - 8, y + h - 22, 16, 14);

        // Smoke hole rim
        ctx.fillStyle = '#3a2415';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 10, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1005';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 10, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        return;
    }

    if (age === 2) {
        // Age 2: Simple Longhouse
        // Earth base
        ctx.fillStyle = '#4a4a38';
        ctx.fillRect(x + 4, y + h - 10, w - 8, 10);

        // Timber walls (Horizontal planks)
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(x + 10, y + 36, w - 20, h - 46);
        ctx.fillStyle = '#3a2415';
        for (let ix = y + 40; ix < y + h - 10; ix += 5) {
            ctx.fillRect(x + 10, ix, w - 20, 1);
        }

        // Steep thatched roof (A-Frame)
        ctx.fillStyle = '#5c4530'; // Dark thatch
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 40);
        ctx.lineTo(x + w / 2, y + 10);
        ctx.lineTo(x + w - 2, y + 40);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7a5a40'; // Main thatch
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 38);
        ctx.lineTo(x + w / 2, y + 14);
        ctx.lineTo(x + w - 6, y + 38);
        ctx.closePath();
        ctx.fill();

        // Carved wooden pillars at entrance
        ctx.fillStyle = '#3a2415';
        ctx.fillRect(x + w / 2 - 14, y + h - 34, 4, 24);
        ctx.fillRect(x + w / 2 + 10, y + h - 34, 4, 24);

        // Door
        ctx.fillStyle = '#1a1005';
        ctx.fillRect(x + w / 2 - 10, y + h - 30, 20, 20);

        // Animal skull above door
        ctx.fillStyle = '#e8e8e0';
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 4, y + h - 38);
        ctx.lineTo(x + w / 2 + 4, y + h - 38);
        ctx.lineTo(x + w / 2, y + h - 32);
        ctx.fill();

        // Crossed gable timbers (Simple)
        ctx.strokeStyle = '#3a2415';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 8, y + 18); ctx.lineTo(x + w / 2 + 8, y + 2);
        ctx.moveTo(x + w / 2 + 8, y + 18); ctx.lineTo(x + w / 2 - 8, y + 2);
        ctx.stroke();

        // Simple Banner
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + w / 2 - 12, y + 42, 8, 16);
        ctx.fillRect(x + w / 2 + 4, y + 42, 8, 16);
        return;
    }

    // Age 3 and 4: Stave Church / Great Hall of Valhalla
    // Earth/stone base
    ctx.fillStyle = '#4a4a38';
    ctx.fillRect(x, y + h - 12, w, 12);
    ctx.fillStyle = '#5a5a48';
    ctx.fillRect(x + 4, y + h - 14, w - 8, 4);

    if (age === 4) {
        // Massive stone foundation edges for Great Hall
        ctx.fillStyle = '#6a6a68';
        ctx.fillRect(x - 4, y + h - 8, w + 8, 8);
        // Rune stones
        ctx.fillStyle = '#7a7a78';
        ctx.fillRect(x + 4, y + h - 20, 6, 12);
        ctx.fillRect(x + w - 10, y + h - 20, 6, 12);
        ctx.fillStyle = accentColor;
        ctx.fillRect(x + 6, y + h - 18, 2, 4);
    }

    // Vertical plank walls (Stave style)
    const wallY = age === 4 ? 26 : 22;
    ctx.fillStyle = wallDark;
    ctx.fillRect(x + 4, y + wallY, w - 8, h - wallY - 12);
    ctx.fillStyle = wallMain;
    ctx.fillRect(x + 6, y + wallY + 2, w - 12, h - wallY - 16);
    // Vertical grooves
    ctx.fillStyle = '#1a1005';
    for (let ix = x + 10; ix < x + w - 10; ix += 6) {
        ctx.fillRect(ix, y + wallY + 2, 1, h - wallY - 16);
    }

    // Heavy corner posts
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + 4, y + wallY, 4, h - wallY - 12);
    ctx.fillRect(x + w - 8, y + wallY, 4, h - wallY - 12);
    if (age === 4) {
        ctx.fillRect(x + w / 2 - 18, y + wallY, 4, h - wallY - 12);
        ctx.fillRect(x + w / 2 + 14, y + wallY, 4, h - wallY - 12);
    }

    // Heavy wood door with iron studs
    const doorH = age === 4 ? 38 : 32;
    const doorW = age === 4 ? 28 : 24;
    ctx.fillStyle = '#1a1005';
    ctx.fillRect(x + w / 2 - doorW / 2 - 2, y + h - doorH - 12, doorW + 4, doorH);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x + w / 2 - doorW / 2, y + h - doorH - 10, doorW, doorH - 2);

    // Iron hinge bands
    ctx.fillStyle = '#111';
    ctx.fillRect(x + w / 2 - doorW / 2, y + h - doorH + 2, doorW, 3);
    ctx.fillRect(x + w / 2 - doorW / 2, y + h - 24, doorW, 3);

    // Flaming Braziers (Age 4)
    if (age === 4) {
        ctx.fillStyle = '#111';
        ctx.fillRect(x + w / 2 - doorW / 2 - 10, y + h - 24, 6, 12);
        ctx.fillRect(x + w / 2 + doorW / 2 + 4, y + h - 24, 6, 12);
        ctx.fillStyle = '#ff6600'; // Fire
        ctx.beginPath(); ctx.arc(x + w / 2 - doorW / 2 - 7, y + h - 26, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w / 2 + doorW / 2 + 7, y + h - 26, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(x + w / 2 - doorW / 2 - 7, y + h - 26, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w / 2 + doorW / 2 + 7, y + h - 26, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Shields on walls
    const shieldCols = [teamColor, accentColor, '#e8e8e0', '#333'];
    const shieldY = y + h - 34;
    for (const sx of [x + 12, x + w - 20]) {
        ctx.fillStyle = shieldCols[0];
        ctx.beginPath();
        ctx.arc(sx + 4, shieldY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = shieldCols[1];
        ctx.beginPath();
        ctx.arc(sx + 4, shieldY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a8a88'; // Boss
        ctx.beginPath();
        ctx.arc(sx + 4, shieldY, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Tiered Stave Roofs
    const drawStaveRoof = (ry: number, rw: number, height: number, depth: number) => {
        ctx.fillStyle = roofDark;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - rw / 2 - 4, ry);
        ctx.lineTo(x + w / 2, ry - height);
        ctx.lineTo(x + w / 2 + rw / 2 + 4, ry);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = roofMain;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - rw / 2, ry - 2);
        ctx.lineTo(x + w / 2, ry - height + 2);
        ctx.lineTo(x + w / 2 + rw / 2, ry - 2);
        ctx.closePath();
        ctx.fill();

        // Shingle texture
        ctx.fillStyle = roofLight;
        for (let sy = ry - 6; sy > ry - height + 6; sy -= 6) {
            const widthAtY = (sy - (ry - height)) / height * rw;
            for (let sx = x + w / 2 - widthAtY / 2; sx < x + w / 2 + widthAtY / 2; sx += 4) {
                ctx.fillRect(sx, sy, 2, 3);
            }
        }
    };

    // Main lowest roof
    drawStaveRoof(y + wallY + 2, w + 12, 30, 0);

    // Dragon head prows on main roof
    const drawDragonProw = (px: number, py: number, flip: boolean) => {
        ctx.fillStyle = '#2a1808';
        const dir = flip ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + 6 * dir, py - 6, px + 8 * dir, py - 12);
        ctx.quadraticCurveTo(px + 4 * dir, py - 4, px, py - 2);
        ctx.fill();
        ctx.fillStyle = '#ff4444'; // Red eye
        ctx.fillRect(px + 6 * dir, py - 10, 2, 2);
    };

    drawDragonProw(x - 4, y + wallY - 8, true);
    drawDragonProw(x + w + 4, y + wallY - 8, false);

    // Second Roof Tier (Age 3+)
    ctx.fillStyle = wallDark;
    ctx.fillRect(x + w / 2 - 14, y - 6, 28, 14);
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x + w / 2 - 14, y - 6, 3, 14);
    ctx.fillRect(x + w / 2 + 11, y - 6, 3, 14);
    drawStaveRoof(y + 2, 32, 24, 0);

    drawDragonProw(x + w / 2 - 16, y - 12, true);
    drawDragonProw(x + w / 2 + 16, y - 12, false);

    // Third Roof Tier (Age 4)
    if (age === 4) {
        ctx.fillStyle = wallDark;
        ctx.fillRect(x + w / 2 - 8, y - 26, 16, 10);
        drawStaveRoof(y - 16, 20, 20, 0);

        ctx.fillStyle = '#ffd700'; // Gold dragon finials for Age 4
        ctx.fillRect(x + w / 2 - 1, y - 40, 2, 8);
        ctx.fillRect(x + w / 2 - 4, y - 36, 8, 2);
    } else {
        // Wooden finial
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(x + w / 2 - 1, y - 28, 2, 8);
    }

    // Aura (Age 4)
    if (age === 4) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.7, h * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

