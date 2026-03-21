globalThis.__timing__.logStart('Load chunks/build/useRealtimeQueue-CK9yRiyf');import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import { f as useSessionStore, $ as useState } from './server.mjs';
import { watch } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';

function useRealtimeQueue() {
  const branchStore = useBranchStore();
  const sessionStore = useSessionStore();
  const isConnected = useState("realtime-connected", () => false);
  const socketRef = useState("realtime-socket", () => null);
  function joinBranchRoom() {
    const branchId = branchStore.activeBranchId || sessionStore.barber?.branch_id;
    if (!branchId || !socketRef.value) {
      return;
    }
    socketRef.value.emit("join_branch", String(branchId));
  }
  watch(
    () => branchStore.activeBranchId || sessionStore.barber?.branch_id,
    () => {
      joinBranchRoom();
    }
  );
  return {
    isConnected
  };
}

export { useRealtimeQueue as u };;globalThis.__timing__.logEnd('Load chunks/build/useRealtimeQueue-CK9yRiyf');
//# sourceMappingURL=useRealtimeQueue-CK9yRiyf.mjs.map
