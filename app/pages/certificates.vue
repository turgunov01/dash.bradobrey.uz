<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { CertificateCreatePayload } from '~~/shared/schemas'
import { formatDateTime, formatMoney } from '~/utils/format'
import { flattenServicesPayload } from '~/utils/services'

type CertificateRow = {
  id: string
  code: string
  created_at: string | null
  expires_at: string | null
  is_used: boolean
  status: string
  amount: number
  metadata: Record<string, unknown> | null
  service_ids: string[]
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }
  const text = String(value).trim()
  return text || null
}

function normalizeTimestamp(value: unknown) {
  const text = normalizeText(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function formatMetadataPreview(value: Record<string, unknown> | null) {
  if (!value || !Object.keys(value).length) {
    return 'Пусто'
  }
  const serialized = JSON.stringify(value)
  return serialized.length > 90 ? `${serialized.slice(0, 90)}...` : serialized
}

function extractCertificateRows(response: unknown): CertificateRow[] {
  if (!response || typeof response !== 'object') return []

  const payload = response as { certificates?: unknown[]; data?: unknown[]; items?: unknown[] }
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.certificates)
      ? payload.certificates
      : Array.isArray(payload.data)
        ? payload.data
        : []

  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const certificate = item as Record<string, unknown>
    return [{
      id: String(certificate.id || ''),
      code: String(certificate.code || ''),
      created_at: normalizeTimestamp(certificate.created_at),
      expires_at: normalizeTimestamp(certificate.expires_at),
      is_used: Boolean(certificate.is_used),
      status: String(certificate.status || (certificate.is_used ? 'used' : 'active')),
      amount: Number(certificate.amount || 0),
      metadata: certificate.metadata && typeof certificate.metadata === 'object'
        ? certificate.metadata as Record<string, unknown>
        : null,
      service_ids: Array.isArray(certificate.service_ids)
        ? certificate.service_ids.map(serviceId => String(serviceId))
        : []
    }] satisfies CertificateRow[]
  }).filter(item => item.id && item.code)
}

const certificatesApi = useCertificatesApi()
const kioskApi = useKioskApi()

const createModalOpen = ref(false)
const lookupModalOpen = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  code: '',
  expires_at: '',
  metadata: '{}',
  service_ids: [] as string[]
})

const lookupCode = ref('')
const lookupResult = ref<unknown>(null)

const certificateColumns: TableColumn<CertificateRow>[] = [
  { accessorKey: 'code', header: 'Код' },
  { id: 'services', header: 'Услуги' },
  { accessorKey: 'expires_at', header: 'Действует до' },
  { id: 'metadata', header: 'Метаданные' },
  { accessorKey: 'amount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('certificates-dashboard', async () => {
  const [servicesResult, certificatesResult] = await Promise.allSettled([
    kioskApi.services({ active: true, grouped: false }),
    certificatesApi.listActive()
  ])

  return {
    certificates: certificatesResult.status === 'fulfilled'
      ? extractCertificateRows(certificatesResult.value)
      : [] as CertificateRow[],
    services: servicesResult.status === 'fulfilled'
      ? flattenServicesPayload(servicesResult.value)
      : []
  }
})

const services = computed(() => data.value?.services || [])
const activeCertificates = computed(() => data.value?.certificates || [])

const serviceNameMap = computed(() =>
  new Map(
    services.value.map(service => [String(service.id), service.name || `Услуга ${service.id}`])
  )
)

const serviceOptions = computed(() =>
  services.value.map(service => ({
    label: `${service.name || 'Услуга без названия'} / ${service.duration_minutes ?? service.duration ?? 0} мин`,
    value: String(service.id)
  }))
)

const createModalDescription = computed(() =>
  editingId.value
    ? 'Измените данные сертификата и сохраните.'
    : 'Заполните код, набор услуг и срок действия нового сертификата.'
)

function getServiceName(serviceId: string) {
  return serviceNameMap.value.get(serviceId) || 'Неизвестная услуга'
}

function resetForm() {
  form.code = ''
  form.expires_at = ''
  form.metadata = '{}'
  form.service_ids = []
  editingId.value = null
}

function openCreateModal(row?: CertificateRow) {
  if (row) {
    editingId.value = row.id
    form.code = row.code
    form.expires_at = row.expires_at ? row.expires_at.slice(0, 16) : ''
    form.service_ids = [...row.service_ids]
    form.metadata = row.metadata ? JSON.stringify(row.metadata, null, 2) : '{}'
  } else {
    resetForm()
  }
  createModalOpen.value = true
}

async function submitCertificate() {
  let parsedMetadata: Record<string, unknown> | undefined
  try {
    parsedMetadata = form.metadata ? JSON.parse(form.metadata) : undefined
  } catch (error) {
    useApiClient().notifyError(error, 'Некорректный JSON метаданных')
    return
  }

  const payload: CertificateCreatePayload = {
    code: form.code,
    expires_at: form.expires_at || null,
    metadata: parsedMetadata,
    service_ids: form.service_ids
  }

  try {
    submitting.value = true
    if (editingId.value) {
      await certificatesApi.update(editingId.value, payload)
    } else {
      await certificatesApi.create(payload)
    }
    await refresh()
    createModalOpen.value = false
    resetForm()
  } finally {
    submitting.value = false
  }
}

async function deleteCertificate(id: string) {
  if (deleting.value) return
  if (!id) {
    useApiClient().notifyError(new Error('Не найден ID сертификата'))
    return
  }
  const confirmed = confirm('Удалить сертификат?')
  if (!confirmed) return
  try {
    deleting.value = true
    await certificatesApi.remove(id)
    await refresh()
  } finally {
    deleting.value = false
  }
}

async function lookupCertificate() {
  if (!lookupCode.value.trim()) {
    useApiClient().notifyError(new Error('Введите код'))
    return
  }
  lookupResult.value = await certificatesApi.lookup(lookupCode.value.trim())
}
</script>

<template>
  <UDashboardPanel id="certificates">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <UBadge color="neutral" size="lg" variant="soft">
          {{ activeCertificates.length }} активных
        </UBadge>
        <div class="flex items-center gap-2">
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal()">
            Создать
          </UButton>
          <UButton color="neutral" icon="i-lucide-search" variant="outline" @click="lookupModalOpen = true">
            Проверить
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </div>
      </div>

      <div v-if="activeCertificates.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="max-h-[80vh] overflow-auto">
          <UTable
            :columns="certificateColumns"
            :data="activeCertificates"
            :loading="pending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[78rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
            }"
          >
            <template #code-cell="{ row }">
              <span class="font-mono font-medium text-charcoal-950">{{ row.original.code }}</span>
            </template>

            <template #services-cell="{ row }">
              <div class="flex max-w-[22rem] flex-wrap gap-2">
                <UBadge
                  v-for="serviceId in row.original.service_ids"
                  :key="serviceId"
                  color="neutral"
                  variant="soft"
                >
                  {{ getServiceName(serviceId) }}
                </UBadge>
                <span v-if="!row.original.service_ids.length" class="text-sm text-charcoal-400">
                  Нет привязанных услуг
                </span>
              </div>
            </template>

            <template #expires_at-cell="{ row }">
              {{ row.original.expires_at ? formatDateTime(row.original.expires_at) : 'Без срока' }}
            </template>

            <template #metadata-cell="{ row }">
              <span class="block max-w-[18rem] truncate text-charcoal-500">
                {{ formatMetadataPreview(row.original.metadata) }}
              </span>
            </template>

            <template #amount-cell="{ row }">
              {{ row.original.amount ? formatMoney(row.original.amount) : '0 UZS' }}
            </template>

            <template #status-cell="{ row }">
              <SharedStatusBadge :label="row.original.status || (row.original.is_used ? 'used' : 'active')" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-2">
                <UTooltip text="Редактировать">
                  <UButton
                    color="neutral"
                    icon="i-lucide-pencil"
                    variant="ghost"
                    square
                    @click="openCreateModal(row.original)"
                  />
                </UTooltip>
                <UTooltip text="Удалить">
                  <UButton
                    color="error"
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    square
                    :loading="deleting"
                    @click="deleteCertificate(row.original.id)"
                  />
                </UTooltip>
              </div>
            </template>
          </UTable>
        </div>
      </div>

      <SharedEmptyState
        v-else
        description="Не найдено ни одного действующего сертификата."
        icon="i-lucide-id-card"
        title="Активных сертификатов нет"
      />
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="createModalOpen"
    class="sm:max-w-2xl"
    :description="createModalDescription"
    :title="editingId ? 'Редактировать сертификат' : 'Создать сертификат'"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Код сертификата">
          <UInput v-model="form.code" />
        </UFormField>

        <UFormField label="Услуги">
          <USelectMenu
            v-model="form.service_ids"
            class="w-full"
            :items="serviceOptions"
            multiple
            placeholder="Выберите услуги"
            value-key="value"
          />
        </UFormField>

        <UFormField label="Действует до (ISO)">
          <UInput v-model="form.expires_at" placeholder="2027-03-19T05:00" />
        </UFormField>

        <UFormField label="Метаданные (JSON)">
          <UTextarea v-model="form.metadata" :rows="4" />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full flex-wrap justify-end gap-3">
        <UButton color="neutral" variant="ghost" @click="close">
          Отмена
        </UButton>
        <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitCertificate">
          {{ editingId ? 'Сохранить' : 'Создать' }}
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="lookupModalOpen"
    class="sm:max-w-lg"
    description="Введите код сертификата для быстрой проверки."
    title="Проверка сертификата"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Код">
          <UInput v-model="lookupCode" />
        </UFormField>
        <UButton color="neutral" icon="i-lucide-search" :loading="pending" @click="lookupCertificate">
          Проверить
        </UButton>
        <SharedJsonBlock v-if="lookupResult" :value="lookupResult" />
      </div>
    </template>
  </UModal>
</template>
