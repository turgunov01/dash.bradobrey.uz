globalThis.__timing__.logStart('Load chunks/build/index-DgLCkW4_');import { _ as _sfc_main$2, a as _sfc_main$1, b as _sfc_main$5 } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { _ as _sfc_main$4 } from './Badge-CKFwwagy.mjs';
import { f as useSessionStore, g as useUiStore, a as useBarbersApi, b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a } from './server.mjs';
import { _ as __nuxt_component_5 } from './MetricCard-CDSLylAv.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, withCtx, unref, createVNode, openBlock, createBlock, Fragment, renderList, toDisplayString, createTextVNode, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderStyle } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { b as formatCount } from './format-DDcTL-sj.mjs';
import { u as useStatisticsApi, p as pickValue, t as toKeyLabel, a as asNumber } from './useStatisticsApi-D5PxREFa.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import { u as usePromoApi } from './usePromoApi-DE1sz-6g.mjs';
import { u as useRealtimeQueue } from './useRealtimeQueue-CK9yRiyf.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
import './index-qsfWWCYt.mjs';
import '../_/nitro.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/zod/index.js';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/utils/lib/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/consola/dist/index.mjs';
import 'node:fs';
import 'node:path';
import 'file://D:/projects/bradobrey-dashboard/node_modules/pinia/dist/pinia.prod.cjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-router/vue-router.node.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/perfect-debounce/dist/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@vue/shared/dist/shared.cjs.prod.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwindcss/dist/colors.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/vue/dist/iconify.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwind-variants/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/utils/lib/css/icon.js';
import '../routes/renderer.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/server.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/devalue/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/plugins.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/utils.mjs';
import '../_/index.mjs';
import './useKioskApi-l3XfHmhL.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const branchStore = useBranchStore();
    const sessionStore = useSessionStore();
    const uiStore = useUiStore();
    const barbersApi = useBarbersApi();
    const promoApi = usePromoApi();
    const statisticsApi = useStatisticsApi();
    useRealtimeQueue();
    [__temp, __restore] = withAsyncContext(() => Promise.all([
      branchStore.ensureLoaded(),
      sessionStore.ensureLoaded()
    ])), await __temp, __restore();
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("overview-dashboard", async () => {
      const [health, queue, promoDashboard, statistics] = await Promise.all([
        $fetch("/api/health"),
        sessionStore.barber?.id ? barbersApi.queue() : Promise.resolve({ count: 0, items: [] }),
        promoApi.dashboard(),
        statisticsApi.global({
          end_date: uiStore.statisticsRange.end,
          start_date: uiStore.statisticsRange.start
        })
      ]);
      return {
        health,
        promoDashboard,
        queue,
        statistics
      };
    }, {
      watch: [() => uiStore.statisticsRange.end, () => uiStore.statisticsRange.start]
    })), __temp = await __temp, __restore(), __temp);
    const promoItems = computed(() => {
      const dashboard = data.value?.promoDashboard;
      if (Array.isArray(dashboard)) {
        return dashboard;
      }
      if (Array.isArray(dashboard?.items)) {
        return dashboard.items;
      }
      return [];
    });
    computed(
      () => branchStore.branches.map((branch) => ({
        id: branch.id,
        isActive: branch.id === branchStore.activeBranchId,
        name: branch.name
      }))
    );
    const statisticsHighlights = computed(() => {
      const payload = data.value?.statistics || {};
      const desired = [
        pickValue(payload, ["revenue", "total_revenue", "amount", "total_amount"], "0"),
        pickValue(payload, ["orders", "queue_count", "total_clients", "count"], "0"),
        pickValue(payload, ["completed", "completed_orders", "done"], "0")
      ];
      return [
        {
          description: "Итог по всей системе за выбранный период",
          icon: "i-lucide-wallet",
          label: "Выручка",
          value: desired[0] ?? "0"
        },
        {
          description: "Объем очереди по данным аналитики",
          icon: "i-lucide-users-round",
          label: "Заказы",
          value: desired[1] ?? "0"
        },
        {
          description: "Количество завершенных записей в аналитике",
          icon: "i-lucide-check-check",
          label: "Завершено",
          value: desired[2] ?? "0"
        }
      ];
    });
    const statRows = computed(
      () => Object.entries(data.value?.statistics || {}).filter(([, value]) => ["number", "string"].includes(typeof value)).slice(0, 8)
    );
    computed(
      () => [
        // sessionStore.barber?.id
        //   ? { description: 'Управление очередью и перерывами барбера', icon: 'i-lucide-scissors-line-dashed', title: 'Рабочее место', to: '/barbers/workspace' }
        //   : null,
        { description: "Создание записей через киоск и проверка сценариев филиала", icon: "i-lucide-monitor-smartphone", title: "Киоск", to: "/kiosk" },
        { description: "Управление сгруппированным каталогом услуг", icon: "i-lucide-badge-dollar-sign", title: "Услуги", to: "/services" },
        { description: "Просмотр всех запросов и ответов через Nuxt", icon: "i-lucide-code-xml", title: "Отладка API", to: "/api-debug" }
      ].filter((shortcut) => Boolean(shortcut))
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$5;
      const _component_UBadge = _sfc_main$4;
      const _component_UButton = _sfc_main$a;
      const _component_DashboardMetricCard = __nuxt_component_5;
      const _component_UCard = _sfc_main$3;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "overview" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Обзор",
              ui: { right: "gap-3" }
            }, {
              leading: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UDashboardSidebarCollapse, null, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UDashboardSidebarCollapse)
                  ];
                }
              }),
              right: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: unref(data)?.health ? "primary" : "neutral",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(data)?.health ? "API доступен" : "Проверка API")}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(data)?.health ? "API доступен" : "Проверка API"), 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-refresh-cw",
                    loading: unref(pending),
                    variant: "outline",
                    onClick: ($event) => unref(refresh)()
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Обновить `);
                      } else {
                        return [
                          createTextVNode(" Обновить ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UBadge, {
                      color: unref(data)?.health ? "primary" : "neutral",
                      variant: "soft"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(data)?.health ? "API доступен" : "Проверка API"), 1)
                      ]),
                      _: 1
                    }, 8, ["color"]),
                    createVNode(_component_UButton, {
                      color: "neutral",
                      icon: "i-lucide-refresh-cw",
                      loading: unref(pending),
                      variant: "outline",
                      onClick: ($event) => unref(refresh)()
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Обновить ")
                      ]),
                      _: 1
                    }, 8, ["loading", "onClick"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UDashboardNavbar, {
                title: "Обзор",
                ui: { right: "gap-3" }
              }, {
                leading: withCtx(() => [
                  createVNode(_component_UDashboardSidebarCollapse)
                ]),
                right: withCtx(() => [
                  createVNode(_component_UBadge, {
                    color: unref(data)?.health ? "primary" : "neutral",
                    variant: "soft"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(data)?.health ? "API доступен" : "Проверка API"), 1)
                    ]),
                    _: 1
                  }, 8, ["color"]),
                  createVNode(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-refresh-cw",
                    loading: unref(pending),
                    variant: "outline",
                    onClick: ($event) => unref(refresh)()
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Обновить ")
                    ]),
                    _: 1
                  }, 8, ["loading", "onClick"])
                ]),
                _: 1
              })
            ];
          }
        }),
        body: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Текущие записи очереди, назначенные авторизованному барберу.",
              icon: "i-lucide-clock-3",
              label: "Активная очередь",
              value: unref(formatCount)(unref(data)?.queue?.count)
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Филиалы, загруженные из конфигурации киоска.",
              icon: "i-lucide-map",
              label: "Филиалы",
              value: unref(formatCount)(unref(branchStore).branches.length)
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Промокоды, полученные с панели управления.",
              icon: "i-lucide-ticket-percent",
              label: "Промокоды",
              value: unref(formatCount)(unref(promoItems).length)
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Состояние основного health-эндпоинта.",
              icon: "i-lucide-heart-pulse",
              label: "Состояние",
              value: unref(data)?.health ? "OK" : "В ожидании"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="grid gap-6 xl:grid-cols-[1]"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Пульс салона </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Быстрая операционная сводка </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Пульс салона "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Быстрая операционная сводка ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="grid gap-4 md:grid-cols-3"${_scopeId2}><!--[-->`);
                  ssrRenderList(unref(statisticsHighlights), (card) => {
                    _push3(ssrRenderComponent(_component_DashboardMetricCard, {
                      key: card.label,
                      description: card.description,
                      icon: card.icon,
                      label: card.label,
                      value: card.value
                    }, null, _parent3, _scopeId2));
                  });
                  _push3(`<!--]--></div><div class="mt-6 grid gap-3"${_scopeId2}><!--[-->`);
                  ssrRenderList(unref(statRows), ([key, value]) => {
                    _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-center justify-between gap-4"${_scopeId2}><span class="text-sm font-medium text-charcoal-700"${_scopeId2}>${ssrInterpolate(unref(toKeyLabel)(key))}</span><span class="text-sm font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(value)}</span></div><div class="mt-3 h-2 rounded-full bg-sand-100"${_scopeId2}><div class="h-full rounded-full bg-brass-400" style="${ssrRenderStyle({ width: `${Math.min(unref(asNumber)(value, 0), 100)}%` })}"${_scopeId2}></div></div></div>`);
                  });
                  _push3(`<!--]--></div>`);
                } else {
                  return [
                    createVNode("div", { class: "grid gap-4 md:grid-cols-3" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(statisticsHighlights), (card) => {
                        return openBlock(), createBlock(_component_DashboardMetricCard, {
                          key: card.label,
                          description: card.description,
                          icon: card.icon,
                          label: card.label,
                          value: card.value
                        }, null, 8, ["description", "icon", "label", "value"]);
                      }), 128))
                    ]),
                    createVNode("div", { class: "mt-6 grid gap-3" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(statRows), ([key, value]) => {
                        return openBlock(), createBlock("div", {
                          key,
                          class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                        }, [
                          createVNode("div", { class: "flex items-center justify-between gap-4" }, [
                            createVNode("span", { class: "text-sm font-medium text-charcoal-700" }, toDisplayString(unref(toKeyLabel)(key)), 1),
                            createVNode("span", { class: "text-sm font-semibold text-charcoal-950" }, toDisplayString(value), 1)
                          ]),
                          createVNode("div", { class: "mt-3 h-2 rounded-full bg-sand-100" }, [
                            createVNode("div", {
                              class: "h-full rounded-full bg-brass-400",
                              style: { width: `${Math.min(unref(asNumber)(value, 0), 100)}%` }
                            }, null, 4)
                          ])
                        ]);
                      }), 128))
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<div class="space-y-6"${_scopeId}></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "grid gap-4 xl:grid-cols-4 md:grid-cols-2" }, [
                  createVNode(_component_DashboardMetricCard, {
                    description: "Текущие записи очереди, назначенные авторизованному барберу.",
                    icon: "i-lucide-clock-3",
                    label: "Активная очередь",
                    value: unref(formatCount)(unref(data)?.queue?.count)
                  }, null, 8, ["value"]),
                  createVNode(_component_DashboardMetricCard, {
                    description: "Филиалы, загруженные из конфигурации киоска.",
                    icon: "i-lucide-map",
                    label: "Филиалы",
                    value: unref(formatCount)(unref(branchStore).branches.length)
                  }, null, 8, ["value"]),
                  createVNode(_component_DashboardMetricCard, {
                    description: "Промокоды, полученные с панели управления.",
                    icon: "i-lucide-ticket-percent",
                    label: "Промокоды",
                    value: unref(formatCount)(unref(promoItems).length)
                  }, null, 8, ["value"]),
                  createVNode(_component_DashboardMetricCard, {
                    description: "Состояние основного health-эндпоинта.",
                    icon: "i-lucide-heart-pulse",
                    label: "Состояние",
                    value: unref(data)?.health ? "OK" : "В ожидании"
                  }, null, 8, ["value"])
                ]),
                createVNode("div", { class: "grid gap-6 xl:grid-cols-[1]" }, [
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Пульс салона "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Быстрая операционная сводка ")
                      ])
                    ]),
                    default: withCtx(() => [
                      createVNode("div", { class: "grid gap-4 md:grid-cols-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(statisticsHighlights), (card) => {
                          return openBlock(), createBlock(_component_DashboardMetricCard, {
                            key: card.label,
                            description: card.description,
                            icon: card.icon,
                            label: card.label,
                            value: card.value
                          }, null, 8, ["description", "icon", "label", "value"]);
                        }), 128))
                      ]),
                      createVNode("div", { class: "mt-6 grid gap-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(statRows), ([key, value]) => {
                          return openBlock(), createBlock("div", {
                            key,
                            class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-center justify-between gap-4" }, [
                              createVNode("span", { class: "text-sm font-medium text-charcoal-700" }, toDisplayString(unref(toKeyLabel)(key)), 1),
                              createVNode("span", { class: "text-sm font-semibold text-charcoal-950" }, toDisplayString(value), 1)
                            ]),
                            createVNode("div", { class: "mt-3 h-2 rounded-full bg-sand-100" }, [
                              createVNode("div", {
                                class: "h-full rounded-full bg-brass-400",
                                style: { width: `${Math.min(unref(asNumber)(value, 0), 100)}%` }
                              }, null, 4)
                            ])
                          ]);
                        }), 128))
                      ])
                    ]),
                    _: 1
                  }),
                  createVNode("div", { class: "space-y-6" })
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/index-DgLCkW4_');
//# sourceMappingURL=index-DgLCkW4_.mjs.map
