import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { first } from 'rxjs';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { HomeAlert, HomeDashboard, HomeService } from 'src/app/theme/shared/service/home.service';

@Component({
  selector: 'app-dashboard-overview',
  imports: [...SHARED_IMPORTS, NgApexchartsModule, RouterLink],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardOverviewComponent implements OnInit {
  private readonly home = inject(HomeService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  data = signal<HomeDashboard | null>(null);

  patrimoineChart!: ApexOptions;
  activityChart!: ApexOptions;
  creditChart!: ApexOptions;

  ngOnInit(): void {
    this.initEmptyCharts();
    this.home
      .getDashboard()
      .pipe(first())
      .subscribe({
        next: (d) => {
          this.data.set(d);
          this.applyCharts(d);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  alertClass(alert: HomeAlert): string {
    switch (alert.niveau) {
      case 'danger':
        return 'home-alert home-alert--danger';
      case 'warning':
        return 'home-alert home-alert--warning';
      case 'success':
        return 'home-alert home-alert--success';
      case 'accent':
        return 'home-alert home-alert--accent';
      default:
        return 'home-alert home-alert--info';
    }
  }

  alertQuery(url: string): Record<string, string> | null {
    const query = url.split('?')[1];
    if (!query) {
      return null;
    }

    const params: Record<string, string> = {};
    for (const part of query.split('&')) {
      const [key, value] = part.split('=');
      if (key) {
        params[key] = value || '';
      }
    }
    return params;
  }

  private applyCharts(d: HomeDashboard): void {
    const slices = d.patrimoine.filter((s) => s.value > 0);
    this.patrimoineChart = {
      ...this.patrimoineChart,
      labels: slices.length ? slices.map((s) => s.label) : ['Aucun solde'],
      series: slices.length ? slices.map((s) => Number(s.value.toFixed(2))) : [1]
    };

    this.activityChart = {
      ...this.activityChart,
      series: [
        { name: 'Dépenses carte', data: d.activite.map((p) => Number(p.depensesCarte.toFixed(2))) },
        { name: 'Versements épargne', data: d.activite.map((p) => Number(p.versementsEpargne.toFixed(2))) },
        { name: 'Virements', data: d.activite.map((p) => Number((p.virements || 0).toFixed(2))) }
      ],
      xaxis: { ...this.activityChart.xaxis, categories: d.activite.map((p) => p.label) }
    };

    const rembourse = Math.max(0, d.capitalRembourse);
    const restant = Math.max(0, d.soldeRestantCredit);
    if (rembourse + restant > 0) {
      this.creditChart = {
        ...this.creditChart,
        labels: ['Capital remboursé', 'Restant dû'],
        series: [Number(rembourse.toFixed(2)), Number(restant.toFixed(2))],
        colors: ['#0b6e4f', '#1565c0']
      };
    } else {
      this.creditChart = {
        ...this.creditChart,
        labels: ['Objectif épargne', 'Reste à épargner'],
        series: [
          Math.max(0, d.progressionObjectifPct),
          Math.max(0, 100 - d.progressionObjectifPct)
        ],
        colors: ['#0b6e4f', '#d5e6dc']
      };
    }
  }

  private initEmptyCharts(): void {
    this.patrimoineChart = {
      chart: { type: 'donut', height: 280, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#0b6e4f', '#1dc4e9'],
      legend: { position: 'bottom', fontFamily: 'Public Sans, sans-serif' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '70%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };

    this.activityChart = {
      chart: { type: 'area', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
      dataLabels: { enabled: false },
      colors: ['#1565c0', '#0b6e4f', '#c45c26'],
      series: [
        { name: 'Dépenses carte', data: [] },
        { name: 'Versements épargne', data: [] },
        { name: 'Virements', data: [] }
      ],
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: number) => `${Math.round(val)}` } },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };

    this.creditChart = {
      chart: { type: 'donut', height: 280, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#0b6e4f', '#1565c0'],
      legend: { position: 'bottom', fontFamily: 'Public Sans, sans-serif' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '70%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
  }
}
