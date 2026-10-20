<script setup lang="ts">
export type BranchCardData = {
  address: string | null
  city: string | null
  id: string
  is_active: boolean | null
  name: string
  timezone: string | null
}

defineProps<{
  branch: BranchCardData
  isCurrent?: boolean
  mapsUrl?: string | null
  removing?: boolean
}>()

const emit = defineEmits<{
  location: []
  schedules: []
  edit: []
  remove: []
}>()
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[0.875rem] border bg-white/90 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    :class="isCurrent ? 'border-brass-300' : 'border-charcoal-200'"
  >
    <header class="flex items-start gap-3">
      <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-charcoal-100 text-charcoal-700">
        <UIcon name="i-lucide-store" class="size-5" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-base font-semibold text-charcoal-950">
          {{ branch.name }}
        </h3>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <UBadge :color="branch.is_active === false ? 'neutral' : 'success'" variant="soft" size="sm">
            {{ branch.is_active === false ? 'Неактивен' : 'Активен' }}
          </UBadge>
          <UBadge v-if="isCurrent" color="primary" variant="soft" size="sm">
            Текущий
          </UBadge>
        </div>
      </div>
    </header>

    <dl class="mt-4 mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
      <dt class="text-charcoal-500">Адрес</dt>
      <dd class="min-w-0">
        <a
          v-if="mapsUrl"
          :href="mapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-charcoal-900 hover:underline"
        >
          <UIcon name="i-lucide-map-pinned" class="size-3.5 shrink-0" />
          Открыть в Картах
        </a>
        <span v-else class="line-clamp-2 text-charcoal-900">{{ branch.address || '—' }}</span>
      </dd>
    </dl>

    <footer class="mt-auto flex items-center justify-end gap-1 border-t border-charcoal-100 pt-3">
      <UTooltip text="Геоконтроль входа">
        <UButton aria-label="Геоконтроль входа" color="neutral" icon="i-lucide-map-pin-check" square variant="ghost" @click="emit('location')" />
      </UTooltip>
      <UTooltip text="График сотрудников Verifix">
        <UButton aria-label="График сотрудников Verifix" color="neutral" icon="i-lucide-calendar-clock" square variant="ghost" @click="emit('schedules')" />
      </UTooltip>
      <UTooltip text="Редактировать">
        <UButton aria-label="Редактировать филиал" color="neutral" icon="i-lucide-pencil" square variant="ghost" @click="emit('edit')" />
      </UTooltip>
      <UTooltip text="Удалить">
        <UButton aria-label="Удалить филиал" color="error" icon="i-lucide-trash-2" :loading="removing" square variant="ghost" @click="emit('remove')" />
      </UTooltip>
    </footer>
  </article>
</template>
