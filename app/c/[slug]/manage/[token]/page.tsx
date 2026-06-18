import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { deleteRelationship, updateCalendar } from '@/app/actions'
import SubmitButton from '@/app/components/SubmitButton'
import DeleteButton from '@/app/components/DeleteButton'
import ManagePersonList from './ManagePersonList'
import type { Person, Relationship } from '@/types'

export const dynamic = 'force-dynamic'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(month: number | null, day: number | null, year: number | null) {
  if (!month && !day && !year) return null
  const parts: string[] = []
  if (month) parts.push(MONTHS_SHORT[month - 1])
  if (day) parts.push(String(day))
  if (year) parts.push(String(year))
  return parts.join(' ')
}

const INPUT = 'rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'

export default async function ManagePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params
  const supabase = createServerClient()

  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).eq('owner_token', token).single()

  if (!calendar) notFound()

  const [{ data: people }, { data: relationships }] = await Promise.all([
    supabase.from('people').select('*').eq('calendar_id', calendar.id).order('full_name'),
    supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
  ])

  const personList: Person[] = people ?? []
  const relList: Relationship[] = relationships ?? []

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Private link warning */}
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          🔑 This is your private manage link — keep it secret. Anyone with this URL can edit or delete entries.
        </div>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[--color-ink]">
              {calendar.name}
            </h1>
            <p className="mt-1 text-sm text-[--color-ink-muted]">
              {personList.length} {personList.length === 1 ? 'person' : 'people'} ·{' '}
              {relList.length} {relList.length === 1 ? 'relationship' : 'relationships'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/c/${slug}/print`}
              className="rounded-lg border border-[--color-paper-dark] bg-white px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper]"
            >
              🖨 Print calendar
            </Link>
            <a
              href={`/c/${slug}/calendar.ics`}
              className="rounded-lg border border-[--color-paper-dark] bg-white px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper]"
            >
              ↓ .ics export
            </a>
            <Link
              href={`/c/${slug}`}
              className="rounded-lg border border-[--color-paper-dark] bg-white px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper]"
            >
              View tree →
            </Link>
          </div>
        </div>

        {/* Calendar settings */}
        <section className="mb-8 rounded-2xl border border-[--color-paper-dark] bg-white p-6">
          <h2 className="font-display text-lg font-medium text-[--color-ink]">Calendar settings</h2>
          <form action={updateCalendar} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="id" value={calendar.id} />
            <input type="hidden" name="owner_token" value={token} />
            <input type="hidden" name="slug" value={slug} />

            <div className="flex flex-col gap-1">
              <label htmlFor="cal-name" className="text-sm font-medium text-[--color-ink]">Family name</label>
              <input
                id="cal-name" name="name" type="text" required maxLength={80}
                defaultValue={calendar.name}
                className={`w-full ${INPUT}`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[--color-ink]">Hemisphere</span>
              <div className="flex gap-4">
                {(['north', 'south'] as const).map(h => (
                  <label key={h} className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
                    <input
                      type="radio" name="hemisphere" value={h}
                      defaultChecked={calendar.hemisphere === h}
                      className="accent-[--color-accent]"
                    />
                    {h === 'north' ? 'Northern' : 'Southern'}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
              <input
                type="checkbox" name="show_memorial"
                defaultChecked={calendar.show_memorial}
                className="accent-[--color-accent]"
              />
              Show memorial dates on the calendar
            </label>

            <div>
              <SubmitButton label="Save settings" />
            </div>
          </form>
        </section>

        {/* People — client component for edit support */}
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-medium text-[--color-ink]">
            People ({personList.length})
          </h2>
          <ManagePersonList
            people={personList}
            calendarId={calendar.id}
            ownerToken={token}
            slug={slug}
          />
        </section>

        {/* Relationships */}
        {relList.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-display text-lg font-medium text-[--color-ink]">
              Relationships ({relList.length})
            </h2>
            <div className="flex flex-col gap-2">
              {relList.map(rel => {
                const personA = personList.find(p => p.id === rel.person_a_id)
                const personB = personList.find(p => p.id === rel.person_b_id)
                if (!personA || !personB) return null

                const label = rel.type === 'partner'
                  ? `${personA.full_name} & ${personB.full_name}${rel.status ? ` — ${rel.status}` : ''}`
                  : `${personA.full_name} → parent of → ${personB.full_name}`
                const wedding = rel.type === 'partner'
                  ? fmtDate(rel.wedding_month, rel.wedding_day, rel.wedding_year)
                  : null

                return (
                  <div key={rel.id} className="flex items-center gap-3 rounded-xl border border-[--color-paper-dark] bg-white p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[--color-ink]">{label}</p>
                      {wedding && (
                        <p className="text-xs text-[--color-ink-muted]">Wed {wedding}</p>
                      )}
                    </div>
                    <form action={deleteRelationship}>
                      <input type="hidden" name="id" value={rel.id} />
                      <input type="hidden" name="calendar_id" value={calendar.id} />
                      <input type="hidden" name="owner_token" value={token} />
                      <input type="hidden" name="slug" value={slug} />
                      <DeleteButton label="Delete" confirmMessage="Delete this relationship?" />
                    </form>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
