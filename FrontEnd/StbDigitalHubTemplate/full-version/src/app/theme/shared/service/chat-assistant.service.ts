import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ChatReply {
  reply: string;
  intent: string;
  url?: string | null;
  actionLabel?: string | null;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class ChatAssistantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/chat`;

  welcome(): Observable<ChatReply> {
    return this.http.get<ChatReply>(`${this.baseUrl}/welcome`);
  }

  ask(message: string, previousIntent?: string | null): Observable<ChatReply> {
    return this.http.post<ChatReply>(`${this.baseUrl}/ask`, { message, previousIntent });
  }
}
