import Dexie, { type Table } from 'dexie'

// Every synced row carries these fields; `dirty` is local-only (1 = pending push).
export interface Base {
  id: string
  user_id?: string
  updated_at: string
  deleted: boolean
  dirty?: 0 | 1
}

export interface Exercise extends Base {
  slug: string | null
  name_pt: string
  name_en: string | null
  muscle: string | null
  description: string | null
  tips: string[]
  images: string[]
  video_id: string | null
  video_title: string | null
  is_custom: boolean
}

export interface Routine extends Base {
  name: string
  short: string | null
  position: number
}

export interface RoutineItem extends Base {
  routine_id: string
  position: number
  exercise_ids: string[]
  sets: number
  sets_optional: number
  reps_min: number | null
  reps_max: number | null
  reps_note: string | null
  rest_sec: number
  per_side: boolean
  notes: string | null
}

export interface Cycle extends Base {
  started_at: string
  ended_at: string | null
  target: number
  notes: string | null
}

export interface Session extends Base {
  cycle_id: string | null
  routine_id: string | null
  routine_name: string | null
  started_at: string
  finished_at: string | null
}

export interface SessionSet extends Base {
  session_id: string
  item_id: string | null
  exercise_id: string | null
  exercise_name: string | null
  set_index: number
  weight_kg: number | null
  reps: number | null
  done_at: string | null
}

export interface Settings extends Base {
  unit: 'kg' | 'lb'
}

export interface Meta {
  key: string
  value: string
}

class TreinoDB extends Dexie {
  exercises!: Table<Exercise, string>
  routines!: Table<Routine, string>
  routine_items!: Table<RoutineItem, string>
  cycles!: Table<Cycle, string>
  sessions!: Table<Session, string>
  session_sets!: Table<SessionSet, string>
  settings!: Table<Settings, string>
  meta!: Table<Meta, string>

  constructor() {
    super('treino')
    this.version(1).stores({
      exercises: 'id, dirty',
      routines: 'id, dirty, position',
      routine_items: 'id, dirty, routine_id',
      cycles: 'id, dirty, started_at',
      sessions: 'id, dirty, started_at, cycle_id',
      session_sets: 'id, dirty, session_id, exercise_id',
      settings: 'id, dirty',
      meta: 'key',
    })
  }
}

export const db = new TreinoDB()

export const SYNCED_TABLES = [
  'exercises',
  'routines',
  'routine_items',
  'cycles',
  'sessions',
  'session_sets',
  'settings',
] as const
export type SyncedTable = (typeof SYNCED_TABLES)[number]

export function uuid(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Write a row locally and mark it for sync. */
export async function save<T extends Base>(table: SyncedTable, row: Omit<T, 'updated_at' | 'deleted' | 'dirty'> & Partial<Base>) {
  const full = { deleted: false, ...row, updated_at: nowIso(), dirty: 1 } as unknown as T
  await (db[table] as unknown as Table<T, string>).put(full)
  scheduleSync()
  return full
}

export async function patch(table: SyncedTable, id: string, changes: Record<string, unknown>) {
  await (db[table] as Table<Base, string>).update(id, { ...changes, updated_at: nowIso(), dirty: 1 })
  scheduleSync()
}

export async function softDelete(table: SyncedTable, id: string) {
  await patch(table, id, { deleted: true })
}

// Late-bound to avoid an import cycle with sync.ts.
let syncHook: () => void = () => {}
export function setSyncHook(fn: () => void) {
  syncHook = fn
}
function scheduleSync() {
  syncHook()
}
