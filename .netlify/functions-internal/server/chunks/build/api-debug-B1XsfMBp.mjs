globalThis.__timing__.logStart('Load chunks/build/api-debug-B1XsfMBp');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$7 } from './DashboardSidebarCollapse-DfgO2fN5.mjs';
import { u as useRoute, e as useApiClient, g as useUiStore, c as _sfc_main$3, d as _sfc_main$a } from './server.mjs';
import { _ as _sfc_main$1 } from './FormField-CfjXEpv-.mjs';
import { _ as _sfc_main$4 } from './SelectMenu-9fuPONhl.mjs';
import { _ as _sfc_main$5 } from './Input-DcPP1NGC.mjs';
import { _ as _sfc_main$6 } from './Textarea-DeTQfUen.mjs';
import { _ as __nuxt_component_10 } from './JsonBlock-DvPUbwNJ.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-CYCC6qth.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
import { defineComponent, withAsyncContext, computed, ref, reactive, watch, mergeProps, withCtx, unref, isRef, createVNode, createTextVNode, openBlock, createBlock, Fragment, renderList, toDisplayString, createCommentVNode, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/server-renderer/index.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import './Badge-CHxj5N7w.mjs';
import './index-qsfWWCYt.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
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
import './display-CyQec-Wd.mjs';
import '../_/index.mjs';
import './useKioskApi-l3XfHmhL.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "api-debug",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const apiClient = useApiClient();
    const uiStore = useUiStore();
    const branchStore = useBranchStore();
    [__temp, __restore] = withAsyncContext(() => branchStore.ensureLoaded()), await __temp, __restore();
    const presets = computed(() => [
      { body: "", label: "Проверка API", method: "GET", path: "/api/health", value: "health" },
      { body: "", label: "Конфиг киоска", method: "GET", path: "/api/kiosk/config", value: "kiosk-config" },
      { body: "", label: "Профиль барбера", method: "GET", path: "/api/barbers/me", value: "barber-me" },
      { body: "", label: "Активная очередь", method: "GET", path: "/api/barbers/queue", value: "queue" },
      { body: "", label: "Услуги", method: "GET", path: "/api/services", value: "services" },
      { body: "", label: "Статистика", method: "GET", path: "/api/statistics", value: "statistics" },
      { body: '{"code":"TEST"}', label: "Проверка промокода", method: "POST", path: "/api/promo-code/validate", value: "promo-validate" },
      { body: '{"code":"CERT-001"}', label: "Проверка сертификата", method: "GET", path: "/api/kiosk/certificate/CERT-001", value: "certificate" }
    ]);
    const selectedPreset = ref(String(route.query.preset || presets.value[0]?.value || "health"));
    const form = reactive({
      body: "",
      method: "GET",
      path: "/api/health"
    });
    const result = ref(null);
    watch(
      selectedPreset,
      (presetValue) => {
        const preset = presets.value.find((item) => item.value === presetValue);
        if (!preset) {
          return;
        }
        form.body = preset.body;
        form.method = preset.method;
        form.path = preset.path;
      },
      { immediate: true }
    );
    async function executeRequest() {
      let body;
      if (form.body.trim()) {
        try {
          body = JSON.parse(form.body);
        } catch {
          apiClient.notifyError(new Error("Тело запроса должно быть валидным JSON"));
          return;
        }
      }
      const response = await apiClient.rawRequest(form.path, {
        body,
        method: form.method
      });
      result.value = {
        headers: Object.fromEntries(response.headers.entries()),
        payload: response.data,
        status: response.status
      };
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$7;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UFormField = _sfc_main$1;
      const _component_USelectMenu = _sfc_main$4;
      const _component_UInput = _sfc_main$5;
      const _component_UTextarea = _sfc_main$6;
      const _component_SharedJsonBlock = __nuxt_component_10;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_SharedEmptyState = __nuxt_component_9;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "api-debug" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Отладка API",
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
                    icon: "i-lucide-trash-2",
                    variant: "outline",
                    onClick: ($event) => unref(uiStore).clearDebug()
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Очистить лог `);
                      } else {
                        return [
                          createTextVNode(" Очистить лог ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UButton, {
                      color: "neutral",
                      icon: "i-lucide-trash-2",
                      variant: "outline",
                      onClick: ($event) => unref(uiStore).clearDebug()
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Очистить лог ")
                      ]),
                      _: 1
                    }, 8, ["onClick"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UDashboardNavbar, {
                title: "Отладка API",
                ui: { right: "gap-3" }
              }, {
                leading: withCtx(() => [
                  createVNode(_component_UDashboardSidebarCollapse)
                ]),
                right: withCtx(() => [
                  createVNode(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-trash-2",
                    variant: "outline",
                    onClick: ($event) => unref(uiStore).clearDebug()
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Очистить лог ")
                    ]),
                    _: 1
                  }, 8, ["onClick"])
                ]),
                _: 1
              })
            ];
          }
        }),
        body: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"${_scopeId}><div class="space-y-6"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Запуск запросов </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Проверка Nuxt BFF </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Запуск запросов "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Проверка Nuxt BFF ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Пресет" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_USelectMenu, {
                          modelValue: unref(selectedPreset),
                          "onUpdate:modelValue": ($event) => isRef(selectedPreset) ? selectedPreset.value = $event : null,
                          items: unref(presets),
                          "value-key": "value"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(selectedPreset),
                            "onUpdate:modelValue": ($event) => isRef(selectedPreset) ? selectedPreset.value = $event : null,
                            items: unref(presets),
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`<div class="grid gap-4 sm:grid-cols-[0.3fr_0.7fr]"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Метод" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_USelectMenu, {
                          modelValue: unref(form).method,
                          "onUpdate:modelValue": ($event) => unref(form).method = $event,
                          items: [
                            { label: "GET", value: "GET" },
                            { label: "POST", value: "POST" },
                            { label: "PATCH", value: "PATCH" },
                            { label: "PUT", value: "PUT" },
                            { label: "DELETE", value: "DELETE" }
                          ],
                          "value-key": "value"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(form).method,
                            "onUpdate:modelValue": ($event) => unref(form).method = $event,
                            items: [
                              { label: "GET", value: "GET" },
                              { label: "POST", value: "POST" },
                              { label: "PATCH", value: "PATCH" },
                              { label: "PUT", value: "PUT" },
                              { label: "DELETE", value: "DELETE" }
                            ],
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Путь" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).path,
                          "onUpdate:modelValue": ($event) => unref(form).path = $event
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).path,
                            "onUpdate:modelValue": ($event) => unref(form).path = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Тело JSON" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UTextarea, {
                          modelValue: unref(form).body,
                          "onUpdate:modelValue": ($event) => unref(form).body = $event,
                          rows: 8
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UTextarea, {
                            modelValue: unref(form).body,
                            "onUpdate:modelValue": ($event) => unref(form).body = $event,
                            rows: 8
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-play",
                    onClick: executeRequest
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Выполнить запрос `);
                      } else {
                        return [
                          createTextVNode(" Выполнить запрос ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode(_component_UFormField, { label: "Пресет" }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(selectedPreset),
                            "onUpdate:modelValue": ($event) => isRef(selectedPreset) ? selectedPreset.value = $event : null,
                            items: unref(presets),
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ]),
                        _: 1
                      }),
                      createVNode("div", { class: "grid gap-4 sm:grid-cols-[0.3fr_0.7fr]" }, [
                        createVNode(_component_UFormField, { label: "Метод" }, {
                          default: withCtx(() => [
                            createVNode(_component_USelectMenu, {
                              modelValue: unref(form).method,
                              "onUpdate:modelValue": ($event) => unref(form).method = $event,
                              items: [
                                { label: "GET", value: "GET" },
                                { label: "POST", value: "POST" },
                                { label: "PATCH", value: "PATCH" },
                                { label: "PUT", value: "PUT" },
                                { label: "DELETE", value: "DELETE" }
                              ],
                              "value-key": "value"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Путь" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(form).path,
                              "onUpdate:modelValue": ($event) => unref(form).path = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        })
                      ]),
                      createVNode(_component_UFormField, { label: "Тело JSON" }, {
                        default: withCtx(() => [
                          createVNode(_component_UTextarea, {
                            modelValue: unref(form).body,
                            "onUpdate:modelValue": ($event) => unref(form).body = $event,
                            rows: 8
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-play",
                        onClick: executeRequest
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Выполнить запрос ")
                        ]),
                        _: 1
                      })
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (unref(result)) {
              _push2(ssrRenderComponent(_component_SharedJsonBlock, {
                label: "Последний ответ",
                value: unref(result)
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Последние клиентские запросы </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Поток отладки </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Последние клиентские запросы "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Поток отладки ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(uiStore).apiDebugEntries.length) {
                    _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                    ssrRenderList(unref(uiStore).apiDebugEntries, (entry) => {
                      _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><div class="flex flex-wrap items-center justify-between gap-3"${_scopeId2}><div${_scopeId2}><p class="font-medium text-charcoal-950"${_scopeId2}>${ssrInterpolate(entry.method)} ${ssrInterpolate(entry.url)}</p><p class="text-xs uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>${ssrInterpolate(entry.at)}</p></div>`);
                      _push3(ssrRenderComponent(_component_SharedStatusBadge, {
                        label: entry.status
                      }, null, _parent3, _scopeId2));
                      _push3(`</div><pre class="mt-4 overflow-auto text-xs leading-6 text-charcoal-700"${_scopeId2}>${ssrInterpolate(JSON.stringify(entry.response || entry.error, null, 2))}</pre></div>`);
                    });
                    _push3(`<!--]--></div>`);
                  } else {
                    _push3(ssrRenderComponent(_component_SharedEmptyState, {
                      description: "Здесь будут отображаться последние клиентские запросы панели после использования интерфейса или запуска запроса с этой страницы.",
                      icon: "i-lucide-terminal",
                      title: "Записей отладки пока нет"
                    }, null, _parent3, _scopeId2));
                  }
                } else {
                  return [
                    unref(uiStore).apiDebugEntries.length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-3"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(uiStore).apiDebugEntries, (entry) => {
                        return openBlock(), createBlock("div", {
                          key: `${entry.at}-${entry.url}`,
                          class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"
                        }, [
                          createVNode("div", { class: "flex flex-wrap items-center justify-between gap-3" }, [
                            createVNode("div", null, [
                              createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(entry.method) + " " + toDisplayString(entry.url), 1),
                              createVNode("p", { class: "text-xs uppercase tracking-[0.18em] text-charcoal-500" }, toDisplayString(entry.at), 1)
                            ]),
                            createVNode(_component_SharedStatusBadge, {
                              label: entry.status
                            }, null, 8, ["label"])
                          ]),
                          createVNode("pre", { class: "mt-4 overflow-auto text-xs leading-6 text-charcoal-700" }, toDisplayString(JSON.stringify(entry.response || entry.error, null, 2)), 1)
                        ]);
                      }), 128))
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Здесь будут отображаться последние клиентские запросы панели после использования интерфейса или запуска запроса с этой страницы.",
                      icon: "i-lucide-terminal",
                      title: "Записей отладки пока нет"
                    }))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" }, [
                createVNode("div", { class: "space-y-6" }, [
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Запуск запросов "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Проверка Nuxt BFF ")
                      ])
                    ]),
                    default: withCtx(() => [
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode(_component_UFormField, { label: "Пресет" }, {
                          default: withCtx(() => [
                            createVNode(_component_USelectMenu, {
                              modelValue: unref(selectedPreset),
                              "onUpdate:modelValue": ($event) => isRef(selectedPreset) ? selectedPreset.value = $event : null,
                              items: unref(presets),
                              "value-key": "value"
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                          ]),
                          _: 1
                        }),
                        createVNode("div", { class: "grid gap-4 sm:grid-cols-[0.3fr_0.7fr]" }, [
                          createVNode(_component_UFormField, { label: "Метод" }, {
                            default: withCtx(() => [
                              createVNode(_component_USelectMenu, {
                                modelValue: unref(form).method,
                                "onUpdate:modelValue": ($event) => unref(form).method = $event,
                                items: [
                                  { label: "GET", value: "GET" },
                                  { label: "POST", value: "POST" },
                                  { label: "PATCH", value: "PATCH" },
                                  { label: "PUT", value: "PUT" },
                                  { label: "DELETE", value: "DELETE" }
                                ],
                                "value-key": "value"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_UFormField, { label: "Путь" }, {
                            default: withCtx(() => [
                              createVNode(_component_UInput, {
                                modelValue: unref(form).path,
                                "onUpdate:modelValue": ($event) => unref(form).path = $event
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          })
                        ]),
                        createVNode(_component_UFormField, { label: "Тело JSON" }, {
                          default: withCtx(() => [
                            createVNode(_component_UTextarea, {
                              modelValue: unref(form).body,
                              "onUpdate:modelValue": ($event) => unref(form).body = $event,
                              rows: 8
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "primary",
                          icon: "i-lucide-play",
                          onClick: executeRequest
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Выполнить запрос ")
                          ]),
                          _: 1
                        })
                      ])
                    ]),
                    _: 1
                  }),
                  unref(result) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                    key: 0,
                    label: "Последний ответ",
                    value: unref(result)
                  }, null, 8, ["value"])) : createCommentVNode("", true)
                ]),
                createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                  header: withCtx(() => [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Последние клиентские запросы "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Поток отладки ")
                    ])
                  ]),
                  default: withCtx(() => [
                    unref(uiStore).apiDebugEntries.length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-3"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(uiStore).apiDebugEntries, (entry) => {
                        return openBlock(), createBlock("div", {
                          key: `${entry.at}-${entry.url}`,
                          class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"
                        }, [
                          createVNode("div", { class: "flex flex-wrap items-center justify-between gap-3" }, [
                            createVNode("div", null, [
                              createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(entry.method) + " " + toDisplayString(entry.url), 1),
                              createVNode("p", { class: "text-xs uppercase tracking-[0.18em] text-charcoal-500" }, toDisplayString(entry.at), 1)
                            ]),
                            createVNode(_component_SharedStatusBadge, {
                              label: entry.status
                            }, null, 8, ["label"])
                          ]),
                          createVNode("pre", { class: "mt-4 overflow-auto text-xs leading-6 text-charcoal-700" }, toDisplayString(JSON.stringify(entry.response || entry.error, null, 2)), 1)
                        ]);
                      }), 128))
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Здесь будут отображаться последние клиентские запросы панели после использования интерфейса или запуска запроса с этой страницы.",
                      icon: "i-lucide-terminal",
                      title: "Записей отладки пока нет"
                    }))
                  ]),
                  _: 1
                })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/api-debug.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/api-debug-B1XsfMBp');
//# sourceMappingURL=api-debug-B1XsfMBp.mjs.map
