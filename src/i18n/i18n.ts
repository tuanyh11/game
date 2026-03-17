// ============================================================
//  i18n — Language manager for multi-language support
//  Supports Vietnamese (vi) and English (en)
// ============================================================

import { vi } from './vi';
import { en } from './en';
import { updateGameTranslations } from '../config/GameConfig';

export type Lang = 'vi' | 'en';
export type TranslationKey = keyof typeof vi;

const LANG_KEY = 'pixelEmpires_lang';

const translations: Record<Lang, Record<string, string>> = { vi, en };

let currentLang: Lang = 'vi';

// Load saved language on module init
try {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved && translations[saved]) currentLang = saved;
} catch { /* ignore */ }

export function getLang(): Lang {
    return currentLang;
}

export function setLang(lang: Lang): void {
    currentLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
    updateGameTranslations();
}

/** Main translation function — returns localized string for the given key */
export function t(key: string): string {
    return translations[currentLang]?.[key] ?? translations['vi']?.[key] ?? key;
}
