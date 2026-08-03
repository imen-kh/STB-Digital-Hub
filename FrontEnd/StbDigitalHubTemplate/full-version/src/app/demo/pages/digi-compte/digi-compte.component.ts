import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AccountSummary, DigiCompteService } from 'src/app/theme/shared/service/digi-compte.service';
import { AccountWidgetComponent } from './account-widget/account-widget.component';

@Component({
  selector: 'app-digi-compte',
  imports: [...SHARED_IMPORTS, FormsModule, AccountWidgetComponent],
  templateUrl: './digi-compte.component.html',
  styleUrl: './digi-compte.component.scss'
})
export class DigiCompteComponent implements OnInit {
  private readonly digiCompteService = inject(DigiCompteService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal('');
  accounts = signal<AccountSummary[]>([]);
  typeFilter = signal('');

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.error.set('');
    this.digiCompteService
      .getAccounts(this.typeFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.accounts.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Impossible de charger les comptes.');
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.loadAccounts();
  }

  openAccount(id: number): void {
    this.router.navigate(['/comptes', id]);
  }
}
