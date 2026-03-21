globalThis.__timing__.logStart('Load chunks/build/banners-CQ0UsfPq');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$8 } from './DashboardSidebarCollapse-DfgO2fN5.mjs';
import { b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a, e as useApiClient } from './server.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-CYCC6qth.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
import { _ as __nuxt_component_10 } from './JsonBlock-DvPUbwNJ.mjs';
import { _ as _sfc_main$1 } from './Modal-Dv48105F.mjs';
import { _ as _sfc_main$4 } from './FormField-CfjXEpv-.mjs';
import { _ as _sfc_main$5 } from './Input-DcPP1NGC.mjs';
import { _ as _sfc_main$6 } from './Textarea-DeTQfUen.mjs';
import { _ as _sfc_main$7 } from './Checkbox-BOWf4Iqw.mjs';
import { defineComponent, ref, reactive, withAsyncContext, watch, computed, mergeProps, withCtx, unref, createTextVNode, toDisplayString, openBlock, createBlock, Fragment, renderList, createVNode, withModifiers, isRef, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/server-renderer/index.mjs';
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

function useMarketplaceApi() {
  const client = useApiClient();
  return {
    create(body) {
      return client.request("/api/marketplace/banners", {
        body,
        method: "POST",
        successMessage: "Баннер создан"
      });
    },
    detail(id) {
      return client.request(`/api/marketplace/banners/${id}`);
    },
    list() {
      return client.request("/api/marketplace/banners");
    },
    toggleActive(id, isActive) {
      return client.request(`/api/marketplace/banners/${id}`, {
        body: { is_active: isActive },
        method: "DELETE",
        successMessage: isActive ? "Баннер активирован" : "Баннер деактивирован"
      });
    },
    update(id, body) {
      return client.request(`/api/marketplace/banners/${id}`, {
        body,
        method: "PUT",
        successMessage: "Баннер обновлен"
      });
    }
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "banners",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const marketplaceApi = useMarketplaceApi();
    const bannerModalOpen = ref(false);
    const form = reactive({
      description: "",
      id: "",
      is_active: true,
      locale: "uz",
      title: ""
    });
    const selectedFile = ref(null);
    const selectedBannerId = ref("");
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("marketplace-banners", async () => {
      const banners = await marketplaceApi.list();
      return Array.isArray(banners) ? banners : banners?.items || [];
    })), __temp = await __temp, __restore(), __temp);
    watch(
      () => data.value || [],
      (items) => {
        if (!items.length) {
          selectedBannerId.value = "";
          return;
        }
        if (!items.some((item) => String(item.id) === selectedBannerId.value)) {
          selectedBannerId.value = String(items[0].id);
        }
      },
      { immediate: true }
    );
    watch(bannerModalOpen, (open) => {
      if (!open) {
        resetForm();
      }
    });
    const selectedBanner = computed(
      () => (data.value || []).find((item) => String(item.id) === selectedBannerId.value) || null
    );
    const modalTitle = computed(
      () => form.id ? "Редактировать баннер" : "Создать баннер"
    );
    const modalDescription = computed(
      () => form.id ? "Обновите данные выбранного баннера." : "Заполните форму, чтобы добавить новый баннер в маркетплейс."
    );
    function openCreateModal() {
      resetForm();
      bannerModalOpen.value = true;
    }
    function editBanner(item) {
      form.description = item.description || "";
      form.id = String(item.id);
      form.is_active = Boolean(item.is_active ?? true);
      form.locale = item.locale || "uz";
      form.title = item.title || "";
      selectedBannerId.value = String(item.id);
      bannerModalOpen.value = true;
    }
    function resetForm() {
      form.description = "";
      form.id = "";
      form.is_active = true;
      form.locale = "uz";
      form.title = "";
      selectedFile.value = null;
    }
    function onFileChange(event) {
      const target = event.target;
      selectedFile.value = target.files?.[0] || null;
    }
    async function submitBanner() {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("locale", form.locale);
      formData.append("is_active", String(form.is_active));
      if (selectedFile.value) {
        formData.append("file", selectedFile.value);
      }
      if (form.id) {
        await marketplaceApi.update(form.id, formData);
      } else {
        await marketplaceApi.create(formData);
      }
      resetForm();
      await refresh();
      bannerModalOpen.value = false;
    }
    async function toggleBanner(item) {
      await marketplaceApi.toggleActive(String(item.id), !item.is_active);
      await refresh();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$8;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_SharedEmptyState = __nuxt_component_9;
      const _component_SharedJsonBlock = __nuxt_component_10;
      const _component_UModal = _sfc_main$1;
      const _component_UFormField = _sfc_main$4;
      const _component_UInput = _sfc_main$5;
      const _component_UTextarea = _sfc_main$6;
      const _component_UCheckbox = _sfc_main$7;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "marketplace-banners" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Баннеры маркетплейса",
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
                title: "Баннеры маркетплейса",
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
            _push2(`<div class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Список баннеров </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Создание, редактирование и активация </h2></div>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "primary",
                    icon: "i-lucide-plus",
                    onClick: openCreateModal
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Создать баннер `);
                      } else {
                        return [
                          createTextVNode(" Создать баннер ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Список баннеров "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Создание, редактирование и активация ")
                      ]),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-plus",
                        onClick: openCreateModal
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Создать баннер ")
                        ]),
                        _: 1
                      })
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(data)?.length) {
                    _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                    ssrRenderList(unref(data), (item) => {
                      _push3(`<button class="${ssrRenderClass([
                        String(item.id) === unref(selectedBannerId) ? "border-brass-300 bg-brass-50" : "border-charcoal-200 bg-white/80",
                        "w-full rounded-[1.25rem] border p-4 text-left transition"
                      ])}" type="button"${_scopeId2}><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"${_scopeId2}><div class="space-y-1"${_scopeId2}><p class="font-medium text-charcoal-950"${_scopeId2}>${ssrInterpolate(item.title || "Баннер без названия")}</p><p class="text-sm text-charcoal-500"${_scopeId2}>${ssrInterpolate(item.locale || "Локаль не указана")}</p></div><div class="flex flex-wrap gap-2"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_SharedStatusBadge, {
                        label: item.is_active ? "active" : "inactive"
                      }, null, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_UButton, {
                        color: "neutral",
                        size: "xs",
                        variant: "outline",
                        onClick: ($event) => editBanner(item)
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(` Редактировать `);
                          } else {
                            return [
                              createTextVNode(" Редактировать ")
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_UButton, {
                        color: "neutral",
                        size: "xs",
                        variant: "outline",
                        onClick: ($event) => toggleBanner(item)
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(item.is_active ? "Деактивировать" : "Активировать")}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(item.is_active ? "Деактивировать" : "Активировать"), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                      _push3(`</div></div></button>`);
                    });
                    _push3(`<!--]--></div>`);
                  } else {
                    _push3(ssrRenderComponent(_component_SharedEmptyState, {
                      description: "Эндпоинт баннеров маркетплейса не вернул ни одного баннера.",
                      icon: "i-lucide-image-up",
                      title: "Баннеров нет"
                    }, null, _parent3, _scopeId2));
                  }
                } else {
                  return [
                    unref(data)?.length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-3"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(data), (item) => {
                        return openBlock(), createBlock("button", {
                          key: String(item.id),
                          class: [
                            String(item.id) === unref(selectedBannerId) ? "border-brass-300 bg-brass-50" : "border-charcoal-200 bg-white/80",
                            "w-full rounded-[1.25rem] border p-4 text-left transition"
                          ],
                          type: "button",
                          onClick: ($event) => selectedBannerId.value = String(item.id)
                        }, [
                          createVNode("div", { class: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" }, [
                            createVNode("div", { class: "space-y-1" }, [
                              createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(item.title || "Баннер без названия"), 1),
                              createVNode("p", { class: "text-sm text-charcoal-500" }, toDisplayString(item.locale || "Локаль не указана"), 1)
                            ]),
                            createVNode("div", { class: "flex flex-wrap gap-2" }, [
                              createVNode(_component_SharedStatusBadge, {
                                label: item.is_active ? "active" : "inactive"
                              }, null, 8, ["label"]),
                              createVNode(_component_UButton, {
                                color: "neutral",
                                size: "xs",
                                variant: "outline",
                                onClick: withModifiers(($event) => editBanner(item), ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" Редактировать ")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              createVNode(_component_UButton, {
                                color: "neutral",
                                size: "xs",
                                variant: "outline",
                                onClick: withModifiers(($event) => toggleBanner(item), ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(item.is_active ? "Деактивировать" : "Активировать"), 1)
                                ]),
                                _: 2
                              }, 1032, ["onClick"])
                            ])
                          ])
                        ], 10, ["onClick"]);
                      }), 128))
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Эндпоинт баннеров маркетплейса не вернул ни одного баннера.",
                      icon: "i-lucide-image-up",
                      title: "Баннеров нет"
                    }))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Выбранные данные </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Детали баннера </h2></div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Выбранные данные "),
                      createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Детали баннера ")
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(selectedBanner)) {
                    _push3(ssrRenderComponent(_component_SharedJsonBlock, {
                      label: "Баннер",
                      value: unref(selectedBanner)
                    }, null, _parent3, _scopeId2));
                  } else {
                    _push3(ssrRenderComponent(_component_SharedEmptyState, {
                      description: "Выберите баннер из списка, чтобы посмотреть его сырые данные.",
                      icon: "i-lucide-gallery-vertical-end",
                      title: "Баннер не выбран"
                    }, null, _parent3, _scopeId2));
                  }
                } else {
                  return [
                    unref(selectedBanner) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                      key: 0,
                      label: "Баннер",
                      value: unref(selectedBanner)
                    }, null, 8, ["value"])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Выберите баннер из списка, чтобы посмотреть его сырые данные.",
                      icon: "i-lucide-gallery-vertical-end",
                      title: "Баннер не выбран"
                    }))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
            _push2(ssrRenderComponent(_component_UModal, {
              open: unref(bannerModalOpen),
              "onUpdate:open": ($event) => isRef(bannerModalOpen) ? bannerModalOpen.value = $event : null,
              class: "sm:max-w-xl",
              description: unref(modalDescription),
              title: unref(modalTitle)
            }, {
              body: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Заголовок" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).title,
                          "onUpdate:modelValue": ($event) => unref(form).title = $event
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).title,
                            "onUpdate:modelValue": ($event) => unref(form).title = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Описание" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UTextarea, {
                          modelValue: unref(form).description,
                          "onUpdate:modelValue": ($event) => unref(form).description = $event,
                          rows: 4
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UTextarea, {
                            modelValue: unref(form).description,
                            "onUpdate:modelValue": ($event) => unref(form).description = $event,
                            rows: 4
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Локаль" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).locale,
                          "onUpdate:modelValue": ($event) => unref(form).locale = $event
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).locale,
                            "onUpdate:modelValue": ($event) => unref(form).locale = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UCheckbox, {
                    modelValue: unref(form).is_active,
                    "onUpdate:modelValue": ($event) => unref(form).is_active = $event,
                    label: "Баннер активен"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Файл изображения" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          type: "file",
                          onChange: onFileChange
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            type: "file",
                            onChange: onFileChange
                          })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode(_component_UFormField, { label: "Заголовок" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).title,
                            "onUpdate:modelValue": ($event) => unref(form).title = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Описание" }, {
                        default: withCtx(() => [
                          createVNode(_component_UTextarea, {
                            modelValue: unref(form).description,
                            "onUpdate:modelValue": ($event) => unref(form).description = $event,
                            rows: 4
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Локаль" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).locale,
                            "onUpdate:modelValue": ($event) => unref(form).locale = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UCheckbox, {
                        modelValue: unref(form).is_active,
                        "onUpdate:modelValue": ($event) => unref(form).is_active = $event,
                        label: "Баннер активен"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_UFormField, { label: "Файл изображения" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            type: "file",
                            onChange: onFileChange
                          })
                        ]),
                        _: 1
                      })
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
                    onClick: submitBanner
                  }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(form).id ? "Обновить баннер" : "Создать баннер")}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(form).id ? "Обновить баннер" : "Создать баннер"), 1)
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
                        onClick: submitBanner
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(form).id ? "Обновить баннер" : "Создать баннер"), 1)
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
              createVNode("div", { class: "grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" }, [
                createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                  header: withCtx(() => [
                    createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Список баннеров "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Создание, редактирование и активация ")
                      ]),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-plus",
                        onClick: openCreateModal
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Создать баннер ")
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  default: withCtx(() => [
                    unref(data)?.length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-3"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(data), (item) => {
                        return openBlock(), createBlock("button", {
                          key: String(item.id),
                          class: [
                            String(item.id) === unref(selectedBannerId) ? "border-brass-300 bg-brass-50" : "border-charcoal-200 bg-white/80",
                            "w-full rounded-[1.25rem] border p-4 text-left transition"
                          ],
                          type: "button",
                          onClick: ($event) => selectedBannerId.value = String(item.id)
                        }, [
                          createVNode("div", { class: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" }, [
                            createVNode("div", { class: "space-y-1" }, [
                              createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(item.title || "Баннер без названия"), 1),
                              createVNode("p", { class: "text-sm text-charcoal-500" }, toDisplayString(item.locale || "Локаль не указана"), 1)
                            ]),
                            createVNode("div", { class: "flex flex-wrap gap-2" }, [
                              createVNode(_component_SharedStatusBadge, {
                                label: item.is_active ? "active" : "inactive"
                              }, null, 8, ["label"]),
                              createVNode(_component_UButton, {
                                color: "neutral",
                                size: "xs",
                                variant: "outline",
                                onClick: withModifiers(($event) => editBanner(item), ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" Редактировать ")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              createVNode(_component_UButton, {
                                color: "neutral",
                                size: "xs",
                                variant: "outline",
                                onClick: withModifiers(($event) => toggleBanner(item), ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(item.is_active ? "Деактивировать" : "Активировать"), 1)
                                ]),
                                _: 2
                              }, 1032, ["onClick"])
                            ])
                          ])
                        ], 10, ["onClick"]);
                      }), 128))
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Эндпоинт баннеров маркетплейса не вернул ни одного баннера.",
                      icon: "i-lucide-image-up",
                      title: "Баннеров нет"
                    }))
                  ]),
                  _: 1
                }),
                createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                  header: withCtx(() => [
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Выбранные данные "),
                      createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Детали баннера ")
                    ])
                  ]),
                  default: withCtx(() => [
                    unref(selectedBanner) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                      key: 0,
                      label: "Баннер",
                      value: unref(selectedBanner)
                    }, null, 8, ["value"])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Выберите баннер из списка, чтобы посмотреть его сырые данные.",
                      icon: "i-lucide-gallery-vertical-end",
                      title: "Баннер не выбран"
                    }))
                  ]),
                  _: 1
                })
              ]),
              createVNode(_component_UModal, {
                open: unref(bannerModalOpen),
                "onUpdate:open": ($event) => isRef(bannerModalOpen) ? bannerModalOpen.value = $event : null,
                class: "sm:max-w-xl",
                description: unref(modalDescription),
                title: unref(modalTitle)
              }, {
                body: withCtx(() => [
                  createVNode("div", { class: "space-y-4" }, [
                    createVNode(_component_UFormField, { label: "Заголовок" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(form).title,
                          "onUpdate:modelValue": ($event) => unref(form).title = $event
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UFormField, { label: "Описание" }, {
                      default: withCtx(() => [
                        createVNode(_component_UTextarea, {
                          modelValue: unref(form).description,
                          "onUpdate:modelValue": ($event) => unref(form).description = $event,
                          rows: 4
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UFormField, { label: "Локаль" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(form).locale,
                          "onUpdate:modelValue": ($event) => unref(form).locale = $event
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCheckbox, {
                      modelValue: unref(form).is_active,
                      "onUpdate:modelValue": ($event) => unref(form).is_active = $event,
                      label: "Баннер активен"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                    createVNode(_component_UFormField, { label: "Файл изображения" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          type: "file",
                          onChange: onFileChange
                        })
                      ]),
                      _: 1
                    })
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
                      onClick: submitBanner
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(form).id ? "Обновить баннер" : "Создать баннер"), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/marketplace/banners.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/banners-CQ0UsfPq');
//# sourceMappingURL=banners-CQ0UsfPq.mjs.map
