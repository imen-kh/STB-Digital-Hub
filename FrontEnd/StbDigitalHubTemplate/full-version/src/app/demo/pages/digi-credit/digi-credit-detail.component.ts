import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  CreditDetail,
  DigiCreditService,
  EarlyRepaymentResult
} from 'src/app/theme/shared/service/digi-credit.service';

@Component({
  selector: 'app-digi-credit-detail',
  imports: [...SHARED_IMPORTS, FormsModule, NgApexchartsModule],
  templateUrl: './digi-credit-detail.component.html',
  styleUrl: './digi-credit-detail.component.scss'
})
export class DigiCreditDetailComponent implements OnInit {
  private readonly digiCredit = inject(DigiCreditService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  credit = signal<CreditDetail | null>(null);
  earlyAmount = signal(1000);
  earlyResult = signal<EarlyRepaymentResult | null>(null);
  remainingChart!: ApexOptions;
  mixChart!: ApexOptions;

  ngOnInit(): void {
    this.initCharts();
    this.route.paramMap.subscribe((p) => {
      const id = Number(p.get('id'));
      if (!id) {
        void this.router.navigate(['/digi-credit']);
        return;
      }
      this.load(id);
    });
  }

  goBack(): void {
    void this.router.navigate(['/digi-credit'], { queryParams: { tab: 'credits' } });
  }

  downloadPdf(): void {
    const c = this.credit();
    if (!c) {
      return;
    }
    this.digiCredit
      .downloadAmortization(c.id)
      .pipe(first())
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `amortissement-${c.reference}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('Téléchargement impossible.')
      });
  }

  simulateEarly(): void {
    const c = this.credit();
    if (!c) {
      return;
    }
    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');
    this.digiCredit
      .simulateEarlyRepayment(c.id, this.earlyAmount())
      .pipe(first())
      .subscribe({
        next: (r) => {
          this.earlyResult.set(r);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.earlyResult.set(null);
          this.error.set(typeof err === 'string' ? err : err?.error?.message || 'Simulation impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  payNext(): void {
    const c = this.credit();
    if (!c) {
      return;
    }
    if (!confirm(`Débiter la prochaine échéance (${this.formatMoney(c.montantProchaineEcheance || c.mensualite)}) sur votre compte courant ?`)) {
      return;
    }
    this.actionLoading.set(true);
    this.error.set('');
    this.success.set('');
    this.digiCredit
      .payNextInstallment(c.id)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.credit.set(res.credit);
          this.applyCharts(res.credit);
          this.success.set(res.message);
          this.earlyResult.set(null);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : err?.error?.message || 'Paiement impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  formatMoney(v: number): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  progressPct(c: CreditDetail): number {
    if (!c.montantAccorde) {
      return 0;
    }
    const paid = c.montantAccorde - c.soldeRestantDu;
    return Math.max(0, Math.min(100, Math.round((paid / c.montantAccorde) * 100)));
  }

  paidCount(c: CreditDetail): number {
    return c.echeances.filter((e) => e.payee).length;
  }

  totalCapital(c: CreditDetail): number {
    return c.echeances.reduce((s, e) => s + e.capital, 0);
  }

  totalInterest(c: CreditDetail): number {
    return c.echeances.reduce((s, e) => s + e.interet, 0);
  }

  totalPaid(c: CreditDetail): number {
    return c.echeances.filter((e) => e.payee).reduce((s, e) => s + e.montantTotal, 0);
  }

  isNextDue(c: CreditDetail, numero: number): boolean {
    const next = c.echeances.find((e) => !e.payee);
    return !!next && next.numero === numero;
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.digiCredit
      .getCredit(id)
      .pipe(first())
      .subscribe({
        next: (c) => {
          this.credit.set(c);
          this.earlyAmount.set(Math.min(1000, Math.max(100, Math.round(c.soldeRestantDu / 10))));
          this.applyCharts(c);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Crédit introuvable.');
          this.loading.set(false);
        }
      });
  }

  private applyCharts(c: CreditDetail): void {
    const echeances = [...c.echeances].sort((a, b) => a.numero - b.numero);
    this.remainingChart = {
      ...this.remainingChart,
      series: [{ name: 'Solde restant', data: echeances.map((e) => Number(e.soldeRestantDu.toFixed(2))) }],
      xaxis: { ...this.remainingChart.xaxis, categories: echeances.map((e) => `#${e.numero}`) }
    };
    this.mixChart = {
      ...this.mixChart,
      series: [
        { name: 'Capital', data: echeances.map((e) => Number(e.capital.toFixed(2))) },
        { name: 'Intérêts', data: echeances.map((e) => Number(e.interet.toFixed(2))) }
      ],
      xaxis: { ...this.mixChart.xaxis, categories: echeances.map((e) => `#${e.numero}`) }
    };
  }

  private initCharts(): void {
    this.remainingChart = {
      chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
      dataLabels: { enabled: false },
      colors: ['#1565c0'],
      series: [{ name: 'Solde restant', data: [] }],
      xaxis: { categories: [] },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
    this.mixChart = {
      chart: { type: 'bar', height: 260, stacked: true, toolbar: { show: false } },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
      dataLabels: { enabled: false },
      colors: ['#003d7a', '#ff9800'],
      series: [
        { name: 'Capital', data: [] },
        { name: 'Intérêts', data: [] }
      ],
      xaxis: { categories: [] },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
  }
}
