import { NextRequest, NextResponse } from 'next/server'
import ical from 'ical-generator'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).single()

  if (!calendar) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: people }, { data: relationships }] = await Promise.all([
    supabase.from('people').select('*').eq('calendar_id', calendar.id),
    supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
  ])

  const cal = ical({
    name: `${calendar.name} — Birthdays & Anniversaries`,
    timezone: calendar.timezone,
  })

  // Birthdays (and memorial dates)
  for (const person of people ?? []) {
    if (person.birth_month && person.birth_day) {
      const baseYear = person.birth_year ?? 2000
      cal.createEvent({
        start: new Date(baseYear, person.birth_month - 1, person.birth_day),
        end:   new Date(baseYear, person.birth_month - 1, person.birth_day),
        allDay: true,
        summary: `🎂 ${person.full_name}'s Birthday`,
        description: person.bio ?? undefined,
        repeating: { freq: 'YEARLY' as const },
      })
    }

    if (
      calendar.show_memorial &&
      person.is_deceased &&
      person.death_month &&
      person.death_day
    ) {
      const baseYear = person.death_year ?? 2000
      cal.createEvent({
        start: new Date(baseYear, person.death_month - 1, person.death_day),
        end:   new Date(baseYear, person.death_month - 1, person.death_day),
        allDay: true,
        summary: `🕊 In memory of ${person.full_name}`,
        repeating: { freq: 'YEARLY' as const },
      })
    }
  }

  // Wedding anniversaries
  for (const rel of relationships ?? []) {
    if (rel.type !== 'partner' || !rel.wedding_month || !rel.wedding_day) continue

    const personA = (people ?? []).find(p => p.id === rel.person_a_id)
    const personB = (people ?? []).find(p => p.id === rel.person_b_id)
    if (!personA || !personB) continue

    const baseYear = rel.wedding_year ?? 2000
    cal.createEvent({
      start: new Date(baseYear, rel.wedding_month - 1, rel.wedding_day),
      end:   new Date(baseYear, rel.wedding_month - 1, rel.wedding_day),
      allDay: true,
      summary: `💍 ${personA.full_name} & ${personB.full_name} Anniversary`,
      repeating: { freq: 'YEARLY' as const },
    })
  }

  const safeName = calendar.name.replace(/[^a-z0-9]/gi, '_')

  return new NextResponse(cal.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
