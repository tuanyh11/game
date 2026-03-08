import { C, TILE_SIZE } from "../../config/GameConfig";
import { Building } from "../Building";

export function drawWall(ctx: CanvasRenderingContext2D, b: Building): void {
    const age = b.age;
    const w = b.data.size[0] * TILE_SIZE;
    const h = b.data.size[1] * TILE_SIZE;

    // Center pivot
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.translate(b.x - cx, b.y - cy);

    // Squish the wall visually to make it look shorter, while keeping the full 3x3 footprint active
    ctx.translate(0, h * 0.3);
    ctx.scale(1, 0.7);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(2, 4, w, h);

    if (age <= 2) {
        // Age 2: Wooden Palisade (Lô Cốt Gỗ)
        ctx.fillStyle = '#6b4f36'; // Dark wood
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#4a3320';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        // Pattern of sharpened vertical logs
        ctx.fillStyle = '#8f6e4a'; // Lighter wood for logs
        const logs = Math.max(4, Math.floor(w / 8)); // Scale number of logs with width
        const logW = w / logs;
        for (let i = 0; i < logs; i++) {
            const lx = i * logW;
            // Draw pointed log
            ctx.beginPath();
            ctx.moveTo(lx, h);
            ctx.lineTo(lx, 4);
            ctx.lineTo(lx + logW / 2, -4); // Pointy tip
            ctx.lineTo(lx + logW, 4);
            ctx.lineTo(lx + logW, h);
            ctx.fill();
            ctx.stroke();

            // Log shadows/highlights for texture
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(lx + logW / 2, 4, logW / 2, h - 4);
        }

        // Horizontal binding rope/plank
        ctx.fillStyle = '#3a2717';
        ctx.fillRect(-2, h / 3, w + 4, 3);
        ctx.fillRect(-2, (h * 2) / 3, w + 4, 3);

    } else if (age === 3) {
        // Age 3: Stone Wall (Tường Đá)
        ctx.fillStyle = '#666'; // Gray stone
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, w, h);

        // Stone brick pattern - repeated to fit the larger block
        ctx.fillStyle = '#555';
        const brickRows = 3;
        const rowH = h / brickRows;
        const brickCols = Math.max(2, Math.floor(w / 16));
        const colW = w / brickCols;

        for (let r = 0; r < brickRows; r++) {
            const yOffset = r * rowH;
            for (let c = 0; c < brickCols; c++) {
                // Stagger bricks by shifting x based on row parity
                const isStaggered = r % 2 !== 0;
                let xOffset = c * colW + (isStaggered ? colW / 2 : 0);

                // If it pushes past the edge, draw two smaller segments
                if (xOffset + colW > w) {
                    ctx.fillRect(xOffset + 2, yOffset + 2, (w - xOffset) - 4, rowH - 4);
                    // Wrap to front
                    if (isStaggered) {
                        ctx.fillRect(2, yOffset + 2, colW / 2 - 4, rowH - 4);
                    }
                } else {
                    ctx.fillRect(xOffset + 2, yOffset + 2, colW - 4, rowH - 4);
                }
            }
        }

        // Crenellations (răng cưa trên tường)
        ctx.fillStyle = '#777';
        const crenCount = Math.max(3, Math.floor(w / 12));
        const crenW = w / crenCount;
        for (let i = 0; i < crenCount; i++) {
            ctx.fillRect(i * crenW, -5, crenW * 0.75, 5);
            ctx.strokeRect(i * crenW, -5, crenW * 0.75, 5);
        }

    } else {
        // Age 4: Marble/Imperial Wall (Tường Cẩm Thạch kiên cố)
        ctx.fillStyle = '#bbb'; // White marble stone
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        // Core thicker base
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-2, h - 4, w + 4, 4);
        ctx.strokeRect(-2, h - 4, w + 4, 4);

        // Large polished stone blocks
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        const blockCols = Math.max(1, Math.floor(w / 24));
        const blockW = w / blockCols;
        for (let i = 0; i < blockCols; i++) {
            const bx = i * blockW + (blockW * 0.1);
            const bw = blockW * 0.8;
            ctx.strokeRect(bx, h * 0.1, bw, h * 0.35);
            ctx.strokeRect(bx, h * 0.55, bw, h * 0.35);
        }

        // Trim / Accent
        ctx.fillStyle = C.uiHighlight; // Gold/highlight trim
        ctx.fillRect(0, h / 2 - 2, w, 4);

        // Elegant crenellations
        ctx.fillStyle = '#e0e0e0';
        const crenCount = Math.max(2, Math.floor(w / 20));
        const crenW = w / crenCount;
        for (let i = 0; i < crenCount; i++) {
            const tW = crenW * 0.7;
            const tX = i * crenW + (crenW * 0.15);
            ctx.fillRect(tX, -6, tW, 6);
            ctx.strokeRect(tX, -6, tW, 6);

            // Inner gold shield inside tooth
            ctx.fillStyle = C.uiHighlight;
            ctx.fillRect(tX + tW / 2 - 1, -4, 2, 4);
            ctx.fillStyle = '#e0e0e0'; // restore
        }
    }

    ctx.restore();
}
