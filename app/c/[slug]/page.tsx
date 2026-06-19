import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, getUserDisplayName } from '@/lib/supabase/session'
import type { Person, Relationship } from '@/types'
import TreePageClient from './TreePageClient'

export const dynamic = 'force-dynamic'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function daysUntil(month: number, day: number): number {
  const now   = new Date()
  const year  = now.getFullYear()
  let next    = new Date(year, month - 1, day)
  if (next.getTime() - now.getTime() < -86_400_000) {
    next = new Date(year + 1, month - 1, day)
  }
  return Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 86_400_000))
}

function getUpcomingEvents(
  people: Person[],
  relationships: Relationship[],
  showMemorial: boolean,
) {
  const events: { daysUntil: number; date: string; label: string; emoji: string }[] = []

  for (const p of people) {
    if (p.birth_month && p.birth_day) {
      const d = daysUntil(p.birth_month, p.birth_day)
      if (d <= 30) events.push({ daysUntil: d, emoji: '🎂', label: `${p.full_name}'s birthday`, date: `${MONTHS_SHORT[p.birth_month-1]} ${p.birth_day}` })
    }
    if (showMemorial && p.is_deceased && p.death_month && p.death_day) {
      const d = daysUntil(p.death_month, p.death_day)
      if (d <= 30) events.push({ daysUntil: d, emoji: '🕊', label: `In memory of ${p.full_name}`, date: `${MONTHS_SHORT[p.death_month-1]} ${p.death_day}` })
    }
  }

  for (const r of relationships) {
    if (r.type !== 'partner' || !r.wedding_month || !r.wedding_day) continue
    const a = people.find(p => p.id === r.person_a_id)
    const b = people.find(p => p.id === r.person_b_id)
    if (!a || !b) continue
    const d = daysUntil(r.wedding_month, r.wedding_day)
    if (d <= 30) events.push({ daysUntil: d, emoji: '💍', label: `${a.full_name} & ${b.full_name}'s anniversary`, date: `${MONTHS_SHORT[r.wedding_month-1]} ${r.wedding_day}` })
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil)
}

function computeStats(people: Person[], relationships: Relationship[]) {
  const parentChild = relationships.filter(r => r.type === 'parent_child')
  const parentsOf: Record<string, string[]> = {}
  for (const r of parentChild) {
    parentsOf[r.person_b_id] = [...(parentsOf[r.person_b_id] ?? []), r.person_a_id]
  }

  const gen: Record<string, number> = {}
  function assignGen(id: string, g: number) {
    if ((gen[id] ?? -1) >= g) return
    gen[id] = g
    for (const r of parentChild.filter(r => r.person_a_id === id)) assignGen(r.person_b_id, g + 1)
  }
  for (const p of people) if (!parentsOf[p.id]?.length) assignGen(p.id, 0)

  const generations = people.length ? Math.max(0, ...Object.values(gen)) + 1 : 0
  const couples     = relationships.filter(r => r.type === 'partner').length
  const withYear    = people.filter(p => p.birth_year)
  const oldestP     = withYear.length
    ? withYear.reduce((a, b) => (a.birth_year! < b.birth_year! ? a : b))
    : null
  const oldest = oldestP ? { name: oldestP.full_name, birthYear: oldestP.birth_year! } : null

  return { generations, couples, oldest }
}

export default async function CalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [supabase, user] = await Promise.all([
    Promise.resolve(createServerClient()),
    getSessionUser(),
  ])

  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).single()

  if (!calendar) notFound()

  const [{ data: people }, { data: relationships }] = await Promise.all([
    supabase.from('people').select('*').eq('calendar_id', calendar.id).order('full_name'),
    supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
  ])

  const personList: Person[]       = people ?? []
  const relList: Relationship[]    = relationships ?? []
  const userName                   = getUserDisplayName(user)
  const upcomingEvents             = getUpcomingEvents(personList, relList, calendar.show_memorial)
  const stats                      = computeStats(personList, relList)

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <TreePageClient
          calendar={calendar}
          people={personList}
          relationships={relList}
          slug={slug}
          userName={userName}
          upcomingEvents={upcomingEvents}
          stats={stats}
        />
      </div>
    </main>
  )
}
