// Pure helpers for the platform-owner company forms (unit-tested).
import { COMPANY_CODE_PATTERN, ENROLLMENT_CODE_MAX_LENGTH, ENROLLMENT_CODE_MIN_LENGTH } from '../../shared/auth/tenancy.ts'

export type CompanyFormState = {
  name: string
  code: string
  currency: string
  timezone: string
  logo_url: string
  primary_color: string
}

export type CompanyLike = Partial<Record<keyof CompanyFormState, string | null>>

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/

export function emptyCompanyForm(company?: CompanyLike | null): CompanyFormState {
  return {
    name: company?.name ?? '',
    code: company?.code ?? '',
    currency: company?.currency ?? '',
    timezone: company?.timezone ?? '',
    logo_url: company?.logo_url ?? '',
    primary_color: company?.primary_color ?? ''
  }
}

function normalizeForm(form: CompanyFormState): CompanyFormState {
  return {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    currency: form.currency.trim().toUpperCase(),
    timezone: form.timezone.trim(),
    logo_url: form.logo_url.trim(),
    primary_color: form.primary_color.trim()
  }
}

/** Field -> Russian error for the company form; empty object when valid. */
export function validateCompanyForm(form: CompanyFormState): Partial<Record<keyof CompanyFormState, string>> {
  const value = normalizeForm(form)
  const errors: Partial<Record<keyof CompanyFormState, string>> = {}

  if (!value.name || value.name.length > 120) errors.name = 'Название: от 1 до 120 символов.'
  if (!COMPANY_CODE_PATTERN.test(value.code)) errors.code = 'Код: 2–32 символа — латинские буквы, цифры, «_» или «-», первый символ — буква или цифра.'
  if (value.currency && !CURRENCY_PATTERN.test(value.currency)) errors.currency = 'Валюта: трёхбуквенный код ISO, например UZS.'
  if (value.logo_url && !/^https?:\/\//i.test(value.logo_url)) errors.logo_url = 'Логотип: ссылка http(s)://…'
  if (value.primary_color && !COLOR_PATTERN.test(value.primary_color)) errors.primary_color = 'Цвет в формате #RRGGBB.'

  return errors
}

/**
 * Request body for POST (no original) or PATCH (only changed fields; cleared
 * logo/color become null, cleared currency/timezone are left unchanged).
 */
export function buildCompanyPayload(form: CompanyFormState, original?: CompanyLike | null): Record<string, string | null> {
  const value = normalizeForm(form)

  if (!original) {
    const payload: Record<string, string | null> = { name: value.name, code: value.code }
    for (const key of ['currency', 'timezone', 'logo_url', 'primary_color'] as const) {
      if (value[key]) payload[key] = value[key]
    }
    return payload
  }

  const before = normalizeForm(emptyCompanyForm(original))
  const payload: Record<string, string | null> = {}

  for (const key of Object.keys(value) as Array<keyof CompanyFormState>) {
    if (value[key] === before[key]) continue

    if (!value[key]) {
      if (key === 'logo_url' || key === 'primary_color') payload[key] = null
      continue
    }

    payload[key] = value[key]
  }

  return payload
}

export function validateEnrollmentCode(code: string) {
  const value = code.trim()
  return value.length >= ENROLLMENT_CODE_MIN_LENGTH && value.length <= ENROLLMENT_CODE_MAX_LENGTH
    ? ''
    : `Код подключения: от ${ENROLLMENT_CODE_MIN_LENGTH} до ${ENROLLMENT_CODE_MAX_LENGTH} символов.`
}

const ENROLLMENT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Random, readable enrollment code (no 0/O/1/I) from a CSPRNG. */
export function generateEnrollmentCode(length = 12, random: (bytes: Uint8Array) => Uint8Array = bytes => globalThis.crypto.getRandomValues(bytes)) {
  const bytes = random(new Uint8Array(length))
  return Array.from(bytes, byte => ENROLLMENT_ALPHABET[byte % ENROLLMENT_ALPHABET.length]).join('')
}
