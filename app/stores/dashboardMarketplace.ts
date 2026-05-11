import { defineStore } from 'pinia'
import type { DashboardMarketplaceAvailabilityQuery } from '~/composables/useDashboardMarketplaceApi'

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

type DashboardMarketplaceState = {
  barbershops: unknown[]
  barbershopsStatus: LoadStatus
  barbershopsError: string | null

  selectedBarbershop: unknown | null
  selectedBarbershopStatus: LoadStatus
  selectedBarbershopError: string | null

  branches: unknown[]
  branchesStatus: LoadStatus
  branchesError: string | null

  selectedBranch: unknown | null
  selectedBranchStatus: LoadStatus
  selectedBranchError: string | null

  availability: unknown | null
  availabilityStatus: LoadStatus
  availabilityError: string | null
}

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

export const useDashboardMarketplaceStore = defineStore('dashboard-marketplace', {
  state: (): DashboardMarketplaceState => ({
    availability: null,
    availabilityError: null,
    availabilityStatus: 'idle',
    barbershops: [],
    barbershopsError: null,
    barbershopsStatus: 'idle',
    branches: [],
    branchesError: null,
    branchesStatus: 'idle',
    selectedBarbershop: null,
    selectedBarbershopError: null,
    selectedBarbershopStatus: 'idle',
    selectedBranch: null,
    selectedBranchError: null,
    selectedBranchStatus: 'idle'
  }),

  actions: {
    reset() {
      this.barbershops = []
      this.barbershopsStatus = 'idle'
      this.barbershopsError = null
      this.selectedBarbershop = null
      this.selectedBarbershopStatus = 'idle'
      this.selectedBarbershopError = null
      this.branches = []
      this.branchesStatus = 'idle'
      this.branchesError = null
      this.selectedBranch = null
      this.selectedBranchStatus = 'idle'
      this.selectedBranchError = null
      this.availability = null
      this.availabilityStatus = 'idle'
      this.availabilityError = null
    },

    async fetchBarbershops(options: { city?: string, status?: 'active' | 'inactive' | 'all' } = {}) {
      this.barbershopsStatus = 'loading'
      this.barbershopsError = null

      try {
        const api = useDashboardMarketplaceApi()
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

          this.barbershops = Array.from(uniqueById.values())
        } else {
          const res = await api.fetchBarbershops(city, { active: status !== 'inactive' })
          this.barbershops = Array.isArray(res?.items) ? res.items : []
        }

        this.barbershopsStatus = 'loaded'
        return this.barbershops
      } catch (e) {
        this.barbershopsStatus = 'error'
        this.barbershopsError = errorMessage(e)
        throw e
      }
    },

    async fetchBarbershop(id: string) {
      this.selectedBarbershopStatus = 'loading'
      this.selectedBarbershopError = null

      try {
        const api = useDashboardMarketplaceApi()
        const res = await api.fetchBarbershop(id)
        this.selectedBarbershop = (res as any)?.item ?? null
        this.selectedBarbershopStatus = 'loaded'
        return this.selectedBarbershop
      } catch (e) {
        this.selectedBarbershopStatus = 'error'
        this.selectedBarbershopError = errorMessage(e)
        throw e
      }
    },

    async fetchBranches(barbershopId: string, options: { active?: boolean } = {}) {
      this.branchesStatus = 'loading'
      this.branchesError = null

      try {
        const api = useDashboardMarketplaceApi()
        const res = await api.fetchBranches(barbershopId, options)
        this.branches = Array.isArray(res?.items) ? res.items : []
        this.branchesStatus = 'loaded'
        return this.branches
      } catch (e) {
        this.branchesStatus = 'error'
        this.branchesError = errorMessage(e)
        throw e
      }
    },

    async fetchBranch(id: string) {
      this.selectedBranchStatus = 'loading'
      this.selectedBranchError = null

      try {
        const api = useDashboardMarketplaceApi()
        const res = await api.fetchBranch(id)
        this.selectedBranch = res ?? null
        this.selectedBranchStatus = 'loaded'
        return this.selectedBranch
      } catch (e) {
        this.selectedBranchStatus = 'error'
        this.selectedBranchError = errorMessage(e)
        throw e
      }
    },

    async fetchAvailability(branchId: string, query: DashboardMarketplaceAvailabilityQuery) {
      this.availabilityStatus = 'loading'
      this.availabilityError = null

      try {
        const api = useDashboardMarketplaceApi()
        const res = await api.fetchAvailability(branchId, query)
        this.availability = res ?? null
        this.availabilityStatus = 'loaded'
        return this.availability
      } catch (e) {
        this.availabilityStatus = 'error'
        this.availabilityError = errorMessage(e)
        throw e
      }
    }
  }
})

