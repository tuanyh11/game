// ============================================================
//  CrazyGames SDK Wrapper — Ads, Game Events, Init
//  Safe wrapper: works on CrazyGames, gracefully no-ops elsewhere
// ============================================================

declare global {
    interface Window {
        CrazyGames?: {
            SDK: {
                init: () => Promise<void>;
                ad: {
                    requestAd: (type: 'midgame' | 'rewarded', callbacks?: {
                        adStarted?: () => void;
                        adFinished?: () => void;
                        adError?: (error: string) => void;
                    }) => void;
                };
                game: {
                    gameplayStart: () => void;
                    gameplayStop: () => void;
                    loadingStart: () => void;
                    loadingStop: () => void;
                    happytime: () => void;
                };
                user: {
                    isUserAccountAvailable: boolean;
                };
            };
        };
    }
}

let sdkInitialized = false;
let sdkAvailable = false;

/** Initialize CrazyGames SDK — call once during loading screen */
export async function initCrazySDK(): Promise<void> {
    try {
        if (window.CrazyGames?.SDK) {
            await window.CrazyGames.SDK.init();
            sdkInitialized = true;
            sdkAvailable = true;
            console.log('[CrazyGames] SDK initialized successfully');
        } else {
            console.log('[CrazyGames] SDK not found — running outside CrazyGames');
        }
    } catch (e) {
        console.warn('[CrazyGames] SDK init failed:', e);
    }
}

/** Check if SDK is ready */
export function isCrazyGamesAvailable(): boolean {
    return sdkAvailable && sdkInitialized;
}

// ---- Game Events ----

/** Call when the game match actually starts (player is playing) */
export function gameplayStart(): void {
    if (!sdkAvailable) return;
    try {
        window.CrazyGames!.SDK.game.gameplayStart();
    } catch (e) { /* ignore */ }
}

/** Call when gameplay stops (pause, match end, return to menu) */
export function gameplayStop(): void {
    if (!sdkAvailable) return;
    try {
        window.CrazyGames!.SDK.game.gameplayStop();
    } catch (e) { /* ignore */ }
}

/** Call when loading starts */
export function loadingStart(): void {
    if (!sdkAvailable) return;
    try {
        window.CrazyGames!.SDK.game.loadingStart();
    } catch (e) { /* ignore */ }
}

/** Call when loading finishes */
export function loadingStop(): void {
    if (!sdkAvailable) return;
    try {
        window.CrazyGames!.SDK.game.loadingStop();
    } catch (e) { /* ignore */ }
}

/** Call on a cool in-game moment (player wins, etc.) */
export function happytime(): void {
    if (!sdkAvailable) return;
    try {
        window.CrazyGames!.SDK.game.happytime();
    } catch (e) { /* ignore */ }
}

// ---- Ads ----

/**
 * Show a midgame ad (between matches, transitions).
 * Pauses game audio/logic while showing.
 * Returns a promise that resolves when ad is done or fails.
 */
export function showMidgameAd(): Promise<boolean> {
    if (!sdkAvailable) return Promise.resolve(false);

    return new Promise((resolve) => {
        try {
            window.CrazyGames!.SDK.ad.requestAd('midgame', {
                adStarted: () => {
                    console.log('[CrazyGames] Midgame ad started');
                },
                adFinished: () => {
                    console.log('[CrazyGames] Midgame ad finished');
                    resolve(true);
                },
                adError: (error: string) => {
                    console.warn('[CrazyGames] Midgame ad error:', error);
                    resolve(false);
                },
            });
        } catch (e) {
            resolve(false);
        }
    });
}

/**
 * Show a rewarded ad (player chooses to watch for bonus).
 * Returns true if player watched the full ad, false if skipped/error.
 */
export function showRewardedAd(): Promise<boolean> {
    if (!sdkAvailable) {
        // Dev mode: simulate ad with 1s delay, always grant reward
        if (import.meta.env.DEV) {
            console.log('[CrazyGames] DEV: Simulating rewarded ad...');
            return new Promise(resolve => setTimeout(() => {
                console.log('[CrazyGames] DEV: Rewarded ad simulated — granting reward');
                resolve(true);
            }, 1000));
        }
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        try {
            window.CrazyGames!.SDK.ad.requestAd('rewarded', {
                adStarted: () => {
                    console.log('[CrazyGames] Rewarded ad started');
                },
                adFinished: () => {
                    console.log('[CrazyGames] Rewarded ad finished — grant reward');
                    resolve(true);
                },
                adError: (error: string) => {
                    console.warn('[CrazyGames] Rewarded ad error:', error);
                    resolve(false);
                },
            });
        } catch (e) {
            resolve(false);
        }
    });
}
