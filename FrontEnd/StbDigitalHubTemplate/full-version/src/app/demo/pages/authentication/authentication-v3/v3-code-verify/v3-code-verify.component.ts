// Angular import
import { RouterLink } from '@angular/router';
import { Component, OnInit, effect, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { BerryDefaultConfig } from 'src/app/app-config';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v3-code-verify',
  imports: [RouterLink, ...SHARED_IMPORTS, LogoComponent],
  templateUrl: './v3-code-verify.component.html',
  styleUrl: './v3-code-verify.component.scss'
})
export class V3CodeVerifyComponent implements OnInit {
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

  // public props
  tasks = [
    {
      mas: 'Please enter verification code. Character 1'
    },
    {
      mas: 'Please enter verification code. Character 2'
    },
    {
      mas: 'Please enter verification code. Character 3'
    },
    {
      mas: 'Please enter verification code. Character 4'
    }
  ];
}
