import { C, CivilizationType } from "../../config/GameConfig";
import type { Building } from "../Building";

export function drawStable(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    if (b.age < 2) return; // Stables only start at age 2

    // Shrink logical footprint to make it more COMPACT and neat
    const nx = left + 8;
    const ny = top + 15;
    const nw = w - 16;
    const nh = h - 15;

    switch (b.civilization) {
        case CivilizationType.LaMa:
            drawRomanStable(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.BaTu:
            drawPersianStable(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.DaiMinh:
            drawChineseStable(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.Yamato:
            drawJapaneseStable(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.Viking:
            drawVikingStable(b, ctx, nx, ny, nw, nh, w);
            break;
        default:
            drawRomanStable(b, ctx, nx, ny, nw, nh, w); // Fallback
            break;
    }

    // === TRAINING ANIMATION (Active Stable) ===
    if (b.built && b.trainQueue && b.trainQueue.length > 0) {
        const t = Date.now() / 1000;
        
        // 1. Dust kicking up from the stalls (horses restless)
        ctx.fillStyle = 'rgba(200, 180, 150, 0.6)';
        for (let i = 0; i < 6; i++) {
            const dustT = (t * 3 + i * 0.3) % 1; // 0 to 1 loop
            if (dustT > 0 && dustT < 0.9) {
                // Dust puffs left and right stalls
                const isLeft = i % 2 === 0;
                const stallX = isLeft ? nx + nw/4 : nx + nw*0.75;
                const sx = stallX + Math.sin(i * 99 + t*8) * 8;
                const sy = ny + nh - 5 - dustT * 20;
                ctx.globalAlpha = (0.9 - dustT) * 0.8;
                ctx.beginPath();
                ctx.arc(sx, sy, 2 + dustT * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // 2. Subtle rhythmic activity glow
        const activityPulse = 0.5 + Math.sin(t * 12) * 0.2;
        ctx.fillStyle = `rgba(255, 220, 160, ${0.1 * activityPulse})`;
        ctx.fillRect(nx + 4, ny + nh - 20, nw - 8, 20);
    }
}

// Beautiful detailed horse drawing (compact silhouette)
function drawDetailedHorse(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, facingRight: boolean) {
    ctx.save();
    ctx.translate(cx, cy);
    if (!facingRight) ctx.scale(-1, 1);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 16, 12, 3, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = color;
    // Body (compact, rounder)
    ctx.beginPath(); ctx.ellipse(-2, 2, 11, 7, -0.1, 0, Math.PI * 2); ctx.fill();
    // Neck
    ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(12, -9); ctx.lineTo(6, -11); ctx.lineTo(-2, -3); ctx.fill();
    // Head/Snout
    ctx.beginPath(); ctx.ellipse(13, -7, 5, 3.5, 0.4, 0, Math.PI * 2); ctx.fill();
    // Ears
    ctx.beginPath(); ctx.moveTo(7, -11); ctx.lineTo(9, -15); ctx.lineTo(11, -10); ctx.fill();
    // Legs
    ctx.fillRect(4, 8, 2, 8); // Front Right
    ctx.fillRect(1, 8, 2.5, 7.5); // Front Left
    ctx.fillRect(-10, 8, 2.5, 8); // Back Right
    ctx.fillRect(-6, 8, 3, 7.5); // Back Left
    // Tail
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-18, 5, -14, 12); ctx.stroke();
    // Mane (Darker)
    ctx.strokeStyle = '#221105'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(4, -11); ctx.quadraticCurveTo(-2, -5, -2, 0); ctx.stroke();
    // Eye
    ctx.fillStyle = '#111'; ctx.fillRect(11, -9, 1.5, 1.5);

    ctx.restore();
}

function drawStallHorses(ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, horseColor1: string, horseColor2: string) {
    const mx = nx + nw / 2;
    // Left stall, horse facing right
    drawDetailedHorse(ctx, mx - nw / 4 - 2, ny + nh - 20, horseColor1, true);
    // Right stall, horse facing left
    drawDetailedHorse(ctx, mx + nw / 4 + 2, ny + nh - 20, horseColor2, false);
}

function drawStallHayAndWater(ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number) {
    const mx = nx + nw / 2;
    // Left Stall Hay/Trough
    ctx.fillStyle = '#b89840'; ctx.beginPath(); ctx.ellipse(mx - nw / 4 - 8, ny + nh - 6, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#99aaab'; ctx.fillRect(mx - nw / 4 + 4, ny + nh - 8, 7, 4); ctx.fillStyle = '#3dafe0'; ctx.fillRect(mx - nw / 4 + 4, ny + nh - 8, 6, 2);
    // Right Stall Hay/Trough
    ctx.fillStyle = '#b89840'; ctx.beginPath(); ctx.ellipse(mx + nw / 4 + 8, ny + nh - 6, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#99aaab'; ctx.fillRect(mx + nw / 4 - 11, ny + nh - 8, 7, 4); ctx.fillStyle = '#3dafe0'; ctx.fillRect(mx + nw / 4 - 11, ny + nh - 8, 6, 2);
}

// -------------------------------------------------------------------------------------------
// 1. LA MÃ (Roman) 
// -------------------------------------------------------------------------------------------
function drawRomanStable(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    if (age === 2) {
        ctx.fillStyle = '#4a3320'; ctx.fillRect(nx, ny, nw, nh); // Compact shed
        // Deep stalls
        ctx.fillStyle = '#22160e'; ctx.fillRect(nx + 4, ny + 10, nw / 2 - 6, nh - 10); ctx.fillRect(mx + 2, ny + 10, nw / 2 - 6, nh - 10);

        drawStallHorses(ctx, nx, ny, nw, nh, '#5a4030', '#4a2f1d');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#5c4033'; // Wood roof
        ctx.beginPath(); ctx.moveTo(nx - 2, ny + 12); ctx.lineTo(mx, ny - 10); ctx.lineTo(nx + nw + 2, ny + 12); ctx.fill();
        ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, ny - 10); ctx.lineTo(mx, ny + 12); ctx.stroke();

        // Front Corral Fence
        ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(nx - 6, ny + nh - 2); ctx.lineTo(nx + nw + 6, ny + nh - 2); ctx.stroke();
        for (let i = -4; i <= nw + 4; i += 8) { ctx.fillRect(nx + i, ny + nh - 6, 2, 8); }
        return;
    }

    if (age === 3) {
        ctx.fillStyle = '#8f8f8f'; ctx.fillRect(nx, ny, nw, nh); // Stone Barracks
        ctx.fillStyle = '#1c1714'; ctx.fillRect(nx + 4, ny + 15, nw / 2 - 6, nh - 15); ctx.fillRect(mx + 2, ny + 15, nw / 2 - 6, nh - 15); // Stalls

        drawStallHorses(ctx, nx, ny, nw, nh, '#4a2f1d', '#5a4030');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#a03a3a'; // Terracotta roof
        ctx.fillRect(nx - 2, ny, nw + 4, 14);
        ctx.fillStyle = '#8a2a2a'; ctx.fillRect(nx, ny + 12, nw, 2);

        ctx.fillStyle = '#666'; // Pillars
        ctx.fillRect(mx - 2, ny + 14, 4, nh - 14); ctx.fillRect(nx, ny + 14, 4, nh - 14); ctx.fillRect(nx + nw - 4, ny + 14, 4, nh - 14);

        ctx.fillStyle = teamColor; ctx.fillRect(mx - 4, ny + 4, 8, 12);
        return;
    }

    // Age 4: Imperial Marble Stables
    ctx.fillStyle = '#eadece'; ctx.fillRect(nx, ny, nw, nh); // Compact marble
    ctx.fillStyle = '#111'; // Stalls
    ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 25, nw / 4 - 3, Math.PI, 0); ctx.lineTo(mx - 3, ny + nh); ctx.lineTo(nx + 3, ny + nh); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + nw / 4, ny + 25, nw / 4 - 3, Math.PI, 0); ctx.lineTo(nx + nw - 3, ny + nh); ctx.lineTo(mx + 3, ny + nh); ctx.fill();

    drawStallHorses(ctx, nx, ny, nw, nh, '#fafafa', '#dfdbd4'); // Show horses
    drawStallHayAndWater(ctx, nx, ny, nw, nh);

    ctx.fillStyle = '#a03a3a'; // Grand Roof
    ctx.beginPath(); ctx.moveTo(nx - 4, ny + 14); ctx.quadraticCurveTo(mx, ny - 12, nx + nw + 4, ny + 14); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.fillRect(nx - 2, ny + 12, nw + 4, 2);
    ctx.beginPath(); ctx.arc(mx, ny + 4, 5, 0, Math.PI * 2); ctx.fill(); // Gold emblem

    ctx.fillStyle = '#8a3a3a'; // Red columns
    ctx.fillRect(mx - 2, ny + 14, 4, nh - 14); ctx.fillRect(nx, ny + 14, 4, nh - 14); ctx.fillRect(nx + nw - 4, ny + 14, 4, nh - 14);
}

// -------------------------------------------------------------------------------------------
// 2. BA TƯ (Persian)
// -------------------------------------------------------------------------------------------
function drawPersianStable(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    if (age === 2) {
        ctx.fillStyle = '#bca188'; ctx.fillRect(nx, ny, nw, nh);
        ctx.fillStyle = '#a88c71'; ctx.fillRect(nx - 2, ny - 4, nw + 4, 6); // Flat roof
        ctx.fillStyle = '#2a1a10'; ctx.fillRect(nx + 4, ny + 12, nw / 2 - 6, nh - 12); ctx.fillRect(mx + 2, ny + 12, nw / 2 - 6, nh - 12);

        drawStallHorses(ctx, nx, ny, nw, nh, '#5a4030', '#221105');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);
        return;
    }

    if (age === 3) {
        ctx.fillStyle = '#c5b597'; ctx.fillRect(nx, ny, nw, nh);
        ctx.fillStyle = '#0f1621'; // Deep arch interior
        ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 22, nw / 4 - 3, Math.PI, 0); ctx.lineTo(mx - 3, ny + nh); ctx.lineTo(nx + 3, ny + nh); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + nw / 4, ny + 22, nw / 4 - 3, Math.PI, 0); ctx.lineTo(nx + nw - 3, ny + nh); ctx.lineTo(mx + 3, ny + nh); ctx.fill();

        ctx.strokeStyle = '#2b7fb8'; ctx.lineWidth = 2; // Teal arch trim
        ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 22, nw / 4 - 2, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(mx + nw / 4, ny + 22, nw / 4 - 2, Math.PI, 0); ctx.stroke();

        drawStallHorses(ctx, nx, ny, nw, nh, '#1a1a1a', '#29211b'); // Black arabians
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#bca188'; ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 5, 10, Math.PI, 0); ctx.arc(mx + nw / 4, ny + 5, 10, Math.PI, 0); ctx.fill();
        ctx.fillStyle = teamColor; ctx.fillRect(mx - 3, ny + 10, 6, 12);
        return;
    }

    // Age 4: Regal Turquoise-tiled stables
    ctx.fillStyle = '#d4bfa8'; ctx.fillRect(nx, ny, nw, nh);
    ctx.fillStyle = '#0a101a';
    ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 24, nw / 4 - 3, Math.PI, 0); ctx.lineTo(mx - 3, ny + nh); ctx.lineTo(nx + 3, ny + nh); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + nw / 4, ny + 24, nw / 4 - 3, Math.PI, 0); ctx.lineTo(nx + nw - 3, ny + nh); ctx.lineTo(mx + 3, ny + nh); ctx.fill();
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 24, nw / 4 - 2, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(mx + nw / 4, ny + 24, nw / 4 - 2, Math.PI, 0); ctx.stroke();

    drawStallHorses(ctx, nx, ny, nw, nh, '#fefefe', '#ebd7b5'); // Light cream/white horses
    drawStallHayAndWater(ctx, nx, ny, nw, nh);

    ctx.fillStyle = '#3399cc'; // Beautiful domes
    ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 6, 13, Math.PI, 0); ctx.arc(mx + nw / 4, ny + 6, 13, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.fillRect(mx - nw / 4 - 1, ny - 14, 2, 7); ctx.fillRect(mx + nw / 4 - 1, ny - 14, 2, 7);
    ctx.fillStyle = '#2b7fb8'; ctx.fillRect(nx - 2, ny + 6, nw + 4, 6);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(nx - 2, ny + 6, nw + 4, 1); ctx.fillRect(nx - 2, ny + 12, nw + 4, 1);
}

// -------------------------------------------------------------------------------------------
// 3. ĐẠI TỐNG (Ming)
// -------------------------------------------------------------------------------------------
function drawChineseStable(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    if (age === 2) {
        ctx.fillStyle = '#dcb88f'; ctx.fillRect(nx, ny + 10, nw, nh - 10); // Plaster
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(nx + 4, ny + 18, nw / 2 - 6, nh - 18); ctx.fillRect(mx + 2, ny + 18, nw / 2 - 6, nh - 18);

        drawStallHorses(ctx, nx, ny, nw, nh, '#4a3320', '#5c4033');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#4a4f55'; // Curved roof
        ctx.beginPath(); ctx.moveTo(nx - 2, ny + 14); ctx.quadraticCurveTo(mx, ny - 4, nx + nw + 2, ny + 14); ctx.lineTo(mx, ny + 2); ctx.fill();
        ctx.fillStyle = '#5c4033'; ctx.fillRect(mx - 2, ny + 14, 4, nh - 14); // Wood pillar
        return;
    }

    if (age === 3) {
        ctx.fillStyle = '#fef4e8'; ctx.fillRect(nx, ny + 10, nw, nh - 10);
        ctx.fillStyle = '#111'; ctx.fillRect(nx + 5, ny + 18, nw / 2 - 8, nh - 18); ctx.fillRect(mx + 3, ny + 18, nw / 2 - 8, nh - 18);

        drawStallHorses(ctx, nx, ny, nw, nh, '#332211', '#2a1a10');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#a12b2b'; // Red Pillars
        ctx.fillRect(nx, ny + 14, 5, nh - 14); ctx.fillRect(mx - 2, ny + 14, 4, nh - 14); ctx.fillRect(nx + nw - 5, ny + 14, 5, nh - 14);

        ctx.fillStyle = '#2b4d37'; // Green sweeping roof
        ctx.beginPath(); ctx.moveTo(nx - 4, ny + 14); ctx.quadraticCurveTo(mx, ny - 8, nx + nw + 4, ny + 14); ctx.lineTo(mx, ny + 2); ctx.fill();
        ctx.fillStyle = teamColor; ctx.fillRect(nx + 1, ny + 16, 3, 6); ctx.fillRect(nx + nw - 4, ny + 16, 3, 6);
        return;
    }

    // Age 4: Imperial Stables
    ctx.fillStyle = '#fef4e8'; ctx.fillRect(nx, ny, nw, nh);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(nx - 2, ny + nh - 6, nw + 4, 8); // Stone railing base
    ctx.fillStyle = '#111'; ctx.fillRect(nx + 6, ny + 20, nw / 2 - 9, nh - 26); ctx.fillRect(mx + 3, ny + 20, nw / 2 - 9, nh - 26);

    drawStallHorses(ctx, nx, ny, nw, nh, '#ebd7b5', '#dfdbd4'); // War horses
    drawStallHayAndWater(ctx, nx, ny, nw, nh);

    ctx.fillStyle = '#a12b2b'; // Red frame
    ctx.fillRect(nx + 2, ny + 16, nw - 4, 4); // Top cross
    ctx.fillRect(nx + 2, ny + 20, 4, nh - 26); ctx.fillRect(mx - 2, ny + 20, 4, nh - 26); ctx.fillRect(nx + nw - 6, ny + 20, 4, nh - 26);

    ctx.fillStyle = '#d4a017'; // Imperial Yellow Double Roof
    ctx.beginPath(); ctx.moveTo(nx - 6, ny + 16); ctx.quadraticCurveTo(mx, ny - 4, nx + nw + 6, ny + 16); ctx.lineTo(mx, ny + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(nx - 2, ny + 2); ctx.quadraticCurveTo(mx, ny - 18, nx + nw + 2, ny + 2); ctx.lineTo(mx, ny - 6); ctx.fill();

    // Red Lanterns
    ctx.fillStyle = teamColor;
    ctx.beginPath(); ctx.arc(nx + 10, ny + 22, 3, 0, Math.PI * 2); ctx.arc(nx + nw - 10, ny + 22, 3, 0, Math.PI * 2); ctx.fill();
}

// -------------------------------------------------------------------------------------------
// 4. YAMATO (Japanese)
// -------------------------------------------------------------------------------------------
function drawJapaneseStable(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    if (age === 2) {
        ctx.fillStyle = '#d2c4a9'; ctx.fillRect(nx, ny + 5, nw, nh - 5); // Thatch walls
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(nx + 4, ny + 14, nw / 2 - 6, nh - 14); ctx.fillRect(mx + 2, ny + 14, nw / 2 - 6, nh - 14);

        drawStallHorses(ctx, nx, ny, nw, nh, '#4a2f1d', '#3a2415');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#a4b068'; // Bamboo divider
        ctx.fillRect(mx - 1, ny + 10, 2, nh - 10); ctx.fillRect(nx + 1, ny + 10, 2, nh - 10); ctx.fillRect(nx + nw - 3, ny + 10, 2, nh - 10);

        ctx.fillStyle = '#8a7850'; // Thatch roof
        ctx.beginPath(); ctx.moveTo(nx - 2, ny + 12); ctx.lineTo(mx, ny - 2); ctx.lineTo(nx + nw + 2, ny + 12); ctx.fill();
        return;
    }

    if (age === 3) {
        ctx.fillStyle = '#f0f0f5'; ctx.fillRect(nx, ny, nw, nh); // White walls
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(nx, ny + 12, nw, 3); // Crossbeam
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(nx + 4, ny + 15, nw / 2 - 6, nh - 15); ctx.fillRect(mx + 2, ny + 15, nw / 2 - 6, nh - 15);

        drawStallHorses(ctx, nx, ny, nw, nh, '#2a1a10', '#3b2413');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#2c3338'; // Dark tile roof
        ctx.beginPath(); ctx.moveTo(nx - 4, ny + 10); ctx.lineTo(mx, ny - 6); ctx.lineTo(nx + nw + 4, ny + 10); ctx.fill();

        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(mx - 2, ny + 10, 4, nh - 10); // Thick mid post

        ctx.fillStyle = teamColor; ctx.beginPath(); ctx.arc(mx, ny + 5, 4, 0, Math.PI * 2); ctx.fill(); // Clan mon
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, ny + 5, 1.5, 0, Math.PI * 2); ctx.fill();
        return;
    }

    // Age 4: Daimyo Elegant Stables
    ctx.fillStyle = '#e6e6ea'; ctx.fillRect(nx, ny, nw, nh); // Compact elegance
    ctx.fillStyle = '#5a5a66'; // Musha-gaeshi stone
    ctx.beginPath(); ctx.moveTo(nx - 2, ny + nh); ctx.lineTo(nx + 4, ny + nh - 12); ctx.lineTo(nx + nw - 4, ny + nh - 12); ctx.lineTo(nx + nw + 2, ny + nh); ctx.fill();

    ctx.fillStyle = '#050505'; ctx.fillRect(nx + 6, ny + 18, nw / 2 - 8, nh - 30); ctx.fillRect(mx + 2, ny + 18, nw / 2 - 8, nh - 30);

    drawStallHorses(ctx, nx, ny, nw, nh, '#1a1a1a', '#f5f5f5');
    drawStallHayAndWater(ctx, nx, ny, nw, nh);

    ctx.fillStyle = '#1c2024'; // Multi-tier black roof
    ctx.beginPath(); ctx.moveTo(nx - 4, ny + 12); ctx.lineTo(mx, ny - 2); ctx.lineTo(nx + nw + 4, ny + 12); ctx.lineTo(mx, ny + 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(nx + 4, ny + 2); ctx.lineTo(mx, ny - 12); ctx.lineTo(nx + nw - 4, ny + 2); ctx.fill();

    ctx.fillStyle = '#111'; ctx.fillRect(nx, ny + 12, nw, 4); // Top beam
    ctx.fillRect(mx - 3, ny + 16, 6, nh - 28); // Mid thick post

    // Nobori banners
    ctx.fillStyle = teamColor; ctx.fillRect(nx, ny + 16, 5, 14); ctx.fillRect(nx + nw - 5, ny + 16, 5, 14);
}

// -------------------------------------------------------------------------------------------
// 5. VIKING (Norse)
// -------------------------------------------------------------------------------------------
function drawVikingStable(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    if (age === 2) {
        ctx.fillStyle = '#4a2f1d'; ctx.fillRect(nx, ny + 10, nw, nh - 10);
        ctx.strokeStyle = '#2d1b0d'; ctx.lineWidth = 1;
        for (let i = ny + 15; i < ny + nh; i += 5) { ctx.beginPath(); ctx.moveTo(nx, i); ctx.lineTo(nx + nw, i); ctx.stroke(); }

        ctx.fillStyle = '#111'; ctx.fillRect(nx + 4, ny + 20, nw / 2 - 6, nh - 20); ctx.fillRect(mx + 2, ny + 20, nw / 2 - 6, nh - 20);

        drawStallHorses(ctx, nx, ny, nw, nh, '#5a4030', '#422818');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        ctx.fillStyle = '#3a2415'; // Low Pitch Roof
        ctx.beginPath(); ctx.moveTo(nx - 2, ny + 12); ctx.lineTo(mx, ny); ctx.lineTo(nx + nw + 2, ny + 12); ctx.fill();
        return;
    }

    if (age === 3) {
        ctx.fillStyle = '#656565'; ctx.fillRect(nx, ny + 5, nw, nh - 5); // Stone shed
        ctx.fillStyle = '#111'; ctx.fillRect(nx + 4, ny + 18, nw / 2 - 6, nh - 18); ctx.fillRect(mx + 2, ny + 18, nw / 2 - 6, nh - 18);
        ctx.fillStyle = '#3a2415'; ctx.fillRect(mx - 2, ny + 18, 4, nh - 18); // Center wood divider

        drawStallHorses(ctx, nx, ny, nw, nh, '#5a4030', '#c8b8a8');
        drawStallHayAndWater(ctx, nx, ny, nw, nh);

        // Lush turf roof
        ctx.fillStyle = '#447a25'; ctx.beginPath(); ctx.moveTo(nx - 4, ny + 12); ctx.lineTo(mx, ny - 8); ctx.lineTo(nx + nw + 4, ny + 12); ctx.fill();
        ctx.fillStyle = '#325c1b'; ctx.fillRect(nx - 2, ny + 10, nw + 4, 2);

        ctx.fillStyle = teamColor; ctx.beginPath(); ctx.arc(nx, ny + 18, 2.5, 0, Math.PI * 2); ctx.arc(nx + nw, ny + 18, 2.5, 0, Math.PI * 2); ctx.fill();
        return;
    }

    // Age 4: Stave Wood Long-barn
    ctx.fillStyle = '#4a3320'; ctx.fillRect(nx, ny, nw, nh);
    ctx.strokeStyle = '#2a1b10'; ctx.lineWidth = 1.5;
    for (let i = nx + 4; i < nx + nw; i += 6) { ctx.beginPath(); ctx.moveTo(i, ny); ctx.lineTo(i, ny + nh); ctx.stroke(); }

    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(mx - nw / 4, ny + 25, nw / 4 - 3, Math.PI, 0); ctx.lineTo(mx - 3, ny + nh); ctx.lineTo(nx + 3, ny + nh); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + nw / 4, ny + 25, nw / 4 - 3, Math.PI, 0); ctx.lineTo(nx + nw - 3, ny + nh); ctx.lineTo(mx + 3, ny + nh); ctx.fill();

    // Epic steeds
    drawStallHorses(ctx, nx, ny, nw, nh, '#f2ece4', '#dfdbd4');
    drawStallHayAndWater(ctx, nx, ny, nw, nh);

    ctx.fillStyle = teamColor; ctx.fillRect(mx - 4, ny + 6, 8, 12); // Banner in center

    ctx.fillStyle = '#3a2415'; // Steep tiered steeples
    ctx.beginPath(); ctx.moveTo(nx - 6, ny + 10); ctx.lineTo(mx, ny - 15); ctx.lineTo(nx + nw + 6, ny + 10); ctx.lineTo(mx, ny); ctx.fill();
    ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(mx, ny - 25); ctx.lineTo(nx + nw, ny); ctx.fill();

    ctx.strokeStyle = '#cda434'; ctx.lineWidth = 2; // Dragon prows
    ctx.beginPath(); ctx.moveTo(nx - 2, ny - 5); ctx.quadraticCurveTo(nx - 10, ny - 12, nx - 6, ny - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx + nw + 2, ny - 5); ctx.quadraticCurveTo(nx + nw + 10, ny - 12, nx + nw + 6, ny - 18); ctx.stroke();
}
