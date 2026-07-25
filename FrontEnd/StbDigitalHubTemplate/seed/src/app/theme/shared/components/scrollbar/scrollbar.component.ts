// angular import
import { Component, effect, inject, input } from '@angular/core';

// third party
import { NgScrollbarModule } from 'ngx-scrollbar';

// project import
import { ConfigService } from '../../service/config.service';

@Component({
  selector: 'app-scrollbar',
  imports: [NgScrollbarModule],
  templateUrl: './scrollbar.component.html',
  styleUrl: './scrollbar.component.scss'
})
export class ScrollbarComponent {
  private configService = inject(ConfigService);

  customStyle = input<{ [key: string]: string }>({});

  direction: string = 'ltr';

  // constructor
  constructor() {
    effect(() => {
      this.isRtlTheme(this.configService.isRtl_layout());
    });
  }

  // private method
  private isRtlTheme(isRtl: boolean) {
    this.direction = isRtl === true ? 'rtl' : 'ltr';
  }
}
