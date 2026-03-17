// ============================================================
//  SeededRandom — Deterministic pseudo-random number generator
//  Uses Mulberry32 algorithm for fast, reproducible sequences
//  Critical for multiplayer: same seed → same map & entities
// ============================================================

export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    /** Returns a float in [0, 1) — drop-in replacement for Math.random() */
    next(): number {
        this.state |= 0;
        this.state = (this.state + 0x6D2B79F5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Returns an integer in [min, max) */
    int(min: number, max: number): number {
        return Math.floor(this.next() * (max - min)) + min;
    }

    /** Temporarily replaces Math.random with this seeded rng, runs fn, then restores */
    static withSeed<T>(seed: number, fn: () => T): T {
        const original = Math.random;
        const rng = new SeededRandom(seed);
        Math.random = () => rng.next();
        try {
            return fn();
        } finally {
            Math.random = original;
        }
    }

    /** Async version of withSeed */
    static async withSeedAsync<T>(seed: number, fn: () => Promise<T>): Promise<T> {
        const original = Math.random;
        const rng = new SeededRandom(seed);
        Math.random = () => rng.next();
        try {
            return await fn();
        } finally {
            Math.random = original;
        }
    }
}
