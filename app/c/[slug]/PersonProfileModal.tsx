'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Person, Relationship, LifeEvent } from '@/types'
import { addLifeEvent, deleteLifeEvent } from '@/app/actions'
import EditPersonModal from './EditPersonModal'
import PhotoUpload from '@/app/components/PhotoUpload'
import { getSupabaseClient } from '@/lib/supabase/client'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function fmtDate(m: number | null, d: number | null, y: number | null) {
  if (!m && !d && !y) return null
  return [m ? MONTHS[m - 1] : null, d, y].filter(Boolean).join(' ')
}

function fmtShort(m: number | null, d: number | null, y: number | null) {
  if (!m && !d && !y) return null
  return [m ? MONTHS_SHORT[m - 1] : null, d, y].filter(Boolean).join(' ')
}

function calcAge(
  birthYear: number | null,
  birthMonth?: number | null,
  birthDay?: number | null,
  endYear?: number | null,
): number | null {
  if (!birthYear) return null
  const today = new Date()
  const refYear = endYear ?? today.getFullYear()
  let age = refYear - birthYear
  if (!endYear && birthMonth && birthDay) {
    const m = today.getMonth() + 1
    const d = today.getDate()
    if (m < birthMonth || (m === birthMonth && d < birthDay)) age--
  }
  return age < 0 ? null : age
}

const INPUT = 'w-full rounded-lg border border-[--color-paper-dark] bg-[--color-surface] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'
const SELECT = 'rounded-lg border border-[--color-paper-dark] bg-[--color-surface] px-2 py-2 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'

// ─── Add life event form ─────────────────────────────────────────

function AddLifeEventForm({
  personId, calendarId, slug, userName, onDone,
}: {
  personId: string
  calendarId: string
  slug: string
  userName?: string | null
  onDone: (event: LifeEvent) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await addLifeEvent(fd)
      // Optimistically get the new event from Supabase
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('life_events')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data) onDone(data as LifeEvent)
      ;(e.target as HTMLFormElement).reset()
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[--color-paper-dark] py-3 text-sm text-[--color-ink-muted] hover:border-[--color-ink-faint] hover:text-[--color-ink]"
      >
        + Add memory / life event
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-[--color-paper-dark] bg-[--color-paper] p-4">
      <input type="hidden" name="person_id"   value={personId} />
      <input type="hidden" name="calendar_id" value={calendarId} />
      <input type="hidden" name="slug"        value={slug} />
      {userName && <input type="hidden" name="added_by" value={userName} />}

      {/* Photo */}
      <PhotoUpload />

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[--color-ink-muted]">Title *</label>
        <input
          name="title" type="text" required maxLength={120}
          placeholder="e.g. 5th Birthday, College Graduation, Wedding Day"
          className={INPUT}
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-[--color-ink-muted]">Date (optional)</span>
        <div className="flex gap-2">
          <select name="date_month" className={`flex-1 ${SELECT}`}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select name="date_day" className={`w-20 ${SELECT}`}>
            <option value="">Day</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            name="date_year" type="number" min={1800} max={new Date().getFullYear() + 1}
            placeholder="Year"
            className={`w-24 ${INPUT}`}
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[--color-ink-muted]">Note (optional)</label>
        <textarea
          name="description" rows={2} maxLength={500}
          placeholder="A few words about this moment…"
          className={INPUT}
        />
      </div>

      {!userName && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[--color-ink-muted]">Your name *</label>
          <input name="added_by" type="text" required maxLength={80} placeholder="e.g. Sarah" className={INPUT} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button" onClick={() => setOpen(false)}
          className="flex-1 rounded-lg border border-[--color-paper-dark] py-2 text-sm font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={isPending}
          className="flex-1 rounded-lg bg-[--color-accent] py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Save memory'}
        </button>
      </div>
    </form>
  )
}

// ─── Main modal ──────────────────────────────────────────────────

type Tab = 'profile' | 'memories'

interface Props {
  person: Person
  people: Person[]
  relationships: Relationship[]
  slug: string
  calendarId: string
  userName?: string | null
  onClose: () => void
}

export default function PersonProfileModal({
  person, people, relationships, slug, calendarId, userName, onClose,
}: Props) {
  const [tab, setTab]       = useState<Tab>('profile')
  const [editing, setEditing] = useState(false)
  const [events, setEvents]   = useState<LifeEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [, startTransition] = useTransition()

  // Fetch life events when Memories tab is opened
  useEffect(() => {
    if (tab !== 'memories') return
    setLoadingEvents(true)
    const supabase = getSupabaseClient()
    supabase
      .from('life_events')
      .select('*')
      .eq('person_id', person.id)
      .order('date_year', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEvents((data ?? []) as LifeEvent[])
        setLoadingEvents(false)
      })
  }, [tab, person.id])

  if (editing) {
    return <EditPersonModal person={person} slug={slug} onClose={() => setEditing(false)} />
  }

  // Build relationship context
  const partners = relationships
    .filter(r => r.type === 'partner' && (r.person_a_id === person.id || r.person_b_id === person.id))
    .map(r => {
      const otherId = r.person_a_id === person.id ? r.person_b_id : r.person_a_id
      return { partner: people.find(p => p.id === otherId), rel: r }
    }).filter(x => x.partner)

  const parents = relationships
    .filter(r => r.type === 'parent_child' && r.person_b_id === person.id)
    .map(r => people.find(p => p.id === r.person_a_id))
    .filter(Boolean) as Person[]

  const children = relationships
    .filter(r => r.type === 'parent_child' && r.person_a_id === person.id)
    .map(r => people.find(p => p.id === r.person_b_id))
    .filter(Boolean) as Person[]

  const siblings = relationships
    .filter(r => r.type === 'sibling' && (r.person_a_id === person.id || r.person_b_id === person.id))
    .map(r => {
      const otherId = r.person_a_id === person.id ? r.person_b_id : r.person_a_id
      return people.find(p => p.id === otherId)
    }).filter(Boolean) as Person[]

  const birthDate = fmtDate(person.birth_month, person.birth_day, person.birth_year)
  const deathDate = person.is_deceased ? fmtDate(person.death_month, person.death_day, person.death_year) : null
  const age = calcAge(person.birth_year, person.birth_month, person.birth_day, person.death_year)

  function handleDeleteEvent(id: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      fd.set('slug', slug)
      await deleteLifeEvent(fd)
      setEvents(prev => prev.filter(e => e.id !== id))
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[--color-surface] shadow-2xl">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-[--color-paper-dark] bg-[--color-surface]">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[--color-ink-faint]">
              Family member
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-[--color-accent] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                ✎ Edit
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-[--color-ink-faint] hover:bg-[--color-paper-dark]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-[--color-paper-dark]">
            {(['profile', 'memories'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'border-b-2 border-[--color-accent] text-[--color-accent]'
                    : 'text-[--color-ink-muted] hover:text-[--color-ink]'
                }`}
              >
                {t === 'profile' ? 'Profile' : `Memories${events.length > 0 ? ` (${events.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Profile tab ─────────────────────────────────────── */}
        {tab === 'profile' && (
          <div className="p-6">
            {/* Photo + name */}
            <div className="flex items-start gap-4">
              {person.photo_url ? (
                <img src={person.photo_url} alt={person.full_name}
                  className="h-20 w-20 shrink-0 rounded-full border-2 border-[--color-paper-dark] object-cover shadow" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[--color-paper-dark] text-3xl">👤</div>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold leading-tight text-[--color-ink]">
                  {person.full_name}
                </h1>
                {person.maiden_name && (
                  <p className="mt-0.5 text-sm italic text-[--color-ink-muted]">née {person.maiden_name}</p>
                )}
                {person.branch && (
                  <span className="mt-2 inline-block rounded-full bg-[--color-paper-dark] px-2.5 py-0.5 text-xs text-[--color-ink-faint]">
                    {person.branch}
                  </span>
                )}
              </div>
            </div>

            {/* Dates */}
            {(birthDate || person.is_deceased) && (
              <div className="mt-5 space-y-2 rounded-xl border border-[--color-paper-dark] p-4">
                {birthDate && (
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="shrink-0 text-base">🎂</span>
                    <span className="text-[--color-ink]">
                      Born {birthDate}
                      {age !== null && !person.is_deceased && (
                        <span className="ml-2 text-[--color-ink-muted]">· age {age}</span>
                      )}
                    </span>
                  </div>
                )}
                {person.is_deceased && (
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="shrink-0 text-base">🕊</span>
                    <span className="text-[--color-ink]">
                      {deathDate ? `Passed ${deathDate}` : 'Deceased'}
                      {age !== null && person.death_year && <span className="ml-2 text-[--color-ink-muted]">· age {age}</span>}
                    </span>
                  </div>
                )}
              </div>
            )}

            {person.bio && (
              <p className="mt-4 text-sm leading-relaxed text-[--color-ink-muted]">{person.bio}</p>
            )}

            {/* Relationships */}
            {(partners.length > 0 || parents.length > 0 || children.length > 0 || siblings.length > 0) && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--color-ink-faint]">Relationships</p>
                <div className="space-y-2">
                  {partners.map(({ partner, rel }) => partner && (
                    <div key={rel.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 shrink-0">💍</span>
                      <span className="text-[--color-ink]">
                        {rel.status === 'divorced' ? 'Ex-partner of' : 'Partner of'}{' '}
                        <span className="font-semibold">{partner.full_name}</span>
                      </span>
                    </div>
                  ))}
                  {parents.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 shrink-0">👪</span>
                      <span className="text-[--color-ink]">
                        Child of <span className="font-semibold">{parents.map(p => p.full_name).join(' & ')}</span>
                      </span>
                    </div>
                  )}
                  {children.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 shrink-0">👶</span>
                      <span className="text-[--color-ink]">
                        Parent of <span className="font-semibold">{children.map(p => p.full_name).join(', ')}</span>
                      </span>
                    </div>
                  )}
                  {siblings.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 shrink-0">🤝</span>
                      <span className="text-[--color-ink]">
                        Sibling of <span className="font-semibold">{siblings.map(p => p.full_name).join(', ')}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="mt-5 text-xs text-[--color-ink-faint]">Added by {person.added_by}</p>
          </div>
        )}

        {/* ── Memories tab ─────────────────────────────────────── */}
        {tab === 'memories' && (
          <div className="p-6">
            <AddLifeEventForm
              personId={person.id}
              calendarId={calendarId}
              slug={slug}
              userName={userName}
              onDone={ev => setEvents(prev => [ev, ...prev])}
            />

            {loadingEvents ? (
              <p className="mt-6 text-center text-sm text-[--color-ink-muted]">Loading…</p>
            ) : events.length === 0 ? (
              <div className="mt-6 text-center">
                <div className="text-4xl">📸</div>
                <p className="mt-2 text-sm text-[--color-ink-muted]">
                  No memories yet. Add the first one above!
                </p>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="rounded-xl border border-[--color-paper-dark] overflow-hidden">
                    {ev.photo_url && (
                      <img
                        src={ev.photo_url}
                        alt={ev.title}
                        className="w-full max-h-64 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-semibold text-[--color-ink]">{ev.title}</p>
                          {fmtShort(ev.date_month, ev.date_day, ev.date_year) && (
                            <p className="text-xs text-[--color-ink-muted] mt-0.5">
                              📅 {fmtShort(ev.date_month, ev.date_day, ev.date_year)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs text-[--color-ink-faint] hover:text-red-500 hover:bg-red-500/10"
                        >
                          ✕
                        </button>
                      </div>
                      {ev.description && (
                        <p className="mt-2 text-sm text-[--color-ink-muted]">{ev.description}</p>
                      )}
                      <p className="mt-2 text-xs text-[--color-ink-faint]">Added by {ev.added_by}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
