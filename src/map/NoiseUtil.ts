// ============================================================
//  NoiseUtil — Lightweight value noise for terrain color variation
//  Uses bilinear interpolation between hash-based grid points
//  to produce smooth, continuous noise that breaks tile grids.
// ============================================================

/**
 * Integer hash — fast, deterministic pseudo-random for grid points.
 * Returns value in [0, 1).
 */
function ihash(x: number, y: number): number {
    let h = (x * 374761393 + y * 668265263 + 1013904223) & 0x7fffffff;
    h = ((h >> 13) ^ h) * 1274126177;
    h = ((h >> 16) ^ h);
    return (h & 0x7fffffff) / 0x7fffffff;
}

/** Smoothstep for interpolation (Hermite curve — avoids linear-looking artifacts) */
function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
}

/**
 * 2D value noise at world-pixel coordinates.
 * `scale` controls how many pixels per noise cell (larger = smoother).
 * Returns value in [0, 1).
 */
export function valueNoise(px: number, py: number, scale: number): number {
    const x = px / scale;
    const y = py / scale;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smoothstep(x - ix);
    const fy = smoothstep(y - iy);

    const v00 = ihash(ix, iy);
    const v10 = ihash(ix + 1, iy);
    const v01 = ihash(ix, iy + 1);
    const v11 = ihash(ix + 1, iy + 1);

    const top = v00 + (v10 - v00) * fx;
    const bot = v01 + (v11 - v01) * fx;
    return top + (bot - top) * fy;
}

/**
 * Fractal Brownian Motion — layered noise for richer variation.
 * 2 octaves is enough for terrain color (fast + sufficient detail).
 */
export function fbm2(px: number, py: number, scale: number): number {
    return valueNoise(px, py, scale) * 0.65 +
           valueNoise(px, py, scale * 0.5) * 0.35;
}

/**
 * Interpolate between two hex color strings by factor t ∈ [0,1].
 * Returns a hex color string.
 */
export function lerpColor(c1: string, c2: string, t: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
