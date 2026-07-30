import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ClientProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  telephone: string;
  photoUrl?: string | null;
  statut: string;
  emailConfirmed: boolean;
  dateCreationUtc: string;
  dateDerniereConnexionUtc?: string | null;
}

export interface UpdateClientProfilePayload {
  firstName: string;
  lastName: string;
  telephone: string;
}

@Injectable({ providedIn: 'root' })
export class ClientProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/clients/me`;

  getProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(this.baseUrl);
  }

  updateProfile(payload: UpdateClientProfilePayload): Observable<ClientProfile> {
    return this.http.put<ClientProfile>(this.baseUrl, payload);
  }

  uploadPhoto(file: File): Observable<ClientProfile> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<ClientProfile>(`${this.baseUrl}/photo`, formData);
  }
}
