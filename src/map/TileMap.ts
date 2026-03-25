// ============================================================
//  TileMap — Terrain generation & tile rendering
//  OPTIMIZED: offscreen canvas caching + binary heap A*
// ============================================================

import { TILE_SIZE, MAP_COLS, MAP_ROWS, TerrainType, C } from "../config/GameConfig";
import { IS_IOS, PLATFORM } from "../config/PlatformConfig";
import { t } from "../i18n/i18n";

import { generateTerrain } from "./MapGenerator";
import { findPath as findPathA } from "./Pathfinder";
import { fbm2, lerpColor } from "./NoiseUtil";

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
    { preset: MapPreset.Grasslands, get name() { return t('map.grasslands'); }, get description() { return t('map.grasslands.desc'); } },
    { preset: MapPreset.Islands, get name() { return t('map.islands'); }, get description() { return t('map.islands.desc'); } },
    { preset: MapPreset.Desert, get name() { return t('map.desert'); }, get description() { return t('map.desert.desc'); } },
    { preset: MapPreset.Highland, get name() { return t('map.highland'); }, get description() { return t('map.highland.desc'); } },
    { preset: MapPreset.Tundra, get name() { return t('map.tundra'); }, get description() { return t('map.tundra.desc'); } },
    { preset: MapPreset.Swamp, get name() { return t('map.swamp'); }, get description() { return t('map.swamp.desc'); } },
    { preset: MapPreset.Volcanic, get name() { return t('map.volcanic'); }, get description() { return t('map.volcanic.desc'); } },
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
    /** Scale factor for terrain cache (0.5 on iOS to fit canvas limits) */
    private terrainScale = IS_IOS ? 0.5 : 1;

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
        onProgress(5, t('loading.terrain'));
        await new Promise(r => setTimeout(r, 10)); // Yield
        this.generate(this.mapPreset);

        // Step 2: Build Terrain Cache (Heavy Canvas operations - done in chunks)
        onProgress(15, t('loading.painting'));
        await this.buildTerrainCacheAsync((p) => {
            // Map 15% to 65% for terrain rendering
            onProgress(15 + p * 0.5, t('loading.drawing'));
        });
    }

    /** Public: build terrain cache only (call after generate) */
    async buildTerrainCache(onProgress: (percent: number, stepName: string) => void): Promise<void> {
        onProgress(15, t('loading.painting'));
        await this.buildTerrainCacheAsync((p) => {
            onProgress(15 + p * 0.5, t('loading.drawing'));
        });
    }

    private async buildTerrainCacheAsync(onProgress: (percent: number) => void): Promise<void> {
        // On iOS, check if full-res canvas would exceed pixel limit
        const fullW = this.cols * TILE_SIZE;
        const fullH = this.rows * TILE_SIZE;
        if (fullW * fullH > PLATFORM.maxCanvasPixels) {
            // Scale down to fit within canvas limits
            this.terrainScale = Math.sqrt(PLATFORM.maxCanvasPixels / (fullW * fullH)) * 0.9; // 10% safety margin
            this.terrainScale = Math.max(0.25, Math.min(1, this.terrainScale));
            console.log(`[TileMap] Terrain cache scaled to ${(this.terrainScale * 100).toFixed(0)}% for iOS (${fullW}×${fullH} → ${Math.round(fullW * this.terrainScale)}×${Math.round(fullH * this.terrainScale)})`);
        }
        const w = Math.round(fullW * this.terrainScale);
        const h = Math.round(fullH * this.terrainScale);
        try {
            this.terrainCanvas = new OffscreenCanvas(w, h);
        } catch {
            this.terrainCanvas = document.createElement('canvas');
            this.terrainCanvas.width = w;
            this.terrainCanvas.height = h;
        }
        this.terrainCtx = this.terrainCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

        // Apply scale transform so tile drawing code works unchanged
        if (this.terrainScale !== 1 && this.terrainCtx) {
            this.terrainCtx.scale(this.terrainScale, this.terrainScale);
        }

        await this.redrawTerrainCacheChunked(onProgress);
    }

    private async redrawTerrainCacheChunked(onProgress: (percent: number) => void): Promise<void> {
        if (!this.terrainCtx) return;
        const ctx = this.terrainCtx;
        const TS = TILE_SIZE;

        // ===== PIXEL ART PALETTE — Fixed colors, no continuous RGB =====
        const PAL = {
            grass1: '#2d6b1a', grass2: '#337a1e', grass3: '#256012',
            grassDk1: '#1a4a0e', grassDk2: '#1e5612', grassDk3: '#153e0a',
            grassLt1: '#3d8a28', grassLt2: '#48982e', grassLt3: '#358022',
            grassFlower: '#2f7a1c',
            grassBlade1: '#1a4a0e', grassBlade2: '#2a6a1a', grassBladeTip: '#4a8a38',
            mushCap: '#cc5544', mushStem: '#c8a070',
            stone1: '#8a8a78', stone2: '#9a9a88', stone3: '#7a7a6a',
            leaf1: '#aa7730', leaf2: '#cc9940',
            rock1: '#585858', rock2: '#666662', rock3: '#4e4e4a',
            rockHi: '#7a7a76', rockCrack: '#444440', rockMoss: '#4a6a30',
            dirt1: '#5c4c30', dirt2: '#6a5838', dirt3: '#4e3e24',
            dirtDk1: '#3a2a18', dirtDk2: '#453520', dirtWet: '#2e2010',
            twig: '#7a5a30',
            sand1: '#b0a068', sand2: '#c0b078', sand3: '#9a8a58',
            sandHi: '#d0c088', sandSh: '#887848',
            water1: '#1a4a70', water2: '#245880', water3: '#164068',
            waterShallow: '#2a6090', waterFoam: '#8ab8d8', waterCaustic: '#4a90c0',
            lilyPad: '#2a7a28', lilyFlower: '#ff88aa',
            bridge1: '#6a4a22', bridge2: '#8a6a38', bridgePlank: '#7a5a30',
            bridgeHi: '#a08050', bridgeNail: '#3a3030',
            flowerRed: '#ee4466', flowerYel: '#eedd44', flowerWht: '#ffffff',
            flowerPnk: '#ff88cc', flowerOrg: '#ffaa22', flowerPrp: '#aa66ff',
            flowerCenter: '#ffee00', stem: '#1a5a14',
        };

        const tileHash = (c: number, r: number): number => {
            let h = (c * 2654435761 + r * 2246822519) & 0x7fffffff;
            h = ((h >> 16) ^ h) * 0x45d9f3b;
            return (h & 0x7fffffff) / 0x7fffffff;
        };

        const pickPal = (arr: string[], h: number): string => arr[Math.floor(h * arr.length) % arr.length];

        const terrainLayers = [
            [TerrainType.Water],
            [TerrainType.Sand],
            [TerrainType.Dirt, TerrainType.DirtDark],
            [TerrainType.Grass, TerrainType.GrassLight, TerrainType.GrassDark, TerrainType.GrassFlower],
            [TerrainType.Rock],
            [TerrainType.Bridge]
        ];

        const chunkSize = 40;

        for (const layerTypes of terrainLayers) {
            for (let chunkStart = 0; chunkStart < this.rows; chunkStart += chunkSize) {
                const chunkEnd = Math.min(this.rows, chunkStart + chunkSize);

                for (let r = chunkStart; r < chunkEnd; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        const t = this.terrain[r][c];
                        if (!layerTypes.includes(t)) continue;

                        const x = c * TS, y = r * TS;
                        const h = tileHash(c, r);
                        const h2 = tileHash(c * 7 + 3, r * 13 + 5);
                        const h3 = tileHash(c * 11 + 7, r * 3 + 11);

                    // ===== NOISE-BASED BASE FILL (breaks grid pattern) =====
                    // Use continuous noise at world coords to smoothly vary the base color.
                    // This makes adjacent tiles flow into each other instead of showing sharp edges.
                    const worldCX = x + TS * 0.5; // center of tile in world coords
                    const worldCY = y + TS * 0.5;
                    const n1 = fbm2(worldCX, worldCY, 40); // large-scale variation
                    const n2 = fbm2(worldCX + 500, worldCY + 300, 18); // finer variation

                    switch (t) {
                        case TerrainType.Grass: {
                            const colors = [PAL.grass1, PAL.grass2, PAL.grass3];
                            const dark = [PAL.grassDk1, PAL.grassDk2];
                            const base = lerpColor(colors[0], colors[2], n1);
                            ctx.fillStyle = n2 < 0.3 ? lerpColor(base, dark[0], n2 * 1.5) : base;
                            break;
                        }
                        case TerrainType.GrassDark: {
                            ctx.fillStyle = lerpColor(PAL.grassDk1, PAL.grassDk3, n1);
                            break;
                        }
                        case TerrainType.GrassLight: {
                            ctx.fillStyle = lerpColor(PAL.grassLt1, PAL.grassLt3, n1);
                            break;
                        }
                        case TerrainType.GrassFlower:
                            ctx.fillStyle = lerpColor(PAL.grassFlower, PAL.grass2, n2 * 0.3);
                            break;
                        case TerrainType.Sand:
                            ctx.fillStyle = lerpColor(PAL.sand1, PAL.sand3, n1);
                            break;
                        case TerrainType.Dirt:
                            ctx.fillStyle = lerpColor(PAL.dirt1, PAL.dirt3, n1);
                            break;
                        case TerrainType.DirtDark:
                            ctx.fillStyle = lerpColor(PAL.dirtDk1, PAL.dirtDk2, n1);
                            break;
                        case TerrainType.Rock:
                            ctx.fillStyle = lerpColor(PAL.rock1, PAL.rock3, n1);
                            break;
                        case TerrainType.Water: {
                            let wn = 0;
                            if (r > 0 && this.terrain[r - 1][c] === TerrainType.Water) wn++;
                            if (r < this.rows - 1 && this.terrain[r + 1][c] === TerrainType.Water) wn++;
                            if (c > 0 && this.terrain[r][c - 1] === TerrainType.Water) wn++;
                            if (c < this.cols - 1 && this.terrain[r][c + 1] === TerrainType.Water) wn++;
                            ctx.fillStyle = wn >= 3 ? PAL.water1 : (wn >= 2 ? PAL.water2 : PAL.waterShallow);
                            break;
                        }
                        case TerrainType.Bridge:
                            ctx.fillStyle = PAL.bridgePlank; break;
                    }
                    // ===== ORGANIC LAYERED FILL =====
                    if (t === TerrainType.Water || t === TerrainType.Bridge) {
                        ctx.fillRect(x, y, TS, TS);
                    } else {
                        // Organic overlapping shape based on noise to completely break the 16x16 grid
                        const jitterX = Math.round((fbm2(worldCX, worldCY, 22) - 0.5) * 10);
                        const jitterY = Math.round((fbm2(worldCY, worldCX, 22) - 0.5) * 10);
                        
                        // TỐI ƯU HOÁ: Thay vì gọi hàm vẽ Path (roundRect) cực kỳ chậm,
                        // Vẽ 2 hình chữ nhật hình chữ thập mập (cross) để giả lập hình tròn/blob.
                        // Hàm fillRect() được tăng tốc bằng GPU, nhanh hơn tạo Path ~50 lần.
                        const drawX = x - 3 + jitterX;
                        const drawY = y - 3 + jitterY;
                        const drawS = TS + 6;
                        
                        // Vertical block
                        ctx.fillRect(drawX + 2, drawY, drawS - 4, drawS);
                        // Horizontal block
                        ctx.fillRect(drawX, drawY + 2, drawS, drawS - 4);
                        
                        // Scatter pixels around edge to blend organically
                        if (h < 0.5) {
                            ctx.fillStyle = ctx.fillStyle; // Keep base color
                            for (let p = 0; p < 5; p++) {
                                const px = x - 6 + Math.floor(tileHash(c * p + 1, r * 3) * (TS + 12));
                                const py = y - 6 + Math.floor(tileHash(c * 5, r * p + 2) * (TS + 12));
                                if (Math.hypot(px - worldCX, py - worldCY) > TS / 2) {
                                    ctx.fillRect(px, py, 1, 1);
                                }
                            }
                        }
                    }


                    // ===== PIXEL ART DECORATIONS =====
                    if (t === TerrainType.Grass) {
                        if (h < 0.45) {
                            const variety = Math.floor(h * 10) % 4;
                            const gx = x + 2 + Math.floor(h * (TS - 5));
                            const gy = y + TS - 3;
                            if (variety === 0) {
                                ctx.fillStyle = PAL.grassBlade1;
                                ctx.fillRect(gx, gy - 6, 1, 6);
                                ctx.fillRect(gx + 2, gy - 5, 1, 5);
                                ctx.fillRect(gx + 4, gy - 4, 1, 4);
                                ctx.fillStyle = PAL.grassBladeTip;
                                ctx.fillRect(gx, gy - 6, 1, 1);
                                ctx.fillRect(gx + 2, gy - 5, 1, 1);
                            } else if (variety === 1) {
                                ctx.fillStyle = PAL.grassBlade1;
                                ctx.fillRect(gx, gy - 3, 1, 3);
                                ctx.fillRect(gx + 2, gy - 2, 1, 2);
                                ctx.fillRect(gx - 1, gy - 4, 1, 4);
                            } else if (variety === 2) {
                                ctx.fillStyle = PAL.grassDk1;
                                ctx.fillRect(gx, gy - 3, 3, 3);
                                ctx.fillStyle = PAL.grassBladeTip;
                                ctx.fillRect(gx, gy - 3, 2, 2);
                            } else {
                                ctx.fillStyle = PAL.grassBlade1;
                                ctx.fillRect(gx + 1, gy - 5, 1, 5);
                                ctx.fillStyle = '#7a6a38';
                                ctx.fillRect(gx, gy - 6, 3, 2);
                            }
                            if (h < 0.06) {
                                ctx.fillStyle = PAL.mushStem;
                                ctx.fillRect(gx + 7, gy - 1, 1, 2);
                                ctx.fillStyle = PAL.mushCap;
                                ctx.fillRect(gx + 6, gy - 2, 3, 1);
                                ctx.fillStyle = '#ee8866';
                                ctx.fillRect(gx + 6, gy - 2, 1, 1);
                            }
                            if (h > 0.38 && h < 0.42) {
                                ctx.fillStyle = PAL.stone1;
                                ctx.fillRect(x + Math.floor(h2 * 10), y + Math.floor(h3 * 10) + 3, 2, 2);
                                ctx.fillStyle = PAL.stone2;
                                ctx.fillRect(x + Math.floor(h2 * 10), y + Math.floor(h3 * 10) + 3, 1, 1);
                            }
                        }
                        if (h > 0.93 && h < 0.96) {
                            const dx = x + Math.floor(h2 * (TS - 4)) + 2;
                            const dy = y + Math.floor(h3 * (TS - 6)) + 2;
                            ctx.fillStyle = PAL.grassBlade1;
                            ctx.fillRect(dx, dy + 3, 1, 3);
                            ctx.fillStyle = '#ffffee';
                            ctx.fillRect(dx - 1, dy, 3, 3);
                            ctx.fillRect(dx, dy - 1, 1, 1);
                        }
                        if (h > 0.82 && h < 0.86) {
                            const lx = x + Math.floor(h2 * 10) + 2;
                            const ly = y + Math.floor(h3 * 8) + 4;
                            ctx.fillStyle = PAL.leaf1;
                            ctx.fillRect(lx, ly, 3, 2);
                            ctx.fillStyle = PAL.leaf2;
                            ctx.fillRect(lx + 1, ly, 1, 1);
                        }
                        if (h > 0.03 && h < 0.05) {
                            ctx.fillStyle = '#2a2218';
                            for (let ai = 0; ai < 4; ai++) {
                                ctx.fillRect(x + 3 + ai * 3, y + 10 + (ai % 2), 1, 1);
                            }
                        }

                        // ===== CROSS-TILE GRASS TUFTS (overlap tile boundaries) =====
                        // These decorations are placed near tile edges and may extend
                        // 1-2px beyond the tile boundary, breaking the visual grid.
                        const edgeN = fbm2(worldCX, worldCY, 28);
                        if (edgeN > 0.6) {
                            ctx.fillStyle = PAL.grassBlade2;
                            // Bottom-edge tuft (extends into tile below)
                            ctx.fillRect(x + Math.floor(h2 * 12) + 2, y + TS - 1, 1, 3);
                            ctx.fillRect(x + Math.floor(h2 * 12) + 4, y + TS - 1, 1, 2);
                        }
                        if (edgeN < 0.35) {
                            ctx.fillStyle = PAL.grassBlade1;
                            // Right-edge tuft (extends into tile right)
                            ctx.fillRect(x + TS - 1, y + Math.floor(h3 * 10) + 3, 2, 1);
                            ctx.fillRect(x + TS - 1, y + Math.floor(h3 * 10) + 5, 3, 1);
                        }
                        // Scattered noise-based micro-dots to break up flat areas
                        if (n2 > 0.55 && n2 < 0.70) {
                            ctx.fillStyle = PAL.grassDk1;
                            const dotX = x + Math.floor(n1 * 12) + 2;
                            const dotY = y + Math.floor(n2 * 10) + 3;
                            ctx.fillRect(dotX, dotY, 1, 1);
                            ctx.fillRect(dotX + 3, dotY + 2, 1, 1);
                        }
                    } else if (t === TerrainType.GrassFlower) {
                        if (h < 0.75) {
                            const colors = [PAL.flowerRed, PAL.flowerYel, PAL.flowerWht, PAL.flowerPnk, PAL.flowerOrg, PAL.flowerPrp];
                            const flowerCount = 2 + Math.floor(h * 5);
                            for (let i = 0; i < flowerCount; i++) {
                                const fh = tileHash(c * 31 + i, r * 17 + i);
                                const fh2 = tileHash(c + i * 7, r + i * 13);
                                ctx.fillStyle = pickPal(colors, fh);
                                const fx = x + 2 + Math.floor(fh * (TS - 5));
                                const fy = y + 2 + Math.floor(fh2 * (TS - 5));
                                if (fh < 0.5) {
                                    ctx.fillRect(fx, fy, 2, 2);
                                    ctx.fillRect(fx - 1, fy + 1, 1, 1);
                                    ctx.fillRect(fx + 2, fy, 1, 1);
                                    ctx.fillRect(fx + 1, fy - 1, 1, 1);
                                    ctx.fillRect(fx, fy + 2, 1, 1);
                                    ctx.fillStyle = PAL.flowerCenter;
                                    ctx.fillRect(fx, fy, 1, 1);
                                } else {
                                    ctx.fillRect(fx, fy, 3, 1);
                                    ctx.fillRect(fx + 1, fy - 1, 1, 3);
                                    ctx.fillStyle = PAL.flowerCenter;
                                    ctx.fillRect(fx + 1, fy, 1, 1);
                                }
                                ctx.fillStyle = PAL.stem;
                                ctx.fillRect(fx + 1, fy + 2, 1, 2);
                            }
                            if (h < 0.04) {
                                ctx.fillStyle = '#ff88dd';
                                ctx.fillRect(x + 8, y + 3, 2, 1);
                                ctx.fillRect(x + 6, y + 2, 2, 1);
                                ctx.fillRect(x + 10, y + 2, 2, 1);
                            }
                        }
                    } else if (t === TerrainType.GrassLight) {
                        if (h < 0.5) {
                            const fx = x + Math.floor(h * (TS - 5));
                            const fy = y + Math.floor(h2 * (TS - 5));
                            ctx.fillStyle = PAL.grassLt1;
                            ctx.fillRect(fx, fy, 1, 5);
                            ctx.fillRect(fx + 3, fy + 1, 1, 4);
                            ctx.fillStyle = PAL.grassBladeTip;
                            ctx.fillRect(fx, fy, 1, 1);
                            ctx.fillRect(fx + 3, fy + 1, 1, 1);
                            if (h < 0.08) {
                                ctx.fillStyle = '#b0dcff';
                                ctx.fillRect(fx + 1, fy + 2, 1, 1);
                            }
                        }
                    } else if (t === TerrainType.GrassDark) {
                        if (h < 0.4) {
                            const px = x + 3 + Math.floor(h * (TS - 7));
                            const py = y + 3 + Math.floor(h2 * (TS - 7));
                            ctx.fillStyle = PAL.stone3;
                            ctx.fillRect(px, py, 3, 2);
                            ctx.fillStyle = PAL.stone1;
                            ctx.fillRect(px, py, 3, 1);
                            if (h < 0.2) {
                                ctx.fillStyle = PAL.grassDk1;
                                ctx.fillRect(px + 4, py + 1, 2, 2);
                                ctx.fillRect(px - 1, py + 2, 2, 1);
                            }
                            if (h < 0.12) {
                                ctx.fillStyle = '#3a4a28';
                                ctx.fillRect(px - 2, py + 3, 5, 1);
                            }
                        }
                    } else if (t === TerrainType.Rock) {
                        // Scattered rock cracks and highlights (avoiding borders)
                        if (h < 0.6) {
                            ctx.fillStyle = PAL.rockCrack;
                            if (h < 0.3) {
                                ctx.fillRect(x + 2 + Math.floor(h * 8), y + 2, 1, Math.floor(h2 * 8) + 4);
                            } else {
                                ctx.fillRect(x + 2, y + 2 + Math.floor(h * 8), Math.floor(h2 * 8) + 4, 1);
                            }
                            if (h < 0.2) {
                                ctx.fillStyle = PAL.rockHi;
                                ctx.fillRect(x + 4, y + 3, 4, 3);
                                ctx.fillStyle = '#888884';
                                ctx.fillRect(x + 4, y + 3, 4, 1);
                            }
                        }
                        if (h > 0.7 && h < 0.82) {
                            ctx.fillStyle = PAL.rockMoss;
                            ctx.fillRect(x + Math.floor(h2 * 8), y + Math.floor(h3 * 8) + 4, 3, 2);
                        }
                        // ===== CROSS-TILE ROCK DECORATIONS (overlap boundaries) =====
                        const edgeN = fbm2(worldCX, worldCY, 28);
                        if (edgeN > 0.75) {
                            ctx.fillStyle = PAL.rockCrack;
                            ctx.fillRect(x + Math.floor(h2 * 12) + 2, y + TS - 1, 2, 3);
                        }
                        if (edgeN < 0.25) {
                            ctx.fillStyle = PAL.rockHi;
                            ctx.fillRect(x + TS - 1, y + Math.floor(h3 * 10) + 3, 3, 2);
                        }
                    } else if (t === TerrainType.Dirt) {
                        if (h < 0.35) {
                            ctx.fillStyle = PAL.dirt3;
                            ctx.fillRect(x + Math.floor(h * TS), y + Math.floor(h2 * TS), 2, 1);
                            ctx.fillRect(x + Math.floor(h3 * TS), y + Math.floor(h * TS), 1, 2);
                        }
                        if (h > 0.88 && h < 0.92) {
                            ctx.fillStyle = PAL.dirtDk1;
                            ctx.fillRect(x + 2, y + 5, 1, 3);
                            ctx.fillRect(x + 3, y + 7, 1, 2);
                            ctx.fillRect(x + 4, y + 8, 2, 1);
                        }
                        if (h > 0.6 && h < 0.64) {
                            ctx.fillStyle = PAL.twig;
                            ctx.fillRect(x + 4, y + 8, 6, 1);
                            ctx.fillRect(x + 8, y + 7, 1, 2);
                        }
                    } else if (t === TerrainType.DirtDark) {
                        if (h < 0.25) {
                            ctx.fillStyle = PAL.dirtWet;
                            ctx.fillRect(x + Math.floor(h * (TS - 4)), y + Math.floor(h2 * (TS - 4)), 3, 2);
                        }
                        if (h > 0.7 && h < 0.8) {
                            ctx.fillStyle = '#5a6a78';
                            ctx.fillRect(x + 5, y + 5, 1, 1);
                            ctx.fillRect(x + 7, y + 6, 1, 1);
                            ctx.fillRect(x + 4, y + 7, 1, 1);
                        }
                    } else if (t === TerrainType.Sand) {
                        if (h < 0.4) {
                            const rippleY = y + 3 + Math.floor(h * 8);
                            ctx.fillStyle = PAL.sandHi;
                            ctx.fillRect(x + 1, rippleY, TS - 2, 1);
                            ctx.fillStyle = PAL.sandSh;
                            ctx.fillRect(x + 1, rippleY + 1, TS - 2, 1);
                        }
                        if (h > 0.3 && h < 0.55) {
                            const rippleY2 = y + 8 + Math.floor(h2 * 5);
                            ctx.fillStyle = PAL.sandHi;
                            ctx.fillRect(x + 2, rippleY2, TS - 4, 1);
                            ctx.fillStyle = PAL.sandSh;
                            ctx.fillRect(x + 2, rippleY2 + 1, TS - 4, 1);
                        }
                        if (h > 0.8) {
                            ctx.fillStyle = PAL.sandHi;
                            ctx.fillRect(x + Math.floor(h2 * 10), y + Math.floor(h3 * 10), 2, 1);
                        }
                    } else if (t === TerrainType.Bridge) {
                        ctx.fillStyle = PAL.bridge1;
                        for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4 + 1, TS, 1);
                        ctx.fillStyle = PAL.bridgeHi;
                        for (let i = 0; i < 4; i++) ctx.fillRect(x + 1, y + i * 4, TS - 2, 1);
                        ctx.fillStyle = PAL.bridgeNail;
                        ctx.fillRect(x + 2, y + 3, 1, 1);
                        ctx.fillRect(x + TS - 3, y + 3, 1, 1);
                        ctx.fillRect(x + 2, y + 11, 1, 1);
                        ctx.fillRect(x + TS - 3, y + 11, 1, 1);
                        const isWaterLeft = c > 0 && this.terrain[r][c - 1] === TerrainType.Water;
                        const isWaterRight = c < this.cols - 1 && this.terrain[r][c + 1] === TerrainType.Water;
                        if (isWaterLeft) {
                            ctx.fillStyle = PAL.bridge1;
                            ctx.fillRect(x, y, 2, TS);
                            ctx.fillStyle = PAL.bridge2;
                            ctx.fillRect(x, y, 1, TS);
                        }
                        if (isWaterRight) {
                            ctx.fillStyle = PAL.bridge1;
                            ctx.fillRect(x + TS - 2, y, 2, TS);
                            ctx.fillStyle = PAL.rockCrack;
                            ctx.fillRect(x + TS - 1, y, 1, TS);
                        }
                    } else if (t === TerrainType.Water) {
                        if (h < 0.15) {
                            ctx.fillStyle = PAL.waterCaustic;
                            ctx.fillRect(x + Math.floor(h2 * 8), y + Math.floor(h3 * 8), 3, 2);
                        }
                        const landAbove = r > 0 && this.terrain[r - 1][c] !== TerrainType.Water;
                        const landBelow = r < this.rows - 1 && this.terrain[r + 1][c] !== TerrainType.Water;
                        const landLeft = c > 0 && this.terrain[r][c - 1] !== TerrainType.Water;
                        const landRight = c < this.cols - 1 && this.terrain[r][c + 1] !== TerrainType.Water;
                        ctx.fillStyle = PAL.waterFoam;
                        if (landAbove) {
                            for (let fi = 0; fi < 4; fi++) {
                                const fh = tileHash(c * 3 + fi, r * 5);
                                ctx.fillRect(x + Math.floor(fh * (TS - 2)), y + Math.floor(fh * 2), 2, 1);
                            }
                        }
                        if (landBelow) {
                            for (let fi = 0; fi < 3; fi++) {
                                const fh = tileHash(c * 5 + fi, r * 7);
                                ctx.fillRect(x + Math.floor(fh * (TS - 2)), y + TS - 2, 2, 1);
                            }
                        }
                        if (landLeft) {
                            for (let fi = 0; fi < 3; fi++) {
                                const fh = tileHash(c * 9 + fi, r * 3);
                                ctx.fillRect(x, y + Math.floor(fh * (TS - 2)), 1, 2);
                            }
                        }
                        if (landRight) {
                            for (let fi = 0; fi < 3; fi++) {
                                const fh = tileHash(c * 11 + fi, r * 13);
                                ctx.fillRect(x + TS - 1, y + Math.floor(fh * (TS - 2)), 1, 2);
                            }
                        }
                        if (h > 0.92 && !landAbove && !landBelow && !landLeft && !landRight) {
                            ctx.fillStyle = PAL.lilyPad;
                            ctx.fillRect(x + 6, y + 5, 5, 1);
                            ctx.fillRect(x + 5, y + 6, 7, 3);
                            ctx.fillRect(x + 6, y + 9, 5, 1);
                            ctx.fillStyle = '#3a9a38';
                            ctx.fillRect(x + 7, y + 7, 3, 1);
                            if (h > 0.96) {
                                ctx.fillStyle = PAL.lilyFlower;
                                ctx.fillRect(x + 7, y + 6, 2, 2);
                                ctx.fillStyle = PAL.flowerCenter;
                                ctx.fillRect(x + 8, y + 7, 1, 1);
                            }
                        }
                    }

                    // ===== WATER EDGE SHADOWS (crisp strips) =====
                    if (t !== TerrainType.Water) {
                        const wAbove = r > 0 && this.terrain[r - 1][c] === TerrainType.Water;
                        const wBelow = r < this.rows - 1 && this.terrain[r + 1][c] === TerrainType.Water;
                        const wLeft = c > 0 && this.terrain[r][c - 1] === TerrainType.Water;
                        const wRight = c < this.cols - 1 && this.terrain[r][c + 1] === TerrainType.Water;
                        if (wAbove) {
                            ctx.fillStyle = '#00000030';
                            ctx.fillRect(x, y, TS, 3);
                            ctx.fillStyle = '#00000012';
                            ctx.fillRect(x, y + 3, TS, 2);
                        }
                        if (wBelow) {
                            ctx.fillStyle = '#ffffff0a';
                            ctx.fillRect(x, y + TS - 4, TS, 1);
                            ctx.fillStyle = '#00000018';
                            ctx.fillRect(x, y + TS - 3, TS, 3);
                        }
                        if (wLeft) {
                            ctx.fillStyle = '#00000024';
                            ctx.fillRect(x, y, 3, TS);
                        }
                        if (wRight) {
                            ctx.fillStyle = '#00000012';
                            ctx.fillRect(x + TS - 3, y, 3, TS);
                        }
                    }

                    // ===== Rock/cliff pixel edges =====
                    if (t === TerrainType.Rock) {
                        const rAbove = r > 0 ? this.terrain[r - 1][c] : TerrainType.Water;
                        const rBelow = r < this.rows - 1 ? this.terrain[r + 1][c] : TerrainType.Water;
                        const rLeft = c > 0 ? this.terrain[r][c - 1] : TerrainType.Water;
                        if (rAbove !== TerrainType.Rock) {
                            ctx.fillStyle = PAL.rockHi;
                            ctx.fillRect(x, y, TS, 2);
                        }
                        if (rBelow !== TerrainType.Rock) {
                            ctx.fillStyle = PAL.rockCrack;
                            ctx.fillRect(x, y + TS - 2, TS, 2);
                        }
                        if (rLeft !== TerrainType.Rock) {
                            ctx.fillStyle = '#6a6a66';
                            ctx.fillRect(x, y, 2, TS);
                        }
                    }

                    // ===== Sand transition (Removed — replaced by organic layered overlap) =====
                    }
                }
                const layerIndex = terrainLayers.indexOf(layerTypes);
                const layerProgress = (layerIndex / terrainLayers.length) * 100;
                const chunkProgress = ((chunkEnd / this.rows) / terrainLayers.length) * 100;
                onProgress(layerProgress + chunkProgress);
                await new Promise(r => setTimeout(r, 0));
            }
        }
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
        if (!(col >= 0 && col < this.cols && row >= 0 && row < this.rows)) return false;
        if (this.terrain[row][col] === TerrainType.Water) return false;
        return !this.occupied[row][col];
    }

    /** Checks water + buildings + resources. Units cannot walk through any solid object. Used for pathfinding. */
    isWalkable(col: number, row: number): boolean {
        // NaN safety: inverted check catches NaN (NaN fails >= 0)
        if (!(col >= 0 && col < this.cols && row >= 0 && row < this.rows)) return false;
        if (this.terrain[row][col] === TerrainType.Water) return false;
        return !this.occupied[row][col];
    }

    getTerrainAt(col: number, row: number): TerrainType {
        // NaN safety: NaN passes normal comparison guards, so check explicitly
        if (!(col >= 0 && col < this.cols && row >= 0 && row < this.rows)) return TerrainType.Water;
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
                if (!(c >= 0 && c < this.cols && r >= 0 && r < this.rows)) return false;
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
    // FPS FIX: Global per-frame A* budget to prevent mass pathfinding spikes
    private _pathBudgetFull = 0;
    private _pathBudgetChase = 0;
    private static readonly MAX_PATHS_PER_FRAME = 5;     // full A* (15k iter)
    private static readonly MAX_CHASE_PER_FRAME = 8;     // chase A* (3k iter)

    /** Reset A* budgets — call once per frame from EntityManager.update */
    resetPathBudget(): void {
        this._pathBudgetFull = 0;
        this._pathBudgetChase = 0;
    }

    findPath(sc: number, sr: number, ec: number, er: number): [number, number][] | null {
        if (this._pathBudgetFull >= TileMap.MAX_PATHS_PER_FRAME) return null;
        this._pathBudgetFull++;
        return findPathA(this, sc, sr, ec, er);
    }

    /** Chase-optimized A*: lower iteration limit (3000), returns null on failure (no partial paths).
     *  Used during combat chasing — if this returns null, the target is likely unreachable
     *  and the unit should look for blocking walls to attack. */
    findPathForChase(sc: number, sr: number, ec: number, er: number): [number, number][] | null {
        if (this._pathBudgetChase >= TileMap.MAX_CHASE_PER_FRAME) return null;
        this._pathBudgetChase++;
        return findPathA(this, sc, sr, ec, er, 3000, false);
    }

    // ---- Render (uses cached offscreen canvas — single drawImage call) ----
    render(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        if (this.terrainDirty) {
            // Cannot synchronously block here anymore. Relying on async init.
        }

        // Fill background beyond map edges so no dark bar appears
        const mapPxW = this.cols * TILE_SIZE;
        const mapPxH = this.rows * TILE_SIZE;
        ctx.fillStyle = '#2a3a2a';
        // Right edge
        if (camX + vpW > mapPxW) {
            ctx.fillRect(mapPxW, camY, (camX + vpW) - mapPxW, vpH);
        }
        // Bottom edge
        if (camY + vpH > mapPxH) {
            ctx.fillRect(camX, mapPxH, vpW, (camY + vpH) - mapPxH);
        }

        if (this.terrainCanvas) {
            // Source rect = viewport area on the terrain canvas (scaled for iOS)
            const s = this.terrainScale;
            const sx = Math.max(0, Math.floor(camX * s));
            const sy = Math.max(0, Math.floor(camY * s));
            const sw = Math.min(Math.ceil(vpW * s) + 2, Math.round(this.cols * TILE_SIZE * s) - sx);
            const sh = Math.min(Math.ceil(vpH * s) + 2, Math.round(this.rows * TILE_SIZE * s) - sy);
            // Destination = full resolution world coords
            const dx = Math.max(0, Math.floor(camX));
            const dy = Math.max(0, Math.floor(camY));
            const dw = Math.min(vpW + 2, this.cols * TILE_SIZE - dx);
            const dh = Math.min(vpH + 2, this.rows * TILE_SIZE - dy);
            if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
                ctx.drawImage(this.terrainCanvas as any, sx, sy, sw, sh, dx, dy, dw, dh);
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
