import { Button } from '../ui/button';
import checkCircle from '@/assets/landing/check-circle.svg';
import Ellipse from '../ui/ellipse';

const PlansSection = () => {
  const membershipPlans = [
    {
      title: "Business Class",
      price: "9.99",
      description: "All business class features to boost your FSN rewards with FlySky Network",
      features: ["Bonus 100,000 FSN", "Advanced mining", "Priority support", "Staking access"],
      popular: false,
      buttonText: "Choose Business Class"
    },
    {
      title: "First Class",
      price: "49.99",
      description: "All first class features to boost your FSN rewards with FlySky Network",
      features: ["Bonus 500,000 FSN", "All business features", "Faster mining", "Event access"],
      popular: true,
      buttonText: "Choose First Class"
    },
    {
      title: "First class (Lifetime)",
      price: "99.99",
      description: "All first class (lifetime) features to boost your FSN rewards with FlySky Network",
      features: ["Bonus 1,000,000 FSN", "Highest mining", "Lifetime access", "Access to premium features"],
      popular: false,
      buttonText: "Choose First-Lifetime"
    }
  ];

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <Ellipse position="top-left" color="#C82BFF" size="lg" blur="lg" opacity={0.2} className="z-0" />
      <Ellipse position="bottom-right" color="#4F46E5" size="lg" blur="lg" opacity={0.2} className="z-0" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-inter font-bold text-4xl lg:text-6xl leading-[1.2] text-white mb-6">
            Choose Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> Plan</span>
          </h2>
          <p className="font-inter font-normal text-lg lg:text-xl leading-[1.6] text-[#A1A1AA] max-w-2xl mx-auto">
            Unlock premium features and earn FSN rewards with our membership plans. 
            FSN tokens are virtual in-app currency for enhanced features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {membershipPlans.map((plan, index) => (
            <div 
              key={index} 
              className="plan-card"
            >
              {/* Gradient border overlay */}
              <div className="plan-card-gradient-border"></div>
              
              <div className="plan-card-content flex flex-col">
                {plan.popular && (
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="plan-popular-badge">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className={`p-4 sm:p-6 text-left flex-grow ${plan.popular ? 'mt-8' : ''}`}>
                  <h3 className="font-inter font-normal text-lg sm:text-xl md:text-2xl leading-[30px] text-white mb-2">{plan.title}</h3>
                  <div className="font-inter font-normal text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] leading-[1.2] text-white mb-2">
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl">$</span>{plan.price}
                  </div>
                  <p className="font-inter font-normal text-sm sm:text-base leading-[20px] sm:leading-[24px] text-[#A1A1AA] mb-4 sm:mb-6">
                    {plan.description}
                  </p>
                  <div className="border-b border-gray-600 mb-4 sm:mb-6"></div>
                </div>
                
                <div className="px-4 sm:px-6 pb-4 flex-grow">
                  <ul className="space-y-3 sm:space-y-4">
                    {plan.features.map((feature, featureIndex) => (
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
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FSN Information */}
        <div className="text-center mt-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-4xl mx-auto">
            <h3 className="font-inter font-bold text-2xl lg:text-3xl text-white mb-4">
              About FSN Tokens
            </h3>
            <p className="font-inter font-normal text-lg text-[#A1A1AA] mb-6">
              FSN tokens are virtual in-app currency that can only be used within the app for features like Mining, Staking, and Upgrades. 
              They cannot be withdrawn, sold, or traded externally.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Mining Rewards</h4>
                <p className="text-[#A1A1AA] text-sm">Use FSN for faster mining and higher rewards</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">🔒</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Staking Access</h4>
                <p className="text-[#A1A1AA] text-sm">Stake FSN to earn additional rewards</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">👑</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Premium Features</h4>
                <p className="text-[#A1A1AA] text-sm">Unlock exclusive features and bonuses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;