// Angular import
import { Component, effect, inject } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

@Component({
  selector: 'app-form-actionbars',
  imports: [...SHARED_IMPORTS],
  templateUrl: './form-actionbars.component.html',
  styleUrl: './form-actionbars.component.scss'
})
export class FormActionbarsComponent {
  private configService = inject(ConfigService);

  isDark: boolean = false;

  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  private isDarkTheme(isDark: boolean) {
    this.isDark = isDark;
  }
}
