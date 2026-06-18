'use client'

import { useState, useTransition } from 'react'
import { updatePerson } from '@/app/actions'
import PhotoUpload from '@/app/components/PhotoUpload'
import type { Person } from '@/types'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const INPUT = 'w-full rounded-lg border border-[--color-paper-dark] px-3 py-2 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'
const SELECT = 'rounded-lg border border-[--color-paper-dark] px-2 py-2 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]'

interface Props {
  person: Person
  slug: string
  onClose: () => void
}

export default function EditPersonModal({ person, slug, onClose }: Props) {
  const [isDeceased, setIsDeceased] = useState(person.is_deceased)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updatePerson(formData)
        onClose()
      } catch {
        setError('Failed to save — please try again.')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[--color-paper-dark] bg-white px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-[--color-ink]">Edit person</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[--color-ink-faint] hover:bg-[--color-paper] hover:text-[--color-ink]">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <input type="hidden" name="id" value={person.id} />
          <input type="hidden" name="slug" value={slug} />

          {/* Photo */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[--color-ink]">Photo <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span></span>
            <PhotoUpload currentUrl={person.photo_url} />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[--color-ink]">Full name <span className="text-[--color-accent]">*</span></label>
            <input name="full_name" type="text" required maxLength={120} defaultValue={person.full_name} className={INPUT} />
          </div>

          {/* Maiden name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[--color-ink]">Maiden / birth name <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span></label>
            <input name="maiden_name" type="text" maxLength={120} defaultValue={person.maiden_name ?? ''} className={INPUT} />
          </div>

          {/* Birthday */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[--color-ink]">Birthday <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span></span>
            <div className="flex gap-2">
              <select name="birth_month" defaultValue={person.birth_month ?? ''} className={`flex-1 ${SELECT}`}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select name="birth_day" defaultValue={person.birth_day ?? ''} className={`w-20 ${SELECT}`}>
                <option value="">Day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input name="birth_year" type="number" min={1800} max={new Date().getFullYear()} defaultValue={person.birth_year ?? ''} placeholder="Year" className={`w-24 ${INPUT}`} />
            </div>
          </div>

          {/* Deceased */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[--color-ink]">
            <input type="checkbox" name="is_deceased" className="accent-[--color-accent]" checked={isDeceased} onChange={e => setIsDeceased(e.target.checked)} />
            Passed away
          </label>

          {isDeceased && (
            <div className="flex flex-col gap-1 pl-5">
              <span className="text-sm font-medium text-[--color-ink]">Date of passing <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span></span>
              <div className="flex gap-2">
                <select name="death_month" defaultValue={person.death_month ?? ''} className={`flex-1 ${SELECT}`}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select name="death_day" defaultValue={person.death_day ?? ''} className={`w-20 ${SELECT}`}>
                  <option value="">Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input name="death_year" type="number" min={1800} max={new Date().getFullYear()} defaultValue={person.death_year ?? ''} placeholder="Year" className={`w-24 ${INPUT}`} />
              </div>
            </div>
          )}

          {/* Branch */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[--color-ink]">Family branch <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span></label>
            <input name="branch" type="text" maxLength={80} defaultValue={person.branch ?? ''} className={INPUT} />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[--color-ink]">Bio <span className="text-xs font-normal text-[--color-ink-faint]">(optional)</span></label>
            <textarea name="bio" rows={3} maxLength={500} defaultValue={person.bio ?? ''} className={INPUT} />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[--color-paper-dark] px-4 py-2.5 text-sm font-medium text-[--color-ink-muted] hover:bg-[--color-paper]">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[--color-accent] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
