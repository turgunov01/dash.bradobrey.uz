import type { NavigationMenuItem } from '@nuxt/ui'

export function useMerchantNavigation() {
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
    }
  ])

  return {
    primaryLinks,
    searchGroups,
    supportLinks
  }
}
