<script setup lang="ts">
import { formatCount, formatMoney } from '~/utils/format'

export type EmployeeCardData = {
  branch: string
  id: string
  is_archived: boolean
  login: string
  name: string
  phone: string | null
  photoUrl: string | null
  roleLabel: string
  specialization: string | null
}

export type EmployeeCardStats = {
  cancelled: number
  completed: number
  periodRevenue: number
}

const props = defineProps<{
  employee: EmployeeCardData
  stats?: EmployeeCardStats | null
  removing?: boolean
  canViewBranchStatistics?: boolean
}>()

const emit = defineEmits<{
  report: []
  edit: []
  fire: []
  restore: []
}>()

// Broken or blocked photo URLs fall back to the placeholder icon.
const photoFailed = ref(false)
watch(() => props.employee.photoUrl, () => { photoFailed.value = false })
const phoneHref = computed(() => props.employee.phone ? `tel:${props.employee.phone.replace(/[^\d+]/g, '')}` : undefined)
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[0.875rem] border bg-white/90 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    :class="employee.is_archived ? 'border-warning/40' : 'border-charcoal-200'"
  >
    <header class="flex items-start gap-3">
      <button type="button" class="shrink-0" :aria-label="`Детали записей: ${employee.name}`" @click="emit('report')">
        <div class="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-charcoal-200 bg-charcoal-100">
          <img v-if="employee.photoUrl && !photoFailed" :alt="employee.name" :src="employee.photoUrl" class="size-full object-cover" loading="lazy" @error="photoFailed = true">
          <UIcon v-else class="text-2xl text-charcoal-400" name="i-lucide-user-round" />
        </div>
      </button>

      <div class="min-w-0 flex-1">
        <button type="button" class="block max-w-full truncate text-left text-base font-semibold text-charcoal-950 hover:underline" @click="emit('report')">
          {{ employee.name }}
        </button>
        <p v-if="employee.specialization" class="truncate text-xs text-charcoal-500">
          {{ employee.specialization }}
        </p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <UBadge color="primary" variant="soft" size="sm">
            {{ employee.roleLabel }}
          </UBadge>
          <UBadge v-if="employee.is_archived" color="warning" variant="soft" size="sm">
            В архиве
          </UBadge>
        </div>
      </div>
    </header>

    <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
      <dt class="text-charcoal-500">Логин</dt>
      <dd class="truncate font-medium text-charcoal-900">{{ employee.login }}</dd>
      <dt class="text-charcoal-500">Телефон</dt>
      <dd class="truncate">
        <a v-if="phoneHref" :href="phoneHref" class="text-charcoal-900 hover:underline">{{ employee.phone }}</a>
        <span v-else class="text-charcoal-400">Не указан</span>
      </dd>
      <dt class="text-charcoal-500">Филиал</dt>
      <dd class="truncate text-charcoal-900">{{ employee.branch }}</dd>
    </dl>

    <div class="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-charcoal-50/80 p-2.5 text-center">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">Выполнено</p>
        <p class="mt-0.5 text-sm font-semibold text-charcoal-950">{{ formatCount(stats?.completed ?? 0) }}</p>
      </div>
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">Отмены</p>
        <p class="mt-0.5 text-sm font-semibold text-charcoal-950">{{ formatCount(stats?.cancelled ?? 0) }}</p>
      </div>
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">Выручка за месяц</p>
        <p class="mt-0.5 truncate text-sm font-semibold text-charcoal-950">{{ formatMoney(stats?.periodRevenue ?? 0) }}</p>
      </div>
    </div>


    <footer class="mt-auto flex items-center justify-end gap-1 border-t border-charcoal-100 pt-3">
      <UTooltip text="Детали записей">
        <UButton aria-label="Открыть детали записей сотрудника" color="neutral" icon="i-lucide-table-2" square variant="ghost" @click="emit('report')" />
      </UTooltip>
      <UTooltip v-if="canViewBranchStatistics" text="Статистика по филиалу">
        <UButton aria-label="Открыть статистику филиала" color="neutral" icon="i-lucide-chart-no-axes-combined" square variant="ghost" to="/statistics/branch" />
      </UTooltip>
      <UTooltip text="Редактировать">
        <UButton aria-label="Редактировать сотрудника" color="neutral" icon="i-lucide-pencil" square variant="ghost" @click="emit('edit')" />
      </UTooltip>
      <UTooltip v-if="!employee.is_archived" text="Уволить">
        <UButton aria-label="Уволить сотрудника" color="error" icon="i-lucide-user-x" :loading="removing" square variant="ghost" @click="emit('fire')" />
      </UTooltip>
      <UTooltip v-else text="Восстановить">
        <UButton aria-label="Восстановить сотрудника" color="success" icon="i-lucide-user-check" :loading="removing" square variant="ghost" @click="emit('restore')" />
      </UTooltip>
    </footer>
  </article>
</template>
