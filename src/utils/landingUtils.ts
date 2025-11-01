// Landing page utility functions

export const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    // Get header height - header has h-16 sm:h-18 md:h-20 (64px, 72px, 80px)
    // Plus padding top: pt-3 sm:pt-5 md:pt-7 (12px, 20px, 28px)
    // Total offset needed: ~100px for desktop, ~90px for tablet, ~80px for mobile
    const headerOffset = window.innerWidth >= 768 ? 100 : window.innerWidth >= 640 ? 90 : 80;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const scrollToContact = () => {
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    // Use the same offset logic as scrollToSection
    const headerOffset = window.innerWidth >= 768 ? 100 : window.innerWidth >= 640 ? 90 : 80;
    
    const elementPosition = contactSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } else {
    scrollToTop();
  }
};

export const handleExternalLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const getScrollThreshold = () => {
  return window.scrollY > 10;
};

// CSS class utilities
export const getHeaderClasses = (scrolled: boolean) => {
  const baseClasses = "fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-5 md:pt-7 flex justify-center px-4 sm:px-8 md:px-16 bg-header-gradient transition-all duration-300";
  return `${baseClasses} ${scrolled ? 'shadow-lg' : ''}`;
};

export const getHeaderInnerClasses = () => {
  return "w-full h-16 sm:h-18 md:h-20 rounded-full px-6 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 bg-[#462674] bg-opacity-70 backdrop-blur-md border border-[#2E1A4A]/30 transition-all duration-300";
};

// Icon mapping utility
export const getIconPath = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    'mining': '/src/assets/landing/mining.svg',
    'membership': '/src/assets/landing/membership.svg',
    'staking': '/src/assets/landing/staking.svg',
    'referral': '/src/assets/landing/mining.svg', // Using same icon for now
    'watchToEarn': '/src/assets/landing/membership.svg', // Using same icon for now
    'playToEarn': '/src/assets/landing/staking.svg', // Using same icon for now
    'how-it-works-1': '/src/assets/landing/how-it-works-1.svg',
    'how-it-works-2': '/src/assets/landing/how-it-works-2.svg',
    'how-it-works-3': '/src/assets/landing/how-it-works-3.svg',
    'arrow-right': '/src/assets/landing/arrow-right.svg',
    'play': '/src/assets/landing/play.svg',
    'wallet': '/src/assets/landing/wallet.svg',
  };
  
  return iconMap[iconName] || '';
}; 