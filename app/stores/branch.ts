import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { Branch } from '~~/shared/schemas'
import { branchSchema } from '~~/shared/schemas'

type BranchFetchOptions = {
  credentials: 'include'
  headers?: HeadersInit
  query?: Record<string, unknown>
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

export const useBranchStore = defineStore('branch', () => {
  const activeBranchId = ref<string | null>(null)
  const branches = ref<Branch[]>([])
  const loaded = ref(false)
  const requestHeaders = import.meta.server
    ? useRequestHeaders(['cookie', 'authorization'])
    : undefined

  const activeBranch = computed<Branch | null>(() => {
    return branches.value.find(branch => branch.id === activeBranchId.value) || null
  })

  async function fetchBranchSource() {
    const options: BranchFetchOptions = {
      credentials: 'include',
      headers: requestHeaders,
      query: { __skipBranchScope: true }
    }

    try {
      return await $fetch('/api/branches', options)
    }
    catch {
      return { items: [] }
    }
  }

  async function ensureLoaded(options: { force?: boolean } = {}): Promise<Branch[]> {
    if (loaded.value && !options.force) {
      return branches.value
    }

    const response = await fetchBranchSource()
    const nextBranches = extractBranchItems(response)
    const parsedBranches: Branch[] = []

    for (const branch of nextBranches) {
      const parsedBranch = branchSchema.safeParse(branch)

      if (parsedBranch.success) {
        parsedBranches.push(parsedBranch.data)
      }
    }

    branches.value = parsedBranches

    if (activeBranchId.value && !branches.value.some(branch => branch.id === activeBranchId.value)) {
      activeBranchId.value = branches.value[0]?.id || null
    }

    if (!options.force && !activeBranchId.value && branches.value[0]?.id) {
      activeBranchId.value = branches.value[0].id
    }

    loaded.value = true

    return branches.value
  }

  async function reload(): Promise<Branch[]> {
    loaded.value = false
    return await ensureLoaded({ force: true })
  }

  function setActiveBranch(id?: string | null) {
    activeBranchId.value = id ? String(id) : null
  }

  return {
    activeBranch,
    activeBranchId,
    branches,
    ensureLoaded,
    loaded,
    reload,
    setActiveBranch
  }
})
