// Rest timer: timestamp-based so it stays correct after backgrounding.
// Deliberately silent — no audio session, so music apps (Spotify) keep playing.

export interface RestState {
  endAt: number
  total: number
  label: string
}

const KEY = 'treino.rest'
let state: RestState | null = load()
const listeners = new Set<() => void>()

function load(): RestState | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RestState | null
    return s && s.endAt > Date.now() - 60_000 ? s : null
  } catch {
    return null
  }
}

function emit() {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l())
}

export function getRest() {
  return state
}
export function onRest(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function startRest(seconds: number, label: string) {
  state = { endAt: Date.now() + seconds * 1000, total: seconds, label }
  emit()
}

export function adjustRest(deltaSec: number) {
  if (!state) return
  const remaining = Math.max(1, (state.endAt - Date.now()) / 1000 + deltaSec)
  state = { ...state, endAt: Date.now() + remaining * 1000, total: Math.max(state.total, remaining) }
  emit()
}

export function stopRest() {
  state = null
  emit()
}

// ---------- screen wake lock ----------
let lock: WakeLockSentinel | null = null
let wantLock = false

export async function keepAwake(on: boolean) {
  wantLock = on
  try {
    if (on && !lock && 'wakeLock' in navigator) {
      lock = await navigator.wakeLock.request('screen')
      lock.addEventListener('release', () => (lock = null))
    } else if (!on && lock) {
      await lock.release()
      lock = null
    }
  } catch {
    /* not supported / denied */
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wantLock) void keepAwake(true)
})
