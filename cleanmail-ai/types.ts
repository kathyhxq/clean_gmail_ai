export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  isImportant: boolean;
  isSpam: boolean;
  isTrash: boolean;
  category: 'primary' | 'social' | 'promotions' | 'updates';
  labels: string[];
}

export type ViewMode = 'inbox' | 'important' | 'sent' | 'trash' | 'spam';

export interface FilterResult {
  gmailSearchQuery: string;
  explanation: string;
  matchedEmailIds: string[];
  reasoning: string;
}

export interface GeminiFilterResponse {
  gmailQuery: string;
  explanation: string;
  localFilterCriteria: {
    senderContains?: string[];
    subjectContains?: string[];
    bodyContains?: string[];
    olderThanDays?: number;
    category?: string;
    isUnread?: boolean;
    excludeImportant?: boolean;
  }
}