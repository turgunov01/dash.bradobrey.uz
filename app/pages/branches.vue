<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VerifixSchedule } from '~/composables/useVerifixApi'
import type { BranchLocation, LocationEvent } from '~/composables/useBranchesApi'
import { formatDateTime } from '~/utils/format'
import 'leaflet/dist/leaflet.css'

import type { Branch } from '~~/shared/schemas'
import { branchFormSchema, branchSchema } from '~~/shared/schemas'

const apiClient = useApiClient()

type BranchRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  timezone: string | null
  marketplace_barbershop_id: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

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
  const parsed = branchSchema.safeParse(value)

  if (!parsed.success) {
    return null
  }

  const branch = parsed.data as Branch

  return {
    id: String(branch.id),
    name: normalizeText(branch.name) || 'Филиал',
    address: normalizeText((branch as any).address),
    city: normalizeText((branch as any).city),
    timezone: normalizeText((branch as any).timezone),
    marketplace_barbershop_id: normalizeText((branch as any).marketplace_barbershop_id),
    is_active: (branch as any).is_active == null ? null : Boolean((branch as any).is_active)
  }
}

function extractBranchItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    items?: unknown[]
    branches?: unknown[]
    data?: unknown[] | { items?: unknown[], branches?: unknown[] }
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.branches)) {
    return payload.branches
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data && typeof payload.data === 'object') {
    if (Array.isArray(payload.data.items)) {
      return payload.data.items
    }

    if (Array.isArray(payload.data.branches)) {
      return payload.data.branches
    }
  }

  return []
}

const branchesApi = useBranchesApi()
const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const verifixApi = useVerifixApi()

const search = ref('')
const modalOpen = ref(false)
const submitting = ref(false)
const removingId = ref('')
const locationOpen = ref(false)
const locationSubmitting = ref(false)
const locationPending = ref(false)
const locationBranch = ref<BranchRow | null>(null)
const locationEvents = ref<LocationEvent[]>([])
const mapPickerOpen = ref(false)
const mapPickerElement = ref<HTMLElement | null>(null)
const mapPickerLoading = ref(false)
const mapPickerError = ref('')
const myLocationAvailable = ref(false)
const mapPickerSearching = ref(false)
const mapPickerAddress = ref('')
const mapPickerSearchQuery = ref('')
const mapPickerSearchResults = ref<Array<{ display_name: string, lat: string, lon: string }>>([])
const leafletMapInstance = ref<any>(null)
const mapPickerDraft = reactive({ address: '', latitude: '', longitude: '' })
let reverseGeocodeTimer: ReturnType<typeof setTimeout> | null = null
let reverseGeocodeRequestId = 0
let nominatimLastRequestAt = 0
const locationForm = reactive({ latitude: '', longitude: '', radius_meters: 1000, is_enabled: false })

const form = reactive({
  id: '',
  name: '',
  address: '',
  city: '',
  timezone: '',
  is_active: true
})

const columns: TableColumn<BranchRow>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'city', header: 'Город' },
  { accessorKey: 'address', header: 'Адрес' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('branches-dashboard', async () => {
  return await branchesApi.list()
})

const { data: barbersData } = await useAsyncData('branches-verifix-barbers', async () => {
  return await barbersApi.list({ include_inactive: true })
})

const branchRows = computed<BranchRow[]>(() =>
  extractBranchItems(data.value).flatMap(item => {
    const row = toBranchRow(item)
    return row ? [row] : []
  })
)

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()

  const rows = branchRows.value.filter(row => !row.marketplace_barbershop_id)

  if (!query) {
    return rows
  }

  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.address || '',
      row.city || '',
      row.timezone || '',
      row.id
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

const modalTitle = computed(() => form.id ? 'Редактировать филиал' : 'Создать филиал')
const modalDescription = computed(() => form.id ? 'Обновите параметры филиала и сохраните изменения.' : 'Заполните данные, чтобы добавить новый филиал.')

const bulkScheduleOpen = ref(false)
const bulkScheduleSubmitting = ref(false)
const bulkScheduleForm = reactive({ start_time: '10:00', end_time: '20:00', grace_minutes: 0 })
const allScheduleBranches = computed(() => branchRows.value.filter(branch => !branch.marketplace_barbershop_id))
async function saveBulkSchedule() {
  if (bulkScheduleSubmitting.value) return
  bulkScheduleSubmitting.value = true
  try {
    await verifixApi.bulkSchedules({
      branch_ids: allScheduleBranches.value.map(branch => branch.id),
      ...bulkScheduleForm
    })
    bulkScheduleOpen.value = false
    if (scheduleOpen.value) await refreshSchedules()
  } catch { /* The API client displays the error. */ }
  finally { bulkScheduleSubmitting.value = false }
}
async function applyScheduleToWeek() {
  if (!scheduleBranch.value || scheduleSubmitting.value) return
  scheduleSubmitting.value = true
  try {
    await verifixApi.bulkSchedules({
      branch_ids: [scheduleBranch.value.id],
      start_time: scheduleForm.start_time, end_time: scheduleForm.end_time,
      grace_minutes: scheduleForm.grace_minutes
    })
    resetScheduleForm()
    await refreshSchedules()
  } catch { /* The API client displays the error. */ }
  finally { scheduleSubmitting.value = false }
}

const scheduleOpen = ref(false)
const schedulesPending = ref(false)
const scheduleSubmitting = ref(false)
const scheduleBranch = ref<BranchRow | null>(null)
const scheduleEditingId = ref<string | null>(null)
const verifixSchedules = ref<VerifixSchedule[]>([])

const scheduleDays = [
  { label: 'Воскресенье', value: 0 },
  { label: 'Понедельник', value: 1 },
  { label: 'Вторник', value: 2 },
  { label: 'Среда', value: 3 },
  { label: 'Четверг', value: 4 },
  { label: 'Пятница', value: 5 },
  { label: 'Суббота', value: 6 }
]

const scheduleForm = reactive({
  barber_id: null as string | null,
  day_of_week: 1,
  end_time: '20:00',
  grace_minutes: 0,
  start_time: '10:00'
})

const scheduleBarberOptions = computed(() => {
  const branchId = scheduleBranch.value?.id
  const barbers = ((barbersData.value as any)?.items || []) as Array<{ branch_id: string | null, id: string, name: string | null }>

  return [
    { label: 'Все барберы филиала', value: null },
    ...barbers
      .filter(barber => barber.branch_id === branchId)
      .map(barber => ({ label: barber.name || 'Сотрудник', value: barber.id }))
  ]
})

const barberNameById = computed(() => new Map(
  (((barbersData.value as any)?.items || []) as Array<{ id: string, name: string | null }>)
    .map(barber => [barber.id, barber.name || 'Сотрудник'])
))

function resetScheduleForm() {
  scheduleEditingId.value = null
  scheduleForm.barber_id = null
  scheduleForm.day_of_week = 1
  scheduleForm.start_time = '10:00'
  scheduleForm.end_time = '20:00'
  scheduleForm.grace_minutes = 0
}

async function refreshSchedules() {
  const branch = scheduleBranch.value
  if (!branch) return

  schedulesPending.value = true
  try {
    const response = await verifixApi.schedules({ branch_id: branch.id })
    verifixSchedules.value = Array.isArray(response?.items) ? response.items.filter(schedule => schedule.is_active) : []
  }
  finally {
    schedulesPending.value = false
  }
}

async function openLocation(row: BranchRow) {
  locationBranch.value = row
  locationOpen.value = true
  locationPending.value = true
  try {
    const [response, events] = await Promise.all([
      branchesApi.getLocation(row.id),
      branchesApi.locationEvents({ branch_id: row.id, limit: 20 })
    ])
    const location = response?.location as BranchLocation | null
    locationForm.latitude = location ? String(location.latitude) : ''
    locationForm.longitude = location ? String(location.longitude) : ''
    locationForm.radius_meters = Number(location?.radius_meters || 1000)
    locationForm.is_enabled = location?.is_enabled === true
    locationEvents.value = Array.isArray(events?.items) ? events.items : []
  }
  finally {
    locationPending.value = false
  }
}

async function saveLocation() {
  if (!locationBranch.value) return
  const latitude = Number(locationForm.latitude)
  const longitude = Number(locationForm.longitude)
  const radius = Number(locationForm.radius_meters)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isInteger(radius) || radius < 1 || radius > 50000) {
    apiClient.notifyError(new Error('Введите корректные координаты и радиус'))
    return
  }
  locationSubmitting.value = true
  try {
    await branchesApi.saveLocation(locationBranch.value.id, { latitude, longitude, radius_meters: radius, is_enabled: locationForm.is_enabled })
    const events = await branchesApi.locationEvents({ branch_id: locationBranch.value.id, limit: 20 })
    locationEvents.value = Array.isArray(events?.items) ? events.items : []
  }
  finally {
    locationSubmitting.value = false
  }
}

const mapPickerFallback = { latitude: 41.3111, longitude: 69.2797 }
async function waitForMapPickerElement() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (mapPickerElement.value instanceof HTMLElement) return mapPickerElement.value
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }
  throw new Error('Map container was not rendered')
}

function validMapPoint(latitude: unknown, longitude: unknown) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180
}

function updateMapPoint(latitude: number, longitude: number, pan = true) {
  if (!leafletMapInstance.value) return
  if (pan) leafletMapInstance.value.panTo([latitude, longitude])
}

function destroyMapPicker() {
  if (reverseGeocodeTimer) clearTimeout(reverseGeocodeTimer)
  reverseGeocodeTimer = null
  reverseGeocodeRequestId += 1
  leafletMapInstance.value?.remove()
  leafletMapInstance.value = null
  mapPickerSearchResults.value = []
  mapPickerSearching.value = false
}

async function refreshGeolocationAvailability() {
  myLocationAvailable.value = typeof navigator !== 'undefined' && 'geolocation' in navigator
  if (!myLocationAvailable.value || !('permissions' in navigator)) return
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    myLocationAvailable.value = permission.state !== 'denied'
  }
  catch { /* Some browsers do not expose geolocation permission state. */ }
}

function getCurrentBrowserLocation(): Promise<{ latitude: number, longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация недоступна в этом браузере'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!validMapPoint(coords.latitude, coords.longitude)) {
          reject(new Error('Браузер вернул некорректные координаты'))
          return
        }
        resolve({ latitude: coords.latitude, longitude: coords.longitude })
      },
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}

async function centerOnCurrentLocation(showError = true) {
  if (!myLocationAvailable.value || !navigator.geolocation) return false
  mapPickerLoading.value = true
  try {
    const { latitude, longitude } = await getCurrentBrowserLocation()
    mapPickerDraft.latitude = latitude.toFixed(6)
    mapPickerDraft.longitude = longitude.toFixed(6)
    updateMapPoint(latitude, longitude)
    return true
  }
  catch (error: any) {
    if (showError) {
      mapPickerError.value = error?.code === 1
        ? 'Разрешите доступ к местоположению в браузере'
        : 'Не удалось получить ваше местоположение'
    }
    return false
  }
  finally {
    mapPickerLoading.value = false
  }
}

async function useMyLocation() {
  await centerOnCurrentLocation(true)
}

function openMapPicker() {
  mapPickerSearchQuery.value = ''
  mapPickerSearchResults.value = []
  mapPickerAddress.value = ''
  mapPickerError.value = ''
  mapPickerDraft.latitude = locationForm.latitude
  mapPickerDraft.longitude = locationForm.longitude
  mapPickerDraft.address = ''
  mapPickerOpen.value = true
  mapPickerLoading.value = true
}

function applyMapPicker() {
  if (!validMapPoint(mapPickerDraft.latitude, mapPickerDraft.longitude)) return
  locationForm.latitude = mapPickerDraft.latitude
  locationForm.longitude = mapPickerDraft.longitude
  mapPickerOpen.value = false
}

async function waitForNominatimSlot() {
  const delay = Math.max(0, 1100 - (Date.now() - nominatimLastRequestAt))
  if (delay) await new Promise(resolve => setTimeout(resolve, delay))
  nominatimLastRequestAt = Date.now()
}

async function nominatimRequest(path: string, params: Record<string, string>) {
  await waitForNominatimSlot()
  const query = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'ru', ...params })
  const response = await fetch(`https://nominatim.openstreetmap.org/${path}?${query.toString()}`, {
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) throw new Error(`Геокодер недоступен (${response.status})`)
  return response.json()
}

function scheduleReverseGeocode(latitude: number, longitude: number) {
  if (reverseGeocodeTimer) clearTimeout(reverseGeocodeTimer)
  const requestId = ++reverseGeocodeRequestId
  reverseGeocodeTimer = setTimeout(async () => {
    try {
      const result = await nominatimRequest('reverse', { lat: String(latitude), lon: String(longitude), zoom: '18' })
      if (requestId !== reverseGeocodeRequestId) return
      const address = typeof result?.display_name === 'string' ? result.display_name : ''
      mapPickerAddress.value = address
      mapPickerDraft.address = address
      if (!address) mapPickerError.value = 'Адрес для выбранной точки не найден. Координаты можно подтвердить.'
    }
    catch {
      if (requestId === reverseGeocodeRequestId) mapPickerError.value = 'Не удалось определить адрес. Координаты можно подтвердить без адреса.'
    }
  }, Math.max(0, 1100 - (Date.now() - nominatimLastRequestAt)))
}

async function searchMapAddress() {
  const query = mapPickerSearchQuery.value.trim()
  if (query.length < 3) {
    mapPickerError.value = 'Введите минимум 3 символа для поиска адреса'
    return
  }
  mapPickerSearching.value = true
  mapPickerError.value = ''
  try {
    const results = await nominatimRequest('search', { q: query, limit: '5', countrycodes: 'uz' })
    mapPickerSearchResults.value = Array.isArray(results) ? results : []
    if (!mapPickerSearchResults.value.length) mapPickerError.value = 'Адрес не найден'
  }
  catch {
    mapPickerError.value = 'Поиск адреса временно недоступен. Попробуйте позже.'
  }
  finally {
    mapPickerSearching.value = false
  }
}

function selectMapSearchResult(result: { display_name: string, lat: string, lon: string }) {
  const latitude = Number(result.lat)
  const longitude = Number(result.lon)
  if (!validMapPoint(latitude, longitude)) return
  mapPickerDraft.latitude = latitude.toFixed(6)
  mapPickerDraft.longitude = longitude.toFixed(6)
  mapPickerDraft.address = result.display_name
  mapPickerAddress.value = result.display_name
  mapPickerSearchResults.value = []
  leafletMapInstance.value?.setView([latitude, longitude], 17)
}

async function initializeMapPicker() {
  if (leafletMapInstance.value || !mapPickerOpen.value) return
  try {
    const mapElement = await waitForMapPickerElement()
    const L = await import('leaflet')
    const latitude = Number(mapPickerDraft.latitude)
    const longitude = Number(mapPickerDraft.longitude)
    const hasSavedPoint = validMapPoint(latitude, longitude)
    const center: [number, number] = [
      hasSavedPoint ? latitude : mapPickerFallback.latitude,
      hasSavedPoint ? longitude : mapPickerFallback.longitude
    ]
    leafletMapInstance.value = L.map(mapElement, { center, zoom: 16, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(leafletMapInstance.value)
    leafletMapInstance.value.on('moveend', () => {
      const mapCenter = leafletMapInstance.value.getCenter()
      mapPickerDraft.latitude = mapCenter.lat.toFixed(6)
      mapPickerDraft.longitude = mapCenter.lng.toFixed(6)
      mapPickerError.value = ''
      scheduleReverseGeocode(mapCenter.lat, mapCenter.lng)
    })
    leafletMapInstance.value.on('click', (event: any) => leafletMapInstance.value.panTo(event.latlng))
    leafletMapInstance.value.invalidateSize()
    const mapCenter = leafletMapInstance.value.getCenter()
    mapPickerDraft.latitude = mapCenter.lat.toFixed(6)
    mapPickerDraft.longitude = mapCenter.lng.toFixed(6)
    scheduleReverseGeocode(mapCenter.lat, mapCenter.lng)
    await refreshGeolocationAvailability()
    if (!hasSavedPoint) {
      await centerOnCurrentLocation(false)
      if (!myLocationAvailable.value) {
        mapPickerError.value = 'Разрешите геолокацию, чтобы открыть карту с вашего местоположения. Сейчас показан Ташкент.'
      }
    }
  }
  catch (error) {
    mapPickerError.value = error instanceof Error ? error.message : 'Не удалось загрузить карту'
  }
  finally {
    mapPickerLoading.value = false
  }
}

watch([() => locationForm.latitude, () => locationForm.longitude], ([latitude, longitude]) => {
  if (!validMapPoint(latitude, longitude)) return
  if (leafletMapInstance.value) updateMapPoint(Number(latitude), Number(longitude))
})

async function openSchedules(row: BranchRow) {
  scheduleBranch.value = row
  resetScheduleForm()
  scheduleOpen.value = true
  await refreshSchedules()
}

function editSchedule(schedule: VerifixSchedule) {
  scheduleEditingId.value = schedule.id
  scheduleForm.barber_id = schedule.barber_id || null
  scheduleForm.day_of_week = schedule.day_of_week
  scheduleForm.start_time = String(schedule.start_time || '').slice(0, 5)
  scheduleForm.end_time = schedule.end_time ? String(schedule.end_time).slice(0, 5) : ''
  scheduleForm.grace_minutes = Number(schedule.grace_minutes || 0)
}

async function saveSchedule() {
  const branch = scheduleBranch.value
  if (!branch || !scheduleForm.start_time) return

  scheduleSubmitting.value = true
  try {
    const payload = {
      barber_id: scheduleForm.barber_id,
      branch_id: branch.id,
      day_of_week: Number(scheduleForm.day_of_week),
      end_time: scheduleForm.end_time || null,
      grace_minutes: Math.max(0, Number(scheduleForm.grace_minutes) || 0),
      start_time: scheduleForm.start_time
    }

    if (scheduleEditingId.value) {
      await verifixApi.updateSchedule(scheduleEditingId.value, payload)
    }
    else {
      await verifixApi.createSchedule(payload)
    }

    resetScheduleForm()
    await refreshSchedules()
  }
  finally {
    scheduleSubmitting.value = false
  }
}

async function deactivateSchedule(schedule: VerifixSchedule) {
  scheduleSubmitting.value = true
  try {
    await verifixApi.deactivateSchedule(schedule.id)
    if (scheduleEditingId.value === schedule.id) resetScheduleForm()
    await refreshSchedules()
  }
  finally {
    scheduleSubmitting.value = false
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.address = ''
  form.city = ''
  form.timezone = ''
  form.is_active = true
}

function openCreateModal() {
  resetForm()
  modalOpen.value = true
}

function openEditModal(row: BranchRow) {
  form.id = row.id
  form.name = row.name
  form.address = row.address || ''
  form.city = row.city || ''
  form.timezone = row.timezone || ''
  form.is_active = row.is_active !== false
  modalOpen.value = true
}

async function submit() {
  const parsed = branchFormSchema.safeParse({
    name: form.name,
    address: form.address || undefined,
    city: form.city || undefined,
    timezone: form.timezone || undefined,
    is_active: form.is_active
  })

  if (!parsed.success) {
    apiClient.notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные'))
    return
  }

  submitting.value = true

  try {
    if (form.id) {
      await branchesApi.update(form.id, parsed.data)
    }
    else {
      await branchesApi.create(parsed.data)
    }

    await refresh()
    await branchStore.reload()
    modalOpen.value = false
  }
  finally {
    submitting.value = false
  }
}

async function removeBranch(row: BranchRow) {
  const label = row.name ? `«${row.name}»` : row.id

  if (import.meta.client && !window.confirm(`Удалить филиал ${label}?`)) {
    return
  }

  removingId.value = row.id

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
    await branchStore.reload()
  }
  finally {
    removingId.value = ''
  }
}
</script>

<template>
  <UDashboardPanel id="branches">
    <template #header>
      <UDashboardNavbar
        class="service-categories-navbar"
        title="Филиалы"
        :ui="{ root: 'min-h-14 sm:min-h-16', right: 'gap-2 sm:gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-calendar-days"
            :disabled="pending || !allScheduleBranches.length"
            aria-label="Время для всех филиалов"
            @click="bulkScheduleOpen = true"
          >
            <span class="hidden sm:inline">Время для всех филиалов</span>
          </UButton>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            aria-label="Обновить"
            @click="refresh()"
          >
            <span class="hidden sm:inline">Обновить</span>
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" aria-label="Создать филиал" @click="openCreateModal">
            <span class="hidden sm:inline">Создать</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Справочник
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Управление филиалами
                </h2>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3">
                <UInput v-model="search" placeholder="Поиск по названию, адресу или id" class="w-full sm:w-72" />

                <UBadge color="neutral" size="lg" variant="soft">
                  {{ filteredRows.length }} филиалов
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="filteredRows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="filteredRows">
              <template #name-cell="{ row }">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                  <UBadge v-if="row.original.id === branchStore.activeBranchId" color="primary" size="xs" variant="soft">
                    Текущий
                  </UBadge>
                </div>
                <p class="mt-1 text-xs text-charcoal-500">
                  {{ row.original.id }}
                </p>
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
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-map-pin-check"
                    title="Геоконтроль входа"
                    variant="ghost"
                    size="xs"
                    @click="openLocation(row.original)"
                  />
                  <UButton
                    icon="i-lucide-calendar-clock"
                    title="График сотрудников Verifix"
                    variant="ghost"
                    size="xs"
                    @click="openSchedules(row.original)"
                  />
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditModal(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="removingId === row.original.id"
                    @click="removeBranch(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            description="Филиалы не найдены или не удалось получить список."
            icon="i-lucide-store"
            title="Пусто"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>
      </div>

      <UModal v-model:open="locationOpen" class="sm:max-w-2xl" title="Геоконтроль входа" :description="locationBranch ? `Филиал: ${locationBranch.name}` : ''">
        <template #body>
          <div v-if="locationPending" class="flex justify-center py-8"><ULoader size="lg" /></div>
          <div v-else class="space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Широта" required><UInput v-model="locationForm.latitude" type="number" step="any" placeholder="41.3111" /></UFormField>
              <UFormField label="Долгота" required><UInput v-model="locationForm.longitude" type="number" step="any" placeholder="69.2797" /></UFormField>
              <UFormField label="Радиус, метров" required><UInput v-model.number="locationForm.radius_meters" type="number" min="1" max="50000" /></UFormField>
              <UCheckbox v-model="locationForm.is_enabled" class="self-end" label="Включить обязательную проверку" />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div>
                <p class="text-sm font-semibold text-charcoal-950">Точка филиала</p>
                <p class="text-xs text-charcoal-500">Отметьте место на карте — координаты заполнятся автоматически.</p>
              </div>
              <UButton icon="i-lucide-map" color="primary" variant="soft" @click="openMapPicker">Выбрать на карте</UButton>
            </div>
            <div class="flex justify-end"><UButton :loading="locationSubmitting" icon="i-lucide-save" @click="saveLocation">Сохранить локацию</UButton></div>
            <div class="border-t border-charcoal-200 pt-4">
              <p class="mb-3 text-sm font-semibold text-charcoal-950">История входов</p>
              <div v-if="locationEvents.length" class="space-y-2">
                <div v-for="event in locationEvents" :key="event.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal-200 px-3 py-2 text-sm">
                  <span>{{ event.barber_name || event.barber_id }} · {{ event.status === 'inside_radius' ? 'в радиусе' : event.status === 'outside_radius' ? 'вне радиуса' : 'отклонён' }}</span>
                  <span class="text-charcoal-500">{{ event.distance_meters == null ? '—' : `${Math.round(event.distance_meters)} м` }} · {{ formatDateTime(event.created_at) }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-charcoal-500">Событий входа пока нет.</p>
            </div>
          </div>
        </template>
        <template #footer><div class="flex justify-end"><UButton color="neutral" variant="ghost" @click="locationOpen = false">Закрыть</UButton></div></template>
      </UModal>

      <UModal v-model:open="mapPickerOpen" class="sm:max-w-4xl" title="Выберите локацию филиала" description="Кликните по карте, чтобы поставить метку." @after:enter="initializeMapPicker" @after:leave="destroyMapPicker">
        <template #body>
          <form class="mb-3 flex gap-2" @submit.prevent="searchMapAddress">
            <UInput v-model="mapPickerSearchQuery" class="min-w-0 flex-1" placeholder="Введите адрес для поиска" aria-label="Поиск адреса" />
            <UButton type="submit" icon="i-lucide-search" :loading="mapPickerSearching">Найти</UButton>
          </form>
          <div v-if="mapPickerSearchResults.length" class="mb-3 max-h-44 overflow-auto rounded-xl border border-charcoal-200 bg-white">
            <button v-for="result in mapPickerSearchResults" :key="`${result.lat}:${result.lon}`" type="button" class="block w-full border-b border-charcoal-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-charcoal-50" @click="selectMapSearchResult(result)">
              {{ result.display_name }}
            </button>
          </div>
          <div class="relative h-[min(60vh,28rem)] min-h-[20rem] overflow-hidden rounded-xl border border-charcoal-200 bg-charcoal-100">
            <div ref="mapPickerElement" class="absolute inset-0"></div>
            <div class="pointer-events-none absolute left-1/2 top-1/2 z-[400] -translate-x-1/2 -translate-y-full" aria-hidden="true">
              <div class="h-8 w-8 rounded-full border-4 border-white bg-primary-600 shadow-lg"></div>
              <div class="mx-auto h-3 w-3 -translate-y-1 rounded-full bg-primary-600"></div>
            </div>
            <div v-if="mapPickerLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70"><ULoader size="lg" /></div>
            <div v-if="mapPickerError" class="absolute inset-x-3 bottom-3 z-10 rounded-lg bg-white/95 p-3 text-center text-sm text-red-700 shadow">{{ mapPickerError }}</div>
          </div>
          <div class="mt-3 flex flex-wrap justify-end gap-2">
            <UButton v-if="myLocationAvailable" icon="i-lucide-locate-fixed" color="neutral" variant="soft" @click="useMyLocation">Моё местоположение</UButton>
          </div>
          <div class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div class="rounded-lg bg-charcoal-50 p-3"><span class="font-semibold">Широта:</span> {{ mapPickerDraft.latitude || '—' }}</div>
            <div class="rounded-lg bg-charcoal-50 p-3"><span class="font-semibold">Долгота:</span> {{ mapPickerDraft.longitude || '—' }}</div>
          </div>
          <p class="mt-3 rounded-lg bg-charcoal-50 p-3 text-sm text-charcoal-700"><span class="font-semibold">Адрес:</span> {{ mapPickerAddress || 'Адрес определяется после перемещения карты' }}</p>
          <p class="mt-3 text-xs text-charcoal-500">Перемещайте карту под центральной меткой или используйте поиск. После выбора нажмите «Применить», затем сохраните локацию филиала.</p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="mapPickerOpen = false">Отмена</UButton>
            <UButton color="primary" :disabled="!validMapPoint(mapPickerDraft.latitude, mapPickerDraft.longitude)" @click="applyMapPicker">Применить</UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="modalOpen"
        class="sm:max-w-xl"
        :description="modalDescription"
        :title="modalTitle"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название">
              <UInput v-model="form.name" />
            </UFormField>

            <UFormField label="Адрес">
              <UInput v-model="form.address" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Город">
                <UInput v-model="form.city" />
              </UFormField>

              <UFormField label="Timezone">
                <UInput v-model="form.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>

            <UCheckbox v-model="form.is_active" label="Филиал активен" />
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" :disabled="submitting" @click="resetForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submit">
              {{ form.id ? 'Сохранить' : 'Создать' }}
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="bulkScheduleOpen" title="Время работы для всех филиалов" description="Одинаковое время с понедельника по воскресенье.">
        <template #body>
          <div class="space-y-4">
            <p class="text-sm text-charcoal-600">Будет заменён общий график {{ allScheduleBranches.length }} филиалов на все 7 дней. Персональные смены сотрудников сохраняются.</p>
            <div class="flex flex-wrap gap-2"><UBadge v-for="branch in allScheduleBranches" :key="branch.id" color="neutral">{{ branch.name }}</UBadge></div>
            <UFormField label="Начало работы"><UInput v-model="bulkScheduleForm.start_time" type="time" :disabled="bulkScheduleSubmitting" /></UFormField>
            <UFormField label="Конец работы"><UInput v-model="bulkScheduleForm.end_time" type="time" :disabled="bulkScheduleSubmitting" /></UFormField>
            <UFormField label="Допуск опоздания, минут"><UInput v-model.number="bulkScheduleForm.grace_minutes" type="number" min="0" step="1" :disabled="bulkScheduleSubmitting" /></UFormField>
          </div>
        </template>
        <template #footer>
          <UButton :loading="bulkScheduleSubmitting" :disabled="!allScheduleBranches.length || !bulkScheduleForm.start_time || !bulkScheduleForm.end_time || bulkScheduleForm.start_time === bulkScheduleForm.end_time || !Number.isInteger(bulkScheduleForm.grace_minutes) || bulkScheduleForm.grace_minutes < 0" @click="saveBulkSchedule">Применить ко всем филиалам на всю неделю</UButton>
        </template>
      </UModal>

      <UModal
        v-model:open="scheduleOpen"
        class="sm:max-w-3xl"
        :title="scheduleBranch ? `График сотрудников: ${scheduleBranch.name}` : 'График сотрудников'"
        description="График Verifix используется для расчёта опоздания в момент входа барбера."
      >
        <template #body>
          <div class="space-y-5">
            <div class="rounded-[1.25rem] border border-primary-200 bg-primary-50/60 p-4 text-sm text-charcoal-700">
              Общий график действует на всех барберов филиала, пока для сотрудника не задан персональный.
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Сотрудник">
                <USelectMenu v-model="scheduleForm.barber_id" class="w-full" :items="scheduleBarberOptions" placeholder="Все барберы филиала" value-key="value" portal="body" />
              </UFormField>
              <UFormField label="День недели" required>
                <USelectMenu v-model="scheduleForm.day_of_week" class="w-full" :items="scheduleDays" value-key="value" portal="body" />
              </UFormField>
              <UFormField label="Начало смены" required>
                <UInput v-model="scheduleForm.start_time" type="time" />
              </UFormField>
              <UFormField label="Конец смены">
                <UInput v-model="scheduleForm.end_time" type="time" />
              </UFormField>
              <UFormField label="Допуск, минут">
                <UInput v-model.number="scheduleForm.grace_minutes" min="0" type="number" />
              </UFormField>
            </div>

            <div class="flex flex-wrap justify-end gap-3">
              <UButton v-if="!scheduleForm.barber_id" variant="outline" :disabled="!scheduleForm.start_time || !scheduleForm.end_time" :loading="scheduleSubmitting" @click="applyScheduleToWeek">Применить на все дни недели</UButton>
              <UButton v-if="scheduleEditingId" color="neutral" variant="ghost" :disabled="scheduleSubmitting" @click="resetScheduleForm">
                Отменить редактирование
              </UButton>
              <UButton color="primary" :disabled="!scheduleForm.start_time" :loading="scheduleSubmitting" @click="saveSchedule">
                {{ scheduleEditingId ? 'Сохранить изменения' : 'Добавить график' }}
              </UButton>
            </div>

            <div class="border-t border-charcoal-200 pt-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-charcoal-950">Активные смены</p>
                <UButton icon="i-lucide-refresh-cw" size="xs" variant="ghost" :loading="schedulesPending" @click="refreshSchedules" />
              </div>
              <div v-if="schedulesPending" class="py-6 text-center text-sm text-charcoal-500">Загрузка графика Verifix…</div>
              <div v-else-if="verifixSchedules.length" class="space-y-2">
                <div v-for="schedule in verifixSchedules" :key="schedule.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal-200 bg-charcoal-50/60 px-4 py-3">
                  <div class="min-w-0">
                    <p class="font-medium text-charcoal-950">
                      {{ scheduleDays.find(day => day.value === schedule.day_of_week)?.label }} · <span v-if="schedule.is_working === false">Выходной</span><template v-else>{{ String(schedule.start_time).slice(0, 5) }}<span v-if="schedule.end_time">–{{ String(schedule.end_time).slice(0, 5) }}</span></template>
                    </p>
                    <p class="text-xs text-charcoal-500">
                      {{ schedule.barber_id ? (barberNameById.get(schedule.barber_id) || 'Сотрудник') : 'Все барберы филиала' }} · допуск {{ schedule.grace_minutes || 0 }} мин
                    </p>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <UButton icon="i-lucide-pencil" size="xs" variant="ghost" :disabled="schedule.is_working === false" :title="schedule.is_working === false ? 'Измените персональный график в карточке барбера' : undefined" @click="editSchedule(schedule)" />
                    <UButton icon="i-lucide-power" color="error" size="xs" variant="ghost" :disabled="scheduleSubmitting" @click="deactivateSchedule(schedule)" />
                  </div>
                </div>
              </div>
              <p v-else class="py-6 text-center text-sm text-charcoal-500">Активных смен ещё нет. Добавьте график, чтобы Verifix начал считать опоздания.</p>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="neutral" variant="ghost" @click="scheduleOpen = false">Закрыть</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
