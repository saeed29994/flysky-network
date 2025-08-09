import { Button } from '../ui/button';
import { useButtonActions } from '@/utils/buttonActions';
import { cn } from '@/lib/utils';
import Ellipse from '../ui/ellipse';
import { useTranslation } from 'react-i18next';

// Import SVG assets
import miningIcon from '../../assets/landing/mining.svg';
import membershipIcon from '../../assets/landing/membership.svg';
import stakingIcon from '../../assets/landing/staking.svg';
import featureBorderBottom from '../../assets/landing/feature-border-bottom.svg';

interface FeatureItemDef {
  key: 'mining' | 'membership' | 'staking' | 'referral' | 'watchToEarn' | 'playToEarn';
  icon: string;
  size?: 'default' | 'large';
}

const FeaturesSection = () => {
  const { navigateToSignup } = useButtonActions();
  const { t } = useTranslation();

  const iconMap = {
    mining: miningIcon,
    membership: membershipIcon,
    staking: stakingIcon,
    referral: miningIcon, 
    watchToEarn: membershipIcon,
    playToEarn: stakingIcon 
  } as const;

  const features: FeatureItemDef[] = [
    { key: 'mining', icon: iconMap.mining },
    { key: 'membership', icon: iconMap.membership, size: 'large' },
    { key: 'staking', icon: iconMap.staking },
    { key: 'referral', icon: iconMap.referral },
    { key: 'watchToEarn', icon: iconMap.watchToEarn, size: 'large' },
    { key: 'playToEarn', icon: iconMap.playToEarn },
  ];

  return (
    <section id="features" className="py-16 relative">
      {/* Ellipses extending beyond section */}
      <Ellipse position="top-right" color="#4F46E5" size="lg" blur="lg" opacity={0.3} className="z-0 -top-32 -right-32" />
      <Ellipse position="bottom-left" color="#6F2BFF" size="lg" blur="lg" opacity={0.2} className="z-0 -bottom-32 -left-32" />
      
      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="block lg:hidden">{t(['landing.features.titleMobile','features.titleMobile'] as any)}</span>
            <span className="hidden lg:block">{t(['landing.features.titleDesktop','features.titleDesktop'] as any)}</span>
          </h2>
          <p className="text-gray-300 text-base sm:text-lg">{t(['landing.features.subtitle','features.subtitle'] as any)}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:-mb-20">
          {features.map((feature) => (
            <div key={feature.key} className="flex flex-col items-center p-6 backdrop-blur-sm rounded-xl">
              <div className={cn(
                'mb-8 flex items-center justify-center',
                feature.size === 'large' ? 'w-80 h-80' : 'w-64 h-64'
              )}>
                <img src={feature.icon} alt={t([`landing.features.items.${feature.key}.title`, `features.items.${feature.key}.title`] as any)} className="w-full h-full object-contain" />
              </div>
              <h3 className="text-white text-lg sm:text-xl font-bold mb-4">{t([`landing.features.items.${feature.key}.title`, `features.items.${feature.key}.title`] as any)}</h3>
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#FABA33] to-[#4F46E5] mx-auto mb-4"></div>
              <p className="text-gray-300 text-center leading-relaxed text-sm sm:text-base">{t([`landing.features.items.${feature.key}.desc`, `features.items.${feature.key}.desc`] as any)}</p>
            </div>
          ))}
        </div>
        
        {/* Curved Border Section with Centered Button */}
        <div className="relative w-full">
          {/* Curved Border SVG - Only visible on large screens */}
          <div className="hidden lg:block w-full h-32 relative">
            <img 
              src={featureBorderBottom}
              alt={t(['landing.features.alt.border','features.alt.border'] as any)}
              className="absolute bottom-0 left-0 w-full h-full object-cover"
            />
            
            {/* Centered Button positioned at the curve's lowest point - Large screens */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
              <Button 
                variant="gradient"
                size="gradient"
                className="text-white hover:from-[#FABA33]/90 hover:to-[#4F46E5]/90 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={navigateToSignup}
              >
                {t('landing.cta.createEarning')}
              </Button>
            </div>
          </div>
          
          {/* Button for small and medium screens */}
          <div className="lg:hidden text-center mt-12 mb-8">
            <Button 
              variant="gradient"
              size="gradient"
              className="text-white hover:from-[#FABA33]/90 hover:to-[#4F46E5]/90 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={navigateToSignup}
            >
              {t('landing.cta.createEarning')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 