<script setup lang="ts">
import { calculateMinutePenalty } from '~/utils/penalty'
import { currentDateInputValue, formatDateTime, formatMoney } from '~/utils/format'
import { useStorage } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'

import type { VerifixEvent, VerifixSchedule } from '~/composables/useVerifixApi'
import type { BranchLocation, LocationEvent } from '~/composables/useBranchesApi'
import 'leaflet/dist/leaflet.css'

type LateRow = {
  id: string
  barberId: string
  barberName: string
  branchId: string
  branchName: string
  date: Date
  lateMinutes: number
  loginAt: Date
  scheduleStart: string
}

type LateEmployeeGroup = {
  barberId: string
  barberName: string
  branches: string[]
  events: LateRow[]
  lateDays: number
  totalLateMinutes: number
  totalPenalty: number
}

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const verifixApi = useVerifixApi()
const branchesApi = useBranchesApi()
const apiClient = useApiClient()
const { data: penaltySettings, refresh: refreshPenaltySettings } = await useVerifixPenalty()
const penaltyOverrides = useStorage<Record<string, number>>('verifix-penalty-overrides', {})

function calculatedPenalty(row: LateRow) {
  return penaltySettings.value
    ? calculateMinutePenalty(row.lateMinutes, penaltySettings.value.penalty_per_minute)
    : 0
}

function penaltyForRow(row: LateRow) {
  const override = penaltyOverrides.value[row.id]

  return typeof override === 'number' && Number.isFinite(override) && override >= 0
    ? override
    : calculatedPenalty(row)
}

function updatePenaltyOverride(row: LateRow, value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) return
  penaltyOverrides.value[row.id] = Math.round(amount * 100) / 100
}

function resetPenaltyOverride(row: LateRow) {
  delete penaltyOverrides.value[row.id]
}

await branchStore.ensureLoaded()

function dateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseEventDate(value: unknown) {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? null : date
}

function getEventDate(event: VerifixEvent) {
  const source = event as VerifixEvent & Record<string, unknown>
  return parseEventDate(
    source.occurred_at
    ?? source.occurredAt
    ?? source.login_at
    ?? source.loginAt
    ?? source.created_at
    ?? source.createdAt
    ?? source.timestamp
  )
}

function getTimeMinutes(value: unknown) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
    ? hours * 60 + minutes
    : null
}

function isLoginEvent(event: VerifixEvent) {
  const type = String(event.event_type || '').trim().toLowerCase()
  return !type || [
    'check_in', 'checkin', 'clock_in', 'clockin', 'entry', 'login', 'sign_in', 'signin'
  ].some(loginType => type === loginType || type.includes(loginType))
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Tashkent', year: 'numeric' }).format(value)
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', hourCycle: 'h23', minute: '2-digit', timeZone: 'Asia/Tashkent' }).format(value)
}

const toDateValue = currentDateInputValue()
const [currentYear, currentMonth] = toDateValue.split('-').map(Number)
const fromDate = ref(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
const toDate = ref(toDateValue)
const selectedBranchId = ref<string>(branchStore.activeBranchId || 'all')
const locationOpen = ref(false)
const locationPending = ref(false)
const locationSubmitting = ref(false)
const locationBranch = ref<{ id: string, name: string } | null>(null)
const locationEvents = ref<LocationEvent[]>([])
const locationHistoryOpen = ref(false)
const locationHistoryPending = ref(false)
const locationHistoryEvents = ref<LocationEvent[]>([])
const mapOpen = ref(false)
const mapEvent = ref<LocationEvent | null>(null)
const mapBranchLocation = ref<BranchLocation | null>(null)
const eventMapElement = ref<HTMLElement | null>(null)
const eventMapInstance = ref<any>(null)
const locationForm = reactive({ latitude: '', longitude: '', radius_meters: 1000, is_enabled: false })

function locationEventDate(event: LocationEvent) {
  return event.created_at || event.createdAt || event.measured_at || event.measuredAt || null
}

function hasValidCoordinates(latitude: unknown, longitude: unknown) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180
}

function hasValidEventCoordinates(event: LocationEvent) {
  return hasValidCoordinates(event.latitude, event.longitude)
}

function locationEventStatusLabel(event: LocationEvent) {
  return event.status === 'inside_radius' ? 'в радиусе' : event.status === 'outside_radius' ? 'вне радиуса' : 'отклонён'
}

watch(() => branchStore.activeBranchId, branchId => {
  selectedBranchId.value = branchId || 'all'
})

async function openLocationModal() {
  if (selectedBranchId.value === 'all') {
    apiClient.notifyError(new Error('Сначала выберите конкретный филиал'))
    return
  }

  const branch = branchStore.branches.find(item => String(item.id) === selectedBranchId.value)
  if (!branch) return

  locationBranch.value = { id: String(branch.id), name: String(branch.name || 'Филиал') }
  locationOpen.value = true
  locationPending.value = true

  try {
    const [locationResponse, eventsResponse] = await Promise.all([
      branchesApi.getLocation(locationBranch.value.id),
      branchesApi.locationEvents({ branch_id: locationBranch.value.id, limit: 20 })
    ])
    const location = locationResponse?.location as BranchLocation | null
    locationForm.latitude = location ? String(location.latitude) : ''
    locationForm.longitude = location ? String(location.longitude) : ''
    locationForm.radius_meters = Number(location?.radius_meters || 1000)
    locationForm.is_enabled = location?.is_enabled === true
    locationEvents.value = Array.isArray(eventsResponse?.items) ? eventsResponse.items : []
  }
  finally {
    locationPending.value = false
  }
}

async function saveLocation() {
  if (!locationBranch.value || locationSubmitting.value) return
  const latitude = Number(locationForm.latitude)
  const longitude = Number(locationForm.longitude)
  const radius = Number(locationForm.radius_meters)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(radius) || radius < 1 || radius > 50000) {
    apiClient.notifyError(new Error('Проверьте координаты и радиус'))
    return
  }

  locationSubmitting.value = true
  try {
    await branchesApi.saveLocation(locationBranch.value.id, { latitude, longitude, radius_meters: radius, is_enabled: locationForm.is_enabled })
    const eventsResponse = await branchesApi.locationEvents({ branch_id: locationBranch.value.id, limit: 20 })
    locationEvents.value = Array.isArray(eventsResponse?.items) ? eventsResponse.items : []
  }
  finally {
    locationSubmitting.value = false
  }
}

async function openLocationHistory() {
  locationHistoryOpen.value = true
  locationHistoryPending.value = true
  try {
    const query: Record<string, unknown> = { limit: 50 }
    if (selectedBranchId.value !== 'all') query.branch_id = selectedBranchId.value
    const response = await branchesApi.locationEvents(query)
    locationHistoryEvents.value = Array.isArray(response?.items) ? response.items : []
  }
  finally {
    locationHistoryPending.value = false
  }
}

async function openEventMap(event: LocationEvent) {
  if (!hasValidEventCoordinates(event)) {
    apiClient.notifyError(new Error('Для этого события координаты недоступны'))
    return
  }

  mapEvent.value = event
  mapBranchLocation.value = null
  if (event.branch_id) {
    try {
      mapBranchLocation.value = (await branchesApi.getLocation(String(event.branch_id)))?.location || null
    }
    catch {
      // The employee location remains useful when branch policy is unavailable.
    }
  }
  locationHistoryOpen.value = false
  locationOpen.value = false
  mapOpen.value = true
}

function eventMapLocation(event: LocationEvent) {
  const branchLocation = mapBranchLocation.value
  return {
    branchLatitude: Number.isFinite(Number(branchLocation?.latitude)) ? Number(branchLocation?.latitude) : Number(event.branch_latitude),
    branchLongitude: Number.isFinite(Number(branchLocation?.longitude)) ? Number(branchLocation?.longitude) : Number(event.branch_longitude),
    radius: Number.isFinite(Number(event.radius_meters)) && Number(event.radius_meters) > 0
      ? Number(event.radius_meters)
      : Number(branchLocation?.radius_meters)
  }
}

function createEventPopup(event: LocationEvent) {
  const content = document.createElement('div')
  content.className = 'space-y-1 text-sm'
  const title = document.createElement('strong')
  title.textContent = event.barber_name || event.barber_id
  const date = document.createElement('div')
  date.textContent = `Событие: ${formatDateTime(locationEventDate(event))}`
  const status = document.createElement('div')
  status.textContent = `Статус: ${locationEventStatusLabel(event)}`
  content.append(title, date, status)
  return content
}

async function initializeEventMap() {
  if (eventMapInstance.value || !mapEvent.value || !eventMapElement.value) return
  const event = mapEvent.value
  const latitude = Number(event.latitude)
  const longitude = Number(event.longitude)
  if (!hasValidCoordinates(latitude, longitude)) return

  try {
    const L = await import('leaflet')
    if (!eventMapElement.value || !mapEvent.value) return
    const map = L.map(eventMapElement.value, { center: [latitude, longitude], zoom: 17, zoomControl: true })
    eventMapInstance.value = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    const employeeMarker = L.marker([latitude, longitude], {
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: 'geocontrol-event-marker',
        html: '<span style="display:block;width:22px;height:22px;border:4px solid white;border-radius:9999px;background:#dc2626;box-shadow:0 2px 8px rgb(0 0 0 / 35%)"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    })
      .bindPopup(createEventPopup(event))
      .addTo(map)
    employeeMarker.openPopup()

    const { branchLatitude, branchLongitude, radius } = eventMapLocation(event)
    if (hasValidCoordinates(branchLatitude, branchLongitude)) {
      L.marker([branchLatitude, branchLongitude], {
        icon: L.divIcon({
          className: 'geocontrol-branch-marker',
          html: '<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:9999px;background:#2563eb;box-shadow:0 2px 8px rgb(0 0 0 / 35%)"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      })
        .bindPopup('Контрольная точка филиала')
        .addTo(map)
      if (Number.isFinite(radius) && radius > 0) {
        L.circle([branchLatitude, branchLongitude], {
          radius,
          color: '#d97706',
          fillColor: '#f59e0b',
          fillOpacity: 0.16,
          weight: 2
        }).bindPopup(`Разрешённый радиус: ${Math.round(radius)} м`).addTo(map)
      }
    }
    requestAnimationFrame(() => map.invalidateSize())
  }
  catch {
    apiClient.notifyError(new Error('Не удалось загрузить карту'))
  }
}

function destroyEventMap() {
  eventMapInstance.value?.remove()
  eventMapInstance.value = null
}

const branchOptions = computed(() => [
  { label: 'Общий', value: 'all' },
  ...branchStore.branches.map(branch => ({
    label: String(branch.name || 'Филиал'),
    value: String(branch.id)
  }))
])

const branchNameMap = computed(() => new Map(
  branchStore.branches.map(branch => [String(branch.id), String(branch.name || 'Филиал')])
))

const { data: verifixData, pending, refresh } = await useAsyncData('verifix-lateness', async () => {
  if (!fromDate.value || !toDate.value) {
    return { employees: [], events: [] as VerifixEvent[], schedules: [] as VerifixSchedule[] }
  }

  const branchIds = selectedBranchId.value === 'all'
    ? branchStore.branches.map(branch => String(branch.id))
    : [selectedBranchId.value]
  const results = await Promise.all(branchIds.map(async (branchId) => {
    const [eventsResponse, schedulesResponse, employeesResponse] = await Promise.all([
      verifixApi.events({ all: true, branch_id: branchId, start_date: fromDate.value, end_date: toDate.value }, { silent: true }),
      verifixApi.schedules({ branch_id: branchId }),
      barbersApi.list({ branch_id: branchId, mode: 'employees' })
    ])

    return {
      employees: Array.isArray(employeesResponse?.items) ? employeesResponse.items : [],
      events: Array.isArray(eventsResponse?.items)
        ? eventsResponse.items.map(event => ({ ...event, branch_id: event.branch_id || branchId }))
        : [],
      schedules: Array.isArray(schedulesResponse?.items) ? schedulesResponse.items : []
    }
  }))

  return {
    employees: results.flatMap(result => result.employees),
    events: results.flatMap(result => result.events),
    schedules: results.flatMap(result => result.schedules)
  }
}, {
  default: () => ({ employees: [], events: [] as VerifixEvent[], schedules: [] as VerifixSchedule[] }),
  server: false,
  watch: [selectedBranchId, fromDate, toDate]
})

async function refreshAll() {
  await Promise.all([refresh(), refreshPenaltySettings()])
}

const employeeNameMap = computed(() => new Map(
  verifixData.value.employees.map(employee => [String(employee.id), String(employee.name || employee.login || `Сотрудник ${employee.id}`)])
))

const schedulesByBranchAndDay = computed(() => {
  const schedules = new Map<string, { graceMinutes: number, isWorking: boolean, startMinutes: number, startTime: string }>()
  for (const schedule of verifixData.value.schedules) {
    const key = `${schedule.branch_id}:${schedule.barber_id || '*'}:${schedule.day_of_week}`
    if (!schedule.is_active || schedules.has(key)) continue
    if (schedule.is_working === false) {
      schedules.set(key, { graceMinutes: 0, isWorking: false, startMinutes: 0, startTime: '' })
      continue
    }
    const startMinutes = getTimeMinutes(schedule.start_time)
    if (startMinutes === null) continue
    schedules.set(key, {
      graceMinutes: Math.max(0, Number(schedule.grace_minutes) || 0),
      isWorking: true,
      startMinutes,
      startTime: String(schedule.start_time).slice(0, 5)
    })
  }
  return schedules
})

const lateRows = computed<LateRow[]>(() => {
  const firstLogins = new Map<string, { barberId: string, branchId: string, loginAt: Date }>()

  for (const event of verifixData.value.events) {
    if (!isLoginEvent(event) || !event.barber_id) continue
    const loginAt = getEventDate(event)
    if (!loginAt) continue

    const barberId = String(event.barber_id)
    const branchId = String(event.branch_id || '')
    if (!branchId) continue

    const key = `${branchId}:${barberId}:${dateInputValue(loginAt)}`
    const current = firstLogins.get(key)
    if (!current || loginAt.getTime() < current.loginAt.getTime()) firstLogins.set(key, { barberId, branchId, loginAt })
  }

  return [...firstLogins.values()].flatMap(({ barberId, branchId, loginAt }) => {
    const dayOfWeek = loginAt.getDay()
    const schedule = schedulesByBranchAndDay.value.get(`${branchId}:${barberId}:${dayOfWeek}`)
      || schedulesByBranchAndDay.value.get(`${branchId}:*:${dayOfWeek}`)
    if (!schedule?.isWorking) return []

    const loginMinutes = loginAt.getHours() * 60 + loginAt.getMinutes()
    const lateMinutes = Math.max(0, loginMinutes - schedule.startMinutes - schedule.graceMinutes)
    if (!lateMinutes) return []

    return [{
      id: `${branchId}:${barberId}:${loginAt.toISOString()}`,
      barberId,
      barberName: employeeNameMap.value.get(barberId) || `Сотрудник ${barberId.slice(0, 6)}`,
      branchId,
      branchName: branchNameMap.value.get(branchId) || 'Филиал',
      date: loginAt,
      lateMinutes,
      loginAt,
      scheduleStart: schedule.startTime
    }]
  }).sort((left, right) => right.loginAt.getTime() - left.loginAt.getTime())
})

const totalLateMinutes = computed(() => lateRows.value.reduce((sum, row) => sum + row.lateMinutes, 0))
const penaltyTotal = computed(() => penaltySettings.value
  ? lateRows.value.reduce((sum, row) => row ? sum + penaltyForRow(row) : sum, 0)
  : null)

const lateEmployeeGroups = computed<LateEmployeeGroup[]>(() => {
  const groups = new Map<string, LateRow[]>()

  for (const row of lateRows.value) {
    const events = groups.get(row.barberId) || []
    events.push(row)
    groups.set(row.barberId, events)
  }

  return [...groups.entries()]
    .map(([barberId, events]) => ({
      barberId,
      barberName: events[0]?.barberName || `Сотрудник ${barberId.slice(0, 6)}`,
      branches: [...new Set(events.map(event => event.branchName))],
      events: events.sort((left, right) => right.loginAt.getTime() - left.loginAt.getTime()),
      lateDays: new Set(events.map(event => dateInputValue(event.date))).size,
      totalLateMinutes: events.reduce((sum, event) => sum + event.lateMinutes, 0),
      totalPenalty: penaltySettings.value
        ? events.reduce((sum, event) => sum + penaltyForRow(event), 0)
        : 0
    }))
    .sort((left, right) => right.totalLateMinutes - left.totalLateMinutes || left.barberName.localeCompare(right.barberName, 'ru'))
})

const lateEmployees = computed(() => lateEmployeeGroups.value.length)
const page = ref(1)
const pageSize = 20
const pageCount = computed(() => Math.max(1, Math.ceil(lateEmployeeGroups.value.length / pageSize)))
const pagedLateEmployees = computed(() => {
  const start = (page.value - 1) * pageSize
  return lateEmployeeGroups.value.slice(start, start + pageSize)
})
const expandedBarbers = ref<Record<string, boolean>>({})

function toggleBarber(barberId: string) {
  expandedBarbers.value[barberId] = !expandedBarbers.value[barberId]
}

watch([lateEmployeeGroups, page], () => {
  if (page.value > pageCount.value) {
    page.value = pageCount.value
  }
})

watch([selectedBranchId, fromDate, toDate, lateRows], () => {
  page.value = 1
  expandedBarbers.value = {}
})

const detailColumns: TableColumn<LateRow>[] = [
  { id: 'date', header: 'Дата опоздания' },
  { accessorKey: 'branchName', header: 'Филиал' },
  { id: 'scheduleStart', header: 'Начало смены' },
  { id: 'loginAt', header: 'Первый вход' },
  { id: 'lateMinutes', header: 'Опоздание' },
  { id: 'penalty', header: 'Штраф' }
]
</script>

<template>
  <UDashboardPanel id="verifix">
    <template #header>
      <UDashboardNavbar title="Verifix">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-5 sm:space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="barbershop-heading text-2xl text-charcoal-950 sm:text-3xl">Verifix</h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-charcoal-500">Опоздания по первому входу сотрудника относительно графика филиала.</p>
          </div>
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <UButton class="w-full sm:w-auto" icon="i-lucide-map" color="primary" @click="openLocationHistory">Карта входов</UButton>
            <UButton class="w-full sm:w-auto" icon="i-lucide-map-pin" color="primary" variant="soft" :disabled="selectedBranchId === 'all'" @click="openLocationModal">Локация филиала</UButton>
            <UButton class="w-full sm:w-auto" icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="pending" @click="refreshAll">Обновить</UButton>
          </div>
        </div>

        <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200 bg-white/90" :ui="{ body: 'p-4 sm:p-6' }">
          <div class="grid gap-4 md:grid-cols-3">
            <label class="flex items-center gap-3">
              <span class="shrink-0 text-sm font-semibold text-charcoal-700">С</span>
              <UInput v-model="fromDate" type="date" size="lg" class="min-w-0 flex-1" :max="toDate" :ui="{ base: 'px-4' }" />
            </label>
            <label class="flex items-center gap-3">
              <span class="shrink-0 text-sm font-semibold text-charcoal-700">По</span>
              <UInput v-model="toDate" type="date" size="lg" class="min-w-0 flex-1" :min="fromDate" :ui="{ base: 'px-4' }" />
            </label>
            <label class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-widest text-charcoal-500">Филиал</span>
              <USelectMenu v-model="selectedBranchId" :items="branchOptions" value-key="value" size="lg" class="w-full" placeholder="Выберите филиал" portal="body" />
            </label>
          </div>
        </UCard>

        <UModal v-model:open="locationHistoryOpen" class="sm:max-w-3xl" title="Локации входов барберов" description="Фактические координаты, полученные при входе в приложение.">
          <template #body>
            <div v-if="locationHistoryPending" class="flex justify-center py-8"><ULoader size="lg" /></div>
            <div v-else-if="locationHistoryEvents.length" class="max-h-[60vh] space-y-2 overflow-y-auto">
              <button v-for="event in locationHistoryEvents" :key="event.id" type="button" class="flex w-full flex-col gap-3 rounded-xl border border-charcoal-200 p-3 text-left text-sm transition hover:bg-charcoal-50/80 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between" :disabled="!hasValidEventCoordinates(event)" @click="openEventMap(event)">
                <div class="min-w-0">
                  <p class="font-semibold text-charcoal-950">{{ event.barber_name || event.barber_id }}</p>
                  <p class="text-charcoal-500">{{ event.branch_name || event.branch_id }} · {{ formatDateTime(locationEventDate(event)) }}</p>
                  <p class="text-charcoal-500">{{ event.distance_meters == null ? 'Расстояние не определено' : `${Math.round(event.distance_meters)} м` }} · {{ locationEventStatusLabel(event) }}</p>
                </div>
                <span v-if="hasValidEventCoordinates(event)" class="shrink-0 text-sm font-semibold text-primary">Открыть карту</span>
                <span v-else class="shrink-0 text-xs text-charcoal-400">Координаты отсутствуют</span>
              </button>
            </div>
            <p v-else class="py-8 text-center text-sm text-charcoal-500">История входов пока пуста.</p>
          </template>
          <template #footer><div class="flex justify-end"><UButton color="neutral" variant="ghost" @click="locationHistoryOpen = false">Закрыть</UButton></div></template>
        </UModal>

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
              <div class="flex justify-end"><UButton :loading="locationSubmitting" icon="i-lucide-save" @click="saveLocation">Сохранить локацию</UButton></div>
              <div class="border-t border-charcoal-200 pt-4">
                <p class="mb-3 text-sm font-semibold text-charcoal-950">История входов</p>
                <div v-if="locationEvents.length" class="space-y-2">
                  <button v-for="event in locationEvents" :key="event.id" type="button" class="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal-200 px-3 py-2 text-left text-sm transition hover:bg-charcoal-50/80 disabled:cursor-not-allowed disabled:opacity-60" :disabled="!hasValidEventCoordinates(event)" @click="openEventMap(event)">
                    <span>{{ event.barber_name || event.barber_id }} · {{ locationEventStatusLabel(event) }}</span>
                    <span class="text-charcoal-500">{{ event.distance_meters == null ? '—' : `${Math.round(event.distance_meters)} м` }} · {{ formatDateTime(locationEventDate(event)) }} · {{ hasValidEventCoordinates(event) ? 'Карта' : 'Координаты отсутствуют' }}</span>
                  </button>
                </div>
                <p v-else class="text-sm text-charcoal-500">Событий входа пока нет.</p>
              </div>
            </div>
          </template>
          <template #footer><div class="flex justify-end"><UButton color="neutral" variant="ghost" @click="locationOpen = false">Закрыть</UButton></div></template>
        </UModal>

        <UModal v-model:open="mapOpen" class="sm:max-w-4xl" title="Место входа барбера" :description="mapEvent ? `${mapEvent.barber_name || mapEvent.barber_id} · ${formatDateTime(locationEventDate(mapEvent))}` : ''" @after:enter="initializeEventMap" @after:leave="destroyEventMap">
          <template #body>
            <div v-if="mapEvent" class="space-y-4">
              <div class="relative h-[min(55vh,30rem)] min-h-80 overflow-hidden rounded-xl border border-charcoal-200 bg-charcoal-50">
                <div ref="eventMapElement" class="absolute inset-0" />
              </div>
              <div class="grid gap-3 text-sm sm:grid-cols-3">
                <div class="rounded-xl bg-primary/5 p-3"><p class="font-semibold text-charcoal-950">Сотрудник</p><p class="text-charcoal-600">{{ mapEvent.barber_name || mapEvent.barber_id }}</p></div>
                <div class="rounded-xl bg-charcoal-50 p-3"><p class="font-semibold text-charcoal-950">Дата и время</p><p class="text-charcoal-600">{{ formatDateTime(locationEventDate(mapEvent)) }}</p></div>
                <div class="rounded-xl bg-charcoal-50 p-3"><p class="font-semibold text-charcoal-950">Геоконтроль</p><p class="text-charcoal-600">{{ locationEventStatusLabel(mapEvent) }}</p></div>
              </div>
              <p class="text-xs text-charcoal-500">Метка показывает фактическое место входа. Контрольная точка и разрешённый радиус отображаются, если они настроены для филиала.</p>
            </div>
          </template>
          <template #footer><div class="flex justify-end"><UButton color="neutral" variant="ghost" @click="mapOpen = false">Закрыть</UButton></div></template>
        </UModal>

        <VerifixPenaltySettings />

        <div class="grid gap-4 sm:grid-cols-4">
          <DashboardMetricCard label="Общая сумма штрафов" icon="i-lucide-coins" :value="penaltyTotal === null ? '—' : formatMoney(penaltyTotal)" />
          <DashboardMetricCard label="Опоздания" icon="i-lucide-circle-alert" :value="String(lateRows.length)" />
          <DashboardMetricCard label="Сотрудники" icon="i-lucide-users" :value="String(lateEmployees)" />
          <DashboardMetricCard label="Всего минут" icon="i-lucide-clock-3" :value="`${totalLateMinutes} мин`" />
        </div>

        <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
          <div v-if="pagedLateEmployees.length" class="divide-y divide-charcoal-100">
            <article v-for="employee in pagedLateEmployees" :key="employee.barberId">
              <button
                type="button"
                class="flex w-full flex-col gap-4 px-4 py-4 text-left transition hover:bg-charcoal-50/80 sm:flex-row sm:items-center sm:px-5"
                :aria-expanded="Boolean(expandedBarbers[employee.barberId])"
                @click="toggleBarber(employee.barberId)"
              >
                <span class="flex min-w-0 flex-1 items-center gap-3">
                  <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UIcon name="i-lucide-user-round" class="size-5" /></span>
                  <span class="min-w-0">
                    <strong class="block truncate text-sm font-semibold text-charcoal-950">{{ employee.barberName }}</strong>
                    <span class="mt-1 flex flex-wrap gap-1">
                      <UBadge v-for="branch in employee.branches" :key="branch" color="neutral" variant="soft" size="xs">{{ branch }}</UBadge>
                    </span>
                  </span>
                </span>
                <span class="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-88">
                  <span class="rounded-xl bg-charcoal-50 px-3 py-2 text-center">
                    <strong class="block text-sm text-charcoal-950">{{ employee.lateDays }}</strong>
                    <span class="text-[11px] text-charcoal-500">дней</span>
                  </span>
                  <span class="rounded-xl bg-red-50 px-3 py-2 text-center">
                    <strong class="block text-sm text-red-700">{{ employee.totalLateMinutes }} мин</strong>
                    <span class="text-[11px] text-red-600">опоздания</span>
                  </span>
                  <span class="rounded-xl bg-charcoal-50 px-3 py-2 text-center">
                    <strong class="block text-sm text-charcoal-950">{{ employee.events.length }}</strong>
                    <span class="text-[11px] text-charcoal-500">случаев</span>
                  </span>
                </span>
                <UIcon name="i-lucide-chevron-down" class="hidden size-5 shrink-0 text-charcoal-400 transition sm:block" :class="expandedBarbers[employee.barberId] ? 'rotate-180' : ''" />
              </button>

              <div v-if="expandedBarbers[employee.barberId]" class="border-t border-charcoal-100 bg-charcoal-50/40 px-3 py-4 sm:px-5">
                <p class="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-500">Дни и детали опозданий</p>
                <div class="overflow-hidden rounded-xl border border-charcoal-200 bg-white">
                  <UTable :columns="detailColumns" :data="employee.events" :ui="{ root: 'w-full overflow-auto', base: 'w-full min-w-[52rem]', thead: 'bg-charcoal-50/90', tbody: 'divide-y divide-charcoal-100', th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-charcoal-500 whitespace-nowrap', td: 'px-4 py-3 text-sm text-charcoal-700 align-middle whitespace-nowrap' }">
                    <template #date-cell="{ row }">{{ formatDate(row.original.date) }}</template>
                    <template #scheduleStart-cell="{ row }">{{ row.original.scheduleStart }}</template>
                    <template #loginAt-cell="{ row }">{{ formatTime(row.original.loginAt) }}</template>
                    <template #penalty-cell="{ row }">
                      <div class="space-y-1">
                        <UInput
                          :model-value="penaltyForRow(row.original)"
                          type="number"
                          min="0"
                          step="0.01"
                          size="sm"
                          class="w-32"
                          @update:model-value="value => updatePenaltyOverride(row.original, value)"
                        />
                        <UButton
                          v-if="penaltyOverrides[row.original.id] !== undefined"
                          size="xs"
                          color="neutral"
                          variant="link"
                          class="px-0"
                          @click="resetPenaltyOverride(row.original)"
                        >Авто</UButton>
                      </div>
                    </template>
                    <template #lateMinutes-cell="{ row }"><UBadge color="error" variant="soft">{{ row.original.lateMinutes }} мин</UBadge></template>
                  </UTable>
                </div>
              </div>
            </article>
          </div>
          <div v-else-if="!pending" class="px-6 py-12 text-center text-sm text-charcoal-500">За выбранный период опозданий не найдено.</div>
          <div v-if="lateEmployeeGroups.length" class="flex flex-col gap-3 border-t border-charcoal-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span class="text-xs text-charcoal-500">
              Показано мастеров {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, lateEmployeeGroups.length) }} из {{ lateEmployeeGroups.length }}
            </span>
            <UPagination v-model:page="page" :total="lateEmployeeGroups.length" :items-per-page="pageSize" size="sm" />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
