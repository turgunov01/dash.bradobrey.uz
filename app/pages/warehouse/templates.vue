<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount } from '~/utils/format'

type TemplateRow = {
  id: string
  name: string
  description: string | null
  items_count: number
  is_active: boolean | null
  raw: Record<string, any>
}

const warehouseApi = useWarehouseApi()
const apiClient = useApiClient()

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function normalizeNumber(value: unknown) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function extractItems(value: unknown) {
  if (Array.isArray(value)) {
    return value as Record<string, any>[]
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const source = value as Record<string, any>

  for (const key of ['items', 'data', 'rows', 'records', 'templates']) {
    const list = source[key]

    if (Array.isArray(list)) {
      return list as Record<string, any>[]
    }
  }

  if (source.data && typeof source.data === 'object') {
    return extractItems(source.data)
  }

  return []
}

function itemId(value: Record<string, any>, fallback: string) {
  return normalizeText(value.id || value.template_id) || fallback
}

function parseJsonField(value: string, fallback: unknown) {
  const text = normalizeText(value)

  if (!text) {
    return fallback
  }

  try {
    return JSON.parse(text)
  }
  catch {
    return text
  }
}

const submitting = ref(false)
const templateModalOpen = ref(false)
const editingTemplateId = ref<string | null>(null)

const templateForm = reactive({
  description: '',
  is_active: true,
  items_json: '[]',
  name: ''
})

const { data: templatesData, pending: templatesPending, refresh: refreshTemplates } = await useAsyncData('warehouse-templates', () => {
  return warehouseApi.templates()
}, {
  default: () => ({ items: [] })
})

const templateRows = computed<TemplateRow[]>(() =>
  extractItems(templatesData.value).map((item, index) => {
    const rawItems = Array.isArray(item.items)
      ? item.items
      : Array.isArray(item.positions)
        ? item.positions
        : []

    return {
      description: normalizeText(item.description),
      id: itemId(item, `template-${index}`),
      is_active: item.is_active === undefined || item.is_active === null ? null : Boolean(item.is_active),
      items_count: normalizeNumber(item.items_count || item.itemsCount || rawItems.length),
      name: normalizeText(item.name || item.title) || 'Шаблон',
      raw: item
    }
  })
)

const templateColumns: TableColumn<TemplateRow>[] = [
  { accessorKey: 'name', header: 'Шаблон' },
  { accessorKey: 'description', header: 'Описание' },
  { accessorKey: 'items_count', header: 'Позиций' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

function resetTemplateForm() {
  templateForm.description = ''
  templateForm.is_active = true
  templateForm.items_json = '[]'
  templateForm.name = ''
}

function openCreateTemplate() {
  editingTemplateId.value = null
  resetTemplateForm()
  templateModalOpen.value = true
}

function openEditTemplate(row: TemplateRow) {
  editingTemplateId.value = row.id
  templateForm.description = row.description || ''
  templateForm.is_active = row.is_active !== false
  templateForm.items_json = JSON.stringify(row.raw.items || row.raw.positions || [], null, 2)
  templateForm.name = row.name
  templateModalOpen.value = true
}

async function submitTemplate() {
  const name = normalizeText(templateForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название шаблона.')
    return
  }

  submitting.value = true

  try {
    const payload = {
      description: normalizeText(templateForm.description),
      is_active: Boolean(templateForm.is_active),
      items: parseJsonField(templateForm.items_json, []),
      name
    }

    if (editingTemplateId.value) {
      await warehouseApi.updateTemplate(editingTemplateId.value, payload)
    }
    else {
      await warehouseApi.createTemplate(payload)
    }

    templateModalOpen.value = false
    await refreshTemplates()
  }
  finally {
    submitting.value = false
  }
}

async function deleteTemplate(row: TemplateRow) {
  if (import.meta.client && !window.confirm(`Удалить шаблон «${row.name}»?`)) {
    return
  }

  submitting.value = true

  try {
    await warehouseApi.deleteTemplate(row.id)
    await refreshTemplates()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="warehouse-templates">
    <template #header>
      <UDashboardNavbar title="Склад · Шаблоны" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="templatesPending" variant="outline" @click="refreshTemplates()">
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateTemplate">
            Создать шаблон
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <WarehouseSummaryCards />

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h2 class="barbershop-heading text-xl text-charcoal-950">
                Шаблоны закупок
              </h2>
              <p class="text-sm text-charcoal-500">
                Готовые наборы позиций для быстрого создания повторяющихся закупок.
              </p>
            </div>
          </template>

          <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="templateColumns" :data="templateRows" :loading="templatesPending">
              <template #items_count-cell="{ row }">
                {{ formatCount(row.original.items_count) }}
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="row.original.is_active === false ? 'neutral' : 'success'" size="xs" variant="soft">
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </template>
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditTemplate(row.original)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" :loading="submitting" @click="deleteTemplate(row.original)" />
                </div>
              </template>
            </UTable>
          </div>
        </UCard>
      </div>

      <UModal v-model:open="templateModalOpen" class="sm:max-w-2xl" :title="editingTemplateId ? 'Редактировать шаблон' : 'Новый шаблон'">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="templateForm.name" />
            </UFormField>
            <UFormField label="Описание">
              <UInput v-model="templateForm.description" />
            </UFormField>
            <UFormField label="Состав JSON">
              <UTextarea v-model="templateForm.items_json" :rows="7" />
            </UFormField>
            <UFormField>
              <UCheckbox v-model="templateForm.is_active" label="Активен" />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="templateModalOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitTemplate">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
