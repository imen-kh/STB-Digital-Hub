import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EpargneDashboard {
  idCompteEpargne: number;
  idCompte: number;
  libelle: string;
  numeroMasque: string;
  soldeDisponible: number;
  tauxInteret: number;
  dateCalculInterets: string;
  objectifEpargne?: number | null;
  progressionObjectifPct: number;
  projection3Mois: number;
  projection12Mois: number;
  interetsEstimesAnnee: number;
  demandesEnAttente: number;
  reglesActives: number;
  prochaineRegle?: string | null;
  arrondiActif: boolean;
}

export interface MouvementEpargne {
  id: number;
  montant: number;
  dateMouvement: string;
  type: string;
  libelle: string;
}

export interface DemandeRetrait {
  id: number;
  montant: number;
  dateDemande: string;
  statut: string;
  motifDecision?: string | null;
}

export interface RegleEpargne {
  id: number;
  typeRegle: string;
  valeur: number;
  frequence: string;
  active: boolean;
  derniereExecution?: string | null;
}

export interface ArrondiStatus {
  active: boolean;
  exemple: string;
}

export interface SimulateEpargneResult {
  soldeDepart: number;
  tauxAnnuel: number;
  soldeFinal: number;
  interetsEstimes: number;
  points: { mois: number; solde: number; interetsCumules: number }[];
}

export interface EpargneActionSubmitResponse {
  actionId: string;
  message: string;
  expiresInSeconds: number;
  statut: string;
  emailSent?: boolean;
  confirmUrl?: string | null;
}

export interface EpargneActionConfirmResult {
  success: boolean;
  message: string;
  demandeId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class DigiEpargneService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/epargne`;

  getDashboard(): Observable<EpargneDashboard> {
    return this.http.get<EpargneDashboard>(`${this.baseUrl}/dashboard`);
  }

  getMouvements(type?: string): Observable<MouvementEpargne[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<MouvementEpargne[]>(`${this.baseUrl}/mouvements`, { params });
  }

  verser(montant: number, motif?: string): Observable<EpargneDashboard> {
    return this.http.post<EpargneDashboard>(`${this.baseUrl}/versement`, { montant, motif });
  }

  demanderRetrait(montant: number): Observable<EpargneActionSubmitResponse> {
    return this.http.post<EpargneActionSubmitResponse>(`${this.baseUrl}/retraits`, { montant });
  }

  getRetraits(statut?: string): Observable<DemandeRetrait[]> {
    let params = new HttpParams();
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<DemandeRetrait[]>(`${this.baseUrl}/retraits`, { params });
  }

  annulerRetrait(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/retraits/${id}/annuler`, {});
  }

  getRegles(): Observable<RegleEpargne[]> {
    return this.http.get<RegleEpargne[]>(`${this.baseUrl}/regles`);
  }

  getArrondi(): Observable<ArrondiStatus> {
    return this.http.get<ArrondiStatus>(`${this.baseUrl}/arrondi`);
  }

  setArrondi(active: boolean): Observable<ArrondiStatus> {
    return this.http.put<ArrondiStatus>(`${this.baseUrl}/arrondi`, { active });
  }

  upsertRegle(typeRegle: string, valeur: number, frequence: string, active: boolean): Observable<RegleEpargne> {
    return this.http.post<RegleEpargne>(`${this.baseUrl}/regles`, { typeRegle, valeur, frequence, active });
  }

  toggleRegle(id: number, active: boolean): Observable<RegleEpargne> {
    return this.http.post<RegleEpargne>(`${this.baseUrl}/regles/${id}/toggle`, { active });
  }

  executerRegle(id: number): Observable<EpargneDashboard> {
    return this.http.post<EpargneDashboard>(`${this.baseUrl}/regles/${id}/executer`, {});
  }

  setObjectif(montant: number | null): Observable<EpargneDashboard> {
    return this.http.put<EpargneDashboard>(`${this.baseUrl}/objectif`, { montant });
  }

  crediterInterets(): Observable<EpargneDashboard> {
    return this.http.post<EpargneDashboard>(`${this.baseUrl}/interets`, {});
  }

  simulate(versementMensuel: number, dureeMois: number): Observable<SimulateEpargneResult> {
    return this.http.post<SimulateEpargneResult>(`${this.baseUrl}/simulate`, { versementMensuel, dureeMois });
  }

  confirmAction(token: string): Observable<EpargneActionConfirmResult> {
    return this.http.get<EpargneActionConfirmResult>(`${this.baseUrl}/actions/confirm/${token}`);
  }

  downloadMouvementsPdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/mouvements.pdf`, { responseType: 'blob' });
  }
}
