// ============================================================
//  FogOfWar — Warcraft-style visibility system
//  OPTIMIZED: offscreen canvas cache with dirty-cell tracking
//  0 = unexplored (black), 1 = explored (dark), 2 = visible
// ============================================================

import { MAP_COLS, MAP_ROWS, TILE_SIZE, UNIT_DATA } from "../config/GameConfig";
import { Unit } from "../entities/Unit";
import { Building } from "../entities/Building";

const FOG_CELL = 2; // 1 fog cell = 2 tiles
const FOG_COLS = Math.ceil(MAP_COLS / FOG_CELL);
const FOG_ROWS = Math.ceil(MAP_ROWS / FOG_CELL);
const CELL_PX = TILE_SIZE * FOG_CELL;

export class FogOfWar {
    /** 0=unexplored, 1=explored, 2=visible */
    private grid: Uint8Array;

    // Micro-texture canvas for Fog (1 pixel = 1 fog cell)
    // 400x400 pixels = ~640KB
    private fogCanvas: OffscreenCanvas;
    private fogCtx: OffscreenCanvasRenderingContext2D;
    private fogImageData: ImageData;

    constructor() {
        this.grid = new Uint8Array(FOG_COLS * FOG_ROWS);
        // Initially all unexplored
        this.grid.fill(0);

        this.fogCanvas = new OffscreenCanvas(FOG_COLS, FOG_ROWS);
        this.fogCtx = this.fogCanvas.getContext('2d', { alpha: true, desynchronized: true })!;
        this.fogImageData = this.fogCtx.createImageData(FOG_COLS, FOG_ROWS);

        // Initialize texture: All black, 150 alpha (0.6 opacity unexplored)
        for (let i = 0; i < this.grid.length; i++) {
            const px = i * 4;
            this.fogImageData.data[px] = 0;     // R
            this.fogImageData.data[px + 1] = 0; // G
            this.fogImageData.data[px + 2] = 0; // B
            this.fogImageData.data[px + 3] = 153; // A (0.6 opacity)
        }
        this.fogCtx.putImageData(this.fogImageData, 0, 0);
    }

    private updateTimer = 0;

    update(units: Unit[], buildings: Building[], team: number, allyTeams: Set<number> = new Set(), dt: number = 0.016): void {
        // Throttle fog updates to 10 FPS (every 100ms) to prevent massive GPU texture upload bottlenecks
        this.updateTimer += dt;
        if (this.updateTimer < 0.1) return;
        this.updateTimer = 0;

        let changed = false;

        // Reset visible → explored (keep explored status)
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === 2) {
                this.grid[i] = 1;
                this.fogImageData.data[i * 4 + 3] = 102; // A (0.4 opacity for explored)
                changed = true;
            }
        }

        // Reveal around friendly and allied units
        for (const u of units) {
            if (!u.alive) continue;
            if (u.team !== team && !allyTeams.has(u.team)) continue;
            const sight = UNIT_DATA[u.type].sight;
            changed = this.reveal(u.x, u.y, sight) || changed;
        }

        // Reveal around friendly and allied buildings
        for (const b of buildings) {
            if (b.team !== team && !allyTeams.has(b.team)) continue;
            changed = this.reveal(b.x, b.y, 8) || changed;
        }

        // Only upload to GPU if changes occurred
        if (changed) {
            this.fogCtx.putImageData(this.fogImageData, 0, 0);
        }
    }

    private reveal(wx: number, wy: number, radiusTiles: number): boolean {
        let changed = false;
        const fcx = Math.floor(wx / (TILE_SIZE * FOG_CELL));
        const fcy = Math.floor(wy / (TILE_SIZE * FOG_CELL));
        const r = Math.ceil(radiusTiles / FOG_CELL);
        const rSq = r * r;

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy > rSq) continue;
                const fx = fcx + dx, fy = fcy + dy;
                if (fx < 0 || fx >= FOG_COLS || fy < 0 || fy >= FOG_ROWS) continue;

                const idx = fy * FOG_COLS + fx;
                if (this.grid[idx] !== 2) {
                    this.grid[idx] = 2; // set to visible
                    this.fogImageData.data[idx * 4 + 3] = 0; // A (0.0 transparent)
                    changed = true;
                }
            }
        }
        return changed;
    }

    /** Check if a world position is currently visible */
    isVisible(wx: number, wy: number): boolean {
        const fx = Math.floor(wx / (TILE_SIZE * FOG_CELL));
        const fy = Math.floor(wy / (TILE_SIZE * FOG_CELL));
        if (fx < 0 || fx >= FOG_COLS || fy < 0 || fy >= FOG_ROWS) return false;
        return this.grid[fy * FOG_COLS + fx] === 2;
    }

    /** Check if explored (seen before) */
    isExplored(wx: number, wy: number): boolean {
        const fx = Math.floor(wx / (TILE_SIZE * FOG_CELL));
        const fy = Math.floor(wy / (TILE_SIZE * FOG_CELL));
        if (fx < 0 || fx >= FOG_COLS || fy < 0 || fy >= FOG_ROWS) return false;
        return this.grid[fy * FOG_COLS + fx] >= 1;
    }

    /** Render fog overlay directly onto the main canvas by scaling the micro-texture up */
    render(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        const prevSmoothing = ctx.imageSmoothingEnabled;

        // Disable smoothing to keep sharp cell-based rendering
        ctx.imageSmoothingEnabled = false;

        // Draw the 400x400 image scaled up perfectly to the 12800x12800 world map, 
        // clipped naturally by the destination rectangle.

        ctx.drawImage(
            this.fogCanvas,

            // Source crop (which pixels from the 400x400 canvas map to the camera?)
            camX / CELL_PX,
            camY / CELL_PX,
            vpW / CELL_PX,
            vpH / CELL_PX,

            // Destination
            camX,
            camY,
            vpW,
            vpH
        );

        ctx.imageSmoothingEnabled = prevSmoothing;
    }

    /** Render fog on minimap by scaling the micro-texture */
    renderMinimap(ctx: CanvasRenderingContext2D, mx: number, my: number, mw: number, mh: number): void {
        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(this.fogCanvas, mx, my, mw, mh);

        ctx.imageSmoothingEnabled = prevSmoothing;
    }
}

