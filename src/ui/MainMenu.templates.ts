// ============================================================
//  HTML Templates for MainMenu UI
//  Separated from MainMenu.ts for cleaner code organization
//  Now uses i18n t() for multi-language support
// ============================================================

import { t } from '../i18n/i18n';

/** Landing page: Game mode selection */
export function getModeSelectTemplate(): string {
    return `
<div class="zen-bg">
    <div class="zen-bg-element zen-bg-circle-1"></div>
    <div class="zen-bg-element zen-bg-circle-2"></div>

    <button id="mm-lang-btn" style="position: absolute; top: 16px; right: 24px; z-index: 100; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-family: Inter, sans-serif; font-size: 14px; transition: all 0.2s;">
        ${t('setting.language')}
    </button>

    <div class="zen-landing">
        <!-- Title -->
        <div class="zen-landing-header">
            <span class="zen-sakura-icon">💮</span>
            <h1 class="zen-title">${t('menu.title')}</h1>
            <span class="zen-sakura-icon">💮</span>
        </div>

        <!-- Game Mode Cards -->
        <div class="zen-modes">
            <button class="zen-mode-card" id="mode-ai">
                <div class="zen-mode-icon">⚔️</div>
                <div class="zen-mode-name">${t('menu.playAI')}</div>
                <div class="zen-mode-desc">${t('menu.playAI.desc')}</div>
                <div class="zen-mode-hanko">戦</div>
            </button>
            <button class="zen-mode-card" id="mode-online">
                <div class="zen-mode-icon">🌐</div>
                <div class="zen-mode-name">${t('menu.playOnline')}</div>
                <div class="zen-mode-desc">${t('menu.playOnline.desc')}</div>
                <div class="zen-mode-hanko">友</div>
            </button>
            <button class="zen-mode-card" id="mode-free">
                <div class="zen-mode-icon">🎮</div>
                <div class="zen-mode-name">${t('menu.freeMode')}</div>
                <div class="zen-mode-desc">${t('menu.freeMode.desc')}</div>
                <div class="zen-mode-hanko">遊</div>
            </button>
            <button class="zen-mode-card" id="mode-guide">
                <div class="zen-mode-icon">📖</div>
                <div class="zen-mode-name">${t('menu.guide')}</div>
                <div class="zen-mode-desc">${t('menu.guide.desc')}</div>
                <div class="zen-mode-hanko">導</div>
            </button>
        </div>

        <!-- Version info -->
        <div class="zen-landing-footer">${t('menu.version')}</div>
    </div>
</div>
`;
}

/** AI Battle setup: Map + Player slots */
export function getAiSetupTemplate(): string {
    return `
<div class="zen-bg">
    <div class="zen-bg-element zen-bg-circle-1"></div>
    <div class="zen-bg-element zen-bg-circle-2"></div>

    <div class="zen-frame">
        <!-- Top bar -->
        <div class="zen-frame-top">
            <button class="zen-back-btn" id="mm-btn-back">${t('menu.back')}</button>
            <div class="zen-frame-title-bar">
                <span class="zen-sakura-icon">⚔️</span>
                <h1 class="zen-title" style="font-size:18px">${t('menu.playAI')}</h1>
            </div>
            <div style="width:90px"></div>
        </div>

        <!-- Main content area -->
        <div class="zen-body">
            <!-- Map selection row -->
            <div class="zen-map-row">
                <div class="zen-map-preview-wrap" id="zen-map-preview-wrap"></div>
                <div class="zen-map-select-wrap">
                    <label class="zen-map-label">${t('menu.map')}</label>
                    <select class="zen-map-select" id="mm-map-select"></select>
                </div>
            </div>

            <!-- Players panel -->
            <div class="zen-panel">
                <div class="zen-panel-header">
                    <span class="zen-panel-icon">👥</span> ${t('menu.team')}
                </div>
                <div class="zen-panel-content">
                    <div class="zen-slot-header">
                        <span class="zen-col" style="width:24px">${t('menu.color')}</span>
                        <span class="zen-col" style="flex:1">${t('menu.name')}</span>
                        <span class="zen-col" style="width:70px">${t('menu.faction')}</span>
                        <span class="zen-col" style="width:120px">${t('menu.nation')}</span>
                        <span class="zen-col" style="width:70px">${t('menu.difficulty')}</span>
                        <span class="zen-col" style="width:24px"></span>
                    </div>
                    <div class="zen-slots" id="mm-slots"></div>
                    <div class="zen-add-row" id="mm-add-row"></div>
                </div>
            </div>
        </div>

        <!-- Bottom bar with actions -->
        <div class="zen-frame-bottom">
            <div class="zen-summary" id="mm-summary"></div>
            <button class="zen-btn zen-btn-primary" id="mm-btn-start">
                ${t('menu.start')}
                <div class="zen-btn-hanko">戦</div>
            </button>
        </div>
    </div>
</div>
`;
}

/** Multiplayer lobby: Create or Join room view */
export function getLobbyChooseTemplate(): string {
    return `
<div class="mp-panel">
    <div class="mp-header">
        <h2>対戦 <span style="font-size:12px;color:#a1a1aa;letter-spacing:2px;margin-left:8px;font-family:Inter,sans-serif;font-weight:500">${t('mp.online')}</span></h2>
        <button class="mp-btn mp-btn-red" id="mp-close">✕</button>
    </div>
    <div class="mp-body">
        <div class="mp-label">${t('mp.playerName')}</div>
        <div class="mp-row">
            <input class="mp-input" id="mp-name" placeholder="${t('mp.playerPlaceholder')}" value="Player" maxlength="20" />
        </div>
        <div class="mp-divider"></div>
        <div class="mp-label">${t('mp.createRoom')}</div>
        <div class="mp-row">
            <button class="mp-btn mp-btn-gold" id="mp-create" style="flex:1">${t('mp.createBtn')}</button>
        </div>
        <div class="mp-divider"></div>
        <div class="mp-label">${t('mp.joinRoom')}</div>
        <div class="mp-row">
            <input class="mp-input" id="mp-room-code" placeholder="${t('mp.joinCodePlaceholder')}" maxlength="5" style="text-transform:uppercase;letter-spacing:6px;text-align:center;font-family:'Noto Serif JP',serif;font-weight:700" />
            <button class="mp-btn mp-btn-blue" id="mp-join">${t('mp.joinBtn')}</button>
        </div>
        <div id="mp-error" class="mp-error" style="display:none"></div>
    </div>
</div>
`;
}

/** Multiplayer lobby: Room view shell (dynamic parts filled via DOM API) */
export function getLobbyRoomTemplate(): string {
    return `
<div class="mp-panel mp-panel-wide">
    <div class="mp-header">
        <h2>待機 <span style="font-size:12px;color:#a1a1aa;letter-spacing:2px;margin-left:8px;font-family:Inter,sans-serif;font-weight:500">${t('mp.waitRoom')}</span></h2>
        <button class="mp-btn mp-btn-red" id="mp-leave">${t('mp.leaveRoom')}</button>
    </div>
    <div class="mp-body mp-body-columns">
        <!-- Left: Players -->
        <div class="mp-col-left">
            <div class="mp-label" id="mp-player-count">${t('mp.playerCount')} (0/8)</div>
            
            <div class="mp-slot-header">
                <span style="width:24px;text-align:center">${t('menu.color')}</span>
                <span style="flex:1">${t('menu.name')}</span>
                <span style="width:120px">${t('menu.nation')}</span>
                <span style="width:70px;text-align:center">${t('menu.faction')}</span>
                <span style="width:70px;text-align:center">${t('menu.difficulty')}</span>
                <span style="width:80px;text-align:center">Status</span>
                <span style="width:40px"></span>
            </div>
            
            <div class="mp-player-list" id="mp-player-list"></div>
            
            <div id="mp-add-ai-wrap" style="text-align:center; padding-top:8px"></div>
            <div id="mp-error" class="mp-error" style="display:none"></div>
        </div>
        <!-- Right: Room info -->
        <div class="mp-col-right">
            <div class="mp-label">${t('mp.roomCode')}</div>
            <div class="mp-room-code" id="mp-room-id"></div>
            <div style="text-align:center;font-size:9px;color:#52525b;margin-bottom:12px;letter-spacing:1px">${t('mp.shareCode')}</div>

            <div class="mp-divider"></div>
            <div class="mp-label">${t('mp.map')}</div>
            <div id="mp-map-wrap"></div>
        </div>
    </div>
    <div class="mp-footer">
        <div id="mp-ping" style="font-size:9px;color:#52525b;letter-spacing:1px"></div>
        <div id="mp-action-wrap"></div>
    </div>
</div>
`;
}
