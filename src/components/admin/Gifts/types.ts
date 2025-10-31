// 📁 src/components/admin/Gifts/types.ts

export interface GiftTarget {
  type: 'all' | 'single' | 'multiple' | 'plan' | 'custom';
  userIds?: string[];
  planName?: string;
  customCriteria?: {
    minBalance?: number;
    maxBalance?: number;
    kycStatus?: string;
    createdAfter?: Date;
    createdBefore?: Date;
  };
}

export interface GiftDistribution {
  id: string;
  title: string;
  message: string;
  amount: number;
  reason: string;
  target: GiftTarget;
  createdBy: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  totalAmountDistributed: number;
  logs: GiftLog[];
}

export interface GiftLog {
  id: string;
  giftId: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'success' | 'failed';
  error?: string;
  timestamp: Date;
  claimedAt?: Date;
  claimed: boolean;
}

export interface GiftFormData {
  title: string;
  message: string;
  amount: number;
  reason: string;
  targetType: GiftTarget['type'];
  userIds?: string[];
  planName?: string;
  customCriteria?: GiftTarget['customCriteria'];
}

export interface GiftStats {
  totalGiftsSent: number;
  totalAmountDistributed: number;
  totalRecipients: number;
  averageGiftAmount: number;
  successRate: number;
  recentGifts: GiftDistribution[];
}