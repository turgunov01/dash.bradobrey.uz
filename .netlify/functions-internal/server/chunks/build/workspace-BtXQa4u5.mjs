globalThis.__timing__.logStart('Load chunks/build/workspace-BtXQa4u5');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$7 } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { _ as _sfc_main$6 } from './Badge-CKFwwagy.mjs';
import { f as useSessionStore, a as useBarbersApi, b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a, _ as _sfc_main$2$1, n as navigateTo } from './server.mjs';
import { _ as __nuxt_component_5 } from './MetricCard-CDSLylAv.mjs';
import { _ as _sfc_main$4 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$5 } from './Input-BrToCniw.mjs';
import { _ as _sfc_main$8 } from './Table-2pT4H1Ma.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-DWE-z1MU.mjs';
import { defineComponent, ref, withAsyncContext, mergeProps, withCtx, unref, isRef, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate, ssrRenderAttrs } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { a as formatMoney } from './format-DDcTL-sj.mjs';
import { f as formatPaymentMethod } from './display-CyQec-Wd.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
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
import 'file://D:/projects/bradobrey-dashboard/node_modules/@tanstack/vue-table/build/lib/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@tanstack/vue-virtual/dist/esm/index.js';
import './branch-nC1tN9Zp.mjs';
import '../_/index.mjs';
import './useKioskApi-l3XfHmhL.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "QueueTable",
  __ssrInlineRender: true,
  props: {
    items: {},
    loading: { type: Boolean }
  },
  emits: ["call", "complete", "open", "start"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const columns = [
      { accessorKey: "customer_name", header: "Клиент" },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "payment_method", header: "Оплата" },
      { accessorKey: "amount", header: "Сумма" },
      { id: "actions", header: "" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UTable = _sfc_main$8;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_UButton = _sfc_main$a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-hidden rounded-[1.5rem] border border-charcoal-200 bg-white/90" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_UTable, {
        columns,
        data: props.items,
        loading: props.loading,
        sticky: "header",
        ui: {
          root: "max-h-[32rem] overflow-auto",
          base: "min-w-[52rem]",
          thead: "bg-charcoal-50/90",
          tbody: "divide-y divide-charcoal-100",
          th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
          td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
        }
      }, {
        "customer_name-cell": withCtx(({ row }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-1"${_scopeId}><p class="font-medium text-charcoal-950"${_scopeId}>${ssrInterpolate(row.original.customer_name || "Клиент без записи")}</p><p class="text-xs text-charcoal-500"${_scopeId}>${ssrInterpolate(row.original.phone_number || "Телефон не указан")}</p></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-1" }, [
                createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.customer_name || "Клиент без записи"), 1),
                createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.phone_number || "Телефон не указан"), 1)
              ])
            ];
          }
        }),
        "status-cell": withCtx(({ row }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_SharedStatusBadge, {
              label: row.original.status
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_SharedStatusBadge, {
                label: row.original.status
              }, null, 8, ["label"])
            ];
          }
        }),
        "payment_method-cell": withCtx(({ row }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span${_scopeId}>${ssrInterpolate(unref(formatPaymentMethod)(row.original.payment_method))}</span>`);
          } else {
            return [
              createVNode("span", null, toDisplayString(unref(formatPaymentMethod)(row.original.payment_method)), 1)
            ];
          }
        }),
        "amount-cell": withCtx(({ row }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="font-medium"${_scopeId}>${ssrInterpolate(unref(formatMoney)(row.original.amount))}</span>`);
          } else {
            return [
              createVNode("span", { class: "font-medium" }, toDisplayString(unref(formatMoney)(row.original.amount)), 1)
            ];
          }
        }),
        "actions-cell": withCtx(({ row }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex flex-wrap justify-end gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UButton, {
              color: "neutral",
              size: "xs",
              variant: "outline",
              onClick: ($event) => emit("open", row.original)
            }, {
              default: withCtx((_, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Открыть `);
                } else {
                  return [
                    createTextVNode(" Открыть ")
                  ];
                }
              }),
              _: 2
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UButton, {
              color: "neutral",
              size: "xs",
              variant: "outline",
              onClick: ($event) => emit("call", row.original)
            }, {
              default: withCtx((_, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Вызвать `);
                } else {
                  return [
                    createTextVNode(" Вызвать ")
                  ];
                }
              }),
              _: 2
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UButton, {
              color: "primary",
              size: "xs",
              variant: "outline",
              onClick: ($event) => emit("start", row.original)
            }, {
              default: withCtx((_, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Начать `);
                } else {
                  return [
                    createTextVNode(" Начать ")
                  ];
                }
              }),
              _: 2
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UButton, {
              color: "primary",
              size: "xs",
              onClick: ($event) => emit("complete", row.original)
            }, {
              default: withCtx((_, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Завершить `);
                } else {
                  return [
                    createTextVNode(" Завершить ")
                  ];
                }
              }),
              _: 2
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex flex-wrap justify-end gap-2" }, [
                createVNode(_component_UButton, {
                  color: "neutral",
                  size: "xs",
                  variant: "outline",
                  onClick: ($event) => emit("open", row.original)
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Открыть ")
                  ]),
                  _: 1
                }, 8, ["onClick"]),
                createVNode(_component_UButton, {
                  color: "neutral",
                  size: "xs",
                  variant: "outline",
                  onClick: ($event) => emit("call", row.original)
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Вызвать ")
                  ]),
                  _: 1
                }, 8, ["onClick"]),
                createVNode(_component_UButton, {
                  color: "primary",
                  size: "xs",
                  variant: "outline",
                  onClick: ($event) => emit("start", row.original)
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Начать ")
                  ]),
                  _: 1
                }, 8, ["onClick"]),
                createVNode(_component_UButton, {
                  color: "primary",
                  size: "xs",
                  onClick: ($event) => emit("complete", row.original)
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Завершить ")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/queue/QueueTable.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_10 = Object.assign(_sfc_main$1, { __name: "QueueTable" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "workspace",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const sessionStore = useSessionStore();
    const barbersApi = useBarbersApi();
    const breakMinutes = ref(10);
    useRealtimeQueue();
    [__temp, __restore] = withAsyncContext(() => sessionStore.ensureLoaded()), await __temp, __restore();
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("barber-workspace", async () => {
      const [me, queue] = await Promise.all([
        barbersApi.me({ silent: true }),
        barbersApi.queue()
      ]);
      return {
        me,
        queue
      };
    })), __temp = await __temp, __restore(), __temp);
    async function startBreak() {
      await barbersApi.break({ minutes: Number(breakMinutes.value) });
      await Promise.all([sessionStore.ensureLoaded(), refresh()]);
    }
    async function returnFromBreak() {
      await barbersApi.returnFromBreak();
      await Promise.all([sessionStore.ensureLoaded(), refresh()]);
    }
    async function callItem(item) {
      await barbersApi.callQueue(String(item.id));
      await refresh();
    }
    async function startItem(item) {
      await barbersApi.startQueue(String(item.id));
      await refresh();
    }
    async function completeItem(item) {
      await barbersApi.completeQueue(String(item.id));
      await refresh();
    }
    function openItem(item) {
      return navigateTo(`/barbers/queue/${item.id}`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$7;
      const _component_UBadge = _sfc_main$6;
      const _component_UButton = _sfc_main$a;
      const _component_DashboardMetricCard = __nuxt_component_5;
      const _component_UCard = _sfc_main$3;
      const _component_UFormField = _sfc_main$4;
      const _component_UInput = _sfc_main$5;
      const _component_UAlert = _sfc_main$2$1;
      const _component_QueueTable = __nuxt_component_10;
      const _component_SharedEmptyState = __nuxt_component_9;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "workspace" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Рабочее место барбера",
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
                    color: unref(sessionStore).barber?.is_on_break ? "warning" : "primary",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(sessionStore).barber?.is_on_break ? "На перерыве" : "На смене")}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(sessionStore).barber?.is_on_break ? "На перерыве" : "На смене"), 1)
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
                      color: unref(sessionStore).barber?.is_on_break ? "warning" : "primary",
                      variant: "soft"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(sessionStore).barber?.is_on_break ? "На перерыве" : "На смене"), 1)
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
                title: "Рабочее место барбера",
                ui: { right: "gap-3" }
              }, {
                leading: withCtx(() => [
                  createVNode(_component_UDashboardSidebarCollapse)
                ]),
                right: withCtx(() => [
                  createVNode(_component_UBadge, {
                    color: unref(sessionStore).barber?.is_on_break ? "warning" : "primary",
                    variant: "soft"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(sessionStore).barber?.is_on_break ? "На перерыве" : "На смене"), 1)
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
              description: "Текущие активные записи для авторизованного барбера.",
              icon: "i-lucide-clock-3",
              label: "Элементы очереди",
              value: unref(data)?.queue?.count || 0
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Контекст филиала, назначенный барберу.",
              icon: "i-lucide-map-pinned",
              label: "Филиал",
              value: unref(sessionStore).barber?.branch_id || "Неизвестно"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Дополнительный индикатор нагрузки из состава киоска.",
              icon: "i-lucide-users-round",
              label: "Текущие клиенты",
              value: unref(sessionStore).barber?.current_clients || 0
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_DashboardMetricCard, {
              description: "Оценка времени ожидания по данным бэкенда.",
              icon: "i-lucide-timer",
              label: "Оценка ожидания",
              value: `${unref(sessionStore).barber?.estimated_waiting_time || 0} мин`
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Профиль </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(sessionStore).user?.name || "Сессия барбера")}</h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Профиль "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, toDisplayString(unref(sessionStore).user?.name || "Сессия барбера"), 1)
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-5"${_scopeId2}><div class="grid gap-3 sm:grid-cols-2"${_scopeId2}><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500"${_scopeId2}>Логин</p><p class="mt-2 text-lg font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(sessionStore).user?.login || "Не указан")}</p></div><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500"${_scopeId2}>Специализация</p><p class="mt-2 text-lg font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(sessionStore).barber?.specialization || "Общие услуги")}</p></div></div><div class="space-y-3 rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500"${_scopeId2}>Управление перерывом</p><div class="flex flex-wrap items-end gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, {
                    label: "Минуты",
                    name: "minutes"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(breakMinutes),
                          "onUpdate:modelValue": ($event) => isRef(breakMinutes) ? breakMinutes.value = $event : null,
                          min: "1",
                          type: "number"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(breakMinutes),
                            "onUpdate:modelValue": ($event) => isRef(breakMinutes) ? breakMinutes.value = $event : null,
                            min: "1",
                            type: "number"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    icon: "i-lucide-coffee",
                    onClick: startBreak
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Начать перерыв `);
                      } else {
                        return [
                          createTextVNode(" Начать перерыв ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-undo-2",
                    variant: "outline",
                    onClick: returnFromBreak
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Вернуться `);
                      } else {
                        return [
                          createTextVNode(" Вернуться ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div></div>`);
                  _push3(ssrRenderComponent(_component_UAlert, {
                    color: "neutral",
                    description: "Обновления очереди, вызовы клиентов и изменения киоска повторно подтягиваются по событиям Socket.IO queue:update от бэкенда.",
                    icon: "i-lucide-radio-tower",
                    title: "Синхронизация очереди в реальном времени",
                    variant: "soft"
                  }, null, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-5" }, [
                      createVNode("div", { class: "grid gap-3 sm:grid-cols-2" }, [
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, "Логин"),
                          createVNode("p", { class: "mt-2 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(sessionStore).user?.login || "Не указан"), 1)
                        ]),
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, "Специализация"),
                          createVNode("p", { class: "mt-2 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(sessionStore).barber?.specialization || "Общие услуги"), 1)
                        ])
                      ]),
                      createVNode("div", { class: "space-y-3 rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, "Управление перерывом"),
                        createVNode("div", { class: "flex flex-wrap items-end gap-3" }, [
                          createVNode(_component_UFormField, {
                            label: "Минуты",
                            name: "minutes"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_UInput, {
                                modelValue: unref(breakMinutes),
                                "onUpdate:modelValue": ($event) => isRef(breakMinutes) ? breakMinutes.value = $event : null,
                                min: "1",
                                type: "number"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_UButton, {
                            icon: "i-lucide-coffee",
                            onClick: startBreak
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Начать перерыв ")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_UButton, {
                            color: "neutral",
                            icon: "i-lucide-undo-2",
                            variant: "outline",
                            onClick: returnFromBreak
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Вернуться ")
                            ]),
                            _: 1
                          })
                        ])
                      ]),
                      createVNode(_component_UAlert, {
                        color: "neutral",
                        description: "Обновления очереди, вызовы клиентов и изменения киоска повторно подтягиваются по событиям Socket.IO queue:update от бэкенда.",
                        icon: "i-lucide-radio-tower",
                        title: "Синхронизация очереди в реальном времени",
                        variant: "soft"
                      })
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Активная очередь </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Управляйте текущей очередью </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Активная очередь "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Управляйте текущей очередью ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(data)?.queue?.items?.length) {
                    _push3(`<div${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_QueueTable, {
                      items: unref(data).queue.items,
                      loading: unref(pending),
                      onCall: callItem,
                      onComplete: completeItem,
                      onOpen: openItem,
                      onStart: startItem
                    }, null, _parent3, _scopeId2));
                    _push3(`</div>`);
                  } else {
                    _push3(ssrRenderComponent(_component_SharedEmptyState, {
                      description: "Для авторизованного барбера не найдено активных записей очереди.",
                      icon: "i-lucide-sofa",
                      title: "Очередь пуста"
                    }, null, _parent3, _scopeId2));
                  }
                } else {
                  return [
                    unref(data)?.queue?.items?.length ? (openBlock(), createBlock("div", { key: 0 }, [
                      createVNode(_component_QueueTable, {
                        items: unref(data).queue.items,
                        loading: unref(pending),
                        onCall: callItem,
                        onComplete: completeItem,
                        onOpen: openItem,
                        onStart: startItem
                      }, null, 8, ["items", "loading"])
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Для авторизованного барбера не найдено активных записей очереди.",
                      icon: "i-lucide-sofa",
                      title: "Очередь пуста"
                    }))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "grid gap-4 xl:grid-cols-4 md:grid-cols-2" }, [
                  createVNode(_component_DashboardMetricCard, {
                    description: "Текущие активные записи для авторизованного барбера.",
                    icon: "i-lucide-clock-3",
                    label: "Элементы очереди",
                    value: unref(data)?.queue?.count || 0
                  }, null, 8, ["value"]),
                  createVNode(_component_DashboardMetricCard, {
                    description: "Контекст филиала, назначенный барберу.",
                    icon: "i-lucide-map-pinned",
                    label: "Филиал",
                    value: unref(sessionStore).barber?.branch_id || "Неизвестно"
                  }, null, 8, ["value"]),
                  createVNode(_component_DashboardMetricCard, {
                    description: "Дополнительный индикатор нагрузки из состава киоска.",
                    icon: "i-lucide-users-round",
                    label: "Текущие клиенты",
                    value: unref(sessionStore).barber?.current_clients || 0
                  }, null, 8, ["value"]),
                  createVNode(_component_DashboardMetricCard, {
                    description: "Оценка времени ожидания по данным бэкенда.",
                    icon: "i-lucide-timer",
                    label: "Оценка ожидания",
                    value: `${unref(sessionStore).barber?.estimated_waiting_time || 0} мин`
                  }, null, 8, ["value"])
                ]),
                createVNode("div", { class: "grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" }, [
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Профиль "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, toDisplayString(unref(sessionStore).user?.name || "Сессия барбера"), 1)
                      ])
                    ]),
                    default: withCtx(() => [
                      createVNode("div", { class: "space-y-5" }, [
                        createVNode("div", { class: "grid gap-3 sm:grid-cols-2" }, [
                          createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                            createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, "Логин"),
                            createVNode("p", { class: "mt-2 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(sessionStore).user?.login || "Не указан"), 1)
                          ]),
                          createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                            createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, "Специализация"),
                            createVNode("p", { class: "mt-2 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(sessionStore).barber?.specialization || "Общие услуги"), 1)
                          ])
                        ]),
                        createVNode("div", { class: "space-y-3 rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, "Управление перерывом"),
                          createVNode("div", { class: "flex flex-wrap items-end gap-3" }, [
                            createVNode(_component_UFormField, {
                              label: "Минуты",
                              name: "minutes"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_UInput, {
                                  modelValue: unref(breakMinutes),
                                  "onUpdate:modelValue": ($event) => isRef(breakMinutes) ? breakMinutes.value = $event : null,
                                  min: "1",
                                  type: "number"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_UButton, {
                              icon: "i-lucide-coffee",
                              onClick: startBreak
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Начать перерыв ")
                              ]),
                              _: 1
                            }),
                            createVNode(_component_UButton, {
                              color: "neutral",
                              icon: "i-lucide-undo-2",
                              variant: "outline",
                              onClick: returnFromBreak
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Вернуться ")
                              ]),
                              _: 1
                            })
                          ])
                        ]),
                        createVNode(_component_UAlert, {
                          color: "neutral",
                          description: "Обновления очереди, вызовы клиентов и изменения киоска повторно подтягиваются по событиям Socket.IO queue:update от бэкенда.",
                          icon: "i-lucide-radio-tower",
                          title: "Синхронизация очереди в реальном времени",
                          variant: "soft"
                        })
                      ])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Активная очередь "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Управляйте текущей очередью ")
                      ])
                    ]),
                    default: withCtx(() => [
                      unref(data)?.queue?.items?.length ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode(_component_QueueTable, {
                          items: unref(data).queue.items,
                          loading: unref(pending),
                          onCall: callItem,
                          onComplete: completeItem,
                          onOpen: openItem,
                          onStart: startItem
                        }, null, 8, ["items", "loading"])
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Для авторизованного барбера не найдено активных записей очереди.",
                        icon: "i-lucide-sofa",
                        title: "Очередь пуста"
                      }))
                    ]),
                    _: 1
                  })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/barbers/workspace.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/workspace-BtXQa4u5');
//# sourceMappingURL=workspace-BtXQa4u5.mjs.map
