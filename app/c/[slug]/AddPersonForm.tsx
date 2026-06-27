'use client'

import { useState } from 'react'
import { addPerson } from '@/app/actions'
import SubmitButton from '@/app/components/SubmitButton'
import PhotoUpload from '@/app/components/PhotoUpload'
import type { Person } from '@/types'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const INPUT = 'rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'
const SELECT = 'rounded-lg border border-[--color-paper-dark] px-2 py-2 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'
const LABEL = 'text-sm font-medium text-[--color-ink]'
const OPTIONAL = 'text-xs font-normal text-[--color-ink-faint]'

// Track whether the optional relationship section is expanded
// Default: collapsed so the primary path is "just add person details"

interface Props {
  calendarId: string
  slug: string
  people: { id: string; full_name: string }[]
  showMemorial: boolean
  userName: string | null
}

export default function AddPersonForm({ calendarId, slug, people, showMemorial, userName }: Props) {
  const [isDeceased, setIsDeceased] = useState(false)
  const [showRelSection, setShowRelSection] = useState(false)
  const [relatedTo, setRelatedTo] = useState('')
  const [relType, setRelType] = useState('partner')

  return (
    <form action={addPerson} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="calendar_id" value={calendarId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" />

      {/* Who's adding — auto-filled if signed in */}
      {userName ? (
        <>
          <input type="hidden" name="added_by" value={userName} />
          <p className="text-xs text-[--color-ink-faint]">
            Adding as <span className="font-medium text-[--color-ink-muted]">{userName}</span>
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="added_by" className={LABEL}>
            Your name <span className="text-[--color-accent]">*</span>
          </label>
          <input
            id="added_by" name="added_by" type="text" required maxLength={80}
            placeholder="e.g. Sarah Johnson"
            className={INPUT}
          />
        </div>
      )}

      {/* Photo */}
      <div className="flex flex-col gap-1">
        <span className={LABEL}>Photo <span className={OPTIONAL}>(optional)</span></span>
        <PhotoUpload />
      </div>

      {/* Their name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="full_name" className={LABEL}>
          Their name <span className="text-[--color-accent]">*</span>
        </label>
        <input
          id="full_name" name="full_name" type="text" required maxLength={120}
          placeholder="e.g. Robert Johnson"
          className={INPUT}
        />
      </div>

      {/* Maiden name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="maiden_name" className={LABEL}>
          Maiden / birth name <span className={OPTIONAL}>(optional)</span>
        </label>
        <input
          id="maiden_name" name="maiden_name" type="text" maxLength={120}
          placeholder="e.g. Williams"
          className={INPUT}
        />
      </div>

      {/* Birthday */}
      <div className="flex flex-col gap-1">
        <span className={LABEL}>Birthday <span className={OPTIONAL}>(optional)</span></span>
        <div className="flex gap-2">
          <select name="birth_month" className={`flex-1 ${SELECT}`}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select name="birth_day" className={`w-20 ${SELECT}`}>
            <option value="">Day</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            name="birth_year" type="number" min={1800} max={new Date().getFullYear()}
            placeholder="Year"
            className={`w-24 ${INPUT}`}
          />
        </div>
      </div>

      {/* Deceased */}
      {showMemorial && (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
            <input
              type="checkbox" name="is_deceased"
              className="accent-[--color-accent]"
              checked={isDeceased}
              onChange={e => setIsDeceased(e.target.checked)}
            />
            Passed away
          </label>

          {isDeceased && (
            <div className="flex flex-col gap-1 pl-5">
              <span className={LABEL}>Date of passing <span className={OPTIONAL}>(optional)</span></span>
              <div className="flex gap-2">
                <select name="death_month" className={`flex-1 ${SELECT}`}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select name="death_day" className={`w-20 ${SELECT}`}>
                  <option value="">Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input
                  name="death_year" type="number" min={1800} max={new Date().getFullYear()}
                  placeholder="Year"
                  className={`w-24 ${INPUT}`}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Branch */}
      <div className="flex flex-col gap-1">
        <label htmlFor="branch" className={LABEL}>
          Family branch <span className={OPTIONAL}>(optional, e.g. "Mom's side")</span>
        </label>
        <input
          id="branch" name="branch" type="text" maxLength={80}
          placeholder="e.g. Dad's side"
          className={INPUT}
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className={LABEL}>
          Short bio <span className={OPTIONAL}>(optional)</span>
        </label>
        <textarea
          id="bio" name="bio" rows={2} maxLength={500}
          placeholder="A few words about them…"
          className={INPUT}
        />
      </div>

      {/* Relationship — hidden by default; owner can connect people later via "Link two people" */}
      {people.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => { setShowRelSection(v => !v); if (showRelSection) setRelatedTo('') }}
            className="flex items-center gap-1.5 text-xs font-medium text-[--color-ink-faint] hover:text-[--color-ink-muted]"
          >
            <span>{showRelSection ? '▾' : '▸'}</span>
            {showRelSection ? 'Remove relationship' : 'Also link to an existing person (optional)'}
          </button>
        </div>
      )}

      {people.length > 0 && showRelSection && (
        <div className="flex flex-col gap-3 rounded-xl border border-[--color-paper-dark] p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="related_to" className={LABEL}>
              Related to
            </label>
            <select
              id="related_to" name="related_to"
              value={relatedTo}
              onChange={e => setRelatedTo(e.target.value)}
              className={`w-full ${SELECT}`}
            >
              <option value="">Select a person…</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          {relatedTo && (
            <>
              <div className="flex flex-col gap-2">
                <span className={LABEL}>Relationship</span>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
                    <input type="radio" name="rel_type" value="partner" checked={relType === 'partner'} onChange={() => setRelType('partner')} className="accent-[--color-accent]" />
                    Partner / Spouse
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
                    <input type="radio" name="rel_type" value="parent_child" checked={relType === 'parent_child'} onChange={() => setRelType('parent_child')} className="accent-[--color-accent]" />
                    Parent / Child
                  </label>
                </div>
              </div>

              {relType === 'partner' && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className={LABEL}>Status</span>
                    <div className="flex gap-4">
                      {(['married', 'partners', 'divorced'] as const).map(s => (
                        <label key={s} className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
                          <input type="radio" name="rel_status" value={s} defaultChecked={s === 'married'} className="accent-[--color-accent]" />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={LABEL}>Wedding date <span className={OPTIONAL}>(optional)</span></span>
                    <div className="flex gap-2">
                      <select name="wedding_month" className={`flex-1 ${SELECT}`}>
                        <option value="">Month</option>
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                      <select name="wedding_day" className={`w-20 ${SELECT}`}>
                        <option value="">Day</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input name="wedding_year" type="number" min={1800} max={new Date().getFullYear()} placeholder="Year" className={`w-24 ${INPUT}`} />
                    </div>
                  </div>
                </>
              )}

              {relType === 'parent_child' && (
                <div className="flex flex-col gap-2">
                  <span className={LABEL}>This new person is the…</span>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
                      <input type="radio" name="direction" value="child" defaultChecked className="accent-[--color-accent]" />
                      Child (the selected person is their parent)
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-[--color-ink]">
                      <input type="radio" name="direction" value="parent" className="accent-[--color-accent]" />
                      Parent (the selected person is their child)
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <SubmitButton label="Add to family tree" />
    </form>
  )
}
