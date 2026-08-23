import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SimulationCredit {
  id: number;
  typeCredit: string;
  montant: number;
  dureeMois: number;
  revenuMensuel: number;
  tauxAnnuel: number;
  mensualiteEstimee: number;
  coutTotalEstime: number;
  tauxEndettement: number;
  niveauEligibilite: string;
  dateSimulation: string;
}

export interface DemandeCredit {
  id: number;
  typeCredit: string;
  montantDemande: number;
  dureeMois: number;
  revenuMensuel: number;
  mensualiteEstimee: number;
  coutTotalEstime: number;
  statut: string;
  dateDemande: string;
  motifDecision?: string | null;
  idCredit?: number | null;
}

export interface CreditSummary {
  id: number;
  reference: string;
  typeCredit: string;
  montantAccorde: number;
  dureeMois: number;
  tauxInteret: number;
  mensualite: number;
  soldeRestantDu: number;
  statut: string;
  dateDebut: string;
  prochaineEcheance?: string | null;
  montantProchaineEcheance?: number | null;
}

export interface Echeance {
  id: number;
  numero: number;
  dateEcheance: string;
  capital: number;
  interet: number;
  montantTotal: number;
  soldeRestantDu: number;
  payee: boolean;
}

export interface CreditDetail extends CreditSummary {
  dateFinPrevue?: string | null;
  echeances: Echeance[];
}

export interface CreditActionSubmitResponse {
  actionId: string;
  message: string;
  expiresInSeconds: number;
  statut: string;
  emailSent?: boolean;
  confirmUrl?: string | null;
}

export interface CreditActionConfirmResult {
  success: boolean;
  message: string;
  demandeId?: number | null;
  creditId?: number | null;
}

export interface CreditOverview {
  creditsActifs: number;
  demandesEnAttente: number;
  soldeRestantTotal: number;
  prochaineEcheance?: string | null;
  montantProchaineEcheance?: number | null;
  capitalAccordeTotal?: number;
  capitalRembourse?: number;
  interetsPayes?: number;
}

export interface CompareScenario {
  dureeMois: number;
  mensualite: number;
  coutTotal: number;
  tauxEndettement: number;
  niveauEligibilite: string;
  tauxAnnuel: number;
}

export interface EarlyRepaymentResult {
  soldeActuel: number;
  montantRembourse: number;
  interetsEconomisesEstimes: number;
  nouveauSolde: number;
  echeancesRestantesAvant: number;
  echeancesRestantesApresEstimees: number;
}

export interface PayInstallmentResponse {
  message: string;
  credit: CreditDetail;
}

@Injectable({ providedIn: 'root' })
export class DigiCreditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/credits`;

  getOverview(): Observable<CreditOverview> {
    return this.http.get<CreditOverview>(`${this.baseUrl}/overview`);
  }

  compare(typeCredit: string, montant: number, dureeMois: number, revenuMensuel: number): Observable<CompareScenario[]> {
    return this.http.post<CompareScenario[]>(`${this.baseUrl}/compare`, {
      typeCredit,
      montant,
      dureeMois,
      revenuMensuel
    });
  }

  simulate(typeCredit: string, montant: number, dureeMois: number, revenuMensuel: number): Observable<SimulationCredit> {
    return this.http.post<SimulationCredit>(`${this.baseUrl}/simulate`, {
      typeCredit,
      montant,
      dureeMois,
      revenuMensuel
    });
  }

  getSimulations(): Observable<SimulationCredit[]> {
    return this.http.get<SimulationCredit[]>(`${this.baseUrl}/simulations`);
  }

  submitDemande(simulationId: number): Observable<CreditActionSubmitResponse> {
    return this.http.post<CreditActionSubmitResponse>(`${this.baseUrl}/demandes`, { simulationId });
  }

  getDemandes(statut?: string): Observable<DemandeCredit[]> {
    let params = new HttpParams();
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<DemandeCredit[]>(`${this.baseUrl}/demandes`, { params });
  }

  getCredits(statut?: string): Observable<CreditSummary[]> {
    let params = new HttpParams();
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<CreditSummary[]>(this.baseUrl, { params });
  }

  getCredit(id: number): Observable<CreditDetail> {
    return this.http.get<CreditDetail>(`${this.baseUrl}/${id}`);
  }

  simulateEarlyRepayment(id: number, montant: number): Observable<EarlyRepaymentResult> {
    return this.http.post<EarlyRepaymentResult>(`${this.baseUrl}/${id}/early-repayment/simulate`, { montant });
  }

  payNextInstallment(id: number): Observable<PayInstallmentResponse> {
    return this.http.post<PayInstallmentResponse>(`${this.baseUrl}/${id}/pay-installment`, {});
  }

  confirmAction(token: string): Observable<CreditActionConfirmResult> {
    return this.http.get<CreditActionConfirmResult>(`${this.baseUrl}/actions/confirm/${token}`);
  }

  downloadAmortization(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/amortization.pdf`, { responseType: 'blob' });
  }

  downloadSimulationAttestation(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/simulations/${id}/attestation.pdf`, { responseType: 'blob' });
  }
}
