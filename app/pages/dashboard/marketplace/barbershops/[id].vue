<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type BranchRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toBranchRow(value: unknown): BranchRow | null {
  if (!value || typeof value !== 'object') return null
  const anyValue = value as any
  const id = normalizeText(anyValue.id)
  if (!id) return null

  return {
    address: normalizeText(anyValue.address),
    city: normalizeText(anyValue.city),
    id,
    is_active: anyValue.is_active === undefined || anyValue.is_active === null ? null : Boolean(anyValue.is_active),
    name: normalizeText(anyValue.name) || 'Филиал'
  }
}

const route = useRoute()
const store = useDashboardMarketplaceStore()
const branchesApi = useBranchesApi()
const marketplaceBarbershopsApi = useMarketplaceBarbershopsApi()

const barbershopId = computed(() => String(route.params.id || ''))

const createBranchModalOpen = ref(false)
const branchSubmitting = ref(false)
const detachingBranchId = ref('')
const deletingBranchId = ref('')

const branchForm = reactive({
  address: '',
  city: '',
  is_active: true,
  name: '',
  timezone: 'Asia/Tashkent'
})

const days = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' }
] as const

type DayKey = typeof days[number]['key']

const defaultWorkHours: Record<DayKey, { start_time: string, end_time: string }> = {
  mon: { end_time: '20:00', start_time: '10:00' },
  tue: { end_time: '20:00', start_time: '10:00' },
  wed: { end_time: '20:00', start_time: '10:00' },
  thu: { end_time: '20:00', start_time: '10:00' },
  fri: { end_time: '20:00', start_time: '10:00' },
  sat: { end_time: '20:00', start_time: '10:00' },
  sun: { end_time: '20:00', start_time: '10:00' }
}

const branchWorkHours = reactive<Record<DayKey, { start_time: string, end_time: string }>>({
  ...defaultWorkHours
})

const merchantSubmitting = ref(false)
const merchantDeleting = ref(false)
const lastCreatedMerchant = ref<{ login: string, password: string } | null>(null)
const isClient = import.meta.client

const merchantForm = reactive({
  login: '',
  password: ''
})

function generatePassword(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz'
  let out = ''

  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return out
}

function focusMerchantAccount() {
  if (!merchantForm.password) {
    merchantForm.password = generatePassword(10)
  }
  lastCreatedMerchant.value = null

  if (!import.meta.client) return
  document.getElementById('merchant-account')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const { pending, refresh } = await useAsyncData(
  () => `dashboard-marketplace-barbershop-${barbershopId.value}`,
  async () => {
    const id = barbershopId.value
    if (!id) return null

    await Promise.all([
      store.fetchBarbershop(id),
      store.fetchBranches(id, { active: true })
    ])

    return true
  },
  { watch: [barbershopId] }
)

const barbershop = computed<any>(() => store.selectedBarbershop as any)

const { data: merchantsData, pending: merchantsPending, refresh: refreshMerchants } = await useAsyncData(
  () => `dashboard-marketplace-barbershop-${barbershopId.value}-merchants`,
  async () => {
    const id = barbershopId.value
    if (!id) return { items: [], total: 0 }
    return await marketplaceBarbershopsApi.listMerchants(id)
  },
  { watch: [barbershopId] }
)

const merchants = computed<any[]>(() => Array.isArray((merchantsData.value as any)?.items) ? (merchantsData.value as any).items : [])
const merchantAccount = computed<any | null>(() => merchants.value[0] ?? null)

async function submitCreateMerchant() {
  const login = normalizeText(merchantForm.login)
  const password = normalizeText(merchantForm.password)

  if (!login) {
    useApiClient().notifyError(new Error('login is required'), 'Укажите логин мерчанта.')
    return
  }

  if (!password || password.length < 6) {
    useApiClient().notifyError(new Error('password is required'), 'Пароль должен быть минимум 6 символов.')
    return
  }

  merchantSubmitting.value = true
  try {
    await marketplaceBarbershopsApi.createMerchant(barbershopId.value, { login, password })
    lastCreatedMerchant.value = { login, password }
    await refreshMerchants()
  }
  finally {
    merchantSubmitting.value = false
  }
}

async function deleteMerchantAccount() {
  const account = merchantAccount.value
  const merchantId = normalizeText(account?.id)
  const login = normalizeText(account?.login)

  if (!merchantId) {
    useApiClient().notifyError(new Error('merchant id is required'), 'Не удалось определить id мерчанта.')
    return
  }

  const label = login ? `«${login}»` : merchantId

  if (import.meta.client && !window.confirm(`Удалить аккаунт мерчанта ${label}? Вход в /merchant для этого логина перестанет работать.`)) {
    return
  }

  merchantDeleting.value = true
  try {
    await marketplaceBarbershopsApi.deleteMerchant(barbershopId.value, merchantId)
    lastCreatedMerchant.value = null
    await refreshMerchants()
  }
  finally {
    merchantDeleting.value = false
  }
}

async function copyLastCreatedCredentials() {
  if (!import.meta.client || !lastCreatedMerchant.value) return

  await navigator.clipboard.writeText(
    `login: ${lastCreatedMerchant.value.login}\npassword: ${lastCreatedMerchant.value.password}`
  )
}

function resetBranchWorkHours() {
  for (const day of days) {
    branchWorkHours[day.key].start_time = defaultWorkHours[day.key].start_time
    branchWorkHours[day.key].end_time = defaultWorkHours[day.key].end_time
  }
}

function resetBranchForm() {
  branchForm.name = ''
  branchForm.city = String(barbershop.value?.city || '')
  branchForm.address = ''
  branchForm.timezone = String(barbershop.value?.timezone || 'Asia/Tashkent')
  branchForm.is_active = true
  resetBranchWorkHours()
}

function openCreateBranchModal() {
  resetBranchForm()
  createBranchModalOpen.value = true
}

async function submitCreateBranch() {
  const name = normalizeText(branchForm.name)

  if (!name) {
    useApiClient().notifyError(new Error('name is required'), 'Укажите название филиала.')
    return
  }

  branchSubmitting.value = true
  try {
    await branchesApi.create({
      address: normalizeText(branchForm.address),
      city: normalizeText(branchForm.city),
      is_active: Boolean(branchForm.is_active),
      marketplace_barbershop_id: barbershopId.value,
      name,
      timezone: normalizeText(branchForm.timezone),
      work_hours: JSON.parse(JSON.stringify(branchWorkHours))
    })

    createBranchModalOpen.value = false
    await refresh()
  } finally {
    branchSubmitting.value = false
  }
}

async function detachBranch(row: BranchRow) {
  const label = row.name ? `«${row.name}»` : row.id

  if (import.meta.client && !window.confirm(`Открепить филиал ${label} от этого барбершопа?`)) {
    return
  }

  detachingBranchId.value = row.id
  try {
    await branchesApi.update(row.id, { marketplace_barbershop_id: null })
    await refresh()
  }
  finally {
    detachingBranchId.value = ''
  }
}

async function deleteBranch(row: BranchRow) {
  const label = row.name ? `«${row.name}»` : row.id

  if (import.meta.client && !window.confirm(`Удалить филиал ${label}?`)) {
    return
  }

  deletingBranchId.value = row.id
  try {
    let deleted = false

    try {
      await branchesApi.remove(row.id, { silent: true })
      deleted = true
    }
    catch (error: any) {
      const payload = error?.data || error?.response?._data || null
      const code = payload?.data?.code || payload?.code || null

      if (code === 'BRANCH_DELETE_HAS_QUEUE_ENTRIES') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть записи очереди. Удалить филиал вместе с ними?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else if (code === 'BRANCH_DELETE_HAS_USERS') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть сотрудники. Удалить филиал и отвязать сотрудников от филиала?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else if (code === 'BRANCH_DELETE_HAS_BARBERS') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть мастера. Удалить филиал и отвязать мастеров от филиала?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else {
        useApiClient().notifyError(error)
        throw error
      }
    }

    if (!deleted) {
      return
    }

    await refresh()
  }
  finally {
    deletingBranchId.value = ''
  }
}

const branchRows = computed<BranchRow[]>(() =>
  (store.branches || []).flatMap(item => {
    const row = toBranchRow(item)
    return row ? [row] : []
  })
)

const columns: TableColumn<BranchRow>[] = [
  { accessorKey: 'name', header: 'Филиал' },
  { accessorKey: 'city', header: 'Город' },
  { accessorKey: 'address', header: 'Адрес' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel id="marketplace-barbershop">
    <template #header>
      <UDashboardNavbar :title="barbershop?.name || 'Барбершоп'" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-arrow-left"
            variant="outline"
            to="/dashboard/marketplace"
          >
            Назад
          </UButton>
          <UButton
            color="neutral"
            icon="i-lucide-user-round"
            variant="outline"
            @click="focusMerchantAccount"
          >
            Merchant
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="barbershop-heading text-2xl text-charcoal-950">
                  {{ barbershop?.name || 'Барбершоп' }}
                </h2>
                <UBadge
                  v-if="barbershop?.is_active !== undefined && barbershop?.is_active !== null"
                  :color="barbershop?.is_active === false ? 'neutral' : 'success'"
                  variant="soft"
                >
                  {{ barbershop?.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </div>

              <p class="text-sm text-charcoal-500">
                ID: <span class="font-mono">{{ barbershopId }}</span>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="neutral" size="lg" variant="soft">
                {{ branchRows.length }} филиалов
              </UBadge>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4">
              <p class="text-xs text-charcoal-500">
                Город
              </p>
              <p class="text-sm font-medium text-charcoal-950">
                {{ barbershop?.city || '—' }}
              </p>
            </div>

            <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4">
              <p class="text-xs text-charcoal-500">
                Адрес
              </p>
              <p class="text-sm font-medium text-charcoal-950">
                {{ barbershop?.address || '—' }}
              </p>
            </div>
          </div>
        </UCard>

        

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h3 class="barbershop-heading text-xl text-charcoal-950">
                  Филиалы
                </h3>
                <p class="text-sm text-charcoal-500">
                  Создавайте филиалы внутри выбранного барбершопа и открывайте их для просмотра барберов и услуг.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <UButton color="primary" icon="i-lucide-plus" @click="openCreateBranchModal">
                  Создать филиал
                </UButton>
              </div>
            </div>
          </template>

          <div
            v-if="branchRows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="branchRows">
              <template #name-cell="{ row }">
                <div class="space-y-1">
                  <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.id }}
                  </p>
                </div>
              </template>

              <template #city-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.city || '—' }}
                </span>
              </template>

              <template #address-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.address || '—' }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  v-if="row.original.is_active !== null"
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
                <span v-else class="text-sm text-charcoal-500">—</span>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-eye"
                    variant="ghost"
                    size="xs"
                    :to="`/dashboard/marketplace/branches/${row.original.id}`"
                  />
                  <UButton
                    icon="i-lucide-unlink"
                    variant="ghost"
                    size="xs"
                    :loading="detachingBranchId === row.original.id"
                    @click="detachBranch(row.original)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="deletingBranchId === row.original.id"
                    @click="deleteBranch(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            title="Пусто"
            description="У выбранного барбершопа нет филиалов или не удалось загрузить список."
            icon="i-lucide-store"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>

        <UCard id="merchant-account" class="warm-card">
          <template #header>
            <div class="space-y-1">
              <h3 class="barbershop-heading text-xl text-charcoal-950">
                Merchant account
              </h3>
              <p class="text-sm text-charcoal-500">
                Marketplace barbershop id: <span class="font-mono">{{ barbershopId }}</span>
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4">
              <p class="text-xs text-charcoal-500">Current merchant</p>

              <div v-if="merchantsPending" class="text-sm text-charcoal-500">
                Loading...
              </div>

              <div v-else-if="merchantAccount" class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-charcoal-950">
                    login: <span class="font-mono">{{ merchantAccount.login }}</span>
                  </p>
                  <p class="text-xs text-charcoal-500">
                    Password is stored as hash and cannot be displayed.
                  </p>
                </div>

                <UButton
                  color="error"
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="outline"
                  :loading="merchantDeleting"
                  @click="deleteMerchantAccount"
                >
                  Delete
                </UButton>
              </div>

              <div v-else class="text-sm text-charcoal-500">
                Not created yet.
              </div>
            </div>

            <UCard v-if="lastCreatedMerchant" class="border border-amber-200 bg-amber-50/60">
              <div class="space-y-1">
                <p class="text-sm font-medium text-amber-900">
                  Credentials (shown once)
                </p>
                <p class="text-sm text-amber-800">
                  login: <span class="font-mono">{{ lastCreatedMerchant.login }}</span>
                </p>
                <p class="text-sm text-amber-800">
                  password: <span class="font-mono">{{ lastCreatedMerchant.password }}</span>
                </p>
                <div class="pt-2">
                  <UButton
                    v-if="isClient"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-copy"
                    @click="copyLastCreatedCredentials"
                  >
                    Copy
                  </UButton>
                </div>
              </div>
            </UCard>

            <div v-if="!merchantAccount" class="space-y-4">
              <UFormField label="Login" required>
                <UInput v-model="merchantForm.login" placeholder="merchant_login" />
              </UFormField>

              <UFormField label="Password" required>
                <UInput v-model="merchantForm.password" type="text" />
              </UFormField>

              <div class="flex flex-wrap gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-wand-2"
                  @click="merchantForm.password = generatePassword(10)"
                >
                  Generate password
                </UButton>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                color="neutral"
                icon="i-lucide-external-link"
                variant="outline"
                to="/merchant"
                target="_blank"
              >
                Open /merchant
              </UButton>
              <UButton
                v-if="!merchantAccount"
                color="primary"
                :loading="merchantSubmitting"
                @click="submitCreateMerchant"
              >
                Create
              </UButton>
            </div>
          </div>
        </UCard>

        <UModal
          v-model:open="createBranchModalOpen"
          class="sm:max-w-2xl"
          title="Создать филиал"
          description="Филиал будет создан и автоматически привязан к этому барбершопу."
        >
          <template #body>
            <div class="space-y-4">
              <UFormField label="Название" required>
                <UInput v-model="branchForm.name" />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Город">
                  <UInput v-model="branchForm.city" placeholder="Ташкент" />
                </UFormField>

                <UFormField label="Timezone">
                  <UInput v-model="branchForm.timezone" placeholder="Asia/Tashkent" />
                </UFormField>
              </div>

              <UFormField label="Адрес">
                <UInput v-model="branchForm.address" />
              </UFormField>

              <div class="flex items-end">
                <UCheckbox v-model="branchForm.is_active" label="Филиал активен" />
              </div>

              <UCard class="rounded-2xl border border-charcoal-200 bg-white/70">
                <template #header>
                  <div class="space-y-1">
                    <h4 class="font-semibold text-charcoal-950">
                      Время работы
                    </h4>
                    <p class="text-sm text-charcoal-500">
                      Сохраняется в <span class="font-mono">work_hours</span> (используются инпуты времени).
                    </p>
                  </div>
                </template>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    v-for="day in days"
                    :key="day.key"
                    class="rounded-2xl border border-charcoal-200 bg-white/80 p-4"
                  >
                    <p class="text-sm font-medium text-charcoal-950">
                      {{ day.label }}
                    </p>

                    <div class="mt-3 grid grid-cols-2 gap-3">
                      <UFormField label="Начало">
                        <UInput v-model="branchWorkHours[day.key].start_time" type="time" />
                      </UFormField>
                      <UFormField label="Конец">
                        <UInput v-model="branchWorkHours[day.key].end_time" type="time" />
                      </UFormField>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>
          </template>

          <template #footer="{ close }">
            <div class="flex w-full flex-wrap justify-end gap-3">
              <UButton color="neutral" variant="outline" :disabled="branchSubmitting" @click="resetBranchForm">
                Сбросить
              </UButton>
              <UButton color="neutral" variant="ghost" :disabled="branchSubmitting" @click="close">
                Закрыть
              </UButton>
              <UButton color="primary" icon="i-lucide-save" :loading="branchSubmitting" @click="submitCreateBranch">
                Создать
              </UButton>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
