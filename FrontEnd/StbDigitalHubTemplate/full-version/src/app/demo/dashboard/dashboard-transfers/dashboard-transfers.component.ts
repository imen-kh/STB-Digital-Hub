import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { DigiTransfertService, TransfertOverview, Virement } from 'src/app/theme/shared/service/digi-transfert.service';

@Component({
  selector: 'app-dashboard-transfers',
  imports: [...SHARED_IMPORTS, NgApexchartsModule, RouterLink],
  templateUrl: './dashboard-transfers.component.html',
  styleUrl: './dashboard-transfers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardTransfersComponent implements OnInit {
  private readonly api = inject(DigiTransfertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  overview = signal<TransfertOverview | null>(null);
  recents = signal<Virement[]>([]);
  typeChart!: ApexOptions;

  ngOnInit(): void {
    this.initChart();
    this.api
      .getOverview()
      .pipe(first())
      .subscribe({
        next: (o) => {
          this.overview.set(o);
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck()
      });
    this.api
      .getVirements()
      .pipe(first())
      .subscribe({
        next: (list) => {
          this.recents.set(list.slice(0, 5));
          this.applyChart(list);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  openDetail(id: number): void {
    void this.router.navigate(['/digi-transfert', id]);
  }

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  statutClass(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s.includes('confirm')) {
      return 'badge-soft badge-soft-success';
    }
    if (s.includes('refus') || s.includes('échou') || s.includes('echou') || s.includes('annul')) {
      return 'badge-soft badge-soft-danger';
    }
    if (s.includes('attente')) {
      return 'badge-soft badge-soft-warning';
    }
    return 'badge-soft badge-soft-info';
  }

  private applyChart(list: Virement[]): void {
    const national = list.filter((v) => v.type !== 'International').reduce((sum, v) => sum + (v.montant || 0), 0);
    const international = list.filter((v) => v.type === 'International').reduce((sum, v) => sum + (v.montant || 0), 0);
    const hasData = national + international > 0;
    this.typeChart = {
      ...this.typeChart,
      labels: hasData ? ['National', 'International'] : ['Aucun virement'],
      series: hasData ? [Number(national.toFixed(2)), Number(international.toFixed(2))] : [1]
    };
  }

  private initChart(): void {
    this.typeChart = {
      chart: { type: 'donut', height: 250, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#003d7a', '#c45c26'],
      legend: { position: 'bottom', fontFamily: 'Public Sans, sans-serif' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
  }
}
