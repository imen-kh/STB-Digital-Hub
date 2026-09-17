import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface HomeSlice {
  label: string;
  value: number;
}

export interface HomePoint {
  label: string;
  depensesCarte: number;
  versementsEpargne: number;
  virements: number;
}

export interface HomeAlert {
  niveau: string;
  titre: string;
  message: string;
  url: string;
  icone: string;
}

export interface HomeDashboard {
  soldeCourant: number;
  soldeEpargne: number;
  soldePrepaye: number;
  soldeRestantCredit: number;
  patrimoineNet: number;
  capitalAccorde: number;
  capitalRembourse: number;
  objectifEpargne?: number | null;
  progressionObjectifPct: number;
  arrondiActif: boolean;
  creditsActifs: number;
  demandesCreditEnAttente: number;
  prochaineEcheance?: string | null;
  montantProchaineEcheance?: number | null;
  cartesActives: number;
  transactionsCarteEnAttente: number;
  retraitsEpargneEnAttente: number;
  virementsMois: number;
  volumeVirementsMois: number;
  virementsEnAttente: number;
  beneficiairesActifs: number;
  restantPlafondJour: number;
  restantPlafondMois: number;
  volumeNationalMois: number;
  volumeInternationalMois: number;
  alertes: HomeAlert[];
  patrimoine: HomeSlice[];
  activite: HomePoint[];
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/home`;

  getDashboard(): Observable<HomeDashboard> {
    return this.http.get<HomeDashboard>(`${this.baseUrl}/dashboard`);
  }
}
