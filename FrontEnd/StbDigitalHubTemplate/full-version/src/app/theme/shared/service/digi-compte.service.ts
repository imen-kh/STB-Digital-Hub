import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AccountSummary {
  id: number;
  libelle: string;
  type: string;
  statut: string;
  numeroMasque: string;
  solde: number;
  devise: string;
}

export interface AccountDetail {
  id: number;
  libelle: string;
  type: string;
  statut: string;
  numeroCompte: string;
  ribMasque: string;
  ibanMasque: string;
  rib: string;
  iban: string;
  solde: number;
  devise: string;
  dateOuverture: string;
}

export interface AccountTransaction {
  id: number;
  reference: string;
  montant: number;
  dateTransaction: string;
  libelle: string;
  typeMouvement: string;
  statut: string;
}

@Injectable({ providedIn: 'root' })
export class DigiCompteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/accounts`;

  getAccounts(type?: string): Observable<AccountSummary[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<AccountSummary[]>(this.baseUrl, { params });
  }

  getAccount(id: number): Observable<AccountDetail> {
    return this.http.get<AccountDetail>(`${this.baseUrl}/${id}`);
  }

  getTransactions(id: number): Observable<AccountTransaction[]> {
    return this.http.get<AccountTransaction[]>(`${this.baseUrl}/${id}/transactions`);
  }

  transfer(
    sourceId: number,
    destinationAccountId: number,
    montant: number,
    motif?: string
  ): Observable<{ message: string; source: AccountDetail; destination: AccountDetail }> {
    return this.http.post<{ message: string; source: AccountDetail; destination: AccountDetail }>(
      `${this.baseUrl}/${sourceId}/transfer`,
      { destinationAccountId, montant, motif }
    );
  }
}
