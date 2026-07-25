// Angular import
import { Component, HostListener } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-dropdowns',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-dropdowns.component.html',
  styleUrl: './basic-dropdowns.component.scss'
})
export class BasicDropdownsComponent {
  dropdownPlacement = this.getPlacements();
  dropdownResponsive = this.GetPlacements();

  @HostListener('window:resize')
  onResize(): void {
    this.dropdownPlacement = this.getPlacements();
  }
  private getPlacements(): string {
    return window.innerWidth >= 576 ? 'left' : 'bottom-start';
  }
  private GetPlacements(): string {
    return window.innerWidth >= 576 ? 'right-top' : 'top-right';
  }
}
