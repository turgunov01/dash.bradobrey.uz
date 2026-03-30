export const employeeRoles = [
  'admin',
  'manager',
  'barber',
  'super-barber',
  'super-manager'
] as const

export const operationalBarberRoles = [
  'barber',
  'super-barber'
] as const

export const dashboardLegacyRoles = [
  'admin_network',
  'admin_branch'
] as const

export const employeePermissions = [
  'dashboard.access',
  'employees.read',
  'employees.create',
  'employees.update',
  'employees.delete',
  'queue.read',
  'queue.manage.self',
  'queue.manage.branch',
  'history.read.self',
  'history.read.branch',
  'statistics.read.self',
  'statistics.read.branch',
  'statistics.read.global',
  'clients.read',
  'services.read',
  'services.manage',
  'promo.manage',
  'certificates.manage',
  'marketplace.manage'
] as const

export type EmployeeRole = typeof employeeRoles[number]
export type OperationalBarberRole = typeof operationalBarberRoles[number]
export type EmployeePermission = typeof employeePermissions[number]

type PermissionDefinition = {
  description: string
  label: string
}

type PermissionSection = {
  items: EmployeePermission[]
  key: string
  label: string
}

export const employeeRoleLabels: Record<EmployeeRole, string> = {
  admin: 'Админ',
  barber: 'Барбер',
  manager: 'Менеджер',
  'super-barber': 'Супер-барбер',
  'super-manager': 'Супер-менеджер'
}

export const employeePermissionDefinitions: Record<EmployeePermission, PermissionDefinition> = {
  'dashboard.access': {
    description: 'Доступ к панели управления и внутренним разделам.',
    label: 'Доступ в панель'
  },
  'employees.read': {
    description: 'Просмотр списка сотрудников и карточек профилей.',
    label: 'Просмотр сотрудников'
  },
  'employees.create': {
    description: 'Создание новых сотрудников.',
    label: 'Создание сотрудников'
  },
  'employees.update': {
    description: 'Редактирование профилей сотрудников.',
    label: 'Редактирование сотрудников'
  },
  'employees.delete': {
    description: 'Удаление сотрудников.',
    label: 'Удаление сотрудников'
  },
  'queue.read': {
    description: 'Просмотр очереди и текущей загрузки.',
    label: 'Просмотр очереди'
  },
  'queue.manage.self': {
    description: 'Управление только своей очередью и рабочим местом.',
    label: 'Управление своей очередью'
  },
  'queue.manage.branch': {
    description: 'Управление очередями филиала.',
    label: 'Управление очередью филиала'
  },
  'history.read.self': {
    description: 'Просмотр своей истории услуг и клиентов.',
    label: 'Своя история'
  },
  'history.read.branch': {
    description: 'Просмотр истории филиала.',
    label: 'История филиала'
  },
  'statistics.read.self': {
    description: 'Просмотр собственной статистики.',
    label: 'Своя статистика'
  },
  'statistics.read.branch': {
    description: 'Просмотр статистики филиала.',
    label: 'Статистика филиала'
  },
  'statistics.read.global': {
    description: 'Просмотр общей статистики по сети.',
    label: 'Глобальная статистика'
  },
  'clients.read': {
    description: 'Просмотр списка клиентов и связанных данных.',
    label: 'Просмотр клиентов'
  },
  'services.read': {
    description: 'Просмотр списка услуг и категорий.',
    label: 'Просмотр услуг'
  },
  'services.manage': {
    description: 'Создание и редактирование услуг.',
    label: 'Управление услугами'
  },
  'promo.manage': {
    description: 'Управление промокодами.',
    label: 'Промокоды'
  },
  'certificates.manage': {
    description: 'Управление сертификатами.',
    label: 'Сертификаты'
  },
  'marketplace.manage': {
    description: 'Управление маркетплейс-баннерами и витриной.',
    label: 'Маркетплейс'
  }
}

export const employeePermissionSections: PermissionSection[] = [
  {
    items: [
      'dashboard.access',
      'employees.read',
      'employees.create',
      'employees.update',
      'employees.delete'
    ],
    key: 'team',
    label: 'Панель и сотрудники'
  },
  {
    items: [
      'queue.read',
      'queue.manage.self',
      'queue.manage.branch',
      'history.read.self',
      'history.read.branch'
    ],
    key: 'operations',
    label: 'Очередь и история'
  },
  {
    items: [
      'statistics.read.self',
      'statistics.read.branch',
      'statistics.read.global',
      'clients.read'
    ],
    key: 'analytics',
    label: 'Аналитика и клиенты'
  },
  {
    items: [
      'services.read',
      'services.manage',
      'promo.manage',
      'certificates.manage',
      'marketplace.manage'
    ],
    key: 'catalog',
    label: 'Каталог и маркетинг'
  }
]

export const employeeRolePermissionPresets: Record<EmployeeRole, EmployeePermission[]> = {
  admin: [...employeePermissions],
  barber: [
    'queue.read',
    'queue.manage.self',
    'history.read.self',
    'statistics.read.self'
  ],
  manager: [
    'dashboard.access',
    'employees.read',
    'queue.read',
    'queue.manage.branch',
    'history.read.branch',
    'statistics.read.branch',
    'clients.read',
    'services.read',
    'services.manage'
  ],
  'super-barber': [
    'queue.read',
    'queue.manage.self',
    'queue.manage.branch',
    'history.read.self',
    'statistics.read.self'
  ],
  'super-manager': [
    'dashboard.access',
    'employees.read',
    'employees.create',
    'employees.update',
    'queue.read',
    'queue.manage.branch',
    'history.read.branch',
    'statistics.read.branch',
    'statistics.read.global',
    'clients.read',
    'services.read',
    'services.manage',
    'promo.manage',
    'certificates.manage',
    'marketplace.manage'
  ]
}

export function isEmployeeRole(value: unknown): value is EmployeeRole {
  return employeeRoles.includes(value as EmployeeRole)
}

export function isEmployeePermission(value: unknown): value is EmployeePermission {
  return employeePermissions.includes(value as EmployeePermission)
}

export function getEmployeeRoleLabel(value: string | null | undefined) {
  if (value && isEmployeeRole(value)) {
    return employeeRoleLabels[value]
  }

  return value ? value : 'Не указана'
}
