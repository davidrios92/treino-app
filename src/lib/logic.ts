import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Cycle, type Exercise, type Routine, type RoutineItem, type Session, type SessionSet } from './db'

const alive = <T extends { deleted: boolean }>(rows: T[]) => rows.filter((r) => !r.deleted)

export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(async () => alive(await db.routines.orderBy('position').toArray()))
}

export function useItems(routineId: string | null | undefined): RoutineItem[] | undefined {
  return useLiveQuery(async () => {
    if (!routineId) return []
    const rows = alive(await db.routine_items.where('routine_id').equals(routineId).toArray())
    return rows.sort((a, b) => a.position - b.position)
  }, [routineId])
}

export function useExercises(): Map<string, Exercise> | undefined {
  return useLiveQuery(async () => {
    const rows = alive(await db.exercises.toArray())
    return new Map(rows.map((e) => [e.id, e]))
  })
}

export function useCurrentCycle(): Cycle | null | undefined {
  return useLiveQuery(async () => {
    const rows = alive(await db.cycles.orderBy('started_at').toArray()).filter((c) => !c.ended_at)
    return rows[rows.length - 1] ?? null
  })
}

export function useSessions(): Session[] | undefined {
  return useLiveQuery(async () => alive(await db.sessions.orderBy('started_at').reverse().toArray()))
}

export function useSettings() {
  return useLiveQuery(async () => alive(await db.settings.toArray())[0])
}

export function finished(sessions: Session[]) {
  return sessions.filter((s) => s.finished_at)
}

export function trainedDays(sessions: Session[]) {
  return new Set(finished(sessions).map((s) => localDate(s.started_at))).size
}

export function localDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Next routine in the A→B→C→D sequence, based on the last finished session. */
export function nextRoutine(routines: Routine[], sessions: Session[]): Routine | undefined {
  if (!routines.length) return undefined
  const last = finished(sessions)[0] // sessions are newest-first
  if (!last) return routines[0]
  const idx = routines.findIndex((r) => r.id === last.routine_id)
  return routines[(idx + 1) % routines.length] ?? routines[0]
}

export function activeSession(sessions: Session[]): Session | undefined {
  return sessions.find((s) => !s.finished_at)
}

export interface LastPerformance {
  date: string
  sets: SessionSet[]
}

/** The most recent finished session where this exercise was done (excluding `exceptSession`). */
export async function lastPerformance(exerciseId: string, exceptSession?: string): Promise<LastPerformance | null> {
  const sets = alive(await db.session_sets.where('exercise_id').equals(exerciseId).toArray()).filter(
    (s) => s.session_id !== exceptSession && s.done_at,
  )
  if (!sets.length) return null
  const sessionIds = [...new Set(sets.map((s) => s.session_id))]
  const sessions = alive((await db.sessions.bulkGet(sessionIds)).filter(Boolean) as Session[]).filter((s) => s.finished_at)
  if (!sessions.length) return null
  sessions.sort((a, b) => b.started_at.localeCompare(a.started_at))
  const last = sessions[0]
  return { date: last.started_at, sets: sets.filter((s) => s.session_id === last.id).sort((a, b) => a.set_index - b.set_index) }
}

// ---------- units ----------
export const LB_PER_KG = 2.20462

export function toDisplay(kg: number | null | undefined, unit: 'kg' | 'lb'): number | null {
  if (kg == null) return null
  const v = unit === 'lb' ? kg * LB_PER_KG : kg
  return Math.round(v * 4) / 4
}

export function fromDisplay(v: number | null, unit: 'kg' | 'lb'): number | null {
  if (v == null || Number.isNaN(v)) return null
  return unit === 'lb' ? v / LB_PER_KG : v
}

export function fmtNum(n: number | null | undefined) {
  if (n == null) return '–'
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

/** Epley estimated one-rep max. */
export function e1rm(kg: number, reps: number) {
  return reps <= 1 ? kg : kg * (1 + reps / 30)
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString('es', opts)
}

export function targetText(it: RoutineItem) {
  const sets = it.sets_optional ? `${it.sets}–${it.sets + it.sets_optional}` : `${it.sets}`
  const reps = it.reps_min != null ? (it.reps_max && it.reps_max !== it.reps_min ? `${it.reps_min}–${it.reps_max}` : `${it.reps_min}`) : null
  return `${sets} × ${reps ?? it.reps_note ?? '—'}${it.per_side ? ' c/ pierna' : ''}`
}

export function fmtRest(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? (s ? `${m}:${String(s).padStart(2, '0')} min` : `${m} min`) : `${s} s`
}
