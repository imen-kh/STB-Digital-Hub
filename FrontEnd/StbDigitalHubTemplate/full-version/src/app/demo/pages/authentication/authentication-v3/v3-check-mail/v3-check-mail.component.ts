// Angular import
import { RouterLink } from '@angular/router';
import { Component, OnInit, effect, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { BerryDefaultConfig } from 'src/app/app-config';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v3-check-mail',
  imports: [RouterLink, ...SHARED_IMPORTS, LogoComponent],
  templateUrl: './v3-check-mail.component.html',
  styleUrl: './v3-check-mail.component.scss'
})
export class V3CheckMailComponent implements OnInit {
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
