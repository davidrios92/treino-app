import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Trash2 } from 'lucide-react'
import { db, softDelete, type Session } from '../lib/db'
import { finished, fmtDate, fmtNum, toDisplay, useSessions, useSettings } from '../lib/logic'
import { Btn, Empty, Sheet } from './ui'

export default function History() {
  const sessions = useSessions()
  const settings = useSettings()
  const unit = settings?.unit ?? 'kg'
  const allSets = useLiveQuery(async () => (await db.session_sets.toArray()).filter((s) => !s.deleted && s.done_at))
  const [open, setOpen] = useState<Session | null>(null)

  if (!sessions || !allSets) return null
  const done = finished(sessions)
  if (!done.length) return <Empty>Todavía no hay entrenamientos terminados. ¡El primero cuenta!</Empty>

  const byMonth = new Map<string, Session[]>()
  for (const s of done) {
    const k = fmtDate(s.started_at, { month: 'long', year: 'numeric' })
    byMonth.set(k, [...(byMonth.get(k) ?? []), s])
  }

  return (
    <div className="space-y-5">
      {[...byMonth.entries()].map(([month, list]) => (
        <section key={month}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
            {month} · {list.length}
          </h3>
          <div className="space-y-2">
            {list.map((s) => {
              const sets = allSets.filter((x) => x.session_id === s.id)
              const vol = sets.reduce((n, x) => n + (x.weight_kg ?? 0) * (x.reps ?? 0), 0)
              const mins = s.finished_at ? Math.round((+new Date(s.finished_at) - +new Date(s.started_at)) / 60000) : 0
              return (
                <button key={s.id} onClick={() => setOpen(s)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-3 text-left">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-xl font-bold leading-none">{new Date(s.started_at).getDate()}</div>
                    <div className="text-[11px] uppercase text-mute">{fmtDate(s.started_at, { weekday: 'short' })}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{s.routine_name}</div>
                    <div className="text-xs text-mute">
                      {sets.length} series · {mins} min · {fmtNum(Math.round(toDisplay(vol, unit) ?? 0))} {unit} totales
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-mute" />
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.routine_name}>
        {open && <SessionDetail session={open} unit={unit} onDeleted={() => setOpen(null)} />}
      </Sheet>
    </div>
  )
}

function SessionDetail({ session, unit, onDeleted }: { session: Session; unit: 'kg' | 'lb'; onDeleted: () => void }) {
  const sets = useLiveQuery(
    async () =>
      (await db.session_sets.where('session_id').equals(session.id).toArray())
        .filter((s) => !s.deleted && s.done_at)
        .sort((a, b) => (a.done_at ?? '').localeCompare(b.done_at ?? '')),
    [session.id],
  )
  if (!sets) return null
  const groups = new Map<string, typeof sets>()
  for (const s of sets) {
    const k = s.exercise_name ?? '—'
    groups.set(k, [...(groups.get(k) ?? []), s])
  }

  async function remove() {
    if (!confirm('¿Borrar este entrenamiento del historial?')) return
    for (const s of sets ?? []) await softDelete('session_sets', s.id)
    await softDelete('sessions', session.id)
    onDeleted()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-mute">{fmtDate(session.started_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
      {[...groups.entries()].map(([name, list]) => (
        <div key={name} className="rounded-2xl bg-panel-2 p-3">
          <div className="mb-1 font-semibold">{name}</div>
          <div className="flex flex-wrap gap-2 text-sm tabular-nums">
            {list
              .sort((a, b) => a.set_index - b.set_index)
              .map((s) => (
                <span key={s.id} className="rounded-lg bg-bg px-2 py-1">
                  {fmtNum(toDisplay(s.weight_kg, unit))} {unit} × {s.reps ?? '–'}
                </span>
              ))}
          </div>
        </div>
      ))}
      {!sets.length && <Empty>Sin series registradas.</Empty>}
      <Btn kind="danger" onClick={remove} className="flex w-full items-center justify-center gap-2">
        <Trash2 size={16} /> Borrar entrenamiento
      </Btn>
    </div>
  )
}
