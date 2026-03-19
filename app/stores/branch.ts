import { defineStore } from 'pinia'

import type { Branch } from '~~/shared/schemas'
import { branchSchema } from '~~/shared/schemas'

type BranchState = {
  activeBranchId: string | null
  branches: Branch[]
  loaded: boolean
}

function extractBranchItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    branches?: unknown[]
    data?: unknown[] | { branches?: unknown[], entry?: unknown[], items?: unknown[] }
    entry?: unknown[]
    items?: unknown[]
  }

  if (Array.isArray(payload.branches)) {
    return payload.branches
  }

  if (Array.isArray(payload.entry)) {
    return payload.entry
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data && typeof payload.data === 'object') {
    if (Array.isArray(payload.data.branches)) {
      return payload.data.branches
    }

    if (Array.isArray(payload.data.entry)) {
      return payload.data.entry
    }

    if (Array.isArray(payload.data.items)) {
      return payload.data.items
    }
  }

  return []
}

export const useBranchStore = defineStore('branch', {
  actions: {
    async ensureLoaded(): Promise<Branch[]> {
      if (this.loaded) {
        return this.branches
      }

      const response = await useKioskApi().config()
      const branches = extractBranchItems(response)
      const parsedBranches: Branch[] = []

      for (const branch of branches) {
        const parsedBranch = branchSchema.safeParse(branch)

        if (parsedBranch.success) {
          parsedBranches.push(parsedBranch.data)
        }
      }

      this.branches = parsedBranches

      if (!this.activeBranchId && this.branches[0]?.id) {
        this.activeBranchId = this.branches[0].id
      }

      this.loaded = true

      return this.branches
    },
    setActiveBranch(id?: string | null) {
      this.activeBranchId = id ? String(id) : null
    }
  },
  getters: {
    activeBranch: (state: BranchState): Branch | null => state.branches.find((branch: Branch) => branch.id === state.activeBranchId) || null
  },
  state: (): BranchState => ({
    activeBranchId: null as string | null,
    branches: [] as Branch[],
    loaded: false
  })
})
