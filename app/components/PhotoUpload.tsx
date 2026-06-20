'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Props {
  currentUrl?: string | null
  fieldName?: string
  onUpload?: (url: string) => void
}

export default function PhotoUpload({ currentUrl, fieldName = 'photo_url', onUpload }: Props) {
  const [url, setUrl] = useState(currentUrl ?? '')
  const [preview, setPreview] = useState(currentUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = getSupabaseClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `person-${Date.now()}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError || !data) {
      setError('Upload failed — please try again.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(data.path)
    setUrl(publicUrl)
    setPreview(URL.createObjectURL(file))
    setUploading(false)
    onUpload?.(publicUrl)
  }

  function remove() {
    setUrl('')
    setPreview('')
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={fieldName} value={url} />

      {preview ? (
        <div className="flex items-center gap-3">
          <img
            src={preview}
            alt="Photo preview"
            className="h-16 w-16 rounded-full border-2 border-[--color-paper-dark] object-cover shadow-sm"
          />
          <div className="flex flex-col gap-1.5">
            <label className="cursor-pointer rounded-lg border border-[--color-paper-dark] px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] hover:bg-[--color-paper]">
              {uploading ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={remove}
              className="text-left text-xs text-[--color-ink-faint] hover:text-red-500"
            >
              Remove photo
            </button>
          </div>
        </div>
      ) : (
        <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-[--color-paper-dark] px-4 py-3 text-sm text-[--color-ink-muted] transition-colors hover:bg-[--color-paper] ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
          <span className="text-xl">📷</span>
          <span>{uploading ? 'Uploading…' : 'Add a photo'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
