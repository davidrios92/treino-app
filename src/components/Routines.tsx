import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, ChevronRight, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import { db, patch, save, softDelete, uuid, type Exercise, type Routine, type RoutineItem } from '../lib/db'
import { fmtRest, targetText, useExercises, useItems, useRoutines } from '../lib/logic'
import ExerciseSheet from './ExerciseSheet'
import { Btn, Empty, Field, inputCls, Sheet } from './ui'

export default function Routines() {
  const [view, setView] = useState<'routines' | 'library'>('routines')
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-panel p-1">
        {(['routines', 'library'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-xl py-2 text-sm ${view === v ? 'bg-panel-2 font-semibold text-accent' : 'text-mute'}`}
          >
            {v === 'routines' ? 'Rutinas' : 'Ejercicios'}
          </button>
        ))}
      </div>
      {view === 'routines' ? <RoutineList /> : <Library />}
    </div>
  )
}

// Swap `position` of two neighbours.
async function move<T extends { id: string; position: number }>(table: 'routines' | 'routine_items', list: T[], i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= list.length) return
  await patch(table, list[i].id, { position: list[j].position })
  await patch(table, list[j].id, { position: list[i].position })
}

async function normalize<T extends { id: string; position: number }>(table: 'routines' | 'routine_items', list: T[]) {
  for (const [i, r] of list.entries()) if (r.position !== i) await patch(table, r.id, { position: i })
}

function RoutineList() {
  const routines = useRoutines()
  const counts = useLiveQuery(async () => {
    const m = new Map<string, number>()
    for (const it of await db.routine_items.toArray()) if (!it.deleted) m.set(it.routine_id, (m.get(it.routine_id) ?? 0) + 1)
    return m
  })
  const [editing, setEditing] = useState<string | null>(null)
  if (!routines || !counts) return null

  async function add() {
    await normalize('routines', routines!)
    const r = await save<Routine>('routines', {
      id: uuid(),
      name: 'Nueva rutina',
      short: String.fromCharCode(65 + routines!.length),
      position: routines!.length,
    })
    setEditing(r.id)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">Las rutinas se hacen en este orden y vuelven a empezar. Usa las flechas para cambiar el orden.</p>
      {routines.map((r, i) => (
        <div key={r.id} className="flex items-center gap-2 rounded-2xl border border-line bg-panel p-3">
          <div className="flex flex-col">
            <button disabled={i === 0} onClick={() => move('routines', routines, i, -1)} className="p-1 text-mute disabled:opacity-20" aria-label="Subir">
              <ArrowUp size={16} />
            </button>
            <button
              disabled={i === routines.length - 1}
              onClick={() => move('routines', routines, i, 1)}
              className="p-1 text-mute disabled:opacity-20"
              aria-label="Bajar"
            >
              <ArrowDown size={16} />
            </button>
          </div>
          <button onClick={() => setEditing(r.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent font-bold text-accent-ink">{r.short ?? '?'}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{r.name}</div>
              <div className="text-xs text-mute">{counts.get(r.id) ?? 0} ejercicios</div>
            </div>
            <ChevronRight size={18} className="text-mute" />
          </button>
        </div>
      ))}
      <Btn kind="ghost" onClick={add} className="flex w-full items-center justify-center gap-2">
        <Plus size={18} /> Nueva rutina
      </Btn>
      {editing && <RoutineEditor routineId={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function RoutineEditor({ routineId, onClose }: { routineId: string; onClose: () => void }) {
  const routine = useLiveQuery(() => db.routines.get(routineId), [routineId])
  const items = useItems(routineId)
  const exercises = useExercises()
  const [itemEdit, setItemEdit] = useState<RoutineItem | 'new' | null>(null)
  if (!routine || !items || !exercises) return null

  async function remove() {
    if (!confirm(`¿Borrar la rutina "${routine!.name}"? El historial se conserva.`)) return
    for (const it of items!) await softDelete('routine_items', it.id)
    await softDelete('routines', routineId)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title="Editar rutina">
      <div className="space-y-4">
        <div className="grid grid-cols-[4.5rem_1fr] gap-3">
          <Field label="Letra">
            <input
              className={`${inputCls} text-center`}
              maxLength={2}
              defaultValue={routine.short ?? ''}
              onBlur={(e) => patch('routines', routineId, { short: e.target.value.trim() || null })}
            />
          </Field>
          <Field label="Nombre">
            <input className={inputCls} defaultValue={routine.name} onBlur={(e) => patch('routines', routineId, { name: e.target.value.trim() || 'Rutina' })} />
          </Field>
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="flex items-center gap-2 rounded-2xl bg-panel-2 p-2.5">
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => move('routine_items', items, i, -1)} className="p-0.5 text-mute disabled:opacity-20" aria-label="Subir">
                  <ArrowUp size={15} />
                </button>
                <button
                  disabled={i === items.length - 1}
                  onClick={() => move('routine_items', items, i, 1)}
                  className="p-0.5 text-mute disabled:opacity-20"
                  aria-label="Bajar"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
              <button onClick={() => setItemEdit(it)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium">
                  {it.exercise_ids.map((id) => exercises.get(id)?.name_pt ?? '?').join(' ou ')}
                </div>
                <div className="text-xs text-mute">
                  {targetText(it)} · descanso {fmtRest(it.rest_sec)}
                </div>
              </button>
              <button onClick={() => setItemEdit(it)} className="p-1.5 text-mute" aria-label="Editar">
                <Pencil size={16} />
              </button>
            </div>
          ))}
          {!items.length && <Empty>Esta rutina todavía no tiene ejercicios.</Empty>}
        </div>

        <Btn kind="ghost" onClick={() => setItemEdit('new')} className="flex w-full items-center justify-center gap-2">
          <Plus size={18} /> Agregar ejercicio
        </Btn>
        <Btn kind="danger" onClick={remove} className="flex w-full items-center justify-center gap-2">
          <Trash2 size={16} /> Borrar rutina
        </Btn>
      </div>

      {itemEdit && (
        <ItemEditor
          routineId={routineId}
          item={itemEdit === 'new' ? null : itemEdit}
          nextPosition={items.length}
          exercises={exercises}
          onClose={() => setItemEdit(null)}
        />
      )}
    </Sheet>
  )
}

const REST_OPTIONS = [45, 60, 75, 90, 120, 150, 180, 240]

function ItemEditor({
  routineId,
  item,
  nextPosition,
  exercises,
  onClose,
}: {
  routineId: string
  item: RoutineItem | null
  nextPosition: number
  exercises: Map<string, Exercise>
  onClose: () => void
}) {
  const [f, setF] = useState(() => ({
    exercise_ids: item?.exercise_ids ?? [],
    sets: item?.sets ?? 3,
    sets_optional: item?.sets_optional ?? 0,
    reps_min: item?.reps_min ?? 8,
    reps_max: item?.reps_max ?? 12,
    reps_note: item?.reps_note ?? '',
    rest_sec: item?.rest_sec ?? 90,
    per_side: item?.per_side ?? false,
    notes: item?.notes ?? '',
  }))
  const [picking, setPicking] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))
  const num = (v: string) => (v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0))

  async function submit() {
    if (!f.exercise_ids.length) return alert('Elige al menos un ejercicio.')
    const row = {
      routine_id: routineId,
      exercise_ids: f.exercise_ids,
      sets: Math.max(1, f.sets),
      sets_optional: f.sets_optional,
      reps_min: f.reps_min || null,
      reps_max: f.reps_max || null,
      reps_note: f.reps_note.trim() || null,
      rest_sec: f.rest_sec,
      per_side: f.per_side,
      notes: f.notes.trim() || null,
    }
    if (item) await patch('routine_items', item.id, row)
    else await save<RoutineItem>('routine_items', { id: uuid(), position: nextPosition, ...row })
    onClose()
  }

  async function remove() {
    if (item && confirm('¿Quitar este ejercicio de la rutina?')) {
      await softDelete('routine_items', item.id)
      onClose()
    }
  }

  return (
    <Sheet open onClose={onClose} title={item ? 'Editar ejercicio' : 'Agregar ejercicio'}>
      <div className="space-y-4">
        <Field label="Ejercicio (si agregas más de uno, eliges cuál hacer en el momento)">
          <div className="space-y-2">
            {f.exercise_ids.map((id) => (
              <div key={id} className="flex items-center justify-between rounded-xl bg-panel-2 px-3 py-2 text-sm">
                {exercises.get(id)?.name_pt ?? '?'}
                <button onClick={() => set('exercise_ids', f.exercise_ids.filter((x) => x !== id))} className="p-1 text-mute" aria-label="Quitar">
                  <X size={16} />
                </button>
              </div>
            ))}
            <Btn kind="ghost" className="w-full text-sm" onClick={() => setPicking(true)}>
              <Plus size={14} className="mr-1 inline" /> {f.exercise_ids.length ? 'Agregar alternativa' : 'Elegir ejercicio'}
            </Btn>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Series">
            <input className={inputCls} inputMode="numeric" value={f.sets} onChange={(e) => set('sets', num(e.target.value))} />
          </Field>
          <Field label="Series opcionales">
            <input className={inputCls} inputMode="numeric" value={f.sets_optional} onChange={(e) => set('sets_optional', num(e.target.value))} />
          </Field>
          <Field label="Reps mín.">
            <input className={inputCls} inputMode="numeric" value={f.reps_min || ''} onChange={(e) => set('reps_min', num(e.target.value))} />
          </Field>
          <Field label="Reps máx.">
            <input className={inputCls} inputMode="numeric" value={f.reps_max || ''} onChange={(e) => set('reps_max', num(e.target.value))} />
          </Field>
        </div>
        <Field label="Nota de reps (si no hay número fijo)">
          <input className={inputCls} placeholder="ej.: 30–45 segundos" value={f.reps_note} onChange={(e) => set('reps_note', e.target.value)} />
        </Field>
        <Field label="Descanso entre series">
          <div className="flex flex-wrap gap-1.5">
            {REST_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => set('rest_sec', s)}
                className={`rounded-full border px-3 py-1.5 text-sm ${f.rest_sec === s ? 'border-accent text-accent' : 'border-line text-mute'}`}
              >
                {fmtRest(s)}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#b6f24a]" checked={f.per_side} onChange={(e) => set('per_side', e.target.checked)} />
          Las repeticiones son por cada pierna/lado
        </label>
        <Field label="Notas (del personal, máquina, ajuste…)">
          <textarea className={inputCls} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        <Btn onClick={submit} className="w-full">
          Guardar
        </Btn>
        {item && (
          <Btn kind="danger" onClick={remove} className="w-full">
            Quitar de la rutina
          </Btn>
        )}
      </div>

      {picking && (
        <ExercisePicker
          exercises={exercises}
          exclude={f.exercise_ids}
          onPick={(id) => {
            set('exercise_ids', [...f.exercise_ids, id])
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </Sheet>
  )
}

function ExercisePicker({
  exercises,
  exclude,
  onPick,
  onClose,
}: {
  exercises: Map<string, Exercise>
  exclude: string[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(
    () =>
      [...exercises.values()]
        .filter((e) => !exclude.includes(e.id))
        .filter((e) => `${e.name_pt} ${e.name_en ?? ''} ${e.muscle ?? ''}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.name_pt.localeCompare(b.name_pt)),
    [exercises, exclude, q],
  )
  return (
    <Sheet open onClose={onClose} title="Elegir ejercicio">
      <input className={`${inputCls} mb-3`} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-1.5">
        {list.map((e) => (
          <button key={e.id} onClick={() => onPick(e.id)} className="flex w-full items-center gap-3 rounded-xl bg-panel-2 p-2 text-left">
            {e.images[0] ? <img src={e.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-bg" />}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{e.name_pt}</div>
              <div className="truncate text-xs text-mute">{e.muscle}</div>
            </div>
          </button>
        ))}
        {!list.length && <Empty>No encontrado. Créalo en la pestaña Ejercicios.</Empty>}
      </div>
    </Sheet>
  )
}

// ---------------- Library ----------------

function Library() {
  const exercises = useExercises()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Exercise | 'new' | null>(null)
  const [view, setView] = useState<Exercise | null>(null)
  if (!exercises) return null
  const list = [...exercises.values()]
    .filter((e) => `${e.name_pt} ${e.name_en ?? ''} ${e.muscle ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name_pt.localeCompare(b.name_pt))

  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="Buscar ejercicio…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Btn kind="ghost" onClick={() => setEdit('new')} className="flex w-full items-center justify-center gap-2">
        <Plus size={18} /> Nuevo ejercicio
      </Btn>
      {list.map((e) => (
        <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-2.5">
          {e.images[0] ? <img src={e.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" /> : <div className="h-12 w-12 rounded-xl bg-panel-2" />}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{e.name_pt}</div>
            <div className="truncate text-xs text-mute">
              {e.muscle}
              {e.video_id ? ' · video' : ''}
            </div>
          </div>
          <button onClick={() => setView(e)} className="p-2 text-mute" aria-label="Ver">
            <Eye size={18} />
          </button>
          <button onClick={() => setEdit(e)} className="p-2 text-mute" aria-label="Editar">
            <Pencil size={18} />
          </button>
        </div>
      ))}
      {view && <ExerciseSheet exercise={view} open onClose={() => setView(null)} />}
      {edit && <ExerciseEditor exercise={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

export function parseYoutubeId(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^[\w-]{11}$/.test(s)) return s
  const m = s.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/)
  return m ? m[1] : null
}

function ExerciseEditor({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const [f, setF] = useState(() => ({
    name_pt: exercise?.name_pt ?? '',
    name_en: exercise?.name_en ?? '',
    muscle: exercise?.muscle ?? '',
    description: exercise?.description ?? '',
    tips: (exercise?.tips ?? []).join('\n'),
    video: exercise?.video_id ? `https://youtu.be/${exercise.video_id}` : '',
  }))
  const set = <K extends keyof typeof f>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }))
  const videoId = parseYoutubeId(f.video)
  const videoBad = f.video.trim() !== '' && !videoId

  async function submit() {
    if (!f.name_pt.trim()) return alert('Ponle un nombre.')
    if (videoBad) return alert('El link de YouTube no es válido.')
    const row = {
      name_pt: f.name_pt.trim(),
      name_en: f.name_en.trim() || null,
      muscle: f.muscle.trim() || null,
      description: f.description.trim() || null,
      tips: f.tips.split('\n').map((t) => t.trim()).filter(Boolean),
      video_id: videoId,
      video_title: videoId && videoId === exercise?.video_id ? exercise.video_title : null,
    }
    if (exercise) await patch('exercises', exercise.id, row)
    else await save<Exercise>('exercises', { id: uuid(), slug: null, images: [], is_custom: true, ...row })
    onClose()
  }

  async function remove() {
    if (!exercise) return
    const used = (await db.routine_items.toArray()).some((it) => !it.deleted && it.exercise_ids.includes(exercise.id))
    if (used) return alert('Este ejercicio está en una rutina. Quítalo de la rutina primero.')
    if (!confirm('¿Borrar este ejercicio? El historial se conserva.')) return
    await softDelete('exercises', exercise.id)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
      <div className="space-y-4">
        <Field label="Nombre (português)">
          <input className={inputCls} value={f.name_pt} onChange={(e) => set('name_pt', e.target.value)} />
        </Field>
        <Field label="Nombre en inglés (opcional)">
          <input className={inputCls} value={f.name_en} onChange={(e) => set('name_en', e.target.value)} />
        </Field>
        <Field label="Músculos">
          <input className={inputCls} value={f.muscle} onChange={(e) => set('muscle', e.target.value)} />
        </Field>
        <Field label="Descripción">
          <textarea className={inputCls} rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Pasos / consejos (uno por línea)">
          <textarea className={inputCls} rows={5} value={f.tips} onChange={(e) => set('tips', e.target.value)} />
        </Field>
        <Field label="Video de YouTube (link)">
          <input className={inputCls} placeholder="https://youtu.be/…" value={f.video} onChange={(e) => set('video', e.target.value)} />
          {videoBad && <span className="mt-1 block text-xs text-bad">Link no reconocido.</span>}
          {videoId && <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" className="mt-2 w-40 rounded-lg" />}
        </Field>
        <Btn onClick={submit} className="w-full">
          Guardar
        </Btn>
        {exercise && (
          <Btn kind="danger" onClick={remove} className="w-full">
            Borrar ejercicio
          </Btn>
        )}
      </div>
    </Sheet>
  )
}
