// ============================================================
//  TileMap — Terrain generation & tile rendering
//  OPTIMIZED: offscreen canvas caching + binary heap A*
// ============================================================

import { TILE_SIZE, MAP_COLS, MAP_ROWS, TerrainType, C } from "../config/GameConfig";

import { generateTerrain } from "./MapGenerator";
import { findPath as findPathA } from "./Pathfinder";

export enum MapPreset {
    Grasslands = 'grasslands',
    Islands = 'islands',
    Desert = 'desert',
    Highland = 'highland',
    Tundra = 'tundra',
    Swamp = 'swamp',
    Volcanic = 'volcanic',
}

export interface MapInfo {
    preset: MapPreset;
    name: string;
    description: string;
}

export const MAP_LIST: MapInfo[] = [
    { preset: MapPreset.Grasslands, name: 'Đồng Cỏ', description: 'Địa hình đồng bằng rộng lớn với ao nước nhỏ. Tài nguyên phong phú.' },
    { preset: MapPreset.Islands, name: 'Quần Đảo', description: 'Nhiều hồ nước lớn chia cắt bản đồ. Di chuyển hạn chế, chiến lược phòng thủ.' },
    { preset: MapPreset.Desert, name: 'Sa Mạc', description: 'Địa hình cát nóng bỏng với ốc đảo hiếm. Tài nguyên khan hiếm.' },
    { preset: MapPreset.Highland, name: 'Cao Nguyên', description: 'Núi đá và khe nước xen kẽ. Vị trí phòng thủ tốt nhưng khó mở rộng.' },
    { preset: MapPreset.Tundra, name: 'Đồng Băng', description: 'Vùng đất đóng băng với hồ nước lạnh. Tài nguyên tập trung thành cụm.' },
    { preset: MapPreset.Swamp, name: 'Đầm Lầy', description: 'Đất ẩm ướt với nhiều ao nước nhỏ rải rác. Di chuyển chậm, khó xây dựng.' },
    { preset: MapPreset.Volcanic, name: 'Núi Lửa', description: 'Vùng đất nóng với đá núi lửa. Tài nguyên khoáng sản dồi dào.' },
];

export class TileMap {
    cols = MAP_COLS;
    rows = MAP_ROWS;
    terrain: TerrainType[][];
    occupied: boolean[][];       // all occupied (resources + buildings) — for pathfinding
    buildingOcc: boolean[][];    // buildings only
    mineOcc: boolean[][];        // gold/stone mines only — blocks building placement
    mapPreset: MapPreset;
    
    // Injectable callback to retrieve units (used by CombatStrategies via TileMapRef)
    getAllUnits: () => import("../entities/Unit").Unit[] = () => [];

    // ---- Offscreen cache for terrain rendering ----
    private terrainCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
    private terrainCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
    private terrainDirty = true;

    // ---- Minimap cache ----
    private minimapCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
    private minimapCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
    private minimapDirty = true;

    constructor(preset: MapPreset = MapPreset.Grasslands) {
        this.mapPreset = preset;
        this.terrain = Array.from({ length: this.rows }, () =>
            new Array(this.cols).fill(TerrainType.Grass)
        );
        this.occupied = Array.from({ length: this.rows }, () =>
            new Array(this.cols).fill(false)
        );
        this.buildingOcc = Array.from({ length: this.rows }, () =>
            new Array(this.cols).fill(false)
        );
        this.mineOcc = Array.from({ length: this.rows }, () =>
            new Array(this.cols).fill(false)
        );
    }

    /** Performs heavy setup asynchronously, yielding to the browser to report progress. */
    async asyncInit(onProgress: (percent: number, stepName: string) => void): Promise<void> {
        // Step 1: Procedural Map Generation (Sync for now, but wrapped to let UI breathe before)
        onProgress(5, "Đang định hình địa hình...");
        await new Promise(r => setTimeout(r, 10)); // Yield
        this.generate(this.mapPreset);

        // Step 2: Build Terrain Cache (Heavy Canvas operations - done in chunks)
        onProgress(15, "Đang sơn màu bề mặt...");
        await this.buildTerrainCacheAsync((p) => {
            // Map 15% to 65% for terrain rendering
            onProgress(15 + p * 0.5, "Đang vẽ vùng đất...");
        });
    }

    /** Public: build terrain cache only (call after generate) */
    async buildTerrainCache(onProgress: (percent: number, stepName: string) => void): Promise<void> {
        onProgress(15, "Đang sơn màu bề mặt...");
        await this.buildTerrainCacheAsync((p) => {
            onProgress(15 + p * 0.5, "Đang vẽ vùng đất...");
        });
    }

    private async buildTerrainCacheAsync(onProgress: (percent: number) => void): Promise<void> {
        const w = this.cols * TILE_SIZE;
        const h = this.rows * TILE_SIZE;
        try {
            this.terrainCanvas = new OffscreenCanvas(w, h);
        } catch {
            this.terrainCanvas = document.createElement('canvas');
            this.terrainCanvas.width = w;
            this.terrainCanvas.height = h;
        }
        this.terrainCtx = this.terrainCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

        await this.redrawTerrainCacheChunked(onProgress);
    }

    private async redrawTerrainCacheChunked(onProgress: (percent: number) => void): Promise<void> {
        if (!this.terrainCtx) return;
        const ctx = this.terrainCtx;
        const TS = TILE_SIZE;

        const tileHash = (c: number, r: number): number => {
            let h = (c * 2654435761 + r * 2246822519) & 0x7fffffff;
            h = ((h >> 16) ^ h) * 0x45d9f3b;
            return (h & 0x7fffffff) / 0x7fffffff;
        };
        const blendHash = (c: number, r: number): number => {
            return (tileHash(c, r) * 0.45 + tileHash(c + 1, r) * 0.14 +
                tileHash(c - 1, r) * 0.14 + tileHash(c, r + 1) * 0.09 +
                tileHash(c, r - 1) * 0.09 + tileHash(c + 1, r + 1) * 0.045 +
                tileHash(c - 1, r - 1) * 0.045);
        };
        const varyColor = (baseR: number, baseG: number, baseB: number, noise: number, range: number): string => {
            const shift = (noise - 0.5) * range;
            const cr = Math.max(0, Math.min(255, baseR + shift * 0.7));
            const cg = Math.max(0, Math.min(255, baseG + shift));
            const cb = Math.max(0, Math.min(255, baseB + shift * 0.5));
            return `rgb(${cr | 0},${cg | 0},${cb | 0})`;
        };

        const chunkSize = 40; // Render 40 rows at a time

        for (let chunkStart = 0; chunkStart < this.rows; chunkStart += chunkSize) {
            const chunkEnd = Math.min(this.rows, chunkStart + chunkSize);

            for (let r = chunkStart; r < chunkEnd; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const t = this.terrain[r][c];
                    const x = c * TS, y = r * TS;
                    const h = tileHash(c, r);
                    const bh = blendHash(c, r);
                    const h2 = tileHash(c * 7 + 3, r * 13 + 5);
                    const h3 = tileHash(c * 11 + 7, r * 3 + 11);

                    // ===== BASE FILL — gloomy, moody palette =====
                    switch (t) {
                        case TerrainType.Grass:
                            ctx.fillStyle = varyColor(38, 92, 28, bh, 18); break;
                        case TerrainType.GrassDark:
                            ctx.fillStyle = varyColor(22, 58, 14, bh, 14); break;
                        case TerrainType.GrassLight:
                            ctx.fillStyle = varyColor(48, 110, 35, bh, 20); break;
                        case TerrainType.GrassFlower:
                            ctx.fillStyle = varyColor(40, 96, 30, bh, 16); break;
                        case TerrainType.Sand:
                            ctx.fillStyle = varyColor(142, 128, 88, bh, 18); break;
                        case TerrainType.Dirt:
                            ctx.fillStyle = varyColor(72, 60, 38, bh, 14); break;
                        case TerrainType.DirtDark:
                            ctx.fillStyle = varyColor(45, 36, 22, bh, 12); break;
                        case TerrainType.Rock:
                            ctx.fillStyle = varyColor(68, 68, 64, bh, 16); break;
                        case TerrainType.Water: {
                            // Depth gradient: deeper towards center of water bodies
                            let waterNeighborCount = 0;
                            if (r > 0 && this.terrain[r - 1][c] === TerrainType.Water) waterNeighborCount++;
                            if (r < this.rows - 1 && this.terrain[r + 1][c] === TerrainType.Water) waterNeighborCount++;
                            if (c > 0 && this.terrain[r][c - 1] === TerrainType.Water) waterNeighborCount++;
                            if (c < this.cols - 1 && this.terrain[r][c + 1] === TerrainType.Water) waterNeighborCount++;
                            const depthFactor = waterNeighborCount / 4;
                            const wR = 12 + (1 - depthFactor) * 14;
                            const wG = 55 + (1 - depthFactor) * 25;
                            const wB = 95 + (1 - depthFactor) * 20;
                            ctx.fillStyle = varyColor(wR, wG, wB, bh, 14);
                            break;
                        }
                        case TerrainType.Bridge:
                            ctx.fillStyle = varyColor(72, 54, 30, bh, 12); break;
                    }
                    ctx.fillRect(x, y, TS, TS);

                    // ===== ORGANIC DITHERED TRANSITIONS =====
                    // Blend edges between different terrain types for organic look
                    if (t !== TerrainType.Water && t !== TerrainType.Bridge) {
                        const neighbors = [
                            r > 0 ? this.terrain[r - 1][c] : t,
                            r < this.rows - 1 ? this.terrain[r + 1][c] : t,
                            c > 0 ? this.terrain[r][c - 1] : t,
                            c < this.cols - 1 ? this.terrain[r][c + 1] : t
                        ];
                        for (let ni = 0; ni < 4; ni++) {
                            if (neighbors[ni] !== t && neighbors[ni] !== TerrainType.Water && neighbors[ni] !== TerrainType.Bridge) {
                                // Scatter a few pixels of neighbor color along the edge
                                const edgeHash = tileHash(c * 19 + ni, r * 23 + ni);
                                const dotCount = 2 + Math.floor(edgeHash * 3);
                                for (let d = 0; d < dotCount; d++) {
                                    const dh = tileHash(c * 7 + d + ni * 31, r * 11 + d + ni * 17);
                                    let dx: number, dy: number;
                                    if (ni === 0) { dx = x + dh * TS; dy = y + dh * 3; }
                                    else if (ni === 1) { dx = x + dh * TS; dy = y + TS - 1 - dh * 3; }
                                    else if (ni === 2) { dx = x + dh * 3; dy = y + dh * TS; }
                                    else { dx = x + TS - 1 - dh * 3; dy = y + dh * TS; }
                                    ctx.fillStyle = `rgba(0,0,0,${0.04 + dh * 0.06})`;
                                    ctx.fillRect(dx, dy, 1, 1);
                                }
                            }
                        }
                    }

                    // ===== DIRECTIONAL LIGHTING: dim moonlight from top-left =====
                    if (t !== TerrainType.Water) {
                        // Faint top-left highlight (muted moonlight)
                        ctx.fillStyle = 'rgba(180,200,220,0.03)';
                        ctx.fillRect(x, y, TS / 2, TS / 2);
                        // Stronger bottom-right shadow for depth
                        ctx.fillStyle = 'rgba(0,0,0,0.06)';
                        ctx.fillRect(x + TS / 2, y + TS / 2, TS / 2, TS / 2);
                    }

                    // ===== DETAILED DECORATIONS PER TERRAIN TYPE =====
                    if (t === TerrainType.Grass) {
                        if (h < 0.45) {
                            // Grass blade tufts — multiple varieties
                            const variety = Math.floor(h * 10) % 4;
                            const gx = x + 2 + h * (TS - 5);
                            const gy = y + TS - 3;

                            if (variety === 0) {
                                // Tall grass cluster
                                ctx.fillStyle = '#1a4a0e';
                                ctx.fillRect(gx, gy - 6, 1, 6);
                                ctx.fillRect(gx + 2, gy - 5, 1, 5);
                                ctx.fillRect(gx + 4, gy - 4, 1, 4);
                                // Blade tips (lighter)
                                ctx.fillStyle = '#2a6a1a';
                                ctx.fillRect(gx, gy - 6, 1, 1);
                                ctx.fillRect(gx + 2, gy - 5, 1, 1);
                            } else if (variety === 1) {
                                // Short stubby grass
                                ctx.fillStyle = '#1e5010';
                                ctx.fillRect(gx, gy - 3, 1, 3);
                                ctx.fillRect(gx + 2, gy - 2, 1, 2);
                                ctx.fillRect(gx - 1, gy - 4, 1, 4);
                            } else if (variety === 2) {
                                // Clover-like patch
                                ctx.fillStyle = '#14400a';
                                ctx.fillRect(gx, gy - 3, 3, 3);
                                ctx.fillStyle = '#2a7020';
                                ctx.fillRect(gx, gy - 3, 2, 2);
                            } else {
                                // Single blade with seed head
                                ctx.fillStyle = '#184810';
                                ctx.fillRect(gx + 1, gy - 5, 1, 5);
                                ctx.fillStyle = '#7a6a38';
                                ctx.fillRect(gx, gy - 6, 3, 2);
                            }

                            // Rare mushroom
                            if (h < 0.06) {
                                ctx.fillStyle = '#c8a070';
                                ctx.fillRect(gx + 7, gy - 1, 1, 2);
                                ctx.fillStyle = '#dd6644';
                                ctx.fillRect(gx + 6, gy - 2, 3, 1);
                                // Mushroom highlight
                                ctx.fillStyle = '#ee8866';
                                ctx.fillRect(gx + 6, gy - 2, 1, 1);
                            }

                            // Rare tiny stone
                            if (h > 0.38 && h < 0.42) {
                                ctx.fillStyle = '#8a8a78';
                                ctx.fillRect(x + h2 * 10, y + h3 * 10 + 3, 2, 2);
                                ctx.fillStyle = '#9a9a88';
                                ctx.fillRect(x + h2 * 10, y + h3 * 10 + 3, 1, 1);
                            }
                        }
                        // Extra: dandelion puff (very rare)
                        if (h > 0.93 && h < 0.96) {
                            const dx = x + h2 * (TS - 4) + 2;
                            const dy = y + h3 * (TS - 6) + 2;
                            ctx.fillStyle = '#286818';
                            ctx.fillRect(dx, dy + 3, 1, 3); // stem
                            ctx.fillStyle = 'rgba(255,255,250,0.7)';
                            ctx.fillRect(dx - 1, dy, 3, 3); // puff
                            ctx.fillRect(dx, dy - 1, 1, 1); // top wisp
                        }
                        // Extra: fallen leaf (rare)
                        if (h > 0.82 && h < 0.86) {
                            const lx = x + h2 * 10 + 2;
                            const ly = y + h3 * 8 + 4;
                            ctx.fillStyle = '#aa7730';
                            ctx.fillRect(lx, ly, 3, 2);
                            ctx.fillStyle = '#cc9940';
                            ctx.fillRect(lx + 1, ly, 1, 1);
                        }
                        // Extra: tiny ant trail (very rare)
                        if (h > 0.03 && h < 0.05) {
                            ctx.fillStyle = '#2a2218';
                            for (let ai = 0; ai < 4; ai++) {
                                ctx.fillRect(x + 3 + ai * 3, y + 10 + (ai % 2), 1, 1);
                            }
                        }
                    } else if (t === TerrainType.GrassFlower) {
                        if (h < 0.75) {
                            // Rich diverse flower garden
                            const colors = ['#ee4466', '#eedd44', '#ffffff', '#ff88cc', '#ffaa22', '#aa66ff', '#66ccff', '#ff6688', '#88ddff'];
                            const flowerCount = 2 + Math.floor(h * 5);
                            for (let i = 0; i < flowerCount; i++) {
                                const fh = tileHash(c * 31 + i, r * 17 + i);
                                const fh2 = tileHash(c + i * 7, r + i * 13);
                                ctx.fillStyle = colors[Math.floor(fh * colors.length)];
                                const fx = x + 2 + fh * (TS - 5);
                                const fy = y + 2 + fh2 * (TS - 5);

                                if (fh < 0.5) {
                                    // 4-petal flower
                                    ctx.fillRect(fx, fy, 2, 2);
                                    ctx.fillRect(fx - 1, fy + 1, 1, 1);
                                    ctx.fillRect(fx + 2, fy, 1, 1);
                                    ctx.fillRect(fx + 1, fy - 1, 1, 1);
                                    ctx.fillRect(fx, fy + 2, 1, 1);
                                    // Center dot
                                    ctx.fillStyle = '#ffee00';
                                    ctx.fillRect(fx, fy, 1, 1);
                                } else {
                                    // Small daisy
                                    ctx.fillRect(fx, fy, 3, 1);
                                    ctx.fillRect(fx + 1, fy - 1, 1, 3);
                                    ctx.fillStyle = '#ffdd00';
                                    ctx.fillRect(fx + 1, fy, 1, 1);
                                }
                                // Stem
                                ctx.fillStyle = '#1a5a14';
                                ctx.fillRect(fx + 1, fy + 2, 1, 2);
                            }
                            // Small butterfly on very rare tiles
                            if (h < 0.04) {
                                ctx.fillStyle = '#ff88dd';
                                ctx.fillRect(x + 8, y + 3, 2, 1);
                                ctx.fillRect(x + 6, y + 2, 2, 1);
                                ctx.fillRect(x + 10, y + 2, 2, 1);
                            }
                        }
                    } else if (t === TerrainType.GrassLight) {
                        if (h < 0.5) {
                            // Lush meadow grass variety
                            const fx = x + h * (TS - 5);
                            const fy = y + h2 * (TS - 5);
                            // Tall blades with sway
                            ctx.fillStyle = '#358028';
                            ctx.fillRect(fx, fy, 1, 5);
                            ctx.fillRect(fx + 3, fy + 1, 1, 4);
                            // Light tips catching dim light
                            ctx.fillStyle = '#5aa840';
                            ctx.fillRect(fx, fy, 1, 1);
                            ctx.fillRect(fx + 3, fy + 1, 1, 1);
                            // Dew drops (very rare)
                            if (h < 0.08) {
                                ctx.fillStyle = 'rgba(180,220,255,0.5)';
                                ctx.fillRect(fx + 1, fy + 2, 1, 1);
                            }
                        }
                        // Subtle dim patches
                        if (h2 > 0.85) {
                            ctx.fillStyle = 'rgba(180,200,160,0.03)';
                            ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
                        }
                    } else if (t === TerrainType.GrassDark) {
                        if (h < 0.4) {
                            // Small pebbles/stones + moss in dark grass
                            const px = x + 3 + h * (TS - 7);
                            const py = y + 3 + h2 * (TS - 7);
                            ctx.fillStyle = '#4a5a48';
                            ctx.fillRect(px, py, 3, 2);
                            // Highlight on top edge of stone
                            ctx.fillStyle = '#6a7a68';
                            ctx.fillRect(px, py, 3, 1);
                            if (h < 0.2) {
                                // Moss patch
                                ctx.fillStyle = '#1a4a18';
                                ctx.fillRect(px + 4, py + 1, 2, 2);
                                ctx.fillRect(px - 1, py + 2, 2, 1);
                            }
                            // Tiny root lines
                            if (h < 0.12) {
                                ctx.fillStyle = '#3a4a28';
                                ctx.fillRect(px - 2, py + 3, 5, 1);
                            }
                        }
                    } else if (t === TerrainType.Rock) {
                        // ===== 3D FACETED ROCK =====
                        // Top highlight (light from top-left)
                        ctx.fillStyle = 'rgba(255,255,255,0.10)';
                        ctx.fillRect(x, y, TS, 3);
                        ctx.fillRect(x, y, 3, TS);
                        // Bottom-right shadow for 3D depth
                        ctx.fillStyle = 'rgba(0,0,0,0.12)';
                        ctx.fillRect(x, y + TS - 3, TS, 3);
                        ctx.fillRect(x + TS - 3, y, 3, TS);

                        if (h < 0.5) {
                            // Crack lines
                            ctx.fillStyle = '#5a5a52';
                            if (h < 0.25) {
                                ctx.fillRect(x + 3 + h * 6, y + 2, 1, TS - 4);
                            } else {
                                ctx.fillRect(x + 2, y + 3 + h * 6, TS - 4, 1);
                            }
                            // Lighter stone facet
                            if (h < 0.2) {
                                ctx.fillStyle = '#9a9a90';
                                ctx.fillRect(x + 4, y + 2, 5, 4);
                                ctx.fillStyle = '#a8a8a0';
                                ctx.fillRect(x + 4, y + 2, 5, 1); // top highlight of facet
                            }
                        }
                        // Lichen/moss on some rocks
                        if (h > 0.7 && h < 0.82) {
                            ctx.fillStyle = '#4a6a30';
                            ctx.fillRect(x + h2 * 8, y + h3 * 8 + 4, 3, 2);
                        }
                    } else if (t === TerrainType.Dirt) {
                        if (h < 0.35) {
                            // Dirt grain texture
                            ctx.fillStyle = '#5a4a32';
                            ctx.fillRect(x + h * TS, y + h2 * TS, 2, 1);
                            ctx.fillRect(x + h3 * TS, y + h * TS, 1, 2);
                        }
                        // Worm trail
                        if (h > 0.88 && h < 0.92) {
                            ctx.fillStyle = '#4a3a22';
                            ctx.fillRect(x + 2, y + 5, 1, 3);
                            ctx.fillRect(x + 3, y + 7, 1, 2);
                            ctx.fillRect(x + 4, y + 8, 2, 1);
                        }
                        // Small twig
                        if (h > 0.6 && h < 0.64) {
                            ctx.fillStyle = '#7a5a30';
                            ctx.fillRect(x + 4, y + 8, 6, 1);
                            ctx.fillRect(x + 8, y + 7, 1, 2);
                        }
                        // Subtle 3D height
                        ctx.fillStyle = 'rgba(255,255,240,0.03)';
                        ctx.fillRect(x, y, TS, 2);
                    } else if (t === TerrainType.DirtDark) {
                        // Mud puddle specks
                        if (h < 0.25) {
                            ctx.fillStyle = '#3a2a18';
                            ctx.fillRect(x + h * (TS - 4), y + h2 * (TS - 4), 3, 2);
                        }
                        // Wet sheen (sub-highlights)
                        if (h > 0.7 && h < 0.8) {
                            ctx.fillStyle = 'rgba(80,100,120,0.12)';
                            ctx.fillRect(x + 4, y + 4, 5, 3);
                        }
                    } else if (t === TerrainType.Sand) {
                        // ===== 3D SAND DUNE RIPPLES =====
                        if (h < 0.4) {
                            // Wind ripple lines (parallel wavy lines)
                            const rippleY = y + 3 + Math.floor(h * 8);
                            ctx.fillStyle = '#a8986a'; // highlight (top of ripple)
                            ctx.fillRect(x + 1, rippleY, TS - 2, 1);
                            ctx.fillStyle = '#887848'; // shadow (bottom of ripple)
                            ctx.fillRect(x + 1, rippleY + 1, TS - 2, 1);
                        }
                        // Second ripple layer
                        if (h > 0.3 && h < 0.55) {
                            const rippleY2 = y + 8 + Math.floor(h2 * 5);
                            ctx.fillStyle = '#b0a070';
                            ctx.fillRect(x + 2, rippleY2, TS - 4, 1);
                            ctx.fillStyle = '#908050';
                            ctx.fillRect(x + 2, rippleY2 + 1, TS - 4, 1);
                        }
                        // Small sand grain clusters
                        if (h > 0.8) {
                            ctx.fillStyle = '#c8b878';
                            ctx.fillRect(x + h2 * 10, y + h3 * 10, 2, 1);
                        }
                        // Subtle muted light on sand
                        ctx.fillStyle = 'rgba(200,190,150,0.03)';
                        ctx.fillRect(x, y, TS / 2, TS / 2);
                    } else if (t === TerrainType.Bridge) {
                        // ===== WOODEN BRIDGE with planks and rails =====
                        // Plank lines (horizontal)
                        ctx.fillStyle = '#8a6030';
                        for (let i = 0; i < 4; i++) {
                            ctx.fillRect(x, y + i * 4 + 1, TS, 1);
                        }
                        // Plank highlight (3D)
                        ctx.fillStyle = '#c09860';
                        for (let i = 0; i < 4; i++) {
                            ctx.fillRect(x + 1, y + i * 4, TS - 2, 1);
                        }
                        // Nail dots
                        ctx.fillStyle = '#3a3030';
                        ctx.fillRect(x + 2, y + 3, 1, 1);
                        ctx.fillRect(x + TS - 3, y + 3, 1, 1);
                        ctx.fillRect(x + 2, y + 11, 1, 1);
                        ctx.fillRect(x + TS - 3, y + 11, 1, 1);
                        // Side rails (if edge of bridge)
                        const isWaterLeft = c > 0 && this.terrain[r][c - 1] === TerrainType.Water;
                        const isWaterRight = c < this.cols - 1 && this.terrain[r][c + 1] === TerrainType.Water;
                        if (isWaterLeft) {
                            ctx.fillStyle = '#6a4a22';
                            ctx.fillRect(x, y, 2, TS);
                            ctx.fillStyle = '#8a6a38';
                            ctx.fillRect(x, y, 1, TS);
                        }
                        if (isWaterRight) {
                            ctx.fillStyle = '#6a4a22';
                            ctx.fillRect(x + TS - 2, y, 2, TS);
                            ctx.fillStyle = '#5a3a18';
                            ctx.fillRect(x + TS - 1, y, 1, TS);
                        }
                    } else if (t === TerrainType.Water) {
                        // Subtle underwater caustic patterns (static, animation is separate)
                        if (h < 0.15) {
                            ctx.fillStyle = 'rgba(120,200,255,0.08)';
                            ctx.fillRect(x + h2 * 8, y + h3 * 8, 4, 3);
                        }
                        // Deeper caustic web
                        if (h > 0.4 && h < 0.55) {
                            ctx.fillStyle = 'rgba(100,180,240,0.05)';
                            ctx.fillRect(x + h3 * 6 + 2, y + h2 * 6 + 2, 6, 1);
                            ctx.fillRect(x + h2 * 8 + 1, y + h3 * 8, 1, 5);
                        }
                        // Shore foam — white frothy pixels where water borders land
                        const landAbove = r > 0 && this.terrain[r - 1][c] !== TerrainType.Water;
                        const landBelow = r < this.rows - 1 && this.terrain[r + 1][c] !== TerrainType.Water;
                        const landLeft = c > 0 && this.terrain[r][c - 1] !== TerrainType.Water;
                        const landRight = c < this.cols - 1 && this.terrain[r][c + 1] !== TerrainType.Water;
                        if (landAbove) {
                            ctx.fillStyle = 'rgba(200,230,255,0.25)';
                            for (let fi = 0; fi < 4; fi++) {
                                const fh = tileHash(c * 3 + fi, r * 5);
                                ctx.fillRect(x + fh * (TS - 2), y + fh * 2, 2, 1);
                            }
                        }
                        if (landBelow) {
                            ctx.fillStyle = 'rgba(200,230,255,0.20)';
                            for (let fi = 0; fi < 3; fi++) {
                                const fh = tileHash(c * 5 + fi, r * 7);
                                ctx.fillRect(x + fh * (TS - 2), y + TS - 2 + fh, 2, 1);
                            }
                        }
                        if (landLeft) {
                            ctx.fillStyle = 'rgba(200,230,255,0.22)';
                            for (let fi = 0; fi < 3; fi++) {
                                const fh = tileHash(c * 9 + fi, r * 3);
                                ctx.fillRect(x + fh * 2, y + fh * (TS - 2), 1, 2);
                            }
                        }
                        if (landRight) {
                            ctx.fillStyle = 'rgba(200,230,255,0.18)';
                            for (let fi = 0; fi < 3; fi++) {
                                const fh = tileHash(c * 11 + fi, r * 13);
                                ctx.fillRect(x + TS - 2 + fh, y + fh * (TS - 2), 1, 2);
                            }
                        }
                        // Rare lily pad
                        if (h > 0.92 && !landAbove && !landBelow && !landLeft && !landRight) {
                            ctx.fillStyle = '#2a7a28';
                            ctx.beginPath(); ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#3a9a38';
                            ctx.beginPath(); ctx.arc(x + 8, y + 8, 2, 0, Math.PI * 1.6); ctx.fill();
                            // Tiny flower on lily pad
                            if (h > 0.96) {
                                ctx.fillStyle = '#ff88aa';
                                ctx.fillRect(x + 7, y + 6, 2, 2);
                                ctx.fillStyle = '#ffdd44';
                                ctx.fillRect(x + 8, y + 7, 1, 1);
                            }
                        }
                        // Underwater sand patches (shallow areas)
                        if (h > 0.75 && h < 0.82) {
                            ctx.fillStyle = 'rgba(180,160,100,0.08)';
                            ctx.fillRect(x + h2 * 6, y + h3 * 6, 5, 4);
                        }
                    }

                    // ===== ENHANCED TERRAIN EDGE SHADOWS (3D Depth) =====
                    if (t !== TerrainType.Water) {
                        // Water neighbor detection for elevation difference
                        const wAbove = r > 0 && this.terrain[r - 1][c] === TerrainType.Water;
                        const wBelow = r < this.rows - 1 && this.terrain[r + 1][c] === TerrainType.Water;
                        const wLeft = c > 0 && this.terrain[r][c - 1] === TerrainType.Water;
                        const wRight = c < this.cols - 1 && this.terrain[r][c + 1] === TerrainType.Water;

                        if (wAbove) {
                            // Cliff edge shadow (land is higher than water)
                            ctx.fillStyle = 'rgba(0,0,0,0.18)';
                            ctx.fillRect(x, y, TS, 4);
                            ctx.fillStyle = 'rgba(0,0,0,0.08)';
                            ctx.fillRect(x, y + 4, TS, 2);
                        }
                        if (wBelow) {
                            // Water below — highlight at edge, then shadow at bottom
                            ctx.fillStyle = 'rgba(255,255,240,0.06)';
                            ctx.fillRect(x, y + TS - 5, TS, 2);
                            ctx.fillStyle = 'rgba(0,0,0,0.10)';
                            ctx.fillRect(x, y + TS - 3, TS, 3);
                        }
                        if (wLeft) {
                            ctx.fillStyle = 'rgba(0,0,0,0.14)';
                            ctx.fillRect(x, y, 4, TS);
                            ctx.fillStyle = 'rgba(0,0,0,0.06)';
                            ctx.fillRect(x + 4, y, 2, TS);
                        }
                        if (wRight) {
                            ctx.fillStyle = 'rgba(0,0,0,0.08)';
                            ctx.fillRect(x + TS - 4, y, 4, TS);
                        }

                        // Corner shadows for diagonal water adjacency
                        if (wAbove && wLeft) {
                            ctx.fillStyle = 'rgba(0,0,0,0.08)';
                            ctx.fillRect(x, y, 5, 5);
                        }
                        if (wAbove && wRight) {
                            ctx.fillStyle = 'rgba(0,0,0,0.05)';
                            ctx.fillRect(x + TS - 5, y, 5, 5);
                        }
                    }

                    // ===== Rock/cliff 3D edges =====
                    if (t === TerrainType.Rock) {
                        const rAbove = r > 0 ? this.terrain[r - 1][c] : TerrainType.Water;
                        const rBelow = r < this.rows - 1 ? this.terrain[r + 1][c] : TerrainType.Water;
                        const rLeft = c > 0 ? this.terrain[r][c - 1] : TerrainType.Water;

                        if (rAbove !== TerrainType.Rock) {
                            // Top edge: bright highlight (cliff face lit from above)
                            ctx.fillStyle = 'rgba(255,255,255,0.12)';
                            ctx.fillRect(x, y, TS, 3);
                            ctx.fillStyle = 'rgba(255,255,255,0.05)';
                            ctx.fillRect(x, y + 3, TS, 2);
                        }
                        if (rBelow !== TerrainType.Rock) {
                            // Bottom edge: dark shadow (base of cliff)
                            ctx.fillStyle = 'rgba(0,0,0,0.20)';
                            ctx.fillRect(x, y + TS - 3, TS, 3);
                            ctx.fillStyle = 'rgba(0,0,0,0.08)';
                            ctx.fillRect(x, y + TS - 5, TS, 2);
                        }
                        if (rLeft !== TerrainType.Rock) {
                            ctx.fillStyle = 'rgba(255,255,255,0.06)';
                            ctx.fillRect(x, y, 3, TS);
                        }
                    }

                    // ===== Sand/Dirt transition edges =====
                    if (t === TerrainType.Sand) {
                        if (r > 0 && this.terrain[r - 1][c] !== TerrainType.Sand && this.terrain[r - 1][c] !== TerrainType.Water) {
                            ctx.fillStyle = 'rgba(180,160,100,0.15)';
                            ctx.fillRect(x, y, TS, 2);
                        }
                    }
                }
            }
            // Yield to browser and report progress at end of each chunk
            const progress = (chunkEnd / this.rows) * 100;
            onProgress(progress);
            await new Promise(r => setTimeout(r, 0));
        } // end of chunk loop
        this.terrainDirty = false;
        this.minimapDirty = true;
    }

    /** Build minimap cache (much smaller canvas) */
    private buildMinimapCache(w: number, h: number): void {
        try {
            this.minimapCanvas = new OffscreenCanvas(w, h);
        } catch {
            this.minimapCanvas = document.createElement('canvas');
            (this.minimapCanvas as HTMLCanvasElement).width = w;
            (this.minimapCanvas as HTMLCanvasElement).height = h;
        }
        this.minimapCtx = this.minimapCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        this.redrawMinimapCache(w, h);
    }

    private redrawMinimapCache(w: number, h: number): void {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const tw = w / this.cols, th = h / this.rows;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const t = this.terrain[r][c];
                switch (t) {
                    case TerrainType.Grass: ctx.fillStyle = '#3a6a20'; break;
                    case TerrainType.GrassDark: ctx.fillStyle = '#2a5a15'; break;
                    case TerrainType.GrassLight: ctx.fillStyle = '#4a8a2e'; break;
                    case TerrainType.GrassFlower: ctx.fillStyle = '#3e7a22'; break;
                    case TerrainType.Sand: ctx.fillStyle = '#b0a060'; break;
                    case TerrainType.Dirt: ctx.fillStyle = '#6a5535'; break;
                    case TerrainType.DirtDark: ctx.fillStyle = '#453520'; break;
                    case TerrainType.Rock: ctx.fillStyle = '#707068'; break;
                    case TerrainType.Water: ctx.fillStyle = '#2070aa'; break;
                    case TerrainType.Bridge: ctx.fillStyle = '#7a5a30'; break;
                }
                ctx.fillRect(c * tw, r * th, Math.ceil(tw), Math.ceil(th));
            }
        }
        this.minimapDirty = false;
    }

    // ---- Procedural map generation (delegated to MapGenerator.ts) ----
    public generate(preset: MapPreset): void {
        generateTerrain(this.terrain, this.rows, this.cols, preset);
    }

    // ---- Query ----
    /** Checks water + ALL occupied (resources + buildings). Used for building placement. */
    isPassable(col: number, row: number): boolean {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        if (this.terrain[row][col] === TerrainType.Water) return false;
        return !this.occupied[row][col];
    }

    /** Checks water + buildings + resources. Units cannot walk through any solid object. Used for pathfinding. */
    isWalkable(col: number, row: number): boolean {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        if (this.terrain[row][col] === TerrainType.Water) return false;
        return !this.occupied[row][col];
    }

    getTerrainAt(col: number, row: number): TerrainType {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return TerrainType.Water;
        return this.terrain[row][col];
    }

    /** Check if a world-space position is water */
    isWaterAtWorld(wx: number, wy: number): boolean {
        const [c, r] = this.worldToTile(wx, wy);
        return this.getTerrainAt(c, r) === TerrainType.Water;
    }

    /** Find nearest walkable world position (spiral search). Returns null if none found within 12 tiles. */
    findNearestWalkableWorld(wx: number, wy: number): [number, number] | null {
        const [c, r] = this.worldToTile(wx, wy);
        if (this.isWalkable(c, r)) return [wx, wy]; // Already walkable
        // Spiral search
        for (let radius = 1; radius <= 12; radius++) {
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // Only perimeter
                    const nc = c + dc, nr = r + dr;
                    if (this.isWalkable(nc, nr)) {
                        const [wxx, wyy] = this.tileToWorld(nc, nr);
                        return [wxx, wyy];
                    }
                }
            }
        }
        return null;
    }

    setOccupied(col: number, row: number, w: number, h: number, val: boolean): void {
        for (let r = Math.max(0, row); r < row + h && r < this.rows; r++)
            for (let c = Math.max(0, col); c < col + w && c < this.cols; c++)
                this.occupied[r][c] = val;
    }

    setBuildingOccupied(col: number, row: number, w: number, h: number, val: boolean): void {
        for (let r = Math.max(0, row); r < row + h && r < this.rows; r++)
            for (let c = Math.max(0, col); c < col + w && c < this.cols; c++) {
                this.buildingOcc[r][c] = val;
                this.occupied[r][c] = val; // also mark general occupied
            }
    }

    setMineOccupied(col: number, row: number, w: number, h: number, val: boolean): void {
        for (let r = Math.max(0, row); r < row + h && r < this.rows; r++)
            for (let c = Math.max(0, col); c < col + w && c < this.cols; c++)
                this.mineOcc[r][c] = val;
    }

    canPlace(col: number, row: number, w: number, h: number): boolean {
        for (let r = row; r < row + h; r++)
            for (let c = col; c < col + w; c++) {
                if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
                if (this.terrain[r][c] === TerrainType.Water) return false;
                if (this.buildingOcc[r][c]) return false;
                // Block on gold/stone mines (can't build over them)
                if (this.mineOcc[r][c]) return false;
            }
        return true;
    }

    worldToTile(x: number, y: number): [number, number] {
        return [Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE)];
    }

    tileToWorld(col: number, row: number): [number, number] {
        return [col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2];
    }

    /** A* pathfinding using binary min-heap */
    findPath(sc: number, sr: number, ec: number, er: number): [number, number][] | null {
        return findPathA(this, sc, sr, ec, er);
    }

    // ---- Render (uses cached offscreen canvas — single drawImage call) ----
    render(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        if (this.terrainDirty) {
            // Cannot synchronously block here anymore. Relying on async init.
        }

        if (this.terrainCanvas) {
            // Source rect = viewport area on the terrain canvas
            const sx = Math.max(0, Math.floor(camX));
            const sy = Math.max(0, Math.floor(camY));
            const sw = Math.min(vpW + 2, this.cols * TILE_SIZE - sx);
            const sh = Math.min(vpH + 2, this.rows * TILE_SIZE - sy);
            if (sw > 0 && sh > 0) {
                ctx.drawImage(this.terrainCanvas as any, sx, sy, sw, sh, sx, sy, sw, sh);
            }
        }

        // Animated water overlay (only visible tiles)
        this.renderWaterAnimation(ctx, camX, camY, vpW, vpH);
    }

    /** Render animated water effects on visible water tiles */
    private renderWaterAnimation(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        const t = Date.now() / 1000;
        const TS = TILE_SIZE;
        const startCol = Math.max(0, Math.floor(camX / TS) - 1);
        const startRow = Math.max(0, Math.floor(camY / TS) - 1);
        const endCol = Math.min(this.cols - 1, Math.ceil((camX + vpW) / TS) + 1);
        const endRow = Math.min(this.rows - 1, Math.ceil((camY + vpH) / TS) + 1);

        const activeAlpha = ctx.globalAlpha; // save current alpha

        // Pass 1: Light shimmer (caustic-like)
        ctx.fillStyle = '#64d2ff'; // hex equivalent of 100,210,255
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const wave1 = Math.sin(c * 0.8 + r * 0.4 + t * 1.5) * 0.5 + 0.5;
                const wave2 = Math.sin(c * 0.5 - r * 0.7 + t * 1.1 + 2.0) * 0.5 + 0.5;
                const wave3 = Math.sin(c * 1.2 + r * 0.3 - t * 0.7 + 3.0) * 0.5 + 0.5;
                const combined = wave1 * 0.45 + wave2 * 0.35 + wave3 * 0.2;
                if (combined > 0.50) {
                    ctx.globalAlpha = (combined - 0.50) * 0.30;
                    ctx.fillRect(c * TS + Math.sin(t * 0.8 + c) * 2, r * TS + Math.cos(t * 0.6 + r) * 1, TS * (0.25 + combined * 0.55), TS * 0.6);
                }
            }
        }

        // Pass 2: Secondary caustic pattern (perpendicular)
        ctx.fillStyle = '#96e6ff'; // equivalent of 150,230,255
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const caustic = Math.sin(c * 1.5 - r * 0.8 + t * 2.0 + 1.0);
                if (caustic > 0.7) {
                    ctx.globalAlpha = (caustic - 0.7) * 0.20;
                    ctx.fillRect(c * TS + 2, r * TS + Math.sin(t * 0.5 + c * 0.7) * 3 + 3, TS - 4, 3);
                }
            }
        }

        // Pass 3: Dark wave troughs
        ctx.fillStyle = '#082337'; // equivalent of 8,35,55
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const darkWave = Math.sin(c * 0.6 + r * 0.9 - t * 0.9 + 1.5) * 0.5 + 0.5;
                if (darkWave > 0.60) {
                    ctx.globalAlpha = (darkWave - 0.60) * 0.22;
                    ctx.fillRect(c * TS, r * TS + TS * 0.25 + Math.sin(t * 0.4 + c) * 2, TS, TS * 0.45);
                }
            }
        }

        // Pass 4: Sparkles
        ctx.fillStyle = '#ffffff';
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const x = c * TS, y = r * TS;
                const sparklePhase = Math.sin(c * 3.7 + r * 2.1 + t * 3.0);
                if (sparklePhase > 0.82) {
                    ctx.globalAlpha = Math.min((sparklePhase - 0.82) * 2.5, 0.55);
                    const sx2 = x + ((c * 7 + r * 13) % TS);
                    const sy2 = y + ((c * 11 + r * 5) % TS);
                    ctx.fillRect(sx2, sy2, 2, 1);
                    ctx.fillRect(sx2 + 1, sy2 - 1, 1, 1);
                    ctx.fillRect(sx2 - 1, sy2 + 1, 1, 1);
                }
            }
        }
        ctx.fillStyle = '#c8f0ff'; // equivalent of 200,240,255
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const sparkle2 = Math.sin(c * 2.3 - r * 3.1 + t * 2.5 + 4.0);
                if (sparkle2 > 0.86) {
                    ctx.globalAlpha = (sparkle2 - 0.86) * 2.2;
                    ctx.fillRect(c * TS + ((c * 5 + r * 9 + 7) % TS), r * TS + ((c * 3 + r * 11 + 3) % TS), 1, 2);
                }
            }
        }
        ctx.fillStyle = '#fff0b4'; // equivalent of 255,240,180
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const sparkle3 = Math.sin(c * 4.1 + r * 1.7 + t * 4.0 + 2.0);
                if (sparkle3 > 0.92) {
                    ctx.globalAlpha = (sparkle3 - 0.92) * 5.0;
                    ctx.fillRect(c * TS + ((c * 9 + r * 4 + 2) % TS), r * TS + ((c * 6 + r * 8 + 1) % TS), 2, 2);
                }
            }
        }

        // Pass 5: Edge foam & Rare Details (Lily pads, Fish shadow)
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.terrain[r][c] !== TerrainType.Water) continue;
                const x = c * TS, y = r * TS;

                const landAbove = r > 0 && this.terrain[r - 1][c] !== TerrainType.Water;
                const landBelow = r < this.rows - 1 && this.terrain[r + 1][c] !== TerrainType.Water;
                const landLeft = c > 0 && this.terrain[r][c - 1] !== TerrainType.Water;
                const landRight = c < this.cols - 1 && this.terrain[r][c + 1] !== TerrainType.Water;

                if (landAbove || landBelow || landLeft || landRight) {
                    const foamBase = 0.18 + Math.sin(t * 2.0 + c * 1.5 + r * 0.7) * 0.10;
                    const foamWave = Math.sin(t * 1.5 + c * 0.8) * 2;

                    if (landAbove) {
                        ctx.globalAlpha = foamBase;
                        ctx.fillStyle = '#dcf0ff';
                        ctx.fillRect(x + 1, y + foamWave * 0.5, TS - 2, 2);
                        ctx.globalAlpha = foamBase * 0.6;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(x + 3, y + 1 + foamWave * 0.3, 4, 1);
                        ctx.fillRect(x + TS - 6, y + foamWave * 0.4, 3, 1);
                    }
                    if (landBelow) {
                        ctx.globalAlpha = foamBase * 0.8;
                        ctx.fillStyle = '#c8e6ff';
                        ctx.fillRect(x + 2, y + TS - 3 + foamWave * 0.3, TS - 4, 2);
                    }
                    if (landLeft) {
                        ctx.globalAlpha = foamBase * 0.9;
                        ctx.fillStyle = '#d2ebff';
                        ctx.fillRect(x + foamWave * 0.3, y + 2, 2, TS - 4);
                    }
                    if (landRight) {
                        ctx.globalAlpha = foamBase * 0.7;
                        ctx.fillStyle = '#c8e6ff';
                        ctx.fillRect(x + TS - 3 + foamWave * 0.2, y + 2, 2, TS - 4);
                    }

                    // Lily pad near shore
                    const lilyHash = ((c * 2654435761 + r * 2246822519) & 0x7fffffff) / 0x7fffffff;
                    if (lilyHash < 0.03) {
                        ctx.globalAlpha = 1.0;
                        const lx = x + 4 + (lilyHash * 60) % 8;
                        const ly = y + 4 + ((lilyHash * 100) | 0) % 6;
                        const sway = Math.sin(t * 0.5 + c + r) * 0.5;
                        ctx.fillStyle = '#2a7a28';
                        ctx.beginPath();
                        ctx.arc(lx + sway, ly, 3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#40aa38';
                        ctx.beginPath();
                        ctx.arc(lx + sway, ly, 2, 0, Math.PI * 1.7);
                        ctx.fill();
                        if (lilyHash < 0.012) {
                            ctx.fillStyle = '#ff88aa';
                            ctx.fillRect(lx + sway - 1, ly - 1, 2, 2);
                        }
                    }
                }

                // Fish shadow
                const fishHash = ((c * 1234567 + r * 7654321) & 0x7fffffff) / 0x7fffffff;
                if (fishHash < 0.005) {
                    const fishX = x + (Math.sin(t * 0.3 + fishHash * 100) * 0.5 + 0.5) * TS;
                    const fishY = y + TS * 0.5 + Math.cos(t * 0.2 + fishHash * 50) * 3;
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = '#0f3246';
                    ctx.beginPath();
                    ctx.ellipse(fishX, fishY, 4, 2, Math.sin(t * 0.3) * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(fishX + 3, fishY - 1, 2, 2);
                }
            }
        }

        ctx.globalAlpha = activeAlpha; // restore alpha
    }
    // ---- Minimap render (cached) ----
    renderMinimap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        // Build/rebuild minimap cache if needed
        if (!this.minimapCanvas || this.minimapDirty) {
            this.buildMinimapCache(Math.ceil(w), Math.ceil(h));
        }
        if (this.minimapCanvas) {
            ctx.drawImage(this.minimapCanvas as any, 0, 0,
                Math.ceil(w), Math.ceil(h), x, y, w, h);
        }
    }
}
