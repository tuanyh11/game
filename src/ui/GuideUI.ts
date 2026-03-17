import { t } from '../i18n/i18n';
import './MainMenu.css'; // Reuse zen styles

export class GuideUI {
    private container: HTMLDivElement | null = null;
    private onClose: (() => void) | null = null;

    constructor(onClose: () => void) {
        this.onClose = onClose;
    }

    show(): void {
        this.container = document.createElement('div');
        this.container.className = 'zen-bg';
        this.container.style.position = 'fixed';
        this.container.style.inset = '0';
        this.container.style.zIndex = '10005';
        
        this.container.innerHTML = `
            <div class="zen-bg-element zen-bg-circle-1"></div>
            <div class="zen-bg-element zen-bg-circle-2"></div>
            <div class="zen-frame" style="max-width: 800px; width: 90%; max-height: 90vh; display: flex; flex-direction: column;">
                <div class="zen-frame-top">
                    <button class="zen-back-btn" id="guide-btn-back">${t('menu.back')}</button>
                    <div class="zen-frame-title-bar">
                        <span class="zen-sakura-icon">📖</span>
                        <h1 class="zen-title" style="font-size:18px">${t('menu.guide')}</h1>
                    </div>
                    <div style="width:90px"></div>
                </div>
                <div class="zen-body" style="overflow-y: auto; padding: 20px; color: #fff; line-height: 1.6; font-family: Inter, sans-serif; flex: 1;">
                    <h2 style="color: #ffb86c; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-top: 0;">🎮 ${t('guide.controls')}</h2>
                    <ul style="padding-left: 20px; margin-bottom: 24px;">
                        <li><b>${t('guide.mouseC')}:</b> ${t('guide.mouseC.desc')}</li>
                        <li><b>${t('guide.mouseR')}:</b> ${t('guide.mouseR.desc')}</li>
                        <li><b>H:</b> ${t('guide.hotkey.h')}</li>
                        <li><b>C:</b> ${t('guide.hotkey.c')}</li>
                        <li><b>Ctrl + 0-9:</b> ${t('guide.hotkey.group')}</li>
                        <li><b>B:</b> ${t('guide.hotkey.b')}</li>
                        <li><b>Del / Backspace:</b> ${t('guide.hotkey.del')}</li>
                        <li><b>F10:</b> ${t('guide.hotkey.settings')}</li>
                    </ul>

                    <h2 style="color: #bd93f9; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">🏛️ ${t('guide.civs')}</h2>
                    <ul style="padding-left: 20px; margin-bottom: 24px;">
                        <li><b>${t('civ.baTu')}:</b> ${t('civ.baTu.desc')}</li>
                        <li><b>${t('civ.daiMinh')}:</b> ${t('civ.daiMinh.desc')}</li>
                        <li><b>${t('civ.yamato')}:</b> ${t('civ.yamato.desc')}</li>
                        <li><b>${t('civ.laMa')}:</b> ${t('civ.laMa.desc')}</li>
                        <li><b>${t('civ.viking')}:</b> ${t('civ.viking.desc')}</li>
                    </ul>

                    <h2 style="color: #50fa7b; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">🏗️ ${t('guide.ages')}</h2>
                    <p>${t('guide.ages.desc')}</p>

                    <h2 style="color: #8be9fd; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">⚔️ ${t('guide.combat')}</h2>
                    <p style="font-weight: bold; color: #ff79c6;">${t('guide.combat.triangle')}</p>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        this.container.querySelector('#guide-btn-back')?.addEventListener('click', () => {
            this.hide();
        });
    }

    hide(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        if (this.onClose) {
            this.onClose();
        }
    }
}
