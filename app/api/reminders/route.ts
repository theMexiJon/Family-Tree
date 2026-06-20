import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function daysUntil(month: number, day: number): number {
  const now  = new Date()
  const year = now.getFullYear()
  let next   = new Date(year, month - 1, day)
  if (next.getTime() - now.getTime() < -86_400_000) {
    next = new Date(year + 1, month - 1, day)
  }
  return Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 86_400_000))
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: 'RESEND_API_KEY not configured' })
  }

  const resend   = new Resend(process.env.RESEND_API_KEY)
  const supabase = createServerClient()

  // Fetch all calendars that have an owner email
  const { data: calendars } = await supabase
    .from('calendars')
    .select('id, name, slug, owner_email, show_memorial')
    .not('owner_email', 'is', null)

  if (!calendars?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const cal of calendars) {
    const [{ data: people }, { data: rels }] = await Promise.all([
      supabase.from('people').select('*').eq('calendar_id', cal.id),
      supabase.from('relationships').select('*').eq('calendar_id', cal.id),
    ])

    // Collect events happening in 1 or 7 days
    type EvItem = { days: number; label: string; date: string }
    const events: EvItem[] = []

    for (const p of people ?? []) {
      if (p.birth_month && p.birth_day) {
        const d = daysUntil(p.birth_month, p.birth_day)
        if (d === 1 || d === 7) {
          events.push({
            days: d,
            label: `🎂 ${p.full_name}'s birthday`,
            date:  `${MONTHS[p.birth_month - 1]} ${p.birth_day}`,
          })
        }
      }
      if (cal.show_memorial && p.is_deceased && p.death_month && p.death_day) {
        const d = daysUntil(p.death_month, p.death_day)
        if (d === 1 || d === 7) {
          events.push({
            days: d,
            label: `🕊 In memory of ${p.full_name}`,
            date:  `${MONTHS[p.death_month - 1]} ${p.death_day}`,
          })
        }
      }
    }

    for (const r of rels ?? []) {
      if (r.type !== 'partner' || !r.wedding_month || !r.wedding_day) continue
      const a = (people ?? []).find(p => p.id === r.person_a_id)
      const b = (people ?? []).find(p => p.id === r.person_b_id)
      if (!a || !b) continue
      const d = daysUntil(r.wedding_month, r.wedding_day)
      if (d === 1 || d === 7) {
        events.push({
          days: d,
          label: `💍 ${a.full_name} & ${b.full_name}'s anniversary`,
          date:  `${MONTHS[r.wedding_month - 1]} ${r.wedding_day}`,
        })
      }
    }

    if (events.length === 0) continue

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      ?? `https://${process.env.VERCEL_URL}`
      ?? 'https://your-app.vercel.app'

    const treeUrl  = `${baseUrl}/c/${cal.slug}`
    const subject  = events.length === 1
      ? `${events[0].label} — ${events[0].days === 1 ? 'tomorrow!' : 'in 7 days'}`
      : `${events.length} upcoming events in the ${cal.name} family tree`

    const rows = events
      .map(ev => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #352c22;">
            <strong style="color:#ede4d8;">${ev.label}</strong>
            <br/>
            <span style="color:#b09880;font-size:13px;">
              ${ev.date} — ${ev.days === 1 ? 'tomorrow' : 'in 7 days'}
            </span>
          </td>
        </tr>`)
      .join('')

    const html = `
<!DOCTYPE html>
<html>
<body style="background:#18130e;color:#ede4d8;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:48px;">🌳</span>
    <h1 style="font-size:22px;margin:12px 0 4px;color:#f0e8dc;">${cal.name}</h1>
    <p style="color:#b09880;margin:0;font-size:14px;">Upcoming events reminder</p>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0">
    ${rows}
  </table>

  <div style="margin-top:32px;text-align:center;">
    <a
      href="${treeUrl}"
      style="display:inline-block;background:#d4623a;color:#fff;text-decoration:none;
             padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;"
    >
      📸 Add photos &amp; memories →
    </a>
  </div>

  <p style="margin-top:32px;text-align:center;font-size:12px;color:#5a4a38;">
    You're receiving this because you created the ${cal.name} family calendar.<br/>
    <a href="${treeUrl}" style="color:#7a6248;">View tree</a>
  </p>
</body>
</html>`

    await resend.emails.send({
      from:    'Family Calendar <onboarding@resend.dev>',
      to:      cal.owner_email!,
      subject,
      html,
    })

    sent++
  }

  return NextResponse.json({ sent, checked: calendars.length })
}
