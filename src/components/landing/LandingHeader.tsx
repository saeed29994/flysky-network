import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import headerLogo from '../../assets/landing/header-logo.png';
import { useButtonActions, buttonConfigs } from '../../utils/buttonActions';
import { MENU_ITEMS } from '../../constants/landing';
import { scrollToSection, getHeaderClasses, getHeaderInnerClasses } from '../../utils/landingUtils';
import { useScrollEffect } from '../../hooks/useScrollEffect';

const LandingHeader: React.FC = () => {
  const { navigateToSignup } = useButtonActions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrolled = useScrollEffect();

  const handleScrollToSection = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <div className={getHeaderClasses(scrolled)}>
      <header className={getHeaderInnerClasses()}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
            <img
              src={headerLogo}
              alt="FlySky Network Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
            />
            <span className="text-white font-bold text-base sm:text-lg">FlySky Network</span>
          </div>

          <div className="flex items-center">
            {/* Desktop Navigation - Show on large tablets and desktop */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 mr-6">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleScrollToSection(item.id)}
                  className="text-[#FFFFFFB5] hover:text-white text-sm font-semibold transition-all duration-200 relative group pb-1 cursor-pointer"
                >
                  {item.label}
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#FABA33] to-[#4F46E5] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                </button>
              ))}
            </nav>

            {/* Get Started Button - Show on tablets and desktop */}
            <Button
              {...buttonConfigs.gradient}
              onClick={navigateToSignup}
              className="hidden md:flex"
            >
              Get Started
            </Button>

            {/* Mobile/Tablet Menu Button - Show on mobile and tablet */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden ml-4 text-white p-1 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile/Tablet Menu Slide-in */}
      <div 
        className={`fixed top-0 right-0 w-[70%] max-w-[350px] h-full bg-[#462674] bg-opacity-95 backdrop-blur-md z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } p-6 pt-20 flex flex-col`}
      >
        <button 
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-5 right-5 text-white"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>

        <nav className="flex flex-col space-y-6 items-start pl-4">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScrollToSection(item.id)}
              className="text-white text-lg font-medium transition-all duration-200 hover:text-yellow-400 text-left"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <Button
            {...buttonConfigs.gradient}
            onClick={() => {
              navigateToSignup();
              setIsMenuOpen(false);
            }}
            className="w-full"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingHeader; 