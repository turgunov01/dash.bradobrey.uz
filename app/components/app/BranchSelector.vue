<script setup lang="ts">
import type { Branch } from '~~/shared/schemas'

defineProps<{
  collapsed?: boolean
}>()

const branchStore = useBranchStore()
const sessionStore = useSessionStore()

await Promise.all([
  sessionStore.ensureLoaded(),
  branchStore.ensureLoaded()
])

function normalizeBranchId(value: unknown) {
  const id = String(value ?? '').trim()
  return id || null
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function collectBranchIds(source: unknown) {
  const ids = new Set<string>()

  if (!source || typeof source !== 'object') {
    return ids
  }

  const record = source as Record<string, unknown>
  const directId = normalizeBranchId(record.branch_id ?? record.branchId)

  if (directId) {
    ids.add(directId)
  }

  const listValues = [record.branch_ids, record.branchIds, record.branches]

  for (const value of listValues) {
    if (!Array.isArray(value)) {
      continue
    }

    for (const item of value) {
      if (item && typeof item === 'object') {
        const itemRecord = item as Record<string, unknown>
        const itemId = normalizeBranchId(itemRecord.id ?? itemRecord.branch_id ?? itemRecord.branchId)

        if (itemId) {
          ids.add(itemId)
        }

        continue
      }

      const itemId = normalizeBranchId(item)

      if (itemId) {
        ids.add(itemId)
      }
    }
  }

  return ids
}

function hasMeaningfulValue(value: unknown) {
  if (value === undefined || value === null) {
    return false
  }

  if (typeof value === 'string') {
    return Boolean(value.trim())
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0
  }

  return true
}

function hasMerchantInfo(branch: Branch) {
  const record = branch as Record<string, unknown>
  const merchantKeys = [
    'marketplace_barbershop_id',
    'marketplaceBarbershopId',
    'marketplace_barbershop_name',
    'marketplaceBarbershopName',
    'marketplace_barbershop',
    'marketplaceBarbershop',
    'barbershop_id',
    'barbershopId',
    'barbershop_name',
    'barbershopName',
    'barbershop',
    'merchant_id',
    'merchantId',
    'merchant_name',
    'merchantName',
    'merchant'
  ]

  return merchantKeys.some(key => hasMeaningfulValue(record[key]))
}

const scopedBranchIds = computed(() => {
  return new Set([
    ...collectBranchIds(sessionStore.user),
    ...collectBranchIds(sessionStore.barber)
  ])
})

const ownBranches = computed(() =>
  branchStore.branches.filter(branch => !hasMerchantInfo(branch))
)

const visibleBranches = computed(() => {
  if (!scopedBranchIds.value.size) {
    return ownBranches.value
  }

  return ownBranches.value.filter(branch => scopedBranchIds.value.has(String(branch.id)))
})

const options = computed(() =>
  [
    ...(!scopedBranchIds.value.size ? [{ label: 'Общее', value: null }] : []),
    ...visibleBranches.value.map((branch: Branch) => ({
      label: normalizeText(branch.name) || 'Филиал',
      value: branch.id
    }))
  ]
)

const activeBranchId = computed({
  get: () => branchStore.activeBranchId ?? null,
  set: (value?: string | null) => branchStore.setActiveBranch(value)
})

watch(
  visibleBranches,
  (branches) => {
    const activeId = branchStore.activeBranchId ? String(branchStore.activeBranchId) : null

    if (!activeId) {
      if (scopedBranchIds.value.size) {
        branchStore.setActiveBranch(branches[0]?.id || null)
      }

      return
    }

    if (branches.some(branch => String(branch.id) === activeId)) {
      return
    }

    branchStore.setActiveBranch(scopedBranchIds.value.size ? branches[0]?.id || null : null)
  },
  { immediate: true }
)
</script>

<template>
  <div class="w-full">
    <USelectMenu
      v-model="activeBranchId"
      class="w-full"
      color="neutral"
      :items="options"
      :placeholder="collapsed ? 'Филиал' : 'Выберите филиал'"
      value-key="value"
    />
  </div>
</template>
