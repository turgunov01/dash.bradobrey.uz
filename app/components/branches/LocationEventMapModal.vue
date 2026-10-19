<script setup lang="ts">
import type { BranchLocation, LocationEvent } from '~/composables/useBranchesApi'
import { formatDateTime } from '~/utils/format'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  event: LocationEvent | null
  branchLocation?: BranchLocation | null
  fallbackDate?: string | null
  loading?: boolean
  error?: string
}>()
const open = defineModel<boolean>('open', { default: false })
const mapElement = ref<HTMLElement | null>(null)
const mapInstance = shallowRef<any>(null)
const mapLoading = ref(false)
const api = useApiClient()

function eventDate(event: LocationEvent) {
  return event.created_at || event.createdAt || event.measured_at || event.measuredAt || null
}

function validPoint(latitude: unknown, longitude: unknown) {
  const lat = Number(latitude)
  const lon = Number(longitude)
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180
}

const hasEventCoordinates = computed(() => props.event ? validPoint(props.event.latitude, props.event.longitude) : false)
const branchLatitude = computed(() => props.branchLocation?.latitude ?? props.event?.branch_latitude)
const branchLongitude = computed(() => props.branchLocation?.longitude ?? props.event?.branch_longitude)
const radius = computed(() => props.branchLocation?.radius_meters ?? props.event?.radius_meters)
const hasBranchLocation = computed(() => validPoint(branchLatitude.value, branchLongitude.value))

function statusLabel(event: LocationEvent) {
  return event.status === 'inside_radius' ? 'в радиусе' : event.status === 'outside_radius' ? 'вне радиуса' : 'отклонён'
}

function createPopup(event: LocationEvent) {
  const content = document.createElement('div')
  content.className = 'space-y-1 text-sm'
  const title = document.createElement('strong')
  title.textContent = event.barber_name || event.barber_id
  const date = document.createElement('div')
  date.textContent = `Событие: ${formatDateTime(eventDate(event))}`
  const status = document.createElement('div')
  status.textContent = `Статус: ${statusLabel(event)}`
  content.append(title, date, status)
  return content
}

async function initializeMap() {
  const event = props.event
  if (mapInstance.value || !event || !mapElement.value || !hasEventCoordinates.value) return
  mapLoading.value = true
  try {
    const L = await import('leaflet')
    const latitude = Number(event.latitude)
    const longitude = Number(event.longitude)
    const map = L.map(mapElement.value, { center: [latitude, longitude], zoom: 17, zoomControl: true })
    mapInstance.value = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)
    const markerColor = event.status === 'outside_radius' ? '#dc2626' : event.status === 'inside_radius' ? '#16a34a' : '#64748b'
    L.marker([latitude, longitude], {
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: 'geocontrol-event-marker',
        html: `<span style="display:block;width:22px;height:22px;border:4px solid white;border-radius:9999px;background:${markerColor};box-shadow:0 2px 8px rgb(0 0 0 / 35%)"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).bindPopup(createPopup(event)).addTo(map).openPopup()

    const branchLat = Number(branchLatitude.value)
    const branchLon = Number(branchLongitude.value)
    const allowedRadius = Number(radius.value)
    if (validPoint(branchLat, branchLon)) {
      L.marker([branchLat, branchLon], {
        icon: L.divIcon({
          className: 'geocontrol-branch-marker',
          html: '<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:9999px;background:#2563eb;box-shadow:0 2px 8px rgb(0 0 0 / 35%)"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      }).bindPopup('Контрольная точка филиала').addTo(map)
      if (Number.isFinite(allowedRadius) && allowedRadius > 0) {
        L.circle([branchLat, branchLon], {
          radius: allowedRadius,
          color: '#d97706',
          fillColor: '#f59e0b',
          fillOpacity: 0.16,
          weight: 2
        }).bindPopup(`Разрешённый радиус: ${Math.round(allowedRadius)} м`).addTo(map)
      }
    }
    requestAnimationFrame(() => map.invalidateSize())
  }
  catch {
    api.notifyError(new Error('Не удалось загрузить карту'))
  }
  finally {
    mapLoading.value = false
  }
}

function destroyMap() {
  mapInstance.value?.remove()
  mapInstance.value = null
  mapLoading.value = false
}
</script>

<template>
  <UModal v-model:open="open" class="sm:max-w-4xl" title="Место входа сотрудника" :description="event ? `${event.barber_name || event.barber_id} · ${formatDateTime(eventDate(event))}` : ''" @after:enter="initializeMap" @after:leave="destroyMap">
    <template #body>
      <div v-if="event" class="space-y-4">
        <div v-if="!hasEventCoordinates" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p class="font-semibold">Координаты события отсутствуют</p>
          <p class="mt-1">Для этого входа карта и метка недоступны: в данных события нет корректного местоположения сотрудника.</p>
        </div>
        <div v-else class="relative h-[min(55vh,30rem)] min-h-80 overflow-hidden rounded-xl border border-charcoal-200 bg-charcoal-50">
          <div ref="mapElement" class="absolute inset-0" />
          <div v-if="mapLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70"><ULoader size="lg" /></div>
        </div>
        <div class="grid gap-3 text-sm sm:grid-cols-3">
          <div class="rounded-xl bg-primary/5 p-3"><p class="font-semibold text-charcoal-950">Сотрудник</p><p class="text-charcoal-600">{{ event.barber_name || event.barber_id }}</p></div>
          <div class="rounded-xl bg-charcoal-50 p-3"><p class="font-semibold text-charcoal-950">Дата и время</p><p class="text-charcoal-600">{{ formatDateTime(eventDate(event)) }}</p></div>
          <div class="rounded-xl bg-charcoal-50 p-3"><p class="font-semibold text-charcoal-950">Геоконтроль</p><p class="text-charcoal-600">{{ statusLabel(event) }}</p></div>
        </div>
        <div v-if="!hasBranchLocation" class="rounded-xl border border-charcoal-200 bg-charcoal-50 p-3 text-sm text-charcoal-700">
          <p class="font-semibold text-charcoal-950">Точка филиала не настроена</p>
          <p class="mt-1">Контрольная точка и окружность разрешённого радиуса появятся после сохранения корректных координат филиала.</p>
        </div>
        <p class="text-xs text-charcoal-500">Метка показывает фактическое место входа. Контрольная точка и разрешённый радиус отображаются, если они настроены.</p>
      </div>
      <div v-else-if="loading" class="flex justify-center py-10"><ULoader size="lg" /></div>
      <UAlert v-else-if="error" color="error" variant="soft" icon="i-lucide-triangle-alert" title="Не удалось загрузить событие" :description="error" />
      <div v-if="!event && !loading && fallbackDate" class="mt-3 rounded-xl bg-charcoal-50 p-3 text-sm">
        <p class="font-semibold text-charcoal-950">Дата уведомления</p>
        <p class="text-charcoal-600">{{ formatDateTime(fallbackDate) }}</p>
        <p class="mt-1 text-xs text-charcoal-500">Это время создания уведомления. Данные события входа сейчас недоступны.</p>
      </div>
      <UAlert v-if="!event && !loading && !error && !fallbackDate" color="warning" variant="soft" icon="i-lucide-map-pin-off" title="Событие недоступно" description="Проверьте уведомление и права доступа к филиалу." />
    </template>
    <template #footer><div class="flex justify-end"><UButton color="neutral" variant="ghost" @click="open = false">Закрыть</UButton></div></template>
  </UModal>
</template>
