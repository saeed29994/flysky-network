import { Button } from '../ui/button';
import whoWeAreSvg from '../../assets/landing/who-we-are.svg';
import Ellipse from '../ui/ellipse';

const WhoWeAreSection = () => {
  return (
    <section id="who-we-are" className="py-16 px-4 relative">
      {/* Ellipse extending beyond section */}
      <Ellipse position="right" color="#6F2BFF" size="lg" blur="lg" opacity={0.3} className="z-0 -right-32 top-1/2 -translate-y-1/2" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[500px] lg:min-h-[600px]">
          {/* Left Section - Illustration */}
          <div className="flex items-center justify-center h-full order-1 lg:order-1">
            <div className="relative w-full max-w-lg mx-auto">
              <img 
                src={whoWeAreSvg} 
                alt="Who We Are Illustration" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Right Section - Text Content and Button */}
          <div className="text-center lg:text-left flex flex-col justify-center h-full order-2 lg:order-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 lg:mb-8 uppercase tracking-wide">
              WHO WE ARE
            </h2>
            <div className="space-y-4 lg:space-y-6">
              <p className="text-white text-base sm:text-lg lg:text-xl leading-relaxed">
                FlySky Network is a next-generation digital economy platform that combines mining, staking, gaming, and NFTs into one seamless experience.
              </p>
              <p className="text-white text-base sm:text-lg lg:text-xl leading-relaxed">
                We are committed to building a vibrant ecosystem where users can earn, trade, and grow their assets through engaging interactions.
              </p>
            </div>
            <div className="mt-8">
              <Button 
                className="px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-[#FABA33] to-[#4F46E5] hover:from-[#FABA33]/90 hover:to-[#4F46E5]/90 transition-all duration-300 transform hover:scale-105"
              >
                Read More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoWeAreSection; 