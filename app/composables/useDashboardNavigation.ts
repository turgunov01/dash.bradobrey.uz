import { useCalculatorModal } from "#imports";
import type { NavigationMenuItem } from "@nuxt/ui";
import { getEffectiveEmployeePermissions } from "~~/shared/auth/employees";
import { canAccessPath } from "~/utils/access";

function flattenNavigationItems(
  items: NavigationMenuItem[],
): NavigationMenuItem[] {
  return items.flatMap((item) => [
    item,
    ...("children" in item && Array.isArray(item.children)
      ? flattenNavigationItems(item.children)
      : []),
  ]);
}

function toSearchItem(item: NavigationMenuItem) {
  const source = item as Record<string, any>;

  return {
    description: source.description,
    icon: source.icon,
    label: source.label,
    onSelect: source.onSelect,
    target: source.target,
    to: source.to,
  };
}

export function useDashboardNavigation() {
  const route = useRoute();
  const sessionStore = useSessionStore();
  const { openCalculator } = useCalculatorModal();

  const rawPrimaryLinks = [
    [
      { icon: "i-lucide-layout-dashboard", label: "Обзор", to: "/" },
      {
        icon: "i-lucide-briefcase-business",
        label: "Управление",
        children: [
          { icon: "i-lucide-users", label: "Сотрудники", to: "/barbers" },
          { icon: "i-lucide-store", label: "Филиалы", to: "/branches" },
          { icon: "i-lucide-users-round", label: "Клиенты", to: "/clients" },
          {
            icon: "i-lucide-warehouse",
            label: "Склад",
            children: [
              {
                icon: "i-lucide-box",
                label: "Позиции",
                to: "/warehouse/positions",
              },
              {
                icon: "i-lucide-layers",
                label: "Остатки",
                to: "/warehouse/stocks",
              },
              {
                icon: "i-lucide-shopping-cart",
                label: "Закупки",
                to: "/warehouse/purchases",
              },
              {
                icon: "i-lucide-clipboard-list",
                label: "Шаблоны",
                to: "/warehouse/templates",
              },
              {
                icon: "i-lucide-folder",
                label: "Категории",
                to: "/warehouse/categories",
              },
            ],
          },
          { icon: "i-lucide-wallet", label: "Финансы", to: "/finance" },
          { icon: "i-lucide-receipt", label: "Расходы", to: "/warehouse/expenses" },
          { icon: "i-lucide-badge-dollar-sign", label: "Штрафы", to: "/penalties" },
          { icon: "i-lucide-calendar-clock", label: "Verifix", to: "/verifix" },
        ],
      },
      {
        icon: "i-lucide-folder-tree",
        label: "Каталог",
        children: [
          {
            icon: "i-lucide-folder",
            label: "Категории",
            to: "/service-categories",
          },
          {
            icon: "i-lucide-badge-dollar-sign",
            label: "Услуги",
            to: "/services",
          },
        ],
      },
      { icon: "i-lucide-history", label: "История", to: "/history" },
      { icon: "i-lucide-bell", label: "Уведомления", to: "/notifications" },
      {
        icon: "i-lucide-chart-column-big",
        label: "Статистика",
        children: [
          {
            icon: "i-lucide-clock",
            label: "История записей",
            to: "/statistics/history",
          },
          {
            icon: "i-lucide-users",
            label: "Сотрудники",
            to: "/statistics/employees",
          },
        ],
      },
      {
        icon: "i-lucide-shopping-bag",
        label: "Маркетплейс",
        children: [
          {
            icon: "i-lucide-store",
            label: "Обзор",
            to: "/dashboard/marketplace",
          },
          {
            icon: "i-lucide-users-round",
            label: "Пользователи приложения",
            to: "/dashboard/marketplace/users",
          },
          {
            icon: "i-lucide-star",
            label: "Отзывы",
            to: "/dashboard/marketplace/reviews",
          },
          { icon: "i-lucide-award", label: "Ранги клиентов", to: "/dashboard/marketplace/loyalty-ranks" },
          { icon: "i-lucide-percent", label: "Кэшбэк", to: "/dashboard/marketplace/cashback" },
          {
            icon: "i-lucide-ticket-percent",
            label: "Промокоды",
            to: "/promo-codes",
          },
          {
            icon: "i-lucide-id-card",
            label: "Сертификаты",
            to: "/certificates",
          },
        ],
      },
      {
        icon: "i-lucide-settings",
        label: "Настройки",
        children: [
          {
            icon: "i-lucide-monitor-play",
            label: "Реклама киоска",
            to: "/settings/kiosk-ads",
          },
          {
            icon: "i-lucide-panels-top-left",
            label: "Баннеры приложения",
            to: "/settings/banners",
          },
          {
            icon: "i-lucide-bell-ring",
            label: "Уведомления",
            to: "/settings/notifications",
          },
        ],
      },
    ],
  ] satisfies NavigationMenuItem[][];

  const permissions = computed(() => new Set(getEffectiveEmployeePermissions(sessionStore.user)));

  function filterAccessibleLinks(items: NavigationMenuItem[]): NavigationMenuItem[] {
    return items.flatMap((item) => {
      const source = item as NavigationMenuItem & { children?: NavigationMenuItem[] };

      if (typeof source.to === 'string' && !canAccessPath(permissions.value, source.to)) {
        return [];
      }

      if (Array.isArray(source.children)) {
        const children = filterAccessibleLinks(source.children);

        return children.length ? [{ ...source, children }] : [];
      }

      return [item];
    });
  }

  const primaryLinks = computed(() => rawPrimaryLinks.map(group => filterAccessibleLinks(group)));

  const supportLinks = [[]] satisfies NavigationMenuItem[][];

  const searchGroups = computed(() => [
    {
      id: "dashboard",
      items: flattenNavigationItems(primaryLinks.value.flat())
        .filter((item) => Boolean((item as any).to || (item as any).onSelect))
        .map(toSearchItem),
      label: "Панель",
    },
    {
      id: "tools",
      items: [
        {
          description: "Открыть модальный калькулятор для быстрых вычислений",
          icon: "i-lucide-calculator",
          label: "Калькулятор",
          onSelect: () => openCalculator(),
        },
      ],
      label: "Инструменты",
    },
    {
      id: "support",
      items: [
        {
          icon: "i-lucide-file-code-2",
          label: "Открыть исходник текущей страницы",
          target: "_blank",
          to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === "/" ? "/index" : route.path}.vue`,
        },
        ...supportLinks.flat(),
      ],
      label: "Поддержка",
    },
  ]);

  return {
    primaryLinks,
    searchGroups,
    supportLinks,
  };
}
