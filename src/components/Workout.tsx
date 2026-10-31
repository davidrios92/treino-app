import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ChevronRight, Info, MoreHorizontal, Timer } from 'lucide-react'
import { db, nowIso, patch, save, softDelete, uuid, type Exercise, type RoutineItem, type Session, type SessionSet } from '../lib/db'
import {
  fmtDate,
  fmtNum,
  fmtRest,
  fromDisplay,
  lastPerformance,
  targetText,
  toDisplay,
  useExercises,
  useItems,
  useSettings,
  type LastPerformance,
} from '../lib/logic'
import { keepAwake, startRest, stopRest } from '../lib/timer'
import ExerciseSheet from './ExerciseSheet'
import RestBar from './RestBar'
import { Btn, Sheet } from './ui'

export default function Workout({ session }: { session: Session }) {
  const items = useItems(session.routine_id)
  const exercises = useExercises()
  const settings = useSettings()
  const unit = settings?.unit ?? 'kg'
  const sets = useLiveQuery(
    async () => (await db.session_sets.where('session_id').equals(session.id).toArray()).filter((s) => !s.deleted),
    [session.id],
  )
  const [menu, setMenu] = useState(false)
  const elapsed = useElapsed(session.started_at)

  useEffect(() => {
    void keepAwake(true)
    return () => void keepAwake(false)
  }, [])

  if (!items || !exercises || !sets) return null

  const doneCount = sets.filter((s) => s.done_at).length
  const requiredTotal = items.reduce((n, it) => n + it.sets, 0)

  async function finish() {
    if (doneCount === 0 && !confirm('No marcaste ninguna serie. ¿Terminar igual?')) return
    stopRest()
    await patch('sessions', session.id, { finished_at: nowIso() })
  }

  async function discard() {
    if (!confirm('¿Descartar este entrenamiento? Se borran las series marcadas.')) return
    stopRest()
    for (const s of sets ?? []) await softDelete('session_sets', s.id)
    await softDelete('sessions', session.id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-mute">Entrenando · {elapsed}</div>
          <h2 className="text-2xl font-bold">{session.routine_name}</h2>
        </div>
        <button onClick={() => setMenu(true)} className="rounded-full bg-panel-2 p-2" aria-label="Opciones">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, (doneCount / Math.max(1, requiredTotal)) * 100)}%` }} />
      </div>

      {items.map((it) => (
        <ItemCard key={it.id} item={it} session={session} exercises={exercises} sets={sets.filter((s) => s.item_id === it.id)} unit={unit} />
      ))}

      <Btn onClick={finish} className="w-full py-4 text-lg">
        Terminar entrenamiento
      </Btn>

      <RestBar />

      <Sheet open={menu} onClose={() => setMenu(false)} title="Opciones">
        <div className="space-y-2">
          <p className="text-sm text-mute">Empezado {fmtDate(session.started_at, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
          <Btn kind="danger" className="w-full" onClick={discard}>
            Descartar entrenamiento
          </Btn>
        </div>
      </Sheet>
    </div>
  )
}

function useElapsed(startIso: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])
  const min = Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`
}

function variantKey(itemId: string) {
  return `treino.variant.${itemId}`
}

function ItemCard({
  item,
  session,
  exercises,
  sets,
  unit,
}: {
  item: RoutineItem
  session: Session
  exercises: Map<string, Exercise>
  sets: SessionSet[]
  unit: 'kg' | 'lb'
}) {
  const options = item.exercise_ids.map((id) => exercises.get(id)).filter(Boolean) as Exercise[]
  const [variantId, setVariantId] = useState<string>(() => {
    const fromSession = sets.find((s) => s.done_at)?.exercise_id
    const remembered = localStorage.getItem(variantKey(item.id))
    return [fromSession, remembered].find((v) => v && item.exercise_ids.includes(v)) ?? item.exercise_ids[0]
  })
  const ex = exercises.get(variantId) ?? options[0]
  const [info, setInfo] = useState(false)
  const last = useLiveQuery(() => (ex ? lastPerformance(ex.id, session.id) : null), [ex?.id, session.id])

  const mine = useMemo(() => sets.filter((s) => s.exercise_id === ex?.id), [sets, ex?.id])
  const totalRows = item.sets + item.sets_optional
  const doneRequired = mine.filter((s) => s.done_at && s.set_index < item.sets).length
  const complete = doneRequired >= item.sets

  if (!ex) return null

  function pickVariant(id: string) {
    setVariantId(id)
    localStorage.setItem(variantKey(item.id), id)
  }

  return (
    <section className={`rounded-3xl border bg-panel p-4 ${complete ? 'border-accent/50' : 'border-line'}`}>
      <button className="flex w-full items-start gap-3 text-left" onClick={() => setInfo(true)}>
        {ex.images[0] ? (
          <img src={ex.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-panel-2">
            <Info size={20} className="text-mute" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold leading-tight">{ex.name_pt}</h3>
            {complete && <Check size={16} className="shrink-0 text-accent" />}
          </div>
          {ex.name_en && <div className="text-xs text-mute">{ex.name_en}</div>}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-mute">
            <span className="font-medium text-ink">{targetText(item)}</span>
            <span className="flex items-center gap-0.5">
              <Timer size={12} /> {fmtRest(item.rest_sec)}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-mute" />
      </button>

      {options.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => pickVariant(o.id)}
              className={`rounded-full border px-2.5 py-1 text-xs ${o.id === ex.id ? 'border-accent bg-accent/10 text-accent' : 'border-line text-mute'}`}
            >
              {o.name_pt}
            </button>
          ))}
        </div>
      )}

      <LastLine last={last} unit={unit} />
      {item.notes && <p className="mt-2 text-xs text-warn">{item.notes}</p>}

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-1 text-[10px] uppercase tracking-wide text-mute">
          <span>Serie</span>
          <span>Peso ({unit})</span>
          <span>{item.per_side ? 'Reps c/ pierna' : 'Reps'}</span>
          <span />
        </div>
        {Array.from({ length: totalRows }, (_, i) => (
          <SetRow
            key={`${ex.id}-${i}`}
            index={i}
            optional={i >= item.sets}
            row={mine.find((s) => s.set_index === i)}
            hint={last?.sets.find((s) => s.set_index === i) ?? last?.sets[last.sets.length - 1]}
            prev={mine.find((s) => s.set_index === i - 1)}
            unit={unit}
            onSave={async (weightKg, reps) => {
              const existing = mine.find((s) => s.set_index === i)
              if (existing) {
                await patch('session_sets', existing.id, { weight_kg: weightKg, reps, done_at: existing.done_at ?? nowIso() })
              } else {
                await save<SessionSet>('session_sets', {
                  id: uuid(), session_id: session.id, item_id: item.id, exercise_id: ex.id, exercise_name: ex.name_pt,
                  set_index: i, weight_kg: weightKg, reps, done_at: nowIso(),
                })
              }
            }}
            onDone={() => startRest(item.rest_sec, ex.name_pt)}
            onUndo={async () => {
              const existing = mine.find((s) => s.set_index === i)
              if (existing) await softDelete('session_sets', existing.id)
            }}
          />
        ))}
      </div>

      <ExerciseSheet exercise={ex} open={info} onClose={() => setInfo(false)} />
    </section>
  )
}

function LastLine({ last, unit }: { last: LastPerformance | null | undefined; unit: 'kg' | 'lb' }) {
  if (!last) return <p className="mt-2 text-xs text-mute">Primera vez con este ejercicio: elige un peso cómodo.</p>
  const parts = last.sets.map((s) => `${fmtNum(toDisplay(s.weight_kg, unit))}×${s.reps ?? '–'}`)
  return (
    <p className="mt-2 rounded-xl bg-panel-2 px-3 py-2 text-xs">
      <span className="text-mute">Última vez ({fmtDate(last.date, { day: 'numeric', month: 'short' })}): </span>
      <span className="font-medium tabular-nums">
        {parts.join(' · ')} {unit}
      </span>
    </p>
  )
}

function SetRow({
  index,
  optional,
  row,
  hint,
  prev,
  unit,
  onSave,
  onDone,
  onUndo,
}: {
  index: number
  optional: boolean
  row: SessionSet | undefined
  hint: SessionSet | undefined
  prev: SessionSet | undefined
  unit: 'kg' | 'lb'
  onSave: (weightKg: number | null, reps: number | null) => Promise<void>
  onDone: () => void
  onUndo: () => Promise<void>
}) {
  const done = !!row?.done_at
  // Suggestion: this set's value from last time, else the previous set today.
  const suggestW = toDisplay(prev?.weight_kg ?? hint?.weight_kg, unit)
  const suggestR = prev?.reps ?? hint?.reps ?? null
  const [w, setW] = useState(row?.weight_kg != null ? fmtNum(toDisplay(row.weight_kg, unit)) : '')
  const [r, setR] = useState(row?.reps != null ? String(row.reps) : '')

  useEffect(() => {
    setW(row?.weight_kg != null ? fmtNum(toDisplay(row.weight_kg, unit)) : '')
    setR(row?.reps != null ? String(row.reps) : '')
  }, [row?.weight_kg, row?.reps, unit])

  function values() {
    const wv = w === '' ? suggestW : Number(w.replace(',', '.'))
    const rv = r === '' ? suggestR : Number(r)
    return [fromDisplay(wv ?? null, unit), rv == null || Number.isNaN(rv) ? null : rv] as const
  }

  async function toggle() {
    if (done) return onUndo()
    const [kg, reps] = values()
    await onSave(kg, reps)
    onDone()
  }

  async function blurSave() {
    if (done) {
      const [kg, reps] = values()
      await onSave(kg, reps)
    }
  }

  const inputCls = `w-full rounded-xl border bg-bg px-2 py-2.5 text-center tabular-nums outline-none focus:border-accent ${done ? 'border-accent/40' : 'border-line'}`

  return (
    <div className={`grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 ${optional && !done ? 'opacity-60' : ''}`}>
      <span className="text-center text-sm font-semibold text-mute">
        {index + 1}
        {optional && <span className="block text-[9px] font-normal leading-none">opc.</span>}
      </span>
      <input
        className={inputCls}
        inputMode="decimal"
        placeholder={suggestW != null ? fmtNum(suggestW) : '—'}
        value={w}
        onChange={(e) => setW(e.target.value)}
        onBlur={blurSave}
      />
      <input
        className={inputCls}
        inputMode="numeric"
        placeholder={suggestR != null ? String(suggestR) : '—'}
        value={r}
        onChange={(e) => setR(e.target.value.replace(/\D/g, ''))}
        onBlur={blurSave}
      />
      <button
        onClick={toggle}
        aria-label={done ? 'Desmarcar serie' : 'Marcar serie'}
        className={`flex h-11 items-center justify-center rounded-xl transition active:scale-95 ${done ? 'bg-accent text-accent-ink' : 'bg-panel-2 text-mute'}`}
      >
        <Check size={22} strokeWidth={3} />
      </button>
    </div>
  )
}
