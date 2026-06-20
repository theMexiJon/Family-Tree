'use client'

import { useState, useEffect, useTransition } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { addLifeEventPhoto, deleteLifeEventPhoto } from '@/app/actions'
import PhotoUpload from '@/app/components/PhotoUpload'
import type { LifeEventPhoto } from '@/types'

const EVENT_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  birthday:    { label: 'Birthday',    emoji: '🎂' },
  anniversary: { label: 'Anniversary', emoji: '💍' },
  memorial:    { label: 'Memorial',    emoji: '🕊' },
  custom:      { label: 'Custom',      emoji: '📸' },
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - i)

interface Props {
  personId: string
  calendarId: string
  slug: string
}

export default function EventPhotoGallery({ personId, calendarId, slug }: Props) {
  const [photos, setPhotos] = useState<LifeEventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')

  async function loadPhotos() {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('life_event_photos')
      .select('*')
      .eq('person_id', personId)
      .order('event_year', { ascending: false })
      .order('created_at', { ascending: true })
    setPhotos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadPhotos() }, [personId])

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!photoUrl) { setError('Please upload a photo first.'); return }
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('calendar_id', calendarId)
    formData.set('person_id', personId)
    formData.set('slug', slug)
    formData.set('photo_url', photoUrl)

    startTransition(async () => {
      try {
        await addLifeEventPhoto(formData)
        setAdding(false)
        setPhotoUrl('')
        await loadPhotos()
      } catch {
        setError('Failed to add photo — please try again.')
      }
    })
  }

  function handleDelete(photo: LifeEventPhoto) {
    const formData = new FormData()
    formData.set('id', photo.id)
    formData.set('calendar_id', calendarId)
    formData.set('slug', slug)

    startTransition(async () => {
      await deleteLifeEventPhoto(formData)
      await loadPhotos()
    })
  }

  // Group photos by event_type + event_year
  const grouped = photos.reduce<Record<string, LifeEventPhoto[]>>((acc, p) => {
    const key = `${p.event_type}::${p.event_year}`
    acc[key] = [...(acc[key] ?? []), p]
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const [, yearA] = a.split('::')
    const [, yearB] = b.split('::')
    return Number(yearB) - Number(yearA)
  })

  if (loading) {
    return <p className="mt-4 text-xs text-[--color-ink-faint]">Loading photos…</p>
  }

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[--color-ink-faint]">
          Event Photos
        </p>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setError(null) }}
            className="rounded-lg border border-[--color-paper-dark] px-2.5 py-1 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
          >
            + Add photo
          </button>
        )}
      </div>

      {/* Add photo form */}
      {adding && (
        <form
          onSubmit={handleAddSubmit}
          className="mb-4 flex flex-col gap-3 rounded-xl border border-[--color-paper-dark] bg-[--color-paper] p-4"
        >
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-[--color-ink]">Event</label>
              <select
                name="event_type"
                defaultValue="birthday"
                className="rounded-lg border border-[--color-paper-dark] px-2 py-1.5 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([val, { label, emoji }]) => (
                  <option key={val} value={val}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[--color-ink]">Year</label>
              <select
                name="event_year"
                defaultValue={CURRENT_YEAR}
                className="rounded-lg border border-[--color-paper-dark] px-2 py-1.5 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[--color-ink]">Caption <span className="font-normal text-[--color-ink-faint]">(optional)</span></label>
            <input
              name="caption"
              type="text"
              maxLength={200}
              placeholder="e.g. Grandma's 80th!"
              className="rounded-lg border border-[--color-paper-dark] px-3 py-1.5 text-sm text-[--color-ink] placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
            />
          </div>

          <PhotoUpload
            currentUrl={null}
            fieldName="_photo_url_ignored"
            onUpload={setPhotoUrl}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAdding(false); setPhotoUrl(''); setError(null) }}
              className="flex-1 rounded-lg border border-[--color-paper-dark] px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !photoUrl}
              className="flex-1 rounded-lg bg-[--color-accent] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Saving…' : 'Add photo'}
            </button>
          </div>
        </form>
      )}

      {/* Photo groups */}
      {groupKeys.length === 0 && !adding && (
        <p className="text-sm text-[--color-ink-faint]">No event photos yet — add the first one!</p>
      )}

      {groupKeys.map(key => {
        const [type, year] = key.split('::')
        const { label, emoji } = EVENT_TYPE_LABELS[type] ?? { label: type, emoji: '📸' }
        return (
          <div key={key} className="mb-4">
            <p className="mb-2 text-xs font-medium text-[--color-ink-muted]">
              {emoji} {label} {year}
            </p>
            <div className="flex flex-wrap gap-2">
              {grouped[key].map(photo => (
                <div key={photo.id} className="group relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption ?? `${label} ${year}`}
                    className="h-20 w-20 rounded-lg border border-[--color-paper-dark] object-cover shadow-sm"
                  />
                  {photo.caption && (
                    <p className="mt-0.5 max-w-[80px] truncate text-center text-[10px] text-[--color-ink-faint]">
                      {photo.caption}
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={isPending}
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow group-hover:flex"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
