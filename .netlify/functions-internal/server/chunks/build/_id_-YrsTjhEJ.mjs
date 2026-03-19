globalThis.__timing__.logStart('Load chunks/build/_id_-YrsTjhEJ');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$6 } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { u as useRoute, a as useBarbersApi, b as useAsyncData, _ as _sfc_main$2$1, c as _sfc_main$3, d as _sfc_main$a, e as useApiClient } from './server.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-DWE-z1MU.mjs';
import { _ as _sfc_main$1 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$4 } from './Input-BrToCniw.mjs';
import { _ as _sfc_main$5 } from './SelectMenu-BfkNXmwg.mjs';
import { _ as __nuxt_component_10 } from './JsonBlock-DvPUbwNJ.mjs';
import { defineComponent, computed, reactive, withAsyncContext, watch, mergeProps, withCtx, unref, createTextVNode, openBlock, createBlock, createVNode, toDisplayString, createCommentVNode, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { q as queueUpdateSchema, a as queueEditBeforeCompleteSchema } from '../_/index.mjs';
import { f as formatDateTime, a as formatMoney } from './format-DDcTL-sj.mjs';
import { f as formatPaymentMethod } from './display-CyQec-Wd.mjs';
import { f as flattenServicesPayload } from './services-D0S0WuHG.mjs';
import { u as useKioskApi } from './useKioskApi-l3XfHmhL.mjs';
import './Badge-CKFwwagy.mjs';
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
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const barbersApi = useBarbersApi();
    const kioskApi = useKioskApi();
    const queueId = computed(() => String(route.params.id));
    const updateForm = reactive({
      payment_method: "",
      service_ids: [],
      status: ""
    });
    const overrideForm = reactive({
      amount: 0,
      reason: ""
    });
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("barber-queue-detail", async () => {
      const [detail, services] = await Promise.all([
        barbersApi.queueItem(queueId.value, { silent: true }),
        kioskApi.services({ active: true, grouped: true })
      ]);
      return {
        detail,
        services
      };
    }, {
      watch: [queueId]
    })), __temp = await __temp, __restore(), __temp);
    const queueItem = computed(() => data.value?.detail?.data || null);
    const queueStatusCode = computed(() => data.value?.detail?.status || 200);
    const flatServices = computed(() => flattenServicesPayload(data.value?.services));
    const serviceOptions = computed(
      () => flatServices.value.map((service) => ({
        label: `${service.name || "Услуга без названия"}${service.category ? ` / ${service.category}` : ""}`,
        value: String(service.id)
      }))
    );
    watch(
      queueItem,
      (item) => {
        updateForm.status = item?.status || "";
        updateForm.payment_method = item?.payment_method || "";
        updateForm.service_ids = Array.isArray(item?.service_ids) ? item.service_ids.map((value) => String(value)) : item?.service_id ? [String(item.service_id)] : [];
        overrideForm.amount = Number(item?.price_override ?? item?.amount ?? 0);
        overrideForm.reason = item?.price_override_reason || "";
      },
      { immediate: true }
    );
    async function submitUpdate() {
      const payload = queueUpdateSchema.safeParse({
        payment_method: updateForm.payment_method || void 0,
        service_ids: updateForm.service_ids.length ? updateForm.service_ids : void 0,
        status: updateForm.status || void 0
      });
      if (!payload.success) {
        useApiClient().notifyError(new Error(payload.error.issues[0]?.message || "Некорректное обновление очереди"));
        return;
      }
      await barbersApi.updateQueue(queueId.value, payload.data);
      await refresh();
    }
    async function saveOverride() {
      const payload = queueEditBeforeCompleteSchema.safeParse(overrideForm);
      if (!payload.success) {
        useApiClient().notifyError(new Error(payload.error.issues[0]?.message || "Некорректная корректировка перед завершением"));
        return;
      }
      await barbersApi.updateQueueBeforeComplete(queueId.value, payload.data);
      await refresh();
    }
    async function callEntry() {
      await barbersApi.callQueue(queueId.value);
      await refresh();
    }
    async function startEntry() {
      await barbersApi.startQueue(queueId.value);
      await refresh();
    }
    async function completeEntry() {
      await barbersApi.completeQueue(queueId.value);
      await refresh();
    }
    async function markNoShow() {
      await barbersApi.updateQueueNoShow(queueId.value, { no_show: true });
      await refresh();
    }
    async function markNotInTime() {
      await barbersApi.updateQueueNotInTime(queueId.value);
      await refresh();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$6;
      const _component_UButton = _sfc_main$a;
      const _component_UAlert = _sfc_main$2$1;
      const _component_UCard = _sfc_main$3;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_UFormField = _sfc_main$1;
      const _component_UInput = _sfc_main$4;
      const _component_USelectMenu = _sfc_main$5;
      const _component_SharedJsonBlock = __nuxt_component_10;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "queue-detail" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: unref(queueItem)?.customer_name || `Запись очереди ${unref(queueId)}`,
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
                    icon: "i-lucide-arrow-left",
                    to: "/barbers/workspace",
                    variant: "outline"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Назад `);
                      } else {
                        return [
                          createTextVNode(" Назад ")
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
                    createVNode(_component_UButton, {
                      color: "neutral",
                      icon: "i-lucide-arrow-left",
                      to: "/barbers/workspace",
                      variant: "outline"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Назад ")
                      ]),
                      _: 1
                    }),
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
                title: unref(queueItem)?.customer_name || `Запись очереди ${unref(queueId)}`,
                ui: { right: "gap-3" }
              }, {
                leading: withCtx(() => [
                  createVNode(_component_UDashboardSidebarCollapse)
                ]),
                right: withCtx(() => [
                  createVNode(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-arrow-left",
                    to: "/barbers/workspace",
                    variant: "outline"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Назад ")
                    ]),
                    _: 1
                  }),
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
              }, 8, ["title"])
            ];
          }
        }),
        body: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}>`);
            if (unref(queueStatusCode) === 209) {
              _push2(ssrRenderComponent(_component_UAlert, {
                color: "warning",
                icon: "i-lucide-badge-alert",
                title: "Завершенная запись очереди",
                description: "Бэкенд вернул HTTP 209 для этой записи. Просмотр деталей остается доступным, но запись уже завершена.",
                variant: "soft"
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Сводка по очереди </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Отслеживание текущего визита </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Сводка по очереди "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Отслеживание текущего визита ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(queueItem)) {
                    _push3(`<div class="grid gap-3 sm:grid-cols-2"${_scopeId2}><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>Статус</p><div class="mt-3"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_SharedStatusBadge, {
                      label: unref(queueItem).status
                    }, null, _parent3, _scopeId2));
                    _push3(`</div></div><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>Оплата</p><p class="mt-3 text-lg font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatPaymentMethod)(unref(queueItem).payment_method))}</p></div><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>Создано</p><p class="mt-3 text-lg font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatDateTime)(unref(queueItem).created_at))}</p></div><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>Сумма</p><p class="mt-3 text-lg font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(unref(queueItem).amount))}</p></div></div>`);
                  } else {
                    _push3(`<!---->`);
                  }
                  _push3(`<div class="mt-5 flex flex-wrap gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-phone-call",
                    variant: "outline",
                    onClick: callEntry
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Вызвать `);
                      } else {
                        return [
                          createTextVNode(" Вызвать ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-play",
                    variant: "outline",
                    onClick: startEntry
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Начать `);
                      } else {
                        return [
                          createTextVNode(" Начать ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-check-check",
                    onClick: completeEntry
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Завершить `);
                      } else {
                        return [
                          createTextVNode(" Завершить ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    unref(queueItem) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "grid gap-3 sm:grid-cols-2"
                    }, [
                      createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Статус"),
                        createVNode("div", { class: "mt-3" }, [
                          createVNode(_component_SharedStatusBadge, {
                            label: unref(queueItem).status
                          }, null, 8, ["label"])
                        ])
                      ]),
                      createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Оплата"),
                        createVNode("p", { class: "mt-3 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(formatPaymentMethod)(unref(queueItem).payment_method)), 1)
                      ]),
                      createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Создано"),
                        createVNode("p", { class: "mt-3 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(formatDateTime)(unref(queueItem).created_at)), 1)
                      ]),
                      createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Сумма"),
                        createVNode("p", { class: "mt-3 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(unref(queueItem).amount)), 1)
                      ])
                    ])) : createCommentVNode("", true),
                    createVNode("div", { class: "mt-5 flex flex-wrap gap-3" }, [
                      createVNode(_component_UButton, {
                        color: "neutral",
                        icon: "i-lucide-phone-call",
                        variant: "outline",
                        onClick: callEntry
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Вызвать ")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-play",
                        variant: "outline",
                        onClick: startEntry
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Начать ")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-check-check",
                        onClick: completeEntry
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Завершить ")
                        ]),
                        _: 1
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
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Обновление </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Изменение услуг и статуса </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Обновление "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Изменение услуг и статуса ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-5"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Статус" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(updateForm).status,
                          "onUpdate:modelValue": ($event) => unref(updateForm).status = $event,
                          placeholder: "ожидает, начато, завершено"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(updateForm).status,
                            "onUpdate:modelValue": ($event) => unref(updateForm).status = $event,
                            placeholder: "ожидает, начато, завершено"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Способ оплаты" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(updateForm).payment_method,
                          "onUpdate:modelValue": ($event) => unref(updateForm).payment_method = $event,
                          placeholder: "наличные, карта, сертификат"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(updateForm).payment_method,
                            "onUpdate:modelValue": ($event) => unref(updateForm).payment_method = $event,
                            placeholder: "наличные, карта, сертификат"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Услуги" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_USelectMenu, {
                          modelValue: unref(updateForm).service_ids,
                          "onUpdate:modelValue": ($event) => unref(updateForm).service_ids = $event,
                          class: "w-full",
                          items: unref(serviceOptions),
                          multiple: "",
                          placeholder: "Выберите одну или несколько услуг",
                          "value-key": "value"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(updateForm).service_ids,
                            "onUpdate:modelValue": ($event) => unref(updateForm).service_ids = $event,
                            class: "w-full",
                            items: unref(serviceOptions),
                            multiple: "",
                            placeholder: "Выберите одну или несколько услуг",
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`<div class="flex justify-end"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-save",
                    onClick: submitUpdate
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Сохранить изменения очереди `);
                      } else {
                        return [
                          createTextVNode(" Сохранить изменения очереди ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div><div class="rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500"${_scopeId2}> Редактирование перед завершением </p><div class="mt-4 grid gap-4 sm:grid-cols-[0.45fr_0.55fr]"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Корректировка суммы" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(overrideForm).amount,
                          "onUpdate:modelValue": ($event) => unref(overrideForm).amount = $event,
                          type: "number"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(overrideForm).amount,
                            "onUpdate:modelValue": ($event) => unref(overrideForm).amount = $event,
                            type: "number"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Причина" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(overrideForm).reason,
                          "onUpdate:modelValue": ($event) => unref(overrideForm).reason = $event,
                          placeholder: "Причина корректировки"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(overrideForm).reason,
                            "onUpdate:modelValue": ($event) => unref(overrideForm).reason = $event,
                            placeholder: "Причина корректировки"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div><div class="mt-4 flex justify-end"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-pencil-line",
                    variant: "outline",
                    onClick: saveOverride
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Сохранить корректировку `);
                      } else {
                        return [
                          createTextVNode(" Сохранить корректировку ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div></div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-5" }, [
                      createVNode(_component_UFormField, { label: "Статус" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(updateForm).status,
                            "onUpdate:modelValue": ($event) => unref(updateForm).status = $event,
                            placeholder: "ожидает, начато, завершено"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Способ оплаты" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(updateForm).payment_method,
                            "onUpdate:modelValue": ($event) => unref(updateForm).payment_method = $event,
                            placeholder: "наличные, карта, сертификат"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Услуги" }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(updateForm).service_ids,
                            "onUpdate:modelValue": ($event) => unref(updateForm).service_ids = $event,
                            class: "w-full",
                            items: unref(serviceOptions),
                            multiple: "",
                            placeholder: "Выберите одну или несколько услуг",
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ]),
                        _: 1
                      }),
                      createVNode("div", { class: "flex justify-end" }, [
                        createVNode(_component_UButton, {
                          color: "primary",
                          icon: "i-lucide-save",
                          onClick: submitUpdate
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Сохранить изменения очереди ")
                          ]),
                          _: 1
                        })
                      ]),
                      createVNode("div", { class: "rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, " Редактирование перед завершением "),
                        createVNode("div", { class: "mt-4 grid gap-4 sm:grid-cols-[0.45fr_0.55fr]" }, [
                          createVNode(_component_UFormField, { label: "Корректировка суммы" }, {
                            default: withCtx(() => [
                              createVNode(_component_UInput, {
                                modelValue: unref(overrideForm).amount,
                                "onUpdate:modelValue": ($event) => unref(overrideForm).amount = $event,
                                type: "number"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_UFormField, { label: "Причина" }, {
                            default: withCtx(() => [
                              createVNode(_component_UInput, {
                                modelValue: unref(overrideForm).reason,
                                "onUpdate:modelValue": ($event) => unref(overrideForm).reason = $event,
                                placeholder: "Причина корректировки"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          })
                        ]),
                        createVNode("div", { class: "mt-4 flex justify-end" }, [
                          createVNode(_component_UButton, {
                            color: "neutral",
                            icon: "i-lucide-pencil-line",
                            variant: "outline",
                            onClick: saveOverride
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Сохранить корректировку ")
                            ]),
                            _: 1
                          })
                        ])
                      ])
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Флаги </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Нестандартные исходы </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Флаги "),
                      createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Нестандартные исходы ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    block: "",
                    color: "warning",
                    icon: "i-lucide-user-round-x",
                    variant: "outline",
                    onClick: markNotInTime
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Отметить как не вовремя `);
                      } else {
                        return [
                          createTextVNode(" Отметить как не вовремя ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    block: "",
                    color: "error",
                    icon: "i-lucide-ban",
                    variant: "outline",
                    onClick: markNoShow
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Отметить как неявку `);
                      } else {
                        return [
                          createTextVNode(" Отметить как неявку ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode(_component_UButton, {
                        block: "",
                        color: "warning",
                        icon: "i-lucide-user-round-x",
                        variant: "outline",
                        onClick: markNotInTime
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Отметить как не вовремя ")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        block: "",
                        color: "error",
                        icon: "i-lucide-ban",
                        variant: "outline",
                        onClick: markNoShow
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Отметить как неявку ")
                        ]),
                        _: 1
                      })
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_SharedJsonBlock, {
              label: "Сырые данные очереди",
              value: unref(queueItem) || {}
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                unref(queueStatusCode) === 209 ? (openBlock(), createBlock(_component_UAlert, {
                  key: 0,
                  color: "warning",
                  icon: "i-lucide-badge-alert",
                  title: "Завершенная запись очереди",
                  description: "Бэкенд вернул HTTP 209 для этой записи. Просмотр деталей остается доступным, но запись уже завершена.",
                  variant: "soft"
                })) : createCommentVNode("", true),
                createVNode("div", { class: "grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" }, [
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Сводка по очереди "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Отслеживание текущего визита ")
                      ])
                    ]),
                    default: withCtx(() => [
                      unref(queueItem) ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "grid gap-3 sm:grid-cols-2"
                      }, [
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Статус"),
                          createVNode("div", { class: "mt-3" }, [
                            createVNode(_component_SharedStatusBadge, {
                              label: unref(queueItem).status
                            }, null, 8, ["label"])
                          ])
                        ]),
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Оплата"),
                          createVNode("p", { class: "mt-3 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(formatPaymentMethod)(unref(queueItem).payment_method)), 1)
                        ]),
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Создано"),
                          createVNode("p", { class: "mt-3 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(formatDateTime)(unref(queueItem).created_at)), 1)
                        ]),
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Сумма"),
                          createVNode("p", { class: "mt-3 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(unref(queueItem).amount)), 1)
                        ])
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "mt-5 flex flex-wrap gap-3" }, [
                        createVNode(_component_UButton, {
                          color: "neutral",
                          icon: "i-lucide-phone-call",
                          variant: "outline",
                          onClick: callEntry
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Вызвать ")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "primary",
                          icon: "i-lucide-play",
                          variant: "outline",
                          onClick: startEntry
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Начать ")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "primary",
                          icon: "i-lucide-check-check",
                          onClick: completeEntry
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Завершить ")
                          ]),
                          _: 1
                        })
                      ])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Обновление "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Изменение услуг и статуса ")
                      ])
                    ]),
                    default: withCtx(() => [
                      createVNode("div", { class: "space-y-5" }, [
                        createVNode(_component_UFormField, { label: "Статус" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(updateForm).status,
                              "onUpdate:modelValue": ($event) => unref(updateForm).status = $event,
                              placeholder: "ожидает, начато, завершено"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Способ оплаты" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(updateForm).payment_method,
                              "onUpdate:modelValue": ($event) => unref(updateForm).payment_method = $event,
                              placeholder: "наличные, карта, сертификат"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Услуги" }, {
                          default: withCtx(() => [
                            createVNode(_component_USelectMenu, {
                              modelValue: unref(updateForm).service_ids,
                              "onUpdate:modelValue": ($event) => unref(updateForm).service_ids = $event,
                              class: "w-full",
                              items: unref(serviceOptions),
                              multiple: "",
                              placeholder: "Выберите одну или несколько услуг",
                              "value-key": "value"
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                          ]),
                          _: 1
                        }),
                        createVNode("div", { class: "flex justify-end" }, [
                          createVNode(_component_UButton, {
                            color: "primary",
                            icon: "i-lucide-save",
                            onClick: submitUpdate
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Сохранить изменения очереди ")
                            ]),
                            _: 1
                          })
                        ]),
                        createVNode("div", { class: "rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500" }, " Редактирование перед завершением "),
                          createVNode("div", { class: "mt-4 grid gap-4 sm:grid-cols-[0.45fr_0.55fr]" }, [
                            createVNode(_component_UFormField, { label: "Корректировка суммы" }, {
                              default: withCtx(() => [
                                createVNode(_component_UInput, {
                                  modelValue: unref(overrideForm).amount,
                                  "onUpdate:modelValue": ($event) => unref(overrideForm).amount = $event,
                                  type: "number"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_UFormField, { label: "Причина" }, {
                              default: withCtx(() => [
                                createVNode(_component_UInput, {
                                  modelValue: unref(overrideForm).reason,
                                  "onUpdate:modelValue": ($event) => unref(overrideForm).reason = $event,
                                  placeholder: "Причина корректировки"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"])
                              ]),
                              _: 1
                            })
                          ]),
                          createVNode("div", { class: "mt-4 flex justify-end" }, [
                            createVNode(_component_UButton, {
                              color: "neutral",
                              icon: "i-lucide-pencil-line",
                              variant: "outline",
                              onClick: saveOverride
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Сохранить корректировку ")
                              ]),
                              _: 1
                            })
                          ])
                        ])
                      ])
                    ]),
                    _: 1
                  })
                ]),
                createVNode("div", { class: "grid gap-6 xl:grid-cols-[0.7fr_1.3fr]" }, [
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Флаги "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Нестандартные исходы ")
                      ])
                    ]),
                    default: withCtx(() => [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode(_component_UButton, {
                          block: "",
                          color: "warning",
                          icon: "i-lucide-user-round-x",
                          variant: "outline",
                          onClick: markNotInTime
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Отметить как не вовремя ")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          block: "",
                          color: "error",
                          icon: "i-lucide-ban",
                          variant: "outline",
                          onClick: markNoShow
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Отметить как неявку ")
                          ]),
                          _: 1
                        })
                      ])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_SharedJsonBlock, {
                    label: "Сырые данные очереди",
                    value: unref(queueItem) || {}
                  }, null, 8, ["value"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/barbers/queue/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/_id_-YrsTjhEJ');
//# sourceMappingURL=_id_-YrsTjhEJ.mjs.map
