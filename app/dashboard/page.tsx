import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, getUserDisplayName } from '@/lib/supabase/session'
import AuthButton from '@/app/components/AuthButton'
import CopyButton from '@/app/components/CopyButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getSessionUser()

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[--color-ink-muted]">You need to sign in to view your dashboard.</p>
          <a href="/login?next=/dashboard" className="mt-4 inline-block rounded-lg bg-[--color-accent] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Sign in
          </a>
        </div>
      </main>
    )
  }

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const base = `${protocol}://${host}`

  const userName = getUserDisplayName(user)
  const supabase = createServerClient()

  const { data: calendars } = await supabase
    .from('calendars')
    .select('id, slug, name, owner_token, created_at, show_memorial')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const list = calendars ?? []

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[--color-ink]">My calendars</h1>
            {userName && (
              <p className="mt-1 text-sm text-[--color-ink-muted]">Signed in as {userName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <AuthButton userName={userName} />
            <Link
              href="/"
              className="rounded-lg bg-[--color-accent] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + New calendar
            </Link>
          </div>
        </div>

        {/* Calendar list */}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[--color-paper-dark] p-12 text-center">
            <div className="mb-3 text-4xl">🌱</div>
            <p className="font-display text-lg text-[--color-ink]">No calendars yet</p>
            <p className="mt-1 text-sm text-[--color-ink-muted]">Create your first family tree to get started.</p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-[--color-accent] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Create a calendar
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map(cal => {
              const shareUrl  = `${base}/c/${cal.slug}`
              const manageUrl = `${base}/c/${cal.slug}/manage/${cal.owner_token}`
              const created   = new Date(cal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

              return (
                <div key={cal.id} className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold text-[--color-ink]">{cal.name}</h2>
                      <p className="text-xs text-[--color-ink-faint]">Created {created}</p>
                    </div>
                    <Link
                      href={`/c/${cal.slug}`}
                      className="shrink-0 rounded-lg border border-[--color-paper-dark] px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
                    >
                      View tree →
                    </Link>
                  </div>

                  {/* Share link */}
                  <div className="mb-3">
                    <p className="mb-1.5 text-xs font-medium text-[--color-ink-muted]">🔗 Share link</p>
                    <div className="flex items-center gap-2 rounded-lg border border-[--color-paper-dark] bg-[--color-paper] px-3 py-2">
                      <span className="flex-1 truncate font-mono text-xs text-[--color-ink-muted]">{shareUrl}</span>
                      <CopyButton text={shareUrl} />
                    </div>
                  </div>

                  {/* Manage link */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-[--color-ink-muted]">🔑 Manage link <span className="text-[--color-ink-faint]">(keep private)</span></p>
                    <div className="flex items-center gap-2 rounded-lg border border-[--color-paper-dark] bg-[--color-paper] px-3 py-2">
                      <span className="flex-1 truncate font-mono text-xs text-[--color-ink-faint]">{manageUrl}</span>
                      <CopyButton text={manageUrl} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
