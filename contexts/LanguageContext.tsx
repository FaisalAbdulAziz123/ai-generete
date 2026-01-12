
import React, { createContext, useContext, useState, useEffect } from 'react';
import { t } from '../services/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  tr: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode, initialLanguage?: string }> = ({ children, initialLanguage = 'en' }) => {
  const [language, setLanguageState] = useState(initialLanguage);

  useEffect(() => {
    setLanguageState(initialLanguage);
  }, [initialLanguage]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const tr = (key: string) => t(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, tr }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
