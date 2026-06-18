'use client'

import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Props {
  userName: string | null
  returnTo?: string
}

export default function AuthButton({ userName, returnTo }: Props) {
  const router = useRouter()

  async function signOut() {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!userName) {
    return (
      <a
        href={`/login${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ''}`}
        className="rounded-lg border border-[--color-paper-dark] bg-white px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper]"
      >
        Sign in
      </a>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[--color-ink-muted]">👤 {userName}</span>
      <button
        onClick={signOut}
        className="rounded px-2 py-1 text-xs text-[--color-ink-faint] hover:bg-[--color-paper-dark] hover:text-[--color-ink-muted]"
      >
        Sign out
      </button>
    </div>
  )
}
