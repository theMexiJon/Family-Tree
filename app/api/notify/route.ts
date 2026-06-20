import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

// Triggered by a daily cron job (e.g. Vercel Cron or any scheduler).
// Requires Authorization: Bearer <CRON_SECRET> header.
// Requires env vars: CRON_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL

function daysUntil(month: number, day: number): number {
  const now  = new Date()
  const year = now.getFullYear()
  let next   = new Date(year, month - 1, day)
  if (next.getTime() - now.getTime() < -86_400_000) {
    next = new Date(year + 1, month - 1, day)
  }
  return Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 86_400_000))
}

function buildEmailHtml(
  calendarName: string,
  events: { emoji: string; label: string; date: string; daysUntil: number }[],
  calendarUrl: string,
  unsubscribeUrl: string,
): string {
  const eventRows = events.map(ev => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:8px 0;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">${ev.emoji}</span>
      <div>
        <p style="margin:0;font-size:15px;color:#111827;font-weight:500;">${ev.label}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
          ${ev.date} · ${ev.daysUntil === 0 ? 'Today!' : ev.daysUntil === 1 ? 'Tomorrow' : `In ${ev.daysUntil} days`}
        </p>
      </div>
    </div>
  `).join('')

  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#111827;">
      <h1 style="font-size:22px;font-weight:600;margin:0 0 6px;">Upcoming family events 🎉</h1>
      <p style="font-size:14px;color:#6b7280;margin:0 0 20px;">
        Here's what's coming up in <strong>${calendarName}</strong>:
      </p>
      ${eventRows}
      <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:10px;">
        <p style="margin:0;font-size:14px;color:#374151;">
          📸 Open the calendar to <a href="${calendarUrl}" style="color:#4f46e5;font-weight:500;">add event photos</a>
          — click any person's card to upload memories for the occasion.
        </p>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;" />
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a> from these reminders.
      </p>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Family Calendar <noreply@example.com>'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

  const supabase = createServiceClient()

  // Fetch all subscribers with their calendar data
  const { data: subscribers, error: subError } = await supabase
    .from('notification_subscribers')
    .select('*, calendars(id, slug, name, show_memorial)')

  if (subError || !subscribers?.length) {
    return NextResponse.json({ sent: 0, error: subError?.message ?? 'No subscribers' })
  }

  let totalSent = 0

  for (const sub of subscribers) {
    const calendar = (sub as { calendars: { id: string; slug: string; name: string; show_memorial: boolean } | null }).calendars
    if (!calendar) continue

    const [{ data: people }, { data: relationships }] = await Promise.all([
      supabase.from('people').select('*').eq('calendar_id', calendar.id),
      supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
    ])

    const thisYear = new Date().getFullYear()
    const pendingEvents: { emoji: string; label: string; date: string; daysUntil: number; eventKey: string }[] = []

    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    for (const person of people ?? []) {
      if (person.birth_month && person.birth_day) {
        const d = daysUntil(person.birth_month, person.birth_day)
        if (d <= sub.days_before) {
          pendingEvents.push({
            emoji: '🎂',
            label: `${person.full_name}'s birthday`,
            date: `${MONTHS_SHORT[person.birth_month - 1]} ${person.birth_day}`,
            daysUntil: d,
            eventKey: `birthday:${person.id}:${thisYear}`,
          })
        }
      }
      if (calendar.show_memorial && person.is_deceased && person.death_month && person.death_day) {
        const d = daysUntil(person.death_month, person.death_day)
        if (d <= sub.days_before) {
          pendingEvents.push({
            emoji: '🕊',
            label: `In memory of ${person.full_name}`,
            date: `${MONTHS_SHORT[person.death_month - 1]} ${person.death_day}`,
            daysUntil: d,
            eventKey: `memorial:${person.id}:${thisYear}`,
          })
        }
      }
    }

    for (const rel of relationships ?? []) {
      if (rel.type !== 'partner' || !rel.wedding_month || !rel.wedding_day) continue
      const personA = (people ?? []).find(p => p.id === rel.person_a_id)
      const personB = (people ?? []).find(p => p.id === rel.person_b_id)
      if (!personA || !personB) continue
      const d = daysUntil(rel.wedding_month, rel.wedding_day)
      if (d <= sub.days_before) {
        pendingEvents.push({
          emoji: '💍',
          label: `${personA.full_name} & ${personB.full_name}'s anniversary`,
          date: `${MONTHS_SHORT[rel.wedding_month - 1]} ${rel.wedding_day}`,
          daysUntil: d,
          eventKey: `anniversary:${rel.id}:${thisYear}`,
        })
      }
    }

    if (!pendingEvents.length) continue

    // Filter out already-sent events
    const eventKeys = pendingEvents.map(e => e.eventKey)
    const { data: alreadySent } = await supabase
      .from('notification_sends')
      .select('event_key')
      .eq('subscriber_id', sub.id)
      .in('event_key', eventKeys)

    const sentKeys = new Set((alreadySent ?? []).map(s => s.event_key))
    const toSend = pendingEvents.filter(e => !sentKeys.has(e.eventKey))
    if (!toSend.length) continue

    const calendarUrl  = `${appUrl}/c/${calendar.slug}`
    const unsubUrl     = `${appUrl}/unsubscribe?token=${sub.token}`
    const subject      = toSend.length === 1
      ? `Reminder: ${toSend[0].label} coming up`
      : `${toSend.length} upcoming events in ${calendar.name}`

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to:   sub.email,
      subject,
      html: buildEmailHtml(calendar.name, toSend, calendarUrl, unsubUrl),
    })

    if (!emailError) {
      await supabase.from('notification_sends').insert(
        toSend.map(e => ({ subscriber_id: sub.id, event_key: e.eventKey }))
      )
      totalSent++
    }
  }

  return NextResponse.json({ sent: totalSent })
}
