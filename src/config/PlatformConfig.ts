// ============================================================
//  PlatformConfig — Mobile/Desktop detection & performance flags
//  Auto-detect platform and provide adaptive constants
// ============================================================

/** Detect if running on a mobile device */
function detectMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    // Check user agent
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
    // Check touch support + small screen (tablets with keyboards excluded)
    if ('ontouchstart' in window && window.innerWidth < 1024) return true;
    // Capacitor / Cordova
    if ((window as any).Capacitor || (window as any).cordova) return true;
    return false;
}

/** Detect if running on a low-end device (limited RAM/GPU) */
function detectLowEnd(): boolean {
    if (typeof navigator === 'undefined') return false;
    // Low device memory (Chrome API)
    if ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) return true;
    // Low logical processors
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
    // Old iOS devices (smaller canvas limits)
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad/.test(ua) && !/OS 1[5-9]|OS 2\d/.test(ua)) return true;
    return false;
}

/** Detect if running on iOS (iPhone/iPad/iPod) */
function detectIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // Standard iOS detection
    if (/iPhone|iPad|iPod/.test(ua)) return true;
    // iPad with desktop Safari UA (iPadOS 13+)
    if (/Macintosh/.test(ua) && 'ontouchstart' in window) return true;
    return false;
}

/** Detect if running on Android */
function detectAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
}

// ---- Platform Flags ----
export const IS_IOS = detectIOS();
export const IS_ANDROID = detectAndroid();
export const IS_MOBILE = detectMobile();
export const IS_LOW_END = detectLowEnd();
export const IS_TOUCH = typeof window !== 'undefined' && 'ontouchstart' in window;
export const DEVICE_PIXEL_RATIO = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

// ---- iOS-Specific Constants ----
export const IOS = {
    /** WKWebView max canvas pixels — older iPhones ~16M, newer ~67M */
    maxCanvasPixels: 16_777_216, // Safe default: 4096×4096
    /** Safe Area inset detection (notch, home indicator) */
    safeAreaTop: IS_IOS ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0') || 44 : 0,
    safeAreaBottom: IS_IOS ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0') || 34 : 0,
    /** iOS has no hover — tooltips should trigger on tap instead */
    hasHover: false,
    /** iOS WKWebView memory pressure — more aggressive cleanup needed */
    aggressiveMemory: true,
};

// ---- Adaptive Map Size ----
// Mobile: smaller map to reduce terrain cache RAM (~40MB vs ~655MB)
// Desktop: full 800×800 map
export const PLATFORM_MAP_COLS = IS_MOBILE ? 600 : 800;
export const PLATFORM_MAP_ROWS = IS_MOBILE ? 600 : 800;

// ---- Adaptive UI Layout ----
// iOS landscape ~844×390 (iPhone), ~1194×834 (iPad)
// Desktop ~1920×1080
export const UI_LAYOUT = {
    topBarH:       IS_IOS ? 20 : 36,
    bottomPanelH:  IS_IOS ? 0 : 180,
    bottomPanelW:  IS_IOS ? 0 : 650,
    minimapSize:   IS_IOS ? 64 : 180,
    /** Command grid button size */
    cmdBtnSize:    IS_IOS ? 36 : 48,
    /** Portrait icon size */
    portraitSize:  IS_IOS ? 32 : 64,
    /** Font scale multiplier */
    fontScale:     IS_IOS ? 0.65 : 1.0,
    /** Border width */
    borderWidth:   IS_IOS ? 0 : 4,
    /** Bar width in portrait info */
    barWidth:      IS_IOS ? 70 : 140,
};

// ---- Rendering Quality ----
export const PLATFORM = {
    /** Max particles active at same time */
    maxParticles: IS_MOBILE ? 150 : 500,

    /** Particle emit multiplier (0.0–1.0) — scales down particle counts */
    particleScale: IS_MOBILE ? 0.4 : 1.0,

    /** Shadow rendering (expensive on mobile) */
    enableShadows: !IS_LOW_END,

    /** Unit dust/aura effects */
    enableUnitEffects: !IS_LOW_END,

    /** Terrain decoration detail (grass blades, flowers, mushrooms) */
    terrainDetail: IS_MOBILE ? 'low' as const : 'high' as const,

    /** Fog of War resolution divider (higher = lower resolution fog) */
    fogDivider: IS_MOBILE ? 8 : 4,

    /** Water animation (caustics, waves) */
    enableWaterAnimation: !IS_LOW_END,

    /** Building construction sparkle particles */
    enableBuildingParticles: !IS_LOW_END,

    /** Hero skill visual effects */
    enableSkillEffects: true, // Always on, they're important for gameplay

    /** Max canvas size in pixels (for terrain cache) */
    maxCanvasPixels: IS_IOS ? IOS.maxCanvasPixels : IS_MOBILE ? 33_554_432 : 268_435_456, // iOS 4096², Android 5792², Desktop 16384²

    /** Target FPS */
    targetFPS: IS_MOBILE ? 30 : 60,
};

// ---- Logging ----
if (typeof console !== 'undefined') {
    console.log(
        `[PlatformConfig] iOS=${IS_IOS} android=${IS_ANDROID} mobile=${IS_MOBILE} lowEnd=${IS_LOW_END} ` +
        `touch=${IS_TOUCH} dpr=${DEVICE_PIXEL_RATIO} map=${PLATFORM_MAP_COLS}×${PLATFORM_MAP_ROWS} ` +
        `particles=${PLATFORM.maxParticles} terrain=${PLATFORM.terrainDetail}`
    );
}
