'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser, getUserDisplayName } from '@/lib/supabase/session'
import { generateSlug, generateOwnerToken } from '@/lib/tokens'

// Resolves who did this action — logged-in user name wins over form field
async function resolveActor(formData: FormData): Promise<string> {
  const user = await getSessionUser()
  return (getUserDisplayName(user) ?? (formData.get('added_by') as string)?.trim()) || 'Anonymous'
}

export async function createCalendar(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const hemisphere = formData.get('hemisphere') as string
  const timezone = formData.get('timezone') as string
  const show_memorial = formData.get('show_memorial') === 'on'

  const honeypot = formData.get('_hp') as string
  if (honeypot) return

  if (!name || !['north', 'south'].includes(hemisphere) || !timezone) {
    throw new Error('Missing required fields')
  }

  const slug = generateSlug()
  const owner_token = generateOwnerToken()

  const user = await getSessionUser()

  const supabase = createServerClient()
  const { error } = await supabase.from('calendars').insert({
    slug, owner_token, name, hemisphere, timezone, show_memorial,
    user_id: user?.id ?? null,
  })

  if (error) throw new Error('Failed to create calendar')

  redirect(`/c/${slug}/created?owner=${owner_token}`)
}

export async function addPerson(formData: FormData) {
  const honeypot = formData.get('_hp') as string
  if (honeypot) return

  const calendar_id = formData.get('calendar_id') as string
  const slug = formData.get('slug') as string
  const full_name = (formData.get('full_name') as string)?.trim()
  const maiden_name = (formData.get('maiden_name') as string)?.trim() || null
  const birth_month = formData.get('birth_month') ? Number(formData.get('birth_month')) : null
  const birth_day = formData.get('birth_day') ? Number(formData.get('birth_day')) : null
  const birth_year = formData.get('birth_year') ? Number(formData.get('birth_year')) : null
  const is_deceased = formData.get('is_deceased') === 'on'
  const death_month = is_deceased && formData.get('death_month') ? Number(formData.get('death_month')) : null
  const death_day = is_deceased && formData.get('death_day') ? Number(formData.get('death_day')) : null
  const death_year = is_deceased && formData.get('death_year') ? Number(formData.get('death_year')) : null
  const bio = (formData.get('bio') as string)?.trim() || null
  const branch = (formData.get('branch') as string)?.trim() || null
  const photo_url = (formData.get('photo_url') as string)?.trim() || null
  const added_by = await resolveActor(formData)

  if (!calendar_id || !full_name) throw new Error('Missing required fields')

  const supabase = createServerClient()
  const { data: person, error } = await supabase
    .from('people')
    .insert({
      calendar_id, full_name, maiden_name,
      birth_month, birth_day, birth_year,
      is_deceased, death_month, death_day, death_year,
      bio, branch, photo_url, added_by,
    })
    .select('id')
    .single()

  if (error || !person) throw new Error('Failed to add person')

  const related_to = formData.get('related_to') as string
  const rel_type = formData.get('rel_type') as string

  if (related_to && (rel_type === 'partner' || rel_type === 'parent_child')) {
    const direction = formData.get('direction') as string
    const wedding_month = rel_type === 'partner' && formData.get('wedding_month') ? Number(formData.get('wedding_month')) : null
    const wedding_day = rel_type === 'partner' && formData.get('wedding_day') ? Number(formData.get('wedding_day')) : null
    const wedding_year = rel_type === 'partner' && formData.get('wedding_year') ? Number(formData.get('wedding_year')) : null
    const rel_status = (formData.get('rel_status') as string) || null

    const person_a_id = rel_type === 'parent_child' && direction === 'child' ? related_to : person.id
    const person_b_id = rel_type === 'parent_child' && direction === 'child' ? person.id : related_to

    await supabase.from('relationships').insert({
      calendar_id, type: rel_type, person_a_id, person_b_id,
      wedding_month, wedding_day, wedding_year,
      status: rel_status || null, added_by,
    })
  }

  revalidatePath(`/c/${slug}`)
  redirect(`/c/${slug}`)
}

export async function updatePerson(formData: FormData) {
  const id = formData.get('id') as string
  const slug = formData.get('slug') as string
  const full_name = (formData.get('full_name') as string)?.trim()
  const maiden_name = (formData.get('maiden_name') as string)?.trim() || null
  const birth_month = formData.get('birth_month') ? Number(formData.get('birth_month')) : null
  const birth_day = formData.get('birth_day') ? Number(formData.get('birth_day')) : null
  const birth_year = formData.get('birth_year') ? Number(formData.get('birth_year')) : null
  const is_deceased = formData.get('is_deceased') === 'on'
  const death_month = is_deceased && formData.get('death_month') ? Number(formData.get('death_month')) : null
  const death_day = is_deceased && formData.get('death_day') ? Number(formData.get('death_day')) : null
  const death_year = is_deceased && formData.get('death_year') ? Number(formData.get('death_year')) : null
  const bio = (formData.get('bio') as string)?.trim() || null
  const branch = (formData.get('branch') as string)?.trim() || null
  const photo_url = (formData.get('photo_url') as string)?.trim() || null

  if (!id || !full_name) throw new Error('Missing required fields')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('people')
    .update({
      full_name, maiden_name,
      birth_month, birth_day, birth_year,
      is_deceased, death_month, death_day, death_year,
      bio, branch, photo_url,
    })
    .eq('id', id)

  if (error) throw new Error('Failed to update person')

  revalidatePath(`/c/${slug}`)
}

export async function addRelationship(formData: FormData) {
  const calendar_id = formData.get('calendar_id') as string
  const slug = formData.get('slug') as string
  const person_a_id = formData.get('person_a_id') as string
  const person_b_id = formData.get('person_b_id') as string
  const type = formData.get('type') as 'partner' | 'parent_child'
  const status = (formData.get('status') as string) || null
  const wedding_month = formData.get('wedding_month') ? Number(formData.get('wedding_month')) : null
  const wedding_day = formData.get('wedding_day') ? Number(formData.get('wedding_day')) : null
  const wedding_year = formData.get('wedding_year') ? Number(formData.get('wedding_year')) : null
  const added_by = await resolveActor(formData)

  if (!calendar_id || !person_a_id || !person_b_id || !type) return
  if (person_a_id === person_b_id) return
  if (!['partner', 'parent_child'].includes(type)) return

  const supabase = createServerClient()

  // Prevent duplicate relationships
  const { data: existing } = await supabase
    .from('relationships')
    .select('id')
    .eq('calendar_id', calendar_id)
    .eq('type', type)
    .eq('person_a_id', person_a_id)
    .eq('person_b_id', person_b_id)
    .maybeSingle()
  if (existing) { revalidatePath(`/c/${slug}`); redirect(`/c/${slug}`) }

  await supabase.from('relationships').insert({
    calendar_id, type, person_a_id, person_b_id,
    status: type === 'partner' ? (status || 'married') : null,
    wedding_month, wedding_day, wedding_year, added_by,
  })

  revalidatePath(`/c/${slug}`)
  redirect(`/c/${slug}`)
}

export async function deletePerson(formData: FormData) {
  const id = formData.get('id') as string
  const calendar_id = formData.get('calendar_id') as string
  const owner_token = formData.get('owner_token') as string
  const slug = formData.get('slug') as string

  if (!id || !calendar_id || !owner_token) return

  const supabase = createServerClient()
  const { data: cal } = await supabase
    .from('calendars').select('id').eq('id', calendar_id).eq('owner_token', owner_token).single()
  if (!cal) return

  await supabase.from('people').delete().eq('id', id).eq('calendar_id', calendar_id)

  revalidatePath(`/c/${slug}`)
  revalidatePath(`/c/${slug}/manage/${owner_token}`)
}

export async function deleteRelationship(formData: FormData) {
  const id = formData.get('id') as string
  const calendar_id = formData.get('calendar_id') as string
  const owner_token = formData.get('owner_token') as string
  const slug = formData.get('slug') as string

  if (!id || !calendar_id || !owner_token) return

  const supabase = createServerClient()
  const { data: cal } = await supabase
    .from('calendars').select('id').eq('id', calendar_id).eq('owner_token', owner_token).single()
  if (!cal) return

  await supabase.from('relationships').delete().eq('id', id).eq('calendar_id', calendar_id)

  revalidatePath(`/c/${slug}`)
  revalidatePath(`/c/${slug}/manage/${owner_token}`)
}

export async function saveNodePositions(
  calendarId: string,
  positions: Record<string, { x: number; y: number }>,
) {
  const supabase = createServerClient()
  await supabase
    .from('calendars')
    .update({ node_positions: positions })
    .eq('id', calendarId)
}

export async function updateCalendar(formData: FormData) {
  const id = formData.get('id') as string
  const owner_token = formData.get('owner_token') as string
  const slug = formData.get('slug') as string
  const name = (formData.get('name') as string)?.trim()
  const hemisphere = formData.get('hemisphere') as string
  const show_memorial = formData.get('show_memorial') === 'on'

  if (!id || !owner_token || !name) return

  const supabase = createServerClient()
  const { data: cal } = await supabase
    .from('calendars').select('id').eq('id', id).eq('owner_token', owner_token).single()
  if (!cal) return

  await supabase.from('calendars').update({ name, hemisphere, show_memorial }).eq('id', id)

  revalidatePath(`/c/${slug}`)
  revalidatePath(`/c/${slug}/manage/${owner_token}`)
}
