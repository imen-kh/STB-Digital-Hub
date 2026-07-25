// Angular import
import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { Logo } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v1-register',
  imports: [RouterModule, ...SHARED_IMPORTS, Logo],
  templateUrl: './v1-register.component.html',
  styleUrl: './v1-register.component.scss'
})
export class V1RegisterComponent implements OnInit {
  private configService = inject(ConfigService);
  authenticationService = inject(AuthenticationService);

  // public props
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
