// angular import
import { Component, OnInit, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { PlaceholderCard3Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-3.component';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ...SHARED_IMPORTS, PlaceholderCard3Component],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);
  // public props
  iSDarkTheme!: boolean;
  isLoaded = false;

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    this.isLoaded = true;
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.iSDarkTheme = isDark;
  }

  // public method
  SocialMediaList = [
    {
      href: 'https://codedthemes.com/',
      title: 'https://codedthemes.com/',
      icon: 'public',
      icon2: 'material-icons-two-tone me-2 text-secondary'
    },
    {
      href: 'https://www.instagram.com/codedthemes',
      title: 'https://www.instagram.com/codedthemes',
      icon2: 'ti ti-brand-instagram f-24 me-2 text-danger'
    },
    {
      href: 'https://www.facebook.com/codedthemes',
      title: 'https://www.facebook.com/codedthemes',
      icon2: 'material-icons-two-tone me-2 text-primary',
      icon: 'facebook'
    },
    {
      href: 'https://in.linkedin.com/company/codedthemes',
      title: 'https://in.linkedin.com/company/codedthemes',
      icon2: 'ti ti-brand-linkedin f-24 me-2 text-primary'
    }
  ];

  CommentList = [
    {
      src: 'assets/images/user/avatar-4.jpg',
      user: 'Barney Thea',
      time: '8 min ago',
      space: 'mb-3',
      text: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      user: 'Barney Thea',
      time: '8 min ago',
      space: 'mb-3',
      text: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
    },
    {
      src: 'assets/images/user/avatar-5.jpg',
      user: 'Barney Thea',
      time: '8 min ago',
      space: 'mb-3',
      text: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
    }
  ];
}
