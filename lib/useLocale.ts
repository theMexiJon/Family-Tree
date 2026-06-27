'use client'

import { useEffect, useState } from 'react'
import type { Locale } from './i18n'

/** Reads the lang cookie (set by proxy or LanguageSwitcher) client-side. */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)
    const lang  = match?.[1] ?? localStorage.getItem('lang') ?? 'en'
    setLocale(lang === 'es' ? 'es' : 'en')
  }, [])

  return locale
}
