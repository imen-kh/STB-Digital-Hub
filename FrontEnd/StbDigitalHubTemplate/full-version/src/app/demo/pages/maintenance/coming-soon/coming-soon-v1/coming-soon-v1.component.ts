// Angular import
import { Component, OnInit, effect, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { BerryDefaultConfig } from 'src/app/app-config';

@Component({
  selector: 'app-coming-soon-v1',
  imports: [...SHARED_IMPORTS],
  templateUrl: './coming-soon-v1.component.html',
  styleUrl: './coming-soon-v1.component.scss'
})
export class ComingSoonV1Component implements OnInit {
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
