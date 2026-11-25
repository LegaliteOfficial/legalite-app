/**
 * Upload a file to a signed upload URL issued by the backend.
 *
 * The backend (service role) creates a one-time, path-bound upload URL for
 * Supabase Storage; the browser only sends the bytes to it. No Supabase
 * client, anon key or session is needed in the frontend, so uploads work
 * for every login method and do not depend on NEXT_PUBLIC_SUPABASE_* being
 * set in the deployment.
 */
export async function uploadToSignedUrl(signedUrl: string, file: File): Promise<void> {
  let res: Response
  try {
    res = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-upsert': 'false',
      },
      body: file,
    })
  } catch {
    throw new Error('Upload failed: could not reach file storage. Check your connection and try again.')
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = (await res.json()) as { message?: string; error?: string }
      detail = body.message || body.error || ''
    } catch {
      // Non-JSON error body; fall back to the status code.
    }
    throw new Error(`Upload failed: ${detail || `storage returned ${res.status}`}`)
  }
}
