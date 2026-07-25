// Angular import
import { Component, effect, inject } from '@angular/core';

import { RouterModule } from '@angular/router';

//project import
import { ConfigService } from 'src/app/theme/shared/service/config.service';

@Component({
  selector: 'app-maintain-error',
  imports: [RouterModule],
  templateUrl: './maintain-error.component.html',
  styleUrl: './maintain-error.component.scss'
})
export class MaintainErrorComponent {
  private configService = inject(ConfigService);

  isDark: boolean = false;

  //constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.isDark = isDark;
  }
}
