// Angular import
import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

// project import
import { BerryDefaultConfig } from 'src/app/app-config';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-contact-us',
  imports: [RouterModule, ...SHARED_IMPORTS, LogoComponent, RouterLink],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss'
})
export class ContactUsComponent implements OnInit {
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
}
