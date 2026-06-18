'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

const INPUT = 'rounded-lg border border-[--color-paper-dark] px-3 py-2.5 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent] w-full'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const hasError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = getSupabaseClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleGoogle() {
    const supabase = getSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 text-4xl">🌳</div>
        <h1 className="font-display text-3xl font-semibold text-[--color-ink]">Sign in</h1>
        <p className="mt-2 text-sm text-[--color-ink-muted]">
          Your name will be credited automatically when you add or edit family members.
        </p>
      </div>

      {hasError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Sign-in failed — please try again.
        </div>
      )}

      {sent ? (
        <div className="rounded-2xl border border-[--color-paper-dark] bg-white p-8 text-center shadow-sm">
          <div className="mb-3 text-4xl">📬</div>
          <h2 className="font-display text-lg font-medium text-[--color-ink]">Check your email</h2>
          <p className="mt-2 text-sm text-[--color-ink-muted]">
            We sent a sign-in link to <strong>{email}</strong>. Click it to finish signing in — no password needed.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-xs text-[--color-ink-faint] underline hover:text-[--color-ink-muted]"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[--color-paper-dark] bg-white p-8 shadow-sm">
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-[--color-ink]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[--color-accent] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[--color-paper-dark]" />
            <span className="text-xs text-[--color-ink-faint]">or</span>
            <div className="h-px flex-1 bg-[--color-paper-dark]" />
          </div>

          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[--color-paper-dark] bg-white px-4 py-2.5 text-sm font-medium text-[--color-ink] hover:bg-[--color-paper]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="mt-5 text-center text-xs text-[--color-ink-faint]">
            No account or password needed.
          </p>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-sm text-[--color-ink-muted]">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
