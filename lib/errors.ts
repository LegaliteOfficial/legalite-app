import { CombinedGraphQLErrors } from '@apollo/client/errors'

/**
 * The message to show for a failed request: the server's own reason when it
 * gave one (permission refused, already a member, ...), else `fallback`.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof CombinedGraphQLErrors) {
    const msg = err.errors[0]?.message
    if (msg && msg !== 'Internal server error') return msg
    return fallback
  }
  if (err instanceof Error && err.message && !/fetch|network/i.test(err.message)) {
    return err.message
  }
  return fallback
}
