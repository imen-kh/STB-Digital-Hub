import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
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
import { formatDate, formatForeignAmount, formatMoney, statutBadgeClass, toInputDate, transactionStatutBadgeClass, allocationProgressPercent, isRechargeableCard } from './digi-carte.utils';
import { BankCardWidgetComponent } from './bank-card-widget/bank-card-widget.component';

type ConfirmAction = 'block' | 'unblock' | 'online-on' | 'online-off' | null;
type FeedbackZone = 'page' | 'info' | 'security' | 'limits' | 'recharge' | 'statement' | 'demo' | 'pending' | 'travel';
type RechargeStep = 'form' | 'recap' | 'otp';

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
  rechargeChallengeId = signal('');
  rechargeOtp = signal('');
  demoAmount = signal(50);
  demoType = signal('Paiement');
  demoDevise = signal('');

  statementFrom = signal('');
  statementTo = signal('');

  limitsChallengeId = signal('');
  tempChallengeId = signal('');
  revealChallengeId = signal('');
  limitsOtp = signal('');
  tempOtp = signal('');
  revealOtp = signal('');
  revealedNumber = signal<string | null>(null);

  pendingConfirmTxId = signal<number | null>(null);
  pendingChallengeId = signal('');
  pendingOtp = signal('');

  travelAssistance = signal<TravelAssistanceInfo | null>(null);
  travelAdvantages = signal<TravelAdvantage[]>([]);
  travelAtms = signal<TravelAtm[]>([]);
  exchangeRates = signal<ExchangeRate[]>([]);
  atmFilter = signal('');
  ecommerceActif = signal(true);
  ecommerceFrom = signal('');
  ecommerceTo = signal('');
  ecommerceChallengeId = signal('');
  ecommerceOtp = signal('');
  preferredDevise = signal('EUR');
  detaxeAmount = signal(50);
  detaxePays = signal('France');

  confirmAction = signal<ConfirmAction>(null);
  showConfirmModal = signal(false);

  readonly statutBadgeClass = statutBadgeClass;
  readonly transactionStatutBadgeClass = transactionStatutBadgeClass;
  readonly formatMoney = formatMoney;
  readonly formatForeignAmount = formatForeignAmount;
  readonly formatDate = formatDate;
  readonly allocationProgressPercent = allocationProgressPercent;
  readonly isRechargeableCard = isRechargeableCard;

  private cardId = 0;

  ngOnInit(): void {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    this.statementTo.set(today.toISOString().slice(0, 10));
    this.statementFrom.set(monthAgo.toISOString().slice(0, 10));

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.router.navigate(['/digi-carte']);
        return;
      }
      this.cardId = id;
      this.loadCard();
    });
  }

  goBack(): void {
    this.router.navigate(['/digi-carte']);
  }

  private clearFeedback(): void {
    this.error.set('');
    this.success.set('');
  }

  private setError(zone: FeedbackZone, message: string): void {
    this.feedbackZone.set(zone);
    this.success.set('');
    this.error.set(message);
  }

  private setSuccess(zone: FeedbackZone, message: string): void {
    this.feedbackZone.set(zone);
    this.error.set('');
    this.success.set(message);
  }

  isFeedback(zone: FeedbackZone): boolean {
    return this.feedbackZone() === zone && (!!this.error() || !!this.success());
  }

  loadCard(): void {
    this.loading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .getCard(this.cardId)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.card.set(data);
          this.limitsPaiement.set(data.plafondPaiement);
          this.limitsRetrait.set(data.plafondRetrait);
          this.tempLimit.set(data.plafondTemporaire ?? data.plafondPaiement);
          this.tempLimitDate.set(data.dateFinPlafondTemporaire ? toInputDate(data.dateFinPlafondTemporaire) : '');
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
        },
        error: (err) => {
          this.setError('page', typeof err === 'string' ? err : 'Carte introuvable.');
          this.loading.set(false);
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

  requestRechargeOtp(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService.requestRechargeOtp(this.cardId).pipe(first()).subscribe({
      next: (res) => {
        this.rechargeChallengeId.set(res.challengeId);
        this.rechargeStep.set('otp');
        this.setSuccess('recharge', res.message);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.setError('recharge', typeof err === 'string' ? err : 'Envoi du code impossible.');
        this.actionLoading.set(false);
      }
    });
  }

  confirmRecharge(): void {
    const compteId = this.rechargeCompteId();
    if (!compteId || !this.rechargeChallengeId() || !this.rechargeOtp().trim()) {
      this.setError('recharge', 'Saisissez le code OTP reçu par e-mail.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .recharge(this.cardId, compteId, this.rechargeAmount(), this.rechargeChallengeId(), this.rechargeOtp().trim())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.setSuccess('recharge', res.message);
          this.rechargeStep.set('form');
          this.rechargeChallengeId.set('');
          this.rechargeOtp.set('');
          this.loadTransactions();
          this.loadCourantAccounts();
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
    this.rechargeChallengeId.set('');
    this.rechargeOtp.set('');
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
    let request$;
    switch (action) {
      case 'block':
        request$ = this.digiCarteService.blockCard(card.id);
        break;
      case 'unblock':
        request$ = this.digiCarteService.unblockCard(card.id);
        break;
      case 'online-on':
        request$ = this.digiCarteService.setOnlinePayments(card.id, true);
        break;
      case 'online-off':
        request$ = this.digiCarteService.setOnlinePayments(card.id, false);
        break;
      default:
        this.actionLoading.set(false);
        return;
    }

    request$.pipe(first()).subscribe({
      next: (res) => {
        if ('card' in res) {
          this.card.set(res.card);
          this.limitsPaiement.set(res.card.plafondPaiement);
          this.limitsRetrait.set(res.card.plafondRetrait);
        }
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
  }

  saveLimits(): void {
    const card = this.card();
    if (!card || !this.limitsChallengeId() || !this.limitsOtp().trim()) {
      this.setError('limits', 'Demandez un code par e-mail puis saisissez-le pour confirmer.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .updateLimits(card.id, this.limitsPaiement(), this.limitsRetrait(), this.limitsChallengeId(), this.limitsOtp().trim())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.setSuccess('limits', res.message);
          this.limitsChallengeId.set('');
          this.limitsOtp.set('');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('limits', typeof err === 'string' ? err : 'Mise à jour impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  requestLimitsOtp(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService.requestLimitsOtp(this.cardId).pipe(first()).subscribe({
      next: (res) => {
        this.limitsChallengeId.set(res.challengeId);
        this.setSuccess('limits', res.message);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.setError('limits', typeof err === 'string' ? err : 'Envoi du code impossible.');
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

    if (!card || !this.tempChallengeId() || !this.tempOtp().trim()) {
      this.setError('limits', 'Demandez un code par e-mail puis saisissez-le pour confirmer.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .setTemporaryLimit(card.id, this.tempLimit(), this.tempLimitDate(), this.tempChallengeId(), this.tempOtp().trim())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.setSuccess('limits', res.message);
          this.tempChallengeId.set('');
          this.tempOtp.set('');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('limits', typeof err === 'string' ? err : 'Plafond temporaire impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  requestTemporaryLimitOtp(): void {
    const validationError = this.getTemporaryLimitValidationError();
    if (validationError) {
      this.setError('limits', validationError);
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService.requestTemporaryLimitOtp(this.cardId).pipe(first()).subscribe({
      next: (res) => {
        this.tempChallengeId.set(res.challengeId);
        this.setSuccess('limits', res.message);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.setError('limits', typeof err === 'string' ? err : 'Envoi du code impossible.');
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

  requestRevealNumberOtp(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.revealedNumber.set(null);
    this.digiCarteService.requestRevealNumberOtp(this.cardId).pipe(first()).subscribe({
      next: (res) => {
        this.revealChallengeId.set(res.challengeId);
        this.setSuccess('info', res.message);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.setError('info', typeof err === 'string' ? err : 'Envoi du code impossible.');
        this.actionLoading.set(false);
      }
    });
  }

  confirmRevealNumber(): void {
    if (!this.revealChallengeId() || !this.revealOtp().trim()) {
      this.setError('info', 'Saisissez le code reçu par e-mail.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .revealNumber(this.cardId, this.revealChallengeId(), this.revealOtp().trim())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.revealedNumber.set(res.numeroComplet);
          this.setSuccess('info', res.message);
          this.revealOtp.set('');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('info', typeof err === 'string' ? err : 'Affichage impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  hideRevealedNumber(): void {
    this.revealedNumber.set(null);
    this.revealChallengeId.set('');
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
    const options =
      card.estTravel && this.demoDevise()
        ? { devise: this.demoDevise() }
        : card.estTravel
          ? {}
          : undefined;
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
              `Transaction inhabituelle détectée (${this.formatMoney(tx.montant)}). Elle est en attente — validez ou refusez-la dans l'historique.`
            );
          } else {
            this.setSuccess('demo', `Transaction ${tx.typeOperation} de ${this.formatMoney(tx.montant)} validée.`);
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

  startConfirmPending(tx: CardTransaction): void {
    const card = this.card();
    if (!card || !this.isPendingTransaction(tx)) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.pendingConfirmTxId.set(tx.id);
    this.pendingOtp.set('');
    this.pendingChallengeId.set('');
    this.digiCarteService
      .requestConfirmPendingOtp(card.id, tx.id)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.pendingChallengeId.set(res.challengeId);
          this.setSuccess('pending', res.message || 'Code OTP envoyé à votre e-mail.');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.pendingConfirmTxId.set(null);
          this.setError('pending', typeof err === 'string' ? err : 'Envoi du code impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  submitConfirmPending(): void {
    const card = this.card();
    const txId = this.pendingConfirmTxId();
    if (!card || !txId || !this.pendingChallengeId() || !this.pendingOtp().trim()) {
      this.setError('pending', 'Saisissez le code OTP reçu par e-mail.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .confirmPendingTransaction(card.id, txId, this.pendingChallengeId(), this.pendingOtp().trim())
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.pendingConfirmTxId.set(null);
          this.pendingChallengeId.set('');
          this.pendingOtp.set('');
          if (res.card) {
            this.card.set(res.card);
          }
          this.setSuccess('pending', res.message || 'Transaction validée.');
          this.loadTransactions();
          this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('pending', typeof err === 'string' ? err : 'Validation impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  cancelConfirmPending(): void {
    this.pendingConfirmTxId.set(null);
    this.pendingChallengeId.set('');
    this.pendingOtp.set('');
    this.clearFeedback();
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
          if (this.pendingConfirmTxId() === tx.id) {
            this.cancelConfirmPending();
          }
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
          this.setSuccess('travel', 'Attestation d\'assistance téléchargée.');
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Téléchargement impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  requestEcommerceIntlOtp(): void {
    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .requestEcommerceIntlOtp(this.cardId)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.ecommerceChallengeId.set(res.challengeId);
          this.setSuccess('travel', res.message);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Envoi du code impossible.');
          this.actionLoading.set(false);
        }
      });
  }

  saveEcommerceIntl(): void {
    if (!this.ecommerceChallengeId() || !this.ecommerceOtp().trim()) {
      this.setError('travel', 'Demandez un code OTP puis saisissez-le.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .setEcommerceIntl(
        this.cardId,
        this.ecommerceActif(),
        this.ecommerceFrom() || null,
        this.ecommerceTo() || null,
        this.ecommerceChallengeId(),
        this.ecommerceOtp().trim()
      )
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.card.set(res.card);
          this.ecommerceChallengeId.set('');
          this.ecommerceOtp.set('');
          this.setSuccess('travel', res.message);
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

  creditDetaxe(): void {
    if (!this.detaxeAmount() || this.detaxeAmount() <= 0) {
      this.setError('travel', 'Saisissez un montant de détaxe valide.');
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();
    this.digiCarteService
      .creditDetaxe(this.cardId, this.detaxeAmount(), this.detaxePays())
      .pipe(first())
      .subscribe({
        next: (res) => {
          if (res.card) {
            this.card.set(res.card);
          }
          this.setSuccess('travel', res.message);
          this.loadTransactions();
          this.notificationService.load().pipe(first()).subscribe({ error: () => undefined });
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.setError('travel', typeof err === 'string' ? err : 'Crédit détaxe impossible.');
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
        return `Activer les paiements en ligne pour ${card?.numeroMasque} ?`;
      case 'online-off':
        return `Désactiver les paiements en ligne pour ${card?.numeroMasque} ?`;
      default:
        return 'Confirmer cette action ?';
    }
  }
}
