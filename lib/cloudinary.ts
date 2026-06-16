/**
 * Cloudinary direct-upload helper.
 *
 * The browser never holds the API secret: the backend hands us a short-lived
 * signature (`signDocumentUpload`), we POST the file straight to Cloudinary,
 * and Cloudinary returns the stored asset. We then derive a preview image
 * ("file image") for images and PDFs so the documents table can show real
 * thumbnails.
 */

export interface CloudinarySignature {
  cloud_name: string
  api_key: string
  timestamp: number
  signature: string
  folder: string
  resource_type: string
}

export interface UploadedAsset {
  file_url: string
  file_public_id: string
  file_thumbnail_url: string
  file_mime_type: string
  file_size: number
}

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  resource_type: string
  format?: string
  bytes: number
}

/**
 * Build a thumbnail transformation URL from an upload result. Cloudinary can
 * rasterise images and the first page of PDFs; for anything it can't render
 * (raw .docx, .zip, …) we return '' so the UI falls back to a file-type icon.
 */
function deriveThumbnail(
  res: CloudinaryUploadResponse,
  mime: string,
): string {
  const isImage = res.resource_type === 'image' || mime.startsWith('image/')
  const isPdf = mime === 'application/pdf' || res.format === 'pdf'
  if (!isImage && !isPdf) return ''

  // secure_url looks like .../<resource_type>/upload/v123/<path>.<ext>
  // Insert the transform right after the first `/upload/`.
  const marker = '/upload/'
  const i = res.secure_url.indexOf(marker)
  if (i === -1) return res.secure_url
  const transform = isPdf
    ? 'c_fill,w_96,h_96,g_auto,pg_1,f_jpg,q_auto'
    : 'c_fill,w_96,h_96,g_auto,f_auto,q_auto'
  const head = res.secure_url.slice(0, i + marker.length)
  let tail = res.secure_url.slice(i + marker.length)
  // For PDFs, swap the extension so the derived asset is a real image.
  if (isPdf) tail = tail.replace(/\.pdf$/i, '.jpg')
  return `${head}${transform}/${tail}`
}

export async function uploadToCloudinary(
  file: File,
  sig: CloudinarySignature,
): Promise<UploadedAsset> {
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', sig.api_key)
  form.append('timestamp', String(sig.timestamp))
  form.append('signature', sig.signature)
  form.append('folder', sig.folder)

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${sig.resource_type}/upload`
  const resp = await fetch(endpoint, { method: 'POST', body: form })
  if (!resp.ok) {
    let detail = ''
    try {
      const body = (await resp.json()) as { error?: { message?: string } }
      detail = body?.error?.message ?? ''
    } catch {
      // ignore — fall back to the status text
    }
    throw new Error(detail || `Upload failed (${resp.status}).`)
  }
  const res = (await resp.json()) as CloudinaryUploadResponse
  const mime = file.type || ''
  return {
    file_url: res.secure_url,
    file_public_id: res.public_id,
    file_thumbnail_url: deriveThumbnail(res, mime),
    file_mime_type: mime,
    file_size: res.bytes ?? file.size,
  }
}
