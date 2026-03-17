// ============================================================
//  SettingsMenu — In-game pause/settings overlay
//  Warcraft-style dark panel with toggle switches, sliders
//  and exit-to-menu functionality
// ============================================================

import { C } from "../config/GameConfig";
import { t, getLang, setLang } from "../i18n/i18n";

// ---- Persisted Settings (saved to localStorage) ----
export interface GameSettingsData {
    notificationsEnabled: boolean;
    showFPS: boolean;
    musicVolume: number;       // 0-100
    sfxVolume: number;         // 0-100
    scrollSpeed: number;       // 1-5
    autoSave: boolean;
}

const SETTINGS_KEY = 'pixelEmpires_settings';

function loadSettings(): GameSettingsData {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return defaultSettings();
}

function saveSettings(s: GameSettingsData): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch { /* ignore */ }
}

function defaultSettings(): GameSettingsData {
    return {
        notificationsEnabled: true,
        showFPS: true,
        musicVolume: 70,
        sfxVolume: 80,
        scrollSpeed: 3,
        autoSave: false,
    };
}

// ---- Clickable area ----
interface Btn { x: number; y: number; w: number; h: number; action: () => void }

// ---- Tab enum ----
enum SettingsTab { Game, Audio, Controls }

export class SettingsMenu {
    visible = false;
    settings: GameSettingsData;

    private mouseX = 0;
    private mouseY = 0;
    private hovered = '';
    private activeTab = SettingsTab.Game;
    private buttons: Btn[] = [];
    private animTimer = 0;

    // Confirm exit dialog
    private confirmExit = false;

    // Callbacks
    private onExit: (() => void) | null = null;
    private onToggleFog: (() => void) | null = null;
    private onSetSpeed: ((speed: number) => void) | null = null;
    private onResume: (() => void) | null = null;
    private gameSpeedGetter: (() => number) | null = null;
    private fogEnabledGetter: (() => boolean) | null = null;
    private gamePausedGetter: (() => boolean) | null = null;

    constructor() {
        this.settings = loadSettings();
    }

    // ---- Wiring ----
    setCallbacks(opts: {
        onExit: () => void;
        onToggleFog: () => void;
        onSetSpeed: (speed: number) => void;
        onResume: () => void;
        getGameSpeed: () => number;
        getFogEnabled: () => boolean;
        getGamePaused: () => boolean;
    }): void {
        this.onExit = opts.onExit;
        this.onToggleFog = opts.onToggleFog;
        this.onSetSpeed = opts.onSetSpeed;
        this.onResume = opts.onResume;
        this.gameSpeedGetter = opts.getGameSpeed;
        this.fogEnabledGetter = opts.getFogEnabled;
        this.gamePausedGetter = opts.getGamePaused;
    }

    open(): void {
        this.visible = true;
        this.confirmExit = false;
        this.activeTab = SettingsTab.Game;
    }

    close(): void {
        this.visible = false;
        this.confirmExit = false;
        saveSettings(this.settings);
    }

    toggle(): void {
        if (this.visible) this.close();
        else this.open();
    }

    update(dt: number): void {
        this.animTimer += dt;
    }

    // ---- Input ----
    handleMouseMove(mx: number, my: number): void {
        this.mouseX = mx;
        this.mouseY = my;
    }

    /** Returns true if click was consumed */
    handleClick(mx: number, my: number): boolean {
        if (!this.visible) return false;
        // Search in reverse order to hit top-most elements (like Dialog buttons) first
        for (let i = this.buttons.length - 1; i >= 0; i--) {
            const btn = this.buttons[i];
            if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                btn.action();
                return true;
            }
        }
        // Click outside panel = do nothing (keep menu open)
        return true; // consume all clicks when menu is open
    }

    handleKeyDown(key: string): boolean {
        if (key === 'Escape') {
            if (this.confirmExit) {
                this.confirmExit = false;
                return true;
            }
            if (this.visible) {
                this.close();
                this.onResume?.();
                return true;
            }
        }
        return false;
    }

    // ---- Render ----
    render(ctx: CanvasRenderingContext2D, vpW: number, vpH: number): void {
        if (!this.visible) return;
        this.buttons = [];

        // ---- Full-screen dim overlay ----
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, vpW, vpH);

        // ---- Panel dimensions ----
        const panelW = Math.min(520, vpW - 40);
        const panelH = Math.min(480, vpH - 40);
        const px = (vpW - panelW) / 2;
        const py = (vpH - panelH) / 2;

        // ---- Panel background with ornate border ----
        this.drawOrnatePanel(ctx, px, py, panelW, panelH);

        // ---- Title ----
        ctx.fillStyle = C.uiBorderLight;
        ctx.font = "bold 22px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(t('settings.title'), px + panelW / 2, py + 35);
        ctx.textAlign = 'left';

        // ---- Tab bar ----
        const tabY = py + 52;
        const tabW = panelW / 3 - 20;
        const tabs = [
            { label: t('settings.tabGame'), tab: SettingsTab.Game },
            { label: t('settings.tabAudio'), tab: SettingsTab.Audio },
            { label: t('settings.tabControls'), tab: SettingsTab.Controls },
        ];
        for (let i = 0; i < tabs.length; i++) {
            const tx = px + 15 + i * (tabW + 10);
            const isActive = this.activeTab === tabs[i].tab;
            const isHov = this.isHovered(tx, tabY, tabW, 28);

            ctx.fillStyle = isActive ? C.uiBgInner : (isHov ? C.uiButtonHover : 'transparent');
            this.roundRect(ctx, tx, tabY, tabW, 28, 4);
            ctx.fill();
            
            // Bottom accent for active tab
            if (isActive) {
                ctx.fillStyle = C.uiBorderLight;
                ctx.fillRect(tx, tabY + 26, tabW, 2);
            } else if (isHov) {
                ctx.fillStyle = C.uiBorder;
                ctx.fillRect(tx, tabY + 26, tabW, 2);
            }

            ctx.fillStyle = isActive ? C.uiTextBright : C.uiTextDim;
            ctx.font = "600 12px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(tabs[i].label, tx + tabW / 2, tabY + 18);
            ctx.textAlign = 'left';

            this.buttons.push({
                x: tx, y: tabY, w: tabW, h: 28,
                action: () => { this.activeTab = tabs[i].tab; },
            });
        }

        // ---- Tab content ----
        const contentY = tabY + 42;
        const contentX = px + 20;
        const contentW = panelW - 40;

        switch (this.activeTab) {
            case SettingsTab.Game:
                this.renderGameTab(ctx, contentX, contentY, contentW, px, py, panelW, panelH);
                break;
            case SettingsTab.Audio:
                this.renderAudioTab(ctx, contentX, contentY, contentW);
                break;
            case SettingsTab.Controls:
                this.renderControlsTab(ctx, contentX, contentY, contentW);
                break;
        }

        // ---- Bottom buttons (Resume + Exit) ----
        const btnY = py + panelH - 58;
        const btnW = 160;
        const btnH = 40;
        const gap = 20;

        // Resume button
        const resumeX = px + panelW / 2 - btnW - gap / 2;
        this.drawButton(ctx, resumeX, btnY, btnW, btnH, t('settings.resume'), C.uiTextGreen, true, () => {
            this.close();
            this.onResume?.();
        });

        // Exit button
        const exitX = px + panelW / 2 + gap / 2;
        this.drawButton(ctx, exitX, btnY, btnW, btnH, t('settings.exit'), C.uiTextRed, true, () => {
            this.confirmExit = true;
        });

        // ---- Confirm Exit Dialog ----
        if (this.confirmExit) {
            this.renderConfirmDialog(ctx, vpW, vpH);
        }
    }

    // =======================
    //  TAB: Game Settings
    // =======================
    private renderGameTab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _px: number, _py: number, _pw: number, _ph: number): void {
        let cy = y;

        // Section: Language
        cy = this.drawSectionHeader(ctx, x, cy, t('settings.language'));
        cy = this.drawLanguageSelector(ctx, x, cy, w);
        cy += 8;

        // Section: Display
        cy = this.drawSectionHeader(ctx, x, cy, t('settings.display'));

        // Toggle: Notifications
        cy = this.drawToggle(ctx, x, cy, w, t('settings.notifications'), t('settings.notifications.desc'),
            this.settings.notificationsEnabled, () => {
                this.settings.notificationsEnabled = !this.settings.notificationsEnabled;
                saveSettings(this.settings);
            });

        // Toggle: Show FPS
        cy = this.drawToggle(ctx, x, cy, w, t('settings.showFPS'), t('settings.showFPS.desc'),
            this.settings.showFPS, () => {
                this.settings.showFPS = !this.settings.showFPS;
                saveSettings(this.settings);
            });

        // Toggle: Fog of War
        const fogOn = this.fogEnabledGetter?.() ?? true;
        cy = this.drawToggle(ctx, x, cy, w, t('settings.fog'), t('settings.fog.desc'),
            fogOn, () => {
                this.onToggleFog?.();
            });

        // Section: Game Speed
        cy += 8;
        cy = this.drawSectionHeader(ctx, x, cy, t('settings.gameSpeed'));

        const currentSpeed = this.gameSpeedGetter?.() ?? 1;
        const speeds = [0.5, 1, 1.5, 2, 3];
        const speedLabels = ['0.5x', '1x', '1.5x', '2x', '3x'];
        cy = this.drawSpeedSelector(ctx, x, cy, w, speeds, speedLabels, currentSpeed, (s) => {
            this.onSetSpeed?.(s);
        });

        // Section: Other
        cy += 8;
        cy = this.drawSectionHeader(ctx, x, cy, t('settings.other'));

        cy = this.drawToggle(ctx, x, cy, w, t('settings.autoSave'), t('settings.autoSave.desc'),
            this.settings.autoSave, () => {
                this.settings.autoSave = !this.settings.autoSave;
                saveSettings(this.settings);
            });
    }

    // =======================
    //  TAB: Audio
    // =======================
    private renderAudioTab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
        let cy = y;

        cy = this.drawSectionHeader(ctx, x, cy, t('settings.volume'));

        // Music volume slider
        cy = this.drawSlider(ctx, x, cy, w, t('settings.music'), this.settings.musicVolume, (v) => {
            this.settings.musicVolume = v;
            saveSettings(this.settings);
        });

        // SFX volume slider
        cy = this.drawSlider(ctx, x, cy, w, t('settings.sfx'), this.settings.sfxVolume, (v) => {
            this.settings.sfxVolume = v;
            saveSettings(this.settings);
        });

        // Info note
        cy += 20;
        ctx.fillStyle = '#665544';
        ctx.font = "italic 11px 'Inter', sans-serif";
        ctx.fillText(t('settings.audioNote'), x, cy);
    }

    // =======================
    //  TAB: Controls
    // =======================
    private renderControlsTab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
        let cy = y;

        cy = this.drawSectionHeader(ctx, x, cy, t('settings.shortcuts'));

        const shortcuts: [string, string][] = [
            ['Esc', t('shortcut.esc')],
            ['WASD / Arrows', t('shortcut.wasd')],
            ['Left Click', t('shortcut.leftClick')],
            ['Right Click', t('shortcut.rightClick')],
            ['Drag Left', t('shortcut.drag')],
            ['Q W E R A S D F', t('shortcut.build')],
            ['F10', t('shortcut.f10')],
            ['` (backtick)', t('shortcut.console')],
        ];

        for (const [key, desc] of shortcuts) {
            // Key badge
            const badgeW = Math.min(ctx.measureText(key).width + 16, 140);
            ctx.fillStyle = C.uiButton;
            this.roundRect(ctx, x, cy, badgeW, 26, 4);
            ctx.fill();
            ctx.strokeStyle = C.uiBorder;
            ctx.lineWidth = 1;
            this.roundRect(ctx, x, cy, badgeW, 26, 4);
            ctx.stroke();

            ctx.fillStyle = C.uiTextBright;
            ctx.font = "600 11px 'Inter', monospace";
            ctx.fillText(key, x + 8, cy + 17);

            // Description
            ctx.fillStyle = C.uiTextDim;
            ctx.font = "12px 'Inter', sans-serif";
            ctx.fillText(desc, x + badgeW + 12, cy + 17);

            cy += 32;
        }

        // Scroll speed
        cy += 8;
        cy = this.drawSectionHeader(ctx, x, cy, t('settings.scrollSpeed'));

        const scrollSpeeds = [1, 2, 3, 4, 5];
        const scrollLabels = [t('scroll.verySlow'), t('scroll.slow'), t('scroll.normal'), t('scroll.fast'), t('scroll.veryFast')];
        cy = this.drawSpeedSelector(ctx, x, cy, w, scrollSpeeds, scrollLabels, this.settings.scrollSpeed, (s) => {
            this.settings.scrollSpeed = s;
            saveSettings(this.settings);
        });
    }

    // =======================
    //  Confirm Exit Dialog
    // =======================
    private renderConfirmDialog(ctx: CanvasRenderingContext2D, vpW: number, vpH: number): void {
        // Extra dim
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, vpW, vpH);

        const dW = 360;
        const dH = 180;
        const dx = (vpW - dW) / 2;
        const dy = (vpH - dH) / 2;

        this.drawOrnatePanel(ctx, dx, dy, dW, dH);

        // Warning icon
        ctx.fillStyle = '#dd4444';
        ctx.font = "28px sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', dx + dW / 2, dy + 40);

        // Message
        ctx.fillStyle = C.uiText;
        ctx.font = "bold 14px 'Inter', sans-serif";
        ctx.fillText(t('settings.confirmExit'), dx + dW / 2, dy + 65);

        ctx.fillStyle = C.uiTextDim;
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText(t('settings.unsaved'), dx + dW / 2, dy + 85);
        ctx.textAlign = 'left';

        // Buttons
        const btnW2 = 130;
        const btnH2 = 36;
        const btnY2 = dy + dH - 55;

        // Cancel
        this.drawButton(ctx, dx + dW / 2 - btnW2 - 10, btnY2, btnW2, btnH2, t('settings.cancel'), C.uiTextDim, true, () => {
            this.confirmExit = false;
        });

        // Confirm exit
        this.drawButton(ctx, dx + dW / 2 + 10, btnY2, btnW2, btnH2, t('settings.confirmBtn'), C.uiTextRed, true, () => {
            this.confirmExit = false;
            this.close();
            this.onExit?.();
        });
    }

    // =======================
    //  Drawing Helpers
    // =======================
    private drawOrnatePanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        // Glassmorphism background
        const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
        bgGrad.addColorStop(0, 'rgba(22, 22, 26, 0.98)');
        bgGrad.addColorStop(1, 'rgba(26, 26, 30, 0.92)');
        ctx.fillStyle = bgGrad;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();

        // Thin outer border
        ctx.strokeStyle = C.uiBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.stroke();
        
        // Inner crisp highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 7);
        ctx.stroke();

        // Subtle top gradient glow (crimson)
        const grad = ctx.createLinearGradient(x, y, x, y + 80);
        grad.addColorStop(0, 'rgba(194,24,91,0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x + 1, y + 1, w - 2, 78, 7);
        ctx.fill();
    }

    private drawSectionHeader(ctx: CanvasRenderingContext2D, x: number, y: number, label: string): number {
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "600 10px 'Inter', sans-serif";
        ctx.letterSpacing = '2px';
        ctx.fillText(label, x, y + 10);
        ctx.letterSpacing = '0px';

        // Decorative line
        const labelW = ctx.measureText(label).width + 10;
        ctx.strokeStyle = C.uiBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + labelW, y + 6);
        ctx.lineTo(x + 440, y + 6);
        ctx.stroke();

        return y + 22;
    }

    private drawToggle(ctx: CanvasRenderingContext2D, x: number, y: number, _w: number,
        label: string, desc: string, value: boolean, onToggle: () => void): number {
        const rowH = 36;
        const isHov = this.isHovered(x, y, 440, rowH);

        // Hover highlight
        if (isHov) {
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            this.roundRect(ctx, x - 4, y, 448, rowH, 4);
            ctx.fill();
        }

        // Label
        ctx.fillStyle = C.uiTextBright;
        ctx.font = "600 13px 'Inter', sans-serif";
        ctx.fillText(label, x + 6, y + 16);

        // Description
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillText(desc, x + 6, y + 30);

        // Toggle switch
        const swW = 36;
        const swH = 18;
        const swX = x + 400;
        const swY = y + 9;
        const swHov = this.isHovered(swX, swY, swW, swH);

        // Track
        ctx.fillStyle = value ? C.uiBorderLight : C.uiButton;
        this.roundRect(ctx, swX, swY, swW, swH, swH / 2);
        ctx.fill();
        
        ctx.strokeStyle = value ? C.uiBorderLight : C.uiBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, swX, swY, swW, swH, swH / 2);
        ctx.stroke();

        // Knob
        const knobR = (swH - 4) / 2;
        const knobX = value ? swX + swW - knobR - 2 : swX + knobR + 2;
        const knobY = swY + swH / 2;
        ctx.fillStyle = value ? '#fff' : C.uiTextDim;
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow when on
        if (value) {
            ctx.shadowColor = C.uiBorderLight;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        this.buttons.push({ x: swX - 10, y: swY - 5, w: swW + 20, h: swH + 10, action: onToggle });

        return y + rowH + 4;
    }

    private drawSlider(ctx: CanvasRenderingContext2D, x: number, y: number, _w: number,
        label: string, value: number, onChange: (v: number) => void): number {
        const rowH = 40;

        // Label + value
        ctx.fillStyle = C.uiTextBright;
        ctx.font = "600 13px 'Inter', sans-serif";
        ctx.fillText(label, x + 6, y + 16);

        ctx.fillStyle = C.uiBorderLight;
        ctx.font = "600 12px 'Inter', sans-serif";
        ctx.fillText(`${Math.round(value)}%`, x + 400, y + 16);

        // Slider track
        const trackX = x + 6;
        const trackY = y + 26;
        const trackW = 430;
        const trackH = 4;

        ctx.fillStyle = C.uiButtonHover;
        this.roundRect(ctx, trackX, trackY, trackW, trackH, 2);
        ctx.fill();

        // Filled portion
        const fillW = (value / 100) * trackW;
        ctx.fillStyle = C.uiBorderLight;
        this.roundRect(ctx, trackX, trackY, fillW, trackH, 2);
        ctx.fill();

        // Knob
        const knobX2 = trackX + fillW;
        const knobY2 = trackY + trackH / 2;
        ctx.fillStyle = C.uiTextBright;
        ctx.beginPath();
        ctx.arc(knobX2, knobY2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Clickable track area (calculate value from click position)
        this.buttons.push({
            x: trackX, y: trackY - 10, w: trackW, h: 26,
            action: () => {
                const clickX = this.mouseX - trackX;
                const newVal = Math.max(0, Math.min(100, Math.round((clickX / trackW) * 100)));
                onChange(newVal);
            },
        });

        return y + rowH + 4;
    }

    private drawSpeedSelector(ctx: CanvasRenderingContext2D, x: number, y: number, _w: number,
        values: number[], labels: string[], current: number, onSelect: (v: number) => void): number {
        const btnW = 80;
        const btnH = 28;
        const gap = 6;
        const startX = x + 6;

        for (let i = 0; i < values.length; i++) {
            const bx = startX + i * (btnW + gap);
            const isActive = Math.abs(current - values[i]) < 0.01;
            const isHov = this.isHovered(bx, y, btnW, btnH);

            ctx.fillStyle = isActive ? C.uiButtonHover : (isHov ? C.uiButton : 'transparent');
            this.roundRect(ctx, bx, y, btnW, btnH, 4);
            ctx.fill();

            ctx.strokeStyle = isActive ? C.uiBorderLight : C.uiBorder;
            ctx.lineWidth = 1;
            this.roundRect(ctx, bx, y, btnW, btnH, 4);
            ctx.stroke();

            ctx.fillStyle = isActive ? C.uiTextBright : C.uiTextDim;
            ctx.font = "600 11px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], bx + btnW / 2, y + 18);
            ctx.textAlign = 'left';

            const val = values[i];
            this.buttons.push({ x: bx, y, w: btnW, h: btnH, action: () => onSelect(val) });
        }

        return y + btnH + 8;
    }

    private drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
        label: string, color: string, enabled: boolean, action: () => void): void {
        const isHov = enabled && this.isHovered(x, y, w, h);

        // Background
        ctx.fillStyle = isHov ? C.uiButtonHover : C.uiButton;
        this.roundRect(ctx, x, y, w, h, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = isHov ? color : C.uiBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 4);
        ctx.stroke();

        // Label
        ctx.fillStyle = enabled ? (isHov ? color : C.uiTextDim) : '#444';
        ctx.font = "600 12px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2 + 4);
        ctx.textAlign = 'left';

        if (enabled) {
            this.buttons.push({ x, y, w, h, action });
        }
    }

    private isHovered(x: number, y: number, w: number, h: number): boolean {
        return this.mouseX >= x && this.mouseX <= x + w && this.mouseY >= y && this.mouseY <= y + h;
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ---- Language Selector ----
    private drawLanguageSelector(ctx: CanvasRenderingContext2D, x: number, y: number, _w: number): number {
        const btnW = 100;
        const btnH = 28;
        const gap = 8;
        const currentLang = getLang();
        const langs: { code: 'vi' | 'en'; label: string }[] = [
            { code: 'vi', label: '🇻🇳 Tiếng Việt' },
            { code: 'en', label: '🇬🇧 English' },
        ];

        for (let i = 0; i < langs.length; i++) {
            const bx = x + 6 + i * (btnW + gap);
            const isActive = currentLang === langs[i].code;
            const isHov = this.isHovered(bx, y, btnW, btnH);

            ctx.fillStyle = isActive ? C.uiButtonHover : (isHov ? C.uiButton : 'transparent');
            this.roundRect(ctx, bx, y, btnW, btnH, 4);
            ctx.fill();

            ctx.strokeStyle = isActive ? C.uiBorderLight : C.uiBorder;
            ctx.lineWidth = isActive ? 1.5 : 1;
            this.roundRect(ctx, bx, y, btnW, btnH, 4);
            ctx.stroke();

            ctx.fillStyle = isActive ? C.uiTextBright : C.uiTextDim;
            ctx.font = "600 11px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(langs[i].label, bx + btnW / 2, y + 18);
            ctx.textAlign = 'left';

            const langCode = langs[i].code;
            this.buttons.push({ x: bx, y, w: btnW, h: btnH, action: () => setLang(langCode) });
        }

        return y + btnH + 8;
    }
}
