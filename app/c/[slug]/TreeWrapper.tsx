'use client'

import dynamic from 'next/dynamic'
import type { Person, Relationship } from '@/types'

const FamilyTreeCanvas = dynamic(() => import('./FamilyTreeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[580px] items-center justify-center rounded-2xl border border-[--color-paper-dark] bg-[--color-paper]">
      <p className="text-sm text-[--color-ink-muted]">Loading tree…</p>
    </div>
  ),
})

interface Props {
  people: Person[]
  relationships: Relationship[]
  slug: string
  calendarId: string
  savedPositions: Record<string, { x: number; y: number }>
}

export default function TreeWrapper({ people, relationships, slug, calendarId, savedPositions }: Props) {
  return (
    <FamilyTreeCanvas
      people={people}
      relationships={relationships}
      slug={slug}
      calendarId={calendarId}
      savedPositions={savedPositions}
    />
  )
}
