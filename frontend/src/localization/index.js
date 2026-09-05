import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLanguage, setLanguage as saveLanguageToStorage } from '../utils/storage';
import en from './en';
import hi from './hi';

// Mocking the other languages by pointing them to English for now
const translations = {
  en,
  hi,
  bn: en, // Bengali
  gu: en, // Gujarati
  kn: en, // Kannada
  ml: en, // Malayalam
  mr: en, // Marathi
  or: en, // Odia
  pa: en, // Punjabi
  ta: en, // Tamil
  te: en, // Telugu
  as: en, // Assamese
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [languageCode, setLanguageCode] = useState('en');

  useEffect(() => {
    const loadLang = async () => {
      const storedLang = await getLanguage();
      if (storedLang && translations[storedLang]) {
        setLanguageCode(storedLang);
      }
    };
    loadLang();
  }, []);

  const changeLanguage = async (code) => {
    if (translations[code]) {
      setLanguageCode(code);
      await saveLanguageToStorage(code);
    }
  };

  const t = (key) => {
    return translations[languageCode][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t, languageCode, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'or', name: 'Odia' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'as', name: 'Assamese' },
];
