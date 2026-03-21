globalThis.__timing__.logStart('Load chunks/build/branch-nC1tN9Zp');import { defineStore } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/pinia@3.0.4_typescript@5.9.3_vue@3.5.30_typescript@5.9.3_/node_modules/pinia/dist/pinia.prod.cjs';
import { c as branchSchema } from '../_/index.mjs';
import { u as useKioskApi } from './useKioskApi-l3XfHmhL.mjs';

function extractBranchItems(response) {
  if (Array.isArray(response)) {
    return response;
  }
  if (!response || typeof response !== "object") {
    return [];
  }
  const payload = response;
  if (Array.isArray(payload.branches)) {
    return payload.branches;
  }
  if (Array.isArray(payload.entry)) {
    return payload.entry;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.branches)) {
      return payload.data.branches;
    }
    if (Array.isArray(payload.data.entry)) {
      return payload.data.entry;
    }
    if (Array.isArray(payload.data.items)) {
      return payload.data.items;
    }
  }
  return [];
}
const useBranchStore = defineStore("branch", {
  actions: {
    async ensureLoaded() {
      if (this.loaded) {
        return this.branches;
      }
      const response = await useKioskApi().config();
      const branches = extractBranchItems(response);
      const parsedBranches = [];
      for (const branch of branches) {
        const parsedBranch = branchSchema.safeParse(branch);
        if (parsedBranch.success) {
          parsedBranches.push(parsedBranch.data);
        }
      }
      this.branches = parsedBranches;
      if (!this.activeBranchId && this.branches[0]?.id) {
        this.activeBranchId = this.branches[0].id;
      }
      this.loaded = true;
      return this.branches;
    },
    setActiveBranch(id) {
      this.activeBranchId = id ? String(id) : null;
    }
  },
  getters: {
    activeBranch: (state) => state.branches.find((branch) => branch.id === state.activeBranchId) || null
  },
  state: () => ({
    activeBranchId: null,
    branches: [],
    loaded: false
  })
});

export { useBranchStore as u };;globalThis.__timing__.logEnd('Load chunks/build/branch-nC1tN9Zp');
//# sourceMappingURL=branch-nC1tN9Zp.mjs.map
