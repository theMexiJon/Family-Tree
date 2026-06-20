export interface Calendar {
  id: string
  slug: string
  owner_token: string
  name: string
  hemisphere: 'north' | 'south'
  timezone: string
  show_memorial: boolean
  user_id: string | null
  node_positions: Record<string, { x: number; y: number }>
  created_at: string
}

export interface Person {
  id: string
  calendar_id: string
  full_name: string
  maiden_name: string | null
  birth_month: number | null
  birth_day: number | null
  birth_year: number | null
  is_deceased: boolean
  death_month: number | null
  death_day: number | null
  death_year: number | null
  photo_url: string | null
  bio: string | null
  branch: string | null
  added_by: string
  contributor_id: string | null
  created_at: string
}

export interface Relationship {
  id: string
  calendar_id: string
  type: 'partner' | 'parent_child' | 'sibling'
  person_a_id: string
  person_b_id: string
  wedding_month: number | null
  wedding_day: number | null
  wedding_year: number | null
  status: 'married' | 'partners' | 'divorced' | null
  note: string | null
  added_by: string
  contributor_id: string | null
  created_at: string
}

export type RelationshipWithPeople = Relationship & {
  person_a: Person
  person_b: Person
}

export interface LifeEventPhoto {
  id: string
  calendar_id: string
  person_id: string | null
  relationship_id: string | null
  event_type: 'birthday' | 'anniversary' | 'memorial' | 'custom'
  event_year: number
  photo_url: string
  caption: string | null
  uploaded_by: string
  created_at: string
}

export interface NotificationSubscriber {
  id: string
  calendar_id: string
  email: string
  days_before: number
  token: string
  created_at: string
}
