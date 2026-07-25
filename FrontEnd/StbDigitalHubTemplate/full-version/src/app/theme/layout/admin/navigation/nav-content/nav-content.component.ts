// Angular import
import { AfterViewInit, Component, ElementRef, OnInit, viewChild, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, filter } from 'rxjs';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';

//theme version
import { environment } from 'src/environments/environment';

// project import
import { NavigationItem, NavigationItems } from '../navigation';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { NavCollapseComponent } from './nav-collapse/nav-collapse.component';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { NavItemComponent } from './nav-item/nav-item.component';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { Role } from 'src/app/theme/shared/_helpers/role';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

@Component({
  selector: 'app-nav-content',
  imports: [...SHARED_IMPORTS, CommonModule, RouterModule, NavCollapseComponent, NavGroupComponent, NavItemComponent, ScrollbarComponent],
  templateUrl: './nav-content.component.html',
  styleUrl: './nav-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavContentComponent implements AfterViewInit, OnInit {
  authenticationService = inject(AuthenticationService);
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private configService = inject(ConfigService);
  private router = inject(Router);

  // public props
  readonly NavCollapsedMob = output<void>();
  readonly SubmenuCollapse = output<void>();

  // version
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;

  layout = this.configService.layout;
  windowWidth = toSignal(fromEvent(window, 'resize').pipe(map(() => window.innerWidth)), { initialValue: window.innerWidth });

  navigation = signal<NavigationItem[]>([]);

  prevDisabled = signal('disabled');
  nextDisabled = signal('');

  contentWidth = 0;
  wrapperWidth = 0;
  scrollWidth = 0;

  collapseItem = signal<NavigationItem | null>(null);

  readonly navbarContent = viewChild.required<ElementRef>('navbarContent');
  readonly navbarWrapper = viewChild.required<ElementRef>('navbarWrapper');

  ngOnInit() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.collapseItem.set(null);
      document.querySelector('app-navigation.coded-navbar')?.classList.remove('coded-trigger');
    });

    if (this.windowWidth() < 1025) {
      setTimeout(() => {
        const el = document.querySelector('.coded-navbar');
        if (el) el.classList.add('menupos-static');
      }, 500);
    }
    const currentUser = this.authenticationService.currentUserValue;
    const userRoles = currentUser?.user.role ? [currentUser.user.role] : [Role.Admin];
    this.navigation.set(this.filterMenu(NavigationItems, userRoles));
  }

  filterMenu(NavigationItems: NavigationItem[], userRoles: string[], parentRoles: string[] = [Role.Admin]): NavigationItem[] {
    return NavigationItems.map((item) => {
      const itemRoles = item.role ? item.role : parentRoles;
      if (item.children) {
        item.children = this.filterMenu(item.children, userRoles, itemRoles);
      }
      return item;
    });
  }

  ngAfterViewInit() {
    if (this.layout() === 'horizontal') {
      this.contentWidth = this.navbarContent().nativeElement.clientWidth;
      this.wrapperWidth = this.navbarWrapper().nativeElement.clientWidth;
    }
  }

  scrollPlus() {
    this.scrollWidth = this.scrollWidth + (this.wrapperWidth - 200);
    if (this.scrollWidth > this.contentWidth - this.wrapperWidth) {
      this.scrollWidth = this.contentWidth - this.wrapperWidth + 200;
      this.nextDisabled.set('disabled');
    }
    this.prevDisabled.set('');
    (document.querySelector('#side-nav-horizontal') as HTMLElement).style.marginLeft = '-' + this.scrollWidth + 'px';
  }

  scrollMinus() {
    this.scrollWidth = this.scrollWidth - this.wrapperWidth;
    if (this.scrollWidth < 0) {
      this.scrollWidth = 0;
      this.prevDisabled.set('disabled');
    }
    this.nextDisabled.set('');
    (document.querySelector('#side-nav-horizontal') as HTMLElement).style.marginLeft = '-' + this.scrollWidth + 'px';
  }

  fireLeave() {
    const sections = document.querySelectorAll('.coded-hasmenu');
    for (let i = 0; i < sections.length; i++) {
      sections[i].classList.remove('active');
      sections[i].classList.remove('coded-trigger');
    }

    let current_url = this.location.path();
    // eslint-disable-next-line
    // @ts-ignore
    if (this.location['_baseHref']) {
      // eslint-disable-next-line
      // @ts-ignore
      current_url = this.location['_baseHref'] + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('active');
      }
    }
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) current_url = baseHref + this.location.path();
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      const layoutType = this.layout();
      if (parent?.classList.contains('coded-hasmenu')) {
        if (layoutType === 'vertical') {
          parent.classList.add('coded-trigger');
        }
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        if (layoutType === 'vertical') {
          up_parent.classList.add('coded-trigger');
        }
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        if (layoutType === 'vertical') {
          last_parent.classList.add('coded-trigger');
        }
        last_parent.classList.add('active');
      }
    }
  }

  navMob() {
    if (this.windowWidth() < 1025 && document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }

  subMenuCollapse(item: NavigationItem) {
    if (this.collapseItem() === item) {
      this.collapseItem.set(null);
      document.querySelector('app-navigation.coded-navbar')?.classList.remove('coded-trigger');
    } else {
      this.collapseItem.set(item);
      this.SubmenuCollapse.emit();
    }
  }
}
