'use client'

import { useState } from 'react'
import type { Person, Relationship } from '@/types'
import PersonProfileModal from './PersonProfileModal'

interface Props {
  people: Person[]
  relationships: Relationship[]
  slug: string
  calendarId: string
  searchQuery: string
}

export default function MobilePersonList({ people, relationships, slug, calendarId, searchQuery }: Props) {
  const [viewing, setViewing] = useState<Person | null>(null)

  const filtered = searchQuery.trim()
    ? people.filter(p =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.maiden_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : people

  if (filtered.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-[--color-ink-muted]">
          {searchQuery ? `No results for "${searchQuery}"` : 'No people added yet.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {filtered.map(person => {
          const relCount = relationships.filter(
            r => r.person_a_id === person.id || r.person_b_id === person.id,
          ).length

          const birthYear = person.birth_year ? `b. ${person.birth_year}` : null
          const meta = [birthYear, person.branch, relCount > 0 ? `${relCount} relationship${relCount > 1 ? 's' : ''}` : null]
            .filter(Boolean).join(' · ')

          return (
            <button
              key={person.id}
              onClick={() => setViewing(person)}
              className="flex items-center gap-4 rounded-xl border border-[--color-paper-dark] bg-[--color-surface] p-4 text-left transition-colors hover:border-[--color-ink-faint]"
            >
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt={person.full_name}
                  className="h-14 w-14 shrink-0 rounded-full border border-[--color-paper-dark] object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[--color-paper-dark] text-2xl">
                  👤
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-[--color-ink] truncate">
                  {person.full_name}
                </p>
                {person.maiden_name && (
                  <p className="text-xs italic text-[--color-ink-muted]">née {person.maiden_name}</p>
                )}
                {meta && <p className="mt-0.5 text-xs text-[--color-ink-muted]">{meta}</p>}
              </div>
              <span className="shrink-0 text-lg text-[--color-ink-faint]">›</span>
            </button>
          )
        })}
      </div>

      {viewing && (
        <PersonProfileModal
          person={viewing}
          people={people}
          relationships={relationships}
          slug={slug}
          calendarId={calendarId}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}
