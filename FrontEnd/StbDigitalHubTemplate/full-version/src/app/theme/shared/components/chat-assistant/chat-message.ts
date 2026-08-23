export interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
  url?: string | null;
  actionLabel?: string | null;
  suggestions?: string[];
}
