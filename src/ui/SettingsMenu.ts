// ============================================================
//  SettingsMenu — In-game pause/settings overlay (HTML/CSS)
//  Warcraft-style dark panel with toggle switches, sliders
//  and exit-to-menu functionality
// ============================================================

import { t, getLang, setLang } from "../i18n/i18n";

// ---- Persisted Settings (saved to localStorage) ----
export interface GameSettingsData {
    notificationsEnabled: boolean;
    showFPS: boolean;
    musicVolume: number;       // 0-100
    sfxVolume: number;         // 0-100
    scrollSpeed: number;       // 1-5
    autoSave: boolean;
    edgeScroll: boolean;
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
        edgeScroll: false,
    };
}

// ---- Tab enum ----
enum SettingsTab { Game, Audio, Controls }

export class SettingsMenu {
    visible = false;
    settings: GameSettingsData;

    private activeTab = SettingsTab.Game;
    private confirmExit = false;

    // Callbacks
    private onExit: (() => void) | null = null;
    private onToggleFog: (() => void) | null = null;
    private onSetSpeed: ((speed: number) => void) | null = null;
    private onResume: (() => void) | null = null;
    private gameSpeedGetter: (() => number) | null = null;
    private fogEnabledGetter: (() => boolean) | null = null;
    private gamePausedGetter: (() => boolean) | null = null;

    // DOM Elements
    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private contentBody: HTMLDivElement;

    constructor() {
        this.settings = loadSettings();
        this.overlay = document.createElement('div');
        this.panel = document.createElement('div');
        this.contentBody = document.createElement('div');
        this.initDOM();
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
        this.overlay.style.display = 'flex';
        this.rebuildDOM();
    }

    close(): void {
        this.visible = false;
        this.confirmExit = false;
        this.overlay.style.display = 'none';
        saveSettings(this.settings);
    }

    destroy(): void {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }

    toggle(): void {
        if (this.visible) this.close();
        else this.open();
    }

    // Empty updates to satisfy Game.ts compatibility
    update(_dt: number): void { }
    handleMouseMove(_mx: number, _my: number): void { }
    
    /** Returns true if click was consumed (always true if visible because DOM blocks it, but for Canvas logic) */
    handleClick(_mx: number, _my: number): boolean {
        return this.visible;
    }
    
    handleKeyDown(key: string): boolean {
        if (!this.visible) return false;

        if (key === 'Escape') {
            if (this.confirmExit) {
                this.confirmExit = false;
                this.rebuildDOM();
                return true;
            }
            this.close();
            this.onResume?.();
            return true;
        }

        // Absorb all other keys when settings menu is open
        return true;
    }

    render(_ctx: CanvasRenderingContext2D, _vpW: number, _vpH: number): void {
        // Render does nothing anymore, we use DOM overlay.
    }

    // ==========================================
    // DOM Implementation
    // ==========================================

    private initDOM(): void {
        // 1. Inject CSS if not already present
        if (!document.getElementById('settings-styles')) {
            const style = document.createElement('style');
            style.id = 'settings-styles';
            style.textContent = `
                #settings-overlay {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(10, 10, 12, 0.75);
                    backdrop-filter: blur(6px);
                    display: none; justify-content: center; align-items: center;
                    z-index: 10000;
                    font-family: 'Inter', sans-serif;
                    pointer-events: auto;
                }
                .settings-panel {
                    position: relative;
                    width: 520px; max-width: calc(100% - 40px);
                    height: 480px; max-height: calc(100% - 40px);
                    background: rgba(22, 22, 24, 0.98);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 2px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    display: flex; flex-direction: column;
                    overflow: hidden;
                }
                .settings-panel::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201, 42, 42, 0.4), transparent);
                    pointer-events: none;
                }
                .settings-header {
                    text-align: center; font-size: 20px; font-weight: 700; color: #f4f4f5;
                    font-family: 'Noto Serif JP', serif;
                    letter-spacing: 4px;
                    margin-top: 25px; margin-bottom: 5px; z-index: 1;
                }
                .settings-tabs {
                    display: flex; justify-content: space-evenly;
                    padding: 0 15px; margin-top: 10px; z-index: 1;
                }
                .settings-tab {
                    flex: 1; margin: 0 5px; height: 28px;
                    border-radius: 2px; border: 1px solid transparent; background: transparent;
                    color: #71717a; font-weight: 600; font-size: 11px; cursor: pointer;
                    position: relative; letter-spacing: 1px;
                    font-family: 'Inter', sans-serif;
                    transition: all 0.2s;
                }
                .settings-tab:hover { background: rgba(255,255,255,0.03); color: #a1a1aa; }
                .settings-tab.active { background: rgba(255,255,255,0.03); color: #f4f4f5; border: 0; }
                .settings-tab.active::after {
                    content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
                    background: #c92a2a;
                }
                .settings-content-wrapper {
                    flex: 1; display: flex; flex-direction: column; overflow: hidden;
                    margin-top: 15px; z-index: 1;
                }
                .settings-content {
                    flex: 1; overflow-y: auto; padding: 0 20px 20px 20px;
                    color: #e8e4de;
                }
                .settings-content::-webkit-scrollbar { width: 4px; }
                .settings-content::-webkit-scrollbar-track { background: transparent; }
                .settings-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

                /* Subsections */
                .settings-section-title {
                    font-size: 10px; font-weight: 600; letter-spacing: 2px; color: #71717a;
                    display: flex; align-items: center; margin-top: 15px; margin-bottom: 5px;
                    text-transform: uppercase;
                }
                .settings-section-title::after {
                    content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.05); margin-left: 10px;
                }

                /* Rows */
                .settings-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 8px 6px; border-radius: 2px;
                }
                .settings-row:hover { background: rgba(255,255,255,0.02); }
                .settings-label-col { flex: 1; }
                .settings-label { font-size: 13px; font-weight: 500; color: #f4f4f5; line-height: 1.4; }
                .settings-desc { font-size: 11px; color: #71717a; margin-top: 2px; line-height: 1.3; }

                /* Toggle Switch */
                .settings-switch {
                    width: 36px; height: 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 9px; position: relative; cursor: pointer;
                    flex-shrink: 0; transition: all 0.2s;
                }
                .settings-switch.active { background: #c92a2a; border-color: #c92a2a; }
                .settings-switch::after {
                    content: ''; position: absolute; top: 1px; left: 2px;
                    width: 14px; height: 14px; border-radius: 50%; background: #71717a;
                    transition: 0.2s;
                }
                .settings-switch.active::after { left: 19px; background: #fff; box-shadow: 0 0 6px rgba(201,42,42,0.4); }

                /* Options / Speed selector */
                .settings-options { display: flex; gap: 6px; flex-shrink: 0; }
                .settings-option-btn {
                    padding: 5px 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px;
                    background: transparent; color: #71717a; font-size: 11px; font-weight: 600;
                    cursor: pointer; font-family: 'Inter', sans-serif;
                    transition: all 0.2s;
                }
                .settings-option-btn:hover { background: rgba(255,255,255,0.03); color: #a1a1aa; }
                .settings-option-btn.active {
                    background: rgba(201,42,42,0.1); color: #f4f4f5; border-color: rgba(201,42,42,0.3);
                }

                /* Slider */
                .settings-slider-container { display: flex; align-items: center; gap: 15px; }
                .settings-slider {
                    flex: 1; -webkit-appearance: none; appearance: none;
                    background: rgba(255,255,255,0.06); height: 4px; border-radius: 2px; outline: none;
                }
                .settings-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 12px; height: 12px; border-radius: 50%; background: #c92a2a; cursor: pointer;
                    box-shadow: 0 0 6px rgba(201,42,42,0.3);
                }
                .settings-slider-val { font-size: 12px; font-weight: 600; color: #f4f4f5; width: 40px; text-align: right; }

                /* Action Buttons */
                .settings-buttons {
                    display: flex; justify-content: center; gap: 20px; padding: 15px; z-index: 1;
                    padding-top: 0;
                }
                .settings-btn {
                    width: 160px; height: 40px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03); color: #a1a1aa; font-size: 11px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
                    letter-spacing: 1px;
                }
                .settings-btn:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); }
                .settings-btn-primary { color: #c92a2a; border-color: rgba(201,42,42,0.2); }
                .settings-btn-primary:hover { border-color: rgba(201,42,42,0.4); background: rgba(201,42,42,0.06); }
                .settings-btn-danger { color: #71717a; }
                .settings-btn-danger:hover { color: #ef4444; border-color: rgba(239,68,68,0.2); }

                /* Shortcut Badges */
                .shortcut-item { display: flex; align-items: center; margin-bottom: 6px; }
                .shortcut-key {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 2px;
                    padding: 4px 8px; font-family: 'Inter', monospace; font-size: 11px;
                    font-weight: 600; color: #f4f4f5; min-width: 60px; text-align: center;
                    margin-right: 12px;
                }
                .shortcut-desc { font-size: 12px; color: #a1a1aa; }
                
                /* Confirm Dialog */
                .confirm-dialog {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 360px; padding: 25px;
                    background: rgba(22, 22, 24, 0.98);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 2px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    text-align: center; z-index: 2;
                }
                .confirm-icon { color: #c92a2a; font-size: 28px; margin-bottom: 10px; }
                .confirm-title { font-size: 14px; font-weight: bold; color: #f4f4f5; margin-bottom: 5px; }
                .confirm-desc { font-size: 12px; color: #71717a; margin-bottom: 20px; }
                .confirm-dimmer {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); z-index: 1; border-radius: 2px;
                }
            `;
            document.head.appendChild(style);
        }

        this.overlay.id = 'settings-overlay';
        this.panel.className = 'settings-panel';
        
        // Disable game interactions when clicking on overlay background
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                // Do not close on outside click to match WC3 style properly
                // But definitely stop propagation
            }
        });
        
        this.overlay.addEventListener('contextmenu', e => e.preventDefault());

        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
    }

    private rebuildDOM() {
        this.panel.innerHTML = ''; // Clear panel

        // Title
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.innerText = t('settings.title');
        this.panel.appendChild(header);

        // Tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'settings-tabs';
        
        const tabs = [
            { label: t('settings.tabGame'), tab: SettingsTab.Game },
            { label: t('settings.tabAudio'), tab: SettingsTab.Audio },
            { label: t('settings.tabControls'), tab: SettingsTab.Controls },
        ];

        for (const tInfo of tabs) {
            const btn = document.createElement('button');
            btn.className = 'settings-tab' + (this.activeTab === tInfo.tab ? ' active' : '');
            btn.innerText = tInfo.label;
            btn.onclick = () => {
                this.activeTab = tInfo.tab;
                this.rebuildDOM();
            };
            tabsContainer.appendChild(btn);
        }
        this.panel.appendChild(tabsContainer);

        // Content Wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'settings-content-wrapper';
        
        this.contentBody.className = 'settings-content';
        this.contentBody.innerHTML = ''; // Clear contents
        this.buildActiveTabContent();
        
        contentWrapper.appendChild(this.contentBody);
        this.panel.appendChild(contentWrapper);

        // Footer Buttons
        const footer = document.createElement('div');
        footer.className = 'settings-buttons';

        const btnResume = document.createElement('button');
        btnResume.className = 'settings-btn settings-btn-primary';
        btnResume.innerText = t('settings.resume');
        btnResume.onclick = () => {
            this.close();
            this.onResume?.();
        };

        const btnExit = document.createElement('button');
        btnExit.className = 'settings-btn settings-btn-danger';
        btnExit.innerText = t('settings.exit');
        btnExit.onclick = () => {
            this.confirmExit = true;
            this.rebuildDOM(); // Render dialog
        };

        footer.appendChild(btnResume);
        footer.appendChild(btnExit);
        this.panel.appendChild(footer);

        // Confirm Exit Dialog Overlaid
        if (this.confirmExit) {
            const dimmer = document.createElement('div');
            dimmer.className = 'confirm-dimmer';
            
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            
            dialog.innerHTML = `
                <div class="confirm-icon">⚠️</div>
                <div class="confirm-title">${t('settings.confirmExit')}</div>
                <div class="confirm-desc">${t('settings.unsaved')}</div>
                <div class="settings-buttons" style="padding-bottom: 0;">
                    <button class="settings-btn" id="btn-cancel-exit">${t('settings.cancel')}</button>
                    <button class="settings-btn settings-btn-danger" id="btn-confirm-exit">${t('settings.confirmBtn')}</button>
                </div>
            `;
            
            this.panel.appendChild(dimmer);
            this.panel.appendChild(dialog);
            
            // Re-fetch buttons to bind events
            setTimeout(() => {
                document.getElementById('btn-cancel-exit')!.onclick = () => {
                    this.confirmExit = false;
                    this.rebuildDOM();
                };
                document.getElementById('btn-confirm-exit')!.onclick = () => {
                    this.confirmExit = false;
                    this.close();
                    this.onExit?.();
                };
            }, 0);
        }
    }

    private buildActiveTabContent() {
        switch (this.activeTab) {
            case SettingsTab.Game:
                this.renderGameTab();
                break;
            case SettingsTab.Audio:
                this.renderAudioTab();
                break;
            case SettingsTab.Controls:
                this.renderControlsTab();
                break;
        }
    }

    // ==========================================
    //  TAB RENDERERS (DOM Based)
    // ==========================================

    private renderGameTab() {
        let h = '';
        
        h += this.getSectionHeaderHTML(t('settings.language'));
        this.contentBody.insertAdjacentHTML('beforeend', h); h = '';
        
        // Language Selector Options
        const langs: { code: 'vi' | 'en'; label: string }[] = [
            { code: 'vi', label: '🇻🇳 Tiếng Việt' },
            { code: 'en', label: '🇬🇧 English' },
        ];
        this.appendOptionsDOM(langs.map(l => l.label), langs.map(l => l.code), getLang(), (val) => {
            setLang(val as 'vi' | 'en');
            this.rebuildDOM(); // Refresh all text
        });

        h += this.getSectionHeaderHTML(t('settings.display'));
        this.contentBody.insertAdjacentHTML('beforeend', h); h = '';

        this.appendToggleDOM(t('settings.notifications'), t('settings.notifications.desc'), this.settings.notificationsEnabled, (v) => {
            this.settings.notificationsEnabled = v; saveSettings(this.settings);
        });

        this.appendToggleDOM(t('settings.showFPS'), t('settings.showFPS.desc'), this.settings.showFPS, (v) => {
            this.settings.showFPS = v; saveSettings(this.settings);
        });

        const fogOn = this.fogEnabledGetter?.() ?? true;
        this.appendToggleDOM(t('settings.fog'), t('settings.fog.desc'), fogOn, () => {
            this.onToggleFog?.();
            this.rebuildDOM();
        });

        h += this.getSectionHeaderHTML(t('settings.gameSpeed'));
        this.contentBody.insertAdjacentHTML('beforeend', h); h = '';

        const currentSpeed = this.gameSpeedGetter?.() ?? 1;
        const speeds = [0.5, 1, 1.5, 2, 3];
        const speedLabels = ['0.5x', '1x', '1.5x', '2x', '3x'];
        this.appendOptionsDOM(speedLabels, speeds, currentSpeed, (val) => {
            this.onSetSpeed?.(Number(val));
            this.rebuildDOM();
        });

        h += this.getSectionHeaderHTML(t('settings.other'));
        this.contentBody.insertAdjacentHTML('beforeend', h); h = '';

        this.appendToggleDOM(t('settings.autoSave'), t('settings.autoSave.desc'), this.settings.autoSave, (v) => {
            this.settings.autoSave = v; saveSettings(this.settings);
        });
    }

    private renderAudioTab() {
        let h = this.getSectionHeaderHTML(t('settings.volume'));
        this.contentBody.insertAdjacentHTML('beforeend', h);
        
        this.appendSliderDOM(t('settings.music'), this.settings.musicVolume, (v) => {
            this.settings.musicVolume = v; saveSettings(this.settings);
        });

        this.appendSliderDOM(t('settings.sfx'), this.settings.sfxVolume, (v) => {
            this.settings.sfxVolume = v; saveSettings(this.settings);
        });

        const info = document.createElement('div');
        info.style.color = '#71717a';
        info.style.fontStyle = 'italic';
        info.style.fontSize = '11px';
        info.style.marginTop = '20px';
        info.innerText = t('settings.audioNote');
        this.contentBody.appendChild(info);
    }

    private renderControlsTab() {
        let h = this.getSectionHeaderHTML(t('settings.shortcuts'));
        this.contentBody.insertAdjacentHTML('beforeend', h);

        const shortcuts: [string, string][] = [
            ['Esc', t('shortcut.esc')],
            ['Arrows', t('shortcut.wasd')],
            ['Left Click', t('shortcut.leftClick')],
            ['Right Click', t('shortcut.rightClick')],
            ['Drag Left', t('shortcut.drag')],
            ['H', t('shortcut.townCenter') || 'Town Center'],
            ['Ctrl + B, L, M...', t('shortcut.selectBuilding') || 'Select Buildings'],
            ['Space', t('shortcut.centerCam') || 'Center Camera'],
            ['Q W E R A S D F', t('shortcut.build')],
            ['F10', t('shortcut.f10')],
            ['` (backtick)', t('shortcut.console')],
        ];

        shortcuts.forEach(([key, desc]) => {
            const row = document.createElement('div');
            row.className = 'shortcut-item';
            row.innerHTML = `<div class="shortcut-key">${key}</div><div class="shortcut-desc">${desc}</div>`;
            this.contentBody.appendChild(row);
        });

        this.contentBody.insertAdjacentHTML('beforeend', this.getSectionHeaderHTML(t('settings.scrollSpeed') || 'SCROLL OPTIONS'));

        this.appendToggleDOM(t('settings.edgeScroll'), t('settings.edgeScroll.desc'), this.settings.edgeScroll, (v) => {
            this.settings.edgeScroll = v; saveSettings(this.settings);
        });

        const scrollSpeeds = [1, 2, 3, 4, 5];
        const scrollLabels = [t('scroll.verySlow'), t('scroll.slow'), t('scroll.normal'), t('scroll.fast'), t('scroll.veryFast')];
        this.appendOptionsDOM(scrollLabels, scrollSpeeds, this.settings.scrollSpeed, (val) => {
            this.settings.scrollSpeed = Number(val); saveSettings(this.settings);
        });
    }

    // ==========================================
    // DOM Helpers
    // ==========================================

    private getSectionHeaderHTML(label: string): string {
        return `<div class="settings-section-title">${label}</div>`;
    }

    private appendToggleDOM(label: string, desc: string, value: boolean, onChange: (v: boolean) => void) {
        const row = document.createElement('div');
        row.className = 'settings-row';
        row.innerHTML = `
            <div class="settings-label-col">
                <div class="settings-label">${label}</div>
                <div class="settings-desc">${desc}</div>
            </div>
            <div class="settings-switch ${value ? 'active' : ''}"></div>
        `;
        
        const sw = row.querySelector('.settings-switch') as HTMLDivElement;
        let active = value;
        row.onclick = () => {
            active = !active;
            sw.className = 'settings-switch ' + (active ? 'active' : '');
            onChange(active);
        };
        this.contentBody.appendChild(row);
    }

    private appendOptionsDOM(labels: string[], values: any[], currentVal: any, onChange: (v: any) => void) {
        const row = document.createElement('div');
        row.className = 'settings-row';
        row.style.paddingLeft = '0';
        
        const optsContainer = document.createElement('div');
        optsContainer.className = 'settings-options';

        labels.forEach((label, i) => {
            const val = values[i];
            const btn = document.createElement('button');
            const isActive = val === currentVal || (typeof val === 'number' && Math.abs(val - currentVal) < 0.01);
            btn.className = 'settings-option-btn ' + (isActive ? 'active' : '');
            btn.innerText = label;
            btn.onclick = () => {
                // Remove active class from siblings
                Array.from(optsContainer.children).forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                onChange(val);
            };
            optsContainer.appendChild(btn);
        });
        
        row.appendChild(optsContainer);
        this.contentBody.appendChild(row);
    }

    private appendSliderDOM(label: string, value: number, onChange: (v: number) => void) {
        const row = document.createElement('div');
        row.className = 'settings-row';
        row.style.flexDirection = 'column';
        row.style.alignItems = 'stretch';
        
        row.innerHTML = `
            <div class="settings-label-col" style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <div class="settings-label">${label}</div>
                <div class="settings-slider-val">${Math.round(value)}%</div>
            </div>
            <div class="settings-slider-container">
                <input type="range" class="settings-slider" min="0" max="100" value="${value}">
            </div>
        `;
        
        const slider = row.querySelector('.settings-slider') as HTMLInputElement;
        const valLabel = row.querySelector('.settings-slider-val') as HTMLDivElement;
        
        slider.oninput = (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            valLabel.innerText = `${Math.round(v)}%`;
            onChange(v);
        };
        
        this.contentBody.appendChild(row);
    }
}
