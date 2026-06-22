import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { DashboardMarketplaceAvailabilityQuery } from '~/composables/useDashboardMarketplaceApi'

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

function errorMessage(error: unknown) {
  const anyErr: any = error
  return (
    anyErr?.data?.message ||
    anyErr?.response?._data?.message ||
    anyErr?.statusMessage ||
    anyErr?.message ||
    'Request failed'
  )
}

export const useDashboardMarketplaceStore = defineStore('dashboard-marketplace', () => {
  const api = useDashboardMarketplaceApi()

  const barbershops = ref<unknown[]>([])
  const barbershopsStatus = ref<LoadStatus>('idle')
  const barbershopsError = ref<string | null>(null)

  const selectedBarbershop = ref<unknown | null>(null)
  const selectedBarbershopStatus = ref<LoadStatus>('idle')
  const selectedBarbershopError = ref<string | null>(null)

  const branches = ref<unknown[]>([])
  const branchesStatus = ref<LoadStatus>('idle')
  const branchesError = ref<string | null>(null)

  const selectedBranch = ref<unknown | null>(null)
  const selectedBranchStatus = ref<LoadStatus>('idle')
  const selectedBranchError = ref<string | null>(null)

  const availability = ref<unknown | null>(null)
  const availabilityStatus = ref<LoadStatus>('idle')
  const availabilityError = ref<string | null>(null)

  function reset() {
    barbershops.value = []
    barbershopsStatus.value = 'idle'
    barbershopsError.value = null
    selectedBarbershop.value = null
    selectedBarbershopStatus.value = 'idle'
    selectedBarbershopError.value = null
    branches.value = []
    branchesStatus.value = 'idle'
    branchesError.value = null
    selectedBranch.value = null
    selectedBranchStatus.value = 'idle'
    selectedBranchError.value = null
    availability.value = null
    availabilityStatus.value = 'idle'
    availabilityError.value = null
  }

  async function fetchBarbershops(options: { city?: string, status?: 'active' | 'inactive' | 'all' } = {}) {
    barbershopsStatus.value = 'loading'
    barbershopsError.value = null

    try {
      const city = options.city || undefined
      const status = options.status || 'active'

      if (status === 'all') {
        const [activeRes, inactiveRes] = await Promise.all([
          api.fetchBarbershops(city, { active: true }),
          api.fetchBarbershops(city, { active: false })
        ])

        const merged = [
          ...(Array.isArray(activeRes?.items) ? activeRes.items : []),
          ...(Array.isArray(inactiveRes?.items) ? inactiveRes.items : [])
        ]

        const uniqueById = new Map<string, unknown>()
        for (const item of merged) {
          const id = (item as any)?.id
          if (!id) continue
          if (!uniqueById.has(String(id))) uniqueById.set(String(id), item)
        }

        barbershops.value = Array.from(uniqueById.values())
      }
      else {
        const res = await api.fetchBarbershops(city, { active: status !== 'inactive' })
        barbershops.value = Array.isArray(res?.items) ? res.items : []
      }

      barbershopsStatus.value = 'loaded'
      return barbershops.value
    }
    catch (e) {
      barbershopsStatus.value = 'error'
      barbershopsError.value = errorMessage(e)
      throw e
    }
  }

  async function fetchBarbershop(id: string) {
    selectedBarbershopStatus.value = 'loading'
    selectedBarbershopError.value = null

    try {
      const res = await api.fetchBarbershop(id)
      selectedBarbershop.value = (res as any)?.item ?? null
      selectedBarbershopStatus.value = 'loaded'
      return selectedBarbershop.value
    }
    catch (e) {
      selectedBarbershopStatus.value = 'error'
      selectedBarbershopError.value = errorMessage(e)
      throw e
    }
  }

  async function fetchBranches(barbershopId: string, options: { active?: boolean } = {}) {
    branchesStatus.value = 'loading'
    branchesError.value = null

    try {
      const res = await api.fetchBranches(barbershopId, options)
      branches.value = Array.isArray(res?.items) ? res.items : []
      branchesStatus.value = 'loaded'
      return branches.value
    }
    catch (e) {
      branchesStatus.value = 'error'
      branchesError.value = errorMessage(e)
      throw e
    }
  }

  async function fetchBranch(id: string) {
    selectedBranchStatus.value = 'loading'
    selectedBranchError.value = null

    try {
      const res = await api.fetchBranch(id)
      selectedBranch.value = res ?? null
      selectedBranchStatus.value = 'loaded'
      return selectedBranch.value
    }
    catch (e) {
      selectedBranchStatus.value = 'error'
      selectedBranchError.value = errorMessage(e)
      throw e
    }
  }

  async function fetchAvailability(branchId: string, query: DashboardMarketplaceAvailabilityQuery) {
    availabilityStatus.value = 'loading'
    availabilityError.value = null

    try {
      const res = await api.fetchAvailability(branchId, query)
      availability.value = res ?? null
      availabilityStatus.value = 'loaded'
      return availability.value
    }
    catch (e) {
      availabilityStatus.value = 'error'
      availabilityError.value = errorMessage(e)
      throw e
    }
  }

  return {
    availability,
    availabilityError,
    availabilityStatus,
    barbershops,
    barbershopsError,
    barbershopsStatus,
    branches,
    branchesError,
    branchesStatus,
    fetchAvailability,
    fetchBarbershop,
    fetchBarbershops,
    fetchBranch,
    fetchBranches,
    reset,
    selectedBarbershop,
    selectedBarbershopError,
    selectedBarbershopStatus,
    selectedBranch,
    selectedBranchError,
    selectedBranchStatus
  }
})
