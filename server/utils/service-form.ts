import { randomUUID } from 'node:crypto'

import { createError, getHeader, readFormData, type H3Event } from 'h3'

const maxServiceImageSizeBytes = 5 * 1024 * 1024

export function isServiceMultipartRequest(event: H3Event) {
  return String(getHeader(event, 'content-type') || '').includes('multipart/form-data')
}

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function getOptionalTextValue(formData: FormData, ...keys: string[]) {
  for (const key of keys) {
    const value = getTextValue(formData, key)
    if (value) return value
  }

  return undefined
}

function getOptionalBooleanValue(formData: FormData, key: string) {
  const value = getOptionalTextValue(formData, key)
  if (value === undefined) return undefined

  const normalized = value.toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  return undefined
}

function isFileValue(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File
}

function sanitizeFilePrefix(value: string) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'service'
}

function getImageExtension(file: File) {
  const byName = file.name.split('.').pop()?.trim().toLowerCase()

  if (byName && /^[a-z0-9]+$/.test(byName)) {
    return byName
  }

  switch (String(file.type || '').trim().toLowerCase()) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/avif':
      return 'avif'
    default:
      return 'png'
  }
}

function encodeStoragePath(path: string) {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

async function uploadServiceImage(event: H3Event, file: File, serviceKey: string) {
  if (!String(file.type || '').toLowerCase().startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only image files can be uploaded for a service.'
    })
  }

  if (file.size > maxServiceImageSizeBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Service image size must not exceed 5 MB.'
    })
  }

  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.supabaseUrl || '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey || '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase Storage is not configured for service image upload.'
    })
  }

  const extension = getImageExtension(file)
  const fileName = `${sanitizeFilePrefix(serviceKey)}-${Date.now()}-${randomUUID()}.${extension}`
  const storagePath = `services/${fileName}`
  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/images/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'content-type': file.type || 'application/octet-stream',
        'x-upsert': 'false'
      },
      body: Buffer.from(await file.arrayBuffer())
    }
  )

  if (!uploadResponse.ok) {
    let details = 'Failed to upload service image to Supabase Storage.'

    try {
      const payload = await uploadResponse.json()
      details = payload?.message || payload?.error || details
    }
    catch {
      const text = await uploadResponse.text().catch(() => '')
      if (text) details = text
    }

    throw createError({
      statusCode: uploadResponse.status || 502,
      statusMessage: details
    })
  }

  return `${supabaseUrl}/storage/v1/object/public/images/${encodeStoragePath(storagePath)}`
}

export async function readServiceMultipartProxyBody(event: H3Event) {
  const formData = await readFormData(event)
  const payload: Record<string, unknown> = {}

  const name = getOptionalTextValue(formData, 'name')
  const category = getOptionalTextValue(formData, 'category', 'category_name')
  const price = getOptionalTextValue(formData, 'base_price', 'price')
  const duration = getOptionalTextValue(formData, 'duration_minutes', 'duration')
  const image = getOptionalTextValue(formData, 'image')
  const isActive = getOptionalBooleanValue(formData, 'is_active')

  if (name !== undefined) payload.name = name
  if (category !== undefined) payload.category = category
  if (price !== undefined) payload.base_price = price
  if (duration !== undefined) payload.duration_minutes = duration
  if (image !== undefined) payload.image = image
  if (isActive !== undefined) payload.is_active = isActive

  const fileValue = formData.get('file')
  const imageValue = formData.get('image')
  const file = isFileValue(fileValue)
    ? fileValue
    : isFileValue(imageValue)
      ? imageValue
      : null

  if (file && file.size > 0) {
    payload.image = await uploadServiceImage(event, file, name || 'service')
  }

  return payload
}
