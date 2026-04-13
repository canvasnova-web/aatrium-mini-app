"use client";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramInitData {
  user?: TelegramUser;
  query_id?: string;
  auth_date?: number;
  hash?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: TelegramInitData;
        platform: string;
        version: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.Telegram?.WebApp;
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
}

export function getInitData(): TelegramInitData | null {
  const webApp = getTelegramWebApp();
  if (!webApp) return null;
  return webApp.initDataUnsafe || null;
}

export function getInitDataRaw(): string {
  const webApp = getTelegramWebApp();
  if (!webApp) return "";
  return webApp.initData || "";
}

export function getUser(): TelegramUser | null {
  const initData = getInitData();
  return initData?.user || null;
}

export function getTheme() {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return {
      colorScheme: 'light' as const,
      themeParams: {},
    };
  }
  return {
    colorScheme: webApp.colorScheme,
    themeParams: webApp.themeParams,
  };
}

export function setMainButton(
  text: string,
  onClick: () => void,
  options?: { color?: string; textColor?: string }
): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  const btn = webApp.MainButton;
  btn.setText(text);
  if (options?.color) btn.color = options.color;
  if (options?.textColor) btn.textColor = options.textColor;
  btn.onClick(onClick);
  btn.show();
}

export function hideMainButton(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  webApp.MainButton.hide();
}

export function setBackButton(onClick: () => void): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  webApp.BackButton.onClick(onClick);
  webApp.BackButton.show();
}

export function hideBackButton(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  webApp.BackButton.hide();
}

export function hapticFeedback(
  type: 'impact' | 'notification' | 'selection',
  value?: string
): void {
  const webApp = getTelegramWebApp();
  if (!webApp?.HapticFeedback) return;

  if (type === 'impact') {
    webApp.HapticFeedback.impactOccurred((value as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') || 'light');
  } else if (type === 'notification') {
    webApp.HapticFeedback.notificationOccurred((value as 'error' | 'success' | 'warning') || 'success');
  } else if (type === 'selection') {
    webApp.HapticFeedback.selectionChanged();
  }
}
