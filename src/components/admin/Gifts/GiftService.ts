// 📁 src/components/admin/Gifts/GiftService.ts

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { GiftDistribution, GiftStats } from './types';

class GiftService {
  /**
   * Send gifts to users using secure cloud function
   */
  static async sendGifts(formData: any, adminUid: string): Promise<any> {
    try {
      // Call secure cloud function
      const distributeGiftsFunction = httpsCallable(functions, 'distributeGifts');

      const result = await distributeGiftsFunction({
        title: formData.title,
        message: formData.message,
        amount: formData.amount,
        reason: formData.reason,
        targetType: formData.targetType,
        userIds: formData.userIds,
        planName: formData.planName,
        createdBy: adminUid
      });

      return result.data;
    } catch (error: any) {
      console.error('Error sending gifts:', error);

      // Handle Firebase function errors
      if (error.code) {
        throw new Error(error.message || 'Failed to distribute gifts');
      }

      throw error;
    }
  }

  /**
   * Grant welcome bonus using secure cloud function
   */
  static async grantWelcomeBonus(userId: string, amount: number = 100, reason: string = 'New user welcome bonus'): Promise<any> {
    try {
      const grantWelcomeBonusFunction = httpsCallable(functions, 'grantWelcomeBonus');

      const result = await grantWelcomeBonusFunction({
        userId,
        amount,
        reason
      });

      return result.data;
    } catch (error: any) {
      console.error('Error granting welcome bonus:', error);

      // Handle Firebase function errors
      if (error.code) {
        throw new Error(error.message || 'Failed to grant welcome bonus');
      }

      throw error;
    }
  }

  /**
   * Get gift history
   */
  static async getGiftHistory(limitCount: number = 100): Promise<GiftDistribution[]> {
    try {
      const q = query(
        collection(db, 'giftDistributions'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GiftDistribution[];
    } catch (error) {
      console.error('Error fetching gift history:', error);
      return [];
    }
  }

  /**
   * Get gift statistics
   */
  static async getGiftStats(): Promise<GiftStats> {
    try {
      const snapshot = await getDocs(collection(db, 'giftDistributions'));
      const gifts = snapshot.docs.map(doc => doc.data()) as GiftDistribution[];

      const totalGiftsSent = gifts.length;
      const totalAmountDistributed = gifts.reduce((sum, gift) => sum + (gift.totalAmountDistributed || 0), 0);
      const totalRecipients = gifts.reduce((sum, gift) => sum + (gift.totalRecipients || 0), 0);
      const averageGiftAmount = totalRecipients > 0 ? totalAmountDistributed / totalRecipients : 0;
      const successRate = totalGiftsSent > 0 ? (gifts.filter(g => g.status === 'completed').length / totalGiftsSent) * 100 : 0;

      return {
        totalGiftsSent,
        totalAmountDistributed,
        totalRecipients,
        averageGiftAmount,
        successRate,
        recentGifts: gifts.slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching gift stats:', error);
      return {
        totalGiftsSent: 0,
        totalAmountDistributed: 0,
        totalRecipients: 0,
        averageGiftAmount: 0,
        successRate: 0,
        recentGifts: []
      };
    }
  }
}

export default GiftService;