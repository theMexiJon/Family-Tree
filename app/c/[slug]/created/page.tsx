import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import CopyButton from '@/app/components/CopyButton'

export const dynamic = 'force-dynamic'

export default async function CreatedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ owner?: string }>
}) {
  const { slug } = await params
  const { owner } = await searchParams

  if (!owner) notFound()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const base = `${protocol}://${host}`

  const shareUrl  = `${base}/c/${slug}`
  const manageUrl = `${base}/c/${slug}/manage/${owner}`

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Success header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[--color-accent-light] text-2xl">
            🌳
          </div>
          <h1 className="font-display text-4xl font-semibold text-[--color-ink]">
            Your calendar is ready!
          </h1>
          <p className="mt-2 text-[--color-ink-muted]">
            Share the link below with family to start building the tree.
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {/* Share link */}
          <div className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <h2 className="font-display text-base font-medium text-[--color-ink]">Share link</h2>
            </div>
            <p className="mt-1 text-xs text-[--color-ink-muted]">
              Anyone with this link can add people to the family tree.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[--color-paper-dark] bg-[--color-paper] px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-[--color-ink]">{shareUrl}</span>
              <CopyButton text={shareUrl} />
            </div>
          </div>

          {/* Manage link */}
          <div className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔑</span>
              <h2 className="font-display text-base font-medium text-[--color-ink]">Your manage link</h2>
            </div>
            <p className="mt-1 text-xs text-[--color-ink-muted]">
              Keep this private. Lets you edit, moderate, and export the tree.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[--color-paper-dark] bg-[--color-paper] px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-[--color-ink]">{manageUrl}</span>
              <CopyButton text={manageUrl} />
            </div>
            <p className="mt-2 text-xs text-[--color-ink-faint]">
              You can always find this link again in your{' '}
              <Link href="/dashboard" className="underline hover:text-[--color-ink-muted]">Dashboard</Link>.
            </p>
          </div>

          {/* CTA */}
          <Link
            href={`/c/${slug}`}
            className="flex w-full items-center justify-center rounded-xl bg-[--color-accent] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start building your family tree →
          </Link>

          <Link
            href="/dashboard"
            className="text-center text-xs text-[--color-ink-faint] hover:text-[--color-ink-muted]"
          >
            ← Back to my calendars
          </Link>
        </div>
      </div>
    </main>
  )
}
