'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, getTranslation, TranslationKey, supportedLanguages } from './i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: Record<string, string>) => string
  supportedLanguages: typeof supportedLanguages
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      // Load language preference from localStorage
      const savedLanguage = localStorage.getItem('galpin-language') as Language
      if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
        setLanguageState(savedLanguage)
      } else {
        // Detect browser language
        const browserLanguage = navigator.language.split('-')[0] as Language
        if (supportedLanguages.some(lang => lang.code === browserLanguage)) {
          setLanguageState(browserLanguage)
        }
      }
    }
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('galpin-language', newLanguage)
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string>) => {
    return getTranslation(key, language, params)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div>{children}</div>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Fallback for SSR
    return { 
      language: 'en' as Language, 
      setLanguage: () => {}, 
      t: (key: TranslationKey) => key,
      supportedLanguages 
    }
  }
  return context
}