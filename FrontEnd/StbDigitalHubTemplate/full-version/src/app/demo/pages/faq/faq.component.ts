// Angular import
import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-faq',
  imports: [RouterModule, ...SHARED_IMPORTS, LogoComponent, RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent implements OnInit {
  private configService = inject(ConfigService);

  // public props
  isCollapsed = true;
  themeMode!: boolean;

  //  constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // life cycle event
  ngOnInit() {
    this.themeMode = BerryDefaultConfig.isDarkMode;
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }

  // public method
  panels = [
    {
      title: 'when do I need Extended License?',
      text: 'If your End Product which is sold - Then only your required Extended License. i.e. If you take subscription charges (monthly, yearly, etc...) from your end users in this case you required Extended License.'
    },
    {
      title: 'What Support Includes?',
      text: '6 Months of Support Includes with 1 year of free updates. We are happy to solve your bugs, issue.'
    },
    {
      title: 'Is Berry Support Typescript?',
      text: 'Yes, Berry Support the TypeScript and it is only available in Plus and Extended License.'
    },
    {
      title: 'Is there any Roadmap for Berry?',
      text: 'Berry is our flagship React Dashboard Template and we always add the new features for the long run. You can check the Roadmap in Documentation.'
    }
  ];
}
