'use client'

import {
  useCallback, useEffect, useMemo, useRef, useState, useTransition,
} from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  MarkerType,
  Panel,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodeDrag,
} from '@xyflow/react'
import Dagre from '@dagrejs/dagre'
import type { Person, Relationship } from '@/types'
import EditPersonModal from './EditPersonModal'
import { saveNodePositions } from '@/app/actions'

// ─── Constants ────────────────────────────────────────────────────
const NODE_W = 210
const NODE_H = 108
const UNION_R = 7   // union dot radius in px

type SavedPositions = Record<string, { x: number; y: number }>

// ─── Person card ──────────────────────────────────────────────────

type PersonData = { person: Person; isYou: boolean; onEdit: (p: Person) => void }

function PersonCard({ data }: NodeProps) {
  const { person, isYou, onEdit } = data as PersonData
  const dates = [
    person.birth_year ? `b. ${person.birth_year}` : null,
    person.is_deceased ? (person.death_year ? `† ${person.death_year}` : '†') : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <div
      style={{ width: NODE_W, minHeight: NODE_H }}
      className={`relative flex flex-col justify-between rounded-xl border bg-white px-3 py-3 shadow-sm transition-shadow hover:shadow-md ${
        isYou ? 'border-[--color-accent] ring-1 ring-[--color-accent]/40' : 'border-[--color-paper-dark]'
      }`}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left}   id="left"   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ opacity: 0, pointerEvents: 'none' }} />

      {isYou && (
        <span className="absolute -top-3 left-3 rounded-full bg-[--color-accent] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
          You
        </span>
      )}
      {person.photo_url && (
        <img
          src={person.photo_url}
          alt={person.full_name}
          className="absolute -top-5 right-2 h-10 w-10 rounded-full border-2 border-[--color-paper-dark] object-cover shadow-md"
        />
      )}

      <div className="flex-1 pr-6">
        <p className="font-display text-sm font-semibold leading-snug text-[--color-ink]">
          {person.full_name}
        </p>
        {person.maiden_name && (
          <p className="text-[11px] italic text-[--color-ink-muted]">née {person.maiden_name}</p>
        )}
        {dates && <p className="mt-0.5 text-[11px] text-[--color-ink-muted]">{dates}</p>}
        {person.branch && (
          <span className="mt-1 inline-block rounded-full bg-[--color-paper-dark] px-1.5 py-0.5 text-[10px] text-[--color-ink-faint]">
            {person.branch}
          </span>
        )}
      </div>

      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onEdit(person) }}
        className="mt-2 self-end rounded-md px-2 py-0.5 text-[10px] font-medium text-[--color-ink-faint] hover:bg-[--color-paper-dark] hover:text-[--color-ink-muted]"
      >
        ✎ Edit
      </button>
    </div>
  )
}

// ─── Union (couple) node ──────────────────────────────────────────
// Sits at the midpoint between two partners; children connect from here.

function UnionNode() {
  const size = UNION_R * 2
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-[--color-paper-dark] bg-[--color-accent]"
    >
      <Handle type="target" position={Position.Left}   id="left"   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Right}  id="right"  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}

// Stable at module scope — prevents react-flow memoization warning
const NODE_TYPES = { personCard: PersonCard, union: UnionNode }

// ─── Layout helpers ───────────────────────────────────────────────

/** Calculate where the union node for a couple should sit. */
function unionPosition(
  nodeA: Node,
  nodeB: Node,
): { x: number; y: number } {
  const aLeft  = nodeA.position.x
  const aRight = nodeA.position.x + NODE_W
  const bLeft  = nodeB.position.x
  const bRight = nodeB.position.x + NODE_W

  const midX = (Math.min(aRight, bRight) + Math.max(aLeft, bLeft)) / 2
  const midY = (nodeA.position.y + nodeB.position.y) / 2 + NODE_H / 2

  return { x: midX - UNION_R, y: midY - UNION_R }
}

/** Rebuild union nodes whenever person positions change. */
function buildUnionNodes(
  personNodes: Node[],
  partnerRels: Relationship[],
): Node[] {
  return partnerRels.flatMap(rel => {
    const a = personNodes.find(n => n.id === rel.person_a_id)
    const b = personNodes.find(n => n.id === rel.person_b_id)
    if (!a || !b) return []
    return [{
      id: `union-${rel.id}`,
      type: 'union',
      data: {},
      position: unionPosition(a, b),
      draggable: false,
      selectable: false,
      focusable: false,
    }]
  })
}

function buildElements(
  people: Person[],
  relationships: Relationship[],
  onEdit: (p: Person) => void,
  myId: string | null,
  savedPositions: SavedPositions,
): { nodes: Node[]; edges: Edge[] } {
  if (people.length === 0) return { nodes: [], edges: [] }

  const partnerRels      = relationships.filter(r => r.type === 'partner')
  const parentChildRels  = relationships.filter(r => r.type === 'parent_child')

  // Build child → [parentId] map
  const parentsOf: Record<string, string[]> = {}
  for (const r of parentChildRels) {
    parentsOf[r.person_b_id] = [...(parentsOf[r.person_b_id] ?? []), r.person_a_id]
  }

  // Build couple → union id map (both orderings)
  const coupleToUnion: Record<string, string> = {}
  for (const r of partnerRels) {
    const uid = `union-${r.id}`
    coupleToUnion[`${r.person_a_id}|${r.person_b_id}`] = uid
    coupleToUnion[`${r.person_b_id}|${r.person_a_id}`] = uid
  }

  // ── Dagre: position person nodes ──────────────────────────────
  const g = new Dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120, marginx: 50, marginy: 50 })

  people.forEach(p => g.setNode(p.id, { width: NODE_W, height: NODE_H }))

  // Partner edges — same rank
  for (const r of partnerRels) {
    g.setEdge(r.person_a_id, r.person_b_id, { minlen: 1, weight: 10 })
  }

  // Parent-child: one edge per child (just for rank placement)
  const rankedChildren = new Set<string>()
  for (const r of parentChildRels) {
    if (!rankedChildren.has(r.person_b_id)) {
      g.setEdge(r.person_a_id, r.person_b_id, { weight: 1 })
      rankedChildren.add(r.person_b_id)
    }
  }

  Dagre.layout(g)

  // ── Person nodes ──────────────────────────────────────────────
  const personNodes: Node[] = people.map(p => {
    const pos   = g.node(p.id)
    const saved = savedPositions[p.id]
    return {
      id: p.id,
      type: 'personCard',
      data: { person: p, isYou: p.id === myId, onEdit },
      position: saved ?? { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
    }
  })

  // ── Union nodes — positioned between each couple ───────────────
  const unionNodes = buildUnionNodes(personNodes, partnerRels)
  const nodes      = [...personNodes, ...unionNodes]

  // ── Edges ──────────────────────────────────────────────────────
  const edges: Edge[] = []

  // Partner → union edges (no arrowhead)
  for (const r of partnerRels) {
    const uid = `union-${r.id}`
    const a   = personNodes.find(n => n.id === r.person_a_id)
    const b   = personNodes.find(n => n.id === r.person_b_id)
    if (!a || !b) continue

    const aIsLeft = a.position.x <= b.position.x

    edges.push({
      id: `pa-${r.id}`,
      source: aIsLeft ? r.person_a_id : r.person_b_id,
      target: uid,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'straight',
      style: { stroke: '#d4623a', strokeWidth: 2.5 },
      markerEnd: undefined,
    })
    edges.push({
      id: `pb-${r.id}`,
      source: aIsLeft ? r.person_b_id : r.person_a_id,
      target: uid,
      sourceHandle: 'left',
      targetHandle: 'right',
      type: 'straight',
      style: { stroke: '#d4623a', strokeWidth: 2.5 },
      markerEnd: undefined,
    })
  }

  // Child edges — from union when both parents are coupled, else from single parent
  const drawnEdges = new Set<string>()

  for (const [childId, parents] of Object.entries(parentsOf)) {
    let routedFromUnion = false

    // Find a union that covers two (or more) of this child's parents
    for (let i = 0; i < parents.length && !routedFromUnion; i++) {
      for (let j = i + 1; j < parents.length && !routedFromUnion; j++) {
        const uid = coupleToUnion[`${parents[i]}|${parents[j]}`]
        if (uid && !drawnEdges.has(`${uid}→${childId}`)) {
          edges.push({
            id: `uc-${uid}-${childId}`,
            source: uid,
            target: childId,
            sourceHandle: 'bottom',
            type: 'smoothstep',
            style: { stroke: '#7a6248', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#7a6248', width: 12, height: 12 },
          })
          drawnEdges.add(`${uid}→${childId}`)
          routedFromUnion = true
        }
      }
    }

    if (!routedFromUnion) {
      // Draw an individual edge from each uncoupled parent
      for (const parentId of parents) {
        if (!drawnEdges.has(`${parentId}→${childId}`)) {
          edges.push({
            id: `pc-${parentId}-${childId}`,
            source: parentId,
            target: childId,
            type: 'smoothstep',
            style: { stroke: '#7a6248', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#7a6248', width: 12, height: 12 },
          })
          drawnEdges.add(`${parentId}→${childId}`)
        }
      }
    }
  }

  return { nodes, edges }
}

// ─── Canvas controls (inside ReactFlow context) ───────────────────

function CanvasControls({ onReset, isSaving }: { onReset: () => void; isSaving: boolean }) {
  const { fitView } = useReactFlow()
  return (
    <Panel position="bottom-right" className="mb-3 mr-3 flex items-center gap-1.5">
      {isSaving && <span className="text-[10px] text-[--color-ink-faint]">Saving…</span>}
      <button
        onClick={() => fitView({ padding: 0.3, duration: 400 })}
        title="Fit all cards in view"
        className="rounded-lg border border-[--color-paper-dark] bg-[--color-surface] px-2.5 py-1.5 text-xs font-medium text-[--color-ink-muted] shadow-sm hover:bg-[--color-paper-dark]"
      >
        ⊞ Fit view
      </button>
      <button
        onClick={onReset}
        title="Reset to automatic layout"
        className="rounded-lg border border-[--color-paper-dark] bg-[--color-surface] px-2.5 py-1.5 text-xs font-medium text-[--color-ink-muted] shadow-sm hover:bg-[--color-paper-dark]"
      >
        ↺ Reset layout
      </button>
    </Panel>
  )
}

// ─── Identity menu ────────────────────────────────────────────────

function IdentityMenu({
  people, slug, myId, onChange,
}: {
  people: Person[]; slug: string; myId: string | null; onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const me = people.find(p => p.id === myId)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const pick = (id: string | null) => {
    if (id) localStorage.setItem(`ftree-${slug}-me`, id)
    else localStorage.removeItem(`ftree-${slug}-me`)
    onChange(id)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-[--color-paper-dark] bg-[--color-surface]/95 px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] shadow-sm backdrop-blur-sm hover:bg-[--color-surface]"
      >
        <span>👤</span>
        <span>{me ? me.full_name : 'Who are you?'}</span>
        <span className="opacity-50">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-40 w-56 overflow-hidden rounded-xl border border-[--color-paper-dark] bg-[--color-surface] shadow-xl">
            <p className="border-b border-[--color-paper-dark] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[--color-ink-faint]">
              Identify yourself
            </p>
            <div className="max-h-64 overflow-y-auto">
              {people.map(p => (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[--color-paper-dark] ${
                    p.id === myId ? 'font-semibold text-[--color-accent]' : 'text-[--color-ink]'
                  }`}
                >
                  {p.id === myId && <span className="text-xs">✓</span>}
                  <span className={p.id === myId ? '' : 'pl-4'}>{p.full_name}</span>
                </button>
              ))}
            </div>
            {myId && (
              <button
                onClick={() => pick(null)}
                className="w-full border-t border-[--color-paper-dark] px-3 py-2 text-left text-xs text-[--color-ink-faint] hover:bg-[--color-paper-dark]"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center" style={{ pointerEvents: 'none' }}>
      <div className="text-5xl">🌱</div>
      <div>
        <p className="font-display text-lg font-medium text-[--color-ink]">No one in the tree yet</p>
        <p className="mt-1 text-sm text-[--color-ink-muted]">Add the first family member using the form below.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-xs text-[--color-ink-faint]">
        <span>🎂 Birthdays</span><span>💍 Anniversaries</span><span>🖨 Printable calendar</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

interface Props {
  people: Person[]
  relationships: Relationship[]
  slug: string
  calendarId: string
  savedPositions: SavedPositions
}

export default function FamilyTreeCanvas({
  people,
  relationships,
  slug,
  calendarId,
  savedPositions: initialSavedPositions,
}: Props) {
  const [myId, setMyId]                   = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [isSaving, setIsSaving]           = useState(false)
  const [, startTransition]               = useTransition()

  const positionsRef = useRef<SavedPositions>(initialSavedPositions)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const partnerRels = useMemo(
    () => relationships.filter(r => r.type === 'partner'),
    [relationships],
  )

  useEffect(() => {
    const stored = localStorage.getItem(`ftree-${slug}-me`)
    if (stored && people.some(p => p.id === stored)) setMyId(stored)
  }, [slug, people])

  const onEdit = useCallback((p: Person) => setEditingPerson(p), [])

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildElements(people, relationships, onEdit, myId, positionsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, relationships, onEdit, myId],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  useEffect(() => {
    const { nodes: n, edges: e } = buildElements(people, relationships, onEdit, myId, positionsRef.current)
    setNodes(n)
    setEdges(e)
  }, [people, relationships, onEdit, myId, setNodes, setEdges])

  const scheduleSave = useCallback((positions: SavedPositions) => {
    positionsRef.current = positions
    setIsSaving(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        await saveNodePositions(calendarId, positions)
        setIsSaving(false)
      })
    }, 1200)
  }, [calendarId])

  // After drag: update union positions and save person positions
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, draggedNode) => {
      setNodes(current => {
        const personNodes = current
          .filter(n => n.type === 'personCard')
          .map(n => n.id === draggedNode.id ? { ...n, position: { ...draggedNode.position } } : n)

        const newUnionNodes = buildUnionNodes(personNodes, partnerRels)
        const merged = [...personNodes, ...newUnionNodes]

        const positions: SavedPositions = {}
        personNodes.forEach(n => { positions[n.id] = { x: n.position.x, y: n.position.y } })
        scheduleSave(positions)

        return merged
      })
    },
    [partnerRels, scheduleSave, setNodes],
  )

  const handleReset = useCallback(() => {
    positionsRef.current = {}
    const { nodes: n, edges: e } = buildElements(people, relationships, onEdit, myId, {})
    setNodes(n)
    setEdges(e)
    startTransition(async () => { await saveNodePositions(calendarId, {}) })
  }, [people, relationships, onEdit, myId, calendarId, setNodes, setEdges])

  return (
    <>
      <div className="h-[580px] w-full overflow-hidden rounded-2xl border border-[--color-paper-dark] bg-[--color-paper]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#352c22" gap={28} size={1.5} />
          <Controls showInteractive={false} />

          {people.length === 0 && (
            <Panel position="top-left" style={{ inset: 0, margin: 0, width: '100%', height: '100%' }}>
              <EmptyState />
            </Panel>
          )}

          {people.length > 0 && (
            <Panel position="top-right" className="mt-3 mr-3">
              <IdentityMenu people={people} slug={slug} myId={myId} onChange={setMyId} />
            </Panel>
          )}

          {people.length > 0 && (
            <CanvasControls onReset={handleReset} isSaving={isSaving} />
          )}
        </ReactFlow>
      </div>

      {people.length > 0 && (
        <p className="mt-1.5 text-center text-xs text-[--color-ink-faint]">
          Drag cards to rearrange · positions auto-saved · zoom with scroll
        </p>
      )}

      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          slug={slug}
          onClose={() => setEditingPerson(null)}
        />
      )}
    </>
  )
}
