// ============================================================
//  Barracks Renderer — Civilization-specific barracks drawing
//  Extracted from Building.ts
// ============================================================

import type { Building } from "../Building";
import { CivilizationType, C, CIVILIZATION_DATA } from "../../config/GameConfig";
import { getCivBuildingColors, darkenColor } from "./BuildingColors";

export function drawBarracks(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const civC = getCivBuildingColors(b);
    const age = b.age;
    const civ = civC.civ;
    const teamColor = civC.teamColor;
    const teamDark = b.slotColor ? darkenColor(b.slotColor, 0.6) : (b.team === 0 ? CIVILIZATION_DATA[b.civilization].secondaryColor : '#992222');
    const roofMain = civC.roofMain;
    const roofHi = civC.roofLight;

    // === STONE FOUNDATION — civ material ===
    switch (civ) {
        case CivilizationType.BaTu:
            ctx.fillStyle = '#b0a080';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
            ctx.fillStyle = '#c0b090';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 3);
            break;
        case CivilizationType.DaiMinh:
            ctx.fillStyle = '#4a3a38';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
            ctx.fillStyle = '#5a4a48';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 3);
            break;
        case CivilizationType.Yamato:
            ctx.fillStyle = '#b0a898';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
            ctx.fillStyle = '#c0b8a8';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 3);
            break;
        case CivilizationType.Viking:
            ctx.fillStyle = '#3a3028';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
            ctx.fillStyle = '#4a4038';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 3);
            break;
        default: // LaMa + fallback
            ctx.fillStyle = age >= 3 ? '#2a2a28' : '#3a3a38';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 10);
            ctx.fillStyle = age >= 3 ? '#3a3a38' : '#4a4a48';
            ctx.fillRect(x + 2, y + h - 10, w - 4, 3);
    }
    // Foundation details
    ctx.fillStyle = civC.wallDark;
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(x + 6 + i * (w - 12) / 6, y + h - 8, 1, 6);
    }
    if (age >= 3) {
        ctx.fillStyle = civC.wallDark;
        ctx.fillRect(x - 2, y + h - 6, w + 4, 6);
    }

    // === WALLS — civ-specific ===
    ctx.fillStyle = civC.wallDark;
    ctx.fillRect(x + 4, y + 14, w - 8, h - 24);
    ctx.fillStyle = civC.wallMain;
    ctx.fillRect(x + 6, y + 14, w - 12, h - 26);
    ctx.fillStyle = civC.wallHi;
    ctx.fillRect(x + 6, y + 14, 3, h - 26);
    ctx.fillStyle = civC.wallDark;
    ctx.fillRect(x + w - 9, y + 14, 3, h - 26);

    // Wall texture — per civ
    switch (civ) {
        case CivilizationType.BaTu:
            // Sandstone blocks with gold mortar
            ctx.fillStyle = 'rgba(201,168,76,0.08)';
            for (let row = 0; row < 4; row++) {
                const by = y + 20 + row * 20;
                ctx.fillRect(x + 6, by, w - 12, 1);
            }
            // Decorative arches
            ctx.fillStyle = civC.accentColor;
            ctx.fillRect(x + 6, y + 14, w - 12, 2);
            break;
        case CivilizationType.DaiMinh:
            // Painted wall with red accents
            ctx.fillStyle = 'rgba(170,34,34,0.06)';
            for (let row = 0; row < 4; row++) {
                ctx.fillRect(x + 6, y + 20 + row * 18, w - 12, 1);
            }
            // Red horizontal bands
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(x + 4, y + 14, w - 8, 3);
            ctx.fillRect(x + 4, y + h - 14, w - 8, 3);
            break;
        case CivilizationType.Yamato:
            // Clean dark wood planking
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            for (let row = 0; row < 5; row++) {
                ctx.fillRect(x + 6, y + 18 + row * 16, w - 12, 1);
            }
            // Vertical beams
            ctx.fillStyle = civC.wallDark;
            ctx.fillRect(x + w / 2 - 1, y + 14, 2, h - 26);
            break;
        case CivilizationType.LaMa:
            // Classical stone blocks
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            for (let row = 0; row < 4; row++) {
                const by = y + 20 + row * 20;
                ctx.fillRect(x + 6, by, w - 12, 1);
                for (let col = 0; col < 4; col++) {
                    const bx = x + 10 + col * (w - 20) / 4 + (row % 2) * 10;
                    if (bx < x + w - 10) ctx.fillRect(bx, by, 1, 20);
                }
            }
            break;
        case CivilizationType.Viking:
            // Horizontal log construction + palisade
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < 8; i++) {
                ctx.fillRect(x + 6, y + 16 + i * 10, w - 12, 2);
            }
            // Vertical palisade stakes on top
            ctx.fillStyle = civC.wallDark;
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(x + 8 + i * (w - 16) / 5, y + 14, 3, h - 26);
            }
            break;
    }

    // === IRON BAND REINFORCEMENT — civ accent ===
    const bandColor = civ === CivilizationType.BaTu ? '#c9a84c'
        : civ === CivilizationType.DaiMinh ? '#aa2222'
            : civ === CivilizationType.Viking ? '#4a4a48'
                : (age >= 4 ? '#5a5a60' : age >= 3 ? '#4a4a50' : '#3a3a40');
    ctx.fillStyle = bandColor;
    ctx.fillRect(x + 4, y + 14, w - 8, 3);
    ctx.fillRect(x + 4, y + h - 14, w - 8, 3);
    if (age >= 2) {
        ctx.fillRect(x + 4, y + 44, w - 8, 2);
    }

    // === ROOF — civ-specific ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Flat parapet with golden crenellations
            ctx.fillStyle = civC.roofDark;
            ctx.fillRect(x - 2, y + 6, w + 4, 12);
            ctx.fillStyle = roofMain;
            ctx.fillRect(x, y + 4, w, 10);
            ctx.fillStyle = civC.accentColor;
            ctx.fillRect(x - 2, y + 3, w + 4, 2);
            break;
        case CivilizationType.DaiMinh:
            // Curved eave red-tiled roof
            ctx.fillStyle = civC.roofDark;
            ctx.fillRect(x - 4, y + 6, w + 8, 12);
            ctx.fillStyle = roofMain;
            ctx.fillRect(x - 2, y + 4, w + 4, 10);
            ctx.fillStyle = roofHi;
            ctx.fillRect(x - 2, y + 4, w + 4, 3);
            // Upturned eaves
            ctx.fillStyle = roofMain;
            ctx.fillRect(x - 6, y + 8, 4, 3);
            ctx.fillRect(x + w + 2, y + 8, 4, 3);
            break;
        case CivilizationType.Yamato:
            // Dark steep irimoya-style roof
            ctx.fillStyle = civC.roofDark;
            ctx.fillRect(x - 2, y + 4, w + 4, 14);
            ctx.fillStyle = roofMain;
            ctx.fillRect(x, y + 4, w, 10);
            // Red ridge
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(x + w / 2 - 6, y + 1, 12, 3);
            break;
        case CivilizationType.Viking:
            // A-frame thatch
            ctx.fillStyle = civC.roofDark;
            ctx.fillRect(x - 4, y + 2, w + 8, 16);
            ctx.fillStyle = roofMain;
            ctx.fillRect(x - 2, y + 2, w + 4, 14);
            // Thatch lines
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(x, y + 4 + i * 3, w, 1);
            }
            break;
        default: // LaMa
            ctx.fillStyle = civC.roofDark;
            ctx.fillRect(x - 2, y + 6, w + 4, 12);
            ctx.fillStyle = roofMain;
            ctx.fillRect(x, y + 4, w, 10);
            ctx.fillStyle = roofHi;
            ctx.fillRect(x, y + 4, w, 3);
            if (age >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x - 2, y + 3, w + 4, 2);
            }
    }

    // Battlements — civ-specific style
    switch (civ) {
        case CivilizationType.BaTu: {
            // Pointed merlons (Persian style)
            const bwP = 8;
            ctx.fillStyle = civC.wallMain;
            for (let i = 0; i < Math.floor(w / 14); i++) {
                ctx.fillRect(x + 4 + i * 14, y - 2, bwP, 8);
                // Pointed top
                ctx.beginPath();
                ctx.moveTo(x + 4 + i * 14, y - 2);
                ctx.lineTo(x + 4 + i * 14 + bwP / 2, y - 6);
                ctx.lineTo(x + 4 + i * 14 + bwP, y - 2);
                ctx.closePath();
                ctx.fill();
            }
            break;
        }
        case CivilizationType.Yamato: {
            // Minimal clean top
            ctx.fillStyle = civC.roofMain;
            ctx.fillRect(x, y - 2, w, 6);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(x, y - 2, w, 1);
            break;
        }
        case CivilizationType.Viking: {
            // Pointed wooden stakes
            ctx.fillStyle = civC.wallDark;
            for (let i = 0; i < Math.floor(w / 10); i++) {
                ctx.fillRect(x + 4 + i * 10, y - 4, 4, 10);
                ctx.beginPath();
                ctx.moveTo(x + 4 + i * 10, y - 4);
                ctx.lineTo(x + 6 + i * 10, y - 8);
                ctx.lineTo(x + 8 + i * 10, y - 4);
                ctx.closePath();
                ctx.fill();
            }
            break;
        }
        default: {
            // Standard merlons (LaMa, DaiMinh)
            const merlonW = age >= 3 ? 8 : 10;
            const merlonGap = age >= 3 ? 6 : 8;
            ctx.fillStyle = civ === CivilizationType.DaiMinh ? civC.roofMain : (age >= 3 ? '#686868' : '#5a5a5a');
            for (let i = 0; i < Math.floor(w / (merlonW + merlonGap)); i++) {
                ctx.fillRect(x + 4 + i * (merlonW + merlonGap), y - 2, merlonW, 8);
            }
            if (age >= 4) {
                ctx.fillStyle = civC.accentColor;
                for (let i = 0; i < Math.floor(w / (merlonW + merlonGap)); i++) {
                    ctx.fillRect(x + 4 + i * (merlonW + merlonGap), y - 2, merlonW, 1);
                }
            }
        }
    }

    // === CORNER TOWERS (Age 3+) — civ-styled ===
    if (age >= 3) {
        for (const side of [0, 1]) {
            const tx = side === 0 ? x - 4 : x + w - 8;
            ctx.fillStyle = civ === CivilizationType.Viking ? (age >= 4 ? '#5a4a38' : '#4a3a28')
                : civ === CivilizationType.BaTu ? (age >= 4 ? '#d0c0a0' : '#c0b090')
                    : (age >= 4 ? '#7a7a78' : '#585858');
            ctx.fillRect(tx, y + 2, 12, h - 12);
            ctx.fillStyle = civC.accentColor;
            ctx.fillRect(tx, y + 2, 12, age >= 4 ? 3 : 2);
            // Arrow slits
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(tx + 4, y + 20, 4, 10);
            ctx.fillRect(tx + 4, y + 40, 4, 10);
            // Tower top
            ctx.fillStyle = civ === CivilizationType.Viking ? '#4a3a28' : (age >= 4 ? '#7a7a78' : '#686868');
            for (let b = 0; b < 2; b++) {
                ctx.fillRect(tx + b * 7, y - 2, 5, 6);
            }
        }
    }

    // === GATE — civ-specific ===
    switch (civ) {
        case CivilizationType.BaTu: {
            // Horseshoe arch gate
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(x + w / 2 - 18, y + h - 48, 36, 38);
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h - 48, 18, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#3a2a18';
            ctx.fillRect(x + w / 2 - 16, y + h - 46, 32, 34);
            // Golden arch trim
            ctx.strokeStyle = '#c9a84c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h - 48, 19, Math.PI, 0);
            ctx.stroke();
            // Ornate door pattern
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(x + w / 2 - 1, y + h - 44, 2, 30);
            break;
        }
        case CivilizationType.DaiMinh: {
            // Moon gate (circular opening)
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(x + w / 2 - 18, y + h - 48, 36, 38);
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h - 30, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h - 30, 14, 0, Math.PI * 2);
            ctx.fill();
            // Red trim
            ctx.strokeStyle = '#cc2222';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h - 30, 16, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }
        case CivilizationType.Yamato: {
            // Clean rectangular gate with overhang
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(x + w / 2 - 16, y + h - 44, 32, 34);
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + w / 2 - 14, y + h - 42, 28, 30);
            // Overhang roof
            ctx.fillStyle = civC.roofMain;
            ctx.fillRect(x + w / 2 - 20, y + h - 48, 40, 6);
            ctx.fillStyle = '#cc3333';
            ctx.fillRect(x + w / 2 - 20, y + h - 48, 40, 1);
            break;
        }
        case CivilizationType.Viking: {
            // Open wooden gate
            ctx.fillStyle = '#1a1410';
            ctx.fillRect(x + w / 2 - 16, y + h - 44, 32, 34);
            ctx.fillStyle = '#2a1e14';
            ctx.fillRect(x + w / 2 - 14, y + h - 42, 28, 30);
            // Wooden planks on door
            ctx.fillStyle = '#4a3a28';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + w / 2 - 12 + i * 7, y + h - 40, 5, 26);
            }
            // Iron hinges
            ctx.fillStyle = '#555';
            ctx.fillRect(x + w / 2 - 14, y + h - 36, 28, 2);
            ctx.fillRect(x + w / 2 - 14, y + h - 24, 28, 2);
            break;
        }
        default: {
            // LaMa — Roman arched gate with portcullis
            ctx.fillStyle = '#1a1a18';
            ctx.fillRect(x + w / 2 - 18, y + h - 48, 36, 38);
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h - 48, 18, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + w / 2 - 16, y + h - 46, 32, 34);
            ctx.strokeStyle = age >= 3 ? '#666' : '#555';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const gx = x + w / 2 - 14 + i * 7;
                ctx.beginPath();
                ctx.moveTo(gx, y + h - 44);
                ctx.lineTo(gx, y + h - 12);
                ctx.stroke();
            }
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - 16, y + h - 34);
            ctx.lineTo(x + w / 2 + 16, y + h - 34);
            ctx.moveTo(x + w / 2 - 16, y + h - 24);
            ctx.lineTo(x + w / 2 + 16, y + h - 24);
            ctx.stroke();
        }
    }

    // === WEAPON DISPLAYS — civ-specific ===
    switch (civ) {
        case CivilizationType.BaTu:
            // Crossed scimitars
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 24); ctx.quadraticCurveTo(x + 26, y + 32, x + 36, y + 50);
            ctx.moveTo(x + 36, y + 24); ctx.quadraticCurveTo(x + 26, y + 32, x + 16, y + 50);
            ctx.stroke();
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(x + 14, y + 48, 6, 3);
            ctx.fillRect(x + 32, y + 48, 6, 3);
            break;
        case CivilizationType.DaiMinh:
            // Crossed dao swords
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 34, y + 52);
            ctx.moveTo(x + 34, y + 24); ctx.lineTo(x + 18, y + 52);
            ctx.stroke();
            // Red tassel
            ctx.fillStyle = '#cc2222';
            ctx.fillRect(x + 16, y + 50, 4, 4);
            ctx.fillRect(x + 32, y + 50, 4, 4);
            break;
        case CivilizationType.Yamato:
            // Crossed katanas
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 22); ctx.lineTo(x + 34, y + 52);
            ctx.moveTo(x + 34, y + 22); ctx.lineTo(x + 18, y + 52);
            ctx.stroke();
            // Tsuba (guard)
            ctx.fillStyle = '#c9a84c';
            ctx.fillRect(x + 22, y + 32, 8, 2);
            break;
        case CivilizationType.Viking:
            // Crossed axes
            ctx.strokeStyle = '#5a3a18';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 22); ctx.lineTo(x + 34, y + 52);
            ctx.moveTo(x + 34, y + 22); ctx.lineTo(x + 18, y + 52);
            ctx.stroke();
            // Axe heads
            ctx.fillStyle = '#aaa';
            ctx.fillRect(x + 14, y + 22, 8, 6);
            ctx.fillRect(x + 30, y + 22, 8, 6);
            break;
        default:
            // LaMa — crossed gladius + pilum
            ctx.strokeStyle = age >= 3 ? '#ccc' : '#bbb';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 34, y + 52);
            ctx.moveTo(x + 34, y + 24); ctx.lineTo(x + 18, y + 52);
            ctx.stroke();
            ctx.strokeStyle = '#8B5E3C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 14, y + 20);
            ctx.moveTo(x + 34, y + 24); ctx.lineTo(x + 38, y + 20);
            ctx.stroke();
    }

    // === SHIELD EMBLEM — civ colored ===
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.moveTo(x + w - 32, y + 26);
    ctx.lineTo(x + w - 18, y + 26);
    ctx.lineTo(x + w - 18, y + 42);
    ctx.lineTo(x + w - 25, y + 50);
    ctx.lineTo(x + w - 32, y + 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = age >= 4 ? civC.accentColor : '#daa520';
    ctx.lineWidth = age >= 4 ? 2 : 1.5;
    ctx.stroke();

    // Age 3+: Banner above gate
    if (age >= 3) {
        ctx.fillStyle = '#4a4a48';
        ctx.fillRect(x + w / 2 - 1, y - 14, 2, 14);
        ctx.fillStyle = teamColor;
        ctx.fillRect(x + w / 2 + 1, y - 14, 14, 8);
        ctx.fillStyle = teamDark;
        ctx.fillRect(x + w / 2 + 1, y - 10, 14, 3);
    }

    // === TORCH SCONCES ===
    const torchXs = [x + w / 2 - 24, x + w / 2 + 21];
    for (const tx of torchXs) {
        ctx.fillStyle = age >= 3 ? '#666' : '#555';
        ctx.fillRect(tx, y + h - 54, 3, 10);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(tx - 1, y + h - 58, 5, 5);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(tx, y + h - 57, 3, 3);
        ctx.fillStyle = 'rgba(255,136,0,0.12)';
        ctx.beginPath();
        ctx.arc(tx + 1, y + h - 55, age >= 3 ? 12 : 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // === TRAINING ANIMATION (Active Barracks) ===
    if (b.built && b.trainQueue.length > 0) {
        const t = Date.now() / 1000;
        const trainProgress = b.trainQueue[0].progress / b.trainQueue[0].time;
        
        // 1. Glowing gate interior (forge/activity light inside)
        const gatePulse = 0.5 + Math.sin(t * 8) * 0.2;
        ctx.fillStyle = `rgba(255, 120, 20, ${0.15 * gatePulse})`;
        ctx.beginPath();
        if (civ === CivilizationType.DaiMinh || civ === CivilizationType.LaMa || civ === CivilizationType.BaTu) {
            ctx.arc(x + w / 2, y + h - 30, 16, 0, Math.PI * 2); // Moon gate approx center
        } else {
            ctx.fillRect(x + w / 2 - 14, y + h - 42, 28, 30); // Rect gate
        }
        ctx.fill();

        // Deep orange glow at the base of the door
        ctx.fillStyle = `rgba(255, 60, 0, ${0.3 * gatePulse})`;
        ctx.fillRect(x + w / 2 - 12, y + h - 14, 24, 6);

        // 2. Flying sparks out of the gate
        ctx.fillStyle = '#ffcc00';
        for (let i = 0; i < 5; i++) {
            const sparkT = (t * 2 + i * 0.4) % 1; // 0 to 1 loop
            if (sparkT > 0 && sparkT < 0.8) {
                // Sparks fly up and slightly outward
                const sx = x + w / 2 + Math.sin(i * 123 + t*5) * 10;
                const sy = y + h - 14 - sparkT * 30;
                ctx.globalAlpha = (0.8 - sparkT) * 1.5;
                ctx.fillRect(sx, sy, 2 - sparkT, 2 - sparkT);
            }
        }
        ctx.globalAlpha = 1;

        // 3. Weapon displays glowing (clashing/forging effect)
        const weaponPulse = Math.max(0, Math.sin(t * 15 + trainProgress * 10)); // rhythmic fast beat
        ctx.strokeStyle = `rgba(255, 200, 50, ${0.4 * weaponPulse})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        // Left weapon outline
        ctx.moveTo(x + 18, y + 24); ctx.lineTo(x + 34, y + 52);
        // Cover both styles (crossed lines)
        ctx.moveTo(x + 34, y + 24); ctx.lineTo(x + 18, y + 52);
        ctx.stroke();
        ctx.lineCap = 'butt';
    }

    // Age 4: Civ glow
    if (age >= 4) {
        ctx.globalAlpha = 0.05 + Math.sin(Date.now() / 700) * 0.025;
        ctx.fillStyle = civC.accentColor;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.65, h * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // === GROUND SHADOW ===
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + w, y + h - 8, 6, 8);
}
