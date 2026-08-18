import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  CreditDetail,
  DigiCreditService,
  EarlyRepaymentResult
} from 'src/app/theme/shared/service/digi-credit.service';

@Component({
  selector: 'app-digi-credit-detail',
  imports: [...SHARED_IMPORTS, FormsModule],
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

  ngOnInit(): void {
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
          this.error.set(err?.error?.message || 'Simulation impossible.');
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
          this.success.set(res.message);
          this.earlyResult.set(null);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Paiement impossible.');
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
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Crédit introuvable.');
          this.loading.set(false);
        }
      });
  }
}
