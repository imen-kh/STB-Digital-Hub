import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { CardAnalytics, CardSummary, DigiCarteService } from 'src/app/theme/shared/service/digi-carte.service';
import { BankCardWidgetComponent } from './bank-card-widget/bank-card-widget.component';

@Component({
  selector: 'app-digi-carte',
  imports: [...SHARED_IMPORTS, FormsModule, BankCardWidgetComponent, NgApexchartsModule],
  templateUrl: './digi-carte.component.html',
  styleUrl: './digi-carte.component.scss'
})
export class DigiCarteComponent implements OnInit {
  private readonly digiCarteService = inject(DigiCarteService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal('');
  cards = signal<CardSummary[]>([]);
  analytics = signal<CardAnalytics | null>(null);
  statutFilter = signal('');
  spendChart!: ApexOptions;
  merchantChart!: ApexOptions;

  ngOnInit(): void {
    this.initCharts();
    this.loadCards();
    this.loadAnalytics();
  }

  loadCards(): void {
    this.loading.set(true);
    this.error.set('');
    this.digiCarteService
      .getCards(this.statutFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.cards.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Impossible de charger les cartes.');
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.loadCards();
  }

  openCard(id: number): void {
    this.router.navigate(['/digi-carte', id]);
  }

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  private loadAnalytics(): void {
    this.digiCarteService
      .getAnalytics()
      .pipe(first())
      .subscribe({
        next: (a) => {
          this.analytics.set(a);
          this.spendChart = {
            ...this.spendChart,
            series: [{ name: 'Dépenses', data: a.activite.map((p) => Number(p.montant.toFixed(2))) }],
            xaxis: { ...this.spendChart.xaxis, categories: a.activite.map((p) => p.label) }
          };
          const merchants = a.parCommercant.length ? a.parCommercant : [{ label: 'Aucune dépense', montant: 1 }];
          this.merchantChart = {
            ...this.merchantChart,
            labels: merchants.map((m) => m.label),
            series: merchants.map((m) => Number(m.montant.toFixed(2)))
          };
        },
        error: () => this.analytics.set(null)
      });
  }

  private initCharts(): void {
    this.spendChart = {
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      colors: ['#1565c0'],
      series: [{ name: 'Dépenses', data: [] }],
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: number) => `${Math.round(val)}` } },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
    this.merchantChart = {
      chart: { type: 'donut', height: 280, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#1565c0', '#1dc4e9', '#0b6e4f', '#ff9800', '#7e57c2'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
  }
}
