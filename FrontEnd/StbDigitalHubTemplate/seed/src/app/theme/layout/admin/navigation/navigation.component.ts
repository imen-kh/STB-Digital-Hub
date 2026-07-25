// Angular import
import { Component, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map } from 'rxjs';

// project import
import { Logo } from 'src/app/theme/shared/components/logo/logo.component';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { NavContentComponent } from './nav-content/nav-content.component';

@Component({
  selector: 'app-navigation',
  imports: [...SHARED_IMPORTS, NavContentComponent, Logo, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent {
  router = inject(Router);
  configService = inject(ConfigService);

  readonly NavCollapsedMob = output<void>();
  readonly SubmenuCollapse = output<void>();

  layout = this.configService.layout;
  isDarkMode = this.configService.isDarkMode;

  windowWidth = toSignal(fromEvent(window, 'resize').pipe(map(() => window.innerWidth)), {
    initialValue: window.innerWidth
  });

  navCollapseMob() {
    if (this.windowWidth() < 1025) {
      this.NavCollapsedMob.emit();
    }
  }

  navSubmenuCollapse() {
    document.querySelector('app-navigation.coded-navbar')?.classList.add('coded-trigger');
  }
}
