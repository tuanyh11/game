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

    // Organic tilled soil base (rounded blob)
    ctx.fillStyle = soilDark;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 2, w - 8, h - 4, 15);
    ctx.roundRect(x + 2, y + 6, w - 4, h - 12, 10);
    ctx.fill();

    // Wavy soil rows
    ctx.strokeStyle = civ === CivilizationType.DaiMinh ? '#4a5a48' : '#' + soilDark.slice(1);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let r = 0; r < 4; r++) {
        const ry = y + 10 + r * (h - 20) / 4;
        ctx.beginPath();
        for(let px = 8; px < w - 8; px += 5) {
            const py = ry + Math.sin((x + px) * 0.1 + r) * 2;
            if (px === 8) ctx.moveTo(x + px, py);
            else ctx.lineTo(x + px, py);
        }
        ctx.stroke();
    }

    // Lighter wavy soil between rows
    ctx.strokeStyle = soilLight;
    ctx.lineWidth = 5;
    for (let r = 0; r < 4; r++) {
        const ry = y + 16 + r * (h - 20) / 4;
        ctx.beginPath();
        for(let px = 10; px < w - 10; px += 5) {
            const py = ry + Math.sin((x + px) * 0.1 + r + 0.5) * 2;
            if (px === 10) ctx.moveTo(x + px, py);
            else ctx.lineTo(x + px, py);
        }
        ctx.stroke();
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
            // Scatter the positions organically so they don't form a strict grid
            const scatterX = Math.sin(r * 13 + c * 29) * 4;
            const scatterY = Math.cos(r * 17 + c * 31) * 3;
            const cx = x + 10 + c * (w - 20) / (numCols - 1 > 0 ? numCols - 1 : 1) + scatterX;
            const cy = y + 12 + r * (h - 24) / (numRows - 1 > 0 ? numRows - 1 : 1) + scatterY;
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

    // === DEPLETED FARM OVERLAY — withered crops ===
    if (b.farmResource && b.farmResource.amount <= 0) {
        const dt = Date.now() / 1000;

        // Brownish withered overlay
        ctx.fillStyle = 'rgba(80, 50, 20, 0.45)';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Cracked dry soil lines
        ctx.strokeStyle = '#4a3010';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) {
            const cx = x + 6 + Math.abs((i * 43) % (w - 12));
            const cy = y + 6 + Math.abs((i * 67) % (h - 12));
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 6 + (i % 3) * 3, cy + 4 + (i % 2) * 3);
            ctx.lineTo(cx + 10 + (i % 2) * 4, cy + 2);
            ctx.stroke();
        }

        // Withered crops — bent, dried, leaning stalks replacing green ones
        const numC = 6, numR = 4;
        for (let r = 0; r < numR; r++) {
            for (let c = 0; c < numC; c++) {
                const cx = x + 6 + c * (w - 12) / numC;
                const cy = y + 6 + r * (h - 10) / numR;
                const lean = Math.sin(r * 2.3 + c * 1.7) * 3;

                // Dried bent stalk
                ctx.strokeStyle = '#7a5a20';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx + 1, cy + 8);
                ctx.quadraticCurveTo(cx + lean, cy + 3, cx + lean * 1.5, cy + 1);
                ctx.stroke();

                // Dry broken head
                ctx.fillStyle = '#8a6a25';
                ctx.fillRect(cx + lean * 1.5 - 1, cy, 3, 2);

                // Scattered dry leaf debris
                if ((r + c) % 3 === 0) {
                    ctx.fillStyle = '#6a4a18';
                    ctx.fillRect(cx + 2, cy + 9, 3, 1);
                }
            }
        }

        // Subtle dust particles floating up (animated)
        for (let p = 0; p < 4; p++) {
            const px = x + 8 + Math.abs((p * 53) % (w - 16));
            const py = y + h - 8 - ((dt * 8 + p * 7) % (h - 10));
            const alpha = 0.15 + Math.sin(dt * 2 + p) * 0.1;
            ctx.fillStyle = `rgba(160, 130, 80, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
