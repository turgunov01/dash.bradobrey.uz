import { useCalculatorModal } from '#imports'
import type { NavigationMenuItem } from '@nuxt/ui'

export function useDashboardNavigation() {
  const route = useRoute()
  const { openCalculator } = useCalculatorModal()

  const primaryLinks = [[
    { icon: 'i-lucide-layout-dashboard', label: 'Обзор', to: '/' },
    { icon: 'i-lucide-users', label: 'Сотрудники', to: '/barbers' },
    { icon: 'i-lucide-users-round', label: 'Клиенты', to: '/clients' },
    { icon: 'i-lucide-badge-dollar-sign', label: 'Услуги', to: '/services' },
    { icon: 'i-lucide-history', label: 'История', to: '/history' },
    { icon: 'i-lucide-chart-column-big', label: 'Статистика', to: '/statistics' },
    { icon: 'i-lucide-wallet', label: 'Финансы', to: '/finance' },
    { icon: 'i-lucide-ticket-percent', label: 'Промокоды', to: '/promo-codes' },
    { icon: 'i-lucide-id-card', label: 'Сертификаты', to: '/certificates' },
    { icon: 'i-lucide-image-up', label: 'Баннеры маркетплейса', to: '/marketplace/banners' },
    { icon: 'i-lucide-code-xml', label: 'Отладка API', to: '/api-debug' }
  ]] satisfies NavigationMenuItem[][]

  const supportLinks = [[
    { icon: 'i-lucide-heart-pulse', label: 'Проверка API', to: '/api-debug?preset=health' },
    { icon: 'i-lucide-book-open', label: 'Шаблон панели Nuxt UI', target: '_blank', to: 'https://dashboard-template.nuxt.dev/' }
  ]] satisfies NavigationMenuItem[][]

  const searchGroups = computed(() => [
    {
      id: 'dashboard',
      items: primaryLinks.flat(),
      label: 'Панель'
    },
    {
      id: 'tools',
      items: [{
        description: 'Открыть модальный калькулятор для быстрых вычислений',
        icon: 'i-lucide-calculator',
        label: 'Калькулятор',
        onSelect: () => openCalculator()
      }],
      label: 'Инструменты'
    },
    {
      id: 'support',
      items: [
        {
          icon: 'i-lucide-file-code-2',
          label: 'Открыть исходник текущей страницы',
          target: '_blank',
          to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`
        },
        ...supportLinks.flat()
      ],
      label: 'Поддержка'
    }
  ])

  return {
    primaryLinks,
    searchGroups,
    supportLinks
  }
}
