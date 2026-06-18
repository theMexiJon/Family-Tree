'use client'

import { useState } from 'react'
import { deletePerson } from '@/app/actions'
import DeleteButton from '@/app/components/DeleteButton'
import EditPersonModal from '../../EditPersonModal'
import type { Person } from '@/types'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(month: number | null, day: number | null, year: number | null) {
  if (!month && !day && !year) return null
  const parts: string[] = []
  if (month) parts.push(MONTHS_SHORT[month - 1])
  if (day) parts.push(String(day))
  if (year) parts.push(String(year))
  return parts.join(' ')
}

interface Props {
  people: Person[]
  calendarId: string
  ownerToken: string
  slug: string
}

export default function ManagePersonList({ people, calendarId, ownerToken, slug }: Props) {
  const [editing, setEditing] = useState<Person | null>(null)

  return (
    <>
      {people.length === 0 ? (
        <p className="text-sm text-[--color-ink-muted]">No people added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {people.map(person => {
            const birth = fmtDate(person.birth_month, person.birth_day, person.birth_year)
            const death = person.is_deceased
              ? fmtDate(person.death_month, person.death_day, person.death_year)
              : null
            const meta = [
              birth ? `Born ${birth}` : null,
              death ? `† ${death}` : person.is_deceased ? 'Deceased' : null,
              person.branch ?? null,
              `Added by ${person.added_by}`,
            ].filter(Boolean).join(' · ')

            return (
              <div
                key={person.id}
                className="flex items-center gap-3 rounded-xl border border-[--color-paper-dark] bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[--color-ink]">
                    {person.full_name}
                    {person.maiden_name && (
                      <span className="font-normal text-[--color-ink-muted]"> née {person.maiden_name}</span>
                    )}
                  </p>
                  {meta && <p className="truncate text-xs text-[--color-ink-muted]">{meta}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditing(person)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] transition-colors hover:bg-[--color-paper] hover:text-[--color-ink]"
                  >
                    Edit
                  </button>

                  <form action={deletePerson}>
                    <input type="hidden" name="id" value={person.id} />
                    <input type="hidden" name="calendar_id" value={calendarId} />
                    <input type="hidden" name="owner_token" value={ownerToken} />
                    <input type="hidden" name="slug" value={slug} />
                    <DeleteButton
                      label="Delete"
                      confirmMessage={`Delete ${person.full_name} and all their relationships?`}
                    />
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <EditPersonModal
          person={editing}
          slug={slug}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
