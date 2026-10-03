import type { EmployeePermission } from '../../shared/auth/employees.ts'

// Карта прав, необходимых для разделов
export const routePermissions: Record<string, EmployeePermission[]> = {
  '/': ['dashboard.access', 'statistics.read.branch', 'statistics.read.global'],
  '/barbers/workspace': ['queue.read'],
  '/barbers/queue': ['queue.read'],
  '/barbers/expenses': ['expenses.read'],
  '/barbers': ['employees.read'],
  '/branches': ['dashboard.access'],
  '/clients': ['clients.read'],
  '/services': ['services.read'],
  '/service-categories': ['services.read'],
  '/history': ['history.read.self', 'history.read.branch'],
  '/statistics': ['statistics.read.self', 'statistics.read.branch', 'statistics.read.global'],
  '/finance': ['dashboard.access', 'statistics.read.branch', 'statistics.read.global'],
  '/promo-codes': ['promo.manage'],
  '/certificates': ['certificates.manage'],
  '/warehouse': ['dashboard.access'],
  '/warehouse/expenses': ['expenses.read'],
  '/penalties': ['penalties.read'],
  '/verifix': ['penalties.read'],
  '/kiosk': ['dashboard.access'],
  '/notifications': ['dashboard.access'],
  '/dashboard/marketplace': ['dashboard.access'],
  '/content': ['dashboard.access'], // локальная страница контента
  '/settings': ['dashboard.access'],
  '/api-debug': ['dashboard.access'] // дополнительно ограничим ролью в middleware
}

export function requiredForPath(path: string): EmployeePermission[] | undefined {
  const entries = Object.entries(routePermissions).sort(([left], [right]) => right.length - left.length)
  for (const [prefix, perms] of entries) {
    if (path === prefix || path.startsWith(prefix + '/')) return perms
  }
  return undefined
}

export function canAccessPath(permsSet: Set<EmployeePermission>, path: string): boolean {
  const required = requiredForPath(path)
  if (!required) return true
  return required.some(p => permsSet.has(p))
}

export function firstAllowedPath(permsSet: Set<EmployeePermission>): string | null {
  const ordered = Object.keys(routePermissions)
  for (const path of ordered) {
    if (canAccessPath(permsSet, path)) return path
  }
  return null
}
