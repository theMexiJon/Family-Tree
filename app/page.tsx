import { getSessionUser, getUserDisplayName } from '@/lib/supabase/session'
import TimezoneSelect from './components/TimezoneSelect'
import SubmitButton from './components/SubmitButton'
import { createCalendar } from './actions'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getSessionUser()

  if (!user) {
    // Not signed in — show landing / sign-in prompt
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 text-6xl">🌳</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-[--color-ink]">
            Family Calendar
          </h1>
          <p className="mt-4 text-[--color-ink-muted]">
            Build your family tree — birthdays and anniversaries fill the calendar automatically.
            Share with family and let everyone contribute.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <a
              href="/login?next=/"
              className="flex w-full items-center justify-center rounded-xl bg-[--color-accent] px-6 py-3.5 text-base font-semibold text-white hover:opacity-90"
            >
              Sign in to get started
            </a>
            <p className="text-xs text-[--color-ink-faint]">
              No password needed — magic link or Google
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '🔗', label: 'Share a link', desc: 'Family adds themselves' },
              { icon: '📅', label: 'Auto calendar', desc: 'Birthdays & anniversaries' },
              { icon: '🔒', label: 'You manage it', desc: 'Private owner link' },
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
            Family Calendar
          </h1>
          <p className="mt-3 text-[--color-ink-muted]">
            Build your family tree — birthdays and anniversaries fill the calendar automatically.
          </p>
          {userName && (
            <p className="mt-2 text-sm text-[--color-ink-faint]">
              Signed in as <span className="font-medium text-[--color-ink-muted]">{userName}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-8 shadow-sm">
          <h2 className="font-display text-xl font-medium text-[--color-ink]">
            Create your family calendar
          </h2>
          <p className="mt-1 text-sm text-[--color-ink-muted]">
            You'll get a share link for family members and a private manage link.
          </p>

          <form action={createCalendar} className="mt-6 flex flex-col gap-5">
            <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-[--color-ink]">
                Family name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={80}
                placeholder="e.g. The Johnson Family"
                className="rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
              />
            </div>

            <TimezoneSelect />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[--color-ink]">Hemisphere</span>
              <p className="text-xs text-[--color-ink-muted]">Used for seasonal calendar theming.</p>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
                  <input type="radio" name="hemisphere" value="north" defaultChecked className="accent-[--color-accent]" />
                  Northern
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
                  <input type="radio" name="hemisphere" value="south" className="accent-[--color-accent]" />
                  Southern
                </label>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="show_memorial" className="mt-0.5 accent-[--color-accent]" />
              <span className="text-sm text-[--color-ink]">
                Show memorial dates on the calendar
                <span className="block text-xs text-[--color-ink-muted]">
                  When on, death anniversaries appear alongside birthdays.
                </span>
              </span>
            </label>

            <SubmitButton label="Create calendar" />
          </form>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[--color-ink-faint]">
          <a href="/dashboard" className="hover:text-[--color-ink-muted]">← My calendars</a>
          <a href="/login" className="hover:text-[--color-ink-muted]">Switch account</a>
        </div>
      </div>
    </main>
  )
}
