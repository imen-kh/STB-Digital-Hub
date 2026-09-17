import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type TypeVirement = 'National' | 'International';
export type ModeExecution = 'Instantane' | 'Standard' | 'Programme';

export interface TransfertOverview {
  soldeCourant: number;
  compteSourceLibelle: string;
  compteSourceMasque: string;
  beneficiairesActifs: number;
  virementsMois: number;
  volumeMois: number;
  plafondJournalier: number;
  plafondMensuel: number;
  consommeJour: number;
  consommeMois: number;
  restantJour: number;
  restantMois: number;
  enAttente: number;
}

export interface TauxChange {
  devise: string;
  libelle: string;
  tauxTnd: number;
  pays: string;
}

export interface SimulationFrais {
  montant: number;
  frais: number;
  totalDebite: number;
  intraStb: boolean;
  typeFrais: string;
  delaiEstime: string;
  banque: string;
  typeVirement: string;
  devise: string;
  montantDevise: number;
  tauxChange: number;
  pays?: string | null;
  modeExecution: string;
  dateExecutionEstimee: string;
}

export interface Beneficiaire {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  type: TypeVirement | string;
  ribMasque: string;
  rib: string;
  iban?: string | null;
  ibanMasque?: string | null;
  swift?: string | null;
  pays?: string | null;
  devise: string;
  banque: string;
  alias?: string | null;
  actif: boolean;
  favori: boolean;
  intraStb: boolean;
  dateCreation: string;
}

export interface UpsertBeneficiaire {
  nom: string;
  prenom: string;
  banque: string;
  type?: TypeVirement | string;
  rib?: string;
  iban?: string | null;
  swift?: string | null;
  pays?: string | null;
  devise?: string | null;
  alias?: string | null;
  favori?: boolean;
}

export interface Virement {
  id: number;
  reference: string;
  type: string;
  montant: number;
  montantDevise: number;
  devise: string;
  tauxChange: number;
  frais: number;
  totalDebite: number;
  motif: string;
  statut: string;
  dateOperation: string;
  dateExecution?: string | null;
  intraStb: boolean;
  delaiEstime: string;
  modeExecution: string;
  beneficiaireNom: string;
  beneficiaireCompteMasque: string;
  banque: string;
  pays?: string | null;
  compteSource: string;
  recuDisponible: boolean;
  otpEnAttente: boolean;
}

export interface VirementEtape {
  titre: string;
  date: string;
  faite: boolean;
  courante: boolean;
}

export interface VirementDetail extends Virement {
  etapes: VirementEtape[];
}

export interface InitierVirementResponse {
  idVirement: number;
  reference: string;
  challengeId: string;
  message: string;
  expiresInSeconds: number;
  emailSent: boolean;
  devOtpCode?: string | null;
  simulation: SimulationFrais;
  virement: Virement;
}

export interface ConfirmerVirementResponse {
  message: string;
  virement: VirementDetail;
}

export interface RenvoiOtpResponse {
  challengeId: string;
  message: string;
  expiresInSeconds: number;
  emailSent: boolean;
  devOtpCode?: string | null;
}

export interface VirementFilters {
  statut?: string;
  q?: string;
  from?: string;
  to?: string;
  idBeneficiaire?: number;
  min?: number;
  max?: number;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class DigiTransfertService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/transferts`;

  getOverview(): Observable<TransfertOverview> {
    return this.http.get<TransfertOverview>(`${this.baseUrl}/overview`);
  }

  getTaux(): Observable<TauxChange[]> {
    return this.http.get<TauxChange[]>(`${this.baseUrl}/taux`);
  }

  simulate(payload: {
    montant: number;
    type?: string;
    devise?: string;
    idBeneficiaire?: number | null;
    rib?: string;
    iban?: string;
    banque?: string;
    pays?: string;
    modeExecution?: string;
    dateProgrammee?: string;
  }): Observable<SimulationFrais> {
    return this.http.post<SimulationFrais>(`${this.baseUrl}/simulate`, payload);
  }

  getBeneficiaires(inclusInactifs = false): Observable<Beneficiaire[]> {
    let params = new HttpParams();
    if (inclusInactifs) {
      params = params.set('inclusInactifs', 'true');
    }
    return this.http.get<Beneficiaire[]>(`${this.baseUrl}/beneficiaires`, { params });
  }

  createBeneficiaire(body: UpsertBeneficiaire): Observable<Beneficiaire> {
    return this.http.post<Beneficiaire>(`${this.baseUrl}/beneficiaires`, body);
  }

  updateBeneficiaire(
    id: number,
    body: {
      nom: string;
      prenom: string;
      banque: string;
      alias?: string | null;
      swift?: string | null;
      pays?: string | null;
      devise?: string | null;
      favori: boolean;
      actif: boolean;
    }
  ): Observable<Beneficiaire> {
    return this.http.put<Beneficiaire>(`${this.baseUrl}/beneficiaires/${id}`, body);
  }

  deleteBeneficiaire(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/beneficiaires/${id}`);
  }

  toggleFavori(id: number): Observable<Beneficiaire> {
    return this.http.post<Beneficiaire>(`${this.baseUrl}/beneficiaires/${id}/favori`, {});
  }

  getVirements(filters: VirementFilters = {}): Observable<Virement[]> {
    let params = new HttpParams();
    if (filters.statut) {
      params = params.set('statut', filters.statut);
    }
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.idBeneficiaire) {
      params = params.set('idBeneficiaire', String(filters.idBeneficiaire));
    }
    if (filters.min) {
      params = params.set('min', String(filters.min));
    }
    if (filters.max) {
      params = params.set('max', String(filters.max));
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    return this.http.get<Virement[]>(this.baseUrl, { params });
  }

  getVirement(id: number): Observable<VirementDetail> {
    return this.http.get<VirementDetail>(`${this.baseUrl}/${id}`);
  }

  initier(body: {
    montant: number;
    motif: string;
    type?: string;
    devise?: string;
    idBeneficiaire?: number | null;
    nouveauBeneficiaire?: UpsertBeneficiaire | null;
    enregistrerBeneficiaire?: boolean;
    modeExecution?: string;
    dateProgrammee?: string;
  }): Observable<InitierVirementResponse> {
    return this.http.post<InitierVirementResponse>(this.baseUrl, body);
  }

  confirmer(id: number, challengeId: string, code: string): Observable<ConfirmerVirementResponse> {
    return this.http.post<ConfirmerVirementResponse>(`${this.baseUrl}/${id}/confirm`, { challengeId, code });
  }

  resendOtp(id: number): Observable<RenvoiOtpResponse> {
    return this.http.post<RenvoiOtpResponse>(`${this.baseUrl}/${id}/resend-otp`, {});
  }

  annuler(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/annuler`, {});
  }

  downloadRecu(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/recu.pdf`, { responseType: 'blob' });
  }
}
