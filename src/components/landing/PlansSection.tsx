import { Button } from '../ui/button';
import checkCircle from '@/assets/landing/check-circle.svg';
import Ellipse from '../ui/ellipse';
import { useTranslation } from 'react-i18next';

const PlansSection = () => {
  const { t } = useTranslation();

  const membershipPlans = [
    {
      key: 'business',
      popular: false
    },
    {
      key: 'first',
      popular: true
    },
    {
      key: 'firstLifetime',
      popular: false
    }
  ] as const;

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <Ellipse position="top-left" color="#C82BFF" size="lg" blur="lg" opacity={0.2} className="z-0" />
      <Ellipse position="bottom-right" color="#4F46E5" size="lg" blur="lg" opacity={0.2} className="z-0" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-inter font-bold text-4xl lg:text-6xl leading-[1.2] text-white mb-6">
            {t(['landing.plans.title','plans.title'] as any)}
          </h2>
          <p className="font-inter font-normal text-lg lg:text-xl leading-[1.6] text-[#A1A1AA] max-w-2xl mx-auto">
            {t(['landing.plans.subtitle','plans.subtitle'] as any)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {membershipPlans.map((plan) => {
            const title = t([`landing.plans.items.${plan.key}.title`, `plans.items.${plan.key}.title`] as any);
            const price = t([`landing.plans.items.${plan.key}.price`, `plans.items.${plan.key}.price`] as any);
            const description = t([`landing.plans.items.${plan.key}.description`, `plans.items.${plan.key}.description`] as any);
            const rawFeatures = t([`landing.plans.items.${plan.key}.features`, `plans.items.${plan.key}.features`] as any, { returnObjects: true }) as unknown;
            const features = Array.isArray(rawFeatures) ? (rawFeatures as string[]) : [];
            const buttonText = t([`landing.plans.items.${plan.key}.buttonText`, `plans.items.${plan.key}.buttonText`] as any);
            const isPopular = plan.key === 'first' ? true : plan.popular;

            return (
              <div 
                key={plan.key} 
                className="plan-card"
              >
                {/* Gradient border overlay */}
                <div className="plan-card-gradient-border"></div>
                
                <div className="plan-card-content flex flex-col">
                  {isPopular && (
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-20">
                      <span className="plan-popular-badge">
                        {t(['landing.plans.mostPopular','plans.mostPopular'] as any)}
                      </span>
                    </div>
                  )}
                  <div className={`p-4 sm:p-6 text-left flex-grow ${isPopular ? 'mt-8' : ''}`}>
                    <h3 className="font-inter font-normal text-lg sm:text-xl md:text-2xl leading-[30px] text-white mb-2">{title}</h3>
                    <div className="font-inter font-normal text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] leading-[1.2] text-white mb-2">
                      <span className="text-base sm:text-lg md:text-xl lg:text-2xl">$</span>{price}
                    </div>
                    <p className="font-inter font-normal text-sm sm:text-base leading-[20px] sm:leading-[24px] text-[#A1A1AA] mb-4 sm:mb-6">
                      {description}
                    </p>
                    <div className="border-b border-gray-600 mb-4 sm:mb-6"></div>
                  </div>
                  
                  <div className="px-4 sm:px-6 pb-4 flex-grow">
                    <ul className="space-y-3 sm:space-y-4">
                      {features?.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-300 text-sm sm:text-base">
                          <img src={checkCircle} alt="check" className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="px-4 sm:px-6 pb-4">
                    <Button 
                      className={`w-full py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
                        isPopular 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                      }`}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FSN Information */}
        <div className="text-center mt-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-4xl mx-auto">
            <h3 className="font-inter font-bold text-2xl lg:text-3xl text-white mb-4">
              {t(['landing.fsnInfo.title','fsnInfo.title'] as any)}
            </h3>
            <p className="font-inter font-normal text-lg text-[#A1A1AA] mb-6">
              {t(['landing.fsnInfo.description','fsnInfo.description'] as any)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h4 className="text-white font-semibold mb-2">{t(['landing.fsnInfo.miningRewards.title','fsnInfo.miningRewards.title'] as any)}</h4>
                <p className="text-[#A1A1AA] text-sm">{t(['landing.fsnInfo.miningRewards.desc','fsnInfo.miningRewards.desc'] as any)}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">🔒</span>
                </div>
                <h4 className="text-white font-semibold mb-2">{t(['landing.fsnInfo.stakingAccess.title','fsnInfo.stakingAccess.title'] as any)}</h4>
                <p className="text-[#A1A1AA] text-sm">{t(['landing.fsnInfo.stakingAccess.desc','fsnInfo.stakingAccess.desc'] as any)}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">👑</span>
                </div>
                <h4 className="text-white font-semibold mb-2">{t(['landing.fsnInfo.premiumFeatures.title','fsnInfo.premiumFeatures.title'] as any)}</h4>
                <p className="text-[#A1A1AA] text-sm">{t(['landing.fsnInfo.premiumFeatures.desc','fsnInfo.premiumFeatures.desc'] as any)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;