import { useCallback, useState } from 'react'

type Next = number | ((current: number) => number)

const keyOf = (deps: unknown[]) =>
  JSON.stringify(deps, (_k, v) => (v instanceof Set ? Array.from(v) : v))

/**
 * Page index that returns to the first page whenever any of `deps` (search
 * text, filters, page size...) changes. The reset is derived while rendering
 * rather than done in an effect, so there is no extra render with a stale page.
 */
export function useKeyedPage(deps: unknown[]): [number, (next: Next) => void] {
  const key = keyOf(deps)
  const [state, setState] = useState({ key, page: 0 })
  const page = state.key === key ? state.page : 0
  const setPage = useCallback(
    (next: Next) =>
      setState((s) => {
        const current = s.key === key ? s.page : 0
        return { key, page: typeof next === 'function' ? next(current) : next }
      }),
    [key],
  )
  return [page, setPage]
}
