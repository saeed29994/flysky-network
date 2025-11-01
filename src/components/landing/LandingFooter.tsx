import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Twitter, MessageCircle, MessageSquare } from 'lucide-react';
import headerLogo from '../../assets/landing/header-logo.png';
import { SOCIAL_LINKS, FOOTER_LINKS } from '../../constants/landing';
import { handleExternalLink, scrollToTop, scrollToContact } from '../../utils/landingUtils';
import { useTranslation } from 'react-i18next';

interface FooterLink {
  name: string;
  href: string;
  isExternal?: boolean;
  action?: 'navigate' | 'scroll-top' | 'scroll-contact';
}

// Utility function
const handleFooterLinkClick = (link: FooterLink) => {
  switch (link.action) {
    case 'scroll-top':
      scrollToTop();
      break;
    case 'scroll-contact':
      scrollToContact();
      break;
    default:
      // Default behavior - let React Router handle navigation
      break;
  }
};

// Components
const LogoSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start space-y-2 text-left">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <img
          src={headerLogo}
          alt="FlySky Network Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
        />
        <span className="text-white font-bold text-base sm:text-lg">{t('landing.hero.brand')}</span>
      </div>
      <p className="text-sm bg-gradient-to-r from-[#FABA33] to-[#4F46E5] bg-clip-text text-transparent">
        {t('landing.footer.tagline')}
      </p>
    </div>
  );
};

const NavigationSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start sm:items-end space-y-4">
      <nav className="flex flex-wrap justify-start sm:justify-end gap-4 sm:gap-6">
        {FOOTER_LINKS.map((link) => (
          link.action ? (
            <button
              key={link.name}
              onClick={() => handleFooterLinkClick(link)}
              className="text-white hover:text-[#FABA33] transition-colors text-sm font-medium"
            >
              {t(`landing.footer.links.${link.name.toLowerCase()}`)}
            </button>
          ) : (
            <Link
              key={link.name}
              to={link.href}
              className="text-white hover:text-[#FABA33] transition-colors text-sm font-medium"
            >
              {t(`landing.footer.links.${link.name.toLowerCase()}`)}
            </Link>
          )
        ))}
        <button className="flex items-center space-x-2 text-white cursor-pointer hover:text-[#FABA33] transition-colors">
          <span className="text-sm font-medium">{t('landing.footer.language')}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

const SocialIcons: React.FC = () => {
  const iconMap = {
    Twitter,
    MessageCircle,
    MessageSquare
  };

  return (
    <div className="flex justify-start sm:justify-end space-x-3">
      {SOCIAL_LINKS.map((social) => {
        const IconComponent = iconMap[social.icon as keyof typeof iconMap];
        return (
          <button
            key={social.name}
            onClick={() => handleExternalLink(social.href)}
            aria-label={social.ariaLabel}
            className="w-10 h-10 bg-[#110D24] border border-[#2E1A4A]/30 rounded-lg flex items-center justify-center hover:bg-[#1a1242] transition-colors cursor-pointer"
          >
            <IconComponent className="w-5 h-5 text-white" />
          </button>
        );
      })}
    </div>
  );
};

const CopyrightSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="border-t border-gray-500/40 mt-8 pt-8">
      <p className="text-white text-center text-sm">
        © {new Date().getFullYear()} {t('landing.hero.brand')}. {t('landing.footer.rights')}
      </p>
    </div>
  );
};

// Main Component
const LandingFooter: React.FC = () => {
  return (
    <footer className="relative py-12 px-4 w-full">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#110D24]/20" />
      
      <div className="w-full px-4 sm:px-6 lg:px-10 relative z-10">
        {/* Main footer content */}
        <div className="bg-[#462674] bg-opacity-70 backdrop-blur-md border border-[#2E1A4A]/30 rounded-3xl p-6 sm:p-8 w-full">
          <div className="flex flex-col space-y-8 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start">
            <LogoSection />
            
            <div className="flex flex-col items-start sm:items-end space-y-4">
              <NavigationSection />
              <SocialIcons />
            </div>
          </div>
          
          <CopyrightSection />
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter; 