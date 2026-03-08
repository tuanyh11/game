// ============================================================
//  ParticleSystem — Visual effects for construction & gathering
// ============================================================

import { FogOfWar } from "../systems/FogOfWar";

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    size: number;
    color: string;
    gravity: number;
    rotation: number;
    rotSpeed: number;
    shape: 'rect' | 'circle' | 'star' | 'spear' | 'sword' | 'arrow';
}

export interface EmitConfig {
    x: number; y: number;
    count: number;
    spread?: number; // positional randomness
    speed: [number, number];
    angle: [number, number]; // radians
    life: [number, number];
    size: [number, number];
    colors: string[];
    gravity?: number;
    shape?: 'rect' | 'circle' | 'star' | 'spear' | 'sword' | 'arrow';
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private maxParticles = 2500;

    // ---- Generic emit ----
    emit(cfg: EmitConfig): void {
        const spread = cfg.spread ?? 6;
        for (let i = 0; i < cfg.count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = lerp(cfg.angle[0], cfg.angle[1], Math.random());
            const speed = lerp(cfg.speed[0], cfg.speed[1], Math.random());
            const life = lerp(cfg.life[0], cfg.life[1], Math.random());
            const size = lerp(cfg.size[0], cfg.size[1], Math.random());
            this.particles.push({
                x: cfg.x + (Math.random() - 0.5) * spread,
                y: cfg.y + (Math.random() - 0.5) * spread,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life, maxLife: life, size,
                color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
                gravity: cfg.gravity ?? 0,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 8,
                shape: cfg.shape ?? 'rect',
            });
        }
    }

    // ============================================================
    //  PRESET EFFECTS
    // ============================================================

    /** Wood chips when chopping trees */
    emitWoodChips(x: number, y: number): void {
        this.emit({
            x, y: y - 8, count: 4, spread: 10,
            speed: [50, 130], angle: [-Math.PI * 0.9, -Math.PI * 0.1],
            life: [0.3, 0.8], size: [2, 5],
            colors: ['#8B5E3C', '#A0784C', '#6a4420', '#c9a84c', '#d4b06a'],
            gravity: 250, shape: 'rect',
        });
    }

    /** Gold sparkles when mining gold */
    emitGoldSparkle(x: number, y: number): void {
        this.emit({
            x, y: y - 6, count: 5, spread: 14,
            speed: [20, 70], angle: [-Math.PI * 0.85, -Math.PI * 0.15],
            life: [0.4, 1.0], size: [1.5, 4],
            colors: ['#ffd700', '#ffec6e', '#fff', '#f0c030', '#ffe066'],
            gravity: 60, shape: 'star',
        });
    }

    /** Stone/rock chips */
    emitStoneChips(x: number, y: number): void {
        this.emit({
            x, y: y - 6, count: 4, spread: 12,
            speed: [60, 140], angle: [-Math.PI * 0.85, -Math.PI * 0.15],
            life: [0.25, 0.6], size: [2, 5],
            colors: ['#8899aa', '#667788', '#aabbcc', '#99aabc', '#556677'],
            gravity: 320, shape: 'rect',
        });
    }

    /** Berry bush picking */
    emitBerryPick(x: number, y: number): void {
        this.emit({
            x, y: y - 4, count: 3, spread: 8,
            speed: [15, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
            life: [0.3, 0.6], size: [2, 4],
            colors: ['#dd3344', '#228830', '#55aa33', '#cc2244', '#44bb44'],
            gravity: 120, shape: 'circle',
        });
    }

    /** Farm harvesting */
    emitFarmHarvest(x: number, y: number): void {
        this.emit({
            x, y: y - 4, count: 2, spread: 16,
            speed: [10, 25], angle: [-Math.PI * 0.7, -Math.PI * 0.3],
            life: [0.4, 0.7], size: [2, 3],
            colors: ['#88aa30', '#6a8820', '#aacc40'],
            gravity: 80, shape: 'rect',
        });
    }

    /** Construction dust particles */
    emitConstructionDust(x: number, y: number, w: number, h: number): void {
        this.emit({
            x: x + Math.random() * w, y: y + h - 10, count: 3, spread: 20,
            speed: [15, 50], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
            life: [0.6, 1.4], size: [3, 7],
            colors: ['#a09070', '#c2b280', '#8a7840', '#b0a070', '#d0c090'],
            gravity: 25, shape: 'circle',
        });
    }

    /** Construction hammer hit sparks */
    emitHammerSpark(x: number, y: number): void {
        this.emit({
            x, y, count: 6, spread: 4,
            speed: [40, 100], angle: [-Math.PI, 0],
            life: [0.15, 0.4], size: [1.5, 3],
            colors: ['#ffa500', '#ff8800', '#ffcc00', '#fff', '#ff6600'],
            gravity: 100, shape: 'circle',
        });
    }

    /** Build complete celebration burst */
    emitBuildComplete(x: number, y: number, w: number, h: number): void {
        this.emit({
            x: x + w / 2, y: y + h / 2, count: 25, spread: w * 0.6,
            speed: [50, 180], angle: [0, Math.PI * 2],
            life: [0.5, 1.5], size: [3, 6],
            colors: ['#ffd700', '#fff', '#ffec6e', '#ffa500', '#88ff66'],
            gravity: 80, shape: 'star',
        });
        // Dust ring
        this.emit({
            x: x + w / 2, y: y + h, count: 12, spread: w * 0.4,
            speed: [30, 80], angle: [-Math.PI * 0.9, -Math.PI * 0.1],
            life: [0.8, 1.8], size: [4, 8],
            colors: ['#c2b280', '#a09070', '#d4c898'],
            gravity: 15, shape: 'circle',
        });
    }

    /** Building hit — stone/wood debris flying out */
    emitBuildingHit(x: number, y: number): void {
        // Stone/wood debris
        this.emit({
            x, y, count: 6, spread: 12,
            speed: [60, 160], angle: [-Math.PI * 0.9, -Math.PI * 0.1],
            life: [0.2, 0.6], size: [2, 5],
            colors: ['#8a7a60', '#6a5a40', '#5a4a30', '#aa9a80', '#9a8a70'],
            gravity: 280, shape: 'rect',
        });
        // Sparks
        this.emit({
            x, y, count: 4, spread: 6,
            speed: [40, 120], angle: [-Math.PI, 0],
            life: [0.1, 0.35], size: [1.5, 3],
            colors: ['#ff6600', '#ffcc00', '#fff', '#ff8800'],
            gravity: 80, shape: 'circle',
        });
        // Dust cloud
        this.emit({
            x, y: y + 4, count: 3, spread: 16,
            speed: [10, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
            life: [0.4, 1.0], size: [4, 8],
            colors: ['#a09070', '#c2b280', '#8a7840'],
            gravity: 10, shape: 'circle',
        });
    }

    /** Building on fire — flames licking upward */
    emitBuildingFire(x: number, y: number, w: number, h: number): void {
        const fx = x + Math.random() * w;
        const fy = y + h * 0.3 + Math.random() * h * 0.5;
        this.emit({
            x: fx, y: fy, count: 3, spread: 6,
            speed: [20, 60], angle: [-Math.PI * 0.7, -Math.PI * 0.3],
            life: [0.3, 0.8], size: [3, 7],
            colors: ['#ff4400', '#ff6600', '#ffaa00', '#ffcc00', '#ff2200'],
            gravity: -60, shape: 'circle',
        });
        // Smoke
        this.emit({
            x: fx, y: fy - 8, count: 2, spread: 8,
            speed: [8, 25], angle: [-Math.PI * 0.6, -Math.PI * 0.4],
            life: [0.6, 1.5], size: [4, 9],
            colors: ['#333', '#444', '#555', '#222'],
            gravity: -30, shape: 'circle',
        });
    }

    /** Building destruction explosion */
    emitBuildingDestroyed(x: number, y: number, w: number, h: number): void {
        // Big explosion burst
        this.emit({
            x: x + w / 2, y: y + h / 2, count: 30, spread: w * 0.5,
            speed: [60, 200], angle: [0, Math.PI * 2],
            life: [0.4, 1.2], size: [3, 8],
            colors: ['#ff4400', '#ff6600', '#ffaa00', '#ffcc00', '#fff', '#ff2200'],
            gravity: 60, shape: 'circle',
        });
        // Flying debris
        this.emit({
            x: x + w / 2, y: y + h / 2, count: 20, spread: w * 0.4,
            speed: [80, 220], angle: [0, Math.PI * 2],
            life: [0.3, 0.9], size: [3, 7],
            colors: ['#8a7a60', '#6a5a40', '#5a4a30', '#3a2a18', '#7a6a50'],
            gravity: 300, shape: 'rect',
        });
        // Smoke column
        this.emit({
            x: x + w / 2, y: y + h / 3, count: 15, spread: w * 0.4,
            speed: [15, 50], angle: [-Math.PI * 0.7, -Math.PI * 0.3],
            life: [1.0, 2.5], size: [6, 14],
            colors: ['#333', '#444', '#555', '#222', '#1a1a1a'],
            gravity: -40, shape: 'circle',
        });
        // Ground dust ring
        this.emit({
            x: x + w / 2, y: y + h, count: 10, spread: w * 0.6,
            speed: [30, 100], angle: [-0.3, Math.PI + 0.3],
            life: [0.6, 1.5], size: [4, 10],
            colors: ['#c2b280', '#a09070', '#d4c898'],
            gravity: 20, shape: 'circle',
        });
    }

    /** Resource drop-off splash */
    emitDropOff(x: number, y: number, color: string): void {
        this.emit({
            x, y: y - 10, count: 6, spread: 8,
            speed: [30, 80], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
            life: [0.3, 0.7], size: [2, 4],
            colors: [color, '#fff', color],
            gravity: 100, shape: 'circle',
        });
    }

    // ============================================================
    //  UPDATE & RENDER
    // ============================================================

    update(dt: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                // Swap-remove for performance
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
                continue;
            }
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotSpeed * dt;
        }
    }

    /** Render particles, optionally with viewport culling */
    render(ctx: CanvasRenderingContext2D, camX?: number, camY?: number, vpW?: number, vpH?: number, fog?: FogOfWar | null): void {
        const hasViewport = camX !== undefined && camY !== undefined && vpW !== undefined && vpH !== undefined;
        const margin = 20;

        for (const p of this.particles) {
            // Viewport culling for world-space particles
            if (hasViewport) {
                if (p.x < camX! - margin || p.x > camX! + vpW! + margin ||
                    p.y < camY! - margin || p.y > camY! + vpH! + margin) continue;
            }

            // Fog Of War culling
            if (fog && !fog.isVisible(p.x, p.y)) continue;

            const alpha = Math.min(1, p.life / p.maxLife * 2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            switch (p.shape) {
                case 'rect':
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                    break;

                case 'spear': {
                    // Detailed Roman Pilum Rendering
                    // The particle velocity or explicit angle defines the orientation
                    const spearAngle = p.vx !== 0 || p.vy !== 0 ? Math.atan2(p.vy, p.vx) : p.rotation;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(spearAngle);

                    // The Pilum is roughly 30px long in total
                    // Wooden shaft (back half)
                    ctx.fillStyle = '#6a4a2a';
                    ctx.fillRect(-15, -1.5, 14, 3);

                    // Iron shank (front half - thin neck)
                    ctx.fillStyle = '#a0a8b8';
                    ctx.fillRect(-1, -0.5, 12, 1);

                    // Weight block (where wood meets iron)
                    ctx.fillStyle = '#4a3a2a';
                    ctx.fillRect(-3, -2, 3, 4);
                    ctx.fillStyle = '#8a8888';
                    ctx.fillRect(-2, -2.5, 1, 5);

                    // Spearhead
                    ctx.fillStyle = '#ccc';
                    ctx.beginPath();
                    ctx.moveTo(17, 0); // Tip
                    ctx.lineTo(11, -2);
                    ctx.lineTo(11, 2);
                    ctx.closePath();
                    ctx.fill();

                    // Head shine
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(12, 0, 4, 0.5);

                    ctx.restore();
                    break;
                }
                case 'arrow': {
                    // Eastern/Medieval Arrow Rendering
                    const arrowAngle = p.vx !== 0 || p.vy !== 0 ? Math.atan2(p.vy, p.vx) : p.rotation;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(arrowAngle);

                    // Shaft
                    ctx.fillStyle = '#aa9060';
                    ctx.fillRect(-6, -0.5, 12, 1);

                    // Arrowhead
                    ctx.fillStyle = '#eee';
                    ctx.beginPath();
                    ctx.moveTo(6, -1.5);
                    ctx.lineTo(9, 0);
                    ctx.lineTo(6, 1.5);
                    ctx.closePath();
                    ctx.fill();

                    // Fletching (feathers)
                    ctx.fillStyle = p.color; // Use the particle color for the fletching
                    ctx.fillRect(-7, -1.5, 3, 3);

                    ctx.restore();
                    break;
                }
                case 'sword': {
                    // Eastern falling sword rendering
                    const swordAngle = Math.atan2(p.vy, p.vx); // Use the falling vector
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(swordAngle);

                    // P is the center of the sword. The blade points towards +X (right).
                    // Pommel
                    ctx.fillStyle = '#FFC107'; // Gold
                    ctx.beginPath();
                    ctx.arc(-18, 0, 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Handle constraint
                    ctx.fillStyle = '#795548'; // Wood/leather grip
                    ctx.fillRect(-16, -1.5, 8, 3);

                    // Crossguard (Kiếm cách)
                    ctx.fillStyle = '#FFC107'; // Gold
                    ctx.fillRect(-9, -4.5, 2, 9);

                    // Main Blade
                    ctx.fillStyle = '#E0DFDF'; // Silver
                    ctx.beginPath();
                    ctx.moveTo(-7, -2);
                    ctx.lineTo(15, -1.5);
                    ctx.lineTo(20, 0); // Tip of sword
                    ctx.lineTo(15, 1.5);
                    ctx.lineTo(-7, 2);
                    ctx.fill();

                    // Blade fuller (rãnh máu) / Shine line
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(-7, -0.5, 20, 1);

                    ctx.restore();
                    break;
                }

                case 'circle':
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'star':
                    this.drawStar(ctx, p.x, p.y, p.size, p.rotation);
                    break;
            }
        }
        ctx.globalAlpha = 1;
    }

    private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number): void {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        // 4-pointed star (diamond cross)
        const s = size / 2;
        ctx.fillRect(-s, -1, size, 2);
        ctx.fillRect(-1, -s, 2, size);
        ctx.restore();
    }

    get count(): number { return this.particles.length; }
}
