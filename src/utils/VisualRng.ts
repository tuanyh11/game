// ============================================================
//  VisualRng — Non-seeded random for visual effects
//  Captures native Math.random at module load time, before any
//  seeded override. Use this for particle positions, visual
//  effects, and anything that shouldn't consume the seeded RNG.
// ============================================================

const _nativeRandom = Math.random;

/** Get a random float [0, 1) that doesn't consume the seeded RNG */
export function visualRng(): number {
    return _nativeRandom();
}
