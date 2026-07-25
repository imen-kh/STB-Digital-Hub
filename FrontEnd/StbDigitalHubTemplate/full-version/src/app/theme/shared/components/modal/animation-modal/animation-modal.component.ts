// Angular import
import { Component, ViewEncapsulation, effect, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';

// project import
import { ConfigService } from '../../../service/config.service';

@Component({
  selector: 'app-animation-modal',
  imports: [NgClass],
  templateUrl: './animation-modal.component.html',
  styleUrl: './animation-modal.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AnimationModalComponent {
  private configService = inject(ConfigService);

  // public props
  modalClass = input<string>();
  contentClass = input<string>();
  modalID = input<string>();
  backDrop = input(false);
  themeMode = this.configService.isDarkMode();

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }

  // public method
  close(event: string) {
    (document.querySelector('#' + event) as HTMLElement).classList.remove('md-show');
  }
}
