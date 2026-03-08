import { C, CivilizationType } from "../../config/GameConfig";
import type { Building } from "../Building";

export function drawTower(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    if (b.age < 2) return; // Towers only start at age 2

    switch (b.civilization) {
        case CivilizationType.LaMa:
            drawRomanTower(b, ctx, left, top, w, h);
            break;
        case CivilizationType.BaTu:
            drawPersianTower(b, ctx, left, top, w, h);
            break;
        case CivilizationType.DaiMinh:
            drawChineseTower(b, ctx, left, top, w, h);
            break;
        case CivilizationType.Yamato:
            drawJapaneseTower(b, ctx, left, top, w, h);
            break;
        case CivilizationType.Viking:
            drawVikingTower(b, ctx, left, top, w, h);
            break;
        default:
            drawRomanTower(b, ctx, left, top, w, h);
            break;
    }
}

// -------------------------------------------------------------
// Helper for the Attack Flash Effect
// -------------------------------------------------------------
function drawAttackFlash(ctx: CanvasRenderingContext2D, b: Building, center_x: number, center_y: number) {
    if (b.towerAttackAnimTimer > 0.2) {
        const flashAlpha = (b.towerAttackAnimTimer - 0.2) / 0.15; // 1→0 fading out
        const isFireArrow = b.age >= 4;
        const mainColor = isFireArrow ? `rgba(255,100,0,${flashAlpha * 0.7})` : `rgba(255,230,150,${flashAlpha * 0.7})`;
        const coreColor = isFireArrow ? `rgba(255,150,0,${flashAlpha})` : `rgba(255,255,200,${flashAlpha})`;

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(center_x, center_y, 14 * flashAlpha, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(center_x, center_y, 6 * flashAlpha, 0, Math.PI * 2);
        ctx.fill();
    }
}

// -------------------------------------------------------------------------------------------
// 1. LA MÃ (Roman) 
// Age 2: Wooden watchtower -> Age 3: Stone guard tower -> Age 4: Marble keep
// -------------------------------------------------------------------------------------------
function drawRomanTower(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const age = b.age;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const mx = left + w / 2;

    if (age === 2) {
        // Wooden watchtower
        ctx.fillStyle = '#4a3320';
        ctx.fillRect(left + 8, top + 10, w - 16, h - 10);

        // Logs
        ctx.strokeStyle = '#2d1b0d';
        ctx.lineWidth = 1;
        for (let i = top + 15; i < top + h; i += 6) {
            ctx.beginPath(); ctx.moveTo(left + 8, i); ctx.lineTo(left + w - 8, i); ctx.stroke();
        }

        // Cross bracing
        ctx.strokeStyle = '#3a2415';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(left + 8, top + 10); ctx.lineTo(left + w - 8, top + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(left + w - 8, top + 10); ctx.lineTo(left + 8, top + h); ctx.stroke();

        // Platform & Roof
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(left + 4, top + 6, w - 8, 4);
        ctx.fillStyle = '#6e4a2a'; // Wood shingle roof
        ctx.beginPath(); ctx.moveTo(left + 2, top - 5); ctx.lineTo(mx, top - 20); ctx.lineTo(left + w - 2, top - 5); ctx.fill();

        drawAttackFlash(ctx, b, mx, top + 5);
        return;
    }

    if (age === 3) {
        // Stone guard tower
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(left + 6, top, w - 12, h);

        // Stone lines
        ctx.fillStyle = '#666';
        for (let r = 0; r < 10; r++) {
            ctx.fillRect(left + 6, top + r * 6, w - 12, 1);
        }

        // Battlements
        ctx.fillStyle = '#7a7a7a';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(left + 6 + i * ((w - 12) / 3) + 2, top - 8, ((w - 12) / 3) - 4, 8);
        }

        // Arrow slits
        ctx.fillStyle = '#111';
        ctx.fillRect(left + 12, top + 15, 2, 8);
        ctx.fillRect(left + w - 14, top + 15, 2, 8);
        ctx.fillRect(mx - 1.5, top + 30, 3, 10);

        // Banner
        ctx.fillStyle = teamColor;
        ctx.fillRect(mx - 6, top + 5, 12, 15);

        drawAttackFlash(ctx, b, mx, top - 5);
        return;
    }

    // Age 4: Marble Keep
    ctx.fillStyle = '#e0dbcf'; // Off-white marble
    ctx.fillRect(left + 4, top - 10, w - 8, h + 10);

    // Sloped base reinforcement
    ctx.beginPath();
    ctx.moveTo(left + 4, top + h - 20);
    ctx.lineTo(left, top + h);
    ctx.lineTo(left + w, top + h);
    ctx.lineTo(left + w - 4, top + h - 20);
    ctx.fill();

    // Marble joints
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo(left + 4, top - 5 + i * 10); ctx.lineTo(left + w - 4, top - 5 + i * 10); ctx.stroke();
    }

    // Grand battlements with gold trim
    ctx.fillStyle = '#e0dbcf';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(left + 4 + i * ((w - 8) / 4) + 1, top - 18, ((w - 8) / 4) - 2, 8);
    }
    ctx.fillStyle = '#ffd700'; // Gold band
    ctx.fillRect(left + 4, top - 12, w - 8, 2);

    // Arched windows
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(mx - 8, top + 15, 4, Math.PI, 0); ctx.lineTo(mx - 4, top + 25); ctx.lineTo(mx - 12, top + 25); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 8, top + 15, 4, Math.PI, 0); ctx.lineTo(mx + 12, top + 25); ctx.lineTo(mx + 4, top + 25); ctx.fill();

    // Huge Imperial Flag
    ctx.fillStyle = teamColor;
    ctx.fillRect(mx - 8, top + 35, 16, 25);
    ctx.fillStyle = '#ffd700'; // SPQR eagle implied
    ctx.beginPath(); ctx.arc(mx, top + 42, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(mx - 5, top + 47, 10, 2);

    drawAttackFlash(ctx, b, mx, top - 12);
}

// -------------------------------------------------------------------------------------------
// 2. BA TƯ (Persian)
// Age 2: Mud-brick -> Age 3: Sandstone with onion dome -> Age 4: Turquoise minaret
// -------------------------------------------------------------------------------------------
function drawPersianTower(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const age = b.age;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const mx = left + w / 2;

    if (age === 2) {
        // Mud-brick Outpost
        ctx.fillStyle = '#bca188';
        ctx.beginPath();
        ctx.moveTo(left + 8, top + h);
        ctx.lineTo(left + 10, top);
        ctx.lineTo(left + w - 10, top);
        ctx.lineTo(left + w - 8, top + h);
        ctx.fill();

        // Round battlements
        for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.arc(left + 13 + i * 6, top, 4, Math.PI, 0); ctx.fill();
        }

        // Simple arched door
        ctx.fillStyle = '#4a3320';
        ctx.beginPath(); ctx.arc(mx, top + h - 10, 6, Math.PI, 0); ctx.lineTo(mx + 6, top + h); ctx.lineTo(mx - 6, top + h); ctx.fill();

        drawAttackFlash(ctx, b, mx, top - 5);
        return;
    }

    if (age === 3) {
        // Sandstone Tower
        ctx.fillStyle = '#d4bfa8';
        ctx.fillRect(left + 8, top - 10, w - 16, h + 10);

        // Base reinforcement
        ctx.fillRect(left + 4, top + h - 15, w - 8, 15);

        // Arch windows
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(mx, top + 15, 6, Math.PI, 0); ctx.lineTo(mx + 6, top + 25); ctx.lineTo(mx - 6, top + 25); ctx.fill();
        ctx.beginPath(); ctx.arc(mx, top + 40, 6, Math.PI, 0); ctx.lineTo(mx + 6, top + 50); ctx.lineTo(mx - 6, top + 50); ctx.fill();

        // Teal Onion Dome
        ctx.fillStyle = '#2b7fb8';
        ctx.beginPath();
        ctx.moveTo(mx - 10, top - 10);
        ctx.quadraticCurveTo(mx - 14, top - 25, mx, top - 30);
        ctx.quadraticCurveTo(mx + 14, top - 25, mx + 10, top - 10);
        ctx.fill();
        // Gold spire
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(mx - 1, top - 38, 2, 8);

        drawAttackFlash(ctx, b, mx, top - 5);
        return;
    }

    // Age 4: Turquoise Minaret (Very tall and slender appearance simulated within bounds)
    ctx.fillStyle = '#d4bfa8';
    ctx.fillRect(left + 10, top - 20, w - 20, h + 20);

    // Intricate tile work bands
    ctx.fillStyle = '#3399cc';
    ctx.fillRect(left + 8, top - 10, w - 16, 8);
    ctx.fillRect(left + 8, top + 20, w - 16, 6);
    ctx.fillRect(left + 8, top + h - 25, w - 16, 12);

    ctx.fillStyle = '#ffd700'; // Gold trims on the tiles
    ctx.fillRect(left + 8, top - 10, w - 16, 2);
    ctx.fillRect(left + 8, top + 26, w - 16, 2);

    // Grand Dome
    ctx.fillStyle = '#3399cc';
    ctx.beginPath();
    ctx.moveTo(mx - 14, top - 20);
    ctx.quadraticCurveTo(mx - 18, top - 40, mx, top - 45);
    ctx.quadraticCurveTo(mx + 18, top - 40, mx + 14, top - 20);
    ctx.fill();
    // Dome gold trim
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(mx, top - 20); ctx.lineTo(mx, top - 45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx - 7, top - 20); ctx.quadraticCurveTo(mx - 7, top - 35, mx - 2, top - 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx + 7, top - 20); ctx.quadraticCurveTo(mx + 7, top - 35, mx + 2, top - 42); ctx.stroke();

    // Spire
    ctx.fillRect(mx - 1.5, top - 55, 3, 10);
    ctx.beginPath(); ctx.arc(mx, top - 50, 4, 0, Math.PI * 2); ctx.fill();

    // Hanging team banner
    ctx.fillStyle = teamColor;
    ctx.fillRect(mx - 5, top + 35, 10, 25);

    drawAttackFlash(ctx, b, mx, top - 15);
}

// -------------------------------------------------------------------------------------------
// 3. ĐẠI TỐNG (Ming)
// Age 2: Wooden outpost -> Age 3: Stone pagoda -> Age 4: Imperial watchtower
// -------------------------------------------------------------------------------------------
function drawChineseTower(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const age = b.age;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const mx = left + w / 2;

    if (age === 2) {
        // Wooden outpost
        ctx.fillStyle = '#a12b2b'; // Red pillars
        ctx.fillRect(left + 8, top + h - 30, 4, 30);
        ctx.fillRect(left + w - 12, top + h - 30, 4, 30);
        ctx.fillStyle = '#dcb88f'; // Plaster infill
        ctx.fillRect(left + 12, top + h - 30, w - 24, 30);

        // Curved grey roof
        ctx.fillStyle = '#4a4f55';
        ctx.beginPath();
        ctx.moveTo(left, top + h - 30);
        ctx.quadraticCurveTo(mx, top + h - 45, left + w, top + h - 30);
        ctx.lineTo(left + w - 5, top + h - 30);
        ctx.lineTo(mx, top + h - 40);
        ctx.lineTo(left + 5, top + h - 30);
        ctx.fill();

        drawAttackFlash(ctx, b, mx, top + h - 35);
        return;
    }

    if (age === 3) {
        // Stone base pagoda
        ctx.fillStyle = '#7a7a7a'; // Stone base
        ctx.fillRect(left + 6, top + 20, w - 12, h - 20);
        ctx.fillStyle = '#a12b2b'; // Red upper deck
        ctx.fillRect(left + 8, top, w - 16, 20);

        // Green/Grey Roofs
        ctx.fillStyle = '#2b4d37';
        // Top Roof
        ctx.beginPath();
        ctx.moveTo(left, top + 5);
        ctx.quadraticCurveTo(mx, top - 15, left + w, top + 5);
        ctx.lineTo(mx, top - 5);
        ctx.fill();
        // Mid Roof Divider
        ctx.beginPath();
        ctx.moveTo(left - 2, top + 25);
        ctx.quadraticCurveTo(mx, top + 15, left + w + 2, top + 25);
        ctx.lineTo(mx, top + 20);
        ctx.fill();

        // Arrow slits in the stone base
        ctx.fillStyle = '#111';
        ctx.fillRect(mx - 2, top + 35, 4, 12);

        drawAttackFlash(ctx, b, mx, top + 10);
        return;
    }

    // Age 4: Imperial Watchtower
    // Tiered structure building up
    ctx.fillStyle = '#7a7a7a'; // Stone base
    ctx.fillRect(left + 4, top + h - 20, w - 8, 20);

    // Tower body
    ctx.fillStyle = '#a12b2b'; // Red structure
    ctx.fillRect(left + 8, top - 15, w - 16, h - 5);
    ctx.fillStyle = '#fef4e8'; // White panels
    ctx.fillRect(left + 12, top - 5, w - 24, h - 25);
    // Red lattice lines
    ctx.strokeStyle = '#a12b2b'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(left + 12, top + 10 + i * 15); ctx.lineTo(left + w - 12, top + 10 + i * 15); ctx.stroke();
    }

    // Golden Imperial Roofs
    ctx.fillStyle = '#d4a017';
    // Base tier
    ctx.beginPath(); ctx.moveTo(left - 5, top + h - 20); ctx.quadraticCurveTo(mx, top + h - 32, left + w + 5, top + h - 20); ctx.lineTo(mx, top + h - 24); ctx.fill();
    // Mid tier
    ctx.beginPath(); ctx.moveTo(left, top + 15); ctx.quadraticCurveTo(mx, top + 5, left + w, top + 15); ctx.lineTo(mx, top + 10); ctx.fill();
    // Top tier
    ctx.beginPath(); ctx.moveTo(left - 2, top - 10); ctx.quadraticCurveTo(mx, top - 30, left + w + 2, top - 10); ctx.lineTo(mx, top - 15); ctx.fill();

    // Spire
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(mx, top - 22, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(mx - 1, top - 32, 2, 10);

    // Glowing Lanterns
    ctx.fillStyle = teamColor;
    ctx.beginPath(); ctx.arc(left + 5, top + 15, 3, 0, Math.PI * 2); ctx.arc(left + w - 5, top + 15, 3, 0, Math.PI * 2); ctx.fill();

    drawAttackFlash(ctx, b, mx, top - 5);
}

// -------------------------------------------------------------------------------------------
// 4. YAMATO (Japanese)
// Age 2: Yagura -> Age 3: Sengoku Yagura -> Age 4: Tenshu Mini-keep
// -------------------------------------------------------------------------------------------
function drawJapaneseTower(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const age = b.age;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const mx = left + w / 2;

    if (age === 2) {
        // Simple Yagura
        // Wooden stilt base
        ctx.strokeStyle = '#3d2b1f';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(left + 10, top + 20); ctx.lineTo(left + 6, top + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(left + w - 10, top + 20); ctx.lineTo(left + w - 6, top + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(left + 6, top + h - 15); ctx.lineTo(left + w - 6, top + h - 15); ctx.stroke(); // cross brace

        // Box top
        ctx.fillStyle = '#f0f0f5'; // Plaster
        ctx.fillRect(left + 6, top + 5, w - 12, 20);
        ctx.strokeRect(left + 6, top + 5, w - 12, 20);

        // Roof
        ctx.fillStyle = '#2c3338';
        ctx.beginPath(); ctx.moveTo(left, top + 10); ctx.lineTo(mx, top - 5); ctx.lineTo(left + w, top + 10); ctx.lineTo(mx, top + 3); ctx.fill();

        drawAttackFlash(ctx, b, mx, top + 15);
        return;
    }

    if (age === 3) {
        // Sengoku Yagura
        // Stone base (Musha-gaeshi)
        ctx.fillStyle = '#666677';
        ctx.beginPath(); ctx.moveTo(left + 4, top + h); ctx.lineTo(left + 10, top + h - 20); ctx.lineTo(left + w - 10, top + h - 20); ctx.lineTo(left + w - 4, top + h); ctx.fill();

        // White walls
        ctx.fillStyle = '#f0f0f5';
        ctx.fillRect(left + 8, top, w - 16, h - 20);

        // Heavy dark wood beams
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(left + 8, top, 2, h - 20);
        ctx.fillRect(left + w - 10, top, 2, h - 20);
        ctx.fillRect(left + 8, top + 20, w - 16, 2);
        ctx.fillRect(left + 8, top + 40, w - 16, 2);

        // Sweeping tile roof
        ctx.fillStyle = '#2c3338';
        ctx.beginPath(); ctx.moveTo(left, top + 5); ctx.lineTo(mx, top - 15); ctx.lineTo(left + w, top + 5); ctx.lineTo(left + w - 4, top + 5); ctx.lineTo(mx, top - 8); ctx.lineTo(left + 4, top + 5); ctx.fill();

        drawAttackFlash(ctx, b, mx, top + 10);
        return;
    }

    // Age 4: Tenshu Mini-keep
    // Very steep imposing stone base
    ctx.fillStyle = '#555566';
    ctx.beginPath(); ctx.moveTo(left, top + h); ctx.quadraticCurveTo(left + 8, top + h - 15, left + 12, top + h - 30); ctx.lineTo(left + w - 12, top + h - 30); ctx.quadraticCurveTo(left + w - 8, top + h - 15, left + w, top + h); ctx.fill();

    // Dark majestic walls
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(left + 10, top - 15, w - 20, h - 15);
    // White plastered edges
    ctx.fillStyle = '#f0f0f5';
    ctx.fillRect(left + 10, top - 15, 2, h - 15);
    ctx.fillRect(left + w - 12, top - 15, 2, h - 15);

    // Golden window grates
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(left + 16, top + 5, w - 32, 10);
    ctx.fillRect(left + 16, top + 25, w - 32, 10);

    // Multiple tiered metallic roofs
    ctx.fillStyle = '#2c3338';
    // Mid tier
    ctx.beginPath(); ctx.moveTo(left + 2, top + 20); ctx.lineTo(mx, top + 5); ctx.lineTo(left + w - 2, top + 20); ctx.lineTo(mx, top + 12); ctx.fill();
    // Top tier
    ctx.beginPath(); ctx.moveTo(left - 2, top - 5); ctx.lineTo(mx, top - 25); ctx.lineTo(left + w + 2, top - 5); ctx.lineTo(mx, top - 15); ctx.fill();

    // Golden Shachihoko
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(mx - 8, top - 25, 2, 0, Math.PI * 2); ctx.arc(mx + 8, top - 25, 2, 0, Math.PI * 2); ctx.fill();

    // Vertical Clan Banner
    ctx.fillStyle = teamColor;
    ctx.fillRect(left + 4, top + 15, 4, 30);
    ctx.fillStyle = '#fff';
    ctx.fillRect(left + 4, top + 20, 4, 4);

    drawAttackFlash(ctx, b, mx, top + 10);
}

// -------------------------------------------------------------------------------------------
// 5. VIKING (Norse)
// Age 2: Timber palisade -> Age 3: Stave base -> Age 4: Fortress tower with dragon prows
// -------------------------------------------------------------------------------------------
function drawVikingTower(b: Building, ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number): void {
    const age = b.age;
    const teamColor = b.slotColor || (b.team === 0 ? C.player : C.enemy);
    const mx = left + w / 2;

    if (age === 2) {
        // Timber palisade tower
        ctx.fillStyle = '#4a2f1d';
        ctx.fillRect(left + 8, top + 10, w - 16, h - 10);

        // Pointed stakes
        ctx.strokeStyle = '#2d1b0d';
        ctx.lineWidth = 2;
        for (let i = left + 10; i < left + w - 8; i += 4) {
            ctx.beginPath(); ctx.moveTo(i, top + 10); ctx.lineTo(i, top + h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i - 2, top + 10); ctx.lineTo(i, top + 5); ctx.lineTo(i + 2, top + 10); ctx.stroke();
        }

        // Horizontal binding band
        ctx.fillStyle = '#111';
        ctx.fillRect(left + 6, top + 30, w - 12, 3);
        ctx.fillRect(left + 6, top + 50, w - 12, 3);

        drawAttackFlash(ctx, b, mx, top + 20);
        return;
    }

    if (age === 3) {
        // Stave-style tower
        // Stone base
        ctx.fillStyle = '#555';
        ctx.fillRect(left + 6, top + h - 15, w - 12, 15);

        // Stave wood body (wide at base, narrow at top)
        ctx.fillStyle = '#4a3320';
        ctx.beginPath(); ctx.moveTo(left + 8, top + h - 15); ctx.lineTo(left + 14, top); ctx.lineTo(left + w - 14, top); ctx.lineTo(left + w - 8, top + h - 15); ctx.fill();

        // Shingle roof
        ctx.fillStyle = '#3a2415';
        ctx.beginPath(); ctx.moveTo(left + 4, top + 10); ctx.lineTo(mx, top - 15); ctx.lineTo(left + w - 4, top + 10); ctx.lineTo(mx, top + 2); ctx.fill();

        // Simple dragon prows
        ctx.strokeStyle = '#cda434';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(left + 8, top + 8); ctx.quadraticCurveTo(left, top - 5, left + 4, top - 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(left + w - 8, top + 8); ctx.quadraticCurveTo(left + w, top - 5, left + w - 4, top - 8); ctx.stroke();

        drawAttackFlash(ctx, b, mx, top + 5);
        return;
    }

    // Age 4: Massive Fortress/Stave Tower
    // Heavy fortified stone floor
    ctx.fillStyle = '#4a4a50';
    ctx.fillRect(left + 2, top + h - 25, w - 4, 25);
    ctx.fillStyle = '#333';
    for (let r = 0; r < 4; r++) { ctx.fillRect(left + 2, top + h - 25 + r * 6, w - 4, 1); }

    // Tower Body
    ctx.fillStyle = '#3a2b22';
    ctx.fillRect(left + 10, top - 20, w - 20, h - 5);

    // Stave vertical ribs
    ctx.strokeStyle = '#221105';
    ctx.lineWidth = 2;
    for (let i = left + 14; i < left + w - 10; i += 6) {
        ctx.beginPath(); ctx.moveTo(i, top - 20); ctx.lineTo(i, top + h - 25); ctx.stroke();
    }

    // Tiered steep steeples
    ctx.fillStyle = '#2d221a';
    ctx.beginPath(); ctx.moveTo(left, top + 5); ctx.quadraticCurveTo(mx, top - 10, left + w, top + 5); ctx.lineTo(mx, top - 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(left + 4, top - 15); ctx.quadraticCurveTo(mx, top - 35, left + w - 4, top - 15); ctx.lineTo(mx, top - 25); ctx.fill();

    // Epic gold dragon finials
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b8860b';
    ctx.beginPath(); ctx.moveTo(left + 2, top + 3); ctx.quadraticCurveTo(left - 8, top - 12, left - 2, top - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left + w - 2, top + 3); ctx.quadraticCurveTo(left + w + 8, top - 12, left + w + 2, top - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx, top - 25); ctx.lineTo(mx, top - 45); ctx.stroke();

    // Shield rack on the front
    for (let i = 0; i < 3; i++) {
        // Draw miniature viking shield
        const sy = top + 15 + (i * 12);
        ctx.fillStyle = teamColor;
        ctx.beginPath(); ctx.arc(mx, sy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath(); ctx.moveTo(mx, sy); ctx.arc(mx, sy, 4, 0, Math.PI / 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(mx, sy); ctx.arc(mx, sy, 4, Math.PI, Math.PI * 1.5); ctx.fill();
        ctx.strokeStyle = '#5c4033'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mx, sy, 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(mx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    drawAttackFlash(ctx, b, mx, top - 20);
}
