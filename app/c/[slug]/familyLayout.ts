/**
 * Smart family-tree layout.
 *
 * Produces the classic hierarchical family tree where:
 *  - Partners sit side-by-side on the same row
 *  - Children are centered beneath their parents' union dot
 *  - Each generation occupies its own horizontal band
 *  - Sibling groups are spread evenly below their parents
 */

import type { Person, Relationship } from '@/types'

export type LayoutPositions = Record<string, { x: number; y: number }>

interface FamilyUnit {
  people: string[]         // 1 or 2 ids (single person or couple)
  children: FamilyUnit[]   // child units, populated after pairing
}

const COUPLE_GAP = 100  // space between partners (for the union dot)
const H_GAP      = 80   // horizontal gap between sibling subtrees
const V_GAP      = 160  // vertical gap between generations

export function computeFamilyLayout(
  people: Person[],
  relationships: Relationship[],
  nodeW: number,
  nodeH: number,
): LayoutPositions {
  if (people.length === 0) return {}

  const personSet = new Set(people.map(p => p.id))

  // ── 1. Build relationship maps ─────────────────────────────────
  const partnerOf:  Record<string, string>   = {}
  const childrenOf: Record<string, string[]> = {}
  const parentsOf:  Record<string, string[]> = {}

  for (const r of relationships) {
    if (!personSet.has(r.person_a_id) || !personSet.has(r.person_b_id)) continue

    if (r.type === 'partner') {
      partnerOf[r.person_a_id] = r.person_b_id
      partnerOf[r.person_b_id] = r.person_a_id
    } else if (r.type === 'parent_child') {
      childrenOf[r.person_a_id] = [...(childrenOf[r.person_a_id] ?? []), r.person_b_id]
      parentsOf[r.person_b_id]  = [...(parentsOf[r.person_b_id]  ?? []), r.person_a_id]
    }
  }

  // ── 2. Build family units (couple or single) ───────────────────
  const unitOf  = new Map<string, FamilyUnit>()
  const allUnits: FamilyUnit[] = []
  const used    = new Set<string>()

  for (const p of people) {
    if (used.has(p.id)) continue
    used.add(p.id)

    const ids = [p.id]
    const partner = partnerOf[p.id]
    if (partner && !used.has(partner)) {
      used.add(partner)
      ids.push(partner)
    }

    const unit: FamilyUnit = { people: ids, children: [] }
    allUnits.push(unit)
    ids.forEach(id => unitOf.set(id, unit))
  }

  // ── 3. Wire child units to parent units ────────────────────────
  // Each child is assigned to exactly ONE parent unit:
  // prefer the unit that contains BOTH parents (the couple), else the first.
  const assignedParent = new Set<FamilyUnit>()

  for (const p of people) {
    const parents = parentsOf[p.id] ?? []
    if (parents.length === 0) continue

    const childUnit = unitOf.get(p.id)!

    // Find the best parent unit
    let best: FamilyUnit | null = null
    for (const pid of parents) {
      const pu = unitOf.get(pid)
      if (!pu) continue
      // Prefer the unit that contains all parents of this child
      if (parents.every(x => pu.people.includes(x))) { best = pu; break }
      if (!best) best = pu
    }

    if (best && !best.children.includes(childUnit)) {
      best.children.push(childUnit)
      assignedParent.add(childUnit)
    }
  }

  // ── 4. Identify root units (no parents in the tree) ───────────
  const rootUnits = allUnits.filter(u => {
    return u.people.every(pid => !(parentsOf[pid] ?? []).length)
  })

  // Fall back if rootUnits is empty (all disconnected cycles)
  const layoutRoots = rootUnits.length > 0 ? rootUnits : allUnits.slice(0, 1)

  // ── 5. Calculate subtree widths (memoised) ─────────────────────
  const widthCache = new Map<FamilyUnit, number>()

  function ownWidth(u: FamilyUnit): number {
    return u.people.length === 2
      ? nodeW + COUPLE_GAP + nodeW   // left card + gap + right card
      : nodeW
  }

  function subtreeWidth(u: FamilyUnit): number {
    if (widthCache.has(u)) return widthCache.get(u)!
    let w: number
    if (u.children.length === 0) {
      w = ownWidth(u)
    } else {
      const childTotal =
        u.children.reduce((s, c) => s + subtreeWidth(c), 0) +
        Math.max(0, u.children.length - 1) * H_GAP
      w = Math.max(ownWidth(u), childTotal)
    }
    widthCache.set(u, w)
    return w
  }

  // ── 6. Assign positions top-down ───────────────────────────────
  const positions: LayoutPositions = {}

  function placeUnit(u: FamilyUnit, centerX: number, y: number) {
    if (u.people.length === 2) {
      // Left person: right edge sits at centerX - COUPLE_GAP/2 (leaves room for union dot)
      positions[u.people[0]] = { x: centerX - COUPLE_GAP / 2 - nodeW, y }
      // Right person: left edge sits at centerX + COUPLE_GAP/2
      positions[u.people[1]] = { x: centerX + COUPLE_GAP / 2, y }
    } else {
      positions[u.people[0]] = { x: centerX - nodeW / 2, y }
    }

    if (u.children.length === 0) return

    const childY = y + nodeH + V_GAP
    const totalChildW =
      u.children.reduce((s, c) => s + subtreeWidth(c), 0) +
      Math.max(0, u.children.length - 1) * H_GAP

    let cx = centerX - totalChildW / 2
    for (const child of u.children) {
      const w = subtreeWidth(child)
      placeUnit(child, cx + w / 2, childY)
      cx += w + H_GAP
    }
  }

  // Layout root units left-to-right
  const totalRootW =
    layoutRoots.reduce((s, u) => s + subtreeWidth(u), 0) +
    Math.max(0, layoutRoots.length - 1) * H_GAP * 2

  let rx = -totalRootW / 2
  for (const u of layoutRoots) {
    const w = subtreeWidth(u)
    placeUnit(u, rx + w / 2, 0)
    rx += w + H_GAP * 2
  }

  // Place any isolated people not reached by the tree
  let floatX = 0
  for (const p of people) {
    if (!positions[p.id]) {
      positions[p.id] = { x: floatX, y: -(nodeH + V_GAP) }
      floatX += nodeW + H_GAP
    }
  }

  return positions
}
