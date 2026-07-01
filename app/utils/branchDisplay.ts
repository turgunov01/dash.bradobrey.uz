import type { Branch } from '~~/shared/schemas'

export function normalizeBranchText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

export function extractListItems(response: unknown) {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    data?: unknown[] | { entry?: unknown[], items?: unknown[] }
    entry?: unknown[]
    items?: unknown[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.entry)) {
    return payload.entry
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data && typeof payload.data === 'object') {
    if (Array.isArray(payload.data.items)) {
      return payload.data.items
    }

    if (Array.isArray(payload.data.entry)) {
      return payload.data.entry
    }
  }

  return []
}

function getNestedName(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>

  return normalizeBranchText(record.name)
    || normalizeBranchText(record.title)
    || normalizeBranchText(record.login)
}

export function getBranchBarbershopId(branch: unknown) {
  if (!branch || typeof branch !== 'object') return null
  const record = branch as Record<string, unknown>

  return normalizeBranchText(record.marketplace_barbershop_id)
    || normalizeBranchText(record.marketplaceBarbershopId)
    || normalizeBranchText(record.barbershop_id)
    || normalizeBranchText(record.barbershopId)
    || normalizeBranchText(record.merchant_id)
    || normalizeBranchText(record.merchantId)
}

export function getBranchContextName(branch: unknown, namesById: Record<string, string> = {}) {
  if (!branch || typeof branch !== 'object') return null
  const record = branch as Record<string, unknown>

  const directName = normalizeBranchText(record.marketplace_barbershop_name)
    || normalizeBranchText(record.marketplaceBarbershopName)
    || normalizeBranchText(record.barbershop_name)
    || normalizeBranchText(record.barbershopName)
    || normalizeBranchText(record.merchant_name)
    || normalizeBranchText(record.merchantName)

  if (directName) {
    return directName
  }

  const nestedName = getNestedName(record.marketplace_barbershop)
    || getNestedName(record.marketplaceBarbershop)
    || getNestedName(record.barbershop)
    || getNestedName(record.merchant)

  if (nestedName) {
    return nestedName
  }

  const contextId = getBranchBarbershopId(branch)
  return contextId ? namesById[contextId] || null : null
}

export function formatBranchAttachmentLabel(
  branch: Branch | Record<string, unknown>,
  namesById: Record<string, string> = {},
  options: { fallbackContextName?: string | null } = {}
) {
  const branchName = normalizeBranchText((branch as Record<string, unknown>).name) || 'Филиал'
  const contextName = getBranchContextName(branch, namesById) || normalizeBranchText(options.fallbackContextName)

  if (!contextName) {
    return branchName
  }

  const normalizedBranchName = branchName.toLowerCase()
  const normalizedContextName = contextName.toLowerCase()

  if (normalizedBranchName.includes(`| ${normalizedContextName}`) || normalizedBranchName === normalizedContextName) {
    return branchName
  }

  return `${branchName} | ${contextName}`
}
