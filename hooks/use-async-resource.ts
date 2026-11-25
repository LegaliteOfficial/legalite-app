import { useEffect, useRef, useState } from 'react'

type Settled<T> =
  | { key: string; value: T; error: null }
  | { key: string; value: null; error: string }

/**
 * Loads something asynchronously for `key` (null = nothing to load). State is
 * only written from the promise callbacks, and a result belongs to the key it
 * was fetched for, so switching keys shows "loading" immediately instead of the
 * previous result, and no state is set synchronously inside an effect.
 */
export function useAsyncResource<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
  describeError: (err: unknown) => string,
): { value: T | null; error: string | null; loading: boolean } {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  // Callers pass fresh closures every render; the key is what identifies the
  // work, so keep the latest closures in refs instead of re-running on them.
  const loadRef = useRef(load)
  const describeRef = useRef(describeError)
  useEffect(() => {
    loadRef.current = load
    describeRef.current = describeError
  })

  useEffect(() => {
    if (key === null) return
    const ctrl = new AbortController()
    loadRef.current(ctrl.signal)
      .then((value) => {
        if (!ctrl.signal.aborted) setSettled({ key, value, error: null })
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        setSettled({ key, value: null, error: describeRef.current(err) })
      })
    return () => ctrl.abort()
  }, [key])

  const current = key !== null && settled?.key === key ? settled : null
  return {
    value: current?.value ?? null,
    error: current?.error ?? null,
    loading: key !== null && current === null,
  }
}
