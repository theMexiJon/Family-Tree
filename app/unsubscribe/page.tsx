import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  let success = false

  if (token) {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('notification_subscribers')
      .delete()
      .eq('token', token)
    success = !error
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 text-5xl">{success ? '✅' : '❌'}</div>
        <h1 className="font-display text-2xl font-semibold text-[--color-ink]">
          {success ? 'Unsubscribed' : 'Invalid link'}
        </h1>
        <p className="mt-3 text-sm text-[--color-ink-muted]">
          {success
            ? "You won't receive any more event reminders for this calendar."
            : 'This unsubscribe link is invalid or has already been used.'}
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-[--color-accent] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
