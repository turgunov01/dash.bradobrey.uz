import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { findLocationWarningEvent, getLocationWarningReference } from '../app/utils/locationNotifications.ts'

const notificationsPage = readFileSync(new URL('../app/pages/notifications.vue', import.meta.url), 'utf8')
const eventModal = readFileSync(new URL('../app/components/branches/LocationEventMapModal.vue', import.meta.url), 'utf8')
const branchesPage = readFileSync(new URL('../app/pages/branches.vue', import.meta.url), 'utf8')

test('location warning opens an event reference from the selected notification', () => {
  const reference = getLocationWarningReference({
    type: 'barber_location_warning',
    branch_id: 'branch-2',
    data: { barber_id: 'barber-9', event_id: 'event-31' }
  })
  assert.deepEqual(reference, { branchId: 'branch-2', eventId: 'event-31' })
  assert.deepEqual(getLocationWarningReference({ type: 'barber_location_warning', data: { event_id: 'event-32' } }), { branchId: null, eventId: 'event-32' })
  assert.match(notificationsPage, /branchesApi\.locationEvents\(\{ event_id: reference\.eventId, limit: 1 \}\)/)
  assert.match(notificationsPage, /findLocationWarningEvent\(response\?\.items \|\| \[\], reference\)/)
  assert.match(notificationsPage, /@click="openNotification\(item\)"/)
})

test('event matching is exact by ID and trusts the authorized API for event branch scope', () => {
  const reference = { branchId: 'branch-2', eventId: 'event-31' }
  const events = [
    { id: 'event-30', branch_id: 'branch-2', status: 'outside_radius' },
    { id: 'event-31', branch_id: 'branch-1', status: 'outside_radius' },
    { id: 'event-31', branch_id: 'branch-2', status: 'outside_radius' }
  ] as any
  assert.equal(findLocationWarningEvent(events, reference), events[1])
  assert.equal(findLocationWarningEvent(events.slice(0, 1), reference), null)
})

test('other notification types keep their existing open behavior and geolocation modal stays on the list page', () => {
  assert.equal(getLocationWarningReference({ type: 'suspicious_order', data: { event_id: 'event-31' }, branch_id: 'branch-2' }), null)
  assert.match(notificationsPage, /if \(!reference && item\.type !== 'barber_location_warning'\) return/)
  assert.match(notificationsPage, /<BranchesLocationEventMapModal/)
  assert.doesNotMatch(notificationsPage, /router\.push\(.*location/i)
  assert.match(notificationsPage, /@click="openNotification\(item\)"/)
})

test('shared event modal displays event metadata and uses only event coordinates and configured branch radius', () => {
  assert.match(eventModal, /event\.barber_name \|\| event\.barber_id/)
  assert.match(eventModal, /formatDateTime\(eventDate\(event\)\)/)
  assert.match(eventModal, /statusLabel\(event\)/)
  assert.match(eventModal, /if \(mapInstance\.value \|\| !event \|\| !mapElement\.value \|\| !hasEventCoordinates\.value\) return/)
  assert.match(eventModal, /center: \[latitude, longitude\]/)
  assert.match(eventModal, /L\.circle\(\[branchLat, branchLon\], \{\s*radius: allowedRadius/s)
  assert.match(eventModal, /Координаты события отсутствуют/)
  assert.match(eventModal, /Дата уведомления/)
  assert.match(notificationsPage, /branchesApi\.getLocation\(event\.branch_id\)/)
  assert.match(notificationsPage, /:branch-location="locationBranch"/)
})

test('branches page continues using the same location event modal', () => {
  assert.match(branchesPage, /<BranchesLocationEventMapModal v-model:open="eventMapOpen"/)
  assert.match(branchesPage, /function openEventMap\(event: LocationEvent\)/)
})
