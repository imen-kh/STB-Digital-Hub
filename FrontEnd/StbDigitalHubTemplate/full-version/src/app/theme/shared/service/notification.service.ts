import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AppNotification {
  id: number;
  titre: string;
  message: string;
  type: 'Info' | 'Alerte' | string;
  lue: boolean;
  dateCreation: string;
  idCarte?: number | null;
  idTransaction?: number | null;
}

export interface NotificationsResponse {
  nonLues: number;
  items: AppNotification[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  private readonly itemsSignal = signal<AppNotification[]>([]);
  private readonly unreadSignal = signal(0);

  readonly items = this.itemsSignal.asReadonly();
  readonly unreadCount = this.unreadSignal.asReadonly();
  readonly hasUnread = computed(() => this.unreadSignal() > 0);

  load(): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(this.baseUrl).pipe(
      tap((res) => {
        this.itemsSignal.set(res.items);
        this.unreadSignal.set(res.nonLues);
      })
    );
  }

  markAsRead(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.itemsSignal.update((list) =>
          list.map((n) => (n.id === id ? { ...n, lue: true } : n))
        );
        this.unreadSignal.update((c) => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/read-all`, {}).pipe(
      tap(() => {
        this.itemsSignal.update((list) => list.map((n) => ({ ...n, lue: true })));
        this.unreadSignal.set(0);
      })
    );
  }
}
