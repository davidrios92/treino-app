import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flag, Play, Trophy } from 'lucide-react'
import { db, nowIso, patch, save, uuid, type Cycle, type Session } from '../lib/db'
import {
  activeSession,
  finished,
  fmtDate,
  nextRoutine,
  targetText,
  trainedDays,
  useCurrentCycle,
  useExercises,
  useItems,
  useRoutines,
  useSessions,
} from '../lib/logic'
import { unlockAudio } from '../lib/timer'
import Workout from './Workout'
import { Btn, Empty } from './ui'

export default function Today() {
  const routines = useRoutines()
  const sessions = useSessions()
  const cycle = useCurrentCycle()
  const exercises = useExercises()
  const [pickedId, setPickedId] = useState<string | null>(null)

  const next = routines && sessions ? nextRoutine(routines, sessions) : undefined
  const chosen = routines?.find((r) => r.id === pickedId) ?? next
  const items = useItems(chosen?.id)

  const cycleCount = useLiveQuery(async () => {
    if (!cycle) return 0
    return (await db.sessions.where('cycle_id').equals(cycle.id).toArray()).filter((s) => !s.deleted && s.finished_at).length
  }, [cycle?.id])

  if (!routines || !sessions || cycle === undefined || !exercises) return null

  const active = activeSession(sessions)
  if (active) return <Workout session={active} />

  const done = finished(sessions)
  const target = cycle?.target ?? 50
  const count = cycleCount ?? 0
  const reached = count >= target

  async function start() {
    if (!chosen) return
    unlockAudio()
    await save<Session>('sessions', {
      id: uuid(),
      cycle_id: cycle?.id ?? null,
      routine_id: chosen.id,
      routine_name: chosen.name,
      started_at: nowIso(),
      finished_at: null,
    })
    setPickedId(null)
  }

  async function newCycle() {
    if (!confirm('¿Iniciar un ciclo nuevo? El contador vuelve a 0 y el historial se conserva.')) return
    if (cycle) await patch('cycles', cycle.id, { ended_at: nowIso() })
    await save<Cycle>('cycles', { id: uuid(), started_at: nowIso(), ended_at: null, target: 50, notes: null })
  }

  return (
    <div className="space-y-4">
      {/* cycle */}
      <section className={`rounded-3xl border p-4 ${reached ? 'border-accent bg-accent/10' : 'border-line bg-panel'}`}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-mute">Ciclo actual</div>
            <div className="text-4xl font-bold tabular-nums">
              {count}
              <span className="text-xl text-mute"> / {target}</span>
            </div>
          </div>
          {reached ? <Trophy className="text-accent" size={36} /> : <Flag className="text-mute" size={28} />}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (count / target) * 100)}%` }} />
        </div>
        {reached ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm">
              <b>¡Llegaste a {target} entrenamientos!</b> Es un buen momento para reevaluar la rutina con tu personal trainer.
              Puedes editarla en <b>Rutinas</b> y empezar un ciclo nuevo.
            </p>
            <Btn onClick={newCycle} className="w-full">
              Iniciar ciclo nuevo
            </Btn>
          </div>
        ) : (
          <p className="mt-2 text-sm text-mute">
            Faltan {target - count} entrenamientos para reevaluar la rutina
            {cycle ? ` · desde ${fmtDate(cycle.started_at, { day: 'numeric', month: 'short' })}` : ''}
          </p>
        )}
      </section>

      {/* stats */}
      <section className="grid grid-cols-2 gap-3">
        <Stat label="Días entrenados" value={trainedDays(sessions)} />
        <Stat label="Rutinas hechas" value={done.length} />
      </section>

      {/* next routine */}
      {chosen ? (
        <section className="rounded-3xl border border-line bg-panel p-4">
          <div className="text-xs uppercase tracking-wide text-mute">{chosen.id === next?.id ? 'Próxima rutina' : 'Rutina elegida'}</div>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-ink">
              {chosen.short ?? chosen.name[0]}
            </span>
            <h2 className="text-2xl font-bold">{chosen.name}</h2>
          </div>
          <ul className="mb-4 space-y-1.5 text-sm">
            {items?.map((it) => (
              <li key={it.id} className="flex justify-between gap-3">
                <span className="truncate">
                  {it.exercise_ids
                    .map((id) => exercises.get(id)?.name_pt)
                    .filter(Boolean)
                    .join(' ou ')}
                </span>
                <span className="shrink-0 tabular-nums text-mute">{targetText(it)}</span>
              </li>
            ))}
          </ul>
          <Btn onClick={start} className="flex w-full items-center justify-center gap-2 py-4 text-lg">
            <Play size={20} fill="currentColor" /> Empezar entrenamiento
          </Btn>
          {done[0] && (
            <p className="mt-3 text-center text-xs text-mute">
              Último: {done[0].routine_name} · {fmtDate(done[0].started_at)}
            </p>
          )}
        </section>
      ) : (
        <Empty>No hay rutinas. Crea una en la pestaña Rutinas.</Empty>
      )}

      {routines.length > 1 && (
        <section>
          <div className="mb-2 text-xs uppercase tracking-wide text-mute">¿Otra rutina hoy?</div>
          <div className="flex flex-wrap gap-2">
            {routines.map((r) => (
              <button
                key={r.id}
                onClick={() => setPickedId(r.id === next?.id ? null : r.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${r.id === chosen?.id ? 'border-accent text-accent' : 'border-line text-mute'}`}
              >
                {r.short ? `${r.short} · ` : ''}
                {r.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-mute">{label}</div>
    </div>
  )
}
