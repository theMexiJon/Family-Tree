import { nanoid } from 'nanoid'

export function generateSlug(): string {
  return nanoid(12)
}

export function generateOwnerToken(): string {
  return nanoid(32)
}

export function generateContributorId(): string {
  return nanoid(20)
}
