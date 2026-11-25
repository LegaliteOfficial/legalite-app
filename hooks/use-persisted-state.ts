import { useCallback, useRef, useSyncExternalStore } from 'react'

const storeFor = (area: 'local' | 'session') =>
  area === 'session' ? window.sessionStorage : window.localStorage

const listeners = new Map<string, Set<() => void>>()

function subscribeTo(key: string, cb: () => void) {
  let set = listeners.get(key)
  if (!set) listeners.set(key, (set = new Set()))
  set.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    set.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * State kept in localStorage (or sessionStorage). The server (and the first client render) use
 * `fallback`; the saved value takes over right after hydration with no
 * mismatch and no setState-in-effect. Storage that is unavailable or holds
 * something unreadable degrades to `fallback`.
 */
export function usePersistedState<T>(
  key: string,
  fallback: () => T,
  parse: (raw: string) => T,
  serialize: (value: T) => string,
  area: 'local' | 'session' = 'local',
): [T, (next: T | ((current: T) => T)) => void] {
  const fallbackRef = useRef<T | undefined>(undefined)
  const cache = useRef<{ raw: string | null; value: T } | null>(null)

  const getFallback = () => (fallbackRef.current ??= fallback())

  const getSnapshot = (): T => {
    let raw: string | null = null
    try {
      raw = storeFor(area).getItem(key)
    } catch {
      /* storage blocked: use the fallback */
    }
    if (cache.current && cache.current.raw === raw) return cache.current.value
    let value: T
    try {
      value = raw === null ? getFallback() : parse(raw)
    } catch {
      value = getFallback()
    }
    cache.current = { raw, value }
    return value
  }

  const value = useSyncExternalStore(
    (cb) => subscribeTo(key, cb),
    getSnapshot,
    getFallback,
  )

  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = cache.current?.value ?? (fallbackRef.current as T)
      const resolved =
        typeof next === 'function' ? (next as (c: T) => T)(current) : next
      try {
        storeFor(area).setItem(key, serialize(resolved))
      } catch {
        /* storage full or blocked: not critical */
      }
      listeners.get(key)?.forEach((cb) => cb())
    },
    [key, serialize, area],
  )

  return [value, set]
}
