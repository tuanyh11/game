/**
 * Camera — Hệ thống camera cho RTS.
 *
 * Hỗ trợ:
 *  • Pan bằng phím mũi tên (WASD cũng được)
 *  • Pan bằng edge-scrolling (đưa chuột ra mép màn hình)
 *  • Giới hạn camera trong phạm vi bản đồ (clamping)
 */

export interface CameraConfig {
    /** Tốc độ cuộn (pixels / giây) */
    scrollSpeed: number;
    /** Kích thước vùng mép để kích hoạt edge-scroll (pixels) */
    edgeMargin: number;
    /** Kích thước bản đồ thế giới (pixels) */
    worldWidth: number;
    worldHeight: number;
}

const DEFAULT_CONFIG: CameraConfig = {
    scrollSpeed: 500,
    edgeMargin: 20,
    worldWidth: 3200,
    worldHeight: 3200,
};

export class Camera {
    /** Vị trí góc trên-trái của viewport trong world-space */
    public x = 0;
    public y = 0;

    /** Kích thước viewport (= kích thước canvas) */
    public viewportWidth = 0;
    public viewportHeight = 0;

    /** Phần lề UI ở dưới cùng (để game area mở rộng xuống) */
    public uiBottomMargin = 0;

    private config: CameraConfig;

    // ---------- Input state ----------
    private keys: Set<string> = new Set();
    private mouseX = 0;
    private mouseY = 0;
    private mouseInWindow = false;

    // Touch panning state
    private isPanningTouch = false;
    private touchStartX = 0;
    private touchStartY = 0;

    // Bound listeners (để có thể removeEventListener)
    private boundKeyDown: (e: KeyboardEvent) => void;
    private boundKeyUp: (e: KeyboardEvent) => void;
    private boundMouseMove: (e: MouseEvent) => void;
    private boundMouseEnter: () => void;
    private boundMouseLeave: () => void;

    // Touch listeners
    private boundTouchStart: (e: TouchEvent) => void;
    private boundTouchMove: (e: TouchEvent) => void;
    private boundTouchEnd: (e: TouchEvent) => void;

    constructor(config?: Partial<CameraConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Bind listeners
        this.boundKeyDown = (e) => this.onKeyDown(e);
        this.boundKeyUp = (e) => this.onKeyUp(e);
        this.boundMouseMove = (e) => this.onMouseMove(e);
        this.boundMouseEnter = () => {
            this.mouseInWindow = true;
        };
        this.boundMouseLeave = () => {
            this.mouseInWindow = false;
        };

        this.boundTouchStart = (e) => this.onTouchStart(e);
        this.boundTouchMove = (e) => this.onTouchMove(e);
        this.boundTouchEnd = (e) => this.onTouchEnd(e);

        window.addEventListener("keydown", this.boundKeyDown);
        window.addEventListener("keyup", this.boundKeyUp);
        window.addEventListener("mousemove", this.boundMouseMove);
        window.addEventListener("mouseenter", this.boundMouseEnter);
        window.addEventListener("mouseleave", this.boundMouseLeave);

        // Touch events (passive: false to allow preventDefault if needed, though we only preventDefault on specific UI elements)
        window.addEventListener("touchstart", this.boundTouchStart, { passive: false });
        window.addEventListener("touchmove", this.boundTouchMove, { passive: false });
        window.addEventListener("touchend", this.boundTouchEnd);
        window.addEventListener("touchcancel", this.boundTouchEnd);
    }

    /** Gọi mỗi khi canvas resize để cập nhật viewport */
    public resize(width: number, height: number): void {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /** Cập nhật vị trí camera dựa trên input — gọi mỗi frame */
    public update(dt: number): void {
        const speed = this.config.scrollSpeed * dt;
        let dx = 0;
        let dy = 0;

        // ---- Phím mũi tên / WASD ----
        if (this.keys.has("ArrowLeft") || this.keys.has("a")) dx -= 1;
        if (this.keys.has("ArrowRight") || this.keys.has("d")) dx += 1;
        if (this.keys.has("ArrowUp") || this.keys.has("w")) dy -= 1;
        if (this.keys.has("ArrowDown") || this.keys.has("s")) dy += 1;

        // ---- Edge scrolling ----
        if (this.mouseInWindow) {
            const margin = this.config.edgeMargin;
            if (this.mouseX <= margin) dx -= 1;
            if (this.mouseX >= this.viewportWidth - margin) dx += 1;
            if (this.mouseY <= margin) dy -= 1;
            if (this.mouseY >= this.viewportHeight - margin) dy += 1;
        }

        // Normalize diagonal để di chuyển cùng tốc độ
        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.SQRT2;
            dx *= inv;
            dy *= inv;
        }

        this.x += dx * speed;
        this.y += dy * speed;

        // ---- Clamp trong giới hạn bản đồ ----
        this.clamp();
    }

    /** Giới hạn camera không ra ngoài bản đồ */
    private clamp(): void {
        const maxX = this.config.worldWidth - this.viewportWidth;
        const maxY = this.config.worldHeight - (this.viewportHeight - this.uiBottomMargin);
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    /** Áp đặt transform lên CanvasRenderingContext2D */
    public applyTransform(ctx: CanvasRenderingContext2D): void {
        ctx.setTransform(1, 0, 0, 1, -Math.round(this.x), -Math.round(this.y));
    }

    /** Reset transform (dùng để vẽ HUD lên trên) */
    public resetTransform(ctx: CanvasRenderingContext2D): void {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /** Chuyển toạ độ màn hình → toạ độ thế giới */
    public screenToWorld(sx: number, sy: number): { x: number; y: number } {
        return { x: sx + this.x, y: sy + this.y };
    }

    /** Chuyển toạ độ thế giới → toạ độ màn hình */
    public worldToScreen(wx: number, wy: number): { x: number; y: number } {
        return { x: wx - this.x, y: wy - this.y };
    }

    /** Center camera on a world position */
    public centerOn(wx: number, wy: number): void {
        this.x = wx - this.viewportWidth / 2;
        this.y = wy - this.viewportHeight / 2;
        this.clamp();
    }

    /** Cập nhật kích thước bản đồ */
    public setWorldSize(w: number, h: number): void {
        this.config.worldWidth = w;
        this.config.worldHeight = h;
        this.clamp();
    }

    /** Cập nhật lề dưới cùng của UI */
    public setBottomMargin(margin: number): void {
        this.uiBottomMargin = margin;
        this.clamp();
    }

    // ---------- Cleanup ----------
    public destroy(): void {
        window.removeEventListener("keydown", this.boundKeyDown);
        window.removeEventListener("keyup", this.boundKeyUp);
        window.removeEventListener("mousemove", this.boundMouseMove);
        window.removeEventListener("mouseenter", this.boundMouseEnter);
        window.removeEventListener("mouseleave", this.boundMouseLeave);

        window.removeEventListener("touchstart", this.boundTouchStart);
        window.removeEventListener("touchmove", this.boundTouchMove);
        window.removeEventListener("touchend", this.boundTouchEnd);
        window.removeEventListener("touchcancel", this.boundTouchEnd);
    }

    // ---------- Event handlers ----------
    private onKeyDown(e: KeyboardEvent): void {
        this.keys.add(e.key);
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.keys.delete(e.key);
    }

    private onMouseMove(e: MouseEvent): void {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.mouseInWindow = true;
    }

    // ---------- Touch Handlers ----------
    private onTouchStart(e: TouchEvent): void {
        // Use 2 fingers to pan the camera
        if (e.touches.length >= 2) {
            this.isPanningTouch = true;
            this.touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            this.touchStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
    }

    private onTouchMove(e: TouchEvent): void {
        if (this.isPanningTouch && e.touches.length >= 2) {
            const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dx = mx - this.touchStartX;
            const dy = my - this.touchStartY;

            // Invert dx/dy so map follows finger
            this.x -= dx;
            this.y -= dy;

            this.touchStartX = mx;
            this.touchStartY = my;
            this.clamp();
        }
    }

    private onTouchEnd(e: TouchEvent): void {
        if (e.touches.length < 2) {
            this.isPanningTouch = false;
        }
    }
}
