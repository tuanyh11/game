// ============================================================
//  MapGenerator — Procedural terrain generation
//  Extracted from TileMap.ts
// ============================================================

import { MAP_COLS, MAP_ROWS, TerrainType } from "../config/GameConfig";

export type TerrainGrid = TerrainType[][];

// ---- Simple noise ----
export function noise2d(x: number, y: number, rng: () => number): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const hash = (a: number, b: number) => {
        let h = (a * 2654435761 + b * 2246822519) & 0x7fffffff;
        h = ((h >> 16) ^ h) * 0x45d9f3b; h = ((h >> 16) ^ h) * 0x45d9f3b;
        return (h & 0x7fffffff) / 0x7fffffff;
    };
    const v00 = hash(ix, iy), v10 = hash(ix + 1, iy);
    const v01 = hash(ix, iy + 1), v11 = hash(ix + 1, iy + 1);
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (v00 * (1 - sx) + v10 * sx) * (1 - sy) + (v01 * (1 - sx) + v11 * sx) * sy;
}

export function seededRng(seed: number): () => number {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

// ---- Shared: add natural terrain edges around water ----
export function addTerrainEdges(terrain: TerrainGrid, rows: number, cols: number): void {
    // Pass 1: Sand immediately next to water
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (terrain[r][c] !== TerrainType.Water && terrain[r][c] !== TerrainType.Bridge) {
                const neighbors = [
                    terrain[r - 1][c], terrain[r + 1][c],
                    terrain[r][c - 1], terrain[r][c + 1],
                ];
                if (neighbors.includes(TerrainType.Water)) {
                    terrain[r][c] = TerrainType.Sand;
                }
            }
        }
    }
    // Pass 2: Dirt just beyond sand (2-tile transition)
    for (let r = 2; r < rows - 2; r++) {
        for (let c = 2; c < cols - 2; c++) {
            if (terrain[r][c] !== TerrainType.Water && terrain[r][c] !== TerrainType.Sand && terrain[r][c] !== TerrainType.Bridge) {
                const neighbors8 = [
                    terrain[r - 1][c], terrain[r + 1][c],
                    terrain[r][c - 1], terrain[r][c + 1],
                    terrain[r - 1][c - 1], terrain[r - 1][c + 1],
                    terrain[r + 1][c - 1], terrain[r + 1][c + 1],
                ];
                if (neighbors8.includes(TerrainType.Sand)) {
                    terrain[r][c] = TerrainType.Dirt;
                }
            }
        }
    }
}

// ---- Procedural map generation ----
export function generateTerrain(terrain: TerrainGrid, rows: number, cols: number, preset: string): void {
    switch (preset) {
        case 'grasslands': genGrasslands(terrain, rows, cols); break;
        case 'islands': genIslands(terrain, rows, cols); break;
        case 'desert': genDesert(terrain, rows, cols); break;
        case 'highland': genHighland(terrain, rows, cols); break;
        case 'tundra': genTundra(terrain, rows, cols); break;
        case 'swamp': genSwamp(terrain, rows, cols); break;
        case 'volcanic': genVolcanic(terrain, rows, cols); break;
    }
}

// ==== MAP 1: Grasslands ====
function genGrasslands(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(42);

    // Multi-layered noise for diverse terrain
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            // Layer 1: Large-scale biome zones
            const biome = noise2d(nx * 3, ny * 3, rng);
            // Layer 2: Medium-detail variation
            const detail = noise2d(nx * 8 + 5, ny * 8 + 5, rng);
            // Layer 3: Fine noise for scattered features
            const fine = noise2d(nx * 15 + 10, ny * 15 + 10, rng);

            let tile: TerrainType;
            if (biome > 0.7) {
                // Dark forest zone
                tile = detail > 0.5 ? TerrainType.GrassDark : TerrainType.Grass;
            } else if (biome > 0.55) {
                // Mixed woodland
                tile = detail > 0.6 ? TerrainType.GrassDark : TerrainType.Grass;
                if (fine > 0.75) tile = TerrainType.Dirt; // forest paths
            } else if (biome > 0.4) {
                // Standard grassland
                tile = TerrainType.Grass;
                if (detail > 0.7) tile = TerrainType.GrassLight; // bright meadow patches
                if (fine > 0.82) tile = TerrainType.GrassFlower; // wildflowers
            } else if (biome > 0.25) {
                // Light meadow zone
                tile = detail > 0.5 ? TerrainType.GrassLight : TerrainType.Grass;
                if (fine > 0.8) tile = TerrainType.GrassFlower;
            } else if (biome > 0.15) {
                // Dirt/rocky transition zone
                if (detail > 0.6) tile = TerrainType.Dirt;
                else if (detail > 0.4) tile = TerrainType.Grass;
                else tile = TerrainType.GrassDark;
                if (fine > 0.85) tile = TerrainType.Rock;
            } else {
                // Rocky outcrops
                tile = detail > 0.5 ? TerrainType.Rock : TerrainType.Dirt;
                if (fine > 0.7) tile = TerrainType.DirtDark;
            }
            terrain[r][c] = tile;
        }
    }

    // Procedural Ponds
    const numPonds = Math.floor((cols * rows) / 15000);
    for (let p = 0; p < numPonds; p++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 8 + Math.floor(rng() * 5);
        for (let r = cy - radius; r <= cy + radius; r++) {
            for (let c = cx - radius; c <= cx + radius; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + (rng() - 0.5) * 2) {
                    terrain[r][c] = TerrainType.Water;
                }
            }
        }
    }

    // Sand + dirt edges around water
    addTerrainEdges(terrain, rows, cols);
}

// ==== MAP 2: Islands ====
function genIslands(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(88);
    // Rich base terrain
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            const v = noise2d(nx * 4, ny * 4, rng);
            const detail = noise2d(nx * 10 + 3, ny * 10 + 3, rng);
            if (v > 0.65) {
                terrain[r][c] = detail > 0.6 ? TerrainType.GrassDark : TerrainType.Grass;
            } else if (v > 0.45) {
                terrain[r][c] = detail > 0.7 ? TerrainType.GrassLight : TerrainType.Grass;
                if (detail > 0.8) terrain[r][c] = TerrainType.GrassFlower;
            } else if (v > 0.3) {
                terrain[r][c] = TerrainType.GrassLight;
            } else {
                terrain[r][c] = detail > 0.5 ? TerrainType.Dirt : TerrainType.Grass;
                if (detail > 0.8) terrain[r][c] = TerrainType.Rock;
            }
        }
    }
    // Procedural large lakes
    const numLakes = Math.floor((cols * rows) / 12000);
    for (let l = 0; l < numLakes; l++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 12 + Math.floor(rng() * 12);
        for (let r = cy - radius; r <= cy + radius; r++) {
            for (let c = cx - radius; c <= cx + radius; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + (rng() - 0.5) * 3) {
                    terrain[r][c] = TerrainType.Water;
                }
            }
        }
    }
    addTerrainEdges(terrain, rows, cols);
}

// ==== MAP 3: Desert ====
function genDesert(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(123);
    // Rich desert base with sand, dirt, rock
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            const v = noise2d(nx * 5, ny * 5, rng);
            const detail = noise2d(nx * 12 + 7, ny * 12 + 7, rng);
            const fine = noise2d(nx * 20 + 13, ny * 20 + 13, rng);
            if (v > 0.65) {
                // Rocky desert
                terrain[r][c] = detail > 0.6 ? TerrainType.Rock : TerrainType.DirtDark;
                if (fine > 0.8) terrain[r][c] = TerrainType.Dirt;
            } else if (v > 0.45) {
                // Sandy dunes
                terrain[r][c] = TerrainType.Sand;
                if (detail > 0.7) terrain[r][c] = TerrainType.Dirt;
            } else if (v > 0.3) {
                // Mixed sand/dirt
                terrain[r][c] = detail > 0.5 ? TerrainType.Sand : TerrainType.Dirt;
                if (fine > 0.85) terrain[r][c] = TerrainType.Rock;
            } else if (v > 0.18) {
                // Sparse vegetation
                terrain[r][c] = detail > 0.6 ? TerrainType.GrassDark : TerrainType.Grass;
            } else {
                // Dried earth
                terrain[r][c] = detail > 0.5 ? TerrainType.DirtDark : TerrainType.Dirt;
            }
        }
    }
    // Small oasis ponds
    const numOases = Math.floor((cols * rows) / 20000);
    for (let o = 0; o < numOases; o++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 5 + Math.floor(rng() * 3);
        // Lush green around oasis, then grass light, then normal
        for (let r = cy - radius - 5; r <= cy + radius + 5; r++) {
            for (let c = cx - radius - 5; c <= cx + radius + 5; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + 5) terrain[r][c] = TerrainType.GrassLight;
                if (dist <= radius + 3) terrain[r][c] = TerrainType.Grass;
                if (dist <= radius + 1) terrain[r][c] = TerrainType.GrassFlower;
                if (dist <= radius) terrain[r][c] = TerrainType.Water;
            }
        }
    }
    addTerrainEdges(terrain, rows, cols);
}

// ==== MAP 4: Highland ====
function genHighland(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(256);
    // Rich highland base with rock, dark grass, dirt
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            const v = noise2d(nx * 6, ny * 6, rng);
            const detail = noise2d(nx * 10 + 4, ny * 10 + 4, rng);
            const fine = noise2d(nx * 18 + 9, ny * 18 + 9, rng);
            if (v > 0.65) {
                // Mountain peaks — rock and dark dirt
                terrain[r][c] = detail > 0.5 ? TerrainType.Rock : TerrainType.DirtDark;
            } else if (v > 0.5) {
                // Mountain slopes
                terrain[r][c] = detail > 0.6 ? TerrainType.Rock : TerrainType.GrassDark;
                if (fine > 0.8) terrain[r][c] = TerrainType.Dirt;
            } else if (v > 0.35) {
                // Highland valleys
                terrain[r][c] = detail > 0.6 ? TerrainType.GrassDark : TerrainType.Grass;
                if (fine > 0.75) terrain[r][c] = TerrainType.Dirt;
            } else if (v > 0.2) {
                // Green valleys
                terrain[r][c] = detail > 0.5 ? TerrainType.Grass : TerrainType.GrassLight;
                if (fine > 0.85) terrain[r][c] = TerrainType.GrassFlower;
            } else {
                // Low meadows
                terrain[r][c] = detail > 0.5 ? TerrainType.GrassLight : TerrainType.Grass;
            }
        }
    }
    // Rivers (diagonal water strips) scaled correctly
    // Define crossing gaps to allow movement
    const crossingGaps: [number, number, number][] = [
        [0, 0.42, 0.58], [1, 0.40, 0.53], [2, 0.40, 0.55],
        [0, 0.15, 0.25], [0, 0.75, 0.85], [1, 0.18, 0.28],
        [1, 0.72, 0.82], [2, 0.18, 0.28], [2, 0.72, 0.82],
    ];
    const rivers = [
        { sx: 0, sy: Math.floor(rows * 0.25), ex: cols, ey: Math.floor(rows * 0.65), width: 5 },
        { sx: Math.floor(cols * 0.3), sy: 0, ex: Math.floor(cols * 0.8), ey: rows, width: 3 },
        { sx: Math.floor(cols * 0.66), sy: 0, ex: Math.floor(cols * 0.33), ey: rows, width: 3 },
    ];
    for (let ri = 0; ri < rivers.length; ri++) {
        const river = rivers[ri];
        const riverLen = Math.max(cols, rows);
        for (let t = 0; t <= riverLen; t++) {
            const frac = t / riverLen;
            let inGap = false;
            for (const [gapRiver, gapStart, gapEnd] of crossingGaps) {
                if (gapRiver === ri && frac >= gapStart && frac <= gapEnd) {
                    inGap = true; break;
                }
            }
            if (inGap) continue;
            const cx = river.sx + (river.ex - river.sx) * frac + (rng() - 0.5) * 8;
            const cy = river.sy + (river.ey - river.sy) * frac + (rng() - 0.5) * 8;
            for (let dr = -river.width; dr <= river.width; dr++) {
                for (let dc = -river.width; dc <= river.width; dc++) {
                    const r = Math.floor(cy + dr), c = Math.floor(cx + dc);
                    if (r >= 0 && r < rows && c >= 0 && c < cols) {
                        terrain[r][c] = TerrainType.Water;
                    }
                }
            }
        }
    }
    // Procedural Mountain cliffs
    const numCliffs = Math.floor((cols * rows) / 25000);
    for (let cl = 0; cl < numCliffs; cl++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 6 + Math.floor(rng() * 4);
        for (let r = cy - radius; r <= cy + radius; r++) {
            for (let c = cx - radius; c <= cx + radius; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + (rng() - 0.5) * 2) {
                    terrain[r][c] = TerrainType.Water;
                }
            }
        }
    }
    addTerrainEdges(terrain, rows, cols);
}

// ==== MAP 5: Tundra ====
function genTundra(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(77);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            const biome = noise2d(nx * 4, ny * 4, rng);
            const detail = noise2d(nx * 10 + 3, ny * 10 + 3, rng);
            const fine = noise2d(nx * 20 + 7, ny * 20 + 7, rng);
            let tile: TerrainType;
            if (biome > 0.65) {
                tile = detail > 0.5 ? TerrainType.DirtDark : TerrainType.Dirt;
                if (fine > 0.8) tile = TerrainType.Rock;
            } else if (biome > 0.45) {
                tile = detail > 0.55 ? TerrainType.GrassLight : TerrainType.Grass;
                if (fine > 0.85) tile = TerrainType.GrassDark;
            } else if (biome > 0.3) {
                tile = TerrainType.GrassDark;
                if (detail > 0.6) tile = TerrainType.Dirt;
                if (fine > 0.8) tile = TerrainType.Rock;
            } else if (biome > 0.15) {
                tile = detail > 0.5 ? TerrainType.Rock : TerrainType.DirtDark;
            } else {
                tile = TerrainType.Rock;
                if (detail > 0.6) tile = TerrainType.DirtDark;
            }
            terrain[r][c] = tile;
        }
    }
    const numLakes = Math.floor((cols * rows) / 20000);
    for (let l = 0; l < numLakes; l++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 10 + Math.floor(rng() * 8);
        for (let r = cy - radius; r <= cy + radius; r++) {
            for (let c = cx - radius; c <= cx + radius; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + (rng() - 0.5) * 3) {
                    terrain[r][c] = TerrainType.Water;
                }
            }
        }
    }
    addTerrainEdges(terrain, rows, cols);
}

// ==== MAP 6: Swamp ====
function genSwamp(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(103);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            const biome = noise2d(nx * 5, ny * 5, rng);
            const detail = noise2d(nx * 12 + 2, ny * 12 + 2, rng);
            const fine = noise2d(nx * 25 + 8, ny * 25 + 8, rng);
            let tile: TerrainType;
            if (biome > 0.6) {
                tile = TerrainType.GrassDark;
                if (detail > 0.7) tile = TerrainType.Grass;
                if (fine > 0.85) tile = TerrainType.DirtDark;
            } else if (biome > 0.4) {
                tile = detail > 0.55 ? TerrainType.Grass : TerrainType.GrassDark;
                if (fine > 0.75) tile = TerrainType.Dirt;
                if (fine > 0.9) tile = TerrainType.DirtDark;
            } else if (biome > 0.25) {
                tile = TerrainType.Dirt;
                if (detail > 0.6) tile = TerrainType.DirtDark;
                if (fine > 0.8) tile = TerrainType.GrassDark;
            } else {
                tile = TerrainType.DirtDark;
                if (detail > 0.5) tile = TerrainType.Dirt;
            }
            terrain[r][c] = tile;
        }
    }
    // Many scattered small water pools
    for (let i = 0; i < 40; i++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 3 + Math.floor(rng() * 8);
        for (let r = cy - radius; r <= cy + radius; r++) {
            for (let c = cx - radius; c <= cx + radius; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + (rng() - 0.5) * 3) {
                    terrain[r][c] = TerrainType.Water;
                }
            }
        }
    }
    // Meandering river
    const riverLen = Math.max(cols, rows);
    for (let t = 0; t <= riverLen; t++) {
        const frac = t / riverLen;
        const cx = Math.floor(cols * 0.1) + frac * Math.floor(cols * 0.8) + Math.sin(frac * Math.PI * 4) * 40 + (rng() - 0.5) * 6;
        const cy = frac * rows + (rng() - 0.5) * 6;
        const w = 2 + Math.sin(frac * Math.PI * 3) * 1;
        for (let dr = -w; dr <= w; dr++) {
            for (let dc = -w; dc <= w; dc++) {
                const rr = Math.floor(cy + dr), cc = Math.floor(cx + dc);
                if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
                    terrain[rr][cc] = TerrainType.Water;
                }
            }
        }
    }
    addTerrainEdges(terrain, rows, cols);
}

// ==== MAP 7: Volcanic ====
function genVolcanic(terrain: TerrainGrid, rows: number, cols: number): void {
    const rng = seededRng(199);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nx = c / cols, ny = r / rows;
            const biome = noise2d(nx * 4 + 1, ny * 4 + 1, rng);
            const detail = noise2d(nx * 9 + 4, ny * 9 + 4, rng);
            const fine = noise2d(nx * 18 + 9, ny * 18 + 9, rng);
            let tile: TerrainType;
            if (biome > 0.7) {
                tile = TerrainType.Rock;
                if (detail > 0.6) tile = TerrainType.DirtDark;
            } else if (biome > 0.5) {
                tile = detail > 0.5 ? TerrainType.DirtDark : TerrainType.Rock;
                if (fine > 0.85) tile = TerrainType.Dirt;
            } else if (biome > 0.35) {
                tile = TerrainType.Dirt;
                if (detail > 0.6) tile = TerrainType.DirtDark;
                if (fine > 0.8) tile = TerrainType.Rock;
            } else if (biome > 0.2) {
                tile = detail > 0.55 ? TerrainType.GrassDark : TerrainType.Dirt;
                if (fine > 0.85) tile = TerrainType.Grass;
            } else {
                tile = TerrainType.GrassDark;
                if (detail > 0.5) tile = TerrainType.Grass;
                if (fine > 0.8) tile = TerrainType.Dirt;
            }
            terrain[r][c] = tile;
        }
    }
    // Volcanic craters
    const numCraters = Math.floor((cols * rows) / 25000);
    const cratersList: { cx: number, cy: number, radius: number }[] = [];
    for (let cr = 0; cr < numCraters; cr++) {
        const cx = Math.floor(rng() * cols);
        const cy = Math.floor(rng() * rows);
        const radius = 9 + Math.floor(rng() * 11);
        cratersList.push({ cx, cy, radius });
        for (let r = cy - radius - 4; r <= cy + radius + 4; r++) {
            for (let c = cx - radius - 4; c <= cx + radius + 4; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + 4 && dist > radius) {
                    terrain[r][c] = TerrainType.Rock;
                }
            }
        }
        for (let r = cy - radius; r <= cy + radius; r++) {
            for (let c = cx - radius; c <= cx + radius; c++) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
                if (dist <= radius + (rng() - 0.5) * 2) {
                    terrain[r][c] = TerrainType.Water;
                }
            }
        }
    }
    // Lava rivers connecting craters to center
    const centerCol = Math.floor(cols / 2), centerRow = Math.floor(rows / 2);
    for (const crater of cratersList) {
        // 50% chance to have a connecting river
        if (rng() > 0.5) continue;
        const riverLen = Math.max(cols, rows) / 2;
        for (let t = 0; t <= riverLen; t++) {
            const frac = t / riverLen;
            const rcx = centerCol + (crater.cx - centerCol) * frac + (rng() - 0.5) * 4;
            const rcy = centerRow + (crater.cy - centerRow) * frac + (rng() - 0.5) * 4;
            const width = 2;
            for (let dr = -width; dr <= width; dr++) {
                for (let dc = -width; dc <= width; dc++) {
                    const rr = Math.floor(rcy + dr), cc = Math.floor(rcx + dc);
                    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
                        terrain[rr][cc] = TerrainType.Water;
                    }
                }
            }
        }
    }
    addTerrainEdges(terrain, rows, cols);
}
