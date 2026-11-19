<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { PlatformCompany } from '~/composables/usePlatformApi'
import { describePlatformError, getApiErrorBody, getApiErrorCode } from '~~/shared/auth/tenancy'

// Platform owner: franchise companies (GET/POST/PATCH /api/platform/companies).
definePageMeta({ layout: 'platform' })
useHead({ title: 'Компании' })

const platformApi = usePlatformApi()
const toast = useToast()

const { data, pending, refresh } = await useAsyncData('platform-companies', async () => {
  const response = await platformApi.listCompanies()
  return Array.isArray(response?.companies) ? response.companies : []
})

const companies = computed<PlatformCompany[]>(() => data.value || [])

const formOpen = ref(false)
const adminOpen = ref(false)
const kioskOpen = ref(false)
const selected = ref<PlatformCompany | null>(null)
const statusChangingId = ref<string | null>(null)
const failedPreconditions = ref<string[]>([])

const columns: TableColumn<PlatformCompany>[] = [
  { accessorKey: 'name', header: 'Компания' },
  { accessorKey: 'code', header: 'Код' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'has_kiosk_enrollment_code', header: 'Код киосков' },
  { accessorKey: 'currency', header: 'Валюта / пояс' },
  { id: 'action', header: '' }
]

function upsert(company: PlatformCompany) {
  const list = data.value || []
  data.value = list.some(item => item.id === company.id)
    ? list.map(item => item.id === company.id ? company : item)
    : [...list, company]
}

function openCreate() {
  selected.value = null
  formOpen.value = true
}

function openEdit(company: PlatformCompany) {
  selected.value = company
  formOpen.value = true
}

function openAdmin(company: PlatformCompany) {
  selected.value = company
  adminOpen.value = true
}

function openKioskCode(company: PlatformCompany) {
  selected.value = company
  kioskOpen.value = true
}

function onSaved(company: PlatformCompany) {
  upsert(company)
  failedPreconditions.value = []
  toast.add({ color: 'success', title: 'Компания сохранена', description: `${company.name} (${company.code})` })
}

function onAdminCreated(login: string) {
  toast.add({ color: 'success', title: 'Администратор создан', description: `Логин: ${login}. Передайте его вместе с кодом компании.` })
}

async function toggleStatus(company: PlatformCompany) {
  const nextStatus = company.status === 'active' ? 'suspended' : 'active'
  const question = nextStatus === 'suspended'
    ? `Приостановить компанию ${company.name}? Все её сотрудники, киоски и приложения сразу потеряют доступ.`
    : `Возобновить доступ компании ${company.name}?`

  if (import.meta.client && !window.confirm(question)) return

  statusChangingId.value = company.id
  failedPreconditions.value = []

  try {
    const response = await platformApi.updateCompany(company.id, { status: nextStatus })
    upsert(response.company)
    toast.add({ color: 'success', title: nextStatus === 'suspended' ? 'Компания приостановлена' : 'Компания активна', description: company.name })
  }
  catch (error) {
    if (getApiErrorCode(error) === 'MULTI_COMPANY_PRECONDITIONS') {
      const failed = getApiErrorBody(error)?.failed
      failedPreconditions.value = Array.isArray(failed) ? failed.map(String) : []
    }
    else {
      toast.add({ color: 'error', title: 'Не удалось изменить статус', description: describePlatformError(error) })
    }
  }
  finally {
    statusChangingId.value = null
  }
}

function rowActions(company: PlatformCompany) {
  return [
    [
      { label: 'Изменить', icon: 'i-lucide-pencil', onSelect: () => openEdit(company) },
      { label: 'Создать администратора', icon: 'i-lucide-user-plus', onSelect: () => openAdmin(company) },
      { label: 'Код подключения киосков', icon: 'i-lucide-key-round', onSelect: () => openKioskCode(company) }
    ],
    [
      company.status === 'active'
        ? { label: 'Приостановить', icon: 'i-lucide-pause', color: 'error' as const, disabled: company.is_default, onSelect: () => toggleStatus(company) }
        : { label: 'Возобновить', icon: 'i-lucide-play', onSelect: () => toggleStatus(company) }
    ]
  ]
}
</script>

<template>
  <UDashboardPanel id="platform-companies">
    <template #header>
      <UDashboardNavbar title="Компании" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreate">
            Новая компания
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="max-w-3xl text-sm text-charcoal-600">
          Каждая компания — отдельный бренд со своими филиалами, услугами и ценами. Сотрудники входят в панель, киоск и
          приложение барбера по коду компании. Основную компанию приостановить нельзя.
        </p>

        <PlatformPreconditionsAlert v-if="failedPreconditions.length" :failed="failedPreconditions" />

        <SharedSkeletonRows v-if="pending && !data" :rows="3" :columns="6" />

        <UTable
          v-else-if="companies.length"
          :columns="columns"
          :data="companies"
          :get-row-id="(row) => row.id"
          :ui="{
            base: 'min-w-[48rem]',
            thead: 'bg-charcoal-50/90',
            tbody: 'divide-y divide-charcoal-100',
            th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
            td: 'px-4 py-3 text-sm text-charcoal-700 align-middle'
          }"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-2.5">
              <span
                class="size-3 shrink-0 rounded-full border border-charcoal-200"
                :style="{ backgroundColor: row.original.primary_color || 'transparent' }"
                aria-hidden="true"
              />
              <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
              <UBadge v-if="row.original.is_default" color="neutral" variant="subtle" size="sm">
                Основная
              </UBadge>
            </div>
          </template>

          <template #code-cell="{ row }">
            <span class="font-mono text-xs tracking-wider">{{ row.original.code }}</span>
          </template>

          <template #status-cell="{ row }">
            <UBadge :color="row.original.status === 'active' ? 'success' : 'warning'" variant="subtle" size="sm">
              {{ row.original.status === 'active' ? 'Активна' : 'Приостановлена' }}
            </UBadge>
          </template>

          <template #has_kiosk_enrollment_code-cell="{ row }">
            <span :class="row.original.has_kiosk_enrollment_code ? 'text-charcoal-700' : 'text-charcoal-400'">
              {{ row.original.has_kiosk_enrollment_code ? 'Задан' : 'Не задан' }}
            </span>
          </template>

          <template #currency-cell="{ row }">
            {{ row.original.currency || '—' }} · {{ row.original.timezone || '—' }}
          </template>

          <template #action-cell="{ row }">
            <div class="flex justify-end">
              <UDropdownMenu :items="rowActions(row.original)" :content="{ align: 'end' }">
                <UButton
                  aria-label="Действия с компанией"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-ellipsis"
                  :loading="statusChangingId === row.original.id"
                />
              </UDropdownMenu>
            </div>
          </template>
        </UTable>

        <SharedEmptyState
          v-else
          description="Создайте первую компанию — затем её администратора."
          icon="i-lucide-building-2"
          title="Компаний пока нет"
        />
      </div>

      <PlatformCompanyFormModal v-model:open="formOpen" :company="selected" @saved="onSaved" />
      <PlatformCompanyAdminModal v-model:open="adminOpen" :company="selected" @created="onAdminCreated" />
      <PlatformKioskCodeModal v-model:open="kioskOpen" :company="selected" @saved="upsert" />
    </template>
  </UDashboardPanel>
</template>
