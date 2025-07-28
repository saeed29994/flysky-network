import { useNavigate } from 'react-router-dom';

// Reusable button actions
export const useButtonActions = () => {
  const navigate = useNavigate();

  const navigateToSignup = () => navigate('/signup');
  const navigateToLogin = () => navigate('/login');
  const navigateToDashboard = () => navigate('/dashboard');
  const navigateToMining = () => navigate('/mining');
  const navigateToStaking = () => navigate('/staking');
  const navigateToWallet = () => navigate('/wallet');
  const navigateToReferral = () => navigate('/referral-program');
  const navigateToMembership = () => navigate('/membership');

  return {
    navigateToSignup,
    navigateToLogin,
    navigateToDashboard,
    navigateToMining,
    navigateToStaking,
    navigateToWallet,
    navigateToReferral,
    navigateToMembership,
  };
};

// Common button configurations
export const buttonConfigs = {
  gradient: {
    variant: 'gradient' as const,
    size: 'gradient' as const,
  },
  normal: {
    variant: 'normal' as const,
    size: 'normal' as const,
  },
  default: {
    variant: 'default' as const,
    size: 'default' as const,
  },
  outline: {
    variant: 'outline' as const,
    size: 'default' as const,
  },
}; 