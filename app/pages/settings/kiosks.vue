<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { KioskDevice } from '~/composables/useKioskApi'

// Registered kiosk devices. Kiosks register themselves without a login; a
// device that was reinstalled or moved must be removed here before it can
// register again (the API refuses to take over an existing kiosk).
definePageMeta({})

const kioskApi = useKioskApi()
const branchStore = useBranchStore()

const removingId = ref<string | null>(null)

const { data, pending, refresh } = await useAsyncData('settings-kiosks', async () => {
  const response = await kioskApi.devices()
  return Array.isArray(response?.entry) ? response.entry : []
}, {
  lazy: true,
  watch: [() => branchStore.activeBranchId]
})

const devices = computed<KioskDevice[]>(() => data.value || [])
const isInitialLoading = computed(() => pending.value && !data.value)

const columns: TableColumn<KioskDevice>[] = [
  { accessorKey: 'device_name', header: 'Устройство' },
  { accessorKey: 'branch_name', header: 'Филиал' },
  { accessorKey: 'has_device_token', header: 'Защита' },
  { accessorKey: 'created_at', header: 'Подключён' },
  { id: 'action', header: '' }
]

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

async function removeDevice(device: KioskDevice) {
  const label = `${device.device_name}${device.branch_name ? ` (${device.branch_name})` : ''}`
  if (import.meta.client && !window.confirm(`Удалить киоск ${label}? Устройство отключится и сможет зарегистрироваться заново.`)) {
    return
  }

  removingId.value = device.id
  try {
    await kioskApi.removeDevice(device.id)
    await refresh()
  }
  catch {
    // useApiClient already shows the error toast.
  }
  finally {
    removingId.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="settings-kiosks">
    <template #header>
      <UDashboardNavbar title="Киоски" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            @click="refresh()"
          >
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="max-w-3xl text-sm text-charcoal-600">
          Киоск подключается сам: на устройстве выбирают филиал и нажимают «Зарегистрировать устройство».
          Если киоск переустановили или перенесли в другой филиал, удалите его здесь — после этого он сможет
          зарегистрироваться заново.
        </p>

        <SharedSkeletonRows v-if="isInitialLoading" :rows="4" :columns="5" />

        <UTable
          v-else-if="devices.length"
          :columns="columns"
          :data="devices"
          :get-row-id="(row) => row.id"
          :loading="pending"
          :ui="{
            base: 'min-w-[44rem]',
            thead: 'bg-charcoal-50/90',
            tbody: 'divide-y divide-charcoal-100',
            th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
            td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
          }"
        >
          <template #device_name-cell="{ row }">
            <span class="font-medium text-charcoal-950">{{ row.original.device_name }}</span>
          </template>

          <template #branch_name-cell="{ row }">
            {{ row.original.branch_name || '—' }}
          </template>

          <template #has_device_token-cell="{ row }">
            <UBadge
              :color="row.original.has_device_token ? 'success' : 'warning'"
              variant="subtle"
              size="sm"
            >
              {{ row.original.has_device_token ? 'Токен устройства' : 'Старая версия' }}
            </UBadge>
          </template>

          <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template>

          <template #action-cell="{ row }">
            <div class="flex justify-end">
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                :loading="removingId === row.original.id"
                @click="removeDevice(row.original)"
              >
                Удалить
              </UButton>
            </div>
          </template>
        </UTable>

        <SharedEmptyState
          v-else
          description="Зарегистрируйте киоск на самом устройстве — он появится в этом списке."
          icon="i-lucide-tablet-smartphone"
          title="Киосков пока нет"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
