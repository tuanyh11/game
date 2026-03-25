import { t } from '../i18n/i18n';
import './MainMenu.css'; // Reuse zen styles

type GuideTab = 'controls' | 'civs' | 'buildings' | 'units' | 'upgrades' | 'combat';

export class GuideUI {
    private container: HTMLDivElement | null = null;
    private onClose: (() => void) | null = null;
    private activeTab: GuideTab = 'controls';

    constructor(onClose: () => void) {
        this.onClose = onClose;
    }

    show(): void {
        this.container = document.createElement('div');
        this.container.className = 'zen-bg';
        this.container.style.position = 'fixed';
        this.container.style.inset = '0';
        this.container.style.zIndex = '10005';
        this.render();
        document.body.appendChild(this.container);
    }

    private render(): void {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="zen-bg-element zen-bg-circle-1"></div>
            <div class="zen-bg-element zen-bg-circle-2"></div>
            <div class="zen-frame" style="max-width: 860px; width: 94%; max-height: 92vh; display: flex; flex-direction: column;">
                <div class="zen-frame-top">
                    <button class="zen-back-btn" id="guide-btn-back">${t('menu.back')}</button>
                    <div class="zen-frame-title-bar">
                        <span class="zen-sakura-icon">📖</span>
                        <h1 class="zen-title" style="font-size:18px">${t('menu.guide')}</h1>
                    </div>
                    <div style="width:90px"></div>
                </div>
                <div id="guide-tabs" style="display:flex; gap:0; padding:0 16px; border-bottom:1px solid rgba(255,255,255,0.05); flex-shrink:0;"></div>
                <div id="guide-content" style="overflow-y:auto; padding:20px 24px; flex:1; min-height:0;"></div>
            </div>
        `;
        this.container.querySelector('#guide-btn-back')?.addEventListener('click', () => this.hide());
        this.buildTabs();
        this.buildContent();
    }

    private buildTabs(): void {
        const tabsEl = this.container!.querySelector('#guide-tabs')!;
        const tabs: { id: GuideTab; label: string; icon: string }[] = [
            { id: 'controls', label: t('guide.tab.controls'), icon: '🎮' },
            { id: 'civs', label: t('guide.tab.civs'), icon: '🏛️' },
            { id: 'buildings', label: t('guide.tab.buildings'), icon: '🏗️' },
            { id: 'units', label: t('guide.tab.units'), icon: '⚔️' },
            { id: 'upgrades', label: t('guide.tab.upgrades'), icon: '🔬' },
            { id: 'combat', label: t('guide.tab.combat'), icon: '🎯' },
        ];
        tabsEl.innerHTML = '';
        for (const tab of tabs) {
            const btn = document.createElement('button');
            btn.className = 'guide-tab' + (this.activeTab === tab.id ? ' active' : '');
            btn.innerHTML = `<span style="margin-right:4px">${tab.icon}</span>${tab.label}`;
            btn.onclick = () => { this.activeTab = tab.id; this.buildTabs(); this.buildContent(); };
            tabsEl.appendChild(btn);
        }
        if (!document.getElementById('guide-tab-styles')) {
            const style = document.createElement('style');
            style.id = 'guide-tab-styles';
            style.textContent = `
                .guide-tab { background:transparent; border:none; border-bottom:2px solid transparent; color:#71717a; font-size:11px; font-weight:600; font-family:'Inter',sans-serif; padding:10px 14px; cursor:pointer; letter-spacing:1px; transition:all 0.2s; white-space:nowrap; }
                .guide-tab:hover { color:#a1a1aa; }
                .guide-tab.active { color:#f4f4f5; border-bottom-color:#c92a2a; }
                @media(max-width:600px) { .guide-tab { font-size:10px; padding:8px 8px; } .guide-tab span { display:none; } }
                .g-section { margin-bottom:24px; }
                .g-section-title { font-size:13px; font-weight:700; color:#f4f4f5; letter-spacing:2px; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:'Noto Serif JP',serif; }
                .g-table { width:100%; border-collapse:collapse; font-size:12px; color:#e8e4de; margin-bottom:16px; }
                .g-table th { text-align:left; font-size:10px; font-weight:600; color:#71717a; letter-spacing:1.5px; text-transform:uppercase; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.08); }
                .g-table td { padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.03); vertical-align:top; }
                .g-table tr:hover td { background:rgba(255,255,255,0.02); }
                .g-badge { display:inline-block; padding:2px 6px; font-size:9px; font-weight:700; border-radius:2px; letter-spacing:0.5px; }
                .g-badge-red { background:rgba(201,42,42,0.15); color:#f87171; }
                .g-badge-blue { background:rgba(96,165,250,0.15); color:#60a5fa; }
                .g-badge-green { background:rgba(110,231,183,0.15); color:#6ee7b7; }
                .g-badge-gold { background:rgba(212,175,55,0.15); color:#d4af37; }
                .g-tip { padding:10px 14px; font-size:11px; color:#a1a1aa; background:rgba(255,255,255,0.02); border-left:2px solid #c92a2a; border-radius:0 2px 2px 0; margin:12px 0; line-height:1.6; }
                .g-key { display:inline-block; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:2px; padding:1px 6px; font-size:11px; font-weight:600; color:#f4f4f5; font-family:'Inter',monospace; margin:0 2px; }
                .g-text { font-size:12px; color:#a1a1aa; line-height:1.7; margin-bottom:12px; }
                .g-text b { color:#f4f4f5; font-weight:600; }
            `;
            document.head.appendChild(style);
        }
    }

    private buildContent(): void {
        const el = this.container!.querySelector('#guide-content')!;
        el.scrollTop = 0;
        switch (this.activeTab) {
            case 'controls': el.innerHTML = this.tabControls(); break;
            case 'civs': el.innerHTML = this.tabCivs(); break;
            case 'buildings': el.innerHTML = this.tabBuildings(); break;
            case 'units': el.innerHTML = this.tabUnits(); break;
            case 'upgrades': el.innerHTML = this.tabUpgrades(); break;
            case 'combat': el.innerHTML = this.tabCombat(); break;
        }
    }

    private S(key: string) { return t(`guide.section.${key}`); }
    private TH(key: string) { return t(`guide.th.${key}`); }

    // ==========================================
    //  TAB: Controls
    // ==========================================
    private tabControls(): string {
        const k = (key: string) => t(`guide.key.${key}`);
        const m = (key: string) => t(`guide.mouse.${key}`);
        const b = (key: string) => t(`guide.build.${key}`);
        const tr = (key: string) => t(`guide.train.${key}`);
        return `
        <div class="g-section">
            <div class="g-section-title">${this.S('mouse')}</div>
            <table class="g-table">
                <tr><td width="180"><b>${m('left')}</b></td><td>${m('left.desc')}</td></tr>
                <tr><td><b>${m('drag')}</b></td><td>${m('drag.desc')}</td></tr>
                <tr><td><b>${m('right')}</b></td><td>${m('right.desc')}</td></tr>
                <tr><td><b>${m('shiftRight')}</b></td><td>${m('shiftRight.desc')}</td></tr>
                <tr><td><b>${m('scroll')}</b></td><td>${m('scroll.desc')}</td></tr>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('hotkeys')}</div>
            <table class="g-table">
                <tr><td width="180"><span class="g-key">H</span></td><td>${k('h')}</td></tr>
                <tr><td><span class="g-key">C</span></td><td>${k('c')}</td></tr>
                <tr><td><span class="g-key">Space</span></td><td>${k('space')}</td></tr>
                <tr><td><span class="g-key">Ctrl</span> + <span class="g-key">0-9</span></td><td>${k('ctrlNum')}</td></tr>
                <tr><td><span class="g-key">0-9</span></td><td>${k('num')}</td></tr>
                <tr><td><span class="g-key">Del</span> / <span class="g-key">Backspace</span></td><td>${k('del')}</td></tr>
                <tr><td><span class="g-key">Esc</span> / <span class="g-key">F10</span></td><td>${k('esc')}</td></tr>
                <tr><td><span class="g-key">\`</span> <span style="color:#71717a">(backtick)</span></td><td>${k('backtick')}</td></tr>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('buildKeys')}</div>
            <p class="g-text">${b('intro')}</p>
            <table class="g-table">
                <tr><td width="100"><span class="g-key">Q</span></td><td>${b('q')}</td><td width="100"><span class="g-key">W</span></td><td>${b('w')}</td></tr>
                <tr><td><span class="g-key">E</span></td><td>${b('e')}</td><td><span class="g-key">R</span></td><td>${b('r')}</td></tr>
                <tr><td><span class="g-key">A</span></td><td>${b('a')}</td><td><span class="g-key">S</span></td><td>${b('s')}</td></tr>
                <tr><td><span class="g-key">D</span></td><td>${b('d')}</td><td><span class="g-key">F</span></td><td>${b('f')}</td></tr>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('trainKeys')}</div>
            <p class="g-text">${tr('intro')}</p>
            <table class="g-table">
                <tr><td width="100"><span class="g-key">Q</span></td><td>${tr('q')}</td></tr>
                <tr><td><span class="g-key">W</span></td><td>${tr('w')}</td></tr>
                <tr><td><span class="g-key">E</span></td><td>${tr('e')}</td></tr>
                <tr><td><span class="g-key">R</span></td><td>${tr('r')}</td></tr>
            </table>
        </div>`;
    }

    // ==========================================
    //  TAB: Civilizations
    // ==========================================
    private tabCivs(): string {
        const civIds = ['persia', 'ming', 'yamato', 'rome', 'viking'] as const;
        const flags = ['🇮🇷', '🇨🇳', '🇯🇵', '🏛️', '🪓'];
        let html = '';
        for (let i = 0; i < civIds.length; i++) {
            const c = civIds[i];
            const cv = (key: string) => t(`guide.civ.${c}.${key}`);
            html += `
            <div class="g-section" style="background:rgba(0,0,0,0.15); padding:14px; border-radius:2px; border:1px solid rgba(255,255,255,0.04); margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                    <span style="font-size:22px">${flags[i]}</span>
                    <div>
                        <div style="font-size:14px; font-weight:700; color:#f4f4f5; letter-spacing:1px;">${t(`guide.civ.${c}`)}</div>
                        <div style="font-size:10px; color:#71717a; margin-top:2px;">
                            <span class="g-badge g-badge-green">${cv('str')}</span>
                            <span class="g-badge g-badge-red" style="margin-left:4px">${cv('weak')}</span>
                        </div>
                    </div>
                </div>
                <p class="g-text" style="margin-bottom:8px;">${cv('desc')}</p>
                <table class="g-table" style="margin-bottom:0;">
                    <tr><td width="100" style="color:#71717a">${this.TH('hero')}</td><td>${cv('hero')}</td></tr>
                    <tr><td style="color:#71717a">Elite</td><td>${cv('elite')}</td></tr>
                    <tr><td style="color:#71717a">${this.TH('civ')}</td><td>${cv('cav')}</td></tr>
                </table>
            </div>`;
        }
        return html;
    }

    // ==========================================
    //  TAB: Buildings (data stays numeric — not translated)
    // ==========================================
    private tabBuildings(): string {
        const h = this.TH;
        return `
        <div class="g-section">
            <div class="g-section-title">${this.S('infrastructure')}</div>
            <table class="g-table">
                <thead><tr><th>${h('building')}</th><th>${h('cost')}</th><th>${h('hp')}</th><th>${h('age')}</th><th>${h('function')}</th></tr></thead>
                <tbody>
                    <tr><td>🏠 ${t('bld.house')}</td><td>25S</td><td>550</td><td>1</td><td>+5 pop</td></tr>
                    <tr><td>🏛️ ${t('bld.townCenter')}</td><td>300S</td><td>2400</td><td>2</td><td>Train, drop-off, +5 pop</td></tr>
                    <tr><td>📦 ${t('bld.market')}</td><td>80S</td><td>700</td><td>1</td><td>Resource drop-off</td></tr>
                    <tr><td>🌾 ${t('bld.storagePit')}</td><td>100S</td><td>600</td><td>1</td><td>Gold & Supplies drop-off</td></tr>
                    <tr><td>🌾 ${t('bld.granary')}</td><td>100S</td><td>600</td><td>1</td><td>Supplies drop-off</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('military')}</div>
            <table class="g-table">
                <thead><tr><th>${h('building')}</th><th>${h('cost')}</th><th>${h('hp')}</th><th>${h('age')}</th><th>${h('function')}</th></tr></thead>
                <tbody>
                    <tr><td>⚔️ ${t('bld.barracks')}</td><td>150S</td><td>1200</td><td>1</td><td>Infantry + Elite</td></tr>
                    <tr><td>🐴 ${t('bld.stable')}</td><td>150S 40G</td><td>1200</td><td>2</td><td>Cavalry</td></tr>
                    <tr><td>⛩️ ${t('bld.heroAltar')}</td><td>80S 160G</td><td>1800</td><td>2</td><td>Hero (max 1)</td></tr>
                    <tr><td>🗼 ${t('bld.tower')}</td><td>150S</td><td>1500</td><td>2</td><td>Auto-defense, 3 upgrades</td></tr>
                    <tr><td>🧱 ${t('bld.wall')}</td><td>10S</td><td>2400</td><td>2</td><td>Block enemies</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('research')}</div>
            <table class="g-table">
                <thead><tr><th>${h('building')}</th><th>${h('cost')}</th><th>${h('hp')}</th><th>${h('age')}</th><th>${h('function')}</th></tr></thead>
                <tbody>
                    <tr><td>🔨 ${t('bld.blacksmith')}</td><td>120S 40G</td><td>1000</td><td>2</td><td>ATK/DEF upgrades</td></tr>
                    <tr><td>⚔️ ${t('bld.armory')}</td><td>160S 80G</td><td>1200</td><td>2</td><td>Hero equipment</td></tr>
                    <tr><td>🏛️ ${t('bld.governmentCenter')}</td><td>250S</td><td>2000</td><td>3</td><td>Special research</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('towerUpg')}</div>
            <table class="g-table">
                <thead><tr><th>${h('type')}</th><th>${h('cost')}</th><th>${h('effect')}</th></tr></thead>
                <tbody>
                    <tr><td>🔥 Fire Tower</td><td>100S 200G</td><td>+50% dmg, +2 arrows, splash, +300 HP</td></tr>
                    <tr><td>❄️ Ice Tower</td><td>150S 150G</td><td>Slow 30% (3s), +30% range, +200 HP</td></tr>
                    <tr><td>💣 Cannon Tower</td><td>200S 250G</td><td>+150% dmg, AoE, +dmg vs buildings, +500 HP</td></tr>
                </tbody>
            </table>
        </div>`;
    }

    // ==========================================
    //  TAB: Units
    // ==========================================
    private tabUnits(): string {
        const h = this.TH;
        const R = (key: string) => t(`guide.range.${key}`);
        return `
        <div class="g-section">
            <div class="g-section-title">${this.S('basicUnits')}</div>
            <table class="g-table">
                <thead><tr><th>${h('unit')}</th><th>${h('cost')}</th><th>${h('hp')}</th><th>${h('atk')}</th><th>${h('speed')}</th><th>${h('range')}</th><th>${h('age')}</th></tr></thead>
                <tbody>
                    <tr><td>👷 ${t('unit.villager')}</td><td>40G</td><td>25</td><td>3</td><td>90</td><td>${R('melee')}</td><td>1</td></tr>
                    <tr><td>🗡️ ${t('unit.spearman')}</td><td>50G</td><td>60</td><td>8</td><td>80</td><td>${R('melee')}</td><td>1</td></tr>
                    <tr><td>🏹 ${t('unit.archer')}</td><td>40G 20S</td><td>35</td><td>5</td><td>80</td><td>${R('ranged')}</td><td>2</td></tr>
                    <tr><td>🔍 ${t('unit.scout')}</td><td>65G</td><td>75</td><td>4</td><td>120</td><td>${R('melee')}</td><td>1</td></tr>
                    <tr><td>⚔️ ${t('unit.swordsman')}</td><td>50G 25S</td><td>80</td><td>12</td><td>70</td><td>${R('melee')}</td><td>2</td></tr>
                    <tr><td>🐎 ${t('unit.knight')}</td><td>60G 50S</td><td>120</td><td>14</td><td>140</td><td>${R('melee')}</td><td>3</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('eliteCav')}</div>
            <table class="g-table">
                <thead><tr><th>${h('unit')}</th><th>${h('civ')}</th><th>${h('cost')}</th><th>${h('hp')}</th><th>${h('atk')}</th><th>${h('trait')}</th></tr></thead>
                <tbody>
                    <tr><td>🏹 ${t('unit.immortal')}</td><td>${t('guide.civ.persia')}</td><td>45G 50S</td><td>55</td><td>7</td><td>${R('ranged')}</td></tr>
                    <tr><td>⚡ ${t('unit.chuKoNu')}</td><td>${t('guide.civ.ming')}</td><td>40G 45S</td><td>75</td><td>12</td><td>x2 speed</td></tr>
                    <tr><td>🥷 ${t('unit.ninja')}</td><td>${t('guide.civ.yamato')}</td><td>50G 40S</td><td>50</td><td>15</td><td>Stealth</td></tr>
                    <tr><td>🛡️ ${t('unit.centurion')}</td><td>${t('guide.civ.rome')}</td><td>40G 65S</td><td>110</td><td>10</td><td>Hybrid</td></tr>
                    <tr><td>🐺 ${t('unit.ulfhednar')}</td><td>${t('guide.civ.viking')}</td><td>35G 45S</td><td>85</td><td>12</td><td>Fast, cheap</td></tr>
                </tbody>
            </table>
            <table class="g-table">
                <thead><tr><th>Cavalry</th><th>${h('civ')}</th><th>${h('cost')}</th><th>${h('hp')}</th><th>${h('atk')}</th><th>${h('trait')}</th></tr></thead>
                <tbody>
                    <tr><td>${t('unit.warElephant')}</td><td>${t('guide.civ.persia')}</td><td>65G 100S</td><td>200</td><td>14</td><td>Tank, ${R('ranged')}</td></tr>
                    <tr><td>${t('unit.fireLancer')}</td><td>${t('guide.civ.ming')}</td><td>50G 55S</td><td>100</td><td>15</td><td>Fast, high ATK</td></tr>
                    <tr><td>${t('unit.yabusame')}</td><td>${t('guide.civ.yamato')}</td><td>55G 50S</td><td>85</td><td>10</td><td>Fastest archer</td></tr>
                    <tr><td>${t('unit.equites')}</td><td>${t('guide.civ.rome')}</td><td>50G 55S</td><td>125</td><td>12</td><td>Balanced</td></tr>
                    <tr><td>${t('unit.bearRider')}</td><td>${t('guide.civ.viking')}</td><td>35G 60S</td><td>140</td><td>16</td><td>Tanky, cheap</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('heroes')}</div>
            <table class="g-table">
                <thead><tr><th>${h('hero')}</th><th>${h('civ')}</th><th>${h('hp')}</th><th>${h('atk')}</th><th>${h('style')}</th></tr></thead>
                <tbody>
                    <tr><td>${t('unit.heroSpartacus')}</td><td>${t('guide.civ.rome')}</td><td>240</td><td>28</td><td>Tank ${R('melee')}</td></tr>
                    <tr><td>${t('unit.heroZarathustra')}</td><td>${t('guide.civ.persia')}</td><td>150</td><td>22</td><td>${R('ranged')} AoE</td></tr>
                    <tr><td>${t('unit.heroQiJiguang')}</td><td>${t('guide.civ.ming')}</td><td>220</td><td>26</td><td>Support tank</td></tr>
                    <tr><td>${t('unit.heroMusashi')}</td><td>${t('guide.civ.yamato')}</td><td>165</td><td>35</td><td>DPS ${R('melee')}</td></tr>
                    <tr><td>${t('unit.heroRagnar')}</td><td>${t('guide.civ.viking')}</td><td>210</td><td>28</td><td>Berserker</td></tr>
                </tbody>
            </table>
            <div class="g-tip"><b>💡</b> ${t('guide.hero.tip')}</div>
        </div>`;
    }

    // ==========================================
    //  TAB: Upgrades
    // ==========================================
    private tabUpgrades(): string {
        const h = this.TH;
        return `
        <div class="g-section">
            <div class="g-section-title">${this.S('ageUp')}</div>
            <table class="g-table">
                <thead><tr><th>${h('age')}</th><th>${h('cost')}</th><th>${h('time')}</th><th>${h('unlocks')}</th></tr></thead>
                <tbody>
                    <tr><td><span class="g-badge g-badge-blue">${t('age.2')}</span></td><td>100S 250G</td><td>40s</td><td>${t('unit.archer')}, ${t('unit.swordsman')}, ${t('bld.blacksmith')}, ${t('bld.tower')}, ${t('bld.stable')}</td></tr>
                    <tr><td><span class="g-badge g-badge-green">${t('age.3')}</span></td><td>250S 500G</td><td>60s</td><td>${t('unit.knight')}, Elite, Hero, Tower Upgrades, ${t('bld.governmentCenter')}</td></tr>
                    <tr><td><span class="g-badge g-badge-gold">${t('age.4')}</span></td><td>400S 700G</td><td>75s</td><td>Lv3 Upgrades, T3 Equipment</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('milUpg')}</div>
            <table class="g-table">
                <thead><tr><th>${h('upgrade')}</th><th>${h('max')}</th><th>${h('bonusLv')}</th><th>${h('applies')}</th></tr></thead>
                <tbody>
                    <tr><td>⚔ ${t('upg.meleeAttack')}</td><td>Lv3</td><td>+2 ATK</td><td>${t('unit.spearman')}, ${t('unit.swordsman')}, ${t('unit.knight')}, ${t('unit.scout')}</td></tr>
                    <tr><td>🏹 ${t('upg.rangedAttack')}</td><td>Lv3</td><td>+2 ATK</td><td>${t('unit.archer')}</td></tr>
                    <tr><td>🛡 ${t('upg.meleeDefense')}</td><td>Lv3</td><td>+1 Armor, +10 HP</td><td>${t('unit.spearman')}, ${t('unit.swordsman')}, ${t('unit.knight')}</td></tr>
                    <tr><td>🪖 ${t('upg.rangedDefense')}</td><td>Lv3</td><td>+1 Armor, +8 HP</td><td>${t('unit.archer')}</td></tr>
                    <tr><td>🔱 ${t('upg.eliteAttack')}</td><td>Lv3</td><td>+3 ATK</td><td>Elite & Unique Cavalry</td></tr>
                    <tr><td>🛡️ ${t('upg.eliteDefense')}</td><td>Lv3</td><td>+2 Armor, +15 HP</td><td>Elite & Unique Cavalry</td></tr>
                    <tr><td>🐴 ${t('upg.cavalryAttack')}</td><td>Lv3</td><td>+3 ATK, +1 Armor</td><td>${t('unit.knight')}, ${t('unit.scout')}</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('ecoUpg')}</div>
            <table class="g-table">
                <thead><tr><th>${h('upgrade')}</th><th>${h('max')}</th><th>${h('bonusLv')}</th></tr></thead>
                <tbody>
                    <tr><td>📦 ${t('upg.gatherSupplies')}</td><td>Lv3</td><td>+15%</td></tr>
                    <tr><td>🪙 ${t('upg.gatherGold')}</td><td>Lv3</td><td>+15%</td></tr>
                    <tr><td>📦 ${t('upg.carryCapacity')}</td><td>Lv3</td><td>+5</td></tr>
                    <tr><td>🏃 ${t('upg.villagerSpeed')}</td><td>Lv2</td><td>+10%</td></tr>
                </tbody>
            </table>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('heroEquip')}</div>
            <table class="g-table">
                <thead><tr><th>${h('weapon')}</th><th>${h('tier')}</th><th>${h('cost')}</th><th>${h('effect')}</th></tr></thead>
                <tbody>
                    <tr><td>🗡️ ${t('equip.iron_blade')}</td><td><span class="g-badge g-badge-blue">T1</span></td><td>120G 80S</td><td>+4 ATK</td></tr>
                    <tr><td>⚔️ ${t('equip.war_axe')}</td><td><span class="g-badge g-badge-green">T2</span></td><td>220G 120S</td><td>+7 ATK, ${t('equip.effect.splash')} 40%</td></tr>
                    <tr><td>🔪 ${t('equip.cursed_blade')}</td><td><span class="g-badge g-badge-green">T2</span></td><td>200G 80S</td><td>+5 ATK, ${t('equip.effect.antiHeal')}</td></tr>
                    <tr><td>🐉 ${t('equip.dragonbone_sword')}</td><td><span class="g-badge g-badge-gold">T3</span></td><td>350G 200S</td><td>+12 ATK, ${t('equip.effect.atkSpeed')}</td></tr>
                    <tr><td>🔨 ${t('equip.frost_hammer')}</td><td><span class="g-badge g-badge-gold">T3</span></td><td>300G 240S</td><td>+8 ATK, ${t('equip.effect.slow')} 30%</td></tr>
                </tbody>
            </table>
            <table class="g-table">
                <thead><tr><th>${h('armorAcc')}</th><th>${h('tier')}</th><th>${h('cost')}</th><th>${h('effect')}</th></tr></thead>
                <tbody>
                    <tr><td>🛡️ ${t('equip.chain_mail')}</td><td><span class="g-badge g-badge-blue">T1</span></td><td>100G 80S</td><td>+25 HP, +2 Armor</td></tr>
                    <tr><td>🪖 ${t('equip.plate_armor')}</td><td><span class="g-badge g-badge-green">T2</span></td><td>180G 140S</td><td>+50 HP, +4 Armor</td></tr>
                    <tr><td>🐲 ${t('equip.dragon_scale')}</td><td><span class="g-badge g-badge-gold">T3</span></td><td>350G 200S</td><td>+80 HP, +6 Armor, ${t('equip.effect.reflect')} 12%</td></tr>
                    <tr><td>🧪 ${t('equip.health_potion')}</td><td><span class="g-badge g-badge-blue">T1</span></td><td>80G 60S</td><td>+15 HP, ${t('equip.effect.regen')}</td></tr>
                    <tr><td>👢 ${t('equip.swift_boots')}</td><td><span class="g-badge g-badge-blue">T1</span></td><td>100G 60S</td><td>+12% Speed</td></tr>
                    <tr><td>💍 ${t('equip.blood_ring')}</td><td><span class="g-badge g-badge-green">T2</span></td><td>200G 100S</td><td>+2 ATK, ${t('equip.effect.lifesteal')} 12%</td></tr>
                    <tr><td>👑 ${t('equip.crown_of_kings')}</td><td><span class="g-badge g-badge-gold">T3</span></td><td>300G 240S</td><td>+3 ATK, +40 HP, ${t('equip.effect.auraBoost')} 25%</td></tr>
                </tbody>
            </table>
        </div>`;
    }

    // ==========================================
    //  TAB: Combat
    // ==========================================
    private tabCombat(): string {
        const tc = (key: string) => t(`guide.tactic.${key}`);
        return `
        <div class="g-section">
            <div class="g-section-title">${this.S('triangle')}</div>
            <p class="g-text"><b>${t('guide.triangle.desc')}</b></p>
            <div style="text-align:center; padding:16px; font-size:14px; color:#e8e4de; line-height:2;">
                <div>${t('guide.triangle.spearBeatCav')}</div>
                <div>${t('guide.triangle.cavBeatArcher')}</div>
                <div>${t('guide.triangle.archerBeatSpear')}</div>
                <div style="margin-top:8px;">${t('guide.triangle.swordAll')}</div>
            </div>
            <div class="g-tip"><b>💡</b> ${t('guide.triangle.tip')}</div>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('stars')}</div>
            <p class="g-text"><b>${t('guide.stars.desc')}</b></p>
            <table class="g-table">
                <tr><td>⭐ 1 Star</td><td>${t('guide.stars.1')}</td></tr>
                <tr><td>⭐⭐ 2 Stars</td><td>${t('guide.stars.2')}</td></tr>
                <tr><td>⭐⭐⭐ 3 Stars</td><td>${t('guide.stars.3')}</td></tr>
            </table>
            <div class="g-tip"><b>💡</b> ${t('guide.stars.tip')}</div>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('creeps')}</div>
            <div style="text-align:center; padding:24px 16px;">
                <span style="font-size:32px; display:block; margin-bottom:12px; opacity:0.4;">🐉</span>
                <span class="g-badge g-badge-gold" style="font-size:11px; padding:4px 12px;">COMING SOON</span>
                <p class="g-text" style="margin-top:12px; color:#71717a;">${t('guide.creeps.comingSoon')}</p>
            </div>
        </div>
        <div class="g-section">
            <div class="g-section-title">${this.S('tactics')}</div>
            <div class="g-tip"><b>${tc('rush')}</b> ${tc('rush.desc')}</div>
            <div class="g-tip"><b>${tc('boom')}</b> ${tc('boom.desc')}</div>
            <div class="g-tip"><b>${tc('hero')}</b> ${tc('hero.desc')}</div>
            <div class="g-tip"><b>${tc('turtle')}</b> ${tc('turtle.desc')}</div>
            <div class="g-tip"><b>${tc('timing')}</b> ${tc('timing.desc')}</div>
        </div>`;
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
