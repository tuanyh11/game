// ============================================================
//  AudioSystem - 8-bit synthetic sound generator
// ============================================================

export class AudioSystem {
    private ctx: AudioContext | null = null;
    private initialized = false;
    private volume = 0.5; // 0 to 1

    // Cache for downloaded sound effects
    private sfxCache = new Map<string, AudioBuffer>();

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

    public playExplosionSound(): void {
        if (!this.ctx || this.volume === 0) return;

        const now = this.ctx.currentTime;
        const duration = 0.5;

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + duration);

        oscGain.gain.setValueAtTime(this.volume * 0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Plays a synthetic retro 8-bit death groan/explosion sound.
     */
    public playDeathSound(): void {
        if (!this.ctx || this.volume === 0) return;

        const now = this.ctx.currentTime;
        const duration = 0.4;

        // --- Layer 1: Descending low "groan" (Square wave for retro feel) ---
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.type = 'square';

        // Start low and drop lower
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + duration);

        // Slow fade out
        oscGain.gain.setValueAtTime(this.volume * 0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);

        // --- Layer 2: White Noise "Thud/Crumble" ---
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Apply simple low-pass by averaging to make it sound like a dull thud
            const noise = Math.random() * 2 - 1;
            data[i] = noise * (1 - i / bufferSize); // Fade noise out structurally
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        // Sweep filter down to muffle the sound as it dies
        noiseFilter.frequency.setValueAtTime(1000, now);
        noiseFilter.frequency.linearRampToValueAtTime(100, now + duration);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(this.volume * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseSource.start(now);
    }

    /**
     * Plays a synthetic spear stab/thrust sound.
     * Uses a fast mid-frequency burst.
     */
    public playSpearStab(): void {
        if (!this.ctx || this.volume === 0) return;

        const now = this.ctx.currentTime;
        const duration = 0.1; // Very quick jab

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High to low mid-pitch quickly
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + duration);

        gain.gain.setValueAtTime(this.volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Plays a synthetic 8-bit arrow shooting sound.
     * Uses a fast pitch envelope to simulate a bowstring twang.
     */
    public playArrowSound(): void {
        if (!this.ctx || this.volume === 0) return;

        const now = this.ctx.currentTime;
        const duration = 0.15; // Quick snap

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // A quick pitch drop to sound like a string releasing
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        // Sharp volume envelope
        gain.gain.setValueAtTime(this.volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Plays a synthetic 8-bit sword slash sound.
     * Uses a short, high-frequency "sawtooth" wave descending in pitch rapidly.
     */
    public playSlashSound(): void {
        if (!this.ctx || this.volume === 0) return;

        // Generate white noise buffer for exactly the duration needed
        const duration = 0.15;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;

        // Apply a highpass/bandpass filter to give it a "metal slicing wind" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1200; // Cut out low rumble

        // Add a second filter to shape the top end (makes it sound like thin metal)
        const peakFilter = this.ctx.createBiquadFilter();
        peakFilter.type = 'peaking';
        peakFilter.frequency.value = 5000;
        peakFilter.Q.value = 5;
        peakFilter.gain.value = 10;

        const gain = this.ctx.createGain();

        // Connect: noise -> highpass -> peakFilter -> gain -> destination
        noiseSource.connect(filter);
        filter.connect(peakFilter);
        peakFilter.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        // Volume envelope (sharp attack, quick decay)
        gain.gain.setValueAtTime(0, now);
        // Very sharp spike at the start to simulate impact
        gain.gain.linearRampToValueAtTime(this.volume * 0.8, now + 0.01);
        // Quick fade out into a "whoosh"
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Slide the filter frequency down slightly during the slash
        filter.frequency.setValueAtTime(4000, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + duration);

        noiseSource.start(now);

        // --- Layer 2: Metallic "Shing" (High-pitched oscillator) ---
        const metalOsc = this.ctx.createOscillator();
        const metalGain = this.ctx.createGain();
        metalOsc.connect(metalGain);
        metalGain.connect(this.ctx.destination);

        // A triangle wave gives a nice hollow ringing metal sound
        metalOsc.type = 'triangle';

        // Start very high (the scrape of metal) and drop quickly
        metalOsc.frequency.setValueAtTime(6000, now);
        metalOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        // Very sharp attack, quick decay
        metalGain.gain.setValueAtTime(0, now);
        metalGain.gain.linearRampToValueAtTime(this.volume * 0.6, now + 0.01);
        metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        metalOsc.start(now);
        metalOsc.stop(now + 0.1);
    }
}

// Global singleton instance
export const audioSystem = new AudioSystem();
