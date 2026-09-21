import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CardSummary {
  id: number;
  numeroMasque: string;
  type: string;
  statut: string;
  dateExpiration: string;
  paiementsEnLigneActifs: boolean;
  solde: number;
  estCCash: boolean;
  estTravel: boolean;
}

export interface CardDetail {
  id: number;
  numeroMasque: string;
  type: string;
  statut: string;
  dateExpiration: string;
  plafondPaiement: number;
  plafondRetrait: number;
  plafondTemporaire?: number | null;
  dateFinPlafondTemporaire?: string | null;
  plafondEffectifPaiement: number;
  paiementsEnLigneActifs: boolean;
  solde: number;
  estCCash: boolean;
  estTravel: boolean;
  plafondRecharge: number;
  soldeMaximal: number;
  allocationAnnuelle: number;
  allocationConsommeeAnnee: number;
  allocationRestante: number;
  anneeAllocation: number;
  ecommerceInternationalActif: boolean;
  dateDebutEcommerceIntl?: string | null;
  dateFinEcommerceIntl?: string | null;
  alertesMarteActives: boolean;
  devisePreferee: string;
  soldeEnDevisePreferee: number;
  tauxDevisePreferee: number;
}

export interface CardTransaction {
  id: number;
  reference: string;
  montant: number;
  dateTransaction: string;
  commercant: string;
  typeOperation: string;
  statut: string;
  devise?: string | null;
  montantDevise?: number | null;
  pays?: string | null;
  arrondiEpargne?: number;
}

export interface NamedAmount {
  label: string;
  montant: number;
}

export interface CardDayPoint {
  label: string;
  montant: number;
}

export interface CardAnalytics {
  depensesMois: number;
  operationsMois: number;
  enAttente: number;
  parCommercant: NamedAmount[];
  parType: NamedAmount[];
  activite: CardDayPoint[];
}

export interface TravelAssistanceInfo {
  titre: string;
  couverture: string;
  beneficiaires: string;
  contactInternational: string;
  contactUsa: string;
  contactOpposition: string;
  couvertures: string[];
}

export interface TravelAdvantage {
  titre: string;
  description: string;
  url?: string | null;
  categorie: string;
}

export interface TravelAtm {
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  reseau: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ExchangeRate {
  devise: string;
  libelle: string;
  tauxVersDt: number;
  source: string;
}

/** Demande sensible enregistrée — confirmation par lien e-mail. */
export interface CardActionSubmitResponse {
  actionId: string;
  message: string;
  expiresInSeconds: number;
  statut: string;
  emailSent?: boolean;
  confirmUrl?: string | null;
}

export interface CardActionConfirmResult {
  success: boolean;
  cardId: number;
  message: string;
  numeroComplet?: string | null;
  NumeroComplet?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DigiCarteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/cards`;

  getCards(statut?: string): Observable<CardSummary[]> {
    let params = new HttpParams();
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<CardSummary[]>(this.baseUrl, { params });
  }

  getAnalytics(): Observable<CardAnalytics> {
    return this.http.get<CardAnalytics>(`${this.baseUrl}/analytics`);
  }

  getCard(id: number): Observable<CardDetail> {
    return this.http.get<CardDetail>(`${this.baseUrl}/${id}`);
  }

  blockCard(id: number): Observable<{ message: string; card: CardDetail }> {
    return this.http.patch<{ message: string; card: CardDetail }>(`${this.baseUrl}/${id}/block`, { confirm: true });
  }

  unblockCard(id: number): Observable<{ message: string; card: CardDetail }> {
    return this.http.patch<{ message: string; card: CardDetail }>(`${this.baseUrl}/${id}/unblock`, { confirm: true });
  }

  setOnlinePayments(id: number, actif: boolean): Observable<CardActionSubmitResponse> {
    return this.http.patch<CardActionSubmitResponse>(`${this.baseUrl}/${id}/online-payments`, { actif });
  }

  revealNumber(id: number): Observable<CardActionSubmitResponse> {
    return this.http.post<CardActionSubmitResponse>(`${this.baseUrl}/${id}/reveal-number`, {});
  }

  updateLimits(id: number, plafondPaiement: number, plafondRetrait: number): Observable<{ message: string; card: CardDetail }> {
    return this.http.put<{ message: string; card: CardDetail }>(`${this.baseUrl}/${id}/limits`, {
      plafondPaiement,
      plafondRetrait
    });
  }

  setTemporaryLimit(id: number, plafondTemporaire: number, dateFin: string): Observable<{ message: string; card: CardDetail }> {
    return this.http.patch<{ message: string; card: CardDetail }>(`${this.baseUrl}/${id}/limits/temporary`, {
      plafondTemporaire,
      dateFin
    });
  }

  getTransactions(id: number, type?: string): Observable<CardTransaction[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<CardTransaction[]>(`${this.baseUrl}/${id}/transactions`, { params });
  }

  generateFakeTransaction(
    id: number,
    montant: number,
    typeOperation: string,
    options?: { devise?: string; montantDevise?: number; pays?: string }
  ): Observable<CardTransaction> {
    return this.http.post<CardTransaction>(`${this.baseUrl}/${id}/transactions/fake`, {
      montant,
      typeOperation,
      devise: options?.devise || null,
      montantDevise: options?.montantDevise ?? null,
      pays: options?.pays || null
    });
  }

  confirmPendingTransaction(cardId: number, transactionId: number): Observable<CardActionSubmitResponse> {
    return this.http.post<CardActionSubmitResponse>(
      `${this.baseUrl}/${cardId}/transactions/${transactionId}/confirm`,
      {}
    );
  }

  refusePendingTransaction(
    cardId: number,
    transactionId: number
  ): Observable<{ message: string; transaction: CardTransaction; card: CardDetail }> {
    return this.http.post<{ message: string; transaction: CardTransaction; card: CardDetail }>(
      `${this.baseUrl}/${cardId}/transactions/${transactionId}/refuse`,
      { confirm: true }
    );
  }

  recharge(id: number, compteSourceId: number, montant: number): Observable<CardActionSubmitResponse> {
    return this.http.post<CardActionSubmitResponse>(`${this.baseUrl}/${id}/recharge`, {
      compteSourceId,
      montant
    });
  }

  downloadStatement(id: number, from: string, to: string): Observable<Blob> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${this.baseUrl}/${id}/statement`, { params, responseType: 'blob' });
  }

  getTravelAssistance(id: number): Observable<TravelAssistanceInfo> {
    return this.http.get<TravelAssistanceInfo>(`${this.baseUrl}/${id}/travel/assistance`);
  }

  downloadAssistanceCertificate(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/travel/assistance-certificate`, { responseType: 'blob' });
  }

  setEcommerceIntl(
    id: number,
    actif: boolean,
    dateDebut: string | null,
    dateFin: string | null
  ): Observable<CardActionSubmitResponse> {
    return this.http.patch<CardActionSubmitResponse>(`${this.baseUrl}/${id}/travel/ecommerce`, {
      actif,
      dateDebut,
      dateFin
    });
  }

  setMarteAlerts(id: number, actif: boolean): Observable<{ message: string; card: CardDetail }> {
    return this.http.patch<{ message: string; card: CardDetail }>(`${this.baseUrl}/${id}/travel/marte-alerts`, {
      actif,
      confirm: true
    });
  }

  setPreferredCurrency(id: number, devise: string): Observable<{ message: string; card: CardDetail }> {
    return this.http.patch<{ message: string; card: CardDetail }>(`${this.baseUrl}/${id}/travel/preferred-currency`, {
      devise
    });
  }

  getTravelAdvantages(id: number): Observable<TravelAdvantage[]> {
    return this.http.get<TravelAdvantage[]>(`${this.baseUrl}/${id}/travel/advantages`);
  }

  getTravelAtms(id: number, pays?: string): Observable<TravelAtm[]> {
    let params = new HttpParams();
    if (pays) {
      params = params.set('pays', pays);
    }
    return this.http.get<TravelAtm[]>(`${this.baseUrl}/${id}/travel/atms`, { params });
  }

  getExchangeRates(): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/travel/exchange-rates`);
  }

  confirmCardAction(token: string): Observable<CardActionConfirmResult> {
    return this.http.get<CardActionConfirmResult>(`${this.baseUrl}/actions/confirm/${token}`);
  }
}
