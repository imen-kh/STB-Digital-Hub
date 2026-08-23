import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  DemandeRetrait,
  DigiEpargneService,
  EpargneActionSubmitResponse,
  EpargneDashboard,
  MouvementEpargne,
  RegleEpargne,
  SimulateEpargneResult,
  ArrondiStatus
} from 'src/app/theme/shared/service/digi-epargne.service';

type Tab = 'dashboard' | 'mouvements' | 'retraits' | 'regles' | 'simulateur';


@Component({
  selector: 'app-digi-epargne',
  imports: [...SHARED_IMPORTS, FormsModule, NgApexchartsModule],
  templateUrl: './digi-epargne.component.html',
  styleUrl: './digi-epargne.component.scss'
})
export class DigiEpargneComponent implements OnInit {
  private readonly epargne = inject(DigiEpargneService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  pendingConfirmUrl = signal<string | null>(null);
  tab = signal<Tab>('dashboard');

  dashboard = signal<EpargneDashboard | null>(null);
  mouvements = signal<MouvementEpargne[]>([]);
  retraits = signal<DemandeRetrait[]>([]);
  regles = signal<RegleEpargne[]>([]);
  simulation = signal<SimulateEpargneResult | null>(null);
  arrondi = signal<ArrondiStatus | null>(null);

  mouvementFilter = signal('');
  retraitFilter = signal('');
  retraitMontant = signal(150);
  objectifMontant = signal(25000);
  regleType = signal('Virement périodique');
  regleValeur = signal(200);
  regleFrequence = signal('Mensuelle');
  simVersement = signal(250);
  simDuree = signal(12);
  evolutionChart!: ApexOptions;
  sourcesChart!: ApexOptions;
  projectionChart!: ApexOptions;

  private confirmInFlight = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const tab = q.get('tab');
      if (tab === 'dashboard' || tab === 'mouvements' || tab === 'retraits' || tab === 'regles' || tab === 'simulateur') {
        this.tab.set(tab);
      }
      const token = q.get('confirm');
      if (token) {
        this.processConfirm(token);
      }
    });
    this.initCharts();
    this.reloadAll();
  }

  setTab(t: Tab): void {
    this.tab.set(t);
  }

  reloadAll(): void {
    this.loading.set(true);
    this.error.set('');
    this.epargne
      .getDashboard()
      .pipe(first())
      .subscribe({
        next: (d) => {
          this.dashboard.set(d);
          this.objectifMontant.set(d.objectifEpargne || 25000);
          this.loadLists();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Impossible de charger DigiÉpargne.');
          this.loading.set(false);
        }
      });
  }

  onMouvementFilter(value: string): void {
    this.mouvementFilter.set(value);
    this.loadMouvements();
  }

  onRetraitFilter(value: string): void {
    this.retraitFilter.set(value);
    this.loadRetraits();
  }

  goToComptes(): void {
    void this.router.navigate(['/comptes']);
  }

  demanderRetrait(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .demanderRetrait(this.retraitMontant())
      .pipe(first())
      .subscribe({
        next: (res) => this.onPending(res),
        error: (err) => {
          this.error.set(err?.error?.message || 'Demande de retrait impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  annulerRetrait(id: number): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .annulerRetrait(id)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.success.set(res.message);
          this.actionLoading.set(false);
          this.reloadAll();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Annulation impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  saveObjectif(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .setObjectif(this.objectifMontant())
      .pipe(first())
      .subscribe({
        next: (d) => {
          this.dashboard.set(d);
          this.success.set('Objectif d’épargne enregistré.');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Objectif impossible à enregistrer.');
          this.actionLoading.set(false);
        }
      });
  }

  crediterInterets(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .crediterInterets()
      .pipe(first())
      .subscribe({
        next: (d) => {
          this.dashboard.set(d);
          this.success.set('Intérêts crédités (démonstration mensuelle).');
          this.actionLoading.set(false);
          this.loadMouvements();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Crédit d’intérêts impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  saveRegle(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .upsertRegle(this.regleType(), this.regleValeur(), this.regleFrequence(), true)
      .pipe(first())
      .subscribe({
        next: () => {
          this.success.set('Règle d’épargne intelligente enregistrée.');
          this.actionLoading.set(false);
          this.loadRegles();
          this.reloadDashboardOnly();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Enregistrement de la règle impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  toggleRegle(r: RegleEpargne): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .toggleRegle(r.id, !r.active)
      .pipe(first())
      .subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.loadRegles();
          this.reloadDashboardOnly();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Mise à jour impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  setArrondi(active: boolean): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .setArrondi(active)
      .pipe(first())
      .subscribe({
        next: (status) => {
          this.arrondi.set(status);
          this.success.set(
            active
              ? 'Arrondi automatique activé : chaque achat carte sera arrondi au dinar supérieur.'
              : 'Arrondi automatique désactivé : les achats sont traités sans versement.'
          );
          this.actionLoading.set(false);
          this.loadRegles();
          this.reloadDashboardOnly();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Mise à jour de l’arrondi impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  periodiqueRules(): RegleEpargne[] {
    return this.regles().filter((r) => !r.typeRegle.toLowerCase().includes('arrondi'));
  }

  executerRegle(id: number): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .executerRegle(id)
      .pipe(first())
      .subscribe({
        next: (d) => {
          this.dashboard.set(d);
          this.success.set('Règle exécutée : versement effectué.');
          this.actionLoading.set(false);
          this.loadMouvements();
          this.loadRegles();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Exécution impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  simulate(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.epargne
      .simulate(this.simVersement(), this.simDuree())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.simulation.set(res);
          this.applyProjectionChart(res);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Simulation impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  downloadPdf(): void {
    this.epargne
      .downloadMouvementsPdf()
      .pipe(first())
      .subscribe({
        next: (blob) => this.saveBlob(blob, 'mouvements-epargne.pdf'),
        error: () => this.error.set('Export PDF impossible.')
      });
  }

  exportCsv(): void {
    const rows = this.mouvements();
    const header = 'Date;Type;Libelle;Montant';
    const body = rows
      .map((m) => `${new Date(m.dateMouvement).toLocaleDateString('fr-TN')};${m.type};${m.libelle};${m.montant}`)
      .join('\n');
    this.saveBlob(new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' }), 'mouvements-epargne.csv');
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

  formatMoney(v: number): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  statutClass(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s.includes('valid')) {
      return 'badge-soft badge-soft-success';
    }
    if (s.includes('refus') || s.includes('annul')) {
      return 'badge-soft badge-soft-danger';
    }
    return 'badge-soft badge-soft-warning';
  }

  typeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('retrait')) {
      return 'mv-retrait';
    }
    if (t.includes('intér') || t.includes('inter')) {
      return 'mv-interet';
    }
    return 'mv-versement';
  }

  private loadLists(): void {
    this.loadMouvements();
    this.loadRetraits();
    this.loadRegles();
    this.loadArrondi();
    this.loading.set(false);
  }

  private loadMouvements(): void {
    this.epargne
      .getMouvements(this.mouvementFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (m) => {
          this.mouvements.set(m);
          this.applyHistoryCharts(m);
        },
        error: () => this.mouvements.set([])
      });
  }

  private loadRetraits(): void {
    this.epargne
      .getRetraits(this.retraitFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (r) => this.retraits.set(r),
        error: () => this.retraits.set([])
      });
  }

  private loadRegles(): void {
    this.epargne
      .getRegles()
      .pipe(first())
      .subscribe({
        next: (r) => this.regles.set(r),
        error: () => this.regles.set([])
      });
  }

  private loadArrondi(): void {
    this.epargne
      .getArrondi()
      .pipe(first())
      .subscribe({
        next: (a) => this.arrondi.set(a),
        error: () => this.arrondi.set({ active: false, exemple: '' })
      });
  }

  private reloadDashboardOnly(): void {
    this.epargne
      .getDashboard()
      .pipe(first())
      .subscribe({ next: (d) => this.dashboard.set(d) });
  }

  private onPending(res: EpargneActionSubmitResponse): void {
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
    this.epargne
      .confirmAction(token)
      .pipe(first())
      .subscribe({
        next: (res) => {
          void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
          this.pendingConfirmUrl.set(null);
          if (res.success) {
            this.success.set(res.message || 'Retrait confirmé.');
            this.tab.set('retraits');
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

  private applyHistoryCharts(mouvements: MouvementEpargne[]): void {
    const ordered = [...mouvements].sort(
      (a, b) => new Date(a.dateMouvement).getTime() - new Date(b.dateMouvement).getTime()
    );
    const nets = ordered.map((m) => (m.type === 'Retrait' ? -m.montant : m.montant));
    const totalNet = nets.reduce((s, v) => s + v, 0);
    let cursor = (this.dashboard()?.soldeDisponible || 0) - totalNet;
    const series = ordered.map((m, i) => {
      cursor += nets[i];
      return Number(cursor.toFixed(2));
    });
    const labels = ordered.map((m) =>
      new Date(m.dateMouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    );

    this.evolutionChart = {
      ...this.evolutionChart,
      series: [{ name: 'Solde livret', data: series.length ? series : [this.dashboard()?.soldeDisponible || 0] }],
      xaxis: { ...this.evolutionChart.xaxis, categories: labels.length ? labels : ['Aujourd\'hui'] }
    };

    const inflows = ordered.filter((m) => m.type !== 'Retrait');
    const arrondi = inflows.filter((m) => m.libelle.toLowerCase().includes('arrondi')).reduce((s, m) => s + m.montant, 0);
    const interet = inflows.filter((m) => m.type === 'Intérêt' || m.type === 'Interet').reduce((s, m) => s + m.montant, 0);
    const versement = inflows
      .filter((m) => m.type === 'Versement' && !m.libelle.toLowerCase().includes('arrondi'))
      .reduce((s, m) => s + m.montant, 0);
    const slices = [
      { label: 'Versements', value: versement },
      { label: 'Arrondi', value: arrondi },
      { label: 'Intérêts', value: interet }
    ].filter((s) => s.value > 0);

    this.sourcesChart = {
      ...this.sourcesChart,
      labels: slices.length ? slices.map((s) => s.label) : ['Aucun versement'],
      series: slices.length ? slices.map((s) => Number(s.value.toFixed(2))) : [1]
    };
  }

  private applyProjectionChart(res: SimulateEpargneResult): void {
    this.projectionChart = {
      ...this.projectionChart,
      series: [
        { name: 'Solde', data: res.points.map((p) => Number(p.solde.toFixed(2))) },
        { name: 'Intérêts cumulés', data: res.points.map((p) => Number(p.interetsCumules.toFixed(2))) }
      ],
      xaxis: { ...this.projectionChart.xaxis, categories: res.points.map((p) => `M${p.mois}`) }
    };
  }

  private initCharts(): void {
    this.evolutionChart = {
      chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
      dataLabels: { enabled: false },
      colors: ['#0b6e4f'],
      series: [{ name: 'Solde livret', data: [] }],
      xaxis: { categories: [] },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
    this.sourcesChart = {
      chart: { type: 'donut', height: 260, toolbar: { show: false } },
      labels: [],
      series: [],
      colors: ['#0b6e4f', '#1b9a6c', '#1565c0'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '68%' } } },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
    this.projectionChart = {
      chart: { type: 'line', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth', width: 3 },
      dataLabels: { enabled: false },
      colors: ['#0b6e4f', '#1565c0'],
      series: [
        { name: 'Solde', data: [] },
        { name: 'Intérêts cumulés', data: [] }
      ],
      xaxis: { categories: [] },
      legend: { position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#eef1f5' },
      tooltip: { y: { formatter: (val: number) => this.formatMoney(val) } }
    };
  }
}
