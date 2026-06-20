'use client'

import { useState, useTransition } from 'react'
import { subscribeNotifications } from '@/app/actions'

interface Props {
  calendarId: string
}

export default function NotifySubscribeForm({ calendarId }: Props) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('calendar_id', calendarId)

    startTransition(async () => {
      try {
        await subscribeNotifications(formData)
        setDone(true)
      } catch {
        setError('Could not subscribe — please try again.')
      }
    })
  }

  if (done) {
    return (
      <p className="mt-3 text-sm text-[--color-spring]">
        You're subscribed! You'll get a reminder email before upcoming events.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="min-w-0 flex-1 rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
        />
        <select
          name="days_before"
          defaultValue="7"
          className="rounded-lg border border-[--color-paper-dark] px-2 py-2 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
        >
          <option value="1">1 day before</option>
          <option value="3">3 days before</option>
          <option value="7">7 days before</option>
          <option value="14">14 days before</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[--color-accent] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Subscribing…' : 'Get event reminders'}
      </button>
      <p className="text-xs text-[--color-ink-faint]">
        We'll email you a heads-up before birthdays and anniversaries so you can document the moment.
      </p>
    </form>
  )
}
