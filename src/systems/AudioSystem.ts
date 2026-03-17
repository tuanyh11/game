// ============================================================
//  AudioSystem - 8-bit synthetic sound generator
// ============================================================

export class AudioSystem {
    private ctx: AudioContext | null = null;
    private initialized = false;
    private volume = 0.5; // 0 to 1

    // Cache for downloaded sound effects
    private sfxCache = new Map<string, AudioBuffer>();

    // ===== GATHER SOUND THROTTLING =====
    private lastGatherSoundTime: Record<string, number> = {};

    /**
     * Play gather sound but throttled per resource type.
     * Prevents overlapping noise when 20+ villagers mine at the same time.
     */
    public playGatherSound(type: 'wood' | 'mine' | 'food', url: string, baseVol: number, pitch: number, wx: number, wy: number): void {
        const now = performance.now();
        const lastTime = this.lastGatherSoundTime[type] || 0;
        
        // Cooldown: 150ms between sound triggers for the same resource type
        if (now - lastTime < 150) return;
        
        this.lastGatherSoundTime[type] = now;
        
        const sv = this.getSpatialVolume(wx, wy);
        if (sv <= 0) return;
        
        const volScale = baseVol * sv;
        this.playSFXWithPitch(url, volScale, pitch);
    }

    // ===== SPATIAL AUDIO & FOG =====
    private camX = 0;
    private camY = 0;
    private camW = 800;
    private camH = 600;
    private fogOfWar: { isVisible: (wx: number, wy: number) => boolean } | null = null;

    public setFogOfWar(f: { isVisible: (wx: number, wy: number) => boolean }): void {
        this.fogOfWar = f;
    }

    /** Call each frame from Game.ts to update camera position */
    public updateCamera(x: number, y: number, w: number, h: number): void {
        this.camX = x; this.camY = y; this.camW = w; this.camH = h;
    }

    /**
     * Calculate volume multiplier based on distance from viewport center.
     * Returns 0-1: 1 = center of screen, 0 = far away.
     */
    public getSpatialVolume(wx: number, wy: number): number {
        // Mute if hidden by fog of war
        if (this.fogOfWar && !this.fogOfWar.isVisible(wx, wy)) {
            return 0;
        }

        const cx = this.camX + this.camW / 2;
        const cy = this.camY + this.camH / 2;
        const dist = Math.hypot(wx - cx, wy - cy);
        // Max hearing range = 1.5x the viewport diagonal
        const maxRange = Math.hypot(this.camW, this.camH) * 0.75;
        if (dist >= maxRange) return 0;
        // Smooth falloff (quadratic for more natural feel)
        const t = 1 - dist / maxRange;
        return t * t;
    }

    constructor() {
        // Wait for user interaction to initialize AudioContext
        // to comply with browser auto-play policies.
        const interactionEvent = () => {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        };
        window.addEventListener('click', interactionEvent);
        window.addEventListener('keydown', interactionEvent);
    }

    private init(): void {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.initialized = true;
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    public setVolume(vol: number): void {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    /**
     * Loads (and caches) an audio file, then plays it once.
     * @param url The URL of the sound effect (e.g. imported via bun or relative path)
     * @param volumeScale Optional multiplier for this specific sound's volume (default 1.0)
     */
    public async playSFX(url: string, volumeScale: number = 1.0): Promise<void> {
        if (!this.ctx || this.volume === 0) return;

        let buffer = this.sfxCache.get(url);

        if (!buffer) {
            try {
                const response = await fetch(url);
                if (!response.ok) return;
                const arrayBuffer = await response.arrayBuffer();
                buffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.sfxCache.set(url, buffer);
            } catch (e) {
                console.error("Failed to load SFX:", url, e);
                return;
            }
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = this.volume * volumeScale;

        source.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(0);
    }

    public playExplosionSound(wx?: number, wy?: number): void {
        if (!this.ctx || this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        const now = this.ctx.currentTime;
        const duration = 0.5;

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + duration);

        oscGain.gain.setValueAtTime(this.volume * 0.8 * sv, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Plays the warrior death cry sound from file.
     * Throttled to prevent audio spam when many units die at once.
     */
    private deathCooldown = 0;

    public playDeathSound(wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        const now = performance.now();
        if (now - this.deathCooldown < 200) return;
        this.deathCooldown = now;

        const volScale = (0.4 + Math.random() * 0.3) * sv;
        this.playSFXWithPitch('/musics/warrior-death-cry-british-male.wav', volScale, 0.85 + Math.random() * 0.3);
    }

    /**
     * Plays the spear thrust sound from file.
     * Throttled to prevent audio spam when many spearmen attack at once.
     */
    private spearCooldown = 0;

    public playSpearStab(wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        const now = performance.now();
        if (now - this.spearCooldown < 150) return;
        this.spearCooldown = now;

        const volScale = (0.4 + Math.random() * 0.3) * sv;
        this.playSFXWithPitch('/musics/yodguard-spear-thrust.mp3', volScale, 0.9 + Math.random() * 0.2);
    }

    /**
     * Plays horse galloping sound for cavalry units while moving.
     * Throttled to ~2 per second for a natural gallop rhythm.
     */
    private gallopCooldown = 0;

    public playHorseGallop(wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        const now = performance.now();
        if (now - this.gallopCooldown < 500) return;
        this.gallopCooldown = now;

        const volScale = (0.2 + Math.random() * 0.15) * sv;
        this.playSFXWithPitch('/musics/dragon-studio-horse-galloping-339737.mp3', volScale, 0.95 + Math.random() * 0.1);
    }

    /**
     * Plays a bear roar sound for BearRider attacks.
     * Throttled to prevent spam.
     */
    private bearRoarCooldown = 0;

    public playBearRoar(wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        const now = performance.now();
        if (now - this.bearRoarCooldown < 3000) return; // Max once every 3s
        this.bearRoarCooldown = now;

        const volScale = (0.5 + Math.random() * 0.2) * sv;
        this.playSFXWithPitch('/musics/virtualzero-bear-roar.mp3', volScale, 0.9 + Math.random() * 0.2);
    }
    /**
     * Plays the arrow whoosh sound from file with pitch variation.
     * Throttled to prevent audio spam when many archers shoot at once.
     */
    private arrowCooldown = 0;

    public playArrowSound(wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        const now = performance.now();
        if (now - this.arrowCooldown < 100) return;
        this.arrowCooldown = now;

        const volScale = (0.4 + Math.random() * 0.3) * sv;
        this.playSFXWithPitch('/musics/arrow-whoosh.mp3', volScale, 0.9 + Math.random() * 0.2);
    }

    /**
     * Plays the sword slash / hit sound from file with pitch variation.
     * Throttled to prevent audio spam when many units attack at once.
     */
    private slashCooldown = 0;

    public playSlashSound(wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        const sv = (wx !== undefined && wy !== undefined) ? this.getSpatialVolume(wx, wy) : 1;
        if (sv <= 0) return;

        // Throttle: max ~8 slash sounds per second
        const now = performance.now();
        if (now - this.slashCooldown < 120) return;
        this.slashCooldown = now;

        const volScale = (0.5 + Math.random() * 0.3) * sv;
        this.playSFXWithPitch('/musics/sword-hit.mp3', volScale, 0.85 + Math.random() * 0.3);
    }

    /**
     * Plays a sound file with optional pitch variation using HTMLAudioElement.
     * Creates a new Audio element each time for concurrent playback.
     */
    /**
     * Play SFX with pitch. Optionally pass world coords for spatial volume.
     */
    public playSFXWithPitch(url: string, volumeScale: number = 1.0, pitch: number = 1.0, wx?: number, wy?: number): void {
        if (this.volume === 0) return;
        // Apply spatial volume if world coords provided
        let sv = 1;
        if (wx !== undefined && wy !== undefined) {
            sv = this.getSpatialVolume(wx, wy);
            if (sv <= 0) return;
        }

        const audio = new Audio(url);
        audio.volume = Math.min(1, this.volume * volumeScale * sv);
        audio.playbackRate = pitch;
        audio.play().catch(() => {});
    }

    // ===== BACKGROUND MUSIC =====
    private bgm: HTMLAudioElement | null = null;
    private bgmFadeInterval: number | null = null;
    private pendingBGM: { url: string; vol: number } | null = null;
    private userInteracted = false;

    /**
     * Play background music (looping). Fades in smoothly.
     * If user hasn't interacted yet, defers until first click/keydown.
     */
    public playBGM(url: string, volumeScale: number = 0.3): void {
        // Don't restart if same track is already playing
        if (this.bgm && this.bgm.src.endsWith(url.replace(/^\//, '')) && !this.bgm.paused) return;

        if (!this.userInteracted) {
            // Defer until user interacts
            this.pendingBGM = { url, vol: volumeScale };
            const startOnInteraction = () => {
                this.userInteracted = true;
                window.removeEventListener('click', startOnInteraction);
                window.removeEventListener('keydown', startOnInteraction);
                if (this.pendingBGM) {
                    this.playBGM(this.pendingBGM.url, this.pendingBGM.vol);
                    this.pendingBGM = null;
                }
            };
            window.addEventListener('click', startOnInteraction, { once: true });
            window.addEventListener('keydown', startOnInteraction, { once: true });
            return;
        }

        this.stopBGM();

        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0; // Start silent for fade-in
        this.bgm = audio;

        const targetVol = Math.min(1, this.volume * volumeScale);
        audio.play().then(() => {
            // Fade in over 1 second
            let vol = 0;
            this.bgmFadeInterval = window.setInterval(() => {
                vol = Math.min(targetVol, vol + targetVol / 20);
                if (this.bgm) this.bgm.volume = vol;
                if (vol >= targetVol && this.bgmFadeInterval) {
                    clearInterval(this.bgmFadeInterval);
                    this.bgmFadeInterval = null;
                }
            }, 50);
        }).catch(e => console.error('🎵 BGM play failed:', e));
    }

    /**
     * Stop background music with a fade-out.
     */
    public stopBGM(): void {
        if (this.bgmFadeInterval) {
            clearInterval(this.bgmFadeInterval);
            this.bgmFadeInterval = null;
        }
        if (!this.bgm) return;

        const audio = this.bgm;
        let vol = audio.volume;
        // Fade out over 0.5 second
        const fadeOut = window.setInterval(() => {
            vol = Math.max(0, vol - 0.02);
            audio.volume = vol;
            if (vol <= 0) {
                clearInterval(fadeOut);
                audio.pause();
                audio.src = '';
            }
        }, 25);
        this.bgm = null;
    }
}

// Global singleton instance
export const audioSystem = new AudioSystem();
