// Angular import
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { first } from 'rxjs';

// project import
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AppNotification, NotificationService } from 'src/app/theme/shared/service/notification.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

// third party
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-nav-right',
  imports: [...SHARED_IMPORTS, RouterModule, ScrollbarComponent],
  templateUrl: './nav-right.component.html',
  styleUrl: './nav-right.component.scss'
})
export class NavRightComponent implements OnInit, OnDestroy {
  authenticationService = inject(AuthenticationService);
  notificationService = inject(NotificationService);
  private configService = inject(ConfigService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private pollId: ReturnType<typeof setInterval> | null = null;
  private onFullscreenChange = () => {
    this.screenFull = !document.fullscreenElement;
  };

  user?: null;
  screenFull: boolean = true;

  ngOnInit() {
    setTimeout(() => {
      this.translate.setFallbackLang(this.configService.i18n());
    }, 0);
    this.onFullscreenChange();
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    this.refreshNotifications();
    this.pollId = setInterval(() => this.refreshNotifications(), 30000);
  }

  ngOnDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    if (this.pollId) {
      clearInterval(this.pollId);
    }
  }

  logout() {
    this.authenticationService.logout();
  }

  useLanguage(language: string) {
    this.translate.use(language);
  }

  onNotificationOpen(open: boolean): void {
    if (open) {
      this.refreshNotifications();
    }
  }

  refreshNotifications(): void {
    this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
  }

  markAllNotificationsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.markAllAsRead().pipe(first()).subscribe();
  }

  openNotification(item: AppNotification): void {
    if (!item.lue) {
      this.notificationService.markAsRead(item.id).pipe(first()).subscribe();
    }
    if (item.idCarte) {
      this.router.navigate(['/digi-carte', item.idCarte]);
    }
  }

  formatNotificationTime(value: string): string {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) {
      return "à l'instant";
    }
    if (minutes < 60) {
      return `il y a ${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `il y a ${hours} h`;
    }
    return date.toLocaleString('fr-FR');
  }

  componentSections = [
    {
      title: 'UI Components',
      items: [
        { title: 'Alerts', url: '/basic/alert' },
        { title: 'Accordions', url: '/basic/collapse' },
        { title: 'DropDown', url: '/basic/dropdowns' },
        { title: 'Badges', url: '/basic/badges' },
        { title: 'Breadcrumbs', url: '/basic/breadcrumb' }
      ]
    },
    {
      title: 'Application',
      items: [
        { title: 'Chat', url: '/chat' },
        { title: 'Kanban', url: '/kanban' },
        { title: 'Mail', url: '/mail' },
        { title: 'Calendar', url: '/calender' },
        { title: 'E-Commerce', url: '/ec/ec-product' }
      ]
    },
    {
      title: 'Components',
      items: [
        { title: 'Sweet Alert', url: '/advance/sweetAlert' },
        { title: 'Light Box', url: '/advance/lightbox' },
        { title: 'Modal', url: '/advance/modal' },
        { title: 'Notification', url: '/advance/notification' },
        { title: 'Tree View', url: '/advance/treeView' }
      ]
    }
  ];

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      this.screenFull = true;
    } else {
      document.documentElement.requestFullscreen();
      this.screenFull = false;
    }
  }
}
