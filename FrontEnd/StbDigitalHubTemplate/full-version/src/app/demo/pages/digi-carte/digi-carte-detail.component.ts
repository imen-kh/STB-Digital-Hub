import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  CardActionConfirmResult,
  CardActionSubmitResponse,
  CardDetail,
  CardTransaction,
  DigiCarteService,
  ExchangeRate,
  TravelAdvantage,
  TravelAssistanceInfo,
  TravelAtm
} from 'src/app/theme/shared/service/digi-carte.service';
import { AccountSummary, DigiCompteService } from 'src/app/theme/shared/service/digi-compte.service';
import { NotificationService } from 'src/app/theme/shared/service/notification.service';
import {
  formatDate,
  formatForeignAmount,
  formatMoney,
  statutBadgeClass,
  toInputDate,
  transactionStatutBadgeClass,
  allocationProgressPercent,
  isRechargeableCard
} from './digi-carte.utils';
import { BankCardWidgetComponent } from './bank-card-widget/bank-card-widget.component';

type ConfirmAction = 'block' | 'unblock' | 'online-on' | 'online-off' | null;
type FeedbackZone = 'page' | 'info' | 'security' | 'limits' | 'recharge' | 'statement' | 'demo' | 'pending' | 'travel';
type RechargeStep = 'form' | 'recap';

@Component({
  selector: 'app-digi-carte-detail',
  imports: [...SHARED_IMPORTS, FormsModule, BankCardWidgetComponent],
  templateUrl: './digi-carte-detail.component.html',
  styleUrl: './digi-carte-detail.component.scss'
})
export class DigiCarteDetailComponent implements OnInit {
  private readonly digiCarteService = inject(DigiCarteService);
  private readonly digiCompteService = inject(DigiCompteService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  actionLoading = signal(false);
  error = signal('');
  success = signal('');
  feedbackZone = signal<FeedbackZone>('page');

  card = signal<CardDetail | null>(null);
  transactions = signal<CardTransaction[]>([]);
  transactionTypeFilter = signal('');
  courantAccounts = signal<AccountSummary[]>([]);

  limitsPaiement = signal(0);
  limitsRetrait = signal(0);
  tempLimit = signal(0);
  tempLimitDate = signal('');
  rechargeAmount = signal(100);
  rechargeCompteId = signal<number | null>(null);
  rechargeStep = signal<RechargeStep>('form');
  demoAmount = signal(18.6);
  demoType = signal('Paiement');
  demoDevise = signal('');
  demoPays = signal('France');

  statementFrom = signal('');
  statementTo = signal('');

  travelAssistance = signal<TravelAssistanceInfo | null>(null);
  travelAdvantages = signal<TravelAdvantage[]>([]);
  travelAtms = signal<TravelAtm[]>([]);
  exchangeRates = signal<ExchangeRate[]>([]);
  atmFilter = signal('');
  ecommerceActif = signal(true);
  ecommerceFrom = signal('');
  ecommerceTo = signal('');
  preferredDevise = signal('EUR');

  confirmAction = signal<ConfirmAction>(null);
  showConfirmModal = signal(false);
  revealedNumber = signal<string | null>(null);
  /** Lien de confirmation (affiché si l'e-mail n'a pas pu être envoyé / mode DEV). */
  pendingConfirmUrl = signal<string | null>(null);

  readonly statutBadgeClass = statutBadgeClass;
  readonly transactionStatutBadgeClass = transactionStatutBadgeClass;
  readonly formatMoney = formatMoney;
  readonly formatForeignAmount = formatForeignAmount;
  readonly formatDate = formatDate;
  readonly allocationProgressPercent = allocationProgressPercent;
  readonly isRechargeableCard = isRechargeableCard;

  private cardId = 0;
  private pendingConfirmToken: string | null = null;
  private confirmInFlight = false;

  ngOnInit(): void {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    this.statementTo.set(today.toISOString().slice(0, 10));
    this.statementFrom.set(monthAgo.toISOString().slice(0, 10));

    this.route.queryParamMap.subscribe((query) => {
      const token = query.get('confirm');
      this.pendingConfirmToken = token && token.length > 0 ? token : null;
      if (this.cardId && this.pendingConfirmToken) {
        this.processEmailConfirm(this.pendingConfirmToken);
      }
    });

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.router.navigate(['/digi-carte']);
        return;
      }
      this.cardId = id;
      this.loadCard(false, () => {
        if (this.pendingConfirmToken) {
          this.processEmailConfirm(this.pendingConfirmToken);
        }
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/digi-carte']);
  }

  private clearFeedback(): void {
    this.error.set('');
    this.success.set('');
    this.pendingConfirmUrl.set(null);
  }

  private setError(zone: FeedbackZone, message: string): void {
    this.feedbackZone.set(zone);
    this.success.set('');
    this.pendingConfirmUrl.set(null);
    this.error.set(message);
  }

  private setSuccess(zone: FeedbackZone, message: string): void {
    this.feedbackZone.set(zone);
    this.error.set('');
    this.success.set(message);
  }

  /** Après enregistrement : le bouton de confirmation reste sur cette page. */
  private setPendingActionSuccess(zone: FeedbackZone, res?: CardActionSubmitResponse): void {
    const token = res?.actionId || this.extractConfirmToken(res?.confirmUrl);
    this.pendingConfirmToken = token;
    this.setSuccess(
      zone,
      'Cliquez sur « Confirmer l’opération » ci-dessous pour appliquer la modification. Un e-mail vous a aussi été envoyé.'
    );
    this.pendingConfirmUrl.set(token ? token : null);
  }

  private extractConfirmToken(url?: string | null): string | null {
    if (!url) {
      return null;
    }
    try {
      const parsed = new URL(url, window.location.origin);
      const fromQuery = parsed.searchParams.get('confirm');
      if (fromQuery) {
        return fromQuery;
      }
      const match = parsed.pathname.match(/confirm(?:-email)?\/([0-9a-fA-F-]{36})/i);
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }

  openPendingConfirmLink(): void {
    const token = this.pendingConfirmToken || this.extractConfirmToken(this.pendingConfirmUrl());
    if (!token) {
      return;
    }
    this.processEmailConfirm(token);
  }

  private processEmailConfirm(token: string): void {
    if (this.confirmInFlight) {
      return;
    }
    this.confirmInFlight = true;
    this.pendingConfirmToken = null;
    this.actionLoading.set(true);
    this.digiCarteService
      .confirmCardAction(token)
      .pipe(first())
      .subscribe({
        next: (res: CardActionConfirmResult) => {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });

          const numero = (res.numeroComplet || res.NumeroComplet || '').trim() || null;
          const zone: FeedbackZone = numero ? 'info' : 'page';
          const message = res.success
            ? res.message || 'Opération confirmée.'
            : res.message || 'La confirmation a échoué.';

          this.loadCard(true, () => {
            if (res.success) {
              this.pendingConfirmUrl.set(null);
              if (numero) {
                this.revealedNumber.set(numero);
                this.setSuccess(zone, `${message} Numéro : ${numero}`);
              } else {
                this.setSuccess(zone, message);
              }
            } else {
              this.setError(zone, message);
            }
            this.confirmInFlight = false;
            this.actionLoading.set(false);
          });
        },
        error: (err) => {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
          this.setError('page', typeof err === 'string' ? err : 'La confirmation a échoué.');
          this.confirmInFlight = false;
          this.actionLoading.set(false);
        }
      });
  }

  isFeedback(zone: FeedbackZone): boolean {
    return this.feedbackZone() === zone && (!!this.error() || !!this.success());
  }

  private applyCardDetail(data: CardDetail): void {
    this.card.set(data);
    this.limitsPaiement.set(data.plafondPaiement);
    this.limitsRetrait.set(data.plafondRetrait);
    this.tempLimit.set(data.plafondTemporaire ?? data.plafondPaiement);
    this.tempLimitDate.set(data.dateFinPlafondTemporaire ? toInputDate(data.dateFinPlafondTemporaire) : '');
  }

  private effectivePaymentLimit(
    plafondPaiement: number,
    plafondTemporaire?: number | null,
    dateFin?: string | null
  ): number {
    if (plafondTemporaire && dateFin) {
      const parsed = Date.parse(dateFin.includes('/') ? dateFin.split('/').reverse().join('-') : dateFin);
      if (!Number.isNaN(parsed) && parsed >= Date.now()) {
        return plafondTemporaire;
      }
    }
    return plafondPaiement;
  }

  loadCard(preserveFeedback = false, afterLoad?: () => void): void {
    this.loading.set(true);
    if (!preserveFeedback) {
      this.clearFeedback();
    }
    this.digiCarteService
      .getCard(this.cardId)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.applyCardDetail(data);
          this.loading.set(false);
          this.loadTransactions();
          if (data.estCCash || data.estTravel) {
            this.loadCourantAccounts();
          }
          if (data.estTravel) {
            this.ecommerceActif.set(data.ecommerceInternationalActif);
            this.ecommerceFrom.set(toInputDate(data.dateDebutEcommerceIntl || ''));
            this.ecommerceTo.set(toInputDate(data.dateFinEcommerceIntl || ''));
            this.preferredDevise.set(data.devisePreferee || 'EUR');
            this.loadTravelExtras();
          }
          afterLoad?.();
        },
        error: (err) => {
          this.setError('page', typeof err === 'string' ? err : 'Carte introuvable.');
          this.loading.set(false);
          this.confirmInFlight = false;
          this.actionLoading.set(false);
        }
      });
  }

  loadTransactions(): void {
    this.digiCarteService
      .getTransactions(this.cardId, this.transactionTypeFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (data) => this.transactions.set(data),
        error: () => this.transactions.set([])
      });
  }

  loadCourantAccounts(): void {
    this.digiCompteService
      .getAccounts('Courant')
      .pipe(first())
      .subscribe({
        next: (data) => {
          const actifs = data.filter((a) => a.statut === 'Actif');
          this.courantAccounts.set(actifs);
          if (actifs.length && !this.rechargeCompteId()) {
            this.rechargeCompteId.set(actifs[0].id);
          }
        },
        error: () => this.courantAccounts.set([])
      });
  }

  rechargeHistory(): CardTransaction[] {
    return this.transactions().filter((t) => t.typeOperation === 'Recharge');
  }

  selectedRechargeAccount(): AccountSummary | undefined {
    return this.courantAccounts().find((a) => a.id === this.rechargeCompteId());
  }

  goRechargeRecap(): void {
    const card = this.card();
    if (!card || !isRechargeableCard(card)) {
      return;
    }
    if (!this.rechargeCompteId()) {
      this.setError('recharge', 'Sélectionnez un compte courant source.');
      return;
    }
    if (!this.rechargeAmount() || this.rechargeAmount() <= 0) {
      this.setError('recharge', 'Saisissez un montant de recharge supérieur à zéro.');
      return;
    }
    if (card.plafondRecharge > 0 && this.rechargeAmount() > card.plafondRecharge) {
      this.setError('recharge', `Le montant dépasse le plafond de recharge (${this.formatMoney(card.plafondRecharge)}).`);
      return;
    }
    if (card.estTravel && this.rechargeAmount() > card.allocationRestante) {
      this.setError(
        'recharge',
        `Le montant dépasse le reste d'allocation touristique (${this.formatMoney(card.allocationRestante)}).`
      );
      return;
    }
    if (card.soldeMaximal > 0 && card.solde + this.rechargeAmount() > card.soldeMaximal) {
      this.setError('recharge', `Le solde maximal de la carte (${this.formatMoney(card.soldeMaximal)}) serait dépassé.`);
      return;
    }
    const compte = this.selectedRechargeAccount();
    if (compte && this.rechargeAmount() > compte.solde) {
      this.setError('recharge', `Solde insuffisant sur ${compte.libelle} (${this.formatMoney(compte.solde)}).`);
      return;
    }
    this.clearFeedback();
    this.rechargeStep.set('recap');
  }

  confirmRecharge(): void {
    const compteId = this.rechargeCompteId();
    if (!compteId) {
      this.setError('recharge', 'Sélectionnez un compte courant source.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .recharge(this.cardId, compteId, this.rechargeAmount())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.setPendingActionSuccess('recharge', res);
          this.rechargeStep.set('form');
          this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('recharge', typeof err === 'string' ? err : 'Recharge impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  resetRechargeFlow(): void {
    this.rechargeStep.set('form');
  }

  onTransactionFilterChange(): void {
    this.loadTransactions();
  }

  openConfirm(action: ConfirmAction): void {
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  closeConfirm(): void {
    this.showConfirmModal.set(false);
    this.confirmAction.set(null);
  }

  executeConfirm(): void {
    const action = this.confirmAction();
    const card = this.card();
    if (!action || !card) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();

    const zone: FeedbackZone = 'security';

    if (action === 'block' || action === 'unblock') {
      const request$ = action === 'block' ? this.digiCarteService.blockCard(card.id) : this.digiCarteService.unblockCard(card.id);
      request$.pipe(first()).subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.limitsPaiement.set(res.card.plafondPaiement);
          this.limitsRetrait.set(res.card.plafondRetrait);
          this.setSuccess(zone, res.message);
          this.closeConfirm();
          this.loadTransactions();
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError(zone, typeof err === 'string' ? err : 'Action impossible.');
          this.closeConfirm();
          this.actionLoading.set(false);
        }
      });
      return;
    }

    const actif = action === 'online-on';
    this.digiCarteService
      .setOnlinePayments(card.id, actif)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.setPendingActionSuccess(zone, res);
          this.closeConfirm();
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError(zone, typeof err === 'string' ? err : 'Action impossible.');
          this.closeConfirm();
          this.actionLoading.set(false);
        }
      });
  }

  saveLimits(): void {
    const card = this.card();
    if (!card) {
      return;
    }

    const paiement = this.limitsPaiement();
    const retrait = this.limitsRetrait();
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .updateLimits(card.id, paiement, retrait)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.applyCardDetail(
            res.card ?? {
              ...card,
              plafondPaiement: paiement,
              plafondRetrait: retrait,
              plafondEffectifPaiement: this.effectivePaymentLimit(paiement, card.plafondTemporaire, card.dateFinPlafondTemporaire)
            }
          );
          this.setSuccess('limits', res.message || 'Les plafonds ont été mis à jour.');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('limits', typeof err === 'string' ? err : 'Mise à jour impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  saveTemporaryLimit(): void {
    const card = this.card();
    const validationError = this.getTemporaryLimitValidationError();
    if (validationError) {
      this.setError('limits', validationError);
      return;
    }

    if (!card) {
      return;
    }

    const temporaire = this.tempLimit();
    const dateFin = this.tempLimitDate();
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .setTemporaryLimit(card.id, temporaire, dateFin)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.applyCardDetail(
            res.card ?? {
              ...card,
              plafondTemporaire: temporaire,
              dateFinPlafondTemporaire: dateFin,
              plafondEffectifPaiement: this.effectivePaymentLimit(card.plafondPaiement, temporaire, dateFin)
            }
          );
          this.setSuccess('limits', res.message || 'Le plafond temporaire a été appliqué.');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('limits', typeof err === 'string' ? err : 'Plafond temporaire impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  /** Returns an error message if temporary limit fields are invalid; otherwise null. */
  private getTemporaryLimitValidationError(): string | null {
    const card = this.card();
    if (!card) {
      return 'Carte introuvable.';
    }

    if (!this.tempLimitDate()?.trim()) {
      return 'Veuillez saisir une date de fin.';
    }

    const parts = this.tempLimitDate().split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      return 'La date de fin du plafond temporaire est invalide.';
    }

    const [year, month, day] = parts;
    const endDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate <= today) {
      return "La date de fin du plafond temporaire doit être postérieure à aujourd'hui.";
    }

    if (!this.tempLimit() || this.tempLimit() <= 0) {
      return 'Saisissez un plafond temporaire valide.';
    }

    if (this.tempLimit() < card.plafondPaiement) {
      return 'Le plafond temporaire doit être supérieur ou égal au plafond de paiement.';
    }

    return null;
  }

  requestRevealNumber(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .revealNumber(this.cardId)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.setPendingActionSuccess('info', res);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('info', typeof err === 'string' ? err : 'Demande impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  generateFakeTransaction(): void {
    const card = this.card();
    if (!card) {
      return;
    }

    if (!this.demoAmount() || this.demoAmount() <= 0) {
      this.setError('demo', 'Saisissez un montant de transaction supérieur à zéro.');
      return;
    }

    if (!this.demoType()) {
      this.setError('demo', 'Choisissez un type de paiement.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();

    let options: { devise?: string; montantDevise?: number; pays?: string } | undefined;
    if (card.estTravel) {
      options = {};
      if (this.demoDevise()) {
        options.devise = this.demoDevise();
      }
      if (this.demoType() === 'Detaxe' && this.demoPays().trim()) {
        options.pays = this.demoPays().trim();
      }
    }

    this.digiCarteService
      .generateFakeTransaction(card.id, this.demoAmount(), this.demoType(), options)
      .pipe(first())
      .subscribe({
        next: (tx) => {
          const refused = /non valide|refus/i.test(tx.statut);
          const pending = /attente/i.test(tx.statut);
          if (refused) {
            this.clearFeedback();
          } else if (pending) {
            this.setSuccess(
              'demo',
              `Transaction inhabituelle détectée (${this.formatMoney(tx.montant)}). Elle est en attente — l'arrondi épargne ne sera versé qu'après confirmation.`
            );
          } else {
            const arrondi = tx.arrondiEpargne ?? 0;
            this.setSuccess(
              'demo',
              arrondi > 0
                ? `Transaction ${tx.typeOperation} de ${this.formatMoney(tx.montant)} validée. Arrondi : ${this.formatMoney(arrondi)} virés vers DigiÉpargne.`
                : `Transaction ${tx.typeOperation} de ${this.formatMoney(tx.montant)} validée.`
            );
          }
          this.loadTransactions();
          this.digiCarteService
            .getCard(this.cardId)
            .pipe(first())
            .subscribe({
              next: (data) => this.card.set(data),
              error: () => undefined
            });
          this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('demo', typeof err === 'string' ? err : 'Transaction impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  isPendingTransaction(tx: CardTransaction): boolean {
    return /attente/i.test(tx.statut);
  }

  requestConfirmPending(tx: CardTransaction): void {
    const card = this.card();
    if (!card || !this.isPendingTransaction(tx)) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .confirmPendingTransaction(card.id, tx.id)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.setPendingActionSuccess('pending', res);
          this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('pending', typeof err === 'string' ? err : 'Demande de confirmation impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  refusePending(tx: CardTransaction): void {
    const card = this.card();
    if (!card || !this.isPendingTransaction(tx)) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .refusePendingTransaction(card.id, tx.id)
      .pipe(first())
      .subscribe({
        next: (res) => {
          if (res.card) {
            this.card.set(res.card);
          }
          this.setSuccess('pending', res.message || 'Transaction refusée.');
          this.loadTransactions();
          this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('pending', typeof err === 'string' ? err : 'Refus impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  minTempLimitDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  downloadStatement(): void {
    const card = this.card();
    if (!card || !this.statementFrom() || !this.statementTo()) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .downloadStatement(card.id, this.statementFrom(), this.statementTo())
      .pipe(first())
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `releve-carte-${card.id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.setSuccess('statement', 'Relevé PDF téléchargé.');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('statement', typeof err === 'string' ? err : 'Téléchargement impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  loadTravelExtras(): void {
    this.digiCarteService
      .getTravelAssistance(this.cardId)
      .pipe(first())
      .subscribe({
        next: (data) => this.travelAssistance.set(data),
        error: () => this.travelAssistance.set(null)
      });
    this.digiCarteService
      .getTravelAdvantages(this.cardId)
      .pipe(first())
      .subscribe({
        next: (data) => this.travelAdvantages.set(data),
        error: () => this.travelAdvantages.set([])
      });
    this.loadTravelAtms();
    this.digiCarteService
      .getExchangeRates()
      .pipe(first())
      .subscribe({
        next: (data) => this.exchangeRates.set(data),
        error: () => this.exchangeRates.set([])
      });
  }

  loadTravelAtms(): void {
    this.digiCarteService
      .getTravelAtms(this.cardId, this.atmFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (data) => this.travelAtms.set(data),
        error: () => this.travelAtms.set([])
      });
  }

  downloadAssistanceCertificate(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .downloadAssistanceCertificate(this.cardId)
      .pipe(first())
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attestation-assistance-travel-${this.cardId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.setSuccess('travel', "Attestation d'assistance téléchargée.");
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Téléchargement impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  saveEcommerceIntl(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .setEcommerceIntl(this.cardId, this.ecommerceActif(), this.ecommerceFrom() || null, this.ecommerceTo() || null)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.setPendingActionSuccess('travel', res);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Mise à jour impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  toggleMarteAlerts(): void {
    const card = this.card();
    if (!card) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .setMarteAlerts(card.id, !card.alertesMarteActives)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.setSuccess('travel', res.message);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Action impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  savePreferredCurrency(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .setPreferredCurrency(this.cardId, this.preferredDevise())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.setSuccess('travel', res.message);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Devise impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  confirmMessage(): string {
    const card = this.card();
    switch (this.confirmAction()) {
      case 'block':
        return `Confirmez-vous le blocage de la carte ${card?.numeroMasque} ?`;
      case 'unblock':
        return `Confirmez-vous le déblocage de la carte ${card?.numeroMasque} ?`;
      case 'online-on':
        return `Activer les paiements en ligne pour ${card?.numeroMasque} ? Un e-mail de confirmation vous sera envoyé.`;
      case 'online-off':
        return `Désactiver les paiements en ligne pour ${card?.numeroMasque} ? Un e-mail de confirmation vous sera envoyé.`;
      default:
        return 'Confirmer cette action ?';
    }
  }
}
