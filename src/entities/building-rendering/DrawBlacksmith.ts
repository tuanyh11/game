// ============================================================
//  Blacksmith Renderer — Civilization-specific blacksmith drawing
//  Each civ has unique forge/workshop style
// ============================================================

import type { Building } from "../Building";
import { CivilizationType } from "../../config/GameConfig";
import { getCivBuildingColors, CivBuildingColors } from "./BuildingColors";

export function drawBlacksmith(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const cc = getCivBuildingColors(b);
    const age = b.age;
    const civ = b.civilization;

    // === FOUNDATION — civ material ===
    switch (civ) {
        case CivilizationType.BaTu:
            ctx.fillStyle = '#b0a080';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
            ctx.fillStyle = '#c0b090';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 3);
            break;
        case CivilizationType.DaiMinh:
            ctx.fillStyle = '#4a3a38';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
            ctx.fillStyle = '#5a4a48';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 3);
            break;
        case CivilizationType.Yamato:
            ctx.fillStyle = '#b0a898';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
            ctx.fillStyle = '#c0b8a8';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 3);
            break;
        case CivilizationType.Viking:
            ctx.fillStyle = '#3a3028';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
            ctx.fillStyle = '#4a4038';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 3);
            break;
        default:
            ctx.fillStyle = cc.wallDark;
            ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
            ctx.fillStyle = '#4a4a48';
            ctx.fillRect(x + 2, y + h - 8, w - 4, 3);
    }

    // === WALLS — civ styled ===
    ctx.fillStyle = cc.wallDark;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 20);
    ctx.fillStyle = cc.wallMain;
    ctx.fillRect(x + 6, y + 12, w - 12, h - 22);
    ctx.fillStyle = cc.wallHi;
    ctx.fillRect(x + 6, y + 12, 3, h - 22);

    // Wall texture per civ
    switch (civ) {
        case CivilizationType.BaTu:
            ctx.fillStyle = 'rgba(201,168,76,0.06)';
            for (let i = 0; i < 3; i++) ctx.fillRect(x + 6, y + 18 + i * 14, w - 12, 1);
            break;
        case CivilizationType.DaiMinh:
            ctx.fillStyle = '#8a2222';
            ctx.fillRect(x + 4, y + 12, 3, h - 20);
            ctx.fillRect(x + w - 7, y + 12, 3, h - 20);
            break;
        case CivilizationType.Yamato:
            ctx.fillStyle = '#2a2018';
            ctx.fillRect(x + 4, y + 12, w - 8, 2);
            ctx.fillRect(x + 4, y + 12, 3, h - 20);
            ctx.fillRect(x + w - 7, y + 12, 3, h - 20);
            break;
        case CivilizationType.Viking:
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < 5; i++) ctx.fillRect(x + 6, y + 14 + i * 10, w - 12, 2);
            ctx.fillStyle = cc.wallDark;
            ctx.fillRect(x + 2, y + 12, 4, h - 20);
            ctx.fillRect(x + w - 6, y + 12, 4, h - 20);
            break;
        default:
            if (age >= 3) {
                ctx.fillStyle = 'rgba(0,0,0,0.06)';
                for (let row = 0; row < 3; row++) {
                    const by = y + 18 + row * 14;
                    ctx.fillRect(x + 6, by, w - 12, 1);
                }
            }
    }

    // === FURNACE/FORGE — universal but civ-accented ===
    const forgeColor = civ === CivilizationType.BaTu ? '#cc7700'
        : civ === CivilizationType.DaiMinh ? '#cc2200'
            : civ === CivilizationType.Viking ? '#dd5500'
                : '#ff4400';

    ctx.fillStyle = forgeColor;
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 400) * 0.1;
    ctx.fillRect(x + w / 2 - 10, y + 16, 20, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(x + w / 2 - 8, y + 18, 16, 14);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(x + w / 2 - 5, y + 20, 10, 8);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(x + w / 2 - 3, y + 22, 6, 4);

    // === CHIMNEY — civ styled ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Wider ornate chimney
            ctx.fillStyle = cc.wallMain;
            ctx.fillRect(x + w / 2 - 6, y - 6, 12, 20);
            ctx.fillStyle = cc.accentColor;
            ctx.fillRect(x + w / 2 - 8, y - 8, 16, 4);
            break;
        case CivilizationType.DaiMinh:
            ctx.fillStyle = '#5a4a48';
            ctx.fillRect(x + w / 2 - 4, y - 4, 8, 18);
            ctx.fillStyle = cc.roofMain;
            ctx.fillRect(x + w / 2 - 6, y - 6, 12, 4);
            break;
        case CivilizationType.Yamato:
            ctx.fillStyle = '#2a2018';
            ctx.fillRect(x + w / 2 - 3, y - 4, 6, 18);
            ctx.fillStyle = cc.roofMain;
            ctx.fillRect(x + w / 2 - 5, y - 6, 10, 3);
            break;
        case CivilizationType.Viking:
            // Stone chimney
            ctx.fillStyle = '#4a4a48';
            ctx.fillRect(x + w / 2 - 5, y - 8, 10, 22);
            ctx.fillStyle = '#5a5a58';
            ctx.fillRect(x + w / 2 - 7, y - 10, 14, 4);
            break;
        default:
            ctx.fillStyle = '#3a3a38';
            ctx.fillRect(x + w / 2 - 4, y - 4, 8, 18);
            ctx.fillStyle = '#4a4a48';
            ctx.fillRect(x + w / 2 - 6, y - 6, 12, 4);
    }

    // Smoke particles
    const smokeT = Date.now() / 600;
    ctx.fillStyle = 'rgba(100,100,100,0.3)';
    for (let i = 0; i < 3; i++) {
        const sy = y - 10 - i * 6 - (smokeT % 3) * 2;
        const sx = x + w / 2 - 1 + Math.sin(smokeT + i) * 3;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + i, 0, Math.PI * 2);
        ctx.fill();
    }

    // === ROOF — civ specific shape ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Flat parapet
            ctx.fillStyle = cc.roofDark;
            ctx.fillRect(x - 2, y + 4, w + 4, 12);
            ctx.fillStyle = cc.roofMain;
            ctx.fillRect(x, y + 2, w, 10);
            ctx.fillStyle = cc.accentColor;
            ctx.fillRect(x - 2, y + 1, w + 4, 2);
            break;
        case CivilizationType.DaiMinh: {
            // Curved eaves
            const ov = 6;
            ctx.fillStyle = cc.roofDark;
            ctx.beginPath();
            ctx.moveTo(x - ov, y + 16);
            ctx.quadraticCurveTo(x + w / 2, y, x + w + ov, y + 16);
            ctx.lineTo(x + w + ov, y + 20);
            ctx.quadraticCurveTo(x + w / 2, y + 4, x - ov, y + 20);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = cc.roofMain;
            ctx.beginPath();
            ctx.moveTo(x - ov + 2, y + 14);
            ctx.quadraticCurveTo(x + w / 2, y + 2, x + w + ov - 2, y + 14);
            ctx.lineTo(x + w + ov - 2, y + 18);
            ctx.quadraticCurveTo(x + w / 2, y + 6, x - ov + 2, y + 18);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = cc.roofLight;
            ctx.fillRect(x - ov, y + 12, 3, 3);
            ctx.fillRect(x + w + ov - 3, y + 12, 3, 3);
            break;
        }
        case CivilizationType.Yamato:
            // Steep dark gable
            ctx.fillStyle = cc.roofDark;
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 14);
            ctx.lineTo(x + w / 2, y - 4);
            ctx.lineTo(x + w + 4, y + 14);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = cc.roofMain;
            ctx.beginPath();
            ctx.moveTo(x - 2, y + 12);
            ctx.lineTo(x + w / 2, y - 2);
            ctx.lineTo(x + w + 2, y + 12);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(x - 2, y + 11, w + 4, 2);
            break;
        case CivilizationType.Viking:
            // A-frame thatch
            ctx.fillStyle = cc.roofDark;
            ctx.beginPath();
            ctx.moveTo(x - 6, y + 14);
            ctx.lineTo(x + w / 2, y - 8);
            ctx.lineTo(x + w + 6, y + 14);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = cc.roofMain;
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 12);
            ctx.lineTo(x + w / 2, y - 6);
            ctx.lineTo(x + w + 4, y + 12);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = cc.roofLight;
            ctx.beginPath();
            ctx.moveTo(x - 2, y + 10);
            ctx.lineTo(x + w / 2, y - 4);
            ctx.lineTo(x + w / 2, y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = cc.wallDark;
            ctx.fillRect(x + w / 2 - 2, y - 8, 4, 20);
            break;
        default:
            // LaMa flat with cornice
            ctx.fillStyle = cc.roofDark;
            ctx.fillRect(x - 2, y + 4, w + 4, 12);
            ctx.fillStyle = cc.roofMain;
            ctx.fillRect(x, y + 2, w, 10);
            ctx.fillStyle = cc.roofLight;
            ctx.fillRect(x, y + 2, w, 3);
            ctx.fillStyle = cc.accentColor;
            ctx.fillRect(x - 2, y + 1, w + 4, 2);
    }

    // Door opening
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(x + w / 2 - 8, y + h - 30, 16, 22);
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + w / 2 - 6, y + h - 28, 12, 18);

    // === ANVIL — civ-accented ===
    const anvilColor = civ === CivilizationType.BaTu ? '#8a7a5a'
        : civ === CivilizationType.DaiMinh ? '#6a6068'
            : civ === CivilizationType.Viking ? '#4a5a6a'
                : '#5a5a5a';
    ctx.fillStyle = anvilColor;
    ctx.fillRect(x + 10, y + h - 18, 12, 4);
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(x + 8, y + h - 20, 16, 4);
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(x + 12, y + h - 14, 4, 6);

    // === WEAPON RACK — civ-specific weapons ===
    ctx.fillStyle = civ === CivilizationType.Viking ? '#4a3828' : '#5a3a10';
    ctx.fillRect(x + w - 18, y + 18, 2, 28);
    switch (civ) {
        case CivilizationType.BaTu:
            // Curved scimitars
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + w - 22, y + 20);
            ctx.quadraticCurveTo(x + w - 18, y + 24, x + w - 14, y + 22);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + w - 22, y + 30);
            ctx.quadraticCurveTo(x + w - 18, y + 34, x + w - 14, y + 32);
            ctx.stroke();
            break;
        case CivilizationType.DaiMinh:
            ctx.fillStyle = '#ccc';
            ctx.fillRect(x + w - 22, y + 20, 8, 2);
            ctx.fillRect(x + w - 20, y + 28, 6, 2);
            ctx.fillStyle = '#cc2222';
            ctx.fillRect(x + w - 22, y + 22, 2, 3);
            ctx.fillRect(x + w - 20, y + 30, 2, 3);
            break;
        case CivilizationType.Yamato:
            // Katana blades
            ctx.fillStyle = '#ddd';
            ctx.fillRect(x + w - 24, y + 20, 10, 1);
            ctx.fillRect(x + w - 22, y + 28, 8, 1);
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(x + w - 15, y + 19, 2, 3);
            ctx.fillRect(x + w - 15, y + 27, 2, 3);
            break;
        case CivilizationType.Viking:
            // Axes
            ctx.fillStyle = '#aaa';
            ctx.fillRect(x + w - 24, y + 18, 6, 4);
            ctx.fillRect(x + w - 22, y + 28, 6, 4);
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(x + w - 18, y + 18, 2, 16);
            break;
        default:
            ctx.fillStyle = '#ccc';
            ctx.fillRect(x + w - 22, y + 20, 8, 2);
            ctx.fillRect(x + w - 20, y + 28, 6, 2);
            if (age >= 3) ctx.fillRect(x + w - 22, y + 36, 8, 2);
    }

    // === SHIELD on wall ===
    ctx.fillStyle = cc.teamColor;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 22);
    ctx.lineTo(x + 22, y + 22);
    ctx.lineTo(x + 22, y + 32);
    ctx.lineTo(x + 18, y + 36);
    ctx.lineTo(x + 14, y + 32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cc.accentColor;
    ctx.fillRect(x + 16, y + 24, 4, 4);

    // Age 4: Magic forge glow
    if (age >= 4) {
        ctx.globalAlpha = 0.06 + Math.sin(Date.now() / 500) * 0.03;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.6, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
