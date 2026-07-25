// Angular import
import {
  Component,
  OnInit,
  Renderer2,
  ViewEncapsulation,
  inject,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbOffcanvas, NgbOffcanvasRef } from '@ng-bootstrap/ng-bootstrap';

// project import
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

// Constants for DOM class/part lists
const FONT_FAMILIES = ['Roboto', 'Poppins', 'Inter'] as const;
const PRESETS = ['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5', 'preset-6', 'preset-7'] as const;
const LAYOUTS = ['vertical', 'horizontal', 'compact'] as const;

@Component({
  selector: 'app-configuration',
  imports: [...SHARED_IMPORTS, RouterModule, ScrollbarComponent],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurationComponent implements OnInit {
  private offcanvasService = inject(NgbOffcanvas);
  private offcanvasRef?: NgbOffcanvasRef;
  private location = inject(Location);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);
  private locationStrategy = inject(LocationStrategy);
  configService = inject(ConfigService);
  @ViewChild('customizerTemplate') customizerTemplate!: TemplateRef<string>;

  // public props
  styleSelectorToggle = false;
  windowWidth: number;
  layout!: string;
  themeMode!: boolean;
  rtlLayout!: boolean;
  boxContainer!: boolean;
  setFontFamily!: string;
  bodyColor!: string;
  sidebar_caption_hide!: boolean;
  landingPage!: boolean;
  active = 1;

  // Constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.setThemeLayout();
  }

  // Life cycle events
  ngOnInit() {
    this.applyAllSettings();
  }

  toggleStyleSelector() {
    if (this.customizerTemplate) {
      this.styleSelectorToggle = true;
      const position = this.rtlLayout === true ? 'start' : 'end';
      this.offcanvasRef = this.offcanvasService.open(this.customizerTemplate, { position });
      this.cdr.markForCheck();
    }
  }

  /**
   * Reads all persisted values from configService and applies them to local state + DOM.
   * Used by both ngOnInit (initial load) and setResetLayout (reset button).
   */
  private applyAllSettings(): void {
    this.setMenuOrientation(this.configService.layout());
    this.setDarkLayout(this.configService.isDarkMode());
    this.fontFamily(this.configService.font_family());
    this.SetBodyColor(this.configService.theme_color());
    this.setRtlLayout(this.configService.isRtl_layout());
    this.setBoxContainer(this.windowWidth >= 1025 ? this.configService.isBox_container() : false);
    this.captionShow(this.configService.sidebar_caption_hide());
    this.landingPage = this.configService.isLanding();
  }

  // sidebar layout change based on URL
  setThemeLayout() {
    let currentUrl = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      currentUrl = baseHref + this.location.path();
    }

    const layoutMap: Record<string, string> = {
      '/layout/vertical': 'vertical',
      '/layout/compact': 'compact',
      '/layout/horizontal': 'horizontal'
    };

    for (const [path, layout] of Object.entries(layoutMap)) {
      if (currentUrl === baseHref + path) {
        this.configService.layout.set(layout);
        break;
      }
    }
  }

  // change main layout dark and light
  setDarkLayout(isDark: boolean) {
    this.themeMode = isDark;
    if (isDark) {
      this.renderer.addClass(document.body, 'berry-dark');
      document.documentElement.classList.add('dark');
    } else {
      this.renderer.removeClass(document.body, 'berry-dark');
      document.documentElement.classList.remove('dark');
    }
    this.configService.isDarkMode.set(isDark);
  }

  // reset all settings to defaults and clear localStorage
  setResetLayout() {
    this.configService.resetToDefaults();
    this.applyAllSettings();
    this.closeCustomizer();
  }

  // set rtl and ltr theme mode
  setRtlLayout(isRtl: boolean) {
    this.rtlLayout = isRtl;
    const addDir = isRtl ? 'berry-rtl' : 'berry-ltr';
    const removeDir = isRtl ? 'berry-ltr' : 'berry-rtl';
    this.renderer.removeClass(document.body, removeDir);
    this.renderer.addClass(document.body, addDir);
    this.configService.isRtl_layout.set(isRtl);
    this.cdr.markForCheck();
  }

  // sidebar menu caption show and hide
  captionShow(hide: boolean) {
    this.sidebar_caption_hide = hide;
    const navbar = document.querySelector('.coded-navbar');
    if (hide) {
      navbar?.classList.add('caption-hide');
    } else {
      navbar?.classList.remove('caption-hide');
    }
    this.configService.sidebar_caption_hide.set(hide);
  }

  // set box container
  setBoxContainer(boxContainer: boolean) {
    this.boxContainer = boxContainer;
    const content = document.querySelector('.coded-content');
    if (boxContainer) {
      content?.classList.add('container');
    } else {
      content?.classList.remove('container');
    }
    this.configService.isBox_container.set(boxContainer);
  }

  // set font family
  fontFamily(font: string) {
    this.setFontFamily = font;
    for (const f of FONT_FAMILIES) {
      this.renderer.removeClass(document.body, f);
    }
    this.renderer.addClass(document.body, font);
    this.configService.font_family.set(font);
  }

  // set theme preset color
  SetBodyColor(preset: string) {
    this.bodyColor = preset;
    const bodyPart = document.body?.part;
    if (bodyPart) {
      for (const p of PRESETS) {
        bodyPart.remove(p);
      }
      bodyPart.add(preset);
    }
    this.configService.theme_color.set(preset);
  }

  // set menu orientation
  setMenuOrientation(layout: string) {
    this.layout = layout;
    const navbar = document.querySelector('.coded-navbar');
    if (navbar) {
      for (const l of LAYOUTS) {
        navbar.classList.remove(l);
      }
      navbar.classList.add(layout);
    }
    this.configService.layout.set(layout);
  }

  closeCustomizer() {
    try {
      this.offcanvasRef?.dismiss();
    } catch {
      // Ignore errors when closing offcanvas
    }
    this.styleSelectorToggle = false;
  }
}
