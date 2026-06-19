'use client'

import { useState } from 'react'
import type { Person, Relationship } from '@/types'
import EditPersonModal from './EditPersonModal'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function fmtDate(m: number | null, d: number | null, y: number | null) {
  if (!m && !d && !y) return null
  return [m ? MONTHS[m - 1] : null, d, y].filter(Boolean).join(' ')
}

function calcAge(birthYear: number | null, endYear?: number | null): number | null {
  if (!birthYear) return null
  return (endYear ?? new Date().getFullYear()) - birthYear
}

interface Props {
  person: Person
  people: Person[]
  relationships: Relationship[]
  slug: string
  onClose: () => void
}

export default function PersonProfileModal({ person, people, relationships, slug, onClose }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <EditPersonModal
        person={person}
        slug={slug}
        onClose={() => setEditing(false)}
      />
    )
  }

  // Build relationship context
  const partners = relationships
    .filter(r => r.type === 'partner' && (r.person_a_id === person.id || r.person_b_id === person.id))
    .map(r => {
      const otherId = r.person_a_id === person.id ? r.person_b_id : r.person_a_id
      return { partner: people.find(p => p.id === otherId), rel: r }
    })
    .filter(x => x.partner)

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
    })
    .filter(Boolean) as Person[]

  const birthDate = fmtDate(person.birth_month, person.birth_day, person.birth_year)
  const deathDate = person.is_deceased ? fmtDate(person.death_month, person.death_day, person.death_year) : null
  const age = calcAge(person.birth_year, person.death_year)
  const hasRelationships = partners.length > 0 || parents.length > 0 || children.length > 0 || siblings.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[--color-surface] shadow-2xl">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[--color-paper-dark] bg-[--color-surface] px-6 py-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[--color-ink-faint]">Family member</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-[--color-accent] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              ✎ Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[--color-ink-faint] hover:bg-[--color-paper-dark] hover:text-[--color-ink]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Photo + name */}
          <div className="flex items-start gap-4">
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={person.full_name}
                className="h-20 w-20 shrink-0 rounded-full border-2 border-[--color-paper-dark] object-cover shadow"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[--color-paper-dark] text-3xl">
                👤
              </div>
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
                    {age !== null && person.death_year && (
                      <span className="ml-2 text-[--color-ink-muted]">· age {age}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {person.bio && (
            <p className="mt-4 text-sm leading-relaxed text-[--color-ink-muted]">{person.bio}</p>
          )}

          {/* Relationships */}
          {hasRelationships && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--color-ink-faint]">
                Relationships
              </p>
              <div className="space-y-2">
                {partners.map(({ partner, rel }) => partner && (
                  <div key={rel.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0">💍</span>
                    <span className="text-[--color-ink]">
                      {rel.status === 'divorced' ? 'Ex-partner of' : 'Partner of'}{' '}
                      <span className="font-semibold">{partner.full_name}</span>
                      {rel.status && rel.status !== 'married' && (
                        <span className="ml-1 text-[--color-ink-muted]">({rel.status})</span>
                      )}
                    </span>
                  </div>
                ))}
                {parents.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0">👪</span>
                    <span className="text-[--color-ink]">
                      Child of{' '}
                      <span className="font-semibold">{parents.map(p => p.full_name).join(' & ')}</span>
                    </span>
                  </div>
                )}
                {children.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0">👶</span>
                    <span className="text-[--color-ink]">
                      Parent of{' '}
                      <span className="font-semibold">{children.map(p => p.full_name).join(', ')}</span>
                    </span>
                  </div>
                )}
                {siblings.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0">🤝</span>
                    <span className="text-[--color-ink]">
                      Sibling of{' '}
                      <span className="font-semibold">{siblings.map(p => p.full_name).join(', ')}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="mt-5 text-xs text-[--color-ink-faint]">Added by {person.added_by}</p>
        </div>
      </div>
    </div>
  )
}
