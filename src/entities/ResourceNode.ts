// ============================================================
//  ResourceNode — Gatherable resource entities on the map
// ============================================================

import { genId, TILE_SIZE, ResourceNodeType, GATHER_RATES, ResourceType, C } from "../config/GameConfig";
import { ResourceCache } from "./ResourceCache";

export class ResourceNode {
    id: number;
    x: number; y: number;       // world center
    nodeType: ResourceNodeType;
    amount: number;
    maxAmount: number;
    alive = true;
    age = 1;

    constructor(x: number, y: number, nodeType: ResourceNodeType, amount: number) {
        this.id = genId();
        this.x = x; this.y = y;
        this.nodeType = nodeType;
        this.amount = amount;
        this.maxAmount = amount;
        // Deterministic tree variety based on id (0=Oak, 1=Pine, 2=Birch, 3=Autumn)
        this.treeVariant = (this.id * 2654435761 >>> 0) % 4;
    }

    treeVariant: number = 0;

    get resourceType(): ResourceType { return GATHER_RATES[this.nodeType].resourceType; }
    get isDepleted(): boolean { return this.amount <= 0; }

    /** Gather from this node, returns amount gathered */
    gather(dt: number): number {
        const rate = GATHER_RATES[this.nodeType].rate;
        const gathered = Math.min(rate * dt, this.amount);
        this.amount -= gathered;
        if (this.amount <= 0) { this.amount = 0; this.alive = false; }
        return gathered;
    }

    get radius(): number {
        switch (this.nodeType) {
            case ResourceNodeType.Tree: return 18;
            case ResourceNodeType.GoldMine: case ResourceNodeType.StoneMine: return 22;
            case ResourceNodeType.BerryBush: return 12;
            case ResourceNodeType.Farm: return 20;
            default: return 14;
        }
    }

    containsPoint(px: number, py: number): boolean {
        if (this.nodeType === ResourceNodeType.Farm) {
            // Farm is rectangular — use AABB
            const halfW = 24, halfH = 24;
            return px >= this.x - halfW && px <= this.x + halfW &&
                py >= this.y - halfH && py <= this.y + halfH;
        }
        return Math.hypot(px - this.x, py - this.y) <= this.radius + 2;
    }

    // ---- Render ----
    render(ctx: CanvasRenderingContext2D): void {
        const x = this.x, y = this.y;
        switch (this.nodeType) {
            case ResourceNodeType.Tree: ResourceCache.drawTreeVariant(ctx, this.treeVariant, x, y); break;
            case ResourceNodeType.GoldMine: ResourceCache.drawGoldCache(ctx, x, y); break;
            case ResourceNodeType.StoneMine: ResourceCache.drawStoneCache(ctx, x, y); break;
            case ResourceNodeType.BerryBush: ResourceCache.drawBerryCache(ctx, x, y); break;
            case ResourceNodeType.Farm: this.drawFarm(ctx, x, y); break;
        }

        // Depletion indicator for mines
        if (this.nodeType === ResourceNodeType.GoldMine || this.nodeType === ResourceNodeType.StoneMine) {
            const pct = this.amount / this.maxAmount;
            if (pct < 0.3) {
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#444';
                ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Tree falling leaves animation
        if (this.nodeType === ResourceNodeType.Tree && this.treeVariant === 3) {
            const leafTime = Date.now() / 2000;
            const leafY = y + 10 + ((leafTime + x * 0.01) % 1) * 20;
            if (leafY < y + 20) {
                ctx.fillStyle = '#dd6a20';
                ctx.fillRect(x + 10 + Math.sin(leafTime * 3) * 3, leafY, 2, 2);
            }
        }
    }

    private drawFarm(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        const s = TILE_SIZE * 2;
        const age = this.age;
        const left = x - s / 2, top = y - s / 2;

        // === SOIL BASE ===
        const soilMain = age >= 4 ? '#7a6830' : age >= 3 ? '#6a5828' : age >= 2 ? '#7a6038' : '#8a7040';
        const soilDark = age >= 4 ? '#5a4820' : age >= 3 ? '#4a3818' : age >= 2 ? '#5a4028' : '#6a5030';
        const soilHi = age >= 4 ? '#8a7838' : age >= 3 ? '#7a6830' : age >= 2 ? '#8a7048' : '#9a8050';

        ctx.fillStyle = soilMain;
        ctx.fillRect(left, top, s, s);

        // Soil texture - darker patches
        ctx.fillStyle = soilDark;
        for (let i = 0; i < 8; i++) {
            const px = left + 4 + Math.abs((i * 37) % (s - 8));
            const py = top + 4 + Math.abs((i * 53) % (s - 8));
            ctx.fillRect(px, py, 6, 4);
        }
        // Soil highlight patches
        ctx.fillStyle = soilHi;
        for (let i = 0; i < 5; i++) {
            const px = left + 8 + Math.abs((i * 41) % (s - 16));
            const py = top + 8 + Math.abs((i * 59) % (s - 16));
            ctx.fillRect(px, py, 4, 3);
        }

        // === FENCE / BORDER ===
        if (age >= 4) {
            // Ornate golden border
            ctx.strokeStyle = '#c9a030';
            ctx.lineWidth = 2;
            ctx.strokeRect(left + 1, top + 1, s - 2, s - 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.strokeRect(left + 3, top + 3, s - 6, s - 6);
            // Corner ornaments
            for (const [cx, cy] of [[left + 3, top + 3], [left + s - 5, top + 3], [left + 3, top + s - 5], [left + s - 5, top + s - 5]]) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(cx, cy, 3, 3);
            }
        } else if (age >= 3) {
            // Stone border
            ctx.fillStyle = '#6a6a68';
            ctx.fillRect(left, top, s, 3);
            ctx.fillRect(left, top + s - 3, s, 3);
            ctx.fillRect(left, top, 3, s);
            ctx.fillRect(left + s - 3, top, 3, s);
            ctx.fillStyle = '#5a5a58';
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(left + i * (s / 6), top, 1, 3);
                ctx.fillRect(left + i * (s / 6), top + s - 3, 1, 3);
            }
        } else if (age >= 2) {
            // Improved wooden fence with posts
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(left + 1, top + 1, s - 2, 2);
            ctx.fillRect(left + 1, top + s - 3, s - 2, 2);
            ctx.fillRect(left + 1, top + 1, 2, s - 2);
            ctx.fillRect(left + s - 3, top + 1, 2, s - 2);
            // Fence posts
            ctx.fillStyle = '#4a2a10';
            for (let i = 0; i < 4; i++) {
                const fp = left + 2 + i * (s - 6) / 3;
                ctx.fillRect(fp, top - 2, 3, 5);
                ctx.fillRect(fp, top + s - 3, 3, 5);
            }
        } else {
            // Simple wooden fence
            ctx.strokeStyle = '#5a3a18';
            ctx.lineWidth = 1;
            ctx.strokeRect(left + 2, top + 2, s - 4, s - 4);
        }

        // === FURROWS (plowed lines) ===
        const rowCount = age >= 3 ? 7 : 6;
        const rowSpacing = (s - 16) / rowCount;
        ctx.fillStyle = soilDark;
        for (let i = 0; i < rowCount; i++) {
            const ry = top + 8 + i * rowSpacing;
            ctx.fillRect(left + 6, ry + rowSpacing - 2, s - 12, 1);
        }

        // === CROPS ===
        for (let i = 0; i < rowCount; i++) {
            const ry = top + 8 + i * rowSpacing;
            const cropCount = age >= 3 ? 9 : 8;
            const spacing = (s - 20) / cropCount;

            for (let j = 0; j < cropCount; j++) {
                const cx = left + 10 + j * spacing;

                if (age >= 4) {
                    // Golden bountiful wheat
                    // Stem
                    ctx.fillStyle = '#6a8828';
                    ctx.fillRect(cx + 1, ry, 2, 10);
                    // Wheat head (golden)
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(cx, ry - 4, 4, 5);
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(cx, ry - 4, 4, 2);
                    // Grain detail
                    ctx.fillStyle = '#c99010';
                    ctx.fillRect(cx + 1, ry - 2, 2, 1);
                } else if (age >= 3) {
                    // Tall mature crops - mixed green and golden
                    const isGolden = (i + j) % 3 === 0;
                    // Stem
                    ctx.fillStyle = isGolden ? '#7a9030' : '#4a8828';
                    ctx.fillRect(cx + 1, ry + 2, 2, 8);
                    // Leaf/head
                    ctx.fillStyle = isGolden ? '#b8a030' : '#5aaa38';
                    ctx.fillRect(cx, ry - 2, 4, 5);
                    ctx.fillStyle = isGolden ? '#c9b040' : '#6abb48';
                    ctx.fillRect(cx, ry - 2, 4, 2);
                } else if (age >= 2) {
                    // Medium crops - green stalks with tips
                    // Stem
                    ctx.fillStyle = '#4a8828';
                    ctx.fillRect(cx + 1, ry + 4, 2, 6);
                    // Top bush
                    ctx.fillStyle = '#6aaa40';
                    ctx.fillRect(cx, ry + 1, 4, 4);
                    // Tip highlight
                    ctx.fillStyle = '#8acc50';
                    ctx.fillRect(cx + 1, ry + 1, 2, 1);
                } else {
                    // Age 1: Simple small sprouts
                    ctx.fillStyle = '#5a9930';
                    ctx.fillRect(cx + 1, ry + 4, 2, 5);
                    ctx.fillStyle = '#88aa30';
                    ctx.fillRect(cx, ry + 2, 4, 3);
                }
            }
        }

        // === AGE-SPECIFIC DECORATIONS ===

        // Age 2+: Water trough/well
        if (age >= 2) {
            ctx.fillStyle = age >= 3 ? '#5a5a58' : '#5a3a18';
            ctx.fillRect(left + s - 14, top + s - 14, 10, 8);
            ctx.fillStyle = '#3a6aaa';
            ctx.fillRect(left + s - 12, top + s - 12, 6, 4);
        }

        // Age 3+: Scarecrow
        if (age >= 3) {
            // Post
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(left + 10, top + 10, 2, 20);
            // Crossbar
            ctx.fillRect(left + 6, top + 14, 10, 2);
            // Head
            ctx.fillStyle = '#c9a060';
            ctx.fillRect(left + 9, top + 6, 4, 5);
            // Hat
            ctx.fillStyle = '#4a3018';
            ctx.fillRect(left + 7, top + 4, 8, 3);
            ctx.fillRect(left + 9, top + 2, 4, 3);
        }

        // Age 4+: Windmill decoration (small, corner)
        if (age >= 4) {
            const mx = left + s - 16, my = top + 8;
            // Tower
            ctx.fillStyle = '#8a8888';
            ctx.fillRect(mx + 2, my + 4, 6, 14);
            ctx.fillStyle = '#9a9a98';
            ctx.fillRect(mx + 2, my + 4, 6, 3);
            // Blades (animated)
            const angle = (Date.now() / 1000) % (Math.PI * 2);
            ctx.save();
            ctx.translate(mx + 5, my + 6);
            ctx.rotate(angle);
            ctx.fillStyle = '#b0884c';
            ctx.fillRect(-1, -8, 2, 8);
            ctx.fillRect(-1, 0, 2, 8);
            ctx.fillRect(-8, -1, 8, 2);
            ctx.fillRect(0, -1, 8, 2);
            ctx.restore();

            // Golden shimmer on crops
            ctx.globalAlpha = 0.05 + Math.sin(Date.now() / 600) * 0.03;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(left + 4, top + 4, s - 8, s - 8);
            ctx.globalAlpha = 1;
        }
    }

    // Minimap color
    get minimapColor(): string {
        switch (this.nodeType) {
            case ResourceNodeType.Tree: return '#1a5520';
            case ResourceNodeType.GoldMine: return C.gold;
            case ResourceNodeType.StoneMine: return C.stone;
            case ResourceNodeType.BerryBush: return '#ff8800'; // Bright orange instead of red
            case ResourceNodeType.Farm: return '#8a7040';
            default: return '#888';
        }
    }
}
