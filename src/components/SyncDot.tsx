import { useSyncExternalStore } from 'react'
import { Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { getSyncStatus, onSyncStatus, syncNow } from '../lib/sync'

let snap = getSyncStatus()
function subscribe(cb: () => void) {
  return onSyncStatus(() => {
    snap = getSyncStatus()
    cb()
  })
}

export default function SyncDot() {
  const { status, lastError } = useSyncExternalStore(subscribe, () => snap)
  const map = {
    idle: { icon: Cloud, cls: 'text-mute', label: 'Sincronizado' },
    syncing: { icon: RefreshCw, cls: 'text-accent animate-spin', label: 'Sincronizando' },
    offline: { icon: CloudOff, cls: 'text-warn', label: 'Sin conexión: se guarda en el celular' },
    error: { icon: TriangleAlert, cls: 'text-bad', label: `Error al sincronizar: ${lastError}` },
  }[status]
  const Icon = map.icon
  return (
    <button onClick={() => void syncNow()} title={map.label} aria-label={map.label} className="p-1">
      <Icon size={18} className={map.cls} />
    </button>
  )
}
