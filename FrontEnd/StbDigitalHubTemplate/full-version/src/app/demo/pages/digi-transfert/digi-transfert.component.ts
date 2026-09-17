import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  Beneficiaire,
  DigiTransfertService,
  InitierVirementResponse,
  SimulationFrais,
  TauxChange,
  TransfertOverview,
  TypeVirement,
  ModeExecution,
  UpsertBeneficiaire,
  Virement
} from 'src/app/theme/shared/service/digi-transfert.service';

type Tab = 'virement' | 'simuler' | 'beneficiaires' | 'historique';
type WizardStep = 'beneficiaire' | 'montant' | 'recap' | 'otp' | 'succes';

@Component({
  selector: 'app-digi-transfert',
  imports: [...SHARED_IMPORTS, FormsModule],
  templateUrl: './digi-transfert.component.html',
  styleUrl: './digi-transfert.component.scss'
})
export class DigiTransfertComponent implements OnInit {
  private readonly api = inject(DigiTransfertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  tab = signal<Tab>('virement');
  step = signal<WizardStep>('beneficiaire');

  overview = signal<TransfertOverview | null>(null);
  beneficiaires = signal<Beneficiaire[]>([]);
  virements = signal<Virement[]>([]);
  simulation = signal<SimulationFrais | null>(null);
  pending = signal<InitierVirementResponse | null>(null);

  selectedBeneficiaireId = signal<number | null>(null);
  useNewBeneficiaire = signal(false);
  typeVirement = signal<TypeVirement>('National');
  modeExecution = signal<ModeExecution>('Instantane');
  dateProgrammee = signal('');
  montant = signal(150);
  motif = signal('Loyer');
  motifLibre = signal('');
  otpCode = signal('');
  enregistrerNouveau = signal(true);
  taux = signal<TauxChange[]>([]);

  nouveau: UpsertBeneficiaire = {
    nom: '',
    prenom: '',
    rib: '',
    banque: 'STB',
    alias: '',
    type: 'National',
    iban: '',
    swift: '',
    pays: '',
    devise: 'EUR'
  };

  search = signal('');
  statutFilter = signal('');
  fromDate = signal('');
  toDate = signal('');
  minMontant = signal<number | null>(null);
  maxMontant = signal<number | null>(null);

  simMontant = signal(200);
  simRib = signal('');
  simIban = signal('');
  simBanque = signal('');
  simPays = signal('');
  simDevise = signal('EUR');
  simBeneficiaireId = signal<number | null>(null);
  simResult = signal<SimulationFrais | null>(null);
  typeFilter = signal('');

  editingId = signal<number | null>(null);
  formBenef: UpsertBeneficiaire = {
    nom: '',
    prenom: '',
    rib: '',
    banque: 'STB',
    alias: '',
    favori: false,
    type: 'National',
    iban: '',
    swift: '',
    pays: '',
    devise: 'EUR'
  };

  readonly motifs = ['Loyer', 'Salaire', 'Famille', 'Facture', 'Scolarité', 'Voyage', 'Études', 'Autre'];
  readonly banquesNationales = [
    'STB',
    'BIAT',
    'BH',
    'BNA',
    'Amen Bank',
    'UIB',
    'ATB',
    'Attijari Bank',
    'Banque de Tunisie',
    'BTK',
    'QNB Tunisia',
    'Banque Zitouna',
    'Wifak Bank',
    'Al Baraka',
    'ABC Bank'
  ];
  readonly banquesIntl = [
    'BNP Paribas',
    'Société Générale',
    'Crédit Agricole',
    'NatWest',
    'HSBC',
    'Barclays',
    'Deutsche Bank',
    'Chase',
    'Bank of America',
    'ADCB',
    'Emirates NBD',
    'Attijariwafa',
    'BMCE Bank of Africa'
  ];
  readonly paysIntl = ['France', 'Allemagne', 'Italie', 'Espagne', 'Royaume-Uni', 'États-Unis', 'Canada', 'Suisse', 'Émirats arabes unis', 'Arabie saoudite', 'Maroc'];
  readonly devises = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'SAR', 'AED', 'MAD'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const tab = q.get('tab');
      if (tab === 'virement' || tab === 'simuler' || tab === 'beneficiaires' || tab === 'historique') {
        this.tab.set(tab);
      }
    });
    this.dateProgrammee.set(this.shiftIsoDate(1));
    this.reloadAll();
    this.api
      .getTaux()
      .pipe(first())
      .subscribe({
        next: (list) => this.taux.set(list),
        error: () => this.taux.set([])
      });
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  reloadAll(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .getOverview()
      .pipe(first())
      .subscribe({
        next: (o) => this.overview.set(o),
        error: (err) => this.error.set(this.readError(err, 'Impossible de charger DigiTransfert.'))
      });
    this.api
      .getBeneficiaires()
      .pipe(first())
      .subscribe({
        next: (list) => this.beneficiaires.set(list),
        error: () => this.beneficiaires.set([])
      });
    this.loadHistorique();
  }

  loadHistorique(): void {
    this.api
      .getVirements({
        statut: this.statutFilter() || undefined,
        q: this.search() || undefined,
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        min: this.minMontant() || undefined,
        max: this.maxMontant() || undefined,
        type: this.typeFilter() || undefined
      })
      .pipe(first())
      .subscribe({
        next: (list) => {
          this.virements.set(list);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Impossible de charger l’historique.'));
          this.loading.set(false);
        }
      });
  }

  filteredBeneficiaires(): Beneficiaire[] {
    return this.beneficiaires().filter((b) => (b.type || 'National') === this.typeVirement());
  }

  setType(type: TypeVirement): void {
    this.typeVirement.set(type);
    this.selectedBeneficiaireId.set(null);
    this.useNewBeneficiaire.set(false);
    this.simBeneficiaireId.set(null);
    this.simResult.set(null);
    this.simulation.set(null);
    this.nouveau.type = type;
    this.nouveau.banque = type === 'International' ? 'BNP Paribas' : 'STB';
    this.nouveau.devise = type === 'International' ? 'EUR' : 'TND';
    this.nouveau.pays = type === 'International' ? 'France' : 'Tunisie';
    this.formBenef = this.emptyForm(type);
    this.clearFeedback();
  }

  currentTaux(): TauxChange | undefined {
    const devise = this.activeDevise();
    return this.taux().find((t) => t.devise === devise);
  }

  activeDevise(): string {
    if (this.typeVirement() !== 'International') {
      return 'TND';
    }
    return this.selectedBeneficiaire()?.devise || this.nouveau.devise || this.simDevise() || 'EUR';
  }

  selectedBeneficiaire(): Beneficiaire | undefined {
    const id = this.selectedBeneficiaireId();
    return this.beneficiaires().find((b) => b.id === id);
  }

  compteMasque(b: Beneficiaire): string {
    return (b.type || 'National') === 'International' ? b.ibanMasque || b.iban || '' : b.ribMasque || b.rib;
  }

  banquesPourType(type: TypeVirement | string = this.typeVirement()): string[] {
    return type === 'International' ? this.banquesIntl : this.banquesNationales;
  }

  banqueListId(type: TypeVirement | string = this.typeVirement()): string {
    return type === 'International' ? 'liste-banques-intl' : 'liste-banques-nationales';
  }

  equivalentTnd(): number {
    const t = this.currentTaux();
    return t ? Math.round(this.montant() * t.tauxTnd * 100) / 100 : 0;
  }

  ibanCharCount(value?: string | null): number {
    return (value || '').replace(/\s+/g, '').length;
  }

  selectBeneficiaire(id: number): void {
    this.selectedBeneficiaireId.set(id);
    this.useNewBeneficiaire.set(false);
    this.clearFeedback();
  }

  virerVers(b: Beneficiaire): void {
    this.setType(b.type === 'International' ? 'International' : 'National');
    this.selectBeneficiaire(b.id);
    this.setTab('virement');
    this.step.set('montant');
  }

  startNewBeneficiaire(): void {
    this.useNewBeneficiaire.set(true);
    this.selectedBeneficiaireId.set(null);
    this.nouveau = this.emptyForm(this.typeVirement());
  }

  motifEffectif(): string {
    return this.motif() === 'Autre' ? this.motifLibre().trim() : this.motif();
  }

  setMode(mode: ModeExecution): void {
    this.modeExecution.set(mode);
    if (mode === 'Programme' && !this.dateProgrammee()) {
      this.dateProgrammee.set(this.shiftIsoDate(1));
    }
    this.clearFeedback();
  }

  minProgrammee(): string {
    return this.shiftIsoDate(1);
  }

  maxProgrammee(): string {
    return this.shiftIsoDate(90);
  }

  standardHint(): string {
    if (this.typeVirement() === 'International') {
      return `Exécution estimée le ${this.formatIso(this.shiftIsoDate(2))} (J+2).`;
    }
    const intra = this.useNewBeneficiaire()
      ? (this.nouveau.banque || '').toUpperCase().includes('STB') || (this.nouveau.rib || '').replace(/\D/g, '').startsWith('10')
      : !!this.selectedBeneficiaire()?.intraStb;
    return intra
      ? `Exécution estimée aujourd’hui (${this.formatIso(this.shiftIsoDate(0))}).`
      : `Exécution estimée le ${this.formatIso(this.shiftIsoDate(1))} (J+1).`;
  }

  shiftIsoDate(days: number): string {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatIso(value?: string | null): string {
    if (!value) {
      return '';
    }
    const [y, m, d] = value.slice(0, 10).split('-');
    return y && m && d ? `${d}/${m}/${y}` : value;
  }

  goMontant(): void {
    if (!this.useNewBeneficiaire() && !this.selectedBeneficiaireId()) {
      this.error.set('Sélectionnez un bénéficiaire ou ajoutez-en un nouveau.');
      return;
    }
    if (this.useNewBeneficiaire()) {
      const err = this.validateNouveau();
      if (err) {
        this.error.set(err);
        return;
      }
    }
    this.clearFeedback();
    this.step.set('montant');
  }

  private validateNouveau(): string | null {
    if (!this.nouveau.nom || !this.nouveau.prenom || !this.nouveau.banque) {
      return 'Complétez nom, prénom et banque.';
    }
    if (this.typeVirement() === 'International') {
      const iban = (this.nouveau.iban || '').replace(/\s+/g, '');
      const swift = (this.nouveau.swift || '').replace(/\s+/g, '');
      if (iban.length < 15 || iban.length > 34) {
        return 'L’IBAN doit contenir 15 à 34 caractères. Exemple : FR7630006000011234567890189';
      }
      if (swift.length !== 8 && swift.length !== 11) {
        return 'Le SWIFT/BIC doit contenir 8 ou 11 caractères. Exemple : BNPAFRPP';
      }
      if (!this.nouveau.pays || !this.nouveau.devise) {
        return 'Complétez le pays et la devise.';
      }
      return null;
    }
    if (this.ribDigitCount(this.nouveau.rib || '') !== 20) {
      return 'Le RIB tunisien doit contenir exactement 20 chiffres. Exemple STB : 10001000000000000042';
    }
    return null;
  }

  goRecap(): void {
    if (this.montant() <= 0) {
      this.error.set('Saisissez un montant supérieur à zéro.');
      return;
    }
    if (!this.motifEffectif()) {
      this.error.set('Indiquez le motif du virement.');
      return;
    }
    if (this.modeExecution() === 'Programme') {
      const chosen = this.dateProgrammee();
      if (!chosen || chosen <= this.shiftIsoDate(0)) {
        this.error.set('Choisissez une date future pour le virement programmé.');
        return;
      }
    }
    this.actionLoading.set(true);
    this.clearFeedback();
    const selected = this.selectedBeneficiaire();
    this.api
      .simulate({
        montant: this.montant(),
        type: this.typeVirement(),
        devise: this.activeDevise(),
        idBeneficiaire: selected?.id,
        rib: this.useNewBeneficiaire() ? this.nouveau.rib : undefined,
        iban: this.useNewBeneficiaire() ? this.nouveau.iban || undefined : undefined,
        banque: this.useNewBeneficiaire() ? this.nouveau.banque : undefined,
        pays: this.useNewBeneficiaire() ? this.nouveau.pays || undefined : undefined,
        modeExecution: this.modeExecution(),
        dateProgrammee: this.modeExecution() === 'Programme' ? this.dateProgrammee() : undefined
      })
      .pipe(first())
      .subscribe({
        next: (sim) => {
          this.simulation.set(sim);
          this.step.set('recap');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Simulation impossible.'));
          this.actionLoading.set(false);
        }
      });
  }

  initier(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.api
      .initier({
        montant: this.montant(),
        motif: this.motifEffectif(),
        type: this.typeVirement(),
        devise: this.activeDevise(),
        idBeneficiaire: this.useNewBeneficiaire() ? null : this.selectedBeneficiaireId(),
        nouveauBeneficiaire: this.useNewBeneficiaire() ? { ...this.nouveau, type: this.typeVirement() } : null,
        enregistrerBeneficiaire: this.enregistrerNouveau(),
        modeExecution: this.modeExecution(),
        dateProgrammee: this.modeExecution() === 'Programme' ? this.dateProgrammee() : undefined
      })
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.pending.set(res);
          this.otpCode.set(res.devOtpCode || '');
          this.success.set(res.message);
          this.step.set('otp');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Impossible d’initier le virement.'));
          this.actionLoading.set(false);
        }
      });
  }

  confirmerOtp(): void {
    const pending = this.pending();
    if (!pending) {
      return;
    }
    this.actionLoading.set(true);
    this.clearFeedback();
    this.api
      .confirmer(pending.idVirement, pending.challengeId, this.otpCode())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.success.set(res.message);
          this.pending.set({ ...pending, virement: res.virement });
          this.step.set('succes');
          this.actionLoading.set(false);
          this.reloadAll();
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Code OTP invalide.'));
          this.actionLoading.set(false);
        }
      });
  }

  resendOtp(): void {
    const pending = this.pending();
    if (!pending) {
      return;
    }
    this.actionLoading.set(true);
    this.api
      .resendOtp(pending.idVirement)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.pending.set({ ...pending, challengeId: res.challengeId, devOtpCode: res.devOtpCode, message: res.message });
          this.otpCode.set(res.devOtpCode || '');
          this.success.set(res.message);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Renvoi OTP impossible.'));
          this.actionLoading.set(false);
        }
      });
  }

  annulerPending(): void {
    const pending = this.pending();
    if (!pending) {
      this.resetWizard();
      return;
    }
    this.api
      .annuler(pending.idVirement)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.success.set(res.message);
          this.resetWizard();
          this.reloadAll();
        },
        error: (err) => this.error.set(this.readError(err, 'Annulation impossible.'))
      });
  }

  resetWizard(): void {
    this.step.set('beneficiaire');
    this.pending.set(null);
    this.simulation.set(null);
    this.otpCode.set('');
    this.useNewBeneficiaire.set(false);
  }

  onSimBeneficiaireChange(value: string | number): void {
    const id = Number(value);
    this.simBeneficiaireId.set(id || null);
    const chosen = this.beneficiaires().find((b) => b.id === id);
    if (chosen) {
      this.simRib.set(chosen.rib);
      this.simIban.set(chosen.iban || '');
      this.simBanque.set(chosen.banque);
      this.simPays.set(chosen.pays || '');
      this.simDevise.set(chosen.devise || 'EUR');
    }
  }

  simulateStandalone(): void {
    if (!this.simBeneficiaireId()) {
      if (this.typeVirement() === 'International') {
        if (this.ibanCharCount(this.simIban()) < 15) {
          this.error.set('Saisissez un IBAN (15 à 34 caractères) ou choisissez un bénéficiaire international.');
          return;
        }
      } else if (this.ribDigitCount(this.simRib()) !== 20) {
        this.error.set('Le RIB tunisien doit contenir exactement 20 chiffres. Exemple STB : 10001000000000000042');
        return;
      }
    }
    this.actionLoading.set(true);
    this.clearFeedback();
    this.api
      .simulate({
        montant: Number(this.simMontant()),
        type: this.typeVirement(),
        devise: this.typeVirement() === 'International' ? this.simDevise() : 'TND',
        idBeneficiaire: this.simBeneficiaireId(),
        rib: this.simRib(),
        iban: this.simIban(),
        banque: this.simBanque(),
        pays: this.simPays()
      })
      .pipe(first())
      .subscribe({
        next: (sim) => {
          this.simResult.set(sim);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Simulation impossible.'));
          this.actionLoading.set(false);
        }
      });
  }

  saveBeneficiaire(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    const editing = this.editingId();
    if (editing) {
      this.api
        .updateBeneficiaire(editing, {
          nom: this.formBenef.nom,
          prenom: this.formBenef.prenom,
          banque: this.formBenef.banque,
          alias: this.formBenef.alias,
          swift: this.formBenef.swift,
          pays: this.formBenef.pays,
          devise: this.formBenef.devise,
          favori: !!this.formBenef.favori,
          actif: true
        })
        .pipe(first())
        .subscribe({
          next: () => {
            this.success.set('Bénéficiaire modifié.');
            this.cancelEdit();
            this.reloadAll();
            this.actionLoading.set(false);
          },
          error: (err) => {
            this.error.set(this.readError(err, 'Modification impossible.'));
            this.actionLoading.set(false);
          }
        });
      return;
    }

    this.api
      .createBeneficiaire(this.formBenef)
      .pipe(first())
      .subscribe({
        next: () => {
          this.success.set('Bénéficiaire ajouté.');
          this.formBenef = this.emptyForm(this.formBenef.type === 'International' ? 'International' : 'National');
          this.reloadAll();
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(this.readError(err, 'Ajout impossible.'));
          this.actionLoading.set(false);
        }
      });
  }

  editBeneficiaire(b: Beneficiaire): void {
    this.editingId.set(b.id);
    this.formBenef = {
      nom: b.nom,
      prenom: b.prenom,
      rib: b.rib,
      banque: b.banque,
      alias: b.alias || '',
      favori: b.favori,
      type: (b.type as TypeVirement) || 'National',
      iban: b.iban || '',
      swift: b.swift || '',
      pays: b.pays || '',
      devise: b.devise || 'TND'
    };
    this.tab.set('beneficiaires');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.formBenef = this.emptyForm('National');
  }

  onFormTypeChange(type: TypeVirement): void {
    this.formBenef.type = type;
    this.formBenef.banque = type === 'International' ? 'BNP Paribas' : 'STB';
    this.formBenef.devise = type === 'International' ? 'EUR' : 'TND';
    this.formBenef.pays = type === 'International' ? 'France' : 'Tunisie';
  }

  emptyForm(type: TypeVirement): UpsertBeneficiaire {
    return {
      nom: '',
      prenom: '',
      rib: '',
      banque: type === 'International' ? 'BNP Paribas' : 'STB',
      alias: '',
      favori: false,
      type,
      iban: '',
      swift: '',
      pays: type === 'International' ? 'France' : 'Tunisie',
      devise: type === 'International' ? 'EUR' : 'TND'
    };
  }

  toggleFavori(b: Beneficiaire): void {
    this.api
      .toggleFavori(b.id)
      .pipe(first())
      .subscribe({
        next: () => this.reloadAll(),
        error: (err) => this.error.set(this.readError(err, 'Action impossible.'))
      });
  }

  deleteBeneficiaire(b: Beneficiaire): void {
    if (!confirm(`Supprimer ${b.nomComplet} ?`)) {
      return;
    }
    this.api
      .deleteBeneficiaire(b.id)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.success.set(res.message);
          this.reloadAll();
        },
        error: (err) => this.error.set(this.readError(err, 'Suppression impossible.'))
      });
  }

  openDetail(id: number): void {
    void this.router.navigate(['/digi-transfert', id]);
  }

  downloadRecu(id: number): void {
    this.api
      .downloadRecu(id)
      .pipe(first())
      .subscribe({
        next: (blob) => this.saveBlob(blob, `recu-virement-${id}.pdf`),
        error: () => this.error.set('Téléchargement du reçu impossible.')
      });
  }

  formatMoney(v: number): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  formatForeign(v: number, devise: string): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
  }

  ribDigitCount(value: string): number {
    return (value || '').replace(/\D/g, '').length;
  }

  private readError(err: unknown, fallback: string): string {
    if (typeof err === 'string' && err.trim()) {
      return err;
    }
    if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as { error?: { message?: string } | string }).error;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body && typeof body === 'object' && body.message) {
        return body.message;
      }
    }
    return fallback;
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

  private clearFeedback(): void {
    this.error.set('');
    this.success.set('');
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
