import { randomUUID } from 'node:crypto'

import { createError, getHeader, readBody, readFormData, type H3Event } from 'h3'

import {
  barberRegisterSchema,
  barberUpdateSchema,
  type BarberRegisterPayload,
  type BarberUpdatePayload
} from '~~/shared/schemas'

const maxAvatarSizeBytes = 5 * 1024 * 1024

function getSupabaseStorageConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.supabaseUrl || '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey || '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase не настроен для загрузки аватаров сотрудников.'
    })
  }

  return {
    serviceRoleKey,
    supabaseUrl
  }
}

function isMultipartRequest(event: H3Event) {
  return String(getHeader(event, 'content-type') || '').includes('multipart/form-data')
}

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function getOptionalTextValue(formData: FormData, key: string) {
  const value = getTextValue(formData, key).trim()
  return value || undefined
}

function getPermissionValues(formData: FormData) {
  return formData
    .getAll('permissions')
    .flatMap((value) => {
      if (typeof value !== 'string') {
        return []
      }

      const normalized = value.trim()

      if (!normalized) {
        return []
      }

      if (normalized.startsWith('[')) {
        try {
          const parsed = JSON.parse(normalized)
          return Array.isArray(parsed) ? parsed.map(item => String(item)) : [normalized]
        }
        catch {
          return [normalized]
        }
      }

      return [normalized]
    })
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

  return normalized || 'employee'
}

function getAvatarExtension(file: File) {
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

async function uploadEmployeeAvatar(event: H3Event, file: File, employeeKey: string) {
  if (!String(file.type || '').toLowerCase().startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Можно загружать только изображения для аватара сотрудника.'
    })
  }

  if (file.size > maxAvatarSizeBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Размер аватара не должен превышать 5 МБ.'
    })
  }

  const { serviceRoleKey, supabaseUrl } = getSupabaseStorageConfig(event)
  const extension = getAvatarExtension(file)
  const fileName = `${sanitizeFilePrefix(employeeKey)}-${Date.now()}-${randomUUID()}.${extension}`
  const storagePath = `avatars/${fileName}`
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
    let details = 'Ошибка публикации аватара в Supabase Storage.'

    try {
      const payload = await uploadResponse.json()
      details = payload?.message || payload?.error || details
    }
    catch {
      const text = await uploadResponse.text().catch(() => '')
      if (text) {
        details = text
      }
    }

    throw createError({
      statusCode: uploadResponse.status || 502,
      statusMessage: details
    })
  }

  return `${supabaseUrl}/storage/v1/object/public/images/${encodeStoragePath(storagePath)}`
}

async function readEmployeeMultipartBase(event: H3Event) {
  const formData = await readFormData(event)
  const payload = {
    branch_id: getTextValue(formData, 'branch_id'),
    login: getTextValue(formData, 'login'),
    name: getTextValue(formData, 'name'),
    password: getOptionalTextValue(formData, 'password'),
    permissions: getPermissionValues(formData),
    photo_url: getOptionalTextValue(formData, 'photo_url'),
    phone: getOptionalTextValue(formData, 'phone'),
    role: getTextValue(formData, 'role'),
    specialization: getOptionalTextValue(formData, 'specialization')
  }
  const file = formData.get('file')

  if (isFileValue(file) && file.size > 0) {
    payload.photo_url = await uploadEmployeeAvatar(event, file, payload.login || payload.name || 'employee')
  }

  return payload
}

export async function readEmployeeRegisterPayload(event: H3Event): Promise<BarberRegisterPayload> {
  if (!isMultipartRequest(event)) {
    return barberRegisterSchema.parse(await readBody(event))
  }

  return barberRegisterSchema.parse(await readEmployeeMultipartBase(event))
}

export async function readEmployeeUpdatePayload(event: H3Event): Promise<BarberUpdatePayload> {
  if (!isMultipartRequest(event)) {
    return barberUpdateSchema.parse(await readBody(event))
  }

  return barberUpdateSchema.parse(await readEmployeeMultipartBase(event))
}
