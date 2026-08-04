import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { DashboardCardsComponent } from '../dashboard-cards/dashboard-cards.component';
import { DashboardAccountsComponent } from '../dashboard-accounts/dashboard-accounts.component';
import { DashboardOverviewComponent } from '../dashboard-overview/dashboard-overview.component';

@Component({
  selector: 'app-default',
  imports: [...SHARED_IMPORTS, RouterLink, DashboardAccountsComponent, DashboardCardsComponent, DashboardOverviewComponent],
  templateUrl: './default.component.html',
  styleUrl: './default.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultComponent {
  private readonly auth = inject(AuthenticationService);

  readonly welcomeName = computed(() => {
    const full = this.auth.currentUserName();
    const first = full.split(' ')[0];
    return first || 'Client';
  });
}
