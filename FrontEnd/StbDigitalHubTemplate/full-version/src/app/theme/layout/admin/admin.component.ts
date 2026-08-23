// Angular import
import { AfterViewInit, Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

// Project import
import { ConfigService } from '../../shared/service/config.service';
import { SHARED_IMPORTS } from '../../shared/shared.module';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ChatAssistantComponent } from '../../shared/components/chat-assistant/chat-assistant.component';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, ...SHARED_IMPORTS, NavigationComponent, NavBarComponent, RouterModule, BreadcrumbComponent, ChatAssistantComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, AfterViewInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  configService = inject(ConfigService);
  cdr = inject(ChangeDetectorRef);

  // public props
  layouts = this.configService.layout();
  currentLayout!: string;
  navCollapsed: boolean = true;
  windowWidth!: number;

  // Constructor
  constructor() {
    effect(() => {
      this.isThemeLayout(this.configService.layout());
    });
  }

  // life cycle hook
  ngOnInit() {
    this.configService.isLanding.set(false);
    this.configService.applyDocumentTheme();
  }

  ngAfterViewInit() {
    this.currentLayout = this.configService.layout();
    const content = document.querySelector('.coded-content');
    content?.classList.toggle('container', this.configService.isBox_container());
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }

    if (current_url === baseHref + '/layout/theme-compact' || current_url === baseHref + '/layout/box') {
      this.configService.isCollapse_menu.set(true);
    }

    this.windowWidth = window.innerWidth;
    this.navCollapsed = this.windowWidth >= 1025 ? this.configService.isCollapse_menu() : false;
    this.cdr.detectChanges();
  }

  // private method
  private isThemeLayout(layout: string) {
    this.currentLayout = layout;
  }

  // public method
  navMobClick() {
    if (this.configService.navCollapsedMob() && !document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.configService.navCollapsedMob.set(!this.configService.navCollapsedMob());
      setTimeout(() => {
        this.configService.navCollapsedMob.set(!this.configService.navCollapsedMob());
      }, 100);
    } else {
      this.configService.navCollapsedMob.set(!this.configService.navCollapsedMob());
    }
    if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('navbar-collapsed')) {
      document.querySelector('app-navigation.pc-sidebar')?.classList.remove('navbar-collapsed');
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    this.configService.closeNavCollapsedMob();
    if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('mob-open')) {
      document.querySelector('app-navigation.pc-sidebar')?.classList.remove('mob-open');
    }
  }
}
