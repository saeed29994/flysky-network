export type PlanType = 'business' | 'economy' | 'first' | 'first-lifetime';

export interface Plan {
  createdAt: Date;
  durationDays: number;
  dailyMiningReward: number;
  features: string[];
  name: string;
  price: number;
}

export interface PlansContextType {
  plans: Record<PlanType, Plan>;
  loading: boolean;
  error: string | null;
} 