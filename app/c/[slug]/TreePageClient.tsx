'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Person, Relationship, Calendar } from '@/types'
import TreeWrapper from './TreeWrapper'
import MobilePersonList from './MobilePersonList'
import AddPersonForm from './AddPersonForm'
import AddRelationshipForm from './AddRelationshipForm'
import AuthButton from '@/app/components/AuthButton'
import { useRealtimeSync } from './useRealtimeSync'
import NotifySubscribeForm from './NotifySubscribeForm'

interface UpcomingEvent {
  daysUntil: number
  date: string
  label: string
  emoji: string
}

interface TreeStats {
  generations: number
  couples: number
  oldest: { name: string; birthYear: number } | null
}

interface Props {
  calendar: Calendar
  people: Person[]
  relationships: Relationship[]
  slug: string
  userName: string | null
  upcomingEvents: UpcomingEvent[]
  stats: TreeStats
}

export default function TreePageClient({
  calendar,
  people,
  relationships,
  slug,
  userName,
  upcomingEvents,
  stats,
}: Props) {
  const [search, setSearch] = useState('')
  const { isLive } = useRealtimeSync(calendar.id)

  const highlightIds = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return new Set<string>()
    return new Set(
      people
        .filter(p =>
          p.full_name.toLowerCase().includes(q) ||
          (p.maiden_name ?? '').toLowerCase().includes(q),
        )
        .map(p => p.id),
    )
  }, [search, people])

  const peopleForForms = people.map(p => ({ id: p.id, full_name: p.full_name }))

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[--color-ink] md:text-4xl">
            {calendar.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[--color-ink-muted]">
            <span>{people.length} {people.length === 1 ? 'person' : 'people'}</span>
            {stats.generations > 1 && <span>· {stats.generations} generations</span>}
            {stats.couples > 0 && <span>· {stats.couples} {stats.couples === 1 ? 'couple' : 'couples'}</span>}
            {stats.oldest && (
              <span>· Oldest: {stats.oldest.name.split(' ')[0]} (b. {stats.oldest.birthYear})</span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-xs text-[--color-spring]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[--color-spring]" />
                Live
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <AuthButton userName={userName} returnTo={`/c/${slug}`} />
          <span className="text-2xl">🌳</span>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]">🔍</span>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search family members…"
          className="w-full rounded-xl border border-[--color-paper-dark] bg-[--color-surface] py-2.5 pl-9 pr-4 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
        />
        {search && highlightIds.size > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[--color-ink-muted]">
            {highlightIds.size} found
          </span>
        )}
        {search && highlightIds.size === 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[--color-ink-faint]">
            No matches
          </span>
        )}
      </div>

      {/* ── Tree canvas (desktop) ──────────────────────────────── */}
      <div className="hidden md:block">
        <TreeWrapper
          people={people}
          relationships={relationships}
          slug={slug}
          calendarId={calendar.id}
          savedPositions={calendar.node_positions ?? {}}
          highlightIds={highlightIds}
        />
        {people.length > 0 && (
          <p className="mt-1.5 text-center text-xs text-[--color-ink-faint]">
            Pan by dragging · Zoom with scroll · Tap a card to view profile
          </p>
        )}
      </div>

      {/* ── Mobile list ───────────────────────────────────────── */}
      <div className="block md:hidden">
        <MobilePersonList
          people={people}
          relationships={relationships}
          slug={slug}
          searchQuery={search}
        />
      </div>

      {/* ── Upcoming events ───────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-5">
          <h2 className="font-display text-base font-medium text-[--color-ink]">
            📅 Coming up in the next 30 days
          </h2>
          <div className="mt-3 flex flex-col divide-y divide-[--color-paper-dark]">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <span>{ev.emoji}</span>
                  <span className="text-[--color-ink]">{ev.label}</span>
                </div>
                <div className="shrink-0 text-right text-xs text-[--color-ink-muted]">
                  <span>{ev.date}</span>
                  <span className="ml-2 text-[--color-ink-faint]">
                    {ev.daysUntil === 0 ? 'today' : `in ${ev.daysUntil}d`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Forms ─────────────────────────────────────────────── */}
      <div className={`mt-8 grid gap-5 ${people.length >= 2 ? 'sm:grid-cols-2' : ''}`}>
        <div className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6">
          <h2 className="font-display text-lg font-medium text-[--color-ink]">Add a family member</h2>
          <p className="mt-1 text-xs text-[--color-ink-muted]">All fields except name are optional.</p>
          <AddPersonForm
            calendarId={calendar.id}
            slug={slug}
            people={peopleForForms}
            showMemorial={calendar.show_memorial}
            userName={userName}
          />
        </div>

        {people.length >= 2 && (
          <div className="rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6">
            <h2 className="font-display text-lg font-medium text-[--color-ink]">Link two people</h2>
            <p className="mt-1 text-xs text-[--color-ink-muted]">
              Connect family members with a relationship.
            </p>
            <div className="mt-5">
              <AddRelationshipForm
                calendarId={calendar.id}
                slug={slug}
                people={peopleForForms}
                userName={userName}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Notification subscribe ─────────────────────────────── */}
      {people.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6">
          <h2 className="font-display text-base font-medium text-[--color-ink]">
            🔔 Get event reminders
          </h2>
          <p className="mt-1 text-sm text-[--color-ink-muted]">
            Receive an email before birthdays and anniversaries so you can capture and share photos.
          </p>
          <NotifySubscribeForm calendarId={calendar.id} />
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6 text-center">
        <p className="font-display text-base font-medium text-[--color-ink]">
          Want your own family calendar?
        </p>
        <p className="mt-1 text-sm text-[--color-ink-muted]">
          Create a separate tree to share with your branch of the family.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[--color-accent] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            🌱 Start your own tree
          </Link>
          <Link
            href={`/c/${slug}/snapshot`}
            className="inline-flex items-center gap-2 rounded-lg border border-[--color-paper-dark] px-5 py-2.5 text-sm font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
          >
            📤 Share to social
          </Link>
          <Link
            href={`/c/${slug}/print`}
            className="inline-flex items-center gap-2 rounded-lg border border-[--color-paper-dark] px-5 py-2.5 text-sm font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
          >
            🖨 Print calendar
          </Link>
        </div>
      </div>
    </>
  )
}
