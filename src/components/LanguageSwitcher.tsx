// 📁 src/components/LanguageSwitcher.tsx

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface LanguageSwitcherProps {
  variant?: 'desktop' | 'mobile';
}

const LanguageSwitcher = ({ variant = 'desktop' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isRTL = i18n.language === 'ar';

  const handleLanguageChange = async (languageCode: string) => {
    // Change the language in i18n
    i18n.changeLanguage(languageCode);
    setIsOpen(false);

    // Update the user's language preference in Firestore
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { language: languageCode });
      }
    } catch (error) {
      console.error('Error updating user language preference:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'mobile') {
      return (
    <div className="relative z-[100001]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentLanguage.flag}</span>
            <span className="text-sm font-semibold">{currentLanguage.name}</span>
          </div>
          <ChevronDown size={16} className={`transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-[#1a1242] backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl z-[99999] overflow-hidden">
            <div className="py-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-300 ${
                    i18n.language === language.code 
                      ? 'bg-gradient-to-r from-[#FABA33]/15 to-[#4F46E5]/15 text-[#FABA33] border-r-2 border-[#FABA33]' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{language.flag}</span>
                    <span className="text-sm font-medium">{language.name}</span>
                  </div>
                  {i18n.language === language.code && (
                    <div className="ml-auto w-2 h-2 bg-gradient-to-r from-[#FABA33] to-[#4F46E5] rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

      return (
      <div className="relative z-[100001]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-white hover:text-[#FABA33] transition-all duration-200 rounded-lg hover:bg-white/5 backdrop-blur-sm"
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:block">{currentLanguage.name}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-48 bg-[#462674] backdrop-blur-xl border border-white/40 rounded-xl shadow-2xl z-[99999] ${isRTL ? 'left-0' : 'right-0'}`}>
          <div className="py-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 ${
                  i18n.language === language.code 
                    ? 'bg-gradient-to-r from-[#FABA33]/20 to-[#4F46E5]/20 text-[#FABA33]' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
                {i18n.language === language.code && (
                  <div className="ml-auto w-2 h-2 bg-gradient-to-r from-[#FABA33] to-[#4F46E5] rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
