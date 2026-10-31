import { db, SYNCED_TABLES, setSyncHook, type Base, type SyncedTable } from './db'
import { supabase } from './supabase'
import type { Table } from 'dexie'

type Status = 'idle' | 'syncing' | 'offline' | 'error'
let status: Status = 'idle'
let lastError: string | null = null
const listeners = new Set<() => void>()

export function getSyncStatus() {
  return { status, lastError }
}
export function onSyncStatus(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function setStatus(s: Status, err: string | null = null) {
  status = s
  lastError = err
  listeners.forEach((l) => l())
}

function table(name: SyncedTable) {
  return db[name] as unknown as Table<Base, string>
}

async function push(userId: string) {
  for (const name of SYNCED_TABLES) {
    const dirty = await table(name).where('dirty').equals(1).toArray()
    if (!dirty.length) continue
    const payload = dirty.map(({ dirty: _d, ...row }) => ({ ...row, user_id: userId }))
    const { data, error } = await supabase.from(name).upsert(payload).select()
    if (error) throw error
    // Accept the server copy (server-stamped updated_at) unless the row changed locally meanwhile.
    await db.transaction('rw', table(name), async () => {
      for (const server of data as Base[]) {
        const sent = dirty.find((d) => d.id === server.id)
        const current = await table(name).get(server.id)
        if (current && sent && current.updated_at === sent.updated_at) {
          await table(name).put({ ...server, dirty: 0 })
        }
      }
    })
  }
}

async function pull() {
  for (const name of SYNCED_TABLES) {
    const key = `lastPull:${name}`
    const since = (await db.meta.get(key))?.value ?? '1970-01-01T00:00:00Z'
    const { data, error } = await supabase.from(name).select('*').gt('updated_at', since).order('updated_at').limit(5000)
    if (error) throw error
    if (!data?.length) continue
    await db.transaction('rw', table(name), db.meta, async () => {
      for (const row of data as Base[]) {
        const local = await table(name).get(row.id)
        if (local?.dirty) continue // local edit pending; it will win on next push
        await table(name).put({ ...row, dirty: 0 })
      }
      await db.meta.put({ key, value: (data[data.length - 1] as Base).updated_at })
    })
  }
}

let running: Promise<void> | null = null
let again = false

export async function syncNow(): Promise<void> {
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    try {
      if (!navigator.onLine) return setStatus('offline')
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user.id
      if (!userId) return
      setStatus('syncing')
      await push(userId)
      await pull()
      setStatus('idle')
    } catch (e) {
      setStatus(navigator.onLine ? 'error' : 'offline', e instanceof Error ? e.message : String(e))
    } finally {
      running = null
      if (again) {
        again = false
        void syncNow()
      }
    }
  })()
  return running
}

let timer: ReturnType<typeof setTimeout> | undefined
function debouncedSync() {
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), 1200)
}

export function startSyncLoop() {
  setSyncHook(debouncedSync)
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => setStatus('offline'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  setInterval(() => void syncNow(), 60_000)
}

export async function clearLocalData() {
  await db.delete()
  await db.open()
}
