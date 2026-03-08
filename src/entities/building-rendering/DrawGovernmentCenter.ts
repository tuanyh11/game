import { C, CivilizationType } from "../../config/GameConfig";
import type { Building } from "../Building";

export function drawGovernmentCenter(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    switch (b.civilization) {
        case CivilizationType.LaMa:
            drawRomanGovt(b, ctx, left, top, w, h);
            break;
        case CivilizationType.BaTu:
            drawPersianGovt(b, ctx, left, top, w, h);
            break;
        case CivilizationType.DaiMinh:
            drawChineseGovt(b, ctx, left, top, w, h);
            break;
        case CivilizationType.Yamato:
            drawJapaneseGovt(b, ctx, left, top, w, h);
            break;
        case CivilizationType.Viking:
            drawVikingGovt(b, ctx, left, top, w, h);
            break;
        default:
            drawRomanGovt(b, ctx, left, top, w, h); // Fallback
            break;
    }
}

// -------------------------------------------------------------------------------------------
// 1. LA MÃ (Roman) - Senate Curia (Age 3) & Imperial Basilica (Age 4)
// -------------------------------------------------------------------------------------------
function drawRomanGovt(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const isAge4 = b.age >= 4;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    // Stone foundation
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(left, top + h - 15, w, 15);
    ctx.fillStyle = '#808080';
    ctx.fillRect(left + 2, top + h - 8, w - 4, 8); // Stairs

    // Main building block
    ctx.fillStyle = isAge4 ? '#f0f0f5' : '#e0dbcf'; // Age 4 has pristine white marble
    const bW = w - 10;
    const bH = h - 35;
    const bX = left + 5;
    const bY = top + 20;
    ctx.fillRect(bX, bY, bW, bH);

    // Columns
    const cols = isAge4 ? 8 : 6;
    const colSpacing = bW / cols;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i <= cols; i++) {
        const cx = bX + i * colSpacing - 3;
        if (i > 0 && i < cols) {
            ctx.fillRect(cx, bY + 5, 6, bH - 5);
            // Column shadows
            ctx.fillStyle = '#d0d0d0';
            ctx.fillRect(cx + 4, bY + 5, 2, bH - 5);
            ctx.fillStyle = '#ffffff';
        }
    }

    // Age 4 Dome
    if (isAge4) {
        ctx.fillStyle = '#c03a3a'; // Imperial red dome
        ctx.beginPath();
        ctx.arc(left + w / 2, top + 20, 25, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffd700'; // Gold top
        ctx.beginPath();
        ctx.arc(left + w / 2, top - 8, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pediment (Triangular roof front)
    ctx.fillStyle = '#a03a3a';
    ctx.beginPath();
    ctx.moveTo(left, bY);
    ctx.lineTo(left + w / 2, top + (isAge4 ? 5 : 0));
    ctx.lineTo(left + w, bY);
    ctx.fill();

    // Pediment gold trim
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, bY);
    ctx.lineTo(left + w / 2, top + (isAge4 ? 5 : 0));
    ctx.lineTo(left + w, bY);
    ctx.stroke();

    // Banners
    ctx.fillStyle = teamColor;
    ctx.fillRect(left + 8, top + 35, 8, 20);
    ctx.fillRect(left + w - 16, top + 35, 8, 20);
    if (isAge4) {
        ctx.fillStyle = '#ffd700';
        ctx.font = "bold 8px 'Inter', sans-serif";
        ctx.fillText('SPQR', left + 12, top + 45);
        ctx.fillText('SPQR', left + w - 12, top + 45);
    }
}

// -------------------------------------------------------------------------------------------
// 2. BA TƯ (Persian) - Satrap's Court (Age 3) & Royal Divan (Age 4)
// -------------------------------------------------------------------------------------------
function drawPersianGovt(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const isAge4 = b.age >= 4;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    // Main courtyard block
    ctx.fillStyle = '#d4bfa8'; // Sandstone
    ctx.fillRect(left + 5, top + 30, w - 10, h - 30);

    // Intricate tile work and archways
    if (isAge4) {
        ctx.fillStyle = '#2b7fb8'; // Rich turquoise tile trim
        ctx.fillRect(left + 5, top + 30, w - 10, 8);
        ctx.fillRect(left + 5, top + h - 10, w - 10, 10);
    }

    // Grand Iwan (Central Arch)
    ctx.fillStyle = '#1a3c5a'; // Deep blue arch interior
    ctx.beginPath();
    ctx.arc(left + w / 2, top + h - 15, 18, Math.PI, 0);
    ctx.lineTo(left + w / 2 + 18, top + h);
    ctx.lineTo(left + w / 2 - 18, top + h);
    ctx.fill();

    // Inner arch detail
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(left + w / 2, top + h - 15, 15, Math.PI, 0);
    ctx.stroke();

    // Domes
    ctx.fillStyle = isAge4 ? '#3399cc' : '#bfa88f'; // Age 4 has brilliant blue domes
    ctx.beginPath();
    ctx.arc(left + w / 2, top + 30, 22, Math.PI, 0);
    ctx.fill();

    if (isAge4) {
        // Gold spire on main dome
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(left + w / 2, top + 8);
        ctx.lineTo(left + w / 2, top - 10);
        ctx.stroke();

        // Side minarets
        ctx.fillStyle = '#d4bfa8';
        ctx.fillRect(left - 5, top + 10, 10, h - 10);
        ctx.fillRect(left + w - 5, top + 10, 10, h - 10);
        // Minaret tops
        ctx.fillStyle = '#3399cc';
        ctx.beginPath();
        ctx.arc(left, top + 10, 6, Math.PI, 0);
        ctx.arc(left + w, top + 10, 6, Math.PI, 0);
        ctx.fill();
    }

    // Team banners hanging in arches
    ctx.fillStyle = teamColor;
    ctx.fillRect(left + w / 2 - 6, top + h - 25, 12, 15);
}

// -------------------------------------------------------------------------------------------
// 3. ĐẠI TỐNG (Ming) - Magistrate's Yamen (Age 3) & Imperial Ministry (Age 4)
// -------------------------------------------------------------------------------------------
function drawChineseGovt(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const isAge4 = b.age >= 4;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    // Walled foundation
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(left, top + h - 12, w, 12);
    // Red pillars
    ctx.fillStyle = '#a12b2b';
    const numPillars = 6;
    for (let i = 0; i < numPillars; i++) {
        ctx.fillRect(left + 5 + i * ((w - 15) / (numPillars - 1)), top + 25, 5, h - 35);
    }
    // Wooden walls behind pillars
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(left + 10, top + 35, w - 20, h - 47);

    // Decorative balcony / divider
    ctx.fillStyle = '#333';
    ctx.fillRect(left, top + h - 25, w, 4);

    // Roofs
    ctx.fillStyle = isAge4 ? '#d4a017' : '#2b2e33'; // Age 4 gets imperial yellow/gold roof
    // Main roof
    ctx.beginPath();
    ctx.moveTo(left - 5, top + 35);
    ctx.quadraticCurveTo(left + w / 2, top + 15, left + w + 5, top + 35);
    ctx.lineTo(left + w / 2, top + 5);
    ctx.fill();

    if (isAge4) {
        // Upper roof tier for Age 4
        ctx.beginPath();
        ctx.moveTo(left + 10, top + 20);
        ctx.quadraticCurveTo(left + w / 2, top, left + w - 10, top + 20);
        ctx.lineTo(left + w / 2, top - 15);
        ctx.fill();

        // Imperial Dragon Crest
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(left + w / 2, top + 25, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Team color accents (Lanterns)
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(left + 10, top + 40, 4, 0, Math.PI * 2);
    ctx.arc(left + w - 10, top + 40, 4, 0, Math.PI * 2);
    ctx.fill();
}

// -------------------------------------------------------------------------------------------
// 4. YAMATO (Japanese) - Daimyo Audience Hall (Age 3) & Shogunate Palace (Age 4)
// -------------------------------------------------------------------------------------------
function drawJapaneseGovt(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const isAge4 = b.age >= 4;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    // Stone base (Musha-gaeshi)
    ctx.fillStyle = '#666677';
    ctx.beginPath();
    ctx.moveTo(left + (isAge4 ? 0 : 5), top + h);
    ctx.lineTo(left + 15, top + h - 25);
    ctx.lineTo(left + w - 15, top + h - 25);
    ctx.lineTo(left + w - (isAge4 ? 0 : 5), top + h);
    ctx.fill();

    // Main structure
    ctx.fillStyle = isAge4 ? '#1a1a1a' : '#f0f0f5'; // Age 4 has black walls, Age 3 white
    ctx.fillRect(left + 12, top + 25, w - 24, h - 50);

    // Wood trim & Shoji screens
    ctx.strokeStyle = isAge4 ? '#ffd700' : '#3d2b1f'; // Gold trim for Age 4
    ctx.lineWidth = 2;
    ctx.strokeRect(left + 12, top + 25, w - 24, h - 50);

    // Shoji panels
    ctx.fillStyle = '#fffae6';
    ctx.fillRect(left + 18, top + 35, 12, h - 65);
    ctx.fillRect(left + w - 30, top + 35, 12, h - 65);

    // Roofs
    ctx.fillStyle = '#2c3338'; // Dark metallic grey

    // Main roof
    ctx.beginPath();
    ctx.moveTo(left - 8, top + 30);
    ctx.lineTo(left + w / 2, top + 10);
    ctx.lineTo(left + w + 8, top + 30);
    ctx.lineTo(left + w - 5, top + 30);
    ctx.lineTo(left + w / 2, top + 15);
    ctx.lineTo(left + 5, top + 30);
    ctx.fill();

    if (isAge4) {
        // Second tier
        ctx.beginPath();
        ctx.moveTo(left + 2, top + 15);
        ctx.lineTo(left + w / 2, top - 5);
        ctx.lineTo(left + w - 2, top + 15);
        ctx.lineTo(left + w - 10, top + 15);
        ctx.lineTo(left + w / 2, top + 2);
        ctx.lineTo(left + 10, top + 15);
        ctx.fill();

        // Shachihoko (Gold roof fish)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(left + w / 2 - 15, top - 5, 3, 0, Math.PI * 2);
        ctx.arc(left + w / 2 + 15, top - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Clan Banner (Nobori)
    ctx.fillStyle = teamColor;
    ctx.fillRect(left + w / 2 - 8, top + h - 45, 16, 25);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(left + w / 2, top + h - 35, 4, 0, Math.PI * 2); // Mon emblem
    ctx.fill();
}

// -------------------------------------------------------------------------------------------
// 5. VIKING (Norse) - Jarl's Great Hall (Age 3) & Thing Assembly Hall (Age 4)
// -------------------------------------------------------------------------------------------
function drawVikingGovt(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const isAge4 = b.age >= 4;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    // Stone foundation (Thick and layered)
    ctx.fillStyle = '#4a4a50';
    ctx.fillRect(left + 2, top + h - 12, w - 4, 12);
    ctx.fillStyle = '#666670';
    ctx.fillRect(left + 4, top + h - 18, w - 8, 6);
    // Rough stone lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 10; i < w - 10; i += 8) {
        ctx.beginPath();
        ctx.moveTo(left + i, top + h - 12);
        ctx.lineTo(left + i, top + h);
        ctx.stroke();
    }

    // Stave timber walls (Main Hall)
    const mw = w - 24;
    const mh = h - 40;
    const mx = left + 12;
    const my = top + 22;

    ctx.fillStyle = '#4a2f1d'; // Rich dark wood
    ctx.fillRect(mx, my, mw, mh);

    // Vertical plank lines for the stave wall
    ctx.strokeStyle = '#2d1b0d';
    ctx.lineWidth = 1.5;
    for (let i = mx + 4; i < mx + mw; i += 5) {
        ctx.beginPath();
        ctx.moveTo(i, my);
        ctx.lineTo(i, my + mh);
        ctx.stroke();
    }

    // Grand Entrance Doors
    ctx.fillStyle = '#221105';
    ctx.beginPath();
    ctx.arc(left + w / 2, top + h - 35, 12, Math.PI, 0); // Arched top
    ctx.lineTo(left + w / 2 + 12, top + h - 18);
    ctx.lineTo(left + w / 2 - 12, top + h - 18);
    ctx.fill();
    // Door details (iron bands)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.strokeRect(left + w / 2 - 12, top + h - 32, 24, 14);
    ctx.beginPath();
    ctx.moveTo(left + w / 2, top + h - 35);
    ctx.lineTo(left + w / 2, top + h - 18);
    ctx.stroke();

    // Symmetrical flanking shields along the walls
    const shieldRadius = 5;
    for (let i = 0; i < 3; i++) {
        // Left side shields
        drawVikingShield(ctx, left + 18, top + h - 45 + (i * 10), shieldRadius, teamColor);
        // Right side shields
        drawVikingShield(ctx, left + w - 18, top + h - 45 + (i * 10), shieldRadius, teamColor);
    }

    // Tiered Wood Shingle Roofs (very steep, sweeping curves)
    ctx.fillStyle = isAge4 ? '#2d221a' : '#3a2b22'; // Darker, more imposing roof in Age 4
    const roofHighlight = isAge4 ? '#4a3b30' : '#554236';

    // Bottom roof tier
    ctx.beginPath();
    ctx.moveTo(left - 5, top + 45);
    ctx.quadraticCurveTo(left + w / 2, top + 15, left + w + 5, top + 45); // Sweeping eaves
    ctx.lineTo(left + w - 10, top + 42);
    ctx.lineTo(left + w / 2, top + 20);
    ctx.lineTo(left + 10, top + 42);
    ctx.fill();
    // Roof edge highlight
    ctx.strokeStyle = roofHighlight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left - 5, top + 45);
    ctx.quadraticCurveTo(left + w / 2, top + 15, left + w + 5, top + 45);
    ctx.stroke();

    // Middle roof tier
    ctx.beginPath();
    ctx.moveTo(left + 5, top + 28);
    ctx.quadraticCurveTo(left + w / 2, top + 5, left + w - 5, top + 28);
    ctx.lineTo(left + w - 15, top + 25);
    ctx.lineTo(left + w / 2, top + 10);
    ctx.lineTo(left + 15, top + 25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(left + 5, top + 28);
    ctx.quadraticCurveTo(left + w / 2, top + 5, left + w - 5, top + 28);
    ctx.stroke();

    if (isAge4) {
        // Top towering spire roof for Age 4
        ctx.beginPath();
        ctx.moveTo(left + 18, top + 12);
        ctx.quadraticCurveTo(left + w / 2, top - 15, left + w - 18, top + 12);
        ctx.lineTo(left + w / 2, top);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(left + 18, top + 12);
        ctx.quadraticCurveTo(left + w / 2, top - 15, left + w - 18, top + 12);
        ctx.stroke();

        // Massive Gold/Bronze Dragon Finial at the very peak
        ctx.fillStyle = '#b8860b'; // Bronze/Gold
        ctx.beginPath();
        ctx.moveTo(left + w / 2 - 4, top - 15);
        ctx.quadraticCurveTo(left + w / 2 - 12, top - 25, left + w / 2 - 2, top - 32);
        ctx.lineTo(left + w / 2 + 2, top - 20);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(left + w / 2 + 4, top - 15);
        ctx.quadraticCurveTo(left + w / 2 + 12, top - 25, left + w / 2 + 2, top - 32);
        ctx.lineTo(left + w / 2 - 2, top - 20);
        ctx.fill();

        ctx.fillStyle = '#ff4444'; // Glowing dragon eyes
        ctx.fillRect(left + w / 2 - 5, top - 28, 2, 2);
        ctx.fillRect(left + w / 2 + 3, top - 28, 2, 2);
    }

    // Dragon head prows on lower tiers
    ctx.strokeStyle = '#cda434'; // Dull gold
    ctx.lineWidth = 2.5;
    // Lower tier left
    ctx.beginPath();
    ctx.moveTo(left - 2, top + 43);
    ctx.quadraticCurveTo(left - 10, top + 35, left - 5, top + 30);
    ctx.stroke();
    // Lower tier right
    ctx.beginPath();
    ctx.moveTo(left + w + 2, top + 43);
    ctx.quadraticCurveTo(left + w + 10, top + 35, left + w + 5, top + 30);
    ctx.stroke();
    // Mid tier left
    ctx.beginPath();
    ctx.moveTo(left + 8, top + 26);
    ctx.quadraticCurveTo(left + 2, top + 18, left + 8, top + 12);
    ctx.stroke();
    // Mid tier right
    ctx.beginPath();
    ctx.moveTo(left + w - 8, top + 26);
    ctx.quadraticCurveTo(left + w - 2, top + 18, left + w - 8, top + 12);
    ctx.stroke();

    // Thor's Hammer (Mjolnir) emblem over the door for Age 4
    if (isAge4) {
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(left + w / 2 - 4, top + h - 44, 8, 4);  // Hammer head
        ctx.fillRect(left + w / 2 - 1, top + h - 40, 2, 6);  // Hammer handle
        // Glowing rune
        ctx.fillStyle = '#44ccff';
        ctx.fillRect(left + w / 2 - 1, top + h - 43, 2, 2);
    }

    // Banners (Long pennants hanging from the mid-roof)
    if (isAge4) {
        ctx.fillStyle = teamColor;
        ctx.beginPath();
        ctx.moveTo(left + 15, top + 25);
        ctx.lineTo(left + 20, top + 25);
        ctx.lineTo(left + 17, top + 50);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(left + w - 20, top + 25);
        ctx.lineTo(left + w - 15, top + 25);
        ctx.lineTo(left + w - 17, top + 50);
        ctx.fill();
    }
}

// Helper to draw a Viking shield
function drawVikingShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, teamColor: string): void {
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    // Inner paint pattern (quarters)
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, 0, Math.PI / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, Math.PI, Math.PI * 1.5);
    ctx.fill();
    // Wooden rim
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    // Iron boss
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(x, y, radius / 3, 0, Math.PI * 2);
    ctx.fill();
}
