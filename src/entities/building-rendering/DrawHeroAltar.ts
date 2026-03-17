import { C, CivilizationType } from "../../config/GameConfig";
import type { Building } from "../Building";

export function drawHeroAltar(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    // Shrines can exist in Age 2, Age 3, and Age 4

    // Use a tighter rendering box similar to Stables for a more refined look
    const nx = left + 6;
    const ny = top + 10;
    const nw = w - 12;
    const nh = h - 10;

    switch (b.civilization) {
        case CivilizationType.LaMa:
            drawRomanShrine(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.BaTu:
            drawPersianShrine(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.DaiMinh:
            drawChineseShrine(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.Yamato:
            drawJapaneseShrine(b, ctx, nx, ny, nw, nh, w);
            break;
        case CivilizationType.Viking:
            drawVikingShrine(b, ctx, nx, ny, nw, nh, w);
            break;
        default:
            drawRomanShrine(b, ctx, nx, ny, nw, nh, w);
            break;
    }

    // === TRAINING/SUMMONING ANIMATION (Active Altar) ===
    if (b.built && b.trainQueue && b.trainQueue.length > 0) {
        const t = Date.now() / 1000;
        const trainProgress = b.trainQueue[0].progress / b.trainQueue[0].time;
        
        // Base glowing team color for summoning
        const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
        
        // 1. Intense pulsing aura around the base/artifact
        const auraPulse = 0.5 + Math.sin(t * 10) * 0.4;
        ctx.globalAlpha = 0.15 * auraPulse;
        ctx.fillStyle = teamColor;
        ctx.beginPath();
        ctx.arc(nx + nw/2, ny + nh - 15, 25, 0, Math.PI * 2);
        ctx.fill();

        // 2. Swirling magic particles rising up
        ctx.fillStyle = teamColor;
        for (let i = 0; i < 8; i++) {
            // Particle age from 0 to 1
            const pTime = (t * 1.5 + i * 0.125) % 1;
            if (pTime > 0) {
                const radius = 15 - pTime * 10; // Swirl inward as they rise
                const angle = t * 3 + i * Math.PI / 4 + pTime * Math.PI * 2;
                
                const px = nx + nw/2 + Math.cos(angle) * radius;
                const py = ny + nh - 5 - pTime * 35; // Rise up
                
                // Fade out at the top
                ctx.globalAlpha = (1 - pTime) * 1.5 * Math.min(1, pTime * 5); // Fade in then out
                
                // Small glowing dots
                ctx.beginPath();
                ctx.arc(px, py, 1.5 + (1-pTime), 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // 3. Central light beam shooting up (gets stronger as trainProgress increases)
        if (trainProgress > 0.1) {
            ctx.globalAlpha = trainProgress * 0.4 * (0.8 + Math.sin(t*20)*0.2); // Flickering beam
            const grad = ctx.createLinearGradient(0, ny + nh - 10, 0, top - 30);
            grad.addColorStop(0, teamColor);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            // Beam width gets slightly wider near the end
            const beamW = 6 + trainProgress * 6;
            ctx.fillRect(nx + nw/2 - beamW/2, top - 30, beamW, (ny + nh - 10) - (top - 30));
            ctx.globalAlpha = 1;
        }
    }
}

// -------------------------------------------------------------------------------------------
// Helper: Draw the pulsing magical crystal/artifact in the center
// -------------------------------------------------------------------------------------------
function drawPulsingGem(ctx: CanvasRenderingContext2D, cx: number, cy: number, glowColor: string, coreColor: string, gemType: 'diamond' | 'sphere' | 'shard') {
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7; // 0.4 to 1.0

    // Outer Glow
    ctx.globalAlpha = pulse * 0.4;
    ctx.fillStyle = glowColor;
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = coreColor;
    if (gemType === 'diamond') {
        ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 7, cy); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 2, cy); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 2, cy); ctx.fill();
    } else if (gemType === 'sphere') {
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
    } else if (gemType === 'shard') {
        ctx.beginPath(); ctx.moveTo(cx - 4, cy - 10); ctx.lineTo(cx + 6, cy - 8); ctx.lineTo(cx + 2, cy + 12); ctx.lineTo(cx - 6, cy + 8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(cx - 2, cy - 8); ctx.lineTo(cx + 2, cy - 7); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 2, cy + 7); ctx.fill();
    }
}

// -------------------------------------------------------------------------------------------
// 1. LA MÃ (Roman) 
// -------------------------------------------------------------------------------------------
function drawRomanShrine(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;

    if (age < 3) {
        // Age 2: Simple marble pedestal
        ctx.fillStyle = '#b0a8a0'; ctx.fillRect(nx + 4, ny + nh - 8, nw - 8, 8); // Base steps
        ctx.fillStyle = '#c0b8b0'; ctx.fillRect(nx + 8, ny + nh - 14, nw - 16, 6); // Pedestal
        drawPulsingGem(ctx, mx, ny + nh - 22, '#aa66cc', '#7744aa', 'diamond');
        return;
    }

    if (age === 3) {
        // Classical open-air marble temple
        ctx.fillStyle = '#c0b8b0'; ctx.fillRect(nx, ny + nh - 8, nw, 8); // Base steps
        ctx.fillStyle = '#a89f91'; ctx.fillRect(nx + 4, ny + nh - 14, nw - 8, 6); // Inner pedestal

        // Gem in center
        drawPulsingGem(ctx, mx, ny + nh - 22, '#dd88ff', '#8844aa', 'diamond');

        // Corinthian Columns
        ctx.fillStyle = '#eadece';
        ctx.fillRect(nx + 2, ny + 15, 6, nh - 23); ctx.fillRect(nx + nw - 8, ny + 15, 6, nh - 23);
        ctx.fillStyle = '#daa520'; // Gold capitals
        ctx.fillRect(nx, ny + 13, 10, 4); ctx.fillRect(nx + nw - 10, ny + 13, 10, 4);

        // Pediment (Triangular roof)
        ctx.fillStyle = '#c0b8b0';
        ctx.beginPath(); ctx.moveTo(nx - 4, ny + 13); ctx.lineTo(mx, ny - 5); ctx.lineTo(nx + nw + 4, ny + 13); ctx.fill();
        ctx.fillStyle = '#daa520'; ctx.beginPath(); ctx.arc(mx, ny + 6, 3, 0, Math.PI * 2); ctx.fill(); // Eagle emblem

        return;
    }

    // Age 4: Grand Domed Pantheon
    ctx.fillStyle = '#c0b8b0'; ctx.fillRect(nx, ny + nh - 10, nw, 10); // Base

    // Main drum building
    ctx.fillStyle = '#b8aead';
    ctx.beginPath(); ctx.arc(mx, ny + nh - 10, nw / 2 - 6, Math.PI, 0); ctx.lineTo(mx + nw / 2 - 6, ny + nh - 10); ctx.fill();

    // Domed Roof
    ctx.fillStyle = '#8a3a3a'; // Terracotta/Bronze dome
    ctx.beginPath(); ctx.arc(mx, ny + 12, nw / 2 - 2, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#eadece'; ctx.fillRect(mx - 6, ny - 2, 12, 4); // Oculus ring

    // Grand entrance columns
    ctx.fillStyle = '#eadece';
    ctx.fillRect(nx + 4, ny + 15, 6, nh - 25); ctx.fillRect(nx + 14, ny + 15, 6, nh - 25);
    ctx.fillRect(nx + nw - 10, ny + 15, 6, nh - 25); ctx.fillRect(nx + nw - 20, ny + 15, 6, nh - 25);

    // Triangular portico
    ctx.fillStyle = '#d0c8c0';
    ctx.beginPath(); ctx.moveTo(nx - 2, ny + 15); ctx.lineTo(mx, ny + 2); ctx.lineTo(nx + nw + 2, ny + 15); ctx.fill();

    // Center focal point
    ctx.fillStyle = '#111'; ctx.fillRect(mx - 10, ny + 15, 20, nh - 25); // Dark entrance
    drawPulsingGem(ctx, mx, ny + nh - 20, '#dd88ff', '#8844aa', 'diamond');

    // Braziers
    ctx.fillStyle = '#333'; ctx.fillRect(nx + 2, ny + nh - 18, 4, 8); ctx.fillRect(nx + nw - 6, ny + nh - 18, 4, 8);
    ctx.fillStyle = '#ff6600'; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(nx + 4, ny + nh - 20, 4, 0, Math.PI); ctx.arc(nx + nw - 4, ny + nh - 20, 4, 0, Math.PI); ctx.fill();
    ctx.globalAlpha = 1;
}

// -------------------------------------------------------------------------------------------
// 2. BA TƯ (Persian)
// -------------------------------------------------------------------------------------------
function drawPersianShrine(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;

    if (age < 3) {
        // Age 2: Mud-brick fire altar
        ctx.fillStyle = '#a88c71'; ctx.fillRect(nx + 6, ny + nh - 10, nw - 12, 10);
        ctx.fillStyle = '#bca188'; ctx.fillRect(nx + 12, ny + nh - 20, nw - 24, 10);
        drawPulsingGem(ctx, mx, ny + nh - 25, '#cca840', '#aa8830', 'shard');
        return;
    }

    if (age === 3) {
        // Zoroastrian Fire Temple
        ctx.fillStyle = '#bca188'; ctx.fillRect(nx, ny + nh - 12, nw, 12); // Sandstone base
        ctx.fillRect(nx + 6, ny + 10, nw - 12, nh - 22); // Main block

        // Twin domed towers
        ctx.fillStyle = '#a88c71';
        ctx.fillRect(nx + 2, ny + 5, 8, nh - 17); ctx.fillRect(nx + nw - 10, ny + 5, 8, nh - 17);
        ctx.beginPath(); ctx.arc(nx + 6, ny + 5, 6, Math.PI, 0); ctx.arc(nx + nw - 6, ny + 5, 6, Math.PI, 0); ctx.fill();

        // Central Arch
        ctx.fillStyle = '#1a1005';
        ctx.beginPath(); ctx.arc(mx, ny + 22, 10, Math.PI, 0); ctx.lineTo(mx + 10, ny + nh - 12); ctx.lineTo(mx - 10, ny + nh - 12); ctx.fill();
        ctx.strokeStyle = '#2b7fb8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, ny + 22, 11, Math.PI, 0); ctx.stroke();

        // Golden Gem & Fire
        drawPulsingGem(ctx, mx, ny + nh - 22, '#ffd700', '#c9a84c', 'shard');
        ctx.fillStyle = '#fc4'; ctx.globalAlpha = pulse; ctx.beginPath(); ctx.arc(mx, ny + nh - 14, 4, 0, Math.PI); ctx.fill(); ctx.globalAlpha = 1;
        return;
    }

    // Age 4: Majestic Turquoise Iwan
    ctx.fillStyle = '#c5b597'; ctx.fillRect(nx, ny + nh - 10, nw, 10);
    ctx.fillRect(nx + 4, ny + 5, nw - 8, nh - 15); // Main massive block

    // Intricate tile work borders
    ctx.fillStyle = '#3399cc'; ctx.fillRect(nx + 8, ny + 8, nw - 16, nh - 18); // Blue face
    ctx.fillStyle = '#ffd700'; ctx.fillRect(nx + 10, ny + 10, nw - 20, nh - 20); // Gold inner border
    ctx.fillStyle = '#2b7fb8'; ctx.fillRect(nx + 12, ny + 12, nw - 24, nh - 22); // Deep blue inner

    // Grand Iwan Arch
    ctx.fillStyle = '#0a101a';
    ctx.beginPath(); ctx.moveTo(mx - nw / 4, ny + nh - 10); ctx.lineTo(mx - nw / 4, ny + 25);
    ctx.quadraticCurveTo(mx, ny + 10, mx + nw / 4, ny + 25); ctx.lineTo(mx + nw / 4, ny + nh - 10); ctx.fill();

    // Arch trim
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mx - nw / 4, ny + nh - 10); ctx.lineTo(mx - nw / 4, ny + 25);
    ctx.quadraticCurveTo(mx, ny + 10, mx + nw / 4, ny + 25); ctx.lineTo(mx + nw / 4, ny + nh - 10); ctx.stroke();

    // Epic Floating Artifact
    drawPulsingGem(ctx, mx, ny + nh - 28, '#ffd700', '#fff', 'shard');

    // Turquoise onion domes on sides
    ctx.fillStyle = '#3399cc';
    ctx.beginPath(); ctx.arc(nx, ny + 15, 8, Math.PI, 0); ctx.arc(nx + nw, ny + 15, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.fillRect(nx - 1, ny + 2, 2, 5); ctx.fillRect(nx + nw - 1, ny + 2, 2, 5);
}

// -------------------------------------------------------------------------------------------
// 3. ĐẠI TỐNG (Ming)
// -------------------------------------------------------------------------------------------
function drawChineseShrine(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;

    if (age < 3) {
        // Age 2: Simple stone and wood base
        ctx.fillStyle = '#666'; ctx.fillRect(nx + 4, ny + nh - 6, nw - 8, 6);
        ctx.fillStyle = '#a12b2b'; ctx.fillRect(nx + 10, ny + nh - 12, nw - 20, 6);
        drawPulsingGem(ctx, mx, ny + nh - 20, '#44aa55', '#338844', 'sphere');
        return;
    }

    if (age === 3) {
        // Red Wood Pavilion
        ctx.fillStyle = '#7a7a7a'; ctx.fillRect(nx, ny + nh - 10, nw, 10); // Stone base

        // Red Pillars
        ctx.fillStyle = '#a12b2b';
        ctx.fillRect(nx + 4, ny + 15, 5, nh - 25); ctx.fillRect(nx + nw - 9, ny + 15, 5, nh - 25);
        ctx.fillRect(nx + 14, ny + 15, 4, nh - 25); ctx.fillRect(nx + nw - 18, ny + 15, 4, nh - 25);

        // Sweeping Green Roof
        ctx.fillStyle = '#2b4d37';
        ctx.beginPath(); ctx.moveTo(nx - 6, ny + 15); ctx.quadraticCurveTo(mx, ny - 5, nx + nw + 6, ny + 15); ctx.lineTo(mx, ny + 2); ctx.fill();
        ctx.fillStyle = teamColor; ctx.beginPath(); ctx.arc(mx, ny + 5, 4, 0, Math.PI * 2); ctx.fill();

        // Jade Gem
        drawPulsingGem(ctx, mx, ny + nh - 24, '#22cc44', '#228844', 'sphere');

        // Bronze incense burner
        ctx.fillStyle = '#8c7853'; ctx.fillRect(mx - 6, ny + nh - 16, 12, 6); ctx.fillRect(mx - 4, ny + nh - 10, 8, 4);
        ctx.fillStyle = 'rgba(200,200,200,0.5)'; ctx.globalAlpha = pulse; ctx.beginPath(); ctx.arc(mx, ny + nh - 20, 6, 0, Math.PI); ctx.fill(); ctx.globalAlpha = 1;

        return;
    }

    // Age 4: Imperial Pagoda Shrine
    ctx.fillStyle = '#656565'; ctx.fillRect(nx - 2, ny + nh - 8, nw + 4, 8); // Wide stone base
    ctx.fillStyle = '#fef4e8'; ctx.fillRect(nx + 4, ny + 20, nw - 8, nh - 28); // Inner plaster

    // Gold Dragon Pillars
    ctx.fillStyle = '#a12b2b'; ctx.fillRect(nx + 4, ny + 20, 6, nh - 28); ctx.fillRect(nx + nw - 10, ny + 20, 6, nh - 28);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(nx + 7, ny + 20); ctx.lineTo(nx + 7, ny + nh - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx + nw - 7, ny + 20); ctx.lineTo(nx + nw - 7, ny + nh - 8); ctx.stroke();

    // Multi-tier Imperial Yellow Roof
    ctx.fillStyle = '#d4a017';
    // Bottom tier
    ctx.beginPath(); ctx.moveTo(nx - 8, ny + 22); ctx.quadraticCurveTo(mx, ny + 2, nx + nw + 8, ny + 22); ctx.lineTo(mx, ny + 12); ctx.fill();
    // Mid tier
    ctx.beginPath(); ctx.moveTo(nx - 4, ny + 10); ctx.quadraticCurveTo(mx, ny - 10, nx + nw + 4, ny + 10); ctx.lineTo(mx, ny); ctx.fill();
    // Top tier
    ctx.beginPath(); ctx.moveTo(nx + 2, ny); ctx.quadraticCurveTo(mx, ny - 15, nx + nw - 2, ny); ctx.fill();

    // Top Spire
    ctx.fillStyle = '#a12b2b'; ctx.fillRect(mx - 1, ny - 20, 2, 8);
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(mx, ny - 20, 3, 0, Math.PI * 2); ctx.fill();

    // Sacred Jade Artifact
    ctx.fillStyle = '#111'; ctx.fillRect(mx - 10, ny + 30, 20, nh - 38); // Dark alcove
    drawPulsingGem(ctx, mx, ny + nh - 22, '#22cc44', '#11ff55', 'sphere');
}

// -------------------------------------------------------------------------------------------
// 4. YAMATO (Japanese)
// -------------------------------------------------------------------------------------------
function drawJapaneseShrine(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);

    if (age < 3) {
        // Age 2: Small wood and thatch shrine
        ctx.fillStyle = '#c8ba9a'; ctx.fillRect(nx + 6, ny + nh - 8, nw - 12, 8);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(nx + 10, ny + nh - 18, nw - 20, 10);
        ctx.fillStyle = '#8a7850'; ctx.beginPath(); ctx.moveTo(nx + 4, ny + nh - 18); ctx.lineTo(mx, ny + nh - 26); ctx.lineTo(nx + nw - 4, ny + nh - 18); ctx.fill();
        drawPulsingGem(ctx, mx, ny + nh - 15, '#cc5555', '#aa3333', 'shard');
        return;
    }

    if (age === 3) {
        // Torii Gate Shrine
        ctx.fillStyle = '#cfcfcf'; ctx.fillRect(nx, ny + nh - 6, nw, 6);

        // Vermillion Torii Gates
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(nx + 8, ny + 12, 5, nh - 18); ctx.fillRect(nx + nw - 13, ny + 12, 5, nh - 18); // Vertical
        ctx.fillRect(nx + 4, ny + 18, nw - 8, 4); // Lower crossbeam
        ctx.fillRect(nx, ny + 10, nw, 5); // Upper curved beam (Kasagi)

        ctx.fillStyle = '#111'; ctx.fillRect(mx - 2, ny + 12, 4, 6); // Plaque

        // Paper Lanterns
        ctx.fillStyle = '#f0e8d0'; ctx.fillRect(nx + 6, ny + 24, 6, 8); ctx.fillRect(nx + nw - 12, ny + 24, 6, 8);
        ctx.fillStyle = '#cc3333'; ctx.fillRect(nx + 8, ny + 26, 2, 4); ctx.fillRect(nx + nw - 10, ny + 26, 2, 4);

        // Crimson Gem
        drawPulsingGem(ctx, mx, ny + nh - 18, '#ff6666', '#cc3333', 'shard');
        return;
    }

    // Age 4: Elaborate Mountaintop Sanctuary
    ctx.fillStyle = '#b0b5ba'; ctx.fillRect(nx - 2, ny + nh - 12, nw + 4, 12); // Steep stone base
    ctx.fillStyle = '#d2d2d6'; ctx.fillRect(nx + 2, ny + nh - 18, nw - 4, 6); // Inner wood floor
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
    for (let i = nx; i < nx + nw; i += 8) { ctx.beginPath(); ctx.moveTo(i, ny + nh - 12); ctx.lineTo(i - 4, ny + nh); ctx.stroke(); } // Stone texture

    // Main shrine body
    ctx.fillStyle = '#f0f0f5'; ctx.fillRect(nx + 6, ny + 15, nw - 12, nh - 33);
    ctx.fillStyle = '#1c2024'; ctx.fillRect(nx + 6, ny + 15, nw - 12, 3); // Crossbeams
    ctx.fillRect(mx - 8, ny + 15, 16, nh - 33); // Dark central room

    // Massive Sweeping Black Roof
    ctx.fillStyle = '#1c2024';
    ctx.beginPath(); ctx.moveTo(nx - 10, ny + 15); ctx.lineTo(nx + 4, ny - 5); ctx.lineTo(nx + nw - 4, ny - 5); ctx.lineTo(nx + nw + 10, ny + 15); ctx.lineTo(nx + nw - 4, ny + 20); ctx.lineTo(nx + 4, ny + 20); ctx.fill();
    ctx.fillStyle = '#d4a017'; // Gold Chigi (forked finials)
    ctx.beginPath(); ctx.moveTo(nx + 8, ny - 5); ctx.lineTo(nx + 2, ny - 15); ctx.lineTo(nx + 6, ny - 15); ctx.lineTo(nx + 12, ny - 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(nx + nw - 8, ny - 5); ctx.lineTo(nx + nw - 2, ny - 15); ctx.lineTo(nx + nw - 6, ny - 15); ctx.lineTo(nx + nw - 12, ny - 5); ctx.fill();
    ctx.fillRect(mx - 10, ny - 8, 20, 3); // Katsuogi (logs)

    // Sacred Rope (Shimenawa)
    ctx.strokeStyle = '#e6dbae'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx + 6, ny + 22); ctx.quadraticCurveTo(mx, ny + 28, nx + nw - 6, ny + 22); ctx.stroke();
    // Shide (zigzag paper)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(mx - 6, ny + 26); ctx.lineTo(mx - 8, ny + 32); ctx.lineTo(mx - 4, ny + 32); ctx.lineTo(mx - 6, ny + 38); ctx.fill();
    ctx.beginPath(); ctx.moveTo(mx + 6, ny + 26); ctx.lineTo(mx + 8, ny + 32); ctx.lineTo(mx + 4, ny + 32); ctx.lineTo(mx + 6, ny + 38); ctx.fill();

    // Sacred Crimson Gem
    drawPulsingGem(ctx, mx, ny + nh - 24, '#ff6666', '#ff1111', 'shard');
}

// -------------------------------------------------------------------------------------------
// 5. VIKING (Norse)
// -------------------------------------------------------------------------------------------
function drawVikingShrine(b: Building, ctx: CanvasRenderingContext2D, nx: number, ny: number, nw: number, nh: number, fullW: number): void {
    const age = b.age;
    const mx = nx + nw / 2;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;

    if (age < 3) {
        // Age 2: Simple stone ring
        ctx.fillStyle = '#4a4a48'; ctx.beginPath(); ctx.ellipse(mx, ny + nh - 10, nw / 2 - 4, 8, 0, 0, Math.PI * 2); ctx.fill();
        drawPulsingGem(ctx, mx, ny + nh - 16, '#66aadd', '#4477aa', 'diamond');
        return;
    }

    if (age === 3) {
        // Glowing Runestone Circle
        ctx.fillStyle = '#4a4a48'; ctx.beginPath(); ctx.ellipse(mx, ny + nh - 10, nw / 2, 10, 0, 0, Math.PI * 2); ctx.fill();

        // Frozen Blue Gem in center
        drawPulsingGem(ctx, mx, ny + nh - 20, '#88ccff', '#4488bb', 'diamond');

        // Runestones
        ctx.fillStyle = '#5a5a58';
        const drawRunestone = (rx: number, ry: number, rw: number, rh: number) => {
            ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rw / 2, ry - 5); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx, ry + rh); ctx.fill();
            // Rune glow
            ctx.fillStyle = '#88ccff'; ctx.globalAlpha = pulse;
            ctx.fillRect(rx + rw / 2 - 1, ry + 5, 2, rh - 10); ctx.fillRect(rx + 2, ry + 8, rw - 4, 2);
            ctx.globalAlpha = 1; ctx.fillStyle = '#5a5a58';
        };

        drawRunestone(nx + 4, ny + 15, 6, 20); // Left
        drawRunestone(nx + nw - 10, ny + 15, 6, 20); // Right
        drawRunestone(mx - 4, ny + 5, 8, 25); // Back Center
        return;
    }

    // Age 4: Epic Stave-Altar
    ctx.fillStyle = '#555'; ctx.fillRect(nx, ny + nh - 12, nw, 12); // Stone base

    ctx.fillStyle = '#4a3320'; ctx.fillRect(nx + 4, ny + 15, nw - 8, nh - 27); // Dark wood core
    ctx.strokeStyle = '#2a1b10'; ctx.lineWidth = 1;
    for (let i = nx + 8; i < nx + nw - 4; i += 4) { ctx.beginPath(); ctx.moveTo(i, ny + 15); ctx.lineTo(i, ny + nh - 12); ctx.stroke(); } // Stave planks

    // Steep Stave Roofs
    ctx.fillStyle = '#3a2415';
    ctx.beginPath(); ctx.moveTo(nx - 4, ny + 20); ctx.lineTo(mx, ny); ctx.lineTo(nx + nw + 4, ny + 20); ctx.fill();
    ctx.beginPath(); ctx.moveTo(nx + 2, ny + 8); ctx.lineTo(mx, ny - 10); ctx.lineTo(nx + nw - 2, ny + 8); ctx.fill();

    // Gold Dragon Prows
    ctx.strokeStyle = '#cda434'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx, ny + 5); ctx.quadraticCurveTo(nx - 8, ny - 2, nx - 4, ny - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx + nw, ny + 5); ctx.quadraticCurveTo(nx + nw + 8, ny - 2, nx + nw + 4, ny - 8); ctx.stroke();

    // Central Altar & Gem
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(mx - 10, ny + 25); ctx.lineTo(mx + 10, ny + 25); ctx.lineTo(mx + 14, ny + nh - 12); ctx.lineTo(mx - 14, ny + nh - 12); ctx.fill();

    drawPulsingGem(ctx, mx, ny + nh - 25, '#88ccff', '#eef8ff', 'diamond');

    // Rack of Painted Shields
    ctx.fillStyle = teamColor;
    ctx.beginPath(); ctx.arc(nx + 12, ny + nh - 20, 4, 0, Math.PI * 2); ctx.arc(nx + nw - 12, ny + nh - 20, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cda434';
    ctx.beginPath(); ctx.arc(nx + 12, ny + nh - 20, 1.5, 0, Math.PI * 2); ctx.arc(nx + nw - 12, ny + nh - 20, 1.5, 0, Math.PI * 2); ctx.fill();
}
