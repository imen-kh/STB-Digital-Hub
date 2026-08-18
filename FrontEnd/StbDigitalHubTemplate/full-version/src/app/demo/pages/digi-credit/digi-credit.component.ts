import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  CompareScenario,
  CreditActionSubmitResponse,
  CreditOverview,
  CreditSummary,
  DemandeCredit,
  DigiCreditService,
  SimulationCredit
} from 'src/app/theme/shared/service/digi-credit.service';

type Tab = 'simuler' | 'demandes' | 'credits';

@Component({
  selector: 'app-digi-credit',
  imports: [...SHARED_IMPORTS, FormsModule],
  templateUrl: './digi-credit.component.html',
  styleUrl: './digi-credit.component.scss'
})
export class DigiCreditComponent implements OnInit {
  private readonly digiCredit = inject(DigiCreditService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  pendingConfirmUrl = signal<string | null>(null);
  tab = signal<Tab>('simuler');

  typeCredit = signal('Personnel');
  montant = signal(10000);
  dureeMois = signal(24);
  revenuMensuel = signal(2500);
  lastSimulation = signal<SimulationCredit | null>(null);
  scenarios = signal<CompareScenario[]>([]);

  overview = signal<CreditOverview | null>(null);
  demandes = signal<DemandeCredit[]>([]);
  credits = signal<CreditSummary[]>([]);
  demandeFilter = signal('');
  creditFilter = signal('Actif');

  private confirmInFlight = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const tab = q.get('tab');
      if (tab === 'demandes' || tab === 'credits' || tab === 'simuler') {
        this.tab.set(tab);
      }
      const token = q.get('confirm');
      if (token) {
        this.processConfirm(token);
      }
    });
    this.reloadAll();
  }

  setTab(t: Tab): void {
    this.tab.set(t);
  }

  reloadAll(): void {
    this.loading.set(true);
    this.error.set('');
    this.digiCredit
      .getOverview()
      .pipe(first())
      .subscribe({
        next: (o) => this.overview.set(o),
        error: () => this.overview.set(null)
      });

    this.digiCredit
      .getDemandes(this.demandeFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (d) => {
          this.demandes.set(d);
          this.digiCredit
            .getCredits(this.creditFilter() || undefined)
            .pipe(first())
            .subscribe({
              next: (c) => {
                this.credits.set(c);
                this.loading.set(false);
              },
              error: () => {
                this.error.set('Impossible de charger les crédits.');
                this.loading.set(false);
              }
            });
        },
        error: () => {
          this.error.set('Impossible de charger DigiCrédit.');
          this.loading.set(false);
        }
      });
  }

  onDemandeFilterChange(value: string): void {
    this.demandeFilter.set(value);
    this.reloadAll();
  }

  onCreditFilterChange(value: string): void {
    this.creditFilter.set(value);
    this.reloadAll();
  }

  simulate(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCredit
      .simulate(this.typeCredit(), this.montant(), this.dureeMois(), this.revenuMensuel())
      .pipe(first())
      .subscribe({
        next: (sim) => {
          this.lastSimulation.set(sim);
          this.success.set('Simulation calculée (démonstration pédagogique).');
          this.actionLoading.set(false);
          this.loadCompare();
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : err?.error?.message || 'Simulation impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  loadCompare(): void {
    this.digiCredit
      .compare(this.typeCredit(), this.montant(), this.dureeMois(), this.revenuMensuel())
      .pipe(first())
      .subscribe({
        next: (rows) => this.scenarios.set(rows),
        error: () => this.scenarios.set([])
      });
  }

  applyScenario(s: CompareScenario): void {
    this.dureeMois.set(s.dureeMois);
    this.simulate();
  }

  submitDemande(): void {
    const sim = this.lastSimulation();
    if (!sim) {
      return;
    }
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCredit
      .submitDemande(sim.id)
      .pipe(first())
      .subscribe({
        next: (res) => this.onPending(res),
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : err?.error?.message || 'Soumission impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  openPendingConfirm(): void {
    const url = this.pendingConfirmUrl();
    if (!url) {
      return;
    }
    try {
      const parsed = new URL(url, window.location.origin);
      const token = parsed.searchParams.get('confirm');
      if (token) {
        this.processConfirm(token);
        return;
      }
    } catch {
      /* fallthrough */
    }
    window.location.href = url;
  }

  openCredit(id: number): void {
    void this.router.navigate(['/digi-credit', id]);
  }

  downloadSimPdf(): void {
    const sim = this.lastSimulation();
    if (!sim) {
      return;
    }
    this.digiCredit
      .downloadSimulationAttestation(sim.id)
      .pipe(first())
      .subscribe({
        next: (blob) => this.saveBlob(blob, `simulation-credit-${sim.id}.pdf`),
        error: () => this.error.set('Téléchargement PDF impossible.')
      });
  }

  formatMoney(v: number): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  eligClass(level: string): string {
    const l = (level || '').toLowerCase();
    if (l === 'vert') {
      return 'elig elig-vert';
    }
    if (l === 'rouge') {
      return 'elig elig-rouge';
    }
    return 'elig elig-orange';
  }

  statutClass(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s.includes('accept') || s === 'actif' || s === 'soldé' || s === 'solde') {
      return 'badge-soft badge-soft-success';
    }
    if (s.includes('refus') || s.includes('rej')) {
      return 'badge-soft badge-soft-danger';
    }
    if (s.includes('attente')) {
      return 'badge-soft badge-soft-warning';
    }
    return 'badge-soft badge-soft-info';
  }

  progressPct(c: CreditSummary): number {
    if (!c.montantAccorde) {
      return 0;
    }
    const paid = c.montantAccorde - c.soldeRestantDu;
    return Math.max(0, Math.min(100, Math.round((paid / c.montantAccorde) * 100)));
  }

  private onPending(res: CreditActionSubmitResponse): void {
    this.success.set(res.message || 'Un e-mail de confirmation vous a été envoyé.');
    this.pendingConfirmUrl.set(res.emailSent === false && res.confirmUrl ? res.confirmUrl : null);
    this.actionLoading.set(false);
  }

  private processConfirm(token: string): void {
    if (this.confirmInFlight) {
      return;
    }
    this.confirmInFlight = true;
    this.actionLoading.set(true);
    this.digiCredit
      .confirmAction(token)
      .pipe(first())
      .subscribe({
        next: (res) => {
          void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
          this.pendingConfirmUrl.set(null);
          if (res.success) {
            this.success.set(res.message || 'Demande confirmée.');
            this.tab.set(res.creditId ? 'credits' : 'demandes');
            this.reloadAll();
          } else {
            this.error.set(res.message || 'Confirmation échouée.');
          }
          this.confirmInFlight = false;
          this.actionLoading.set(false);
        },
        error: () => {
          void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
          this.error.set('Confirmation échouée.');
          this.confirmInFlight = false;
          this.actionLoading.set(false);
        }
      });
  }

  private clearFeedback(): void {
    this.error.set('');
    this.success.set('');
    this.pendingConfirmUrl.set(null);
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
