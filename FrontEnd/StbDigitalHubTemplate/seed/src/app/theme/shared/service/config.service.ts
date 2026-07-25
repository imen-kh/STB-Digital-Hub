import { Injectable, signal, effect } from '@angular/core';
import { BerryDefaultConfig } from 'src/app/app-config';

// Keys persisted to localStorage
interface StoredConfig {
  layout: string;
  isCollapse_menu: boolean;
  isDarkMode: boolean;
  sidebar_caption_hide: boolean;
  theme_color: string;
  font_family: string;
  isRtl_layout: boolean;
  isBox_container: boolean;
  isLanding: boolean;
  i18n: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private static readonly STORAGE_KEY = 'berry-theme-config';

  // Default configuration from app-config.ts
  private readonly defaultConfig = BerryDefaultConfig;

  // Signals for reactive state
  layout = signal<string>('vertical');
  isCollapse_menu = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);
  sidebar_caption_hide = signal<boolean>(false);
  theme_color = signal<string>('preset-1');
  font_family = signal<string>('Roboto');
  isRtl_layout = signal<boolean>(false);
  isBox_container = signal<boolean>(true);
  isLanding = signal<boolean>(false);
  i18n = signal<string>('en');

  // UI-only signal (not persisted to localStorage)
  navCollapsedMob = signal<boolean>(false);

  constructor() {
    this.loadConfig();

    // Auto-save to localStorage whenever any persisted signal changes
    effect(() => {
      const config: StoredConfig = {
        layout: this.layout(),
        isCollapse_menu: this.isCollapse_menu(),
        isDarkMode: this.isDarkMode(),
        sidebar_caption_hide: this.sidebar_caption_hide(),
        theme_color: this.theme_color(),
        font_family: this.font_family(),
        isRtl_layout: this.isRtl_layout(),
        isBox_container: this.isBox_container(),
        isLanding: this.isLanding(),
        i18n: this.i18n()
      };
      try {
        localStorage.setItem(ConfigService.STORAGE_KEY, JSON.stringify(config));
      } catch {
        // localStorage may be unavailable (e.g. private browsing quota exceeded)
      }
    });
  }

  /**
   * Load configuration from localStorage, falling back to BerryDefaultConfig defaults.
   */
  private loadConfig(): void {
    const defaults = this.defaultConfig;
    let stored: Partial<StoredConfig> = {};

    try {
      const raw = localStorage.getItem(ConfigService.STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    } catch {
      // Corrupted or unavailable – use defaults
    }

    this.layout.set(stored.layout ?? defaults.layout);
    this.isCollapse_menu.set(stored.isCollapse_menu ?? defaults.isCollapse_menu);
    this.isDarkMode.set(stored.isDarkMode ?? defaults.isDarkMode);
    this.sidebar_caption_hide.set(stored.sidebar_caption_hide ?? defaults.sidebar_caption_hide);
    this.theme_color.set(stored.theme_color ?? defaults.theme_color);
    this.font_family.set(stored.font_family ?? defaults.font_family);
    this.isRtl_layout.set(stored.isRtl_layout ?? defaults.isRtl_layout);
    this.isBox_container.set(stored.isBox_container ?? defaults.isBox_container);
    this.isLanding.set(stored.isLanding ?? defaults.isLanding);
    this.i18n.set(stored.i18n ?? defaults.i18n);
  }

  /**
   * Reset configuration to defaults and clear localStorage
   */
  resetToDefaults(): void {
    try {
      localStorage.removeItem(ConfigService.STORAGE_KEY);
    } catch {
      // Ignore
    }
    const defaults = this.defaultConfig;
    this.layout.set(defaults.layout);
    this.isCollapse_menu.set(defaults.isCollapse_menu);
    this.isDarkMode.set(defaults.isDarkMode);
    this.sidebar_caption_hide.set(defaults.sidebar_caption_hide);
    this.theme_color.set(defaults.theme_color);
    this.font_family.set(defaults.font_family);
    this.isRtl_layout.set(defaults.isRtl_layout);
    this.isBox_container.set(defaults.isBox_container);
    this.isLanding.set(defaults.isLanding);
    this.i18n.set(defaults.i18n);
  }

  closeNavCollapsedMob() {
    this.navCollapsedMob.set(false);
  }
}
