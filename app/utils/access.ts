import type { EmployeePermission } from '~~/shared/auth/employees'

// Карта прав, необходимых для разделов
export const routePermissions: Record<string, EmployeePermission[]> = {
  '/': ['dashboard.access', 'statistics.read.self', 'statistics.read.branch', 'statistics.read.global'],
  '/barbers': ['employees.read', 'employees.create', 'employees.update', 'employees.delete'],
  '/clients': ['clients.read'],
  '/services': ['services.read', 'services.manage'],
  '/history': ['history.read.self', 'history.read.branch'],
  '/statistics': ['statistics.read.self', 'statistics.read.branch', 'statistics.read.global'],
  '/promo-codes': ['promo.manage'],
  '/certificates': ['certificates.manage'],
  '/marketplace/banners': ['marketplace.manage'],
  '/content': ['dashboard.access'], // локальная страница контента
  '/api-debug': ['dashboard.access'] // дополнительно ограничим ролью в middleware
}

export function requiredForPath(path: string): EmployeePermission[] | undefined {
  const entries = Object.entries(routePermissions)
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
