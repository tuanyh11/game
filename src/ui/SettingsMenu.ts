// ============================================================
//  SettingsMenu — In-game pause/settings overlay
//  Warcraft-style dark panel with toggle switches, sliders
//  and exit-to-menu functionality
// ============================================================

import { C } from "../config/GameConfig";

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
        ctx.fillText('⚙️ CÀI ĐẶT', px + panelW / 2, py + 35);
        ctx.textAlign = 'left';

        // ---- Tab bar ----
        const tabY = py + 52;
        const tabW = panelW / 3 - 20;
        const tabs = [
            { label: '🎮 Trò Chơi', tab: SettingsTab.Game },
            { label: '🔊 Âm Thanh', tab: SettingsTab.Audio },
            { label: '🕹️ Điều Khiển', tab: SettingsTab.Controls },
        ];
        for (let i = 0; i < tabs.length; i++) {
            const tx = px + 15 + i * (tabW + 10);
            const isActive = this.activeTab === tabs[i].tab;
            const isHov = this.isHovered(tx, tabY, tabW, 28);

            ctx.fillStyle = isActive ? '#1e1a14' : (isHov ? '#161210' : '#0e0c0a');
            this.roundRect(ctx, tx, tabY, tabW, 28, 5);
            ctx.fill();
            ctx.strokeStyle = isActive ? C.uiBorderLight : (isHov ? '#665533' : '#2a2218');
            ctx.lineWidth = isActive ? 2 : 1;
            this.roundRect(ctx, tx, tabY, tabW, 28, 5);
            ctx.stroke();

            ctx.fillStyle = isActive ? C.uiBorderLight : '#887766';
            ctx.font = "bold 12px 'Inter', sans-serif";
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
        this.drawButton(ctx, resumeX, btnY, btnW, btnH, '▶ TIẾP TỤC', '#44aa44', true, () => {
            this.close();
            this.onResume?.();
        });

        // Exit button
        const exitX = px + panelW / 2 + gap / 2;
        this.drawButton(ctx, exitX, btnY, btnW, btnH, '🚪 THOÁT GAME', '#cc4444', true, () => {
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

        // Section: Hiển thị
        cy = this.drawSectionHeader(ctx, x, cy, 'HIỂN THỊ');

        // Toggle: Notifications
        cy = this.drawToggle(ctx, x, cy, w, 'Thông báo trong game', 'Hiện thông báo "Đang bị tấn công", "Lên đời"...',
            this.settings.notificationsEnabled, () => {
                this.settings.notificationsEnabled = !this.settings.notificationsEnabled;
                saveSettings(this.settings);
            });

        // Toggle: Show FPS
        cy = this.drawToggle(ctx, x, cy, w, 'Hiện FPS', 'Hiện số khung hình/giây ở góc trên phải',
            this.settings.showFPS, () => {
                this.settings.showFPS = !this.settings.showFPS;
                saveSettings(this.settings);
            });

        // Toggle: Fog of War
        const fogOn = this.fogEnabledGetter?.() ?? true;
        cy = this.drawToggle(ctx, x, cy, w, 'Sương mù chiến tranh', 'Bật/tắt fog of war trên bản đồ',
            fogOn, () => {
                this.onToggleFog?.();
            });

        // Section: Tốc độ game
        cy += 8;
        cy = this.drawSectionHeader(ctx, x, cy, 'TỐC ĐỘ GAME');

        const currentSpeed = this.gameSpeedGetter?.() ?? 1;
        const speeds = [0.5, 1, 1.5, 2, 3];
        const speedLabels = ['0.5x', '1x', '1.5x', '2x', '3x'];
        cy = this.drawSpeedSelector(ctx, x, cy, w, speeds, speedLabels, currentSpeed, (s) => {
            this.onSetSpeed?.(s);
        });

        // Section: Auto-save
        cy += 8;
        cy = this.drawSectionHeader(ctx, x, cy, 'KHÁC');

        cy = this.drawToggle(ctx, x, cy, w, 'Tự động lưu', 'Tự động lưu game mỗi 5 phút (sắp có)',
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

        cy = this.drawSectionHeader(ctx, x, cy, 'ÂM LƯỢNG');

        // Music volume slider
        cy = this.drawSlider(ctx, x, cy, w, '🎵 Nhạc nền', this.settings.musicVolume, (v) => {
            this.settings.musicVolume = v;
            saveSettings(this.settings);
        });

        // SFX volume slider
        cy = this.drawSlider(ctx, x, cy, w, '🔊 Hiệu ứng', this.settings.sfxVolume, (v) => {
            this.settings.sfxVolume = v;
            saveSettings(this.settings);
        });

        // Info note
        cy += 20;
        ctx.fillStyle = '#665544';
        ctx.font = "italic 11px 'Inter', sans-serif";
        ctx.fillText('💡 Hệ thống âm thanh sẽ được thêm trong bản cập nhật tới.', x, cy);
    }

    // =======================
    //  TAB: Controls
    // =======================
    private renderControlsTab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
        let cy = y;

        cy = this.drawSectionHeader(ctx, x, cy, 'PHÍM TẮT');

        const shortcuts: [string, string][] = [
            ['Esc', 'Mở/đóng menu cài đặt'],
            ['WASD / Mũi tên', 'Di chuyển camera'],
            ['Click trái', 'Chọn đơn vị / công trình'],
            ['Click phải', 'Di chuyển / Thu hoạch / Tấn công'],
            ['Kéo chuột trái', 'Chọn nhiều đơn vị'],
            ['Q W E R A S D F', 'Xây dựng / Huấn luyện'],
            ['F10', 'Mở menu cài đặt'],
            ['` (backtick)', 'Mở console lệnh'],
        ];

        for (const [key, desc] of shortcuts) {
            // Key badge
            const badgeW = Math.min(ctx.measureText(key).width + 16, 140);
            ctx.fillStyle = '#1a1510';
            this.roundRect(ctx, x, cy, badgeW, 26, 4);
            ctx.fill();
            ctx.strokeStyle = '#3a3020';
            ctx.lineWidth = 1;
            this.roundRect(ctx, x, cy, badgeW, 26, 4);
            ctx.stroke();

            ctx.fillStyle = C.uiHighlight;
            ctx.font = "bold 11px 'Inter', monospace";
            ctx.fillText(key, x + 8, cy + 17);

            // Description
            ctx.fillStyle = C.uiText;
            ctx.font = "12px 'Inter', sans-serif";
            ctx.fillText(desc, x + badgeW + 12, cy + 17);

            cy += 32;
        }

        // Scroll speed
        cy += 8;
        cy = this.drawSectionHeader(ctx, x, cy, 'TỐC ĐỘ CUỘN CAMERA');

        const scrollSpeeds = [1, 2, 3, 4, 5];
        const scrollLabels = ['Rất chậm', 'Chậm', 'Bình thường', 'Nhanh', 'Rất nhanh'];
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
        ctx.fillText('Bạn có chắc muốn thoát?', dx + dW / 2, dy + 65);

        ctx.fillStyle = C.uiTextDim;
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText('Tiến trình chưa lưu sẽ bị mất.', dx + dW / 2, dy + 85);
        ctx.textAlign = 'left';

        // Buttons
        const btnW2 = 130;
        const btnH2 = 36;
        const btnY2 = dy + dH - 55;

        // Cancel
        this.drawButton(ctx, dx + dW / 2 - btnW2 - 10, btnY2, btnW2, btnH2, '↩ Quay lại', '#888888', true, () => {
            this.confirmExit = false;
        });

        // Confirm exit
        this.drawButton(ctx, dx + dW / 2 + 10, btnY2, btnW2, btnH2, '🚪 Thoát', '#dd4444', true, () => {
            this.confirmExit = false;
            this.close();
            this.onExit?.();
        });
    }

    // =======================
    //  Drawing Helpers
    // =======================
    private drawOrnatePanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        // Outer black border
        ctx.fillStyle = '#050403';
        this.roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 10);
        ctx.fill();

        // Gold border
        ctx.strokeStyle = C.uiBorder;
        ctx.lineWidth = 2;
        this.roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 9);
        ctx.stroke();

        // Inner dark bg
        ctx.fillStyle = '#0d0b08';
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();

        // Subtle top gradient
        const grad = ctx.createLinearGradient(x, y, x, y + 60);
        grad.addColorStop(0, 'rgba(200,170,100,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x + 2, y + 2, w - 4, 56, 6);
        ctx.fill();

        // Gold corner dots
        const cs = 6;
        ctx.fillStyle = C.uiBorderLight;
        ctx.fillRect(x + 2, y + 2, cs, cs);
        ctx.fillRect(x + w - cs - 2, y + 2, cs, cs);
        ctx.fillRect(x + 2, y + h - cs - 2, cs, cs);
        ctx.fillRect(x + w - cs - 2, y + h - cs - 2, cs, cs);
    }

    private drawSectionHeader(ctx: CanvasRenderingContext2D, x: number, y: number, label: string): number {
        ctx.fillStyle = '#665544';
        ctx.font = "bold 10px 'Inter', sans-serif";
        ctx.letterSpacing = '2px';
        ctx.fillText(label, x, y + 10);
        ctx.letterSpacing = '0px';

        // Decorative line
        const labelW = ctx.measureText(label).width + 10;
        ctx.strokeStyle = '#2a2218';
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
            ctx.fillStyle = 'rgba(200,170,100,0.04)';
            this.roundRect(ctx, x - 4, y, 448, rowH, 4);
            ctx.fill();
        }

        // Label
        ctx.fillStyle = C.uiText;
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText(label, x + 6, y + 16);

        // Description
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "10px 'Inter', sans-serif";
        ctx.fillText(desc, x + 6, y + 30);

        // Toggle switch
        const swW = 44;
        const swH = 22;
        const swX = x + 400;
        const swY = y + 7;
        const swHov = this.isHovered(swX, swY, swW, swH);

        // Track
        const trackColor = value ? '#2a7744' : '#2a2218';
        ctx.fillStyle = trackColor;
        this.roundRect(ctx, swX, swY, swW, swH, swH / 2);
        ctx.fill();
        ctx.strokeStyle = value ? '#44aa66' : '#3a3020';
        ctx.lineWidth = swHov ? 2 : 1;
        this.roundRect(ctx, swX, swY, swW, swH, swH / 2);
        ctx.stroke();

        // Knob
        const knobR = (swH - 6) / 2;
        const knobX = value ? swX + swW - knobR - 4 : swX + knobR + 4;
        const knobY = swY + swH / 2;
        ctx.fillStyle = value ? '#88ee88' : '#666';
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow when on
        if (value) {
            ctx.shadowColor = '#44aa66';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(knobX, knobY, knobR - 1, 0, Math.PI * 2);
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
        ctx.fillStyle = C.uiText;
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText(label, x + 6, y + 16);

        ctx.fillStyle = C.uiHighlight;
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(`${Math.round(value)}%`, x + 400, y + 16);

        // Slider track
        const trackX = x + 6;
        const trackY = y + 26;
        const trackW = 430;
        const trackH = 6;

        ctx.fillStyle = '#1a1510';
        this.roundRect(ctx, trackX, trackY, trackW, trackH, 3);
        ctx.fill();
        ctx.strokeStyle = '#2a2218';
        ctx.lineWidth = 1;
        this.roundRect(ctx, trackX, trackY, trackW, trackH, 3);
        ctx.stroke();

        // Filled portion
        const fillW = (value / 100) * trackW;
        const grad = ctx.createLinearGradient(trackX, trackY, trackX + fillW, trackY);
        grad.addColorStop(0, '#8a6f3e');
        grad.addColorStop(1, C.uiBorderLight);
        ctx.fillStyle = grad;
        this.roundRect(ctx, trackX, trackY, fillW, trackH, 3);
        ctx.fill();

        // Knob
        const knobX2 = trackX + fillW;
        const knobY2 = trackY + trackH / 2;
        ctx.fillStyle = C.uiBorderLight;
        ctx.beginPath();
        ctx.arc(knobX2, knobY2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff8';
        ctx.lineWidth = 1;
        ctx.stroke();

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

            ctx.fillStyle = isActive ? '#1e2a18' : (isHov ? '#161210' : '#0e0c0a');
            this.roundRect(ctx, bx, y, btnW, btnH, 5);
            ctx.fill();

            ctx.strokeStyle = isActive ? '#44aa44' : (isHov ? '#665533' : '#2a2218');
            ctx.lineWidth = isActive ? 2 : 1;
            this.roundRect(ctx, bx, y, btnW, btnH, 5);
            ctx.stroke();

            ctx.fillStyle = isActive ? '#88ee88' : '#887766';
            ctx.font = "bold 11px 'Inter', sans-serif";
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
        ctx.fillStyle = isHov ? '#1e1a14' : '#0e0c0a';
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();

        // Border
        ctx.strokeStyle = isHov ? color : color + '88';
        ctx.lineWidth = isHov ? 2 : 1;
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.stroke();

        // Glow on hover
        if (isHov) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            this.roundRect(ctx, x, y, w, h, 6);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Label
        ctx.fillStyle = enabled ? color : '#444';
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2 + 5);
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
}
