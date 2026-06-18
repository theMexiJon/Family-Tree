import { notFound } from 'next/navigation'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, getUserDisplayName } from '@/lib/supabase/session'
import type { Person, Relationship } from '@/types'
import AddPersonForm from './AddPersonForm'
import AddRelationshipForm from './AddRelationshipForm'
import TreeWrapper from './TreeWrapper'
import AuthButton from '@/app/components/AuthButton'

export const dynamic = 'force-dynamic'

export default async function CalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [supabase, user] = await Promise.all([
    Promise.resolve(createServerClient()),
    getSessionUser(),
  ])

  const userName = getUserDisplayName(user)

  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).single()

  if (!calendar) notFound()

  const [{ data: people }, { data: relationships }] = await Promise.all([
    supabase.from('people').select('*').eq('calendar_id', calendar.id).order('full_name'),
    supabase.from('relationships').select('*').eq('calendar_id', calendar.id),
  ])

  const personList: Person[] = people ?? []
  const relList: Relationship[] = relationships ?? []
  const peopleForForms = personList.map(p => ({ id: p.id, full_name: p.full_name }))

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-[--color-ink]">
              {calendar.name}
            </h1>
            <p className="mt-1 text-sm text-[--color-ink-muted]">
              {personList.length} {personList.length === 1 ? 'person' : 'people'} ·{' '}
              {relList.length} {relList.length === 1 ? 'relationship' : 'relationships'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AuthButton userName={userName} returnTo={`/c/${slug}`} />
            <span className="text-2xl">🌳</span>
          </div>
        </div>

        {/* Tree canvas */}
        <TreeWrapper
          people={personList}
          relationships={relList}
          slug={slug}
          calendarId={calendar.id}
          savedPositions={calendar.node_positions ?? {}}
        />

        {personList.length > 0 && (
          <p className="mt-2 text-center text-xs text-[--color-ink-faint]">
            Pan by dragging · Zoom with scroll · Click ✎ Edit on any card to update info
          </p>
        )}

        {/* Forms */}
        <div className={`mt-8 grid gap-5 ${personList.length >= 2 ? 'sm:grid-cols-2' : ''}`}>
          <div className="rounded-2xl border border-[--color-paper-dark] bg-white p-6">
            <h2 className="font-display text-lg font-medium text-[--color-ink]">Add a family member</h2>
            <p className="mt-1 text-xs text-[--color-ink-muted]">
              All fields except name are optional.
            </p>
            <AddPersonForm
              calendarId={calendar.id}
              slug={slug}
              people={peopleForForms}
              showMemorial={calendar.show_memorial}
              userName={userName}
            />
          </div>

          {personList.length >= 2 && (
            <div className="rounded-2xl border border-[--color-paper-dark] bg-white p-6">
              <h2 className="font-display text-lg font-medium text-[--color-ink]">Link two people</h2>
              <p className="mt-1 text-xs text-[--color-ink-muted]">
                Connect existing family members with a relationship.
              </p>
              <div className="mt-5">
                <AddRelationshipForm
                  calendarId={calendar.id}
                  slug={slug}
                  people={peopleForForms}
                />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-[--color-paper-dark] bg-[--color-surface] p-6 text-center">
          <p className="font-display text-base font-medium text-[--color-ink]">
            Want your own family calendar?
          </p>
          <p className="mt-1 text-sm text-[--color-ink-muted]">
            Create a separate tree to share with your immediate or extended family.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[--color-accent] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              🌱 Start your own tree
            </Link>
            <Link
              href={`/c/${slug}/print`}
              className="inline-flex items-center gap-2 rounded-lg border border-[--color-paper-dark] px-5 py-2.5 text-sm font-medium text-[--color-ink-muted] hover:bg-[--color-paper-dark]"
            >
              🖨 Print calendar
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
