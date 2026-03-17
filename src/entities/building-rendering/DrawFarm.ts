// ============================================================
//  Farm Renderer — Civilization-specific farm drawing
//  Extracted from Building.ts
// ============================================================

import type { Building } from "../Building";
import { CivilizationType } from "../../config/GameConfig";
import { getCivBuildingColors } from "./BuildingColors";

export function drawFarm(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const cc = getCivBuildingColors(b);
    const civ = cc.civ;
    const t = Date.now() / 1000;
    const growthPct = b.hp / b.maxHp;

    // === SOIL BASE — civ-specific ===
    let soilDark: string, soilLight: string, fenceColor: string, fencePostColor: string;
    switch (civ) {
        case CivilizationType.BaTu:
            soilDark = '#9a7a40'; soilLight = '#b89850'; // sandy desert soil
            fenceColor = '#c9a84c'; fencePostColor = '#a08030';
            break;
        case CivilizationType.DaiMinh:
            soilDark = '#5a6a50'; soilLight = '#6a7a5a'; // wet paddy soil
            fenceColor = '#6a8a3a'; fencePostColor = '#4a6a2a';
            break;
        case CivilizationType.Yamato:
            soilDark = '#5a5040'; soilLight = '#6a6050'; // dark rich soil
            fenceColor = '#5a4a2a'; fencePostColor = '#3a2a1a';
            break;
        case CivilizationType.LaMa:
            soilDark = '#7a5a30'; soilLight = '#8a6a3a'; // Mediterranean soil
            fenceColor = '#8a8a88'; fencePostColor = '#6a6a68';
            break;
        case CivilizationType.Viking:
            soilDark = '#5a4a28'; soilLight = '#6a5a38'; // dark Nordic soil
            fenceColor = '#6a5040'; fencePostColor = '#4a3020';
            break;
        default:
            soilDark = '#6b4423'; soilLight = '#7a5433';
            fenceColor = '#8a6a3a'; fencePostColor = '#6a4a2a';
    }

    // Tilled soil base
    ctx.fillStyle = soilDark;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Soil rows
    ctx.fillStyle = civ === CivilizationType.DaiMinh ? '#4a5a48' : '#' + soilDark.slice(1);
    for (let r = 0; r < 4; r++) {
        const ry = y + 4 + r * (h - 8) / 4;
        ctx.fillRect(x + 4, ry, w - 8, 2);
    }

    // Lighter soil between rows
    ctx.fillStyle = soilLight;
    for (let r = 0; r < 4; r++) {
        const ry = y + 8 + r * (h - 8) / 4;
        ctx.fillRect(x + 4, ry, w - 8, (h - 8) / 4 - 4);
    }

    // === CIV-SPECIFIC WATER/DECORATION ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Irrigation channels (golden water lines)
            ctx.fillStyle = 'rgba(100,160,200,0.25)';
            ctx.fillRect(x + 4, y + h / 2 - 1, w - 8, 2);
            ctx.fillRect(x + w / 2 - 1, y + 4, 2, h - 8);
            break;
        case CivilizationType.DaiMinh:
            // Flooded paddy water
            ctx.fillStyle = 'rgba(80,140,180,0.2)';
            for (let r = 0; r < 4; r++) {
                const ry = y + 8 + r * (h - 8) / 4;
                ctx.fillRect(x + 4, ry, w - 8, (h - 8) / 4 - 4);
            }
            break;
        case CivilizationType.LaMa:
            // Trellis support lines for grapes
            if (growthPct > 0.3) {
                ctx.strokeStyle = '#8a7a5a';
                ctx.lineWidth = 0.5;
                for (let c = 0; c < 3; c++) {
                    ctx.beginPath();
                    ctx.moveTo(x + 10 + c * (w - 20) / 2, y + 4);
                    ctx.lineTo(x + 10 + c * (w - 20) / 2, y + h - 4);
                    ctx.stroke();
                }
            }
            break;
        case CivilizationType.Yamato:
            // Neat stone border between rows
            ctx.fillStyle = 'rgba(200,190,170,0.15)';
            for (let r = 0; r < 4; r++) {
                ctx.fillRect(x + 4, y + 4 + r * (h - 8) / 4, w - 8, 1);
            }
            break;
    }

    // === GROWING CROPS — civ-specific ===
    const numCols = 6;
    const numRows = 4;
    const cropH = 6 + growthPct * 10;

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            const cx = x + 6 + c * (w - 12) / numCols;
            const cy = y + 6 + r * (h - 10) / numRows;
            const sway = Math.sin(t * 2 + c * 0.7 + r * 1.1) * 1.5 * growthPct;

            switch (civ) {
                case CivilizationType.BaTu:
                    // Saffron / spice crops — purple-gold heads
                    ctx.strokeStyle = growthPct > 0.3 ? '#5a9a3a' : '#8a7a40';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 4);
                    ctx.lineTo(cx + sway, cy + 4 - cropH);
                    ctx.stroke();
                    if (growthPct > 0.4) {
                        ctx.fillStyle = growthPct > 0.7 ? '#cc88ff' : '#5aaa3a';
                        ctx.fillRect(cx + sway - 1, cy + 4 - cropH - 2, 3, 3);
                        // Saffron threads
                        if (growthPct > 0.7) {
                            ctx.fillStyle = '#ff6600';
                            ctx.fillRect(cx + sway, cy + 4 - cropH - 3, 1, 2);
                        }
                    }
                    break;

                case CivilizationType.DaiMinh:
                    // Rice paddies — thin stalks, drooping heads
                    ctx.strokeStyle = growthPct > 0.3 ? '#4a8a2a' : '#6a7a40';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 4);
                    ctx.lineTo(cx + sway * 0.7, cy + 4 - cropH);
                    ctx.stroke();
                    if (growthPct > 0.4) {
                        // Drooping rice panicle
                        ctx.strokeStyle = growthPct > 0.7 ? '#c9a840' : '#5a9a3a';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(cx + sway * 0.7, cy + 4 - cropH);
                        ctx.quadraticCurveTo(cx + sway + 4, cy + 4 - cropH + 2, cx + sway + 3, cy + 4 - cropH + 5);
                        ctx.stroke();
                    }
                    break;

                case CivilizationType.Yamato:
                    // Neat rice rows — similar to DaiMinh but more orderly
                    ctx.strokeStyle = growthPct > 0.3 ? '#3a7a2a' : '#5a6a40';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 4);
                    ctx.lineTo(cx + sway * 0.5, cy + 4 - cropH);
                    ctx.stroke();
                    if (growthPct > 0.4) {
                        ctx.fillStyle = growthPct > 0.7 ? '#b8a030' : '#4a9a2a';
                        ctx.fillRect(cx + sway * 0.5 - 1, cy + 4 - cropH - 2, 2, 3);
                    }
                    if (growthPct > 0.5) {
                        ctx.strokeStyle = '#3a7a2a';
                        ctx.beginPath();
                        ctx.moveTo(cx, cy + 4 - cropH * 0.4);
                        ctx.lineTo(cx + sway * 0.5 + 2, cy + 4 - cropH * 0.5);
                        ctx.stroke();
                    }
                    break;

                case CivilizationType.LaMa:
                    // Grape vines on trellises
                    ctx.strokeStyle = growthPct > 0.3 ? '#4a7a2a' : '#6a6a40';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 4);
                    ctx.lineTo(cx + sway * 0.8, cy + 4 - cropH);
                    ctx.stroke();
                    if (growthPct > 0.4) {
                        // Grape clusters
                        ctx.fillStyle = growthPct > 0.7 ? '#6a2a6a' : '#4a8a2a';
                        ctx.beginPath();
                        ctx.arc(cx + sway * 0.8, cy + 4 - cropH + 1, 2, 0, Math.PI * 2);
                        ctx.fill();
                        if (growthPct > 0.7) {
                            ctx.beginPath();
                            ctx.arc(cx + sway * 0.8 + 1, cy + 4 - cropH + 3, 1.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    // Leaf
                    if (growthPct > 0.5) {
                        ctx.fillStyle = '#4a8a2a';
                        ctx.fillRect(cx + sway * 0.8 - 2, cy + 4 - cropH * 0.6, 3, 2);
                    }
                    break;

                case CivilizationType.Viking:
                    // Barley / root vegetables — thick sturdy stalks
                    ctx.strokeStyle = growthPct > 0.3 ? '#5a8a2a' : '#7a7a40';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 4);
                    ctx.lineTo(cx + sway, cy + 4 - cropH);
                    ctx.stroke();
                    if (growthPct > 0.4) {
                        // Barley ears (bushy)
                        ctx.fillStyle = growthPct > 0.7 ? '#c8a830' : '#5a9a3a';
                        ctx.fillRect(cx + sway - 2, cy + 4 - cropH - 3, 4, 4);
                        // Side awns
                        if (growthPct > 0.6) {
                            ctx.strokeStyle = '#b8a030';
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(cx + sway - 2, cy + 4 - cropH - 2);
                            ctx.lineTo(cx + sway - 4, cy + 4 - cropH - 4);
                            ctx.moveTo(cx + sway + 2, cy + 4 - cropH - 2);
                            ctx.lineTo(cx + sway + 4, cy + 4 - cropH - 4);
                            ctx.stroke();
                        }
                    }
                    break;

                default:
                    // Default wheat
                    ctx.strokeStyle = growthPct > 0.3 ? '#4a8a2a' : '#7a6a40';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 4);
                    ctx.lineTo(cx + sway, cy + 4 - cropH);
                    ctx.stroke();
                    if (growthPct > 0.4) {
                        ctx.fillStyle = growthPct > 0.7 ? '#daa520' : '#6aaa3a';
                        ctx.fillRect(cx + sway - 1, cy + 4 - cropH - 2, 3, 3);
                    }
            }
        }
    }

    // === FENCE BORDER — civ-specific ===
    ctx.strokeStyle = fenceColor;
    ctx.lineWidth = civ === CivilizationType.LaMa ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + w - 1, y + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h - 1);
    ctx.lineTo(x + w - 1, y + h - 1);
    ctx.stroke();

    // Fence posts
    ctx.fillStyle = fencePostColor;
    ctx.fillRect(x, y, 3, h);
    ctx.fillRect(x + w - 3, y, 3, h);
    ctx.fillRect(x + w / 2 - 1, y, 2, 3);
    ctx.fillRect(x + w / 2 - 1, y + h - 3, 2, 3);

    // === CIV-SPECIFIC CORNER DETAILS ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Gold corner ornaments
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(x, y, 4, 4);
            ctx.fillRect(x + w - 4, y, 4, 4);
            ctx.fillRect(x, y + h - 4, 4, 4);
            ctx.fillRect(x + w - 4, y + h - 4, 4, 4);
            break;
        case CivilizationType.DaiMinh:
            // Bamboo joint marks
            ctx.fillStyle = '#4a6a2a';
            ctx.fillRect(x + 1, y + h / 3, 2, 2);
            ctx.fillRect(x + 1, y + 2 * h / 3, 2, 2);
            ctx.fillRect(x + w - 3, y + h / 3, 2, 2);
            ctx.fillRect(x + w - 3, y + 2 * h / 3, 2, 2);
            break;
        case CivilizationType.LaMa:
            // Stone corner posts
            ctx.fillStyle = '#9a9a98';
            ctx.fillRect(x - 1, y - 1, 5, 5);
            ctx.fillRect(x + w - 4, y - 1, 5, 5);
            ctx.fillRect(x - 1, y + h - 4, 5, 5);
            ctx.fillRect(x + w - 4, y + h - 4, 5, 5);
            break;
    }
}
