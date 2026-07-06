<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const apiClient = useApiClient()

type BranchRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  timezone: string | null
  work_hours: any | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function getExternalAddressUrl(value: unknown) {
  const address = normalizeText(value)

  if (!address || !/^https?:\/\//i.test(address)) {
    return null
  }

  return address
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
    name: normalizeText(anyValue.name) || 'Филиал',
    timezone: normalizeText(anyValue.timezone),
    work_hours: anyValue.work_hours ?? null
  }
}

const route = useRoute()
const store = useDashboardMarketplaceStore()
const branchesApi = useBranchesApi()
const marketplaceBarbershopsApi = useMarketplaceBarbershopsApi()

const barbershopId = computed(() => String(route.params.id || ''))

const createBranchModalOpen = ref(false)
const branchSubmitting = ref(false)
const editingBranchId = ref('')
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

function cloneWorkHours(source: Record<DayKey, { start_time: string, end_time: string }>) {
  return days.reduce((acc, day) => {
    acc[day.key] = { ...source[day.key] }
    return acc
  }, {} as Record<DayKey, { start_time: string, end_time: string }>)
}

const branchWorkHours = reactive<Record<DayKey, { start_time: string, end_time: string }>>(
  cloneWorkHours(defaultWorkHours)
)

const barbershopWorkHours = reactive<Record<DayKey, { start_time: string, end_time: string }>>(
  cloneWorkHours(defaultWorkHours)
)

const editBarbershopModalOpen = ref(false)
const barbershopSubmitting = ref(false)

const barbershopForm = reactive({
  address: '',
  city: '',
  cover_url: '',
  description: '',
  is_active: true,
  logo_url: '',
  name: '',
  sort_order: 0,
  timezone: 'Asia/Tashkent'
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
    apiClient.notifyError(new Error('login is required'), 'Укажите логин мерчанта.')
    return
  }

  if (!password || password.length < 6) {
    apiClient.notifyError(new Error('password is required'), 'Пароль должен быть минимум 6 символов.')
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

function resolveMerchantTarget() {
  const account = merchantAccount.value
  const merchantId = normalizeText(account?.id)

  if (!merchantId) {
    apiClient.notifyError(new Error('merchant id is required'), 'Не удалось определить id мерчанта.')
    return null
  }

  const login = normalizeText(account?.login)
  return { label: login ? `«${login}»` : merchantId, merchantId }
}

async function deleteMerchantAccount() {
  const target = resolveMerchantTarget()
  if (!target) return

  if (import.meta.client && !window.confirm(`Удалить аккаунт мерчанта ${target.label} безвозвратно? Запись будет удалена из базы, восстановить её нельзя.`)) {
    return
  }

  merchantDeleting.value = true
  try {
    await marketplaceBarbershopsApi.deleteMerchant(barbershopId.value, target.merchantId)
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

function resetBarbershopWorkHours() {
  for (const day of days) {
    barbershopWorkHours[day.key].start_time = defaultWorkHours[day.key].start_time
    barbershopWorkHours[day.key].end_time = defaultWorkHours[day.key].end_time
  }
}

function applyWorkHours(target: Record<DayKey, { start_time: string, end_time: string }>, value: unknown) {
  for (const day of days) {
    target[day.key].start_time = defaultWorkHours[day.key].start_time
    target[day.key].end_time = defaultWorkHours[day.key].end_time
  }

  if (!value || typeof value !== 'object') return
  const anyValue = value as any

  for (const day of days) {
    const entry = anyValue[day.key]
    if (!entry || typeof entry !== 'object') continue

    const start = normalizeText((entry as any).start_time)
    const end = normalizeText((entry as any).end_time)

    if (start) target[day.key].start_time = start
    if (end) target[day.key].end_time = end
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
  editingBranchId.value = ''
  resetBranchForm()
  createBranchModalOpen.value = true
}

function openEditBranchModal(row: BranchRow) {
  editingBranchId.value = row.id
  branchForm.name = row.name || ''
  branchForm.city = row.city || ''
  branchForm.address = row.address || ''
  branchForm.timezone = row.timezone || String(barbershop.value?.timezone || 'Asia/Tashkent')
  branchForm.is_active = row.is_active !== false
  applyWorkHours(branchWorkHours, row.work_hours)
  createBranchModalOpen.value = true
}

function openEditBarbershopModal() {
  const source = barbershop.value || {}

  barbershopForm.name = normalizeText(source.name) || ''
  barbershopForm.city = normalizeText(source.city) || ''
  barbershopForm.address = normalizeText(source.address) || ''
  barbershopForm.timezone = normalizeText(source.timezone) || 'Asia/Tashkent'
  barbershopForm.description = normalizeText(source.description) || ''
  barbershopForm.logo_url = normalizeText(source.logo_url) || ''
  barbershopForm.cover_url = normalizeText(source.cover_url) || ''
  barbershopForm.sort_order = Number.isFinite(Number(source.sort_order)) ? Number(source.sort_order) : 0
  barbershopForm.is_active = source.is_active !== false
  applyWorkHours(barbershopWorkHours, source.work_hours)
  editBarbershopModalOpen.value = true
}

const branchModalTitle = computed(() => editingBranchId.value ? 'Редактировать филиал' : 'Создать филиал')
const branchModalDescription = computed(() => editingBranchId.value
  ? 'Изменения будут применены к филиалу этого барбершопа.'
  : 'Филиал будет создан и автоматически привязан к этому барбершопу.'
)
const branchSubmitLabel = computed(() => editingBranchId.value ? 'Сохранить' : 'Создать')

async function submitBranchForm() {
  const name = normalizeText(branchForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название филиала.')
    return
  }

  branchSubmitting.value = true
  try {
    const payload = {
      address: normalizeText(branchForm.address),
      city: normalizeText(branchForm.city),
      is_active: Boolean(branchForm.is_active),
      name,
      timezone: normalizeText(branchForm.timezone),
      work_hours: JSON.parse(JSON.stringify(branchWorkHours))
    }

    if (editingBranchId.value) {
      await branchesApi.update(editingBranchId.value, payload)
    }
    else {
      await branchesApi.create({
        ...payload,
        marketplace_barbershop_id: barbershopId.value
      })
    }

    createBranchModalOpen.value = false
    await refresh()
  } finally {
    branchSubmitting.value = false
  }
}

async function submitBarbershopEdit() {
  const name = normalizeText(barbershopForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название барбершопа.')
    return
  }

  barbershopSubmitting.value = true
  try {
    await marketplaceBarbershopsApi.update(barbershopId.value, {
      address: normalizeText(barbershopForm.address),
      city: normalizeText(barbershopForm.city),
      cover_url: normalizeText(barbershopForm.cover_url),
      description: normalizeText(barbershopForm.description),
      is_active: Boolean(barbershopForm.is_active),
      logo_url: normalizeText(barbershopForm.logo_url),
      name,
      sort_order: Number(barbershopForm.sort_order || 0),
      timezone: normalizeText(barbershopForm.timezone),
      work_hours: JSON.parse(JSON.stringify(barbershopWorkHours))
    })

    editBarbershopModalOpen.value = false
    await refresh()
  }
  finally {
    barbershopSubmitting.value = false
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
        apiClient.notifyError(error)
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
              <UButton
                color="neutral"
                icon="i-lucide-pencil"
                variant="outline"
                @click="openEditBarbershopModal"
              >
                Редактировать
              </UButton>
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
              <UButton
                v-if="getExternalAddressUrl(barbershop?.address)"
                color="neutral"
                icon="i-lucide-map-pinned"
                :to="getExternalAddressUrl(barbershop?.address) || undefined"
                size="xs"
                target="_blank"
                variant="outline"
              >
                Перейти в Карты
              </UButton>
              <p v-else class="text-sm font-medium text-charcoal-950">
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
                <UButton
                  v-if="getExternalAddressUrl(row.original.address)"
                  color="neutral"
                  icon="i-lucide-map-pinned"
                  :to="getExternalAddressUrl(row.original.address) || undefined"
                  size="xs"
                  target="_blank"
                  variant="outline"
                >
                  Перейти в Карты
                </UButton>
                <span v-else class="text-sm text-charcoal-700">
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
                    icon="i-lucide-pencil"
                    variant="ghost"
                    size="xs"
                    @click="openEditBranchModal(row.original)"
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
          :title="branchModalTitle"
          :description="branchModalDescription"
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
              <UButton color="primary" icon="i-lucide-save" :loading="branchSubmitting" @click="submitBranchForm">
                {{ branchSubmitLabel }}
              </UButton>
            </div>
          </template>
        </UModal>

        <UModal
          v-model:open="editBarbershopModalOpen"
          class="sm:max-w-2xl"
          title="Редактировать барбершоп"
          description="Обновите карточку барбершопа, которую видит маркетплейс."
        >
          <template #body>
            <div class="space-y-4">
              <UFormField label="Название" required>
                <UInput v-model="barbershopForm.name" />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Город">
                  <UInput v-model="barbershopForm.city" placeholder="Ташкент" />
                </UFormField>

                <UFormField label="Timezone">
                  <UInput v-model="barbershopForm.timezone" placeholder="Asia/Tashkent" />
                </UFormField>
              </div>

              <UFormField label="Адрес">
                <UInput v-model="barbershopForm.address" />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Лого URL">
                  <UInput v-model="barbershopForm.logo_url" placeholder="https://..." />
                </UFormField>

                <UFormField label="Обложка URL">
                  <UInput v-model="barbershopForm.cover_url" placeholder="https://..." />
                </UFormField>
              </div>

              <UFormField label="Описание">
                <UTextarea v-model="barbershopForm.description" :rows="3" />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Сортировка">
                  <UInput v-model.number="barbershopForm.sort_order" type="number" />
                </UFormField>

                <div class="flex items-end">
                  <UCheckbox v-model="barbershopForm.is_active" label="Активен в маркетплейсе" />
                </div>
              </div>

              <UCard class="rounded-2xl border border-charcoal-200 bg-white/70">
                <template #header>
                  <div class="space-y-1">
                    <h4 class="font-semibold text-charcoal-950">
                      Время работы
                    </h4>
                    <p class="text-sm text-charcoal-500">
                      Сохраняется в <span class="font-mono">work_hours</span>.
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
                        <UInput v-model="barbershopWorkHours[day.key].start_time" type="time" />
                      </UFormField>
                      <UFormField label="Конец">
                        <UInput v-model="barbershopWorkHours[day.key].end_time" type="time" />
                      </UFormField>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>
          </template>

          <template #footer="{ close }">
            <div class="flex w-full flex-wrap justify-end gap-3">
              <UButton color="neutral" variant="outline" :disabled="barbershopSubmitting" @click="resetBarbershopWorkHours">
                Сбросить график
              </UButton>
              <UButton color="neutral" variant="ghost" :disabled="barbershopSubmitting" @click="close">
                Закрыть
              </UButton>
              <UButton color="primary" icon="i-lucide-save" :loading="barbershopSubmitting" @click="submitBarbershopEdit">
                Сохранить
              </UButton>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
