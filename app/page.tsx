import { getSessionUser, getUserDisplayName } from '@/lib/supabase/session'
import { getLocale, t } from '@/lib/i18n'
import TimezoneSelect from './components/TimezoneSelect'
import SubmitButton from './components/SubmitButton'
import { createCalendar } from './actions'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [user, locale] = await Promise.all([getSessionUser(), getLocale()])

  const INPUT = 'rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 text-6xl">🌳</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-[--color-ink]">
            {t('appTitle', locale)}
          </h1>
          <p className="mt-4 text-[--color-ink-muted]">{t('appSubtitle', locale)}</p>

          <div className="mt-10 flex flex-col gap-3">
            <a href="/login?next=/"
              className="flex w-full items-center justify-center rounded-xl bg-[--color-accent] px-6 py-3.5 text-base font-semibold text-white hover:opacity-90">
              {t('getStarted', locale)}
            </a>
            <p className="text-xs text-[--color-ink-faint]">{t('noPasswordShort', locale)}</p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '🔗', label: t('feature_share', locale), desc: t('feature_shareDesc', locale) },
              { icon: '📅', label: t('feature_calendar', locale), desc: t('feature_calendarDesc', locale) },
              { icon: '🔒', label: t('feature_manage', locale), desc: t('feature_manageDesc', locale) },
            ].map(f => (
              <div key={f.label} className="rounded-xl border border-[--color-paper-dark] bg-[--color-surface] p-4">
                <div className="text-2xl">{f.icon}</div>
                <p className="mt-2 text-xs font-semibold text-[--color-ink]">{f.label}</p>
                <p className="mt-0.5 text-xs text-[--color-ink-muted]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const userName = getUserDisplayName(user)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl font-semibold tracking-tight text-[--color-ink]">
            {t('appTitle', locale)}
          </h1>
          <p className="mt-3 text-[--color-ink-muted]">{t('appSubtitle', locale)}</p>
          {userName && (
            <p className="mt-2 text-sm text-[--color-ink-faint]">
              {t('signingAs', locale)} <span className="font-medium text-[--color-ink-muted]">{userName}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-8 shadow-sm">
          <h2 className="font-display text-xl font-medium text-[--color-ink]">{t('createTitle', locale)}</h2>
          <p className="mt-1 text-sm text-[--color-ink-muted]">{t('createSubtitle', locale)}</p>

          <form action={createCalendar} className="mt-6 flex flex-col gap-5">
            <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-[--color-ink]">
                {t('familyName', locale)}
              </label>
              <input id="name" name="name" type="text" required maxLength={80}
                placeholder={t('familyNamePlaceholder', locale)}
                className={INPUT} />
            </div>

            <TimezoneSelect />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[--color-ink]">{t('hemisphere', locale)}</span>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
                  <input type="radio" name="hemisphere" value="north" defaultChecked className="accent-[--color-accent]" />
                  {t('northern', locale)}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
                  <input type="radio" name="hemisphere" value="south" className="accent-[--color-accent]" />
                  {t('southern', locale)}
                </label>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="show_memorial" className="mt-0.5 accent-[--color-accent]" />
              <span className="text-sm text-[--color-ink]">
                {t('showMemorial', locale)}
                <span className="block text-xs text-[--color-ink-muted]">{t('showMemorialDesc', locale)}</span>
              </span>
            </label>

            <SubmitButton label={t('createButton', locale)} />
          </form>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[--color-ink-faint]">
          <a href="/dashboard" className="hover:text-[--color-ink-muted]">{t('myCalendarsLink', locale)}</a>
          <a href="/login" className="hover:text-[--color-ink-muted]">{t('switchAccount', locale)}</a>
        </div>
      </div>
    </main>
  )
}
