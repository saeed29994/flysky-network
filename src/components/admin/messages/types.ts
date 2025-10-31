import { Timestamp } from 'firebase/firestore';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userId?: string;
  timestamp: Timestamp;
  status: 'unread' | 'read' | 'replied';
  priority: 'normal' | 'urgent' | 'spam';
}

export type StatusFilter = 'all' | 'unread' | 'read' | 'replied';
export type PriorityFilter = 'all' | 'normal' | 'urgent' | 'spam';
export type DateFilter = 'all' | 'today' | 'week' | 'month';