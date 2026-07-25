// Angular import
import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v2-login',
  imports: [RouterModule, ...SHARED_IMPORTS, LogoComponent, RouterLink],
  templateUrl: './v2-login.component.html',
  styleUrl: './v2-login.component.scss'
})
export class V2LoginComponent implements OnInit {
  private configService = inject(ConfigService);

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
