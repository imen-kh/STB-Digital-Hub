import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ChatAssistantService, ChatReply } from 'src/app/theme/shared/service/chat-assistant.service';
import { ChatMessage } from './chat-message';

@Component({
  selector: 'app-chat-assistant',
  imports: [...SHARED_IMPORTS],
  templateUrl: './chat-assistant.component.html',
  styleUrl: './chat-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatAssistantComponent {
  private readonly chat = inject(ChatAssistantService);
  private readonly router = inject(Router);

  @ViewChild('thread') private thread?: ElementRef<HTMLDivElement>;

  open = signal(false);
  sending = signal(false);
  draft = signal('');
  messages = signal<ChatMessage[]>([]);
  private lastIntent: string | null = null;

  toggle(): void {
    this.open.update((v) => !v);
    if (this.open() && this.messages().length === 0) {
      this.loadWelcome();
    }
  }

  send(text?: string): void {
    const message = (text ?? this.draft()).trim();
    if (!message || this.sending()) {
      return;
    }

    this.draft.set('');
    this.messages.update((list) => [...list, { from: 'user', text: message }]);
    this.scrollToEnd();
    this.sending.set(true);

    this.chat
      .ask(message, this.lastIntent)
      .pipe(first())
      .subscribe({
        next: (reply) => {
          this.pushBot(reply);
          this.sending.set(false);
        },
        error: () => {
          this.messages.update((list) => [
            ...list,
            {
              from: 'bot',
              text: "Je n'arrive pas à répondre pour le moment. Réessayez dans un instant.",
              suggestions: ['Quel est mon solde ?', 'Mes cartes', 'Aide']
            }
          ]);
          this.sending.set(false);
          this.scrollToEnd();
        }
      });
  }

  openLink(url?: string | null): void {
    if (!url) {
      return;
    }
    const [path, query] = url.split('?');
    const queryParams: Record<string, string> = {};
    if (query) {
      for (const part of query.split('&')) {
        const [key, value] = part.split('=');
        if (key) {
          queryParams[key] = value || '';
        }
      }
    }
    void this.router.navigate([path], { queryParams: Object.keys(queryParams).length ? queryParams : undefined });
    this.open.set(false);
  }

  private loadWelcome(): void {
    this.chat
      .welcome()
      .pipe(first())
      .subscribe({
        next: (reply) => this.pushBot(reply),
        error: () =>
          this.pushBot({
            reply: 'Bonjour. Je suis STB Assist. Posez une question sur vos comptes, cartes, crédit ou épargne.',
            intent: 'welcome',
            suggestions: ['Quel est mon solde ?', "Où en est mon épargne ?", 'Simuler un crédit', 'Gérer mes cartes']
          })
      });
  }

  private pushBot(reply: ChatReply): void {
    this.lastIntent = reply.intent;
    this.messages.update((list) => [
      ...list,
      {
        from: 'bot',
        text: reply.reply,
        url: reply.url,
        actionLabel: reply.actionLabel,
        suggestions: reply.suggestions
      }
    ]);
    this.scrollToEnd();
  }

  private scrollToEnd(): void {
    setTimeout(() => {
      const el = this.thread?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 40);
  }
}
