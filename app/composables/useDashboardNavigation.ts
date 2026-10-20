import { useCalculatorModal } from "#imports";
import type { NavigationMenuItem } from "@nuxt/ui";
import { getEffectiveEmployeePermissions } from "~~/shared/auth/employees";
import { canAccessPath } from "~/utils/access";

interface NavigationSection {
  label?: string;
  items: NavigationMenuItem[];
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

// Flat, grouped sidebar: each section renders as an uppercase label followed
// by its links (no nested accordions), so every page is one click away.
const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    items: [{ icon: "i-lucide-layout-dashboard", label: "Главная", to: "/" }],
  },
  {
    label: "Люди",
    items: [
      { icon: "i-lucide-users", label: "Сотрудники", to: "/barbers" },
      { icon: "i-lucide-users-round", label: "Клиенты", to: "/clients" },
      { icon: "i-lucide-calendar-clock", label: "Verifix", to: "/verifix" },
    ],
  },
  {
    label: "Операции",
    items: [
      { icon: "i-lucide-store", label: "Филиалы", to: "/branches" },
      { icon: "i-lucide-history", label: "История", to: "/history" },
      { icon: "i-lucide-bell", label: "Уведомления", to: "/notifications" },
    ],
  },
  {
    label: "Каталог",
    items: [
      { icon: "i-lucide-folder-tree", label: "Категории услуг", to: "/service-categories" },
      { icon: "i-lucide-scissors", label: "Услуги", to: "/services" },
    ],
  },
  {
    label: "Склад",
    items: [
      { icon: "i-lucide-box", label: "Позиции", to: "/warehouse/positions" },
      { icon: "i-lucide-layers", label: "Остатки", to: "/warehouse/stocks" },
      { icon: "i-lucide-shopping-cart", label: "Закупки", to: "/warehouse/purchases" },
      { icon: "i-lucide-clipboard-list", label: "Шаблоны", to: "/warehouse/templates" },
      { icon: "i-lucide-folder", label: "Категории склада", to: "/warehouse/categories" },
    ],
  },
  {
    label: "Финансы",
    items: [
      { icon: "i-lucide-wallet", label: "Финансы", to: "/finance" },
      { icon: "i-lucide-receipt", label: "Расходы", to: "/warehouse/expenses" },
      { icon: "i-lucide-badge-dollar-sign", label: "Штрафы", to: "/penalties" },
    ],
  },
  {
    label: "Статистика",
    items: [
      { icon: "i-lucide-clock", label: "История записей", to: "/statistics/history" },
      { icon: "i-lucide-user-round-check", label: "По сотрудникам", to: "/statistics/employees" },
      { icon: "i-lucide-chart-column-big", label: "По филиалу", to: "/statistics/branch" },
    ],
  },
  {
    label: "Маркетплейс",
    items: [
      { icon: "i-lucide-shopping-bag", label: "Обзор", to: "/dashboard/marketplace" },
      { icon: "i-lucide-smartphone", label: "Пользователи приложения", to: "/dashboard/marketplace/users" },
      { icon: "i-lucide-star", label: "Отзывы", to: "/dashboard/marketplace/reviews" },
      { icon: "i-lucide-award", label: "Ранги клиентов", to: "/dashboard/marketplace/loyalty-ranks" },
      { icon: "i-lucide-percent", label: "Кэшбэк", to: "/dashboard/marketplace/cashback" },
      { icon: "i-lucide-user-round-x", label: "Блокировка за неявку", to: "/marketplace/no-show-restrictions" },
      { icon: "i-lucide-ticket-percent", label: "Промокоды", to: "/promo-codes" },
      { icon: "i-lucide-id-card", label: "Сертификаты", to: "/certificates" },
    ],
  },
  {
    label: "Система",
    items: [
      { icon: "i-lucide-tablet-smartphone", label: "Киоски", to: "/settings/kiosks" },
      { icon: "i-lucide-monitor-play", label: "Реклама киоска", to: "/settings/kiosk-ads" },
      { icon: "i-lucide-panels-top-left", label: "Баннеры приложения", to: "/settings/banners" },
      { icon: "i-lucide-bell-ring", label: "Настройки уведомлений", to: "/settings/notifications" },
    ],
  },
];

export function useDashboardNavigation() {
  const sessionStore = useSessionStore();
  const { openCalculator } = useCalculatorModal();

  const permissions = computed(() => new Set(getEffectiveEmployeePermissions(sessionStore.user)));

  // Sections keep only links the current user may open; empty sections vanish.
  const visibleSections = computed(() =>
    NAVIGATION_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        typeof item.to !== "string" || canAccessPath(permissions.value, item.to),
      ),
    })).filter((section) => section.items.length > 0),
  );

  // Expanded sidebar: each labelled section is a collapsible accordion
  // trigger (open by default); unlabelled sections stay top-level links.
  const primaryLinks = computed<NavigationMenuItem[][]>(() => [
    visibleSections.value.flatMap((section) =>
      section.label
        ? [{ label: section.label, defaultOpen: true, children: section.items, class: "nav-section" }]
        : section.items,
    ),
  ]);

  // Collapsed sidebar shows icons only, so sections flatten into one list.
  const flatLinks = computed<NavigationMenuItem[]>(() =>
    visibleSections.value.flatMap((section) => section.items),
  );

  const supportLinks = [[]] satisfies NavigationMenuItem[][];

  const searchGroups = computed(() => [
    ...visibleSections.value.map((section, index) => ({
      id: `nav-${index}`,
      items: section.items.map(toSearchItem),
      label: section.label || "Панель",
    })),
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
  ]);

  return {
    flatLinks,
    primaryLinks,
    searchGroups,
    supportLinks,
  };
}
