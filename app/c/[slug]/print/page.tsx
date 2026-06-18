import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import type { Person, Relationship } from '@/types'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

type CalEvent = { emoji: string; name: string; color: string }
type EventMap = Map<string, CalEvent[]>   // key = "m-d"

function buildEvents(
  people: Person[],
  relationships: Relationship[],
  showMemorial: boolean,
): EventMap {
  const map: EventMap = new Map()

  const add = (m: number, d: number, ev: CalEvent) => {
    const k = `${m}-${d}`
    const arr = map.get(k) ?? []
    arr.push(ev)
    map.set(k, arr)
  }

  for (const p of people) {
    if (p.birth_month && p.birth_day) {
      add(p.birth_month, p.birth_day, {
        emoji: '🎂',
        name: p.full_name.split(' ')[0],
        color: '#d4623a',
      })
    }
    if (showMemorial && p.is_deceased && p.death_month && p.death_day) {
      add(p.death_month, p.death_day, {
        emoji: '🕊',
        name: p.full_name.split(' ')[0],
        color: '#7a6248',
      })
    }
  }

  for (const r of relationships) {
    if (r.type !== 'partner' || !r.wedding_month || !r.wedding_day) continue
    const a = people.find(p => p.id === r.person_a_id)
    const b = people.find(p => p.id === r.person_b_id)
    if (!a || !b) continue
    add(r.wedding_month, r.wedding_day, {
      emoji: '💍',
      name: `${a.full_name.split(' ')[0]} & ${b.full_name.split(' ')[0]}`,
      color: '#7ab4e8',
    })
  }

  return map
}

function MonthGrid({ year, month, events }: { year: number; month: number; events: EventMap }) {
  const first = firstWeekday(year, month)
  const days  = daysInMonth(year, month)

  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="month-block">
      <p className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
        {MONTHS[month - 1]}
      </p>
      <div className="grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="py-0.5 text-center text-[8px] font-semibold text-gray-400">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const evs = day ? (events.get(`${month}-${day}`) ?? []) : []
          return (
            <div
              key={i}
              className="min-h-[30px] border-t border-gray-100 px-0.5 py-0.5"
            >
              {day != null && (
                <>
                  <p className="text-right text-[9px] font-medium text-gray-700 leading-none mb-0.5">
                    {day}
                  </p>
                  {evs.map((ev, j) => (
                    <p
                      key={j}
                      className="truncate text-[7px] leading-tight font-medium"
                      style={{ color: ev.color }}
                    >
                      {ev.emoji} {ev.name}
                    </p>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ year?: string }>
}) {
  const { slug } = await params
  const { year: yrParam } = await searchParams
  const year = yrParam ? parseInt(yrParam) : new Date().getFullYear() + 1

  const supabase = createServerClient()
  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).single()
  if (!calendar) notFound()

  const [{ data: people }, { data: rels }] = await Promise.all([
    supabase.from('people').select('*').eq('calendar_id', calendar.id),
    supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
  ])

  const events = buildEvents(people ?? [], rels ?? [], calendar.show_memorial)

  // Sorted event list for the sidebar
  const allEvents: { month: number; day: number; label: string }[] = []
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= daysInMonth(year, m); d++) {
      const evs = events.get(`${m}-${d}`) ?? []
      evs.forEach(ev => allEvents.push({ month: m, day: d, label: `${ev.emoji} ${ev.name}` }))
    }
  }

  const prevYear = year - 1
  const nextYear = year + 1

  return (
    <>
      {/* ── Screen header (hidden when printing) ────────────────── */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[--color-paper-dark] bg-[--color-surface] px-6 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-[--color-ink]">
            {calendar.name} — {year}
          </h1>
          <p className="text-xs text-[--color-ink-muted]">
            Print → Save as PDF → upload to{' '}
            <strong>Shutterfly</strong>, <strong>Walmart Photo</strong>, <strong>Walgreens</strong>, or any print shop.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Year nav */}
          <div className="flex items-center gap-1 rounded-lg border border-[--color-paper-dark] overflow-hidden text-xs">
            <Link href={`?year=${prevYear}`} className="px-2 py-1.5 hover:bg-[--color-paper-dark] text-[--color-ink-muted]">‹</Link>
            <span className="px-2 py-1.5 font-semibold text-[--color-ink]">{year}</span>
            <Link href={`?year=${nextYear}`} className="px-2 py-1.5 hover:bg-[--color-paper-dark] text-[--color-ink-muted]">›</Link>
          </div>
          <a
            href={`/c/${slug}/calendar.ics`}
            className="rounded-lg border border-[--color-paper-dark] px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
          >
            ↓ Google / Apple Calendar (.ics)
          </a>
          <PrintButton />
          <Link
            href={`/c/${slug}`}
            className="rounded-lg border border-[--color-paper-dark] px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
          >
            ← Back to tree
          </Link>
        </div>
      </div>

      {/* ── Printable calendar (white bg) ───────────────────────── */}
      <div className="calendar-print-area bg-white p-8 text-black">

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{calendar.name}</h1>
          <p className="text-lg text-gray-400">{year}</p>
        </div>

        {/* Legend */}
        <div className="mb-5 flex justify-center gap-6 text-xs text-gray-500">
          <span>🎂 Birthday</span>
          <span>💍 Anniversary</span>
          {calendar.show_memorial && <span>🕊 Memorial</span>}
        </div>

        {/* 3 × 4 month grid */}
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <MonthGrid key={m} year={year} month={m} events={events} />
          ))}
        </div>

        {/* Upcoming events list */}
        {allEvents.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
              All events — {year}
            </p>
            <div className="grid grid-cols-4 gap-x-6 gap-y-0.5">
              {allEvents.map((ev, i) => (
                <p key={i} className="text-[10px] text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-500">{MONTHS[ev.month - 1].slice(0, 3)} {ev.day}</span>
                  {' — '}{ev.label}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
