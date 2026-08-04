import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { DigiCompteService, AccountSummary, AccountTransaction } from 'src/app/theme/shared/service/digi-compte.service';
import { DigiCarteService, CardSummary, CardTransaction } from 'src/app/theme/shared/service/digi-carte.service';

interface DashboardKpis {
  soldeComptes: number;
  soldeCCash: number;
  transactionsMois: number;
}

@Component({
  selector: 'app-dashboard-overview',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardOverviewComponent implements OnInit {
  private readonly digiCompte = inject(DigiCompteService);
  private readonly digiCarte = inject(DigiCarteService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  kpis = signal<DashboardKpis>({ soldeComptes: 0, soldeCCash: 0, transactionsMois: 0 });

  balancesChart!: ApexOptions;
  activityChart!: ApexOptions;
  operationsChart!: ApexOptions;

  ngOnInit(): void {
    this.initEmptyCharts();
    this.loadData();
  }

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  private loadData(): void {
    this.loading.set(true);

    forkJoin({
      accounts: this.digiCompte.getAccounts().pipe(catchError(() => of([] as AccountSummary[]))),
      cards: this.digiCarte.getCards().pipe(catchError(() => of([] as CardSummary[])))
    })
      .pipe(
        switchMap(({ accounts, cards }) => {
          const accountTx$ = accounts.length
            ? forkJoin(
                accounts.map((a) =>
                  this.digiCompte.getTransactions(a.id).pipe(catchError(() => of([] as AccountTransaction[])))
                )
              )
            : of([] as AccountTransaction[][]);

          const cardTx$ = cards.length
            ? forkJoin(
                cards.map((c) =>
                  this.digiCarte.getTransactions(c.id).pipe(catchError(() => of([] as CardTransaction[])))
                )
              )
            : of([] as CardTransaction[][]);

          return forkJoin({ accountTxLists: accountTx$, cardTxLists: cardTx$ }).pipe(
            map(({ accountTxLists, cardTxLists }) => ({
              accounts,
              cards,
              accountTxs: accountTxLists.flat(),
              cardTxs: cardTxLists.flat()
            }))
          );
        })
      )
      .subscribe({
        next: (data) => {
          this.applyData(data.accounts, data.cards, data.accountTxs, data.cardTxs);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private applyData(
    accounts: AccountSummary[],
    cards: CardSummary[],
    accountTxs: AccountTransaction[],
    cardTxs: CardTransaction[]
  ): void {
    const soldeComptes = accounts.reduce((s, a) => s + (a.solde || 0), 0);
    const soldeCCash = cards
      .filter((c) => c.estCCash || c.estTravel)
      .reduce((s, c) => s + (c.solde || 0), 0);
    const monthStart = this.startOfMonth();
    const transactionsMois =
      accountTxs.filter((t) => new Date(t.dateTransaction) >= monthStart).length +
      cardTxs.filter((t) => new Date(t.dateTransaction) >= monthStart).length;

    this.kpis.set({ soldeComptes, soldeCCash, transactionsMois });

    this.buildBalancesChart(accounts, cards);
    this.buildActivityChart(accountTxs, cardTxs);
    this.buildOperationsChart(accountTxs, cardTxs);
  }

  private buildBalancesChart(accounts: AccountSummary[], cards: CardSummary[]): void {
    const labels: string[] = accounts.map((a) => a.libelle);
    const series: number[] = accounts.map((a) => Math.max(0, Number(a.solde.toFixed(2))));

    for (const card of cards.filter((c) => c.estCCash || c.estTravel)) {
      labels.push(`${card.type} ${card.numeroMasque.slice(-4)}`);
      series.push(Math.max(0, Number(card.solde.toFixed(2))));
    }

    if (!series.length || series.every((v) => v === 0)) {
      labels.push('Aucun solde');
      series.push(1);
    }

    this.balancesChart = {
      ...this.balancesChart,
      labels,
      series,
      colors: ['#003d7a', '#1565c0', '#1dc4e9', '#2e7d32', '#00897b'].slice(0, series.length)
    };
  }

  private buildActivityChart(accountTxs: AccountTransaction[], cardTxs: CardTransaction[]): void {
    const weeks = this.lastFourWeekLabels();
    const debits = [0, 0, 0, 0];
    const credits = [0, 0, 0, 0];
    const weekStarts = this.lastFourWeekStarts();

    const bucket = (date: Date): number => {
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (date >= weekStarts[i]) {
          return i;
        }
      }
      return -1;
    };

    for (const tx of accountTxs) {
      if (tx.statut === 'Non valide') {
        continue;
      }
      const d = new Date(tx.dateTransaction);
      const i = bucket(d);
      if (i < 0) {
        continue;
      }
      const isCredit = tx.typeMouvement === 'Crédit' || tx.typeMouvement === 'Virement entrant';
      if (isCredit) {
        credits[i] += tx.montant;
      } else {
        debits[i] += tx.montant;
      }
    }

    for (const tx of cardTxs) {
      if (tx.statut === 'Non valide') {
        continue;
      }
      const d = new Date(tx.dateTransaction);
      const i = bucket(d);
      if (i < 0) {
        continue;
      }
      if (tx.typeOperation === 'Recharge') {
        credits[i] += tx.montant;
      } else {
        debits[i] += tx.montant;
      }
    }

    this.activityChart = {
      ...this.activityChart,
      series: [
        { name: 'Débits / dépenses', data: debits.map((v) => Number(v.toFixed(2))) },
        { name: 'Crédits / recharges', data: credits.map((v) => Number(v.toFixed(2))) }
      ],
      xaxis: { ...this.activityChart.xaxis, categories: weeks }
    };
  }

  private buildOperationsChart(accountTxs: AccountTransaction[], cardTxs: CardTransaction[]): void {
    const counts = new Map<string, number>();
    const add = (label: string, montant: number) => {
      counts.set(label, (counts.get(label) ?? 0) + montant);
    };

    for (const tx of accountTxs) {
      if (tx.statut === 'Non valide') {
        continue;
      }
      add(tx.typeMouvement, tx.montant);
    }
    for (const tx of cardTxs) {
      if (tx.statut === 'Non valide') {
        continue;
      }
      add(tx.typeOperation, tx.montant);
    }

    let labels = [...counts.keys()];
    let series = labels.map((l) => Number((counts.get(l) ?? 0).toFixed(2)));

    if (!series.length) {
      labels = ['Aucune opération'];
      series = [1];
    }

    this.operationsChart = {
      ...this.operationsChart,
      labels,
      series,
      colors: ['#003d7a', '#1565c0', '#1dc4e9', '#2e7d32', '#00897b', '#ff9800', '#7e57c2'].slice(0, series.length)
    };
  }

  private initEmptyCharts(): void {
    this.balancesChart = {
      chart: { type: 'donut', height: 300, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#1565c0', '#1dc4e9', '#2e7d32'],
      legend: { position: 'bottom', fontFamily: 'Public Sans, sans-serif' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: {
        y: {
          formatter: (val: number) => this.formatMoney(val)
        }
      }
    };

    this.activityChart = {
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      colors: ['#1565c0', '#2e7d32'],
      series: [
        { name: 'Débits / dépenses', data: [0, 0, 0, 0] },
        { name: 'Crédits / recharges', data: [0, 0, 0, 0] }
      ],
      xaxis: { categories: ['S1', 'S2', 'S3', 'S4'] },
      yaxis: {
        labels: {
          formatter: (val: number) => `${Math.round(val)}`
        }
      },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#eef1f5' },
      tooltip: {
        y: {
          formatter: (val: number) => this.formatMoney(val)
        }
      }
    };

    this.operationsChart = {
      chart: { type: 'donut', height: 300, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#1565c0', '#1dc4e9', '#2e7d32', '#00897b', '#ff9800'],
      legend: { position: 'bottom', fontFamily: 'Public Sans, sans-serif' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: {
        y: {
          formatter: (val: number) => this.formatMoney(val)
        }
      }
    };
  }

  private startOfMonth(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private lastFourWeekStarts(): Date[] {
    const starts: Date[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);

    for (let i = 3; i >= 0; i--) {
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - i * 7);
      starts.push(start);
    }
    return starts;
  }

  private lastFourWeekLabels(): string[] {
    return this.lastFourWeekStarts().map((d) =>
      d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    );
  }
}
