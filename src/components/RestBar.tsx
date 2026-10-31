import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { adjustRest, getRest, onRest, stopRest } from '../lib/timer'

export default function RestBar() {
  const rest = useSyncExternalStore(onRest, getRest)
  const [now, setNow] = useState(Date.now())
  const [flash, setFlash] = useState(false)
  const firedFor = useRef<number | null>(null)

  useEffect(() => {
    if (!rest) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [rest])

  const remaining = rest ? Math.ceil((rest.endAt - now) / 1000) : 0

  useEffect(() => {
    if (rest && remaining <= 0 && firedFor.current !== rest.endAt) {
      firedFor.current = rest.endAt
      setFlash(true)
      const t = setTimeout(() => {
        setFlash(false)
        stopRest()
      }, 6000)
      return () => clearTimeout(t)
    }
  }, [rest, remaining])

  if (!rest) return null
  const over = remaining <= 0
  const pct = Math.max(0, Math.min(100, (remaining / rest.total) * 100))
  const mm = Math.floor(Math.max(0, remaining) / 60)
  const ss = String(Math.max(0, remaining) % 60).padStart(2, '0')

  return (
    <>
      {flash && <div className="rest-flash pointer-events-none fixed inset-0 z-40" />}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-40 px-3">
        <div className={`mx-auto max-w-xl overflow-hidden rounded-2xl border shadow-2xl ${over ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-panel-2'}`}>
          {!over && <div className="h-1 bg-accent transition-all" style={{ width: `${pct}%` }} />}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className={`text-[11px] uppercase tracking-wide ${over ? '' : 'text-mute'}`}>{over ? '¡Siguiente serie!' : 'Descanso'}</div>
              <div className="truncate text-xs opacity-80">{rest.label}</div>
            </div>
            <div className="text-3xl font-bold tabular-nums">
              {over ? 'YA' : `${mm}:${ss}`}
            </div>
            {!over && (
              <>
                <button onClick={() => adjustRest(-15)} className="rounded-lg bg-bg/60 px-2 py-1.5 text-sm">
                  −15
                </button>
                <button onClick={() => adjustRest(15)} className="rounded-lg bg-bg/60 px-2 py-1.5 text-sm">
                  +15
                </button>
              </>
            )}
            <button onClick={stopRest} className="rounded-full p-1.5" aria-label="Saltar descanso">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
