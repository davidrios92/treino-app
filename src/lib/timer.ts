// Rest timer: timestamp-based (survives backgrounding), with a sound scheduled on the
// Web Audio clock at start time so it fires even if JS timers are throttled.
// iPhone web apps cannot vibrate, so the alert is a distinctive chime + screen flash.

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

// ---------- audio ----------
let ctx: AudioContext | null = null
let scheduled: OscillatorNode[] = []

/** Must be called from a user gesture (tap) at least once to unlock audio on iOS. */
export function unlockAudio() {
  try {
    // iOS 17+: play even with the silent switch on.
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* no audio */
  }
}

// Three quick rising notes, twice — nothing like a ringtone or message ping.
function scheduleChime(atSecondsFromNow: number) {
  if (!ctx) return
  const t0 = ctx.currentTime + Math.max(0, atSecondsFromNow)
  const notes = [987.77, 1318.51, 1760]
  for (const rep of [0, 0.55]) {
    notes.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const start = t0 + rep + i * 0.12
      osc.type = 'triangle'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(start)
      osc.stop(start + 0.12)
      scheduled.push(osc)
    })
  }
}

function cancelChime() {
  for (const o of scheduled) {
    try {
      o.stop()
    } catch {
      /* already stopped */
    }
  }
  scheduled = []
}

export function testChime() {
  unlockAudio()
  cancelChime()
  scheduleChime(0.05)
}

// ---------- controls ----------
export function startRest(seconds: number, label: string) {
  unlockAudio()
  cancelChime()
  state = { endAt: Date.now() + seconds * 1000, total: seconds, label }
  scheduleChime(seconds)
  emit()
}

export function adjustRest(deltaSec: number) {
  if (!state) return
  const remaining = Math.max(1, (state.endAt - Date.now()) / 1000 + deltaSec)
  cancelChime()
  state = { ...state, endAt: Date.now() + remaining * 1000, total: Math.max(state.total, remaining) }
  scheduleChime(remaining)
  emit()
}

export function stopRest() {
  cancelChime()
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
  if (document.visibilityState === 'visible') {
    if (wantLock) void keepAwake(true)
    if (ctx?.state === 'suspended') void ctx.resume()
    // Audio may have been suspended while hidden: re-arm the chime for the remaining time.
    if (state && state.endAt > Date.now() && ctx) {
      cancelChime()
      scheduleChime((state.endAt - Date.now()) / 1000)
    }
  }
})
