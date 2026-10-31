import { useSyncExternalStore } from 'react'
import { Download, LogOut, RefreshCw, Volume2 } from 'lucide-react'
import { db, patch, SYNCED_TABLES } from '../lib/db'
import { useSettings } from '../lib/logic'
import { supabase } from '../lib/supabase'
import { clearLocalData, getSyncStatus, onSyncStatus, syncNow } from '../lib/sync'
import { testChime } from '../lib/timer'
import { Btn, Field, Sheet } from './ui'

let snap = getSyncStatus()
const sub = (cb: () => void) =>
  onSyncStatus(() => {
    snap = getSyncStatus()
    cb()
  })

export default function SettingsSheet({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const settings = useSettings()
  const sync = useSyncExternalStore(sub, () => snap)

  async function exportJson() {
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() }
    for (const t of SYNCED_TABLES) out[t] = await db[t].toArray()
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `treino-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function logout() {
    const pending = (await Promise.all(SYNCED_TABLES.map((t) => db[t].where('dirty').equals(1).count()))).reduce((a, b) => a + b, 0)
    if (pending && !confirm(`Hay ${pending} cambios sin sincronizar que se perderían. ¿Salir igual?`)) return
    await supabase.auth.signOut()
    await clearLocalData()
    localStorage.removeItem('treino.owner')
    location.reload()
  }

  const statusText = {
    idle: 'Todo sincronizado con la nube',
    syncing: 'Sincronizando…',
    offline: 'Sin conexión. Los datos se guardan en el celular y se suben al volver la señal.',
    error: `Error: ${sync.lastError ?? ''}`,
  }[sync.status]

  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="space-y-5">
        <Field label="Unidad de peso">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                onClick={() => settings && patch('settings', settings.id, { unit: u })}
                className={`rounded-lg py-2 ${settings?.unit === u ? 'bg-panel-2 font-semibold text-accent' : 'text-mute'}`}
              >
                {u}
              </button>
            ))}
          </div>
          <span className="mt-1 block text-xs text-mute">Todo se guarda en kg y se convierte al mostrar, así puedes cambiar cuando quieras.</span>
        </Field>

        <Field label="Sonido del descanso">
          <Btn kind="ghost" onClick={testChime} className="flex w-full items-center justify-center gap-2">
            <Volume2 size={18} /> Probar sonido
          </Btn>
          <span className="mt-1 block text-xs text-mute">
            En iPhone las web apps no pueden vibrar: al terminar el descanso suena este aviso y la pantalla parpadea. Durante el entrenamiento la
            pantalla se mantiene encendida.
          </span>
        </Field>

        <Field label="Sincronización">
          <p className="mb-2 text-sm">{statusText}</p>
          <Btn kind="ghost" onClick={() => void syncNow()} className="flex w-full items-center justify-center gap-2">
            <RefreshCw size={16} /> Sincronizar ahora
          </Btn>
        </Field>

        <Field label="Respaldo">
          <Btn kind="ghost" onClick={exportJson} className="flex w-full items-center justify-center gap-2">
            <Download size={16} /> Exportar mis datos (JSON)
          </Btn>
        </Field>

        <Field label="Cuenta">
          <p className="mb-2 text-sm text-mute">{email}</p>
          <Btn kind="danger" onClick={logout} className="flex w-full items-center justify-center gap-2">
            <LogOut size={16} /> Salir
          </Btn>
        </Field>
      </div>
    </Sheet>
  )
}
