<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { MerchantServiceCategory, MerchantServiceCategoryPayload } from '~/composables/useMerchantApi'

definePageMeta({
  layout: 'merchant'
})

type CategoryRow = {
  id: string
  name: string
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toRow(value: MerchantServiceCategory): CategoryRow | null {
  const id = normalizeText(value?.id)
  if (!id) return null

  return {
    id,
    is_active: value.is_active ?? null,
    name: normalizeText(value.name) || 'Категория'
  }
}

const merchantApi = useMerchantApi()

const createOpen = ref(false)
const editOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  is_active: true,
  name: ''
})

function resetForm() {
  form.name = ''
  form.is_active = true
}

function openCreate() {
  editingId.value = null
  resetForm()
  createOpen.value = true
}

function openEdit(row: CategoryRow) {
  editingId.value = row.id
  form.name = row.name || ''
  form.is_active = row.is_active !== false
  editOpen.value = true
}

const { data, pending, refresh } = await useAsyncData('merchant-categories', async () => {
  return await merchantApi.categories(true)
})

const rows = computed<CategoryRow[]>(() =>
  ((data.value as any)?.items || []).flatMap((item: MerchantServiceCategory) => {
    const row = toRow(item)
    return row ? [row] : []
  })
)

const columns: TableColumn<CategoryRow>[] = [
  { accessorKey: 'name', header: 'Категория' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function submitCreate() {
  const name = normalizeText(form.name)
  if (!name) {
    useApiClient().notifyError(new Error('name is required'), 'Введите название категории.')
    return
  }

  submitting.value = true
  try {
    const payload: MerchantServiceCategoryPayload = {
      is_active: Boolean(form.is_active),
      name
    }

    await merchantApi.createCategory(payload)
    createOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function submitEdit() {
  const id = editingId.value
  if (!id) return

  const name = normalizeText(form.name)
  if (!name) {
    useApiClient().notifyError(new Error('name is required'), 'Введите название категории.')
    return
  }

  submitting.value = true
  try {
    await merchantApi.updateCategory(id, {
      is_active: Boolean(form.is_active),
      name
    })

    editOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function removeRow(row: CategoryRow) {
  if (import.meta.client && !window.confirm(`Удалить категорию «${row.name}»?`)) {
    return
  }

  submitting.value = true
  try {
    await merchantApi.deleteCategory(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="merchant-categories">
    <template #header>
      <UDashboardNavbar title="Категории" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            @click="refresh()"
          >
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreate">
            Добавить категорию
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  Список категорий
                </h2>
                <p class="text-sm text-charcoal-500">
                  Сначала создайте категорию, затем добавляйте услуги.
                </p>
              </div>

              <UBadge color="neutral" size="lg" variant="soft">
                {{ rows.length }} шт.
              </UBadge>
            </div>
          </template>

          <div
            v-if="rows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="rows">
              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  size="xs"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивна' : 'Активна' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEdit(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="submitting"
                    @click="removeRow(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <div v-else class="py-10 text-center text-sm text-charcoal-500">
            Категорий пока нет.
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createOpen"
        class="sm:max-w-xl"
        title="Новая категория"
        description="Категория будет доступна для услуг вашего барбершопа."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Например: Стрижки" />
            </UFormField>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="createOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitCreate">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="editOpen"
        class="sm:max-w-xl"
        title="Редактировать категорию"
        description="Изменения применяются только в кабинете мерчанта."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Например: Стрижки" />
            </UFormField>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="editOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitEdit">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

