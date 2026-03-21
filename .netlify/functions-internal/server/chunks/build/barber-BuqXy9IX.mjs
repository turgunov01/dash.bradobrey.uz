globalThis.__timing__.logStart('Load chunks/build/barber-BuqXy9IX');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$9 } from './DashboardSidebarCollapse-DfgO2fN5.mjs';
import { a as useBarbersApi, g as useUiStore, b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a } from './server.mjs';
import { _ as _sfc_main$5 } from './FormField-CfjXEpv-.mjs';
import { _ as _sfc_main$6 } from './Input-DcPP1NGC.mjs';
import { _ as _sfc_main$7 } from './Badge-CHxj5N7w.mjs';
import { _ as _sfc_main$1 } from './Table-uigNOx9c.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-CYCC6qth.mjs';
import { _ as _sfc_main$4 } from './Pagination-t5D_AaGq.mjs';
import { _ as _sfc_main$8 } from './Modal-Dv48105F.mjs';
import { defineComponent, ref, withAsyncContext, computed, watch, mergeProps, withCtx, unref, createTextVNode, createVNode, toDisplayString, isRef, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderStyle } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/server-renderer/index.mjs';
import { b as barberSchema } from '../_/index.mjs';
import { a as formatMoney, b as formatCount, c as formatPercent, f as formatDateTime } from './format-DDcTL-sj.mjs';
import { u as useStatisticsApi, t as toKeyLabel, a as asNumber } from './useStatisticsApi-D5PxREFa.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import { u as useKioskApi } from './useKioskApi-l3XfHmhL.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
import './index-qsfWWCYt.mjs';
import '../_/nitro.mjs';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:util';
import 'node:path';
import 'node:process';
import 'node:tty';
import 'node:fs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/pinia@3.0.4_typescript@5.9.3_vue@3.5.30_typescript@5.9.3_/node_modules/pinia/dist/pinia.prod.cjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-router/vue-router.node.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/perfect-debounce@2.1.0/node_modules/perfect-debounce/dist/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@vue/shared/dist/shared.cjs.prod.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/tailwindcss@4.2.1/node_modules/tailwindcss/dist/colors.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/vue/dist/iconify.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwind-variants/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/unhead@2.1.12/node_modules/unhead/dist/plugins.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/unhead@2.1.12/node_modules/unhead/dist/utils.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@tanstack/vue-table/build/lib/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@tanstack/vue-virtual/dist/esm/index.js';
import './display-CyQec-Wd.mjs';

const itemsPerPage = 12;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "barber",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    function extractBarberItems(response) {
      if (Array.isArray(response)) {
        return response;
      }
      if (!response || typeof response !== "object") {
        return [];
      }
      const payload = response;
      if (Array.isArray(payload.barbers)) {
        return payload.barbers;
      }
      if (Array.isArray(payload.items)) {
        return payload.items;
      }
      if (Array.isArray(payload.entry)) {
        return payload.entry;
      }
      if (Array.isArray(payload.data)) {
        return payload.data;
      }
      if (Array.isArray(payload.data?.items)) {
        return payload.data.items;
      }
      if (Array.isArray(payload.data?.entry)) {
        return payload.data.entry;
      }
      return [];
    }
    function normalizeText(value) {
      if (value === void 0 || value === null) {
        return null;
      }
      const text = String(value).trim();
      return text ? text : null;
    }
    function pickText(source, keys) {
      for (const key of keys) {
        const value = normalizeText(source?.[key]);
        if (value) {
          return value;
        }
      }
      return null;
    }
    function pickNumber(source, keys) {
      for (const key of keys) {
        const value = source?.[key];
        if (value === void 0 || value === null || value === "") {
          continue;
        }
        const amount = Number(value);
        if (Number.isFinite(amount)) {
          return amount;
        }
      }
      return null;
    }
    function looksLikePhone(value) {
      if (!value) {
        return false;
      }
      return /^[+\d][\d\s()-]{5,}$/.test(value);
    }
    function resolveCreatedAt(profile) {
      return pickText(profile, ["created_at", "createdAt", "registered_at"]) || pickText(profile.user, ["created_at", "createdAt", "registered_at"]);
    }
    function resolveBarberName(profile) {
      return pickText(profile, ["name"]) || pickText(profile.user, ["name"]) || `Барбер ${profile.id}`;
    }
    function resolveBarberLogin(profile) {
      return pickText(profile.user, ["login", "username"]) || pickText(profile, ["login", "username"]);
    }
    function resolveBarberPhone(profile) {
      return pickText(profile, ["phone", "phone_number"]) || pickText(profile.user, ["phone", "phone_number"]);
    }
    function resolveBarberRole(profile) {
      return pickText(profile.user, ["role"]) || pickText(profile, ["role"]);
    }
    const branchStore = useBranchStore();
    const barbersApi = useBarbersApi();
    const kioskApi = useKioskApi();
    const statisticsApi = useStatisticsApi();
    const uiStore = useUiStore();
    const page = ref(1);
    const detailModalOpen = ref(false);
    const detailPending = ref(false);
    const detailError = ref("");
    const detailStats = ref(null);
    const selectedBarber = ref(null);
    [__temp, __restore] = withAsyncContext(() => branchStore.ensureLoaded()), await __temp, __restore();
    const columns = [
      { accessorKey: "name", header: "БАРБЕР" },
      { accessorKey: "branchName", header: "ФИЛИАЛ" },
      { accessorKey: "phone", header: "ТЕЛЕФОН" },
      { accessorKey: "login", header: "ЛОГИН" },
      { accessorKey: "isActive", header: "СТАТУС" },
      { accessorKey: "createdAt", header: "СОЗДАН" },
      { id: "actions", header: "" }
    ];
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("barber-history-directory", async () => {
      const branches = [...branchStore.branches];
      const branchMap = new Map(branches.map((branch) => [branch.id, branch]));
      const [accountsResponse, results] = await Promise.all([
        barbersApi.list(),
        Promise.allSettled(
          branches.map(async (branch) => {
            const response = await kioskApi.barbers(branch.id);
            return {
              branch,
              items: extractBarberItems(response)
            };
          })
        )
      ]);
      const failedBranches2 = [];
      const activeProfiles = /* @__PURE__ */ new Map();
      results.forEach((result, index) => {
        const branch = branches[index];
        if (!branch) {
          return;
        }
        if (result.status !== "fulfilled") {
          failedBranches2.push(branch);
          return;
        }
        for (const item of result.value.items) {
          const parsed = barberSchema.safeParse(item);
          if (parsed.success) {
            activeProfiles.set(String(parsed.data.id), parsed.data);
          }
        }
      });
      const accounts = Array.isArray(accountsResponse?.items) ? accountsResponse.items : [];
      const rows = accounts.map((account) => {
        const profile = activeProfiles.get(String(account.id)) || null;
        const branchId = account.branch_id || profile?.branch_id || "";
        const branch = branchId ? branchMap.get(String(branchId)) : null;
        const login = account.login || (profile ? resolveBarberLogin(profile) : null);
        const phoneFromLogin = looksLikePhone(login) ? login : null;
        return {
          barberId: String(account.id),
          branchId: branchId ? String(branchId) : "",
          branchName: branch?.name || "Филиал не указан",
          createdAt: profile ? resolveCreatedAt(profile) : null,
          id: String(account.id),
          isActive: profile ? typeof profile.is_active === "boolean" ? profile.is_active : true : false,
          isOnBreak: profile ? typeof profile.is_on_break === "boolean" ? profile.is_on_break : false : false,
          isOnShift: profile ? typeof profile.is_on_shift === "boolean" ? profile.is_on_shift : false : false,
          login,
          name: profile ? resolveBarberName(profile) : login || `Барбер ${String(account.id).slice(0, 8)}`,
          phone: (profile ? resolveBarberPhone(profile) : null) || phoneFromLogin,
          profile,
          role: account.role || (profile ? resolveBarberRole(profile) : null),
          specialization: profile ? pickText(profile, ["specialization"]) : null
        };
      }).sort((left, right) => {
        const branchComparison = left.branchName.localeCompare(right.branchName, "ru");
        return branchComparison !== 0 ? branchComparison : left.name.localeCompare(right.name, "ru");
      });
      return {
        failedBranches: failedBranches2,
        rows
      };
    })), __temp = await __temp, __restore(), __temp);
    const barberRows = computed(() => data.value?.rows || []);
    const failedBranches = computed(() => data.value?.failedBranches || []);
    const paginatedBarbers = computed(() => {
      const start = (page.value - 1) * itemsPerPage;
      return barberRows.value.slice(start, start + itemsPerPage);
    });
    const pageFrom = computed(
      () => barberRows.value.length ? (page.value - 1) * itemsPerPage + 1 : 0
    );
    const pageTo = computed(
      () => barberRows.value.length ? Math.min(page.value * itemsPerPage, barberRows.value.length) : 0
    );
    const detailDescription = computed(() => {
      if (!selectedBarber.value) {
        return "Детальная карточка барбера.";
      }
      return `${selectedBarber.value.branchName}, статистика за ${uiStore.statisticsRange.start} - ${uiStore.statisticsRange.end}`;
    });
    const detailMetrics = computed(() => {
      const stats = detailStats.value || {};
      const revenue = pickNumber(stats, ["revenue", "total_revenue", "amount", "total_amount"]) || 0;
      const totalOrders = pickNumber(stats, ["orders", "queue_count", "count", "total_orders"]) || 0;
      const completedOrders = pickNumber(stats, ["completed", "completed_orders", "done"]) || 0;
      const explicitRate = pickNumber(stats, ["completion_rate", "completion_percentage", "completed_percent", "completion_percent"]);
      const completionRate = explicitRate ?? (totalOrders > 0 ? completedOrders / totalOrders * 100 : 0);
      return [
        {
          description: "Сумма по найденным полям выручки барбера.",
          label: "Заработал",
          value: formatMoney(revenue)
        },
        {
          description: "Количество заказов в статистическом ответе.",
          label: "Заказы",
          value: formatCount(totalOrders)
        },
        {
          description: "Завершенные визиты по статистике.",
          label: "Завершено",
          value: formatCount(completedOrders)
        },
        {
          description: "Либо явное поле completion_rate, либо расчет completed/orders.",
          label: "Выполнение",
          value: formatPercent(completionRate)
        }
      ];
    });
    const detailFacts = computed(() => {
      if (!selectedBarber.value) {
        return [];
      }
      return [
        { label: "Филиал", value: selectedBarber.value.branchName },
        { label: "Логин", value: selectedBarber.value.login || "Не указан" },
        { label: "Телефон", value: selectedBarber.value.phone || "Не указан" },
        { label: "Создан логин", value: formatDateTime(selectedBarber.value.createdAt) },
        { label: "Специализация", value: selectedBarber.value.specialization || "Не указана" },
        { label: "Роль", value: selectedBarber.value.role || "Не указана" },
        { label: "Активность", value: selectedBarber.value.isActive === false ? "Неактивен" : "Активен" },
        { label: "Смена", value: selectedBarber.value.isOnShift ? "На смене" : "Вне смены" },
        { label: "Перерыв", value: selectedBarber.value.isOnBreak ? "На перерыве" : "Нет" }
      ];
    });
    const extraDetailRows = computed(
      () => Object.entries(detailStats.value || {}).filter(
        ([key, value]) => !["revenue", "total_revenue", "amount", "total_amount", "orders", "queue_count", "count", "total_orders", "completed", "completed_orders", "done", "completion_rate", "completion_percentage", "completed_percent", "completion_percent"].includes(key) && ["number", "string"].includes(typeof value)
      ).slice(0, 8)
    );
    watch(
      () => barberRows.value.length,
      (length) => {
        const maxPage = Math.max(1, Math.ceil(length / itemsPerPage));
        if (page.value > maxPage) {
          page.value = maxPage;
        }
      },
      { immediate: true }
    );
    watch(
      [() => uiStore.statisticsRange.start, () => uiStore.statisticsRange.end],
      async () => {
        if (detailModalOpen.value && selectedBarber.value) {
          await loadBarberDetails(selectedBarber.value);
        }
      }
    );
    watch(detailModalOpen, (open) => {
      if (!open) {
        detailError.value = "";
        detailPending.value = false;
        detailStats.value = null;
        selectedBarber.value = null;
      }
    });
    async function loadBarberDetails(barber) {
      detailPending.value = true;
      detailError.value = "";
      try {
        const response = await statisticsApi.barber(barber.barberId, {
          end_date: uiStore.statisticsRange.end,
          start_date: uiStore.statisticsRange.start
        });
        detailStats.value = response && typeof response === "object" && !Array.isArray(response) ? response : {};
      } catch (error) {
        detailError.value = error instanceof Error ? error.message : "Не удалось загрузить детали барбера.";
      } finally {
        detailPending.value = false;
      }
    }
    async function openDetails(barber) {
      selectedBarber.value = barber;
      detailModalOpen.value = true;
      await loadBarberDetails(barber);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$9;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UFormField = _sfc_main$5;
      const _component_UInput = _sfc_main$6;
      const _component_UBadge = _sfc_main$7;
      const _component_UTable = _sfc_main$1;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_UPagination = _sfc_main$4;
      const _component_UModal = _sfc_main$8;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "barber-history" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "История барбера",
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
                title: "История барбера",
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
                  _push3(`<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Все филиалы </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Полный список барберов </h2><p class="text-sm text-charcoal-500"${_scopeId2}> Список строится по всем аккаунтам барберов, а не только по активным профилям kiosk API. </p></div><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,13rem)_minmax(0,13rem)]"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Период с" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(uiStore).statisticsRange.start,
                          "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                          type: "date"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.start,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Период по" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(uiStore).statisticsRange.end,
                          "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                          type: "date"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.end,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div></div><div class="mt-4 flex flex-wrap items-center gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    size: "lg",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(barberRows).length)} барберов `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(barberRows).length) + " барберов ", 1)
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
                        _push4(`${ssrInterpolate(unref(branchStore).branches.length)} филиалов `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(branchStore).branches.length) + " филиалов ", 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  if (unref(failedBranches).length) {
                    _push3(ssrRenderComponent(_component_UBadge, {
                      color: "warning",
                      variant: "outline"
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` Без live-данных по филиалам: ${ssrInterpolate(unref(failedBranches).length)}`);
                        } else {
                          return [
                            createTextVNode(" Без live-данных по филиалам: " + toDisplayString(unref(failedBranches).length), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Все филиалы "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Полный список барберов "),
                        createVNode("p", { class: "text-sm text-charcoal-500" }, " Список строится по всем аккаунтам барберов, а не только по активным профилям kiosk API. ")
                      ]),
                      createVNode("div", { class: "grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,13rem)_minmax(0,13rem)]" }, [
                        createVNode(_component_UFormField, { label: "Период с" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(uiStore).statisticsRange.start,
                              "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                              type: "date"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Период по" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(uiStore).statisticsRange.end,
                              "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                              type: "date"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        })
                      ])
                    ]),
                    createVNode("div", { class: "mt-4 flex flex-wrap items-center gap-3" }, [
                      createVNode(_component_UBadge, {
                        color: "neutral",
                        size: "lg",
                        variant: "soft"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(barberRows).length) + " барберов ", 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UBadge, {
                        color: "neutral",
                        variant: "outline"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(branchStore).branches.length) + " филиалов ", 1)
                        ]),
                        _: 1
                      }),
                      unref(failedBranches).length ? (openBlock(), createBlock(_component_UBadge, {
                        key: 0,
                        color: "warning",
                        variant: "outline"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Без live-данных по филиалам: " + toDisplayString(unref(failedBranches).length), 1)
                        ]),
                        _: 1
                      })) : createCommentVNode("", true)
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(barberRows).length) {
                    _push3(`<div class="space-y-4"${_scopeId2}><div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UTable, {
                      columns,
                      data: unref(paginatedBarbers),
                      loading: unref(pending),
                      ui: {
                        root: "w-full overflow-auto",
                        base: "w-full min-w-[80rem]",
                        thead: "bg-charcoal-50/90",
                        tbody: "divide-y divide-charcoal-100",
                        th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                        td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                      }
                    }, {
                      "name-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="space-y-1"${_scopeId3}><p class="font-semibold text-charcoal-950"${_scopeId3}>${ssrInterpolate(row.original.name)}</p><p class="text-xs text-charcoal-500"${_scopeId3}>${ssrInterpolate(row.original.specialization || "Специализация не указана")}</p></div>`);
                        } else {
                          return [
                            createVNode("div", { class: "space-y-1" }, [
                              createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.original.name), 1),
                              createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.specialization || "Специализация не указана"), 1)
                            ])
                          ];
                        }
                      }),
                      "branchName-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="font-medium text-charcoal-950"${_scopeId3}>${ssrInterpolate(row.original.branchName)}</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.branchName), 1)
                          ];
                        }
                      }),
                      "phone-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(row.original.phone || "Не указан")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(row.original.phone || "Не указан"), 1)
                          ];
                        }
                      }),
                      "login-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="space-y-1"${_scopeId3}><p class="font-medium text-charcoal-950"${_scopeId3}>${ssrInterpolate(row.original.login || "Не указан")}</p><p class="text-xs text-charcoal-500"${_scopeId3}>${ssrInterpolate(row.original.role || "Роль не указана")}</p></div>`);
                        } else {
                          return [
                            createVNode("div", { class: "space-y-1" }, [
                              createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.login || "Не указан"), 1),
                              createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.role || "Роль не указана"), 1)
                            ])
                          ];
                        }
                      }),
                      "isActive-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_SharedStatusBadge, {
                            label: row.original.isActive === false ? "inactive" : "active"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.isActive === false ? "inactive" : "active"
                            }, null, 8, ["label"])
                          ];
                        }
                      }),
                      "createdAt-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(formatDateTime)(row.original.createdAt))}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(formatDateTime)(row.original.createdAt)), 1)
                          ];
                        }
                      }),
                      "actions-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="flex justify-end"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_UButton, {
                            color: "neutral",
                            icon: "i-lucide-circle-ellipsis",
                            size: "sm",
                            variant: "outline",
                            onClick: ($event) => openDetails(row.original)
                          }, {
                            default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(` Подробнее `);
                              } else {
                                return [
                                  createTextVNode(" Подробнее ")
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                          _push4(`</div>`);
                        } else {
                          return [
                            createVNode("div", { class: "flex justify-end" }, [
                              createVNode(_component_UButton, {
                                color: "neutral",
                                icon: "i-lucide-circle-ellipsis",
                                size: "sm",
                                variant: "outline",
                                onClick: ($event) => openDetails(row.original)
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" Подробнее ")
                                ]),
                                _: 1
                              }, 8, ["onClick"])
                            ])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div><div class="flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between"${_scopeId2}><p class="text-sm text-charcoal-500"${_scopeId2}> Показано ${ssrInterpolate(unref(pageFrom))}-${ssrInterpolate(unref(pageTo))} из ${ssrInterpolate(unref(barberRows).length)}</p>`);
                    _push3(ssrRenderComponent(_component_UPagination, {
                      page: unref(page),
                      "onUpdate:page": ($event) => isRef(page) ? page.value = $event : null,
                      "active-color": "primary",
                      "active-variant": "solid",
                      "items-per-page": itemsPerPage,
                      "show-controls": true,
                      "sibling-count": 1,
                      total: unref(barberRows).length
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    _push3(`<div class="rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"${_scopeId2}><p class="text-base font-semibold text-charcoal-950"${_scopeId2}> Барберы не найдены </p><p class="mt-2 text-sm text-charcoal-500"${_scopeId2}> Не удалось собрать полный список барберов из аккаунтов и live-профилей. </p></div>`);
                  }
                } else {
                  return [
                    unref(barberRows).length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-4"
                    }, [
                      createVNode("div", { class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90" }, [
                        createVNode(_component_UTable, {
                          columns,
                          data: unref(paginatedBarbers),
                          loading: unref(pending),
                          ui: {
                            root: "w-full overflow-auto",
                            base: "w-full min-w-[80rem]",
                            thead: "bg-charcoal-50/90",
                            tbody: "divide-y divide-charcoal-100",
                            th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                            td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                          }
                        }, {
                          "name-cell": withCtx(({ row }) => [
                            createVNode("div", { class: "space-y-1" }, [
                              createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.original.name), 1),
                              createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.specialization || "Специализация не указана"), 1)
                            ])
                          ]),
                          "branchName-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.branchName), 1)
                          ]),
                          "phone-cell": withCtx(({ row }) => [
                            createTextVNode(toDisplayString(row.original.phone || "Не указан"), 1)
                          ]),
                          "login-cell": withCtx(({ row }) => [
                            createVNode("div", { class: "space-y-1" }, [
                              createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.login || "Не указан"), 1),
                              createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.role || "Роль не указана"), 1)
                            ])
                          ]),
                          "isActive-cell": withCtx(({ row }) => [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.isActive === false ? "inactive" : "active"
                            }, null, 8, ["label"])
                          ]),
                          "createdAt-cell": withCtx(({ row }) => [
                            createTextVNode(toDisplayString(unref(formatDateTime)(row.original.createdAt)), 1)
                          ]),
                          "actions-cell": withCtx(({ row }) => [
                            createVNode("div", { class: "flex justify-end" }, [
                              createVNode(_component_UButton, {
                                color: "neutral",
                                icon: "i-lucide-circle-ellipsis",
                                size: "sm",
                                variant: "outline",
                                onClick: ($event) => openDetails(row.original)
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" Подробнее ")
                                ]),
                                _: 1
                              }, 8, ["onClick"])
                            ])
                          ]),
                          _: 1
                        }, 8, ["data", "loading"])
                      ]),
                      createVNode("div", { class: "flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between" }, [
                        createVNode("p", { class: "text-sm text-charcoal-500" }, " Показано " + toDisplayString(unref(pageFrom)) + "-" + toDisplayString(unref(pageTo)) + " из " + toDisplayString(unref(barberRows).length), 1),
                        createVNode(_component_UPagination, {
                          page: unref(page),
                          "onUpdate:page": ($event) => isRef(page) ? page.value = $event : null,
                          "active-color": "primary",
                          "active-variant": "solid",
                          "items-per-page": itemsPerPage,
                          "show-controls": true,
                          "sibling-count": 1,
                          total: unref(barberRows).length
                        }, null, 8, ["page", "onUpdate:page", "total"])
                      ])
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"
                    }, [
                      createVNode("p", { class: "text-base font-semibold text-charcoal-950" }, " Барберы не найдены "),
                      createVNode("p", { class: "mt-2 text-sm text-charcoal-500" }, " Не удалось собрать полный список барберов из аккаунтов и live-профилей. ")
                    ]))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UModal, {
              open: unref(detailModalOpen),
              "onUpdate:open": ($event) => isRef(detailModalOpen) ? detailModalOpen.value = $event : null,
              class: "sm:max-w-4xl",
              description: unref(detailDescription),
              title: unref(selectedBarber)?.name || "Детали барбера"
            }, {
              body: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(selectedBarber)) {
                    _push3(`<div class="space-y-6"${_scopeId2}><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"${_scopeId2}><!--[-->`);
                    ssrRenderList(unref(detailMetrics), (metric) => {
                      _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>${ssrInterpolate(metric.label)}</p><p class="mt-3 text-2xl font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(metric.value)}</p><p class="mt-2 text-sm leading-6 text-charcoal-500"${_scopeId2}>${ssrInterpolate(metric.description)}</p></div>`);
                    });
                    _push3(`<!--]--></div>`);
                    if (unref(detailError)) {
                      _push3(`<div class="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"${_scopeId2}>${ssrInterpolate(unref(detailError))}</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (unref(detailPending)) {
                      _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-5 text-sm text-charcoal-500"${_scopeId2}> Загружаю детальную статистику барбера... </div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`<div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"${_scopeId2}><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-5"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}> Профиль </p><div class="mt-4 space-y-3"${_scopeId2}><!--[-->`);
                    ssrRenderList(unref(detailFacts), (fact) => {
                      _push3(`<div class="flex items-start justify-between gap-4 border-b border-charcoal-100 pb-3 last:border-b-0 last:pb-0"${_scopeId2}><span class="text-sm text-charcoal-500"${_scopeId2}>${ssrInterpolate(fact.label)}</span><span class="text-right text-sm font-medium text-charcoal-950"${_scopeId2}>${ssrInterpolate(fact.value)}</span></div>`);
                    });
                    _push3(`<!--]--></div></div><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-5"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}> Дополнительные метрики </p>`);
                    if (unref(extraDetailRows).length) {
                      _push3(`<div class="mt-4 space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(extraDetailRows), ([key, value]) => {
                        _push3(`<div class="rounded-[1rem] border border-charcoal-100 bg-charcoal-50/60 px-4 py-3"${_scopeId2}><div class="flex items-center justify-between gap-4"${_scopeId2}><span class="text-sm font-medium text-charcoal-700"${_scopeId2}>${ssrInterpolate(unref(toKeyLabel)(key))}</span><span class="text-sm font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(value)}</span></div><div class="mt-3 h-2 rounded-full bg-sand-100"${_scopeId2}><div class="h-full rounded-full bg-brass-400" style="${ssrRenderStyle({ width: `${Math.min(unref(asNumber)(value, 0), 100)}%` })}"${_scopeId2}></div></div></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="mt-4 text-sm leading-6 text-charcoal-500"${_scopeId2}> API статистики не вернул дополнительных простых метрик сверх выручки, заказов и процента выполнения. </p>`);
                    }
                    _push3(`</div></div></div>`);
                  } else {
                    _push3(`<!---->`);
                  }
                } else {
                  return [
                    unref(selectedBarber) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-6"
                    }, [
                      createVNode("div", { class: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(detailMetrics), (metric) => {
                          return openBlock(), createBlock("div", {
                            key: metric.label,
                            class: "rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-4"
                          }, [
                            createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, toDisplayString(metric.label), 1),
                            createVNode("p", { class: "mt-3 text-2xl font-semibold text-charcoal-950" }, toDisplayString(metric.value), 1),
                            createVNode("p", { class: "mt-2 text-sm leading-6 text-charcoal-500" }, toDisplayString(metric.description), 1)
                          ]);
                        }), 128))
                      ]),
                      unref(detailError) ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      }, toDisplayString(unref(detailError)), 1)) : createCommentVNode("", true),
                      unref(detailPending) ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-5 text-sm text-charcoal-500"
                      }, " Загружаю детальную статистику барбера... ")) : createCommentVNode("", true),
                      createVNode("div", { class: "grid gap-4 lg:grid-cols-[0.95fr_1.05fr]" }, [
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-5" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, " Профиль "),
                          createVNode("div", { class: "mt-4 space-y-3" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(detailFacts), (fact) => {
                              return openBlock(), createBlock("div", {
                                key: fact.label,
                                class: "flex items-start justify-between gap-4 border-b border-charcoal-100 pb-3 last:border-b-0 last:pb-0"
                              }, [
                                createVNode("span", { class: "text-sm text-charcoal-500" }, toDisplayString(fact.label), 1),
                                createVNode("span", { class: "text-right text-sm font-medium text-charcoal-950" }, toDisplayString(fact.value), 1)
                              ]);
                            }), 128))
                          ])
                        ]),
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-5" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, " Дополнительные метрики "),
                          unref(extraDetailRows).length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "mt-4 space-y-3"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(extraDetailRows), ([key, value]) => {
                              return openBlock(), createBlock("div", {
                                key,
                                class: "rounded-[1rem] border border-charcoal-100 bg-charcoal-50/60 px-4 py-3"
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
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "mt-4 text-sm leading-6 text-charcoal-500"
                          }, " API статистики не вернул дополнительных простых метрик сверх выручки, заказов и процента выполнения. "))
                        ])
                      ])
                    ])) : createCommentVNode("", true)
                  ];
                }
              }),
              footer: withCtx(({ close }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex w-full flex-wrap items-center justify-between gap-3"${_scopeId2}><p class="text-sm text-charcoal-500"${_scopeId2}> Период: ${ssrInterpolate(unref(uiStore).statisticsRange.start)} - ${ssrInterpolate(unref(uiStore).statisticsRange.end)}</p><div class="flex flex-wrap justify-end gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-refresh-cw",
                    loading: unref(detailPending),
                    variant: "outline",
                    onClick: ($event) => unref(selectedBarber) && loadBarberDetails(unref(selectedBarber))
                  }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Обновить детали `);
                      } else {
                        return [
                          createTextVNode(" Обновить детали ")
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    variant: "ghost",
                    onClick: close
                  }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Закрыть `);
                      } else {
                        return [
                          createTextVNode(" Закрыть ")
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                  _push3(`</div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex w-full flex-wrap items-center justify-between gap-3" }, [
                      createVNode("p", { class: "text-sm text-charcoal-500" }, " Период: " + toDisplayString(unref(uiStore).statisticsRange.start) + " - " + toDisplayString(unref(uiStore).statisticsRange.end), 1),
                      createVNode("div", { class: "flex flex-wrap justify-end gap-3" }, [
                        createVNode(_component_UButton, {
                          color: "neutral",
                          icon: "i-lucide-refresh-cw",
                          loading: unref(detailPending),
                          variant: "outline",
                          onClick: ($event) => unref(selectedBarber) && loadBarberDetails(unref(selectedBarber))
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Обновить детали ")
                          ]),
                          _: 1
                        }, 8, ["loading", "onClick"]),
                        createVNode(_component_UButton, {
                          color: "neutral",
                          variant: "ghost",
                          onClick: close
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Закрыть ")
                          ]),
                          _: 1
                        }, 8, ["onClick"])
                      ])
                    ])
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
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Все филиалы "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Полный список барберов "),
                      createVNode("p", { class: "text-sm text-charcoal-500" }, " Список строится по всем аккаунтам барберов, а не только по активным профилям kiosk API. ")
                    ]),
                    createVNode("div", { class: "grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,13rem)_minmax(0,13rem)]" }, [
                      createVNode(_component_UFormField, { label: "Период с" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.start,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Период по" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.end,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  createVNode("div", { class: "mt-4 flex flex-wrap items-center gap-3" }, [
                    createVNode(_component_UBadge, {
                      color: "neutral",
                      size: "lg",
                      variant: "soft"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(barberRows).length) + " барберов ", 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UBadge, {
                      color: "neutral",
                      variant: "outline"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(branchStore).branches.length) + " филиалов ", 1)
                      ]),
                      _: 1
                    }),
                    unref(failedBranches).length ? (openBlock(), createBlock(_component_UBadge, {
                      key: 0,
                      color: "warning",
                      variant: "outline"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Без live-данных по филиалам: " + toDisplayString(unref(failedBranches).length), 1)
                      ]),
                      _: 1
                    })) : createCommentVNode("", true)
                  ])
                ]),
                default: withCtx(() => [
                  unref(barberRows).length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-4"
                  }, [
                    createVNode("div", { class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90" }, [
                      createVNode(_component_UTable, {
                        columns,
                        data: unref(paginatedBarbers),
                        loading: unref(pending),
                        ui: {
                          root: "w-full overflow-auto",
                          base: "w-full min-w-[80rem]",
                          thead: "bg-charcoal-50/90",
                          tbody: "divide-y divide-charcoal-100",
                          th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                          td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                        }
                      }, {
                        "name-cell": withCtx(({ row }) => [
                          createVNode("div", { class: "space-y-1" }, [
                            createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.original.name), 1),
                            createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.specialization || "Специализация не указана"), 1)
                          ])
                        ]),
                        "branchName-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.branchName), 1)
                        ]),
                        "phone-cell": withCtx(({ row }) => [
                          createTextVNode(toDisplayString(row.original.phone || "Не указан"), 1)
                        ]),
                        "login-cell": withCtx(({ row }) => [
                          createVNode("div", { class: "space-y-1" }, [
                            createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.login || "Не указан"), 1),
                            createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.role || "Роль не указана"), 1)
                          ])
                        ]),
                        "isActive-cell": withCtx(({ row }) => [
                          createVNode(_component_SharedStatusBadge, {
                            label: row.original.isActive === false ? "inactive" : "active"
                          }, null, 8, ["label"])
                        ]),
                        "createdAt-cell": withCtx(({ row }) => [
                          createTextVNode(toDisplayString(unref(formatDateTime)(row.original.createdAt)), 1)
                        ]),
                        "actions-cell": withCtx(({ row }) => [
                          createVNode("div", { class: "flex justify-end" }, [
                            createVNode(_component_UButton, {
                              color: "neutral",
                              icon: "i-lucide-circle-ellipsis",
                              size: "sm",
                              variant: "outline",
                              onClick: ($event) => openDetails(row.original)
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Подробнее ")
                              ]),
                              _: 1
                            }, 8, ["onClick"])
                          ])
                        ]),
                        _: 1
                      }, 8, ["data", "loading"])
                    ]),
                    createVNode("div", { class: "flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between" }, [
                      createVNode("p", { class: "text-sm text-charcoal-500" }, " Показано " + toDisplayString(unref(pageFrom)) + "-" + toDisplayString(unref(pageTo)) + " из " + toDisplayString(unref(barberRows).length), 1),
                      createVNode(_component_UPagination, {
                        page: unref(page),
                        "onUpdate:page": ($event) => isRef(page) ? page.value = $event : null,
                        "active-color": "primary",
                        "active-variant": "solid",
                        "items-per-page": itemsPerPage,
                        "show-controls": true,
                        "sibling-count": 1,
                        total: unref(barberRows).length
                      }, null, 8, ["page", "onUpdate:page", "total"])
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"
                  }, [
                    createVNode("p", { class: "text-base font-semibold text-charcoal-950" }, " Барберы не найдены "),
                    createVNode("p", { class: "mt-2 text-sm text-charcoal-500" }, " Не удалось собрать полный список барберов из аккаунтов и live-профилей. ")
                  ]))
                ]),
                _: 1
              }),
              createVNode(_component_UModal, {
                open: unref(detailModalOpen),
                "onUpdate:open": ($event) => isRef(detailModalOpen) ? detailModalOpen.value = $event : null,
                class: "sm:max-w-4xl",
                description: unref(detailDescription),
                title: unref(selectedBarber)?.name || "Детали барбера"
              }, {
                body: withCtx(() => [
                  unref(selectedBarber) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(detailMetrics), (metric) => {
                        return openBlock(), createBlock("div", {
                          key: metric.label,
                          class: "rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-4"
                        }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, toDisplayString(metric.label), 1),
                          createVNode("p", { class: "mt-3 text-2xl font-semibold text-charcoal-950" }, toDisplayString(metric.value), 1),
                          createVNode("p", { class: "mt-2 text-sm leading-6 text-charcoal-500" }, toDisplayString(metric.description), 1)
                        ]);
                      }), 128))
                    ]),
                    unref(detailError) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    }, toDisplayString(unref(detailError)), 1)) : createCommentVNode("", true),
                    unref(detailPending) ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-5 text-sm text-charcoal-500"
                    }, " Загружаю детальную статистику барбера... ")) : createCommentVNode("", true),
                    createVNode("div", { class: "grid gap-4 lg:grid-cols-[0.95fr_1.05fr]" }, [
                      createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-5" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, " Профиль "),
                        createVNode("div", { class: "mt-4 space-y-3" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(detailFacts), (fact) => {
                            return openBlock(), createBlock("div", {
                              key: fact.label,
                              class: "flex items-start justify-between gap-4 border-b border-charcoal-100 pb-3 last:border-b-0 last:pb-0"
                            }, [
                              createVNode("span", { class: "text-sm text-charcoal-500" }, toDisplayString(fact.label), 1),
                              createVNode("span", { class: "text-right text-sm font-medium text-charcoal-950" }, toDisplayString(fact.value), 1)
                            ]);
                          }), 128))
                        ])
                      ]),
                      createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-5" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, " Дополнительные метрики "),
                        unref(extraDetailRows).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "mt-4 space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(extraDetailRows), ([key, value]) => {
                            return openBlock(), createBlock("div", {
                              key,
                              class: "rounded-[1rem] border border-charcoal-100 bg-charcoal-50/60 px-4 py-3"
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
                        ])) : (openBlock(), createBlock("p", {
                          key: 1,
                          class: "mt-4 text-sm leading-6 text-charcoal-500"
                        }, " API статистики не вернул дополнительных простых метрик сверх выручки, заказов и процента выполнения. "))
                      ])
                    ])
                  ])) : createCommentVNode("", true)
                ]),
                footer: withCtx(({ close }) => [
                  createVNode("div", { class: "flex w-full flex-wrap items-center justify-between gap-3" }, [
                    createVNode("p", { class: "text-sm text-charcoal-500" }, " Период: " + toDisplayString(unref(uiStore).statisticsRange.start) + " - " + toDisplayString(unref(uiStore).statisticsRange.end), 1),
                    createVNode("div", { class: "flex flex-wrap justify-end gap-3" }, [
                      createVNode(_component_UButton, {
                        color: "neutral",
                        icon: "i-lucide-refresh-cw",
                        loading: unref(detailPending),
                        variant: "outline",
                        onClick: ($event) => unref(selectedBarber) && loadBarberDetails(unref(selectedBarber))
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Обновить детали ")
                        ]),
                        _: 1
                      }, 8, ["loading", "onClick"]),
                      createVNode(_component_UButton, {
                        color: "neutral",
                        variant: "ghost",
                        onClick: close
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Закрыть ")
                        ]),
                        _: 1
                      }, 8, ["onClick"])
                    ])
                  ])
                ]),
                _: 1
              }, 8, ["open", "onUpdate:open", "description", "title"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/history/barber.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/barber-BuqXy9IX');
//# sourceMappingURL=barber-BuqXy9IX.mjs.map
