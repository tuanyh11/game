/**
 * GameLoop — Vòng lặp game chuẩn dùng requestAnimationFrame.
 *
 *  • Tính deltaTime chính xác (giây).
 *  • Tự động cap deltaTime để tránh "spiral of death" khi tab bị ẩn.
 *  • Gọi callback update(dt) và render(dt) mỗi frame.
 *  • Theo dõi FPS realtime.
 */

export interface GameLoopCallbacks {
    /** Logic update — dt tính bằng giây */
    update: (dt: number) => void;
    /** Render — dt tính bằng giây */
    render: (dt: number) => void;
}

export class GameLoop {
    private callbacks: GameLoopCallbacks;
    private lastTimestamp = 0;
    private rafId = 0;
    private running = false;

    /** Delta time cap (giây). Nếu tab bị ẩn lâu, dt không vượt quá giá trị này */
    private readonly maxDt = 1 / 15; // ~66ms

    // ---- FPS tracking ----
    private frameCount = 0;
    private fpsAccumulator = 0;
    public fps = 0;
    public lastRenderTimeMs = 0;
    public renderMetrics = { terrain: 0, entities: 0, particles: 0, fog: 0, ui: 0 };

    constructor(callbacks: GameLoopCallbacks) {
        this.callbacks = callbacks;
    }

    /** Bắt đầu vòng lặp */
    public start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    }

    /** Dừng vòng lặp */
    public stop(): void {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    private tick(timestamp: number): void {
        if (!this.running) return;

        // Tính deltaTime (giây)
        let dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        // Cap deltaTime
        if (dt > this.maxDt) dt = this.maxDt;

        // FPS
        this.frameCount++;
        this.fpsAccumulator += dt;
        if (this.fpsAccumulator >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsAccumulator -= 1;
        }

        // Gọi callbacks
        this.callbacks.update(dt);
        this.callbacks.render(dt);

        // Lên lịch frame tiếp theo
        this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    }
}
