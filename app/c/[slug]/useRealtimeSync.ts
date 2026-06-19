'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Subscribes to Supabase Realtime changes for this calendar's people and
 * relationships tables. Calls router.refresh() whenever a remote change
 * arrives so the server-rendered data updates automatically.
 *
 * Returns { isLive } — true once the channel is subscribed.
 */
export function useRealtimeSync(calendarId: string) {
  const router   = useRouter()
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()

    const channel = supabase
      .channel(`calendar:${calendarId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people', filter: `calendar_id=eq.${calendarId}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relationships', filter: `calendar_id=eq.${calendarId}` },
        () => router.refresh(),
      )
      .subscribe(status => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [calendarId, router])

  return { isLive }
}
