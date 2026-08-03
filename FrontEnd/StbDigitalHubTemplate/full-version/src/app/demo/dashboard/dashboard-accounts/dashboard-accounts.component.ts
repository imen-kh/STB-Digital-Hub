import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AccountSummary, DigiCompteService } from 'src/app/theme/shared/service/digi-compte.service';
import { AccountWidgetComponent } from '../../pages/digi-compte/account-widget/account-widget.component';

@Component({
  selector: 'app-dashboard-accounts',
  imports: [...SHARED_IMPORTS, AccountWidgetComponent, RouterLink],
  templateUrl: './dashboard-accounts.component.html',
  styleUrl: './dashboard-accounts.component.scss'
})
export class DashboardAccountsComponent implements OnInit {
  private readonly digiCompteService = inject(DigiCompteService);
  private readonly router = inject(Router);

  loading = signal(true);
  accounts = signal<AccountSummary[]>([]);

  ngOnInit(): void {
    this.digiCompteService
      .getAccounts()
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.accounts.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  openAccount(id: number): void {
    this.router.navigate(['/comptes', id]);
  }
}
