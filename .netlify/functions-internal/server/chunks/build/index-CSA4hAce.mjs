globalThis.__timing__.logStart('Load chunks/build/index-CSA4hAce');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$6 } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a } from './server.mjs';
import { _ as _sfc_main$5 } from './Badge-CKFwwagy.mjs';
import { _ as _sfc_main$1 } from './Table-2pT4H1Ma.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-DWE-z1MU.mjs';
import { _ as _sfc_main$4 } from './Pagination-BDb1-C8s.mjs';
import { defineComponent, ref, withAsyncContext, computed, watch, mergeProps, withCtx, unref, createTextVNode, toDisplayString, createVNode, isRef, openBlock, createBlock, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { f as formatDateTime, a as formatMoney } from './format-DDcTL-sj.mjs';
import { f as formatPaymentMethod } from './display-CyQec-Wd.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import { u as useHistoryApi } from './useHistoryApi-XZUYGosn.mjs';
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
import '../_/index.mjs';
import './useKioskApi-l3XfHmhL.mjs';

const itemsPerPage = 10;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    function extractHistoryItems(response) {
      if (Array.isArray(response)) {
        return response;
      }
      if (!response || typeof response !== "object") {
        return [];
      }
      const payload = response;
      if (Array.isArray(payload.items)) {
        return payload.items;
      }
      if (Array.isArray(payload.data)) {
        return payload.data;
      }
      if (Array.isArray(payload.data?.items)) {
        return payload.data.items;
      }
      return [];
    }
    const branchStore = useBranchStore();
    const historyApi = useHistoryApi();
    const page = ref(1);
    [__temp, __restore] = withAsyncContext(() => branchStore.ensureLoaded()), await __temp, __restore();
    const columns = [
      { accessorKey: "phone_number", header: "КЛИЕНТ" },
      { accessorKey: "status", header: "СТАТУС" },
      { accessorKey: "payment_method", header: "ОПЛАТА" },
      { accessorKey: "amount", header: "СУММА" },
      { accessorKey: "created_at", header: "СОЗДАНО" }
    ];
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("history-current-filter", async () => {
      if (!branchStore.activeBranchId) {
        return [];
      }
      const response = await historyApi.branch(branchStore.activeBranchId);
      return extractHistoryItems(response);
    }, {
      watch: [() => branchStore.activeBranchId]
    })), __temp = await __temp, __restore(), __temp);
    const historyItems = computed(() => data.value || []);
    const paginatedHistory = computed(() => {
      const start = (page.value - 1) * itemsPerPage;
      return historyItems.value.slice(start, start + itemsPerPage);
    });
    const pageFrom = computed(
      () => historyItems.value.length ? (page.value - 1) * itemsPerPage + 1 : 0
    );
    const pageTo = computed(
      () => historyItems.value.length ? Math.min(page.value * itemsPerPage, historyItems.value.length) : 0
    );
    watch(
      () => branchStore.activeBranchId,
      () => {
        page.value = 1;
      }
    );
    watch(
      () => historyItems.value.length,
      (length) => {
        const maxPage = Math.max(1, Math.ceil(length / itemsPerPage));
        if (page.value > maxPage) {
          page.value = maxPage;
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$6;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UBadge = _sfc_main$5;
      const _component_UTable = _sfc_main$1;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_UPagination = _sfc_main$4;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "history-global" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "История",
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
                title: "История",
                ui: { right: "gap-3" }
              }, {
                leading: withCtx(() => [
                  createVNode(_component_UDashboardSidebarCollapse)
                ]),
                right: withCtx(() => [
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
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> История </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> История филиала </h2><p class="text-sm text-charcoal-500"${_scopeId2}> Таблица показывает записи для филиала, выбранного в BranchSelector. </p></div><div class="flex flex-wrap items-center gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    size: "lg",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(branchStore).activeBranch?.name || "Филиал не выбран")}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(branchStore).activeBranch?.name || "Филиал не выбран"), 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    variant: "outline"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(historyItems).length)} записей `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(historyItems).length) + " записей ", 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " История "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " История филиала "),
                        createVNode("p", { class: "text-sm text-charcoal-500" }, " Таблица показывает записи для филиала, выбранного в BranchSelector. ")
                      ]),
                      createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          size: "lg",
                          variant: "soft"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(branchStore).activeBranch?.name || "Филиал не выбран"), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          variant: "outline"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(historyItems).length) + " записей ", 1)
                          ]),
                          _: 1
                        })
                      ])
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(historyItems).length) {
                    _push3(`<div class="space-y-4"${_scopeId2}><div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UTable, {
                      columns,
                      data: unref(paginatedHistory),
                      loading: unref(pending),
                      sticky: "header",
                      ui: {
                        root: "w-full overflow-auto",
                        base: "w-full min-w-[64rem]",
                        thead: "bg-charcoal-50/90",
                        tbody: "divide-y divide-charcoal-100",
                        th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500"
                      }
                    }, {
                      "phone_number-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="font-medium text-charcoal-950"${_scopeId3}>${ssrInterpolate(row.original.phone_number || "Не указан")}</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.phone_number || "Не указан"), 1)
                          ];
                        }
                      }),
                      "status-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_SharedStatusBadge, {
                            label: row.original.status
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.status
                            }, null, 8, ["label"])
                          ];
                        }
                      }),
                      "payment_method-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(formatPaymentMethod)(row.original.payment_method))}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(formatPaymentMethod)(row.original.payment_method)), 1)
                          ];
                        }
                      }),
                      "amount-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(formatMoney)(row.original.amount))}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(formatMoney)(row.original.amount)), 1)
                          ];
                        }
                      }),
                      "created_at-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(formatDateTime)(row.original.created_at))}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(formatDateTime)(row.original.created_at)), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div><div class="flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between"${_scopeId2}><p class="text-sm text-charcoal-500"${_scopeId2}> Показано ${ssrInterpolate(unref(pageFrom))}-${ssrInterpolate(unref(pageTo))} из ${ssrInterpolate(unref(historyItems).length)}</p>`);
                    _push3(ssrRenderComponent(_component_UPagination, {
                      page: unref(page),
                      "onUpdate:page": ($event) => isRef(page) ? page.value = $event : null,
                      "active-color": "primary",
                      "active-variant": "solid",
                      "items-per-page": itemsPerPage,
                      "show-controls": true,
                      "sibling-count": 1,
                      total: unref(historyItems).length
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    _push3(`<div class="rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"${_scopeId2}><p class="text-base font-semibold text-charcoal-950"${_scopeId2}> История не найдена </p><p class="mt-2 text-sm text-charcoal-500"${_scopeId2}> Для выбранного филиала записи отсутствуют. </p></div>`);
                  }
                } else {
                  return [
                    unref(historyItems).length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-4"
                    }, [
                      createVNode("div", { class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90" }, [
                        createVNode(_component_UTable, {
                          columns,
                          data: unref(paginatedHistory),
                          loading: unref(pending),
                          sticky: "header",
                          ui: {
                            root: "w-full overflow-auto",
                            base: "w-full min-w-[64rem]",
                            thead: "bg-charcoal-50/90",
                            tbody: "divide-y divide-charcoal-100",
                            th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500"
                          }
                        }, {
                          "phone_number-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.phone_number || "Не указан"), 1)
                          ]),
                          "status-cell": withCtx(({ row }) => [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.status
                            }, null, 8, ["label"])
                          ]),
                          "payment_method-cell": withCtx(({ row }) => [
                            createTextVNode(toDisplayString(unref(formatPaymentMethod)(row.original.payment_method)), 1)
                          ]),
                          "amount-cell": withCtx(({ row }) => [
                            createTextVNode(toDisplayString(unref(formatMoney)(row.original.amount)), 1)
                          ]),
                          "created_at-cell": withCtx(({ row }) => [
                            createTextVNode(toDisplayString(unref(formatDateTime)(row.original.created_at)), 1)
                          ]),
                          _: 1
                        }, 8, ["data", "loading"])
                      ]),
                      createVNode("div", { class: "flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between" }, [
                        createVNode("p", { class: "text-sm text-charcoal-500" }, " Показано " + toDisplayString(unref(pageFrom)) + "-" + toDisplayString(unref(pageTo)) + " из " + toDisplayString(unref(historyItems).length), 1),
                        createVNode(_component_UPagination, {
                          page: unref(page),
                          "onUpdate:page": ($event) => isRef(page) ? page.value = $event : null,
                          "active-color": "primary",
                          "active-variant": "solid",
                          "items-per-page": itemsPerPage,
                          "show-controls": true,
                          "sibling-count": 1,
                          total: unref(historyItems).length
                        }, null, 8, ["page", "onUpdate:page", "total"])
                      ])
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"
                    }, [
                      createVNode("p", { class: "text-base font-semibold text-charcoal-950" }, " История не найдена "),
                      createVNode("p", { class: "mt-2 text-sm text-charcoal-500" }, " Для выбранного филиала записи отсутствуют. ")
                    ]))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx(() => [
                  createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" }, [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " История "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " История филиала "),
                      createVNode("p", { class: "text-sm text-charcoal-500" }, " Таблица показывает записи для филиала, выбранного в BranchSelector. ")
                    ]),
                    createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                      createVNode(_component_UBadge, {
                        color: "neutral",
                        size: "lg",
                        variant: "soft"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(branchStore).activeBranch?.name || "Филиал не выбран"), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UBadge, {
                        color: "neutral",
                        variant: "outline"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(historyItems).length) + " записей ", 1)
                        ]),
                        _: 1
                      })
                    ])
                  ])
                ]),
                default: withCtx(() => [
                  unref(historyItems).length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-4"
                  }, [
                    createVNode("div", { class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90" }, [
                      createVNode(_component_UTable, {
                        columns,
                        data: unref(paginatedHistory),
                        loading: unref(pending),
                        sticky: "header",
                        ui: {
                          root: "w-full overflow-auto",
                          base: "w-full min-w-[64rem]",
                          thead: "bg-charcoal-50/90",
                          tbody: "divide-y divide-charcoal-100",
                          th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500"
                        }
                      }, {
                        "phone_number-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.phone_number || "Не указан"), 1)
                        ]),
                        "status-cell": withCtx(({ row }) => [
                          createVNode(_component_SharedStatusBadge, {
                            label: row.original.status
                          }, null, 8, ["label"])
                        ]),
                        "payment_method-cell": withCtx(({ row }) => [
                          createTextVNode(toDisplayString(unref(formatPaymentMethod)(row.original.payment_method)), 1)
                        ]),
                        "amount-cell": withCtx(({ row }) => [
                          createTextVNode(toDisplayString(unref(formatMoney)(row.original.amount)), 1)
                        ]),
                        "created_at-cell": withCtx(({ row }) => [
                          createTextVNode(toDisplayString(unref(formatDateTime)(row.original.created_at)), 1)
                        ]),
                        _: 1
                      }, 8, ["data", "loading"])
                    ]),
                    createVNode("div", { class: "flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between" }, [
                      createVNode("p", { class: "text-sm text-charcoal-500" }, " Показано " + toDisplayString(unref(pageFrom)) + "-" + toDisplayString(unref(pageTo)) + " из " + toDisplayString(unref(historyItems).length), 1),
                      createVNode(_component_UPagination, {
                        page: unref(page),
                        "onUpdate:page": ($event) => isRef(page) ? page.value = $event : null,
                        "active-color": "primary",
                        "active-variant": "solid",
                        "items-per-page": itemsPerPage,
                        "show-controls": true,
                        "sibling-count": 1,
                        total: unref(historyItems).length
                      }, null, 8, ["page", "onUpdate:page", "total"])
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"
                  }, [
                    createVNode("p", { class: "text-base font-semibold text-charcoal-950" }, " История не найдена "),
                    createVNode("p", { class: "mt-2 text-sm text-charcoal-500" }, " Для выбранного филиала записи отсутствуют. ")
                  ]))
                ]),
                _: 1
              })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/history/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/index-CSA4hAce');
//# sourceMappingURL=index-CSA4hAce.mjs.map
