// ============================================================
//  Pathfinder — A* with binary min-heap
//  Extracted from TileMap.ts
// ============================================================

import { TILE_SIZE, TerrainType } from "../config/GameConfig";

// ==== Binary Min-Heap for A* ====
class MinHeap {
    private data: { c: number; r: number; f: number }[] = [];
    private indexMap = new Map<number, number>(); // key -> heap index

    get length() { return this.data.length; }

    push(item: { c: number; r: number; f: number }, key: number) {
        this.data.push(item);
        this.indexMap.set(key, this.data.length - 1);
        this._bubbleUp(this.data.length - 1);
    }

    pop(): { c: number; r: number; f: number } {
        const top = this.data[0];
        const last = this.data.pop()!;
        const topKey = (top.r << 16) | (top.c & 0xffff);
        this.indexMap.delete(topKey);
        if (this.data.length > 0) {
            this.data[0] = last;
            const lastKey = (last.r << 16) | (last.c & 0xffff);
            this.indexMap.set(lastKey, 0);
            this._sinkDown(0);
        }
        return top;
    }

    updateKey(key: number, newF: number) {
        const idx = this.indexMap.get(key);
        if (idx === undefined) return false;
        this.data[idx].f = newF;
        this._bubbleUp(idx);
        return true;
    }

    has(key: number): boolean {
        return this.indexMap.has(key);
    }

    private _bubbleUp(i: number) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[i].f >= this.data[parent].f) break;
            this._swap(i, parent);
            i = parent;
        }
    }

    private _sinkDown(i: number) {
        const n = this.data.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.data[left].f < this.data[smallest].f) smallest = left;
            if (right < n && this.data[right].f < this.data[smallest].f) smallest = right;
            if (smallest === i) break;
            this._swap(i, smallest);
            i = smallest;
        }
    }

    private _swap(a: number, b: number) {
        const tmp = this.data[a];
        this.data[a] = this.data[b];
        this.data[b] = tmp;
        const keyA = (this.data[a].r << 16) | (this.data[a].c & 0xffff);
        const keyB = (this.data[b].r << 16) | (this.data[b].c & 0xffff);
        this.indexMap.set(keyA, a);
        this.indexMap.set(keyB, b);
    }
}

export interface PathfindGrid {
    cols: number;
    rows: number;
    terrain: TerrainType[][];
    isWalkable(col: number, row: number): boolean;
}

/** A* pathfinding using binary min-heap */
export function findPath(grid: PathfindGrid, sc: number, sr: number, ec: number, er: number): [number, number][] | null {
    if (sc === ec && sr === er) return [];

    // If START is not walkable (unit on water/building), find nearest walkable start
    if (!grid.isWalkable(sc, sr)) {
        let bestC = sc, bestR = sr, bestD = Infinity;
        let found = false;
        for (let radius = 1; radius <= 8 && !found; radius++) {
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
                    const nc = sc + dc, nr = sr + dr;
                    if (grid.isWalkable(nc, nr)) {
                        const d = Math.hypot(nc - ec, nr - er);
                        if (d < bestD) { bestD = d; bestC = nc; bestR = nr; found = true; }
                    }
                }
            }
        }
        sc = bestC; sr = bestR;
        if (!grid.isWalkable(sc, sr)) return null;
    }

    // If end is not walkable (water/building), spiral search for nearest walkable tile
    if (!grid.isWalkable(ec, er)) {
        let bestC = ec, bestR = er, bestD = Infinity;
        let found = false;
        for (let radius = 1; radius <= 10 && !found; radius++) {
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
                    const nc = ec + dc, nr = er + dr;
                    if (grid.isWalkable(nc, nr)) {
                        const d = Math.hypot(nc - sc, nr - sr);
                        if (d < bestD) { bestD = d; bestC = nc; bestR = nr; found = true; }
                    }
                }
            }
        }
        ec = bestC; er = bestR;
        if (!grid.isWalkable(ec, er)) return null;
    }

    const key = (c: number, r: number) => (r << 16) | (c & 0xffff);
    const gMap = new Map<number, number>();
    const parentMap = new Map<number, number>();
    // Chebyshev heuristic — better for 8-directional movement than Manhattan
    const heuristic = (c: number, r: number) => {
        const dx = Math.abs(c - ec), dy = Math.abs(r - er);
        return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    };

    // ===== WATER ADJACENCY PENALTY =====
    // Pre-compute tiles adjacent to water for cost penalty
    // This makes A* prefer paths 1+ tiles away from water edges
    const waterPenalty = (c: number, r: number): number => {
        // Check 4-neighbors for water
        // Don't penalize bridge tiles — they ARE the path over water
        if (grid.terrain[r][c] === TerrainType.Bridge) return 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nc = c + dc, nr = r + dr;
                if (nc < 0 || nc >= grid.cols || nr < 0 || nr >= grid.rows) continue;
                if (grid.terrain[nr][nc] === TerrainType.Water) {
                    return 3.0; // Heavy penalty for tiles adjacent to water
                }
            }
        }
        return 0;
    };

    const open = new MinHeap();
    const closedSet = new Set<number>();
    const startKey = key(sc, sr);
    gMap.set(startKey, 0);
    open.push({ c: sc, r: sr, f: heuristic(sc, sr) }, startKey);

    const dirs = [
        [0, -1], [1, 0], [0, 1], [-1, 0],
        [1, -1], [1, 1], [-1, 1], [-1, -1],
    ];

    let bestClosestKey = startKey;
    let bestClosestDist = heuristic(sc, sr);

    let iterations = 0;
    const maxIter = 50000; // Increased from 30000 for large maps
    while (open.length > 0 && iterations < maxIter) {
        iterations++;
        const cur = open.pop();
        const curKey = key(cur.c, cur.r);

        const distToEnd = heuristic(cur.c, cur.r);
        if (distToEnd < bestClosestDist) {
            bestClosestDist = distToEnd;
            bestClosestKey = curKey;
        }

        if (cur.c === ec && cur.r === er) {
            const path: [number, number][] = [];
            let k = curKey;
            while (k !== startKey) {
                const c = k & 0xffff, r = k >> 16;
                path.unshift([c, r]);
                k = parentMap.get(k)!;
            }
            return path;
        }

        closedSet.add(curKey);
        const curG = gMap.get(curKey)!;

        for (const [dc, dr] of dirs) {
            const nc = cur.c + dc, nr = cur.r + dr;
            const nk = key(nc, nr);
            if (closedSet.has(nk)) continue;
            if (!grid.isWalkable(nc, nr) && !(nc === ec && nr === er)) continue;

            if (dc !== 0 && dr !== 0) {
                if (!grid.isWalkable(cur.c + dc, cur.r) || !grid.isWalkable(cur.c, cur.r + dr)) continue;
            }

            const baseCost = (dc !== 0 && dr !== 0 ? 1.414 : 1);
            const penalty = waterPenalty(nc, nr);
            const g = curG + baseCost + penalty;
            const prevG = gMap.get(nk);
            if (prevG !== undefined && g >= prevG) continue;

            gMap.set(nk, g);
            parentMap.set(nk, curKey);
            const f = g + heuristic(nc, nr);
            if (open.has(nk)) {
                open.updateKey(nk, f);
            } else {
                open.push({ c: nc, r: nr, f }, nk);
            }
        }
    }
    if (bestClosestKey !== startKey && parentMap.has(bestClosestKey)) {
        const path: [number, number][] = [];
        let k = bestClosestKey;
        while (k !== startKey) {
            const c = k & 0xffff, r = k >> 16;
            path.unshift([c, r]);
            k = parentMap.get(k)!;
        }
        return path;
    }
    return null;
}
