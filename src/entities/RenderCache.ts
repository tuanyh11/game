// ============================================================
//  RenderCache — Global memory cache for pre-rendering
//  Use this to cache expensive paths (ellipses, shadowBlur, gradients)
// ============================================================

export class RenderCache {
    private static cache = new Map<string, OffscreenCanvas | HTMLCanvasElement>();

    /**
     * Get or create a cached canvas render.
     * @param key Unique identifier for the cached drawing
     * @param width Width of the canvas needed
     * @param height Height of the canvas needed
     * @param renderFn The drawing logic that executes once
     * @returns The cached canvas
     */
    static get(key: string, width: number, height: number, renderFn: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void): OffscreenCanvas | HTMLCanvasElement {
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        let canvas: OffscreenCanvas | HTMLCanvasElement;
        try {
            canvas = new OffscreenCanvas(width, height);
        } catch {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
        }

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        renderFn(ctx);

        this.cache.set(key, canvas);
        return canvas;
    }

    /** Prebuilt standard generic unit shadow (2 ellipses) */
    static getUnitShadow(w: number, h: number, scale: number): OffscreenCanvas | HTMLCanvasElement {
        // Quantize scale slightly to avoid infinitely many keys due to float Math.sin() output (round to 1 decimal)
        const quantizedScale = Math.round(scale * 10) / 10;
        const key = `unit-shadow-${w}-${h}-${quantizedScale}`;
        
        // Pad canvas slightly to fit outer blur radially
        const padX = w + 8;
        const padY = h + 4;
        
        return this.get(key, padX * 2, padY * 2, (ctx) => {
            const cx = padX;
            const cy = padY;
            
            // Main shadow (darker center, lighter edge)
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            ctx.ellipse(cx, cy, w * quantizedScale, h * quantizedScale, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Softer outer shadow ring
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.beginPath();
            ctx.ellipse(cx, cy, (w + 3) * quantizedScale, (h + 1.5) * quantizedScale, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /** 
     * Cached radial glow to replace expensive ctx.shadowBlur 
     */
    static getGlow(r: number, g: number, b: number, radius: number, coreRadius: number = 0, opacity: number = 1): OffscreenCanvas | HTMLCanvasElement {
        const key = `glow-${r}-${g}-${b}-${radius}-${coreRadius}-${opacity}`;
        return this.get(key, radius * 2, radius * 2, (ctx) => {
            const cx = radius;
            const cy = radius;
            const grad = ctx.createRadialGradient(cx, cy, coreRadius, cx, cy, radius);
            grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, radius * 2, radius * 2);
        });
    }

    /** Clear cache to free memory if needed */
    static clear() {
        this.cache.clear();
    }
}
