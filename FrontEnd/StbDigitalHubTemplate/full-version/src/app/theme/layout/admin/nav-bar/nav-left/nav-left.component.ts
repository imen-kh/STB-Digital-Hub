// Angular import
import { Component, output, inject, computed } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { BerryDefaultConfig } from 'src/app/app-config';

@Component({
  selector: 'app-nav-left',
  imports: [...SHARED_IMPORTS],
  templateUrl: './nav-left.component.html',
  styleUrl: './nav-left.component.scss'
})
export class NavLeftComponent {
  private configService = inject(ConfigService);
  currentLayout = computed(() => this.configService.layout() || BerryDefaultConfig.layout);

  // public props
  NavCollapsedMob = output();

  // public method
  navCollapsedMob() {
    this.NavCollapsedMob.emit();
  }
}
