import { useButtonActions } from '@/utils/buttonActions';
import getStartedImage from '@/assets/landing/get-started-2.svg';
import { Apple, Play } from 'lucide-react';
import Ellipse from '../ui/ellipse';
import { useTranslation } from 'react-i18next';

const GetStartedSection = () => {
  const { navigateToSignup } = useButtonActions();
  const { t } = useTranslation();

  return (
    <section className="py-16 px-4 relative">
      {/* Ellipse extending beyond section */}
      <Ellipse position="left" color="#6F2BFF" size="lg" blur="lg" opacity={0.3} className="z-0 -left-32 top-1/2 -translate-y-1/2" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Side - Graphic */}
          <div className="flex-1">
            <img 
              src={getStartedImage} 
              alt={t('landing.getStarted.alt')}
              className="w-full max-w-md mx-auto lg:mx-0"
            />
          </div>
          
          {/* Right Side - Text and CTA */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="mb-4 font-inter font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] leading-tight text-center text-white">
              {t('landing.getStarted.titlePart1')}<br />
              <span className="bg-gradient-to-r from-[#FABA33] to-[#4F46E5] bg-clip-text text-transparent">{t('landing.getStarted.titleEmphasis')}</span>
            </h2>
            <p className="mb-8 font-inter font-normal text-base sm:text-lg md:text-xl lg:text-[24px] leading-relaxed text-center text-[#E0E7FF]">
              {t('landing.getStarted.subtitle')}
            </p>
            
            <div className="flex flex-row gap-4 justify-center items-center">
              {/* App Store Button - Official Style */}
              <button 
                onClick={navigateToSignup}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs text-gray-300">{t('landing.store.appStoreTop')}</div>
                  <div className="text-sm font-semibold">{t('landing.store.appStore')}</div>
                </div>
              </button>
              
              {/* Google Play Button - Official Style */}
              <button 
                onClick={navigateToSignup}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Play className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs text-gray-300">{t('landing.store.getItOn')}</div>
                  <div className="text-sm font-semibold">{t('landing.store.googlePlay')}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStartedSection; 