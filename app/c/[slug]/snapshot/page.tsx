import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import type { Person, Relationship } from '@/types'
import ShareButtons from './ShareButtons'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtYears(p: Person) {
  const birth = p.birth_year ? `b. ${p.birth_year}` : null
  const death = p.is_deceased ? (p.death_year ? `† ${p.death_year}` : '†') : null
  return [birth, death].filter(Boolean).join(' · ')
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServerClient()
  const { data: cal } = await supabase.from('calendars').select('name').eq('slug', slug).single()
  const name = cal?.name ?? 'Family Tree'
  return {
    title: `${name} — Family Tree`,
    description: `Meet the ${name}. View our family tree.`,
    openGraph: {
      title: `${name} — Family Tree`,
      description: `Meet the ${name}.`,
      images: [{ url: `/c/${slug}/share-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Family Tree`,
      images: [`/c/${slug}/share-image`],
    },
  }
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).single()

  if (!calendar) notFound()

  const [{ data: people }, { data: relationships }] = await Promise.all([
    supabase.from('people').select('*').eq('calendar_id', calendar.id).order('full_name'),
    supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
  ])

  const personList: Person[]    = people ?? []
  const relList: Relationship[] = relationships ?? []

  const headersList = await headers()
  const host        = headersList.get('host') ?? 'localhost:3000'
  const proto       = host.startsWith('localhost') ? 'http' : 'https'
  const base        = `${proto}://${host}`
  const shareUrl    = `${base}/c/${slug}/snapshot`
  const imageUrl    = `${base}/c/${slug}/share-image`

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-5xl">🌳</div>
          <h1 className="font-display text-4xl font-bold text-[--color-ink]">{calendar.name}</h1>
          <p className="mt-2 text-[--color-ink-muted]">
            {personList.length} {personList.length === 1 ? 'member' : 'members'}
            {relList.length > 0 && ` · ${relList.length} ${relList.length === 1 ? 'relationship' : 'relationships'}`}
          </p>
        </div>

        {/* People grid */}
        {personList.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {personList.map(person => (
              <div
                key={person.id}
                className="flex flex-col items-center gap-3 rounded-xl border border-[--color-paper-dark] bg-[--color-surface] p-5 text-center"
              >
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt={person.full_name}
                    className="h-16 w-16 rounded-full border-2 border-[--color-paper-dark] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-paper-dark] text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <p className="font-display text-sm font-semibold text-[--color-ink]">
                    {person.full_name}
                  </p>
                  {person.maiden_name && (
                    <p className="text-xs italic text-[--color-ink-muted]">née {person.maiden_name}</p>
                  )}
                  {fmtYears(person) && (
                    <p className="mt-0.5 text-xs text-[--color-ink-muted]">{fmtYears(person)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Relationships summary */}
        {relList.length > 0 && (
          <div className="mb-8 rounded-xl border border-[--color-paper-dark] bg-[--color-surface] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--color-ink-faint]">
              Relationships
            </p>
            <div className="flex flex-wrap gap-2">
              {relList.map(rel => {
                const a = personList.find(p => p.id === rel.person_a_id)
                const b = personList.find(p => p.id === rel.person_b_id)
                if (!a || !b) return null
                const label = rel.type === 'partner'
                  ? `💍 ${a.full_name.split(' ')[0]} & ${b.full_name.split(' ')[0]}`
                  : rel.type === 'sibling'
                    ? `🤝 ${a.full_name.split(' ')[0]} & ${b.full_name.split(' ')[0]}`
                    : `👪 ${a.full_name.split(' ')[0]} → ${b.full_name.split(' ')[0]}`
                return (
                  <span
                    key={rel.id}
                    className="rounded-full bg-[--color-paper-dark] px-3 py-1 text-xs text-[--color-ink-muted]"
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Share section */}
        <ShareButtons
          shareUrl={shareUrl}
          imageUrl={imageUrl}
          calendarName={calendar.name}
        />

        <div className="mt-6 flex justify-center gap-4 text-xs text-[--color-ink-faint]">
          <Link href={`/c/${slug}`} className="hover:text-[--color-ink-muted]">← Back to tree</Link>
          <span>·</span>
          <span>Read-only · no editing from this link</span>
        </div>
      </div>
    </main>
  )
}
