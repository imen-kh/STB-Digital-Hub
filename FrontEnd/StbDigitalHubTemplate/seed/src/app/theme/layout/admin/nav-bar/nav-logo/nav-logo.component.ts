// Angular import
import { Component, OnInit, effect, output, inject, model, HostListener, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Logo } from 'src/app/theme/shared/components/logo/logo.component';

// project import
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-nav-logo',
  imports: [...SHARED_IMPORTS, Logo, RouterLink],
  templateUrl: './nav-logo.component.html',
  styleUrl: './nav-logo.component.scss'
})
export class NavLogoComponent implements OnInit {
  router = inject(Router);
  private configService = inject(ConfigService);

  // public props
  navCollapsed = model<boolean>(false);
  NavCollapse = output();
  windowWidth = signal<number>(window.innerWidth);
  themeMode!: boolean;
  currentLayout = computed(() => this.configService.layout());

  // Constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // life cycle event
  ngOnInit() {
    this.themeMode = this.configService.isDarkMode();
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }

  // public method
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.windowWidth.set((event.target as Window).innerWidth);
  }

  navCollapse() {
    if (this.windowWidth() >= 1025) {
      this.navCollapsed.update((v) => !v);
      this.NavCollapse.emit();
    }
  }
}
