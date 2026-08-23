import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  AccountDetail,
  AccountSummary,
  AccountTransaction,
  DigiCompteService
} from 'src/app/theme/shared/service/digi-compte.service';

@Component({
  selector: 'app-digi-compte-detail',
  imports: [...SHARED_IMPORTS, FormsModule, NgApexchartsModule],
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
  transferAmount = signal(200);
  transferMotif = signal('');
  activityChart!: ApexOptions;
  typesChart!: ApexOptions;

  private accountId = 0;

  ngOnInit(): void {
    this.initCharts();
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
        next: (data) => {
          this.transactions.set(data);
          this.applyCharts(data);
        },
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
          const savings = others.find((a) => a.type === 'Épargne');
          if (!this.transferTargetId()) {
            this.transferTargetId.set((savings ?? others[0])?.id ?? null);
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

  savingsAccount(): AccountSummary | undefined {
    return this.otherAccounts().find((a) => a.type === 'Épargne');
  }

  verserVersEpargne(): void {
    const savings = this.savingsAccount();
    if (!savings) {
      this.error.set('Aucun compte épargne disponible.');
      return;
    }
    this.transferTargetId.set(savings.id);
    this.transferMotif.set('Versement vers épargne');
    this.transfer();
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

  monthIn(): number {
    return this.monthTxs()
      .filter((t) => this.isCredit(t.typeMouvement))
      .reduce((s, t) => s + t.montant, 0);
  }

  monthOut(): number {
    return this.monthTxs()
      .filter((t) => !this.isCredit(t.typeMouvement))
      .reduce((s, t) => s + t.montant, 0);
  }

  monthCount(): number {
    return this.monthTxs().length;
  }

  copyIban(): void {
    const iban = this.account()?.iban;
    if (!iban || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(iban).then(() => this.success.set('IBAN copié.'));
  }

  private monthTxs(): AccountTransaction[] {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.transactions().filter((t) => t.statut !== 'Non valide' && new Date(t.dateTransaction) >= start);
  }

  private applyCharts(txs: AccountTransaction[]): void {
    const valid = txs.filter((t) => t.statut !== 'Non valide');
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - 13);
    const credits: number[] = [];
    const debits: number[] = [];
    const labels: string[] = [];
    for (let i = 0; i < 14; i++) {
      const day = new Date(from);
      day.setDate(from.getDate() + i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      labels.push(day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      const dayTx = valid.filter((t) => {
        const d = new Date(t.dateTransaction);
        return d >= day && d < next;
      });
      credits.push(Number(dayTx.filter((t) => this.isCredit(t.typeMouvement)).reduce((s, t) => s + t.montant, 0).toFixed(2)));
      debits.push(Number(dayTx.filter((t) => !this.isCredit(t.typeMouvement)).reduce((s, t) => s + t.montant, 0).toFixed(2)));
    }

    this.activityChart = {
      ...this.activityChart,
      series: [
        { name: 'Entrées', data: credits },
        { name: 'Sorties', data: debits }
      ],
      xaxis: { ...this.activityChart.xaxis, categories: labels }
    };

    const byType = new Map<string, number>();
    for (const tx of valid) {
      byType.set(tx.typeMouvement, (byType.get(tx.typeMouvement) ?? 0) + tx.montant);
    }
    const slices = [...byType.entries()];
    this.typesChart = {
      ...this.typesChart,
      labels: slices.length ? slices.map(([k]) => k) : ['Aucune opération'],
      series: slices.length ? slices.map(([, v]) => Number(v.toFixed(2))) : [1]
    };
  }

  private initCharts(): void {
    this.activityChart = {
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      colors: ['#0b6e4f', '#1565c0'],
      series: [
        { name: 'Entrées', data: [] },
        { name: 'Sorties', data: [] }
      ],
      xaxis: { categories: [] },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
    this.typesChart = {
      chart: { type: 'donut', height: 260, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#1565c0', '#0b6e4f', '#1dc4e9'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
  }
}
