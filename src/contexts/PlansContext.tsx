import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Plan, PlanType, PlansContextType } from '../types/plans';

const PlansContext = createContext<PlansContextType | null>(null);

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (!context) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
};

export const PlansProvider = ({ children }: { children: ReactNode }) => {
  const [plans, setPlans] = useState<Record<PlanType, Plan>>({} as Record<PlanType, Plan>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const plansRef = collection(db, 'plans');
        const snapshot = await getDocs(plansRef);
        
        const plansData: Record<PlanType, Plan> = {} as Record<PlanType, Plan>;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          plansData[doc.id as PlanType] = {
            createdAt: data.createdAt.toDate(),
            durationDays: data.durationDays,
            features: data.features,
            name: data.name,
            price: data.price
          };
        });

        setPlans(plansData);
        setError(null);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <PlansContext.Provider value={{ plans, loading, error }}>
      {children}
    </PlansContext.Provider>
  );
}; 