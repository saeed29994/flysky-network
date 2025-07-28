// src/pages/LandingPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import {
  LandingHeader,
  HeroSection,
  AboutSection,
  WhoWeAreSection,
  FeaturesSection,
  PlansSection,
  HowItWorksSection,
  GetStartedSection,
  LandingFooter
} from '../components/landing';
import Ellipse from '../components/ui/ellipse';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-landing-gradient relative overflow-hidden">
      {/* Large overlapping ellipses for continuous flow */}
      <Ellipse position="top-left" color="#6F2BFF" size="lg" blur="lg" opacity={0.2} className="z-0 -top-32 -left-32" />
      <Ellipse position="top-right" color="#6F2BFF" size="lg" blur="lg" opacity={0.15} className="z-0 -top-32 -right-32" />
      <Ellipse position="bottom-left" color="#C82BFF" size="lg" blur="lg" opacity={0.2} className="z-0 -bottom-32 -left-32" />
      <Ellipse position="bottom-right" color="#C82BFF" size="lg" blur="lg" opacity={0.15} className="z-0 -bottom-32 -right-32" />
      
      {/* Additional ellipses for middle sections */}
      <Ellipse position="top" color="#6F2BFF" size="lg" blur="lg" opacity={0.1} className="z-0 top-1/3 left-1/2 -translate-x-1/2" />
      <Ellipse position="bottom" color="#C82BFF" size="lg" blur="lg" opacity={0.1} className="z-0 bottom-1/3 left-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <PlansSection />
        <WhoWeAreSection />
        <HowItWorksSection />
        <GetStartedSection />
        <LandingFooter />
      </div>
    </div>
  );
};

export default LandingPage;
