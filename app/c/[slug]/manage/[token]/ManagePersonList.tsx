'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { deletePerson } from '@/app/actions'
import EditPersonModal from '../../EditPersonModal'
import type { Person } from '@/types'

const UNDO_SECONDS = 10

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(month: number | null, day: number | null, year: number | null) {
  if (!month && !day && !year) return null
  const parts: string[] = []
  if (month) parts.push(MONTHS_SHORT[month - 1])
  if (day) parts.push(String(day))
  if (year) parts.push(String(year))
  return parts.join(' ')
}

interface PendingDelete {
  person: Person
  secondsLeft: number
  timerId: ReturnType<typeof setInterval>
}

interface Props {
  people: Person[]
  calendarId: string
  ownerToken: string
  slug: string
}

export default function ManagePersonList({ people, calendarId, ownerToken, slug }: Props) {
  const [editing, setEditing]         = useState<Person | null>(null)
  const [pending, setPending]         = useState<PendingDelete | null>(null)
  const [, startTransition]           = useTransition()
  const commitRef                     = useRef<(() => void) | null>(null)

  // Clean up timer on unmount
  useEffect(() => () => { if (pending) clearInterval(pending.timerId) }, [])

  const startDelete = useCallback((person: Person) => {
    // Clear any existing pending delete
    if (pending) {
      clearInterval(pending.timerId)
      commitRef.current?.()  // commit the previous one immediately
    }

    const timerId = setInterval(() => {
      setPending(prev => {
        if (!prev) return null
        const next = prev.secondsLeft - 1
        if (next <= 0) {
          clearInterval(prev.timerId)
          commitRef.current?.()
          return null
        }
        return { ...prev, secondsLeft: next }
      })
    }, 1000)

    commitRef.current = () => {
      startTransition(async () => {
        const fd = new FormData()
        fd.set('id',          person.id)
        fd.set('calendar_id', calendarId)
        fd.set('owner_token', ownerToken)
        fd.set('slug',        slug)
        await deletePerson(fd)
      })
    }

    setPending({ person, secondsLeft: UNDO_SECONDS, timerId })
  }, [pending, calendarId, ownerToken, slug])

  const undoDelete = useCallback(() => {
    if (!pending) return
    clearInterval(pending.timerId)
    commitRef.current = null
    setPending(null)
  }, [pending])

  if (people.length === 0) {
    return <p className="text-sm text-[--color-ink-muted]">No people added yet.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {people.map(person => {
          const isPendingDelete = pending?.person.id === person.id
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
              className={`flex items-center gap-3 rounded-xl border border-[--color-paper-dark] bg-[--color-surface] p-4 transition-opacity ${
                isPendingDelete ? 'opacity-40' : ''
              }`}
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
                {isPendingDelete ? (
                  <button
                    onClick={undoDelete}
                    className="rounded-lg bg-[--color-accent] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Undo ({pending!.secondsLeft}s)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(person)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => startDelete(person)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Undo toast */}
      {pending && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] px-5 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            {/* Countdown ring */}
            <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
              <circle cx="14" cy="14" r="11" fill="none" stroke="#352c22" strokeWidth="3" />
              <circle
                cx="14" cy="14" r="11" fill="none"
                stroke="#d4623a" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 11}`}
                strokeDashoffset={`${2 * Math.PI * 11 * (1 - pending.secondsLeft / UNDO_SECONDS)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="text-sm text-[--color-ink]">
              Deleting <span className="font-semibold">{pending.person.full_name}</span>
            </span>
          </div>
          <button
            onClick={undoDelete}
            className="rounded-lg bg-[--color-accent] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Undo
          </button>
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
