// Angular import

import { Component, inject, output } from '@angular/core';

// project import
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { NavLeftComponent } from './nav-left/nav-left.component';
import { NavLogoComponent } from './nav-logo/nav-logo.component';
import { NavRightComponent } from './nav-right/nav-right.component';

@Component({
  selector: 'app-nav-bar',
  imports: [NavLogoComponent, NavLeftComponent, NavRightComponent, ...SHARED_IMPORTS],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  host: { '(window:resize)': 'onResize($event)' }
})
export class NavBarComponent {
  private configService = inject(ConfigService);

  // public props
  NavCollapse = output();
  NavCollapsedMob = output();
  navCollapsed: boolean;
  windowWidth: number;
  navCollapsedMob: boolean;

  // Constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsed = this.windowWidth >= 1025 ? this.configService.isCollapse_menu() : false;
    this.navCollapsedMob = false;
  }

  // public method
  navCollapse() {
    if (this.windowWidth >= 1025) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }

  onResize(event: Event): void {
    this.windowWidth = (event.target as Window).innerWidth;
    this.navCollapseMob();
  }

  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }
}
