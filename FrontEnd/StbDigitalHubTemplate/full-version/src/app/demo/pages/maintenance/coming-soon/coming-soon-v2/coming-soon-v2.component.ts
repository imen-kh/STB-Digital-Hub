// Angular import
import { Component, effect, inject } from '@angular/core';

// project import
import { ConfigService } from 'src/app/theme/shared/service/config.service';

@Component({
  selector: 'app-coming-soon-v2',
  imports: [],
  templateUrl: './coming-soon-v2.component.html',
  styleUrl: './coming-soon-v2.component.scss'
})
export class ComingSoonV2Component {
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
