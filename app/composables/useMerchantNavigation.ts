import type { NavigationMenuItem } from '@nuxt/ui'

export function useMerchantNavigation() {
  const route = useRoute()

  const primaryLinks = [[
    { icon: 'i-lucide-house', label: 'Главная', to: '/merchant' },
    { icon: 'i-lucide-building-2', label: 'Филиалы', to: '/merchant/branches' },
    { icon: 'i-lucide-scissors', label: 'Барберы', to: '/merchant/barbers' },
    { icon: 'i-lucide-folder', label: 'Категории', to: '/merchant/categories' },
    { icon: 'i-lucide-tags', label: 'Услуги', to: '/merchant/services' },
    { icon: 'i-lucide-history', label: 'История', to: '/merchant/history' }
  ]] satisfies NavigationMenuItem[][]

  const supportLinks: NavigationMenuItem[][] = [[]]

  const searchGroups = computed(() => [
    {
      id: 'merchant',
      items: primaryLinks.flat(),
      label: 'Кабинет мерчанта'
    },
    {
      id: 'support',
      items: [
        {
          icon: 'i-lucide-file-code-2',
          label: 'Открыть исходник страницы',
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
