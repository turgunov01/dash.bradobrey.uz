globalThis.__timing__.logStart('Load chunks/build/services-DE9hTe5v');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$b } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a, e as useApiClient } from './server.mjs';
import { _ as _sfc_main$5 } from './Badge-CKFwwagy.mjs';
import { _ as _sfc_main$1 } from './Table-2pT4H1Ma.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-DWE-z1MU.mjs';
import { _ as _sfc_main$4 } from './Tooltip-TWHZKlGH.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
import { _ as _sfc_main$6 } from './Modal-DRUXoHnR.mjs';
import { _ as _sfc_main$7 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$8 } from './Input-BrToCniw.mjs';
import { _ as _sfc_main$9 } from './Checkbox-CatD2A6h.mjs';
import { defineComponent, ref, reactive, computed, withAsyncContext, watch, mergeProps, withCtx, unref, createVNode, openBlock, createBlock, toDisplayString, createTextVNode, isRef, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrRenderAttr, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { s as serviceFormSchema } from '../_/index.mjs';
import { a as formatMoney } from './format-DDcTL-sj.mjs';
import { f as flattenServicesPayload } from './services-D0S0WuHG.mjs';
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
import './display-CyQec-Wd.mjs';

function useServicesApi() {
  const client = useApiClient();
  return {
    create(payload) {
      return client.request("/api/services", { body: payload, method: "POST", successMessage: "Услуга создана" });
    },
    detail(id) {
      return client.request(`/api/services/${id}`);
    },
    list() {
      return client.request("/api/services");
    },
    remove(id) {
      return client.request(`/api/services/${id}`, { method: "DELETE", successMessage: "Услуга удалена" });
    },
    update(id, payload) {
      return client.request(`/api/services/${id}`, { body: payload, method: "PATCH", successMessage: "Услуга обновлена" });
    }
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "services",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const servicesApi = useServicesApi();
    const serviceModalOpen = ref(false);
    const form = reactive({
      category_name: "",
      duration: 30,
      id: "",
      is_active: true,
      name: "",
      price: 0
    });
    const modalTitle = computed(
      () => form.id ? "Редактировать услугу" : "Создать новую услугу"
    );
    const modalDescription = computed(
      () => form.id ? "Обновите данные выбранной услуги." : "Заполните форму, чтобы добавить услугу в каталог."
    );
    const serviceColumns = [
      { accessorKey: "id", header: "id" },
      { accessorKey: "name", header: "name" },
      { accessorKey: "category", header: "category" },
      { accessorKey: "duration_minutes", header: "duration_minutes" },
      { accessorKey: "base_price", header: "base_price" },
      { accessorKey: "image", header: "image" },
      { accessorKey: "is_active", header: "is_active" },
      { id: "actions", header: "" }
    ];
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("services-dashboard", async () => {
      return await servicesApi.list();
    })), __temp = await __temp, __restore(), __temp);
    const serviceRows = computed(
      () => flattenServicesPayload(data.value).map((service, index) => ({
        base_price: service.base_price ?? service.price ?? 0,
        category: service.category || "Без категории",
        duration_minutes: Number(service.duration_minutes ?? service.duration ?? 0),
        id: String(service.id ?? `service-${index}`),
        image: String(service.image || "").trim() || null,
        is_active: Boolean(service.is_active ?? true),
        name: service.name || "Услуга без названия"
      })).sort((left, right) => {
        const categoryComparison = left.category.localeCompare(right.category, "ru");
        return categoryComparison !== 0 ? categoryComparison : left.name.localeCompare(right.name, "ru");
      })
    );
    watch(serviceModalOpen, (open) => {
      if (!open) {
        resetForm();
      }
    });
    function resetForm() {
      form.category_name = "";
      form.duration = 30;
      form.id = "";
      form.is_active = true;
      form.name = "";
      form.price = 0;
    }
    function openCreateModal() {
      resetForm();
      serviceModalOpen.value = true;
    }
    function startEdit(service) {
      form.category_name = service.category;
      form.duration = Number(service.duration_minutes || 0);
      form.id = String(service.id);
      form.is_active = Boolean(service.is_active ?? true);
      form.name = service.name || "";
      form.price = Number(service.base_price || 0);
      serviceModalOpen.value = true;
    }
    async function submit() {
      const payload = serviceFormSchema.safeParse({
        category_name: form.category_name || void 0,
        duration: form.duration,
        is_active: form.is_active,
        name: form.name,
        price: form.price
      });
      if (!payload.success) {
        useApiClient().notifyError(new Error(payload.error.issues[0]?.message || "Некорректные данные услуги"));
        return;
      }
      if (form.id) {
        await servicesApi.update(form.id, payload.data);
      } else {
        await servicesApi.create(payload.data);
      }
      await refresh();
      serviceModalOpen.value = false;
    }
    async function removeService(id) {
      await servicesApi.remove(id);
      await refresh();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$b;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UBadge = _sfc_main$5;
      const _component_UTable = _sfc_main$1;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_UTooltip = _sfc_main$4;
      const _component_SharedEmptyState = __nuxt_component_9;
      const _component_UModal = _sfc_main$6;
      const _component_UFormField = _sfc_main$7;
      const _component_UInput = _sfc_main$8;
      const _component_UCheckbox = _sfc_main$9;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "services" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Услуги",
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
                title: "Услуги",
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
                  _push3(`<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Единый список </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Каталог услуг </h2></div><div class="flex flex-wrap items-center gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    size: "lg",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(serviceRows).length)} услуг `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(serviceRows).length) + " услуг ", 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-plus",
                    onClick: openCreateModal
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Создать услугу `);
                      } else {
                        return [
                          createTextVNode(" Создать услугу ")
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
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Единый список "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Каталог услуг ")
                      ]),
                      createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          size: "lg",
                          variant: "soft"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(serviceRows).length) + " услуг ", 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "primary",
                          icon: "i-lucide-plus",
                          onClick: openCreateModal
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Создать услугу ")
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
                  if (unref(serviceRows).length) {
                    _push3(`<div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"${_scopeId2}><div class="max-h-[42rem] overflow-auto"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UTable, {
                      columns: serviceColumns,
                      data: unref(serviceRows),
                      loading: unref(pending),
                      sticky: "header",
                      ui: {
                        root: "w-full overflow-auto",
                        base: "w-full min-w-[88rem]",
                        thead: "bg-charcoal-50/90",
                        tbody: "divide-y divide-charcoal-100",
                        th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                        td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                      }
                    }, {
                      "id-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="font-mono text-xs text-charcoal-500"${_scopeId3}>${ssrInterpolate(row.original.id)}</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "font-mono text-xs text-charcoal-500" }, toDisplayString(row.original.id), 1)
                          ];
                        }
                      }),
                      "duration_minutes-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="font-medium"${_scopeId3}>${ssrInterpolate(row.original.duration_minutes)} мин</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "font-medium" }, toDisplayString(row.original.duration_minutes) + " мин", 1)
                          ];
                        }
                      }),
                      "base_price-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="font-medium"${_scopeId3}>${ssrInterpolate(unref(formatMoney)(row.original.base_price))}</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "font-medium" }, toDisplayString(unref(formatMoney)(row.original.base_price)), 1)
                          ];
                        }
                      }),
                      "image-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          if (row.original.image) {
                            _push4(`<a${ssrRenderAttr("href", row.original.image)} class="inline-flex items-center gap-3" rel="noreferrer" target="_blank"${_scopeId3}><img${ssrRenderAttr("alt", row.original.name)}${ssrRenderAttr("src", row.original.image)} class="size-12 rounded-xl border border-charcoal-200 object-cover"${_scopeId3}><span class="max-w-[16rem] truncate text-xs text-primary-600"${_scopeId3}>${ssrInterpolate(row.original.image)}</span></a>`);
                          } else {
                            _push4(`<span class="text-charcoal-400"${_scopeId3}>Нет изображения</span>`);
                          }
                        } else {
                          return [
                            row.original.image ? (openBlock(), createBlock("a", {
                              key: 0,
                              href: row.original.image,
                              class: "inline-flex items-center gap-3",
                              rel: "noreferrer",
                              target: "_blank"
                            }, [
                              createVNode("img", {
                                alt: row.original.name,
                                src: row.original.image,
                                class: "size-12 rounded-xl border border-charcoal-200 object-cover"
                              }, null, 8, ["alt", "src"]),
                              createVNode("span", { class: "max-w-[16rem] truncate text-xs text-primary-600" }, toDisplayString(row.original.image), 1)
                            ], 8, ["href"])) : (openBlock(), createBlock("span", {
                              key: 1,
                              class: "text-charcoal-400"
                            }, "Нет изображения"))
                          ];
                        }
                      }),
                      "is_active-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_SharedStatusBadge, {
                            label: row.original.is_active ? "active" : "inactive"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.is_active ? "active" : "inactive"
                            }, null, 8, ["label"])
                          ];
                        }
                      }),
                      "actions-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="flex justify-end gap-2"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_UTooltip, { text: "Редактировать" }, {
                            default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_UButton, {
                                  "aria-label": "Редактировать услугу",
                                  color: "neutral",
                                  icon: "i-lucide-pencil",
                                  square: "",
                                  variant: "ghost",
                                  onClick: ($event) => startEdit(row.original)
                                }, null, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_UButton, {
                                    "aria-label": "Редактировать услугу",
                                    color: "neutral",
                                    icon: "i-lucide-pencil",
                                    square: "",
                                    variant: "ghost",
                                    onClick: ($event) => startEdit(row.original)
                                  }, null, 8, ["onClick"])
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_UTooltip, { text: "Удалить" }, {
                            default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_UButton, {
                                  "aria-label": "Удалить услугу",
                                  color: "error",
                                  icon: "i-lucide-trash-2",
                                  square: "",
                                  variant: "ghost",
                                  onClick: ($event) => removeService(row.original.id)
                                }, null, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_UButton, {
                                    "aria-label": "Удалить услугу",
                                    color: "error",
                                    icon: "i-lucide-trash-2",
                                    square: "",
                                    variant: "ghost",
                                    onClick: ($event) => removeService(row.original.id)
                                  }, null, 8, ["onClick"])
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                          _push4(`</div>`);
                        } else {
                          return [
                            createVNode("div", { class: "flex justify-end gap-2" }, [
                              createVNode(_component_UTooltip, { text: "Редактировать" }, {
                                default: withCtx(() => [
                                  createVNode(_component_UButton, {
                                    "aria-label": "Редактировать услугу",
                                    color: "neutral",
                                    icon: "i-lucide-pencil",
                                    square: "",
                                    variant: "ghost",
                                    onClick: ($event) => startEdit(row.original)
                                  }, null, 8, ["onClick"])
                                ]),
                                _: 2
                              }, 1024),
                              createVNode(_component_UTooltip, { text: "Удалить" }, {
                                default: withCtx(() => [
                                  createVNode(_component_UButton, {
                                    "aria-label": "Удалить услугу",
                                    color: "error",
                                    icon: "i-lucide-trash-2",
                                    square: "",
                                    variant: "ghost",
                                    onClick: ($event) => removeService(row.original.id)
                                  }, null, 8, ["onClick"])
                                ]),
                                _: 2
                              }, 1024)
                            ])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    _push3(ssrRenderComponent(_component_SharedEmptyState, {
                      description: "Список услуг пуст или не был получен от бэкенда.",
                      icon: "i-lucide-badge-dollar-sign",
                      title: "Услуги не загружены"
                    }, null, _parent3, _scopeId2));
                  }
                } else {
                  return [
                    unref(serviceRows).length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
                    }, [
                      createVNode("div", { class: "max-h-[42rem] overflow-auto" }, [
                        createVNode(_component_UTable, {
                          columns: serviceColumns,
                          data: unref(serviceRows),
                          loading: unref(pending),
                          sticky: "header",
                          ui: {
                            root: "w-full overflow-auto",
                            base: "w-full min-w-[88rem]",
                            thead: "bg-charcoal-50/90",
                            tbody: "divide-y divide-charcoal-100",
                            th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                            td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                          }
                        }, {
                          "id-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "font-mono text-xs text-charcoal-500" }, toDisplayString(row.original.id), 1)
                          ]),
                          "duration_minutes-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "font-medium" }, toDisplayString(row.original.duration_minutes) + " мин", 1)
                          ]),
                          "base_price-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "font-medium" }, toDisplayString(unref(formatMoney)(row.original.base_price)), 1)
                          ]),
                          "image-cell": withCtx(({ row }) => [
                            row.original.image ? (openBlock(), createBlock("a", {
                              key: 0,
                              href: row.original.image,
                              class: "inline-flex items-center gap-3",
                              rel: "noreferrer",
                              target: "_blank"
                            }, [
                              createVNode("img", {
                                alt: row.original.name,
                                src: row.original.image,
                                class: "size-12 rounded-xl border border-charcoal-200 object-cover"
                              }, null, 8, ["alt", "src"]),
                              createVNode("span", { class: "max-w-[16rem] truncate text-xs text-primary-600" }, toDisplayString(row.original.image), 1)
                            ], 8, ["href"])) : (openBlock(), createBlock("span", {
                              key: 1,
                              class: "text-charcoal-400"
                            }, "Нет изображения"))
                          ]),
                          "is_active-cell": withCtx(({ row }) => [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.is_active ? "active" : "inactive"
                            }, null, 8, ["label"])
                          ]),
                          "actions-cell": withCtx(({ row }) => [
                            createVNode("div", { class: "flex justify-end gap-2" }, [
                              createVNode(_component_UTooltip, { text: "Редактировать" }, {
                                default: withCtx(() => [
                                  createVNode(_component_UButton, {
                                    "aria-label": "Редактировать услугу",
                                    color: "neutral",
                                    icon: "i-lucide-pencil",
                                    square: "",
                                    variant: "ghost",
                                    onClick: ($event) => startEdit(row.original)
                                  }, null, 8, ["onClick"])
                                ]),
                                _: 2
                              }, 1024),
                              createVNode(_component_UTooltip, { text: "Удалить" }, {
                                default: withCtx(() => [
                                  createVNode(_component_UButton, {
                                    "aria-label": "Удалить услугу",
                                    color: "error",
                                    icon: "i-lucide-trash-2",
                                    square: "",
                                    variant: "ghost",
                                    onClick: ($event) => removeService(row.original.id)
                                  }, null, 8, ["onClick"])
                                ]),
                                _: 2
                              }, 1024)
                            ])
                          ]),
                          _: 1
                        }, 8, ["data", "loading"])
                      ])
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Список услуг пуст или не был получен от бэкенда.",
                      icon: "i-lucide-badge-dollar-sign",
                      title: "Услуги не загружены"
                    }))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UModal, {
              open: unref(serviceModalOpen),
              "onUpdate:open": ($event) => isRef(serviceModalOpen) ? serviceModalOpen.value = $event : null,
              class: "sm:max-w-xl",
              description: unref(modalDescription),
              title: unref(modalTitle)
            }, {
              body: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Название услуги" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).name,
                          "onUpdate:modelValue": ($event) => unref(form).name = $event
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).name,
                            "onUpdate:modelValue": ($event) => unref(form).name = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Название категории" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).category_name,
                          "onUpdate:modelValue": ($event) => unref(form).category_name = $event,
                          placeholder: "Стрижки, бритье, окрашивание"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).category_name,
                            "onUpdate:modelValue": ($event) => unref(form).category_name = $event,
                            placeholder: "Стрижки, бритье, окрашивание"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`<div class="grid gap-4 sm:grid-cols-2"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Длительность" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).duration,
                          "onUpdate:modelValue": ($event) => unref(form).duration = $event,
                          type: "number"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).duration,
                            "onUpdate:modelValue": ($event) => unref(form).duration = $event,
                            type: "number"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Цена" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).price,
                          "onUpdate:modelValue": ($event) => unref(form).price = $event,
                          type: "number"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).price,
                            "onUpdate:modelValue": ($event) => unref(form).price = $event,
                            type: "number"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                  _push3(ssrRenderComponent(_component_UCheckbox, {
                    modelValue: unref(form).is_active,
                    "onUpdate:modelValue": ($event) => unref(form).is_active = $event,
                    label: "Услуга активна"
                  }, null, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode(_component_UFormField, { label: "Название услуги" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).name,
                            "onUpdate:modelValue": ($event) => unref(form).name = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Название категории" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).category_name,
                            "onUpdate:modelValue": ($event) => unref(form).category_name = $event,
                            placeholder: "Стрижки, бритье, окрашивание"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode("div", { class: "grid gap-4 sm:grid-cols-2" }, [
                        createVNode(_component_UFormField, { label: "Длительность" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(form).duration,
                              "onUpdate:modelValue": ($event) => unref(form).duration = $event,
                              type: "number"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Цена" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(form).price,
                              "onUpdate:modelValue": ($event) => unref(form).price = $event,
                              type: "number"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        })
                      ]),
                      createVNode(_component_UCheckbox, {
                        modelValue: unref(form).is_active,
                        "onUpdate:modelValue": ($event) => unref(form).is_active = $event,
                        label: "Услуга активна"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ])
                  ];
                }
              }),
              footer: withCtx(({ close }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex w-full flex-wrap justify-end gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    variant: "outline",
                    onClick: resetForm
                  }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Сбросить `);
                      } else {
                        return [
                          createTextVNode(" Сбросить ")
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
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-save",
                    onClick: submit
                  }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(form).id ? "Обновить услугу" : "Создать услугу")}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(form).id ? "Обновить услугу" : "Создать услугу"), 1)
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex w-full flex-wrap justify-end gap-3" }, [
                      createVNode(_component_UButton, {
                        color: "neutral",
                        variant: "outline",
                        onClick: resetForm
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Сбросить ")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "neutral",
                        variant: "ghost",
                        onClick: close
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Закрыть ")
                        ]),
                        _: 1
                      }, 8, ["onClick"]),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-save",
                        onClick: submit
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(form).id ? "Обновить услугу" : "Создать услугу"), 1)
                        ]),
                        _: 1
                      })
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
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Единый список "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Каталог услуг ")
                    ]),
                    createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                      createVNode(_component_UBadge, {
                        color: "neutral",
                        size: "lg",
                        variant: "soft"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(serviceRows).length) + " услуг ", 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-plus",
                        onClick: openCreateModal
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Создать услугу ")
                        ]),
                        _: 1
                      })
                    ])
                  ])
                ]),
                default: withCtx(() => [
                  unref(serviceRows).length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
                  }, [
                    createVNode("div", { class: "max-h-[42rem] overflow-auto" }, [
                      createVNode(_component_UTable, {
                        columns: serviceColumns,
                        data: unref(serviceRows),
                        loading: unref(pending),
                        sticky: "header",
                        ui: {
                          root: "w-full overflow-auto",
                          base: "w-full min-w-[88rem]",
                          thead: "bg-charcoal-50/90",
                          tbody: "divide-y divide-charcoal-100",
                          th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                          td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                        }
                      }, {
                        "id-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "font-mono text-xs text-charcoal-500" }, toDisplayString(row.original.id), 1)
                        ]),
                        "duration_minutes-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "font-medium" }, toDisplayString(row.original.duration_minutes) + " мин", 1)
                        ]),
                        "base_price-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "font-medium" }, toDisplayString(unref(formatMoney)(row.original.base_price)), 1)
                        ]),
                        "image-cell": withCtx(({ row }) => [
                          row.original.image ? (openBlock(), createBlock("a", {
                            key: 0,
                            href: row.original.image,
                            class: "inline-flex items-center gap-3",
                            rel: "noreferrer",
                            target: "_blank"
                          }, [
                            createVNode("img", {
                              alt: row.original.name,
                              src: row.original.image,
                              class: "size-12 rounded-xl border border-charcoal-200 object-cover"
                            }, null, 8, ["alt", "src"]),
                            createVNode("span", { class: "max-w-[16rem] truncate text-xs text-primary-600" }, toDisplayString(row.original.image), 1)
                          ], 8, ["href"])) : (openBlock(), createBlock("span", {
                            key: 1,
                            class: "text-charcoal-400"
                          }, "Нет изображения"))
                        ]),
                        "is_active-cell": withCtx(({ row }) => [
                          createVNode(_component_SharedStatusBadge, {
                            label: row.original.is_active ? "active" : "inactive"
                          }, null, 8, ["label"])
                        ]),
                        "actions-cell": withCtx(({ row }) => [
                          createVNode("div", { class: "flex justify-end gap-2" }, [
                            createVNode(_component_UTooltip, { text: "Редактировать" }, {
                              default: withCtx(() => [
                                createVNode(_component_UButton, {
                                  "aria-label": "Редактировать услугу",
                                  color: "neutral",
                                  icon: "i-lucide-pencil",
                                  square: "",
                                  variant: "ghost",
                                  onClick: ($event) => startEdit(row.original)
                                }, null, 8, ["onClick"])
                              ]),
                              _: 2
                            }, 1024),
                            createVNode(_component_UTooltip, { text: "Удалить" }, {
                              default: withCtx(() => [
                                createVNode(_component_UButton, {
                                  "aria-label": "Удалить услугу",
                                  color: "error",
                                  icon: "i-lucide-trash-2",
                                  square: "",
                                  variant: "ghost",
                                  onClick: ($event) => removeService(row.original.id)
                                }, null, 8, ["onClick"])
                              ]),
                              _: 2
                            }, 1024)
                          ])
                        ]),
                        _: 1
                      }, 8, ["data", "loading"])
                    ])
                  ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                    key: 1,
                    description: "Список услуг пуст или не был получен от бэкенда.",
                    icon: "i-lucide-badge-dollar-sign",
                    title: "Услуги не загружены"
                  }))
                ]),
                _: 1
              }),
              createVNode(_component_UModal, {
                open: unref(serviceModalOpen),
                "onUpdate:open": ($event) => isRef(serviceModalOpen) ? serviceModalOpen.value = $event : null,
                class: "sm:max-w-xl",
                description: unref(modalDescription),
                title: unref(modalTitle)
              }, {
                body: withCtx(() => [
                  createVNode("div", { class: "space-y-4" }, [
                    createVNode(_component_UFormField, { label: "Название услуги" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(form).name,
                          "onUpdate:modelValue": ($event) => unref(form).name = $event
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UFormField, { label: "Название категории" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(form).category_name,
                          "onUpdate:modelValue": ($event) => unref(form).category_name = $event,
                          placeholder: "Стрижки, бритье, окрашивание"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode("div", { class: "grid gap-4 sm:grid-cols-2" }, [
                      createVNode(_component_UFormField, { label: "Длительность" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).duration,
                            "onUpdate:modelValue": ($event) => unref(form).duration = $event,
                            type: "number"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Цена" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).price,
                            "onUpdate:modelValue": ($event) => unref(form).price = $event,
                            type: "number"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      })
                    ]),
                    createVNode(_component_UCheckbox, {
                      modelValue: unref(form).is_active,
                      "onUpdate:modelValue": ($event) => unref(form).is_active = $event,
                      label: "Услуга активна"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ])
                ]),
                footer: withCtx(({ close }) => [
                  createVNode("div", { class: "flex w-full flex-wrap justify-end gap-3" }, [
                    createVNode(_component_UButton, {
                      color: "neutral",
                      variant: "outline",
                      onClick: resetForm
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Сбросить ")
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UButton, {
                      color: "neutral",
                      variant: "ghost",
                      onClick: close
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Закрыть ")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_UButton, {
                      color: "primary",
                      icon: "i-lucide-save",
                      onClick: submit
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(form).id ? "Обновить услугу" : "Создать услугу"), 1)
                      ]),
                      _: 1
                    })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/services.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/services-DE9hTe5v');
//# sourceMappingURL=services-DE9hTe5v.mjs.map
