// ============================================================
//  ResourceCache — WebGL/OffscreenCanvas Pre-rendering for Nodes
//  Prevents 10,000+ vector paths from executing every frame
// ============================================================

export class ResourceCache {
    // We render trees inside a 64x64 bounding box so shadows aren't clipped
    private static readonly CACHE_SIZE = 64;
    private static readonly CENTER_OFS = 32;

    private static oakCanvas: OffscreenCanvas;
    private static pineCanvas: OffscreenCanvas;
    private static birchCanvas: OffscreenCanvas;
    private static autumnCanvas: OffscreenCanvas;

    private static goldCanvas: OffscreenCanvas;
    private static stoneCanvas: OffscreenCanvas;
    private static berryCanvas: OffscreenCanvas;

    private static isInitialized = false;

    static init(): void {
        if (this.isInitialized) return;

        this.oakCanvas = this.createCache(this.drawOak);
        this.pineCanvas = this.createCache(this.drawPine);
        this.birchCanvas = this.createCache(this.drawBirch);
        this.autumnCanvas = this.createCache(this.drawAutumn);

        this.goldCanvas = this.createCache(this.drawGoldMine);
        this.stoneCanvas = this.createCache(this.drawStoneMine);
        this.berryCanvas = this.createCache(this.drawBerry);

        this.isInitialized = true;
    }

    private static createCache(drawFn: (ctx: OffscreenCanvasRenderingContext2D, x: number, y: number) => void): OffscreenCanvas {
        const c = new OffscreenCanvas(this.CACHE_SIZE, this.CACHE_SIZE);
        const ctx = c.getContext('2d', { alpha: true });
        if (ctx) {
            drawFn(ctx, this.CENTER_OFS, this.CENTER_OFS);
        }
        return c;
    }

    // --- Accessors for ResourceNode to draw from ---

    static drawTreeVariant(ctx: CanvasRenderingContext2D, variant: number, x: number, y: number): void {
        const ofs = this.CENTER_OFS;
        switch (variant) {
            case 0: ctx.drawImage(this.oakCanvas, x - ofs, y - ofs); break;
            case 1: ctx.drawImage(this.pineCanvas, x - ofs, y - ofs); break;
            case 2: ctx.drawImage(this.birchCanvas, x - ofs, y - ofs); break;
            case 3: ctx.drawImage(this.autumnCanvas, x - ofs, y - ofs); break;
        }
    }

    static drawGoldCache(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.drawImage(this.goldCanvas, x - this.CENTER_OFS, y - this.CENTER_OFS);
    }

    static drawStoneCache(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.drawImage(this.stoneCanvas, x - this.CENTER_OFS, y - this.CENTER_OFS);
    }

    static drawBerryCache(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.drawImage(this.berryCanvas, x - this.CENTER_OFS, y - this.CENTER_OFS);
    }


    // ============================================================
    //  Original Vector Logic (Extracted from ResourceNode.ts)
    // ============================================================

    private static drawOak(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 17, 17, 8, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 17, 22, 10, 0.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#3a200a';
        ctx.fillRect(x - 4, y + 1, 9, 19);
        ctx.fillStyle = '#2a1606';
        ctx.fillRect(x - 3, y + 3, 2, 4);
        ctx.fillRect(x - 2, y + 10, 3, 3);
        ctx.fillRect(x + 1, y + 5, 2, 6);
        ctx.fillStyle = '#6a4a22';
        ctx.fillRect(x + 3, y + 2, 2, 10);
        ctx.fillStyle = '#7a5a2a';
        ctx.fillRect(x + 4, y + 4, 1, 6);
        ctx.fillStyle = '#3a200a';
        ctx.fillRect(x - 6, y + 17, 3, 3);
        ctx.fillRect(x + 4, y + 16, 3, 4);

        ctx.fillStyle = '#0c4210';
        ctx.beginPath(); ctx.arc(x, y - 2, 19, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#145a18';
        ctx.beginPath(); ctx.arc(x - 2, y - 5, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1c721e';
        ctx.beginPath(); ctx.arc(x + 1, y - 8, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#248a28';
        ctx.beginPath(); ctx.arc(x - 1, y - 11, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#30a232';
        ctx.beginPath(); ctx.arc(x, y - 14, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#48c44a';
        ctx.beginPath(); ctx.arc(x - 4, y - 15, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5cdc58';
        ctx.fillRect(x - 6, y - 18, 4, 3);

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.arc(x + 5, y + 2, 10, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#0e5518';
        ctx.fillRect(x + 9, y - 5, 4, 4);
        ctx.fillRect(x - 12, y - 1, 4, 3);
        ctx.fillRect(x + 6, y - 12, 3, 3);
        ctx.fillStyle = '#40b842';
        ctx.fillRect(x - 8, y - 12, 3, 2);
        ctx.fillRect(x + 3, y - 16, 2, 2);
    }

    private static drawPine(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath(); ctx.ellipse(x + 2, y + 18, 13, 6, 0.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#3a200a';
        ctx.fillRect(x - 3, y + 3, 6, 18);
        ctx.fillStyle = '#2a1606';
        ctx.fillRect(x - 2, y + 6, 2, 6);
        ctx.fillStyle = '#5a3a18';
        ctx.fillRect(x + 1, y + 5, 2, 8);

        ctx.fillStyle = '#082e0c';
        ctx.beginPath();
        ctx.moveTo(x - 18, y + 6); ctx.lineTo(x, y - 10); ctx.lineTo(x + 18, y + 6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0c3e12';
        ctx.beginPath();
        ctx.moveTo(x - 16, y + 5); ctx.lineTo(x, y - 9); ctx.lineTo(x, y + 5);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#0c4010';
        ctx.beginPath();
        ctx.moveTo(x - 14, y - 1); ctx.lineTo(x, y - 18); ctx.lineTo(x + 14, y - 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#105214';
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 1); ctx.lineTo(x, y - 17); ctx.lineTo(x, y - 1);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#145a1c';
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 10); ctx.lineTo(x, y - 24); ctx.lineTo(x + 9, y - 10);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1a6a22';
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 10); ctx.lineTo(x, y - 23); ctx.lineTo(x, y - 10);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#248a2a';
        ctx.fillRect(x - 2, y - 22, 3, 3);
        ctx.fillStyle = 'rgba(220,240,255,0.12)';
        ctx.fillRect(x - 1, y - 24, 2, 2);

        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.moveTo(x, y - 23); ctx.lineTo(x + 14, y - 1); ctx.lineTo(x + 9, y - 10);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#1a6a24';
        ctx.fillRect(x - 9, y - 3, 4, 3);
        ctx.fillRect(x - 5, y - 13, 3, 3);
        ctx.fillRect(x - 3, y - 21, 3, 2);
    }

    private static drawBirch(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath(); ctx.ellipse(x + 2, y + 16, 16, 7, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.beginPath(); ctx.ellipse(x + 2, y + 16, 20, 9, 0.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#d8d0c0';
        ctx.fillRect(x - 3, y - 3, 6, 21);
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(x - 2, y - 3, 4, 21);
        ctx.fillStyle = '#f0e8d8';
        ctx.fillRect(x - 2, y - 2, 2, 18);
        ctx.fillStyle = '#7a7068';
        ctx.fillRect(x - 2, y + 0, 4, 1);
        ctx.fillRect(x - 2, y + 5, 5, 1);
        ctx.fillRect(x - 1, y + 10, 4, 1);
        ctx.fillRect(x - 2, y + 14, 3, 1);
        ctx.fillRect(x - 1, y + 7, 3, 1);

        ctx.fillStyle = '#1e7028';
        ctx.beginPath(); ctx.arc(x - 5, y - 6, 13, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 7, y - 4, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#38a040';
        ctx.beginPath(); ctx.arc(x - 3, y - 10, 11, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, y - 9, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#50c050';
        ctx.beginPath(); ctx.arc(x, y - 13, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#68d868';
        ctx.beginPath(); ctx.arc(x - 2, y - 15, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#80e880';
        ctx.fillRect(x - 8, y - 13, 3, 3);
        ctx.fillRect(x - 3, y - 17, 3, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath(); ctx.arc(x + 6, y - 2, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#40b048';
        ctx.fillRect(x + 6, y - 7, 3, 2);
    }

    private static drawAutumn(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 17, 17, 8, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 17, 22, 10, 0.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#4a2810';
        ctx.fillRect(x - 4, y + 1, 9, 19);
        ctx.fillStyle = '#3a1e0a';
        ctx.fillRect(x - 3, y + 4, 2, 5);
        ctx.fillStyle = '#7a4a22';
        ctx.fillRect(x + 3, y + 3, 2, 9);
        ctx.fillStyle = '#4a2810';
        ctx.fillRect(x - 6, y + 17, 3, 3);
        ctx.fillRect(x + 4, y + 16, 3, 4);

        ctx.fillStyle = '#6a2808';
        ctx.beginPath(); ctx.arc(x, y - 2, 19, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a84a12';
        ctx.beginPath(); ctx.arc(x - 2, y - 5, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cc6a1a';
        ctx.beginPath(); ctx.arc(x + 1, y - 8, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e08a28';
        ctx.beginPath(); ctx.arc(x - 1, y - 11, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#eeaa35';
        ctx.beginPath(); ctx.arc(x, y - 14, 7, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#cc3322';
        ctx.beginPath(); ctx.arc(x + 8, y - 3, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 9, y - 6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dd4433';
        ctx.beginPath(); ctx.arc(x - 4, y - 14, 3, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#f0b840';
        ctx.fillRect(x - 5, y - 17, 5, 3);
        ctx.fillStyle = '#f8d050';
        ctx.fillRect(x - 4, y - 18, 3, 2);

        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.beginPath(); ctx.arc(x + 6, y + 2, 10, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#7a2a08';
        ctx.fillRect(x + 5, y - 1, 4, 3);
        ctx.fillRect(x - 12, y - 3, 3, 3);
    }

    private static drawGoldMine(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 12, 24, 9, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 12, 28, 11, 0.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#4a3a1e';
        ctx.beginPath(); ctx.arc(x, y + 4, 21, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a5828';
        ctx.beginPath(); ctx.arc(x - 5, y - 2, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a7838';
        ctx.beginPath(); ctx.arc(x - 6, y - 5, 10, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#7a6830';
        ctx.beginPath(); ctx.arc(x + 8, y + 2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a7840';
        ctx.beginPath(); ctx.arc(x + 7, y - 1, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a4820';
        ctx.beginPath(); ctx.arc(x + 2, y + 7, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#6a5820';
        ctx.beginPath(); ctx.arc(x - 2, y - 9, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a7838';
        ctx.beginPath(); ctx.arc(x - 3, y - 12, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(255,255,220,0.12)';
        ctx.beginPath(); ctx.arc(x - 8, y - 6, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.beginPath(); ctx.arc(x + 10, y + 5, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#daa820';
        ctx.fillRect(x - 11, y - 5, 7, 4);
        ctx.fillRect(x + 4, y - 3, 6, 4);
        ctx.fillRect(x - 4, y - 12, 5, 3);
        ctx.fillRect(x + 9, y - 1, 4, 3);
        ctx.fillRect(x - 2, y + 3, 4, 3);

        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - 10, y - 5, 3, 3);
        ctx.fillRect(x + 5, y - 2, 3, 2);
        ctx.fillRect(x - 3, y - 12, 3, 2);
        ctx.fillRect(x + 10, y, 2, 2);

        ctx.fillStyle = '#ffea50';
        ctx.fillRect(x - 9, y - 4, 2, 1);
        ctx.fillRect(x + 6, y - 2, 1, 1);
    }

    private static drawStoneMine(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 12, 24, 9, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.beginPath(); ctx.ellipse(x + 3, y + 12, 28, 11, 0.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#3e4248';
        ctx.beginPath(); ctx.arc(x, y + 4, 21, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a6068';
        ctx.beginPath(); ctx.arc(x - 4, y - 2, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a7078';
        ctx.beginPath(); ctx.arc(x - 5, y - 5, 11, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#6a7078';
        ctx.beginPath(); ctx.arc(x + 8, y + 2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a8088';
        ctx.beginPath(); ctx.arc(x + 7, y - 1, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a5058';
        ctx.beginPath(); ctx.arc(x + 1, y + 7, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#5a6068';
        ctx.beginPath(); ctx.arc(x - 1, y - 8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#687078';
        ctx.beginPath(); ctx.arc(x + 3, y - 13, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#9aa0a8';
        ctx.fillRect(x - 11, y - 7, 5, 3);
        ctx.fillRect(x + 1, y - 12, 4, 3);
        ctx.fillRect(x - 6, y - 11, 3, 2);
        ctx.fillStyle = '#aab0b8';
        ctx.fillRect(x - 10, y - 6, 3, 2);
        ctx.fillRect(x + 2, y - 14, 3, 2);

        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.beginPath(); ctx.arc(x + 10, y + 5, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#b8c0c8';
        ctx.fillRect(x - 9, y - 5, 2, 2);
        ctx.fillRect(x + 3, y - 14, 2, 2);
        ctx.fillRect(x + 9, y - 2, 2, 2);

        ctx.fillStyle = '#3a3e42';
        ctx.fillRect(x - 5, y - 3, 1, 7);
        ctx.fillRect(x + 3, y + 2, 4, 1);
        ctx.fillRect(x - 2, y - 9, 1, 5);
        ctx.fillRect(x + 6, y - 5, 1, 4);
        ctx.fillRect(x - 8, y + 1, 1, 3);

        ctx.fillStyle = '#c8d0d8';
        ctx.fillRect(x - 7, y - 4, 2, 2);
        ctx.fillRect(x + 5, y - 9, 2, 2);
        ctx.fillRect(x - 3, y + 3, 2, 1);
        ctx.fillRect(x + 8, y - 6, 2, 1);
    }

    private static drawBerry(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.ellipse(x, y + 6, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a5520';
        ctx.beginPath(); ctx.arc(x, y + 1, 9, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#228830';
        ctx.beginPath(); ctx.arc(x - 2, y - 1, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a9938';
        ctx.beginPath(); ctx.arc(x + 2, y - 2, 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#40bb48';
        ctx.fillRect(x - 4, y - 4, 2, 2);
        ctx.fillRect(x + 1, y - 5, 2, 1);

        const berryPositions: [number, number, string][] = [
            [-4, -2, '#cc2244'], [3, -3, '#dd3355'], [5, 1, '#ee2244'],
            [-1, 3, '#cc1133'], [3, 4, '#dd2255'], [-5, 2, '#bb1133'],
            [0, -4, '#ee3366'],
        ];
        for (const [bx, by, color] of berryPositions) {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(x + bx, y + by, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillRect(x + bx - 1, y + by - 1, 1, 1);
        }
    }
}
