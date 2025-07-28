import { Button } from '../ui/button';
import { useButtonActions, buttonConfigs } from '../../utils/buttonActions';
import heroBanner from '../../assets/landing/hero-banner.svg';
import heroBannerMobile from '../../assets/landing/hero-banner-mobile.svg';
import LandingHeader from './LandingHeader';
import TypingAnimation from '../ui/typing-animation';
import Ellipse from '../ui/ellipse';
import { Apple, Play } from 'lucide-react';

const HeroSection = () => {
    const { navigateToSignup, navigateToLogin } = useButtonActions();

    return (
        <>
            <LandingHeader />
            <section className="relative">
                {/* Mobile/Tablet Layout */}
                <div className="lg:hidden relative">
                    {/* Ellipse extending beyond section */}
                    <Ellipse position="right" color="#6F2BFF" size="lg" blur="lg" opacity={0.3} className="z-0 -right-32 top-1/2 -translate-y-1/2" />
                    
                    <div className="pt-20 pb-10 px-4 relative z-10">
                        {/* Hero Image for Mobile/Tablet */}
                        <div className="flex justify-center mb-0 mt-8 -mb-8">
                            <img
                                src={heroBannerMobile}
                                alt="FlySky Network Hero Banner"
                                className="w-full max-w-md h-auto object-contain relative z-10"
                                loading="lazy"
                            />
                        </div>
                        
                        {/* Text Content for Mobile/Tablet */}
                        <div className="text-center max-w-2xl mx-auto relative z-10">
                            <h2 className="font-inter font-bold text-4xl sm:text-4xl text-white mb-4">
                                FlySky Network
                            </h2>
                            <h1 className="font-bold mb-3">
                                <div className="font-inter font-bold text-3xl sm:text-4xl leading-tight tracking-[0%] bg-gradient-to-r from-[#FABA33] to-[#4F46E5] bg-clip-text text-transparent">
                                    <TypingAnimation 
                                        text="Mine. Earn. Grow." 
                                        speed={150}
                                        className="bg-gradient-to-r from-[#FABA33] to-[#4F46E5] bg-clip-text text-transparent"
                                    />
                                </div>
                            </h1>
                            <p className="text-center text-lg sm:text-xl text-white mb-6 font-inter font-normal leading-relaxed">
                                FlySky is a Web3 platform where users earn crypto through daily mining, staking, referrals, and more.
                            </p>
                            <div className="flex flex-row gap-4 mb-6">
                                <Button
                                    className="flex-1 h-[40px] gap-[10px] rounded-[24px] pt-[10px] pb-[10px] bg-gradient-to-r from-[rgba(250,186,51,0.9)] to-[#4F46E5] shadow-[0px_16px_32px_0px_#00386140] text-white font-inter"
                                    onClick={navigateToSignup}
                                >
                                    Join Now
                                </Button>
                                <Button
                                    className="flex-1 h-[40px] gap-[10px] rounded-[24px] pt-[10px] pb-[10px] border border-transparent bg-transparent p-[1px] text-white font-inter relative overflow-hidden"
                                    onClick={navigateToLogin}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#FABA33] to-[#4F46E5] rounded-[24px]"></div>
                                    <span className="bg-[#110D24] hover:bg-[#1a1242] block rounded-[24px] px-[61px] py-[10px] w-full h-full flex items-center justify-center relative z-10">
                                        Open Dashboard
                                    </span>
                                </Button>
                            </div>
                            
                            {/* Download Buttons for Mobile/Tablet */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                {/* App Store Button */}
                                <button 
                                    onClick={navigateToSignup}
                                    className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto justify-center"
                                >
                                    <Apple className="w-6 h-6" />
                                    <div className="text-center">
                                        <div className="text-xs text-gray-300">Download on the</div>
                                        <div className="text-sm font-semibold">App Store</div>
                                    </div>
                                </button>
                                
                                {/* Google Play Button */}
                                <button 
                                    onClick={navigateToSignup}
                                    className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto justify-center"
                                >
                                    <Play className="w-6 h-6" />
                                    <div className="text-center">
                                        <div className="text-xs text-gray-300">GET IT ON</div>
                                        <div className="text-sm font-semibold">Google Play</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block relative">
                    {/* Ellipse extending beyond section */}
                    <Ellipse position="right" color="#6F2BFF" size="lg" blur="lg" opacity={0.3} className="z-0 -right-32 top-1/2 -translate-y-1/2" />
                    
                    <div
                        className="min-h-screen relative pt-80 pb-16 px-4 flex items-start"
                        style={{
                            backgroundImage: `url(${heroBanner})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center calc(50% + 8rem)',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        <div className="container mx-auto lg:mt-2 relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                {/* Left Side - Text Content and CTA */}
                                <div className="lg:col-span-6 text-center lg:text-left mb-8 lg:mb-0">
                                    <h1 className="font-bold mb-6">
                                        <div className="text-center font-inter font-bold text-[36px] leading-[38.4px] tracking-[0%] bg-gradient-to-r from-[#FABA33] to-[#4F46E5] bg-clip-text text-transparent">
                                            <TypingAnimation 
                                                text="Mine. Earn. Grow." 
                                                speed={100}
                                                className="bg-gradient-to-r from-[#FABA33] to-[#4F46E5] bg-clip-text text-transparent"
                                            />
                                        </div>
                                    </h1>
                                    <p className="w-[80%] text-lg sm:text-xl text-white mb-8 mx-auto font-inter font-normal text-[22px] leading-[133%]">
                                        FlySky is a Web3 platform where users earn crypto through daily mining, staking, referrals, and more.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                                        <Button
                                            {...buttonConfigs.gradient}
                                            className="w-[173px] rounded-full shadow-lg"
                                            onClick={navigateToSignup}
                                        >
                                            Join Now
                                        </Button>
                                        <Button
                                            className="w-[200px] h-[40px] gap-[10px] rounded-[24px] pt-[10px] pr-[61px] pb-[10px] pl-[61px] border border-transparent bg-transparent p-[1px] text-white font-inter relative overflow-hidden"
                                            onClick={navigateToLogin}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#FABA33] to-[#4F46E5] rounded-[24px]"></div>
                                            <span className="bg-[#110D24] hover:bg-[#1a1242] block rounded-[24px] px-[61px] py-[10px] w-full h-full flex items-center justify-center relative z-10">
                                                Open Dashboard
                                            </span>
                                        </Button>
                                    </div>
                                    
                                    {/* Download Buttons for Desktop */}
                                    <div className="flex flex-row gap-4 justify-center">
                                        {/* App Store Button */}
                                        <button 
                                            onClick={navigateToSignup}
                                            className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <Apple className="w-6 h-6" />
                                            <div className="text-left">
                                                <div className="text-xs text-gray-300">Download on the</div>
                                                <div className="text-sm font-semibold">App Store</div>
                                            </div>
                                        </button>
                                        
                                        {/* Google Play Button */}
                                        <button 
                                            onClick={navigateToSignup}
                                            className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <Play className="w-6 h-6" />
                                            <div className="text-left">
                                                <div className="text-xs text-gray-300">GET IT ON</div>
                                                <div className="text-sm font-semibold">Google Play</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HeroSection; 