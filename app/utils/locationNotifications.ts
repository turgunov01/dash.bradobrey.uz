import type { LocationEvent } from '~/composables/useBranchesApi'

export type LocationWarningReference = { eventId: string, branchId: string | null }

export function getLocationWarningReference(notification: {
  type?: string
  branch_id?: string | null
  data?: Record<string, unknown>
}): LocationWarningReference | null {
  if (notification.type !== 'barber_location_warning') return null
  const eventId = String(notification.data?.event_id || '').trim()
  const branchId = String(notification.branch_id || notification.data?.branch_id || '').trim()
  return eventId ? { eventId, branchId: branchId || null } : null
}

export function findLocationWarningEvent(events: LocationEvent[], reference: LocationWarningReference) {
  // The event's branch is authoritative. Historical notifications may contain a
  // stale branch_id, while the authenticated API already enforces branch scope.
  return events.find(event => String(event.id) === reference.eventId) || null
}
