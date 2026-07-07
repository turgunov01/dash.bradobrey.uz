<script setup lang="ts">
import type { BarberOption, StatisticsScope } from '~/composables/useStatisticsAnalytics'

import { formatCount } from '~/utils/format'
import { formatScopeLabel } from '~/utils/display'

defineProps<{
  barberOptions: BarberOption[]
  contextLabel: string
  count: number
  subtitle: string
  title: string
}>()

const scope = defineModel<StatisticsScope>('scope', { required: true })
const selectedBarberId = defineModel<string>('barberId', { required: true })

const uiStore = useUiStore()
</script>

<template>
  <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
    <template #header>
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
            Настройка среза
          </p>
          <h2 class="barbershop-heading text-3xl text-charcoal-950">
            {{ title }}
          </h2>
          <p class="text-sm text-charcoal-500">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UBadge color="neutral" size="lg" variant="soft">
            {{ formatScopeLabel(scope) }}
          </UBadge>
          <UBadge color="neutral" variant="outline">
            {{ contextLabel }}
          </UBadge>
          <UBadge color="neutral" variant="outline">
            {{ formatCount(count) }} записей
          </UBadge>
        </div>
      </div>
    </template>

    <div class="grid gap-4 xl:grid-cols-[0.26fr_0.26fr_0.18fr_0.3fr]">
      <UFormField label="Дата начала">
        <UInput v-model="uiStore.statisticsRange.start" type="date" />
      </UFormField>

      <UFormField label="Дата окончания">
        <UInput v-model="uiStore.statisticsRange.end" type="date" />
      </UFormField>

      <UFormField label="Область">
        <USelectMenu
          v-model="scope"
          :items="[
            { label: 'Общая', value: 'global' },
            { label: 'Филиал', value: 'branch' },
            { label: 'Барбер', value: 'barber' }
          ]"
          value-key="value"
        />
      </UFormField>

      <UFormField v-if="scope === 'barber'" label="Барбер">
        <USelectMenu v-model="selectedBarberId" :items="barberOptions" value-key="value" />
      </UFormField>
    </div>
  </UCard>
</template>
