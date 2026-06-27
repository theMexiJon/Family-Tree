'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('en')
  const router = useRouter()

  useEffect(() => {
    // Read from cookie (set by proxy or previous choice)
    const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)
    const lang  = (match?.[1] ?? localStorage.getItem('lang') ?? 'en') as Locale
    setLocale(lang === 'es' ? 'es' : 'en')
  }, [])

  function toggle() {
    const next: Locale = locale === 'en' ? 'es' : 'en'
    // Persist in both cookie (for server components) and localStorage (for client)
    document.cookie = `lang=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
    localStorage.setItem('lang', next)
    setLocale(next)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      title={locale === 'en' ? 'Cambiar a español' : 'Switch to English'}
      className="rounded-lg border border-[--color-paper-dark] px-2.5 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark] transition-colors"
    >
      {locale === 'en' ? '🇲🇽 ES' : '🇺🇸 EN'}
    </button>
  )
}
