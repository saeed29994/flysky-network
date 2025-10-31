// 📁 src/components/LanguageSwitcher.tsx

import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex justify-center mt-4">
      <select
        value={i18n.language}
        onChange={handleChange}
        className="px-4 py-2 rounded bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        <option value="en">🇬🇧 English</option>
        <option value="ar">🇸🇦 العربية</option>
        <option value="zh">🇨🇳 中文</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
