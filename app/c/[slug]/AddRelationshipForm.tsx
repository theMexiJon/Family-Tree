'use client'

import { useState } from 'react'
import { addRelationship } from '@/app/actions'
import SubmitButton from '@/app/components/SubmitButton'
import type { Person } from '@/types'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const SELECT = 'rounded-lg border border-[--color-paper-dark] px-2 py-2 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'
const INPUT = 'rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'

interface Props {
  calendarId: string
  slug: string
  people: { id: string; full_name: string }[]
}

export default function AddRelationshipForm({ calendarId, slug, people }: Props) {
  const [type, setType] = useState<'partner' | 'parent_child' | 'sibling'>('partner')
  const [personA, setPersonA] = useState('')
  const [personB, setPersonB] = useState('')

  const otherPeople = (excludeId: string) => people.filter(p => p.id !== excludeId)

  return (
    <form action={addRelationship} className="flex flex-col gap-4">
      <input type="hidden" name="calendar_id" value={calendarId} />
      <input type="hidden" name="slug" value={slug} />

      {/* Type */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[--color-ink]">Relationship type</span>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
            <input
              type="radio" name="type" value="partner"
              checked={type === 'partner'}
              onChange={() => setType('partner')}
              className="accent-[--color-accent]"
            />
            Partner / Spouse
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
            <input
              type="radio" name="type" value="parent_child"
              checked={type === 'parent_child'}
              onChange={() => setType('parent_child')}
              className="accent-[--color-accent]"
            />
            Parent → Child
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
            <input
              type="radio" name="type" value="sibling"
              checked={type === 'sibling'}
              onChange={() => setType('sibling')}
              className="accent-[--color-accent]"
            />
            Siblings
          </label>
        </div>
      </div>

      {/* Person selects */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[--color-ink-muted]">
            {type === 'partner' ? 'Person A' : type === 'sibling' ? 'Sibling A' : 'Parent'}
          </label>
          <select
            name="person_a_id"
            value={personA}
            onChange={e => setPersonA(e.target.value)}
            required
            className={`w-full ${SELECT}`}
          >
            <option value="">Select…</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <span className="mt-5 text-sm text-[--color-ink-muted]">
          {type === 'partner' ? '❤' : '→'}
        </span>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[--color-ink-muted]">
            {type === 'partner' ? 'Person B' : type === 'sibling' ? 'Sibling B' : 'Child'}
          </label>
          <select
            name="person_b_id"
            value={personB}
            onChange={e => setPersonB(e.target.value)}
            required
            className={`w-full ${SELECT}`}
          >
            <option value="">Select…</option>
            {(personA ? otherPeople(personA) : people).map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Partner-only fields (hidden for sibling/parent_child) */}
      {type === 'partner' && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[--color-ink]">Status</span>
            <div className="flex gap-4">
              {(['married', 'partners', 'divorced'] as const).map(s => (
                <label key={s} className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
                  <input
                    type="radio" name="status" value={s}
                    defaultChecked={s === 'married'}
                    className="accent-[--color-accent]"
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[--color-ink]">
              Wedding date{' '}
              <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span>
            </span>
            <div className="flex gap-2">
              <select name="wedding_month" className={`flex-1 ${SELECT}`}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select name="wedding_day" className={`w-20 ${SELECT}`}>
                <option value="">Day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                name="wedding_year" type="number" min={1800} max={new Date().getFullYear()}
                placeholder="Year"
                className={`w-24 ${INPUT}`}
              />
            </div>
          </div>
        </>
      )}

      {/* Added by */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[--color-ink]">
          Your name <span className="text-[--color-accent]">*</span>
        </label>
        <input
          name="added_by" type="text" required maxLength={80}
          placeholder="e.g. Sarah Johnson"
          className={`w-full ${INPUT}`}
        />
      </div>

      <SubmitButton label="Link these people" />
    </form>
  )
}
