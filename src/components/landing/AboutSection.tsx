import { Button } from '../ui/button';
import aboutCardSvg from '../../assets/landing/about-card.svg';
import fsnLogoAbout from '../../assets/landing/fsn-logo-about.svg';
import linesAboutBg from '../../assets/landing/lines-about-bg.svg';
import Ellipse from '../ui/ellipse';
import { useTranslation } from 'react-i18next';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-10 px-4 relative">
      {/* Background SVG for larger screens only */}
      <div className="hidden lg:block absolute inset-0 z-0">
        <img 
          src={linesAboutBg} 
          alt="Background Lines" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Ellipse extending beyond section */}
      <Ellipse position="left" color="#C82BFF" size="lg" blur="lg" opacity={0.3} className="z-0 -left-32 top-1/2 -translate-y-1/2" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[400px] lg:min-h-[500px] space-y-8 lg:space-y-0">
          {/* Left Side - Smart Contract Card with SVG Container */}
          <div className="relative flex items-center justify-center h-full order-1 lg:order-1">
            <div className="relative w-full max-w-sm mx-auto">
              {/* SVG Background Container */}
              <div className="absolute inset-0">
                <img 
                  src={aboutCardSvg} 
                  alt="Card Background" 
                  className="w-full h-auto"
                />
              </div>
              
              {/* Content positioned within SVG */}
              <div className="relative z-10 p-10 text-center">
                <div className="mb-6">
                  <h3 className="text-[14px] sm:text-[17.98px] font-semibold text-white uppercase leading-[100%] tracking-[0%] font-inter mb-2">{t(['landing.about.smartContract','about.smartContract'] as any)}</h3>
                  <p className="text-white text-sm sm:text-base"><span className="italic text-gray-400 text-sm sm:text-base">{t(['landing.about.from','about.from'] as any)}</span> {t('landing.hero.brand')}</p>
                </div>
                
                <div className="w-40 h-48 mx-auto mb-6 flex items-center justify-center">
                  <img 
                    src={fsnLogoAbout} 
                    alt="FSN Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <Button 
                  variant="normal" 
                  className="w-auto h-[40px] gap-[10px] rounded-[24px] pt-[10px] pb-[10px] border border-transparent bg-transparent p-[1px] text-white font-inter relative overflow-hidden text-sm sm:text-base"
                >
                  {t('landing.cta.tryForFree')}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side - About Text */}
          <div className="text-center lg:text-left flex flex-col justify-center h-full order-2 lg:order-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 lg:mb-8">{t(['landing.about.title','about.title'] as any)}</h2>
            <div className="space-y-4 lg:space-y-6">
              <p className="text-gray-200 text-sm sm:text-base lg:text-[22px]">
                {t(['landing.about.p1','about.p1'] as any)}
              </p>
              <p className="text-gray-200 text-sm sm:text-base lg:text-[22px]">
                {t(['landing.about.p2','about.p2'] as any)}
              </p>
              <div className="mt-4">
                <span className="bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent text-sm sm:text-base lg:text-xl font-semibold mb-2">{t(['landing.about.scLabel','about.scLabel'] as any)}</span>
                <span className="text-gray-200 text-sm sm:text-base lg:text-xl font-semibold">{t(['landing.about.scDesc','about.scDesc'] as any)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection; 