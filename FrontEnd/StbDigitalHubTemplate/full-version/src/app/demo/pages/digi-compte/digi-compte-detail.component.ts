import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  AccountDetail,
  AccountSummary,
  AccountTransaction,
  DigiCompteService
} from 'src/app/theme/shared/service/digi-compte.service';

@Component({
  selector: 'app-digi-compte-detail',
  imports: [...SHARED_IMPORTS, FormsModule],
  templateUrl: './digi-compte-detail.component.html',
  styleUrl: './digi-compte-detail.component.scss'
})
export class DigiCompteDetailComponent implements OnInit {
  private readonly digiCompteService = inject(DigiCompteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  showRib = signal(false);

  account = signal<AccountDetail | null>(null);
  transactions = signal<AccountTransaction[]>([]);
  otherAccounts = signal<AccountSummary[]>([]);

  transferTargetId = signal<number | null>(null);
  transferAmount = signal(50);
  transferMotif = signal('');

  private accountId = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.router.navigate(['/comptes']);
        return;
      }
      this.accountId = id;
      this.loadAccount();
    });
  }

  goBack(): void {
    this.router.navigate(['/comptes']);
  }

  loadAccount(): void {
    this.loading.set(true);
    this.error.set('');
    this.showRib.set(false);
    this.digiCompteService
      .getAccount(this.accountId)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.account.set(data);
          this.loading.set(false);
          this.loadTransactions();
          this.loadOtherAccounts();
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Compte introuvable.');
          this.loading.set(false);
        }
      });
  }

  loadTransactions(): void {
    this.digiCompteService
      .getTransactions(this.accountId)
      .pipe(first())
      .subscribe({
        next: (data) => this.transactions.set(data),
        error: () => this.transactions.set([])
      });
  }

  loadOtherAccounts(): void {
    this.digiCompteService
      .getAccounts()
      .pipe(first())
      .subscribe({
        next: (data) => {
          const others = data.filter((a) => a.id !== this.accountId && a.statut === 'Actif');
          this.otherAccounts.set(others);
          if (others.length && !this.transferTargetId()) {
            this.transferTargetId.set(others[0].id);
          }
        },
        error: () => this.otherAccounts.set([])
      });
  }

  transfer(): void {
    const target = this.transferTargetId();
    if (!target) {
      this.error.set('Choisissez un compte de destination.');
      return;
    }
    if (!this.transferAmount() || this.transferAmount() <= 0) {
      this.error.set('Saisissez un montant supérieur à zéro.');
      return;
    }

    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');
    this.digiCompteService
      .transfer(this.accountId, target, this.transferAmount(), this.transferMotif() || undefined)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.account.set(res.source);
          this.success.set(res.message);
          this.loadTransactions();
          this.loadOtherAccounts();
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Virement impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('fr-FR');
  }

  isCredit(type: string): boolean {
    return type === 'Crédit' || type === 'Virement entrant';
  }

  themeClass(type: string): string {
    return type === 'Épargne' ? 'theme-epargne' : 'theme-courant';
  }
}
