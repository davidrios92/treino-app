import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db, type Session } from '../lib/db'
import { e1rm, finished, fmtDate, fmtNum, toDisplay, useExercises, useSessions, useSettings } from '../lib/logic'
import { Empty, inputCls } from './ui'

type Metric = 'max' | 'e1rm' | 'volume'
const METRICS: { id: Metric; label: string; hint: string }[] = [
  { id: 'max', label: 'Peso máximo', hint: 'El peso más alto que usaste en cada entrenamiento.' },
  { id: 'e1rm', label: '1RM estimado', hint: 'Fuerza estimada combinando peso y repeticiones (fórmula de Epley).' },
  { id: 'volume', label: 'Volumen', hint: 'Peso × repeticiones, sumando todas las series.' },
]

const axis = { stroke: '#8b97a8', fontSize: 11, tickLine: false, axisLine: false }
const tooltipStyle = { background: '#1c2430', border: '1px solid #263040', borderRadius: 12, color: '#e8edf3' }

export default function Progress() {
  const sessions = useSessions()
  const exercises = useExercises()
  const settings = useSettings()
  const unit = settings?.unit ?? 'kg'
  const sets = useLiveQuery(async () => (await db.session_sets.toArray()).filter((s) => !s.deleted && s.done_at))
  const [exId, setExId] = useState<string>('')
  const [metric, setMetric] = useState<Metric>('max')

  const done = useMemo(() => (sessions ? finished(sessions) : []), [sessions])
  const sessionById = useMemo(() => new Map<string, Session>(done.map((s) => [s.id, s])), [done])

  const trained = useMemo(() => {
    if (!sets || !exercises) return []
    const counts = new Map<string, number>()
    for (const s of sets) if (s.exercise_id && sessionById.has(s.session_id)) counts.set(s.exercise_id, (counts.get(s.exercise_id) ?? 0) + 1)
    return [...counts.keys()].map((id) => exercises.get(id)).filter(Boolean).sort((a, b) => a!.name_pt.localeCompare(b!.name_pt))
  }, [sets, exercises, sessionById])

  const selected = exId || trained[0]?.id || ''

  const series = useMemo(() => {
    if (!sets || !selected) return []
    const per = new Map<string, { date: string; max: number; e1rm: number; volume: number }>()
    for (const s of sets) {
      const sess = sessionById.get(s.session_id)
      if (s.exercise_id !== selected || !sess) continue
      const kg = s.weight_kg ?? 0
      const reps = s.reps ?? 0
      const cur = per.get(sess.id) ?? { date: sess.started_at, max: 0, e1rm: 0, volume: 0 }
      cur.max = Math.max(cur.max, kg)
      cur.e1rm = Math.max(cur.e1rm, e1rm(kg, reps))
      cur.volume += kg * reps
      per.set(sess.id, cur)
    }
    return [...per.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({
        label: fmtDate(p.date, { day: 'numeric', month: 'short' }),
        max: toDisplay(p.max, unit) ?? 0,
        e1rm: Math.round(toDisplay(p.e1rm, unit) ?? 0),
        volume: Math.round(toDisplay(p.volume, unit) ?? 0),
      }))
  }, [sets, selected, sessionById, unit])

  const weekly = useMemo(() => {
    const weeks: { label: string; n: number }[] = []
    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    for (let i = 11; i >= 0; i--) {
      const start = new Date(monday.getTime() - i * 7 * 864e5)
      const end = new Date(start.getTime() + 7 * 864e5)
      const n = done.filter((s) => {
        const t = new Date(s.started_at)
        return t >= start && t < end
      }).length
      weeks.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, n })
    }
    return weeks
  }, [done])

  if (!sessions || !exercises || !sets) return null
  if (!done.length) return <Empty>Cuando termines tu primer entrenamiento, aquí vas a ver tu progreso.</Empty>

  const first = series[0]
  const last = series[series.length - 1]
  const best = series.reduce((m, p) => Math.max(m, p[metric]), 0)
  const diff = first && last ? last[metric] - first[metric] : 0

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-line bg-panel p-4">
        <h3 className="mb-1 font-semibold">Entrenamientos por semana</h3>
        <p className="mb-3 text-xs text-mute">Últimas 12 semanas · objetivo 4</p>
        <div className="h-36">
          <ResponsiveContainer>
            <BarChart data={weekly} margin={{ left: -28, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="#263040" />
              <XAxis dataKey="label" {...axis} interval={1} />
              <YAxis allowDecimals={false} {...axis} domain={[0, 'dataMax + 1']} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff08' }} formatter={(v) => [v, 'entrenamientos']} />
              <Bar dataKey="n" fill="#b6f24a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-line bg-panel p-4">
        <h3 className="font-semibold">Progreso por ejercicio</h3>
        <select className={inputCls} value={selected} onChange={(e) => setExId(e.target.value)}>
          {trained.map((e) => (
            <option key={e!.id} value={e!.id}>
              {e!.name_pt}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-bg p-1">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`rounded-lg px-2 py-1.5 text-xs ${metric === m.id ? 'bg-panel-2 font-semibold text-accent' : 'text-mute'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-mute">{METRICS.find((m) => m.id === metric)?.hint}</p>

        {series.length ? (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Kpi label="Último" value={`${fmtNum(last?.[metric])}`} unit={unit} />
              <Kpi label="Mejor" value={fmtNum(best)} unit={unit} />
              <Kpi label="Cambio" value={`${diff > 0 ? '+' : ''}${fmtNum(Math.round(diff * 4) / 4)}`} unit={unit} good={diff > 0} />
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={series} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="#263040" />
                  <XAxis dataKey="label" {...axis} minTickGap={16} />
                  <YAxis {...axis} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} ${unit}`, METRICS.find((m) => m.id === metric)?.label]} />
                  <Line type="monotone" dataKey={metric} stroke="#b6f24a" strokeWidth={2.5} dot={{ r: 3, fill: '#b6f24a' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-mute">{series.length} entrenamientos con este ejercicio</p>
          </>
        ) : (
          <Empty>Sin datos todavía.</Empty>
        )}
      </section>
    </div>
  )
}

function Kpi({ label, value, unit, good }: { label: string; value: string; unit: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-panel-2 p-2">
      <div className="text-[11px] text-mute">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${good ? 'text-accent' : ''}`}>
        {value}
        <span className="text-xs font-normal text-mute"> {unit}</span>
      </div>
    </div>
  )
}
