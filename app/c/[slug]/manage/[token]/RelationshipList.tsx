'use client'

import { useState, useTransition } from 'react'
import { deleteRelationship, editRelationship } from '@/app/actions'
import type { Person, Relationship } from '@/types'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const SELECT = 'rounded-lg border border-[--color-paper-dark] bg-[--color-surface] px-2 py-1.5 text-xs text-[--color-ink] focus:outline-none focus:ring-1 focus:ring-[--color-accent]'

function fmtDate(m: number | null, d: number | null, y: number | null) {
  if (!m && !d && !y) return null
  const parts: string[] = []
  if (m) parts.push(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1])
  if (d) parts.push(String(d))
  if (y) parts.push(String(y))
  return parts.join(' ')
}

interface Props {
  relationships: Relationship[]
  people: Person[]
  calendarId: string
  ownerToken: string
  slug: string
}

export default function RelationshipList({ relationships, people, calendarId, ownerToken, slug }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function personName(id: string) {
    return people.find(p => p.id === id)?.full_name ?? '?'
  }

  function handleEdit(formData: FormData) {
    startTransition(async () => {
      await editRelationship(formData)
      setEditing(null)
    })
  }

  if (relationships.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-lg font-medium text-[--color-ink]">
        Relationships ({relationships.length})
      </h2>
      <div className="flex flex-col gap-2">
        {relationships.map(rel => {
          const a = personName(rel.person_a_id)
          const b = personName(rel.person_b_id)
          const label = rel.type === 'partner'
            ? `${a} & ${b}${rel.status ? ` — ${rel.status}` : ''}`
            : rel.type === 'sibling'
              ? `${a} ~ sibling ~ ${b}`
              : `${a} → parent of → ${b}`
          const wedding = rel.type === 'partner' ? fmtDate(rel.wedding_month, rel.wedding_day, rel.wedding_year) : null
          const isEdit  = editing === rel.id

          return (
            <div key={rel.id} className="rounded-xl border border-[--color-paper-dark] bg-[--color-surface]">
              {/* Summary row */}
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[--color-ink]">{label}</p>
                  {wedding && <p className="text-xs text-[--color-ink-muted]">Wed {wedding}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  {rel.type === 'partner' && (
                    <button
                      onClick={() => setEditing(isEdit ? null : rel.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
                    >
                      {isEdit ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                  <form action={deleteRelationship}>
                    <input type="hidden" name="id"          value={rel.id} />
                    <input type="hidden" name="calendar_id" value={calendarId} />
                    <input type="hidden" name="owner_token" value={ownerToken} />
                    <input type="hidden" name="slug"        value={slug} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              {/* Inline edit form (partner only) */}
              {isEdit && rel.type === 'partner' && (
                <form action={handleEdit} className="border-t border-[--color-paper-dark] px-4 py-4 flex flex-wrap gap-3 items-end">
                  <input type="hidden" name="id"          value={rel.id} />
                  <input type="hidden" name="calendar_id" value={calendarId} />
                  <input type="hidden" name="owner_token" value={ownerToken} />
                  <input type="hidden" name="slug"        value={slug} />

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[--color-ink-faint]">Status</label>
                    <select name="status" defaultValue={rel.status ?? 'married'} className={SELECT}>
                      <option value="married">Married</option>
                      <option value="partners">Partners</option>
                      <option value="divorced">Divorced</option>
                    </select>
                  </div>

                  {/* Wedding date */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[--color-ink-faint]">Wedding date</label>
                    <div className="flex gap-1.5">
                      <select name="wedding_month" defaultValue={rel.wedding_month ?? ''} className={SELECT}>
                        <option value="">Month</option>
                        {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                      </select>
                      <select name="wedding_day" defaultValue={rel.wedding_day ?? ''} className={SELECT}>
                        <option value="">Day</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input
                        name="wedding_year" type="number" min={1800} max={new Date().getFullYear()}
                        defaultValue={rel.wedding_year ?? ''}
                        placeholder="Year"
                        className={`w-20 ${SELECT}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-[--color-accent] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {isPending ? 'Saving…' : 'Save'}
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
