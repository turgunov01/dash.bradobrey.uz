<template>
  <!-- Mirrors EmployeeCard's layout so the grid does not jump when data arrives. -->
  <div class="flex h-full flex-col rounded-[0.875rem] border border-charcoal-200 bg-white/90 p-4" aria-hidden="true">
    <div class="flex items-start gap-3">
      <USkeleton class="size-14 shrink-0 rounded-xl" />
      <div class="flex-1 space-y-2 pt-1">
        <USkeleton class="h-4 w-3/5" />
        <USkeleton class="h-3 w-2/5" />
        <USkeleton class="h-5 w-16 rounded-md" />
      </div>
    </div>

    <div class="mt-4 space-y-2.5">
      <div v-for="row in 3" :key="row" class="flex items-center gap-3">
        <USkeleton class="h-3.5 w-16" />
        <USkeleton class="h-3.5 flex-1" :class="row === 3 ? 'max-w-[70%]' : 'max-w-[50%]'" />
      </div>
    </div>

    <USkeleton class="mt-4 h-16 w-full rounded-lg" />

    <div class="mt-auto flex justify-end gap-2 border-t border-charcoal-100 pt-3">
      <USkeleton v-for="action in 4" :key="action" class="size-8 rounded-md" />
    </div>
  </div>
</template>
