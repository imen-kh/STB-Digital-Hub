// Angular import
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
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
  private configService = inject(ConfigService);
  private translate = inject(TranslateService);
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
  }

  ngOnDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  // user logout
  logout() {
    this.authenticationService.logout();
  }

  // user according language change of sidebar menu item
  useLanguage(language: string) {
    this.translate.use(language);
  }

  // public props
  componentSections = [
    {
      title: 'UI Components',
      items: [
        {
          title: 'Alerts'
        },
        {
          title: 'Accordions'
        },
        {
          title: 'DropDown'
        },
        {
          title: 'Badges'
        },
        {
          title: 'Breadcrumbs'
        }
      ]
    },
    {
      title: 'Application',
      items: [
        {
          title: 'Chat'
        },
        {
          title: 'Kanban'
        },
        {
          title: 'Mail'
        },
        {
          title: 'Calendar'
        },
        {
          title: 'E-Commerce'
        }
      ]
    },
    {
      title: 'Components',
      items: [
        {
          title: 'Sweet Alert'
        },
        {
          title: 'Light Box'
        },
        {
          title: 'Modal'
        },
        {
          title: 'Notification'
        },
        {
          title: 'Tree View'
        }
      ]
    }
  ];
  notification = [
    {
      images: 'assets/images/user/avatar-2.jpg',
      background: 'bg-light-success',
      icon: 'ti ti-building-store',
      title: 'John Doe',
      time: '2 min ago',
      text: 'It is a long established fact that a reader will be distracted',
      badgeType: true,
      mailType: false,
      imagesType: false,
      conformation: false,
      iconType: false
    },
    {
      images: 'assets/images/user/avatar-2.jpg',
      background: 'bg-light-success',
      icon: 'ti ti-building-store',
      title: 'Store Verification Done',
      time: '3 min ago',
      text: 'We have successfully received your request.',
      badgeType: true,
      mailType: false,
      imagesType: false,
      conformation: false,
      iconType: true
    },
    {
      images: 'assets/images/user/avatar-2.jpg',
      background: 'bg-light-primary',
      icon: 'ti ti-mailbox',
      title: 'Check Your Mail.',
      time: '5 min ago',
      text: "All done! Now check your inbox as you're in for a sweet treat!",
      badgeType: false,
      mailType: true,
      imagesType: false,
      conformation: false,
      iconType: true
    },
    {
      images: 'assets/images/user/avatar-2.jpg',
      background: 'bg-light-success',
      icon: 'ti ti-building-store',
      title: 'John Doe',
      time: '8 min ago',
      text: 'Uploaded two file on 21Jan 2020',
      badgeType: false,
      mailType: false,
      imagesType: true,
      conformation: false,
      iconType: false
    },
    {
      images: 'assets/images/user/avatar-3.jpg',
      background: 'bg-light-success',
      icon: 'ti ti-building-store',
      title: 'John Doe',
      time: '10 min ago',
      text: 'It is a long established fact that a reader will be distracted',
      badgeType: false,
      mailType: false,
      imagesType: false,
      conformation: true,
      iconType: false
    }
  ];

  // full screen toggle
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
