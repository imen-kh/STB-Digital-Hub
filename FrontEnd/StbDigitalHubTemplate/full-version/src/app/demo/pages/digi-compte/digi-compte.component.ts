import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AccountAnalytics, AccountSummary, DigiCompteService } from 'src/app/theme/shared/service/digi-compte.service';
import { AccountWidgetComponent } from './account-widget/account-widget.component';

@Component({
  selector: 'app-digi-compte',
  imports: [...SHARED_IMPORTS, FormsModule, AccountWidgetComponent, NgApexchartsModule, RouterLink],
  templateUrl: './digi-compte.component.html',
  styleUrl: './digi-compte.component.scss'
})
export class DigiCompteComponent implements OnInit {
  private readonly digiCompteService = inject(DigiCompteService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal('');
  accounts = signal<AccountSummary[]>([]);
  analytics = signal<AccountAnalytics | null>(null);
  typeFilter = signal('');
  balancesChart!: ApexOptions;
  activityChart!: ApexOptions;

  ngOnInit(): void {
    this.initCharts();
    this.loadAccounts();
    this.loadAnalytics();
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

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  private loadAnalytics(): void {
    this.digiCompteService
      .getAnalytics()
      .pipe(first())
      .subscribe({
        next: (a) => {
          this.analytics.set(a);
          const slices = a.parCompte.length ? a.parCompte : [{ label: 'Aucun solde', montant: 1 }];
          this.balancesChart = {
            ...this.balancesChart,
            labels: slices.map((s) => s.label),
            series: slices.map((s) => Number(s.montant.toFixed(2)))
          };
          this.activityChart = {
            ...this.activityChart,
            series: [
              { name: 'Entrées', data: a.activite.map((p) => Number(p.credits.toFixed(2))) },
              { name: 'Sorties', data: a.activite.map((p) => Number(p.debits.toFixed(2))) }
            ],
            xaxis: { ...this.activityChart.xaxis, categories: a.activite.map((p) => p.label) }
          };
        },
        error: () => this.analytics.set(null)
      });
  }

  private initCharts(): void {
    this.balancesChart = {
      chart: { type: 'donut', height: 280, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#1565c0', '#0b6e4f'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
    this.activityChart = {
      chart: { type: 'area', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
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
  }
}
