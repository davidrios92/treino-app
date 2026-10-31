import { lazy, Suspense, useEffect, useState } from 'react'
import type { Session as AuthSession } from '@supabase/supabase-js'
import { CalendarDays, Dumbbell, LineChart, ListChecks, Settings as Gear } from 'lucide-react'
import { supabase } from './lib/supabase'
import { clearLocalData, startSyncLoop, syncNow } from './lib/sync'
import { seedIfEmpty } from './lib/seed'
import Login, { SetNewPassword } from './components/Login'
import Today from './components/Today'
import History from './components/History'
const Progress = lazy(() => import('./components/Progress'))
import Routines from './components/Routines'
import SettingsSheet from './components/SettingsSheet'
import SyncDot from './components/SyncDot'

type Tab = 'today' | 'history' | 'progress' | 'routines'

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuth(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setAuth(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (auth === undefined) return null
  if (recovering && auth) return <SetNewPassword onDone={() => setRecovering(false)} />
  if (!auth) return <Login />
  return <Main userId={auth.user.id} email={auth.user.email ?? ''} />
}

let loopStarted = false

function Main({ userId, email }: { userId: string; email: string }) {
  const [tab, setTab] = useState<Tab>('today')
  const [ready, setReady] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // A different account than the cached one → start clean.
      const owner = localStorage.getItem('treino.owner')
      if (owner && owner !== userId) await clearLocalData()
      localStorage.setItem('treino.owner', userId)
      if (!loopStarted) {
        loopStarted = true
        startSyncLoop()
      }
      await syncNow() // pull existing data first so we don't seed over it
      await seedIfEmpty(userId)
      void syncNow()
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const tabs: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
    { id: 'today', label: 'Hoy', icon: Dumbbell },
    { id: 'history', label: 'Historial', icon: CalendarDays },
    { id: 'progress', label: 'Progreso', icon: LineChart },
    { id: 'routines', label: 'Rutinas', icon: ListChecks },
  ]

  return (
    <div className="flex min-h-full flex-col">
      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="rounded-lg bg-accent px-1.5 py-0.5 text-accent-ink">T</span> Treino
        </div>
        <div className="flex items-center gap-3">
          <SyncDot />
          <button onClick={() => setSettingsOpen(true)} className="rounded-full bg-panel-2 p-2" aria-label="Ajustes">
            <Gear size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-28">
        {!ready ? (
          <div className="py-20 text-center text-mute">Cargando…</div>
        ) : tab === 'today' ? (
          <Today />
        ) : tab === 'history' ? (
          <History />
        ) : tab === 'progress' ? (
          <Suspense fallback={null}><Progress /></Suspense>
        ) : (
          <Routines />
        )}
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${tab === id ? 'text-accent' : 'text-mute'}`}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} email={email} />
    </div>
  )
}
