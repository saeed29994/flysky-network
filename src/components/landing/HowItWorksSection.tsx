import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useButtonActions } from "@/utils/buttonActions";
import aboutCardSvg from "../../assets/landing/about-card.svg";
import HowItWorksSvg1 from "../../assets/landing/how-it-works-1.svg";
import HowItWorksSvg2 from "../../assets/landing/how-it-works-2.svg";
import HowItWorksSvg3 from "../../assets/landing/how-it-works-3.svg";
import ArrowRightIcon from "../../assets/landing/arrow-right.svg";
import PlayIcon from "../../assets/landing/play.svg";
import WalletIcon from "../../assets/landing/wallet.svg";
import Ellipse from "../ui/ellipse";
import { HOW_IT_WORKS_STEPS } from "../../constants/landing";
import { useTranslation } from 'react-i18next';

const HowItWorksSection = () => {
  const { navigateToSignup, navigateToLogin } = useButtonActions();
  const { t } = useTranslation();
  
  const iconMap = {
    'how-it-works-1': HowItWorksSvg1,
    'how-it-works-2': HowItWorksSvg2,
    'how-it-works-3': HowItWorksSvg3,
    'arrow-right': ArrowRightIcon,
    'play': PlayIcon,
    'wallet': WalletIcon
  };

  const handleAction = (action?: string) => {
    switch (action) {
      case 'signup':
        navigateToSignup();
        break;
      case 'login':
      default:
        navigateToLogin();
        break;
    }
  };

  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
      {/* Ellipses extending beyond section - repositioned to avoid visual cuts */}
      <Ellipse position="top" color="#C82BFF" size="lg" blur="lg" opacity={0.2} className="z-0 -top-32 left-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{t('landing.hiw.title')}</h2>
          <p className="text-gray-300 text-base sm:text-lg">{t('landing.hiw.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Connection line for desktop - positioned behind cards */}
          
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div 
              key={index}
              className={cn(
                "relative flex items-center justify-center h-full",
                "h-full z-10"
              )}
            >
              <div className="relative w-full max-w-md mx-auto h-[350px] sm:h-[380px] md:h-[400px]">
                {/* SVG Background Container */}
                <div className="absolute inset-0">
                  <img 
                    src={aboutCardSvg} 
                    alt="Card Background" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Content positioned within SVG */}
                <div className="relative z-10 p-6 sm:p-8 md:p-12 text-center h-full flex flex-col justify-between">
                  <div>
                    {/* Icon SVG */}
                    <div className="mb-4 sm:mb-6">
                      <img src={iconMap[step.iconSvg as keyof typeof iconMap]} alt="How It Works" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="mx-auto text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white uppercase tracking-wide mb-3 sm:mb-4">
                      {t(`landing.hiw.steps.${index + 1}.title`)}
                    </h3>
                    
                    {/* Description */}
                    <p className=" xs:w-[60%] md:w-[80%] lg:w-[100%] mx-auto text-center text-gray-200 text-xs sm:text-sm mb-6 sm:mb-8">
                      {t(`landing.hiw.steps.${index + 1}.desc`)}
                    </p>
                  </div>
                  
                  {/* Button with text and icon */}
                  <div className="flex justify-center">
                    <Button 
                      variant="normal"
                      size="normal"
                      className="w-max flex justify-center items-center h-[40px] gap-[10px] rounded-[24px] pt-[10px] pb-[10px] border border-transparent bg-transparent p-[1px] text-white font-inter relative overflow-hidden text-sm sm:text-base"
                      onClick={() => handleAction((step as any).action)}
                    >
                      <span>{t(`landing.hiw.steps.${index + 1}.cta`)}</span>
                      <span className="pl-1 sm:pl-2">
                        <img src={iconMap[step.btnIcon as keyof typeof iconMap]} alt="Button Icon" className="w-3 h-3 sm:w-4 sm:h-4" />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 