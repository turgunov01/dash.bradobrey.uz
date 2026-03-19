globalThis.__timing__.logStart('Load chunks/build/certificates-ApkoJuN9');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$b } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a, e as useApiClient } from './server.mjs';
import { _ as _sfc_main$4 } from './Badge-CKFwwagy.mjs';
import { _ as _sfc_main$1 } from './Table-2pT4H1Ma.mjs';
import { _ as __nuxt_component_7 } from './StatusBadge-DWE-z1MU.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
import { _ as _sfc_main$5 } from './Modal-DRUXoHnR.mjs';
import { _ as _sfc_main$6 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$7 } from './Input-BrToCniw.mjs';
import { _ as _sfc_main$8 } from './SelectMenu-BfkNXmwg.mjs';
import { _ as _sfc_main$9 } from './Textarea-CCm_ITCi.mjs';
import { _ as __nuxt_component_10 } from './JsonBlock-DvPUbwNJ.mjs';
import { defineComponent, ref, reactive, withAsyncContext, computed, watch, mergeProps, withCtx, unref, createVNode, toDisplayString, createTextVNode, openBlock, createBlock, Fragment, renderList, isRef, createCommentVNode, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { d as certificateCreateSchema } from '../_/index.mjs';
import { f as formatDateTime } from './format-DDcTL-sj.mjs';
import { f as flattenServicesPayload } from './services-D0S0WuHG.mjs';
import { u as useKioskApi } from './useKioskApi-l3XfHmhL.mjs';
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

function useCertificatesApi() {
  const client = useApiClient();
  const kioskApi = useKioskApi();
  return {
    create(payload) {
      return client.request("/api/certificate/add", {
        body: payload,
        method: "POST",
        successMessage: "Сертификат создан"
      });
    },
    listActive() {
      return client.request("/api/certificate/active");
    },
    lookup(code) {
      return kioskApi.certificate(code);
    }
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "certificates",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    function normalizeText(value) {
      if (value === void 0 || value === null) {
        return null;
      }
      const text = String(value).trim();
      return text || null;
    }
    function extractCertificateRows(response) {
      if (!response || typeof response !== "object") {
        return [];
      }
      const payload = response;
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload.certificates) ? payload.certificates : Array.isArray(payload.data) ? payload.data : [];
      return items.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return [];
        }
        const certificate = item;
        return [{
          code: String(certificate.code || ""),
          created_at: normalizeText(certificate.created_at),
          expires_at: normalizeText(certificate.expires_at),
          id: String(certificate.id || ""),
          is_used: Boolean(certificate.is_used),
          metadata: certificate.metadata && typeof certificate.metadata === "object" ? certificate.metadata : null,
          service_ids: Array.isArray(certificate.service_ids) ? certificate.service_ids.map((serviceId) => String(serviceId)) : []
        }];
      }).filter((item) => Boolean(item.id && item.code));
    }
    function formatMetadataPreview(value) {
      if (!value || !Object.keys(value).length) {
        return "Пусто";
      }
      const serialized = JSON.stringify(value);
      return serialized.length > 90 ? `${serialized.slice(0, 90)}...` : serialized;
    }
    const certificatesApi = useCertificatesApi();
    const kioskApi = useKioskApi();
    const createModalOpen = ref(false);
    const lookupModalOpen = ref(false);
    const form = reactive({
      code: "",
      expires_at: "",
      metadata: "{}",
      service_ids: []
    });
    const lookupCode = ref("");
    const lookupResult = ref(null);
    const certificateColumns = [
      { accessorKey: "code", header: "Код" },
      { id: "services", header: "Услуги" },
      { accessorKey: "expires_at", header: "Действует до" },
      { id: "metadata", header: "Метаданные" },
      { id: "status", header: "Статус" }
    ];
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("certificates-dashboard", async () => {
      const [servicesResult, certificatesResult] = await Promise.allSettled([
        kioskApi.services({ active: true, grouped: false }),
        certificatesApi.listActive()
      ]);
      return {
        certificates: certificatesResult.status === "fulfilled" ? extractCertificateRows(certificatesResult.value) : [],
        services: servicesResult.status === "fulfilled" ? flattenServicesPayload(servicesResult.value) : []
      };
    })), __temp = await __temp, __restore(), __temp);
    const services = computed(() => data.value?.services || []);
    const activeCertificates = computed(() => data.value?.certificates || []);
    const serviceNameMap = computed(
      () => new Map(
        services.value.map((service) => [String(service.id), service.name || `Услуга ${service.id}`])
      )
    );
    const serviceOptions = computed(
      () => services.value.map((service) => ({
        label: `${service.name || "Услуга без названия"} / ${service.duration_minutes ?? service.duration ?? 0} мин`,
        value: String(service.id)
      }))
    );
    const createModalDescription = computed(
      () => "Заполните код, набор услуг и срок действия нового сертификата."
    );
    const lookupModalDescription = computed(
      () => "Введите код сертификата и получите его текущий статус и payload."
    );
    watch(createModalOpen, (open) => {
      if (!open) {
        resetCreateForm();
      }
    });
    watch(lookupModalOpen, (open) => {
      if (!open) {
        resetLookupState();
      }
    });
    function resetCreateForm() {
      form.code = "";
      form.expires_at = "";
      form.metadata = "{}";
      form.service_ids = [];
    }
    function resetLookupState() {
      lookupCode.value = "";
      lookupResult.value = null;
    }
    function openCreateModal() {
      resetCreateForm();
      createModalOpen.value = true;
    }
    function openLookupModal() {
      resetLookupState();
      lookupModalOpen.value = true;
    }
    async function createCertificate() {
      let metadata;
      try {
        metadata = form.metadata ? JSON.parse(form.metadata) : void 0;
      } catch {
        useApiClient().notifyError(new Error("Метаданные должны быть валидным JSON"));
        return;
      }
      const payload = certificateCreateSchema.safeParse({
        code: form.code,
        expires_at: form.expires_at || void 0,
        metadata,
        service_ids: form.service_ids
      });
      if (!payload.success) {
        useApiClient().notifyError(new Error(payload.error.issues[0]?.message || "Некорректные данные сертификата"));
        return;
      }
      await certificatesApi.create(payload.data);
      await refresh();
      createModalOpen.value = false;
    }
    async function lookupCertificate() {
      if (!lookupCode.value) {
        useApiClient().notifyError(new Error("Введите код сертификата"));
        return;
      }
      lookupResult.value = await certificatesApi.lookup(lookupCode.value);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$b;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UBadge = _sfc_main$4;
      const _component_UTable = _sfc_main$1;
      const _component_SharedStatusBadge = __nuxt_component_7;
      const _component_SharedEmptyState = __nuxt_component_9;
      const _component_UModal = _sfc_main$5;
      const _component_UFormField = _sfc_main$6;
      const _component_UInput = _sfc_main$7;
      const _component_USelectMenu = _sfc_main$8;
      const _component_UTextarea = _sfc_main$9;
      const _component_SharedJsonBlock = __nuxt_component_10;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "certificates" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Сертификаты",
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
                title: "Сертификаты",
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
                  _push3(`<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Активный реестр </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Действующие сертификаты </h2></div><div class="flex flex-wrap items-center gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    size: "lg",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(activeCertificates).length)} активных `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(activeCertificates).length) + " активных ", 1)
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
                        _push4(` Создать `);
                      } else {
                        return [
                          createTextVNode(" Создать ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-search",
                    variant: "outline",
                    onClick: openLookupModal
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Проверить `);
                      } else {
                        return [
                          createTextVNode(" Проверить ")
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
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Активный реестр "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Действующие сертификаты ")
                      ]),
                      createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          size: "lg",
                          variant: "soft"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(activeCertificates).length) + " активных ", 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "primary",
                          icon: "i-lucide-plus",
                          onClick: openCreateModal
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Создать ")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "neutral",
                          icon: "i-lucide-search",
                          variant: "outline",
                          onClick: openLookupModal
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Проверить ")
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
                  if (unref(activeCertificates).length) {
                    _push3(`<div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"${_scopeId2}><div class="max-h-[42rem] overflow-auto"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UTable, {
                      columns: certificateColumns,
                      data: unref(activeCertificates),
                      loading: unref(pending),
                      sticky: "header",
                      ui: {
                        root: "w-full overflow-auto",
                        base: "w-full min-w-[72rem]",
                        thead: "bg-charcoal-50/90",
                        tbody: "divide-y divide-charcoal-100",
                        th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                        td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                      }
                    }, {
                      "code-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="font-mono font-medium text-charcoal-950"${_scopeId3}>${ssrInterpolate(row.original.code)}</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "font-mono font-medium text-charcoal-950" }, toDisplayString(row.original.code), 1)
                          ];
                        }
                      }),
                      "services-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div class="flex max-w-[22rem] flex-wrap gap-2"${_scopeId3}><!--[-->`);
                          ssrRenderList(row.original.service_ids, (serviceId) => {
                            _push4(ssrRenderComponent(_component_UBadge, {
                              key: serviceId,
                              color: "neutral",
                              variant: "soft"
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(`${ssrInterpolate(unref(serviceNameMap).get(serviceId) || serviceId)}`);
                                } else {
                                  return [
                                    createTextVNode(toDisplayString(unref(serviceNameMap).get(serviceId) || serviceId), 1)
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                          });
                          _push4(`<!--]--></div>`);
                        } else {
                          return [
                            createVNode("div", { class: "flex max-w-[22rem] flex-wrap gap-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(row.original.service_ids, (serviceId) => {
                                return openBlock(), createBlock(_component_UBadge, {
                                  key: serviceId,
                                  color: "neutral",
                                  variant: "soft"
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(serviceNameMap).get(serviceId) || serviceId), 1)
                                  ]),
                                  _: 2
                                }, 1024);
                              }), 128))
                            ])
                          ];
                        }
                      }),
                      "expires_at-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(row.original.expires_at ? unref(formatDateTime)(row.original.expires_at) : "Без срока")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(row.original.expires_at ? unref(formatDateTime)(row.original.expires_at) : "Без срока"), 1)
                          ];
                        }
                      }),
                      "metadata-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<span class="block max-w-[18rem] truncate text-charcoal-500"${_scopeId3}>${ssrInterpolate(formatMetadataPreview(row.original.metadata))}</span>`);
                        } else {
                          return [
                            createVNode("span", { class: "block max-w-[18rem] truncate text-charcoal-500" }, toDisplayString(formatMetadataPreview(row.original.metadata)), 1)
                          ];
                        }
                      }),
                      "status-cell": withCtx(({ row }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_SharedStatusBadge, {
                            label: row.original.is_used ? "used" : "active"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.is_used ? "used" : "active"
                            }, null, 8, ["label"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    _push3(ssrRenderComponent(_component_SharedEmptyState, {
                      description: "Не найдено ни одного действующего сертификата.",
                      icon: "i-lucide-id-card",
                      title: "Активных сертификатов нет"
                    }, null, _parent3, _scopeId2));
                  }
                } else {
                  return [
                    unref(activeCertificates).length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
                    }, [
                      createVNode("div", { class: "max-h-[42rem] overflow-auto" }, [
                        createVNode(_component_UTable, {
                          columns: certificateColumns,
                          data: unref(activeCertificates),
                          loading: unref(pending),
                          sticky: "header",
                          ui: {
                            root: "w-full overflow-auto",
                            base: "w-full min-w-[72rem]",
                            thead: "bg-charcoal-50/90",
                            tbody: "divide-y divide-charcoal-100",
                            th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                            td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                          }
                        }, {
                          "code-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "font-mono font-medium text-charcoal-950" }, toDisplayString(row.original.code), 1)
                          ]),
                          "services-cell": withCtx(({ row }) => [
                            createVNode("div", { class: "flex max-w-[22rem] flex-wrap gap-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(row.original.service_ids, (serviceId) => {
                                return openBlock(), createBlock(_component_UBadge, {
                                  key: serviceId,
                                  color: "neutral",
                                  variant: "soft"
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(unref(serviceNameMap).get(serviceId) || serviceId), 1)
                                  ]),
                                  _: 2
                                }, 1024);
                              }), 128))
                            ])
                          ]),
                          "expires_at-cell": withCtx(({ row }) => [
                            createTextVNode(toDisplayString(row.original.expires_at ? unref(formatDateTime)(row.original.expires_at) : "Без срока"), 1)
                          ]),
                          "metadata-cell": withCtx(({ row }) => [
                            createVNode("span", { class: "block max-w-[18rem] truncate text-charcoal-500" }, toDisplayString(formatMetadataPreview(row.original.metadata)), 1)
                          ]),
                          "status-cell": withCtx(({ row }) => [
                            createVNode(_component_SharedStatusBadge, {
                              label: row.original.is_used ? "used" : "active"
                            }, null, 8, ["label"])
                          ]),
                          _: 1
                        }, 8, ["data", "loading"])
                      ])
                    ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                      key: 1,
                      description: "Не найдено ни одного действующего сертификата.",
                      icon: "i-lucide-id-card",
                      title: "Активных сертификатов нет"
                    }))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UModal, {
              open: unref(createModalOpen),
              "onUpdate:open": ($event) => isRef(createModalOpen) ? createModalOpen.value = $event : null,
              class: "sm:max-w-2xl",
              description: unref(createModalDescription),
              title: "Создать сертификат"
            }, {
              body: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Код сертификата" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).code,
                          "onUpdate:modelValue": ($event) => unref(form).code = $event
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).code,
                            "onUpdate:modelValue": ($event) => unref(form).code = $event
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
                          modelValue: unref(form).service_ids,
                          "onUpdate:modelValue": ($event) => unref(form).service_ids = $event,
                          class: "w-full",
                          items: unref(serviceOptions),
                          multiple: "",
                          placeholder: "Выберите услуги",
                          "value-key": "value"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(form).service_ids,
                            "onUpdate:modelValue": ($event) => unref(form).service_ids = $event,
                            class: "w-full",
                            items: unref(serviceOptions),
                            multiple: "",
                            placeholder: "Выберите услуги",
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Действует до" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(form).expires_at,
                          "onUpdate:modelValue": ($event) => unref(form).expires_at = $event,
                          type: "date"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).expires_at,
                            "onUpdate:modelValue": ($event) => unref(form).expires_at = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "JSON метаданных" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UTextarea, {
                          modelValue: unref(form).metadata,
                          "onUpdate:modelValue": ($event) => unref(form).metadata = $event,
                          rows: 5
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UTextarea, {
                            modelValue: unref(form).metadata,
                            "onUpdate:modelValue": ($event) => unref(form).metadata = $event,
                            rows: 5
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode(_component_UFormField, { label: "Код сертификата" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).code,
                            "onUpdate:modelValue": ($event) => unref(form).code = $event
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Услуги" }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(form).service_ids,
                            "onUpdate:modelValue": ($event) => unref(form).service_ids = $event,
                            class: "w-full",
                            items: unref(serviceOptions),
                            multiple: "",
                            placeholder: "Выберите услуги",
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Действует до" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(form).expires_at,
                            "onUpdate:modelValue": ($event) => unref(form).expires_at = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "JSON метаданных" }, {
                        default: withCtx(() => [
                          createVNode(_component_UTextarea, {
                            modelValue: unref(form).metadata,
                            "onUpdate:modelValue": ($event) => unref(form).metadata = $event,
                            rows: 5
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
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
                    onClick: resetCreateForm
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
                    icon: "i-lucide-id-card",
                    onClick: createCertificate
                  }, {
                    default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Создать сертификат `);
                      } else {
                        return [
                          createTextVNode(" Создать сертификат ")
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
                        onClick: resetCreateForm
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
                        icon: "i-lucide-id-card",
                        onClick: createCertificate
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Создать сертификат ")
                        ]),
                        _: 1
                      })
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UModal, {
              open: unref(lookupModalOpen),
              "onUpdate:open": ($event) => isRef(lookupModalOpen) ? lookupModalOpen.value = $event : null,
              class: "sm:max-w-2xl",
              description: unref(lookupModalDescription),
              title: "Проверить сертификат"
            }, {
              body: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="space-y-4"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Код сертификата" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(lookupCode),
                          "onUpdate:modelValue": ($event) => isRef(lookupCode) ? lookupCode.value = $event : null
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(lookupCode),
                            "onUpdate:modelValue": ($event) => isRef(lookupCode) ? lookupCode.value = $event : null
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`<div class="flex justify-end"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-search",
                    variant: "outline",
                    onClick: lookupCertificate
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Проверить `);
                      } else {
                        return [
                          createTextVNode(" Проверить ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div>`);
                  if (unref(lookupResult)) {
                    _push3(ssrRenderComponent(_component_SharedJsonBlock, {
                      label: "Ответ поиска",
                      value: unref(lookupResult)
                    }, null, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "space-y-4" }, [
                      createVNode(_component_UFormField, { label: "Код сертификата" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(lookupCode),
                            "onUpdate:modelValue": ($event) => isRef(lookupCode) ? lookupCode.value = $event : null
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode("div", { class: "flex justify-end" }, [
                        createVNode(_component_UButton, {
                          color: "neutral",
                          icon: "i-lucide-search",
                          variant: "outline",
                          onClick: lookupCertificate
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Проверить ")
                          ]),
                          _: 1
                        })
                      ]),
                      unref(lookupResult) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                        key: 0,
                        label: "Ответ поиска",
                        value: unref(lookupResult)
                      }, null, 8, ["value"])) : createCommentVNode("", true)
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
                    onClick: resetLookupState
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
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex w-full flex-wrap justify-end gap-3" }, [
                      createVNode(_component_UButton, {
                        color: "neutral",
                        variant: "outline",
                        onClick: resetLookupState
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
                      }, 8, ["onClick"])
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
                      createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Активный реестр "),
                      createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Действующие сертификаты ")
                    ]),
                    createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                      createVNode(_component_UBadge, {
                        color: "neutral",
                        size: "lg",
                        variant: "soft"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(unref(activeCertificates).length) + " активных ", 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "primary",
                        icon: "i-lucide-plus",
                        onClick: openCreateModal
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Создать ")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UButton, {
                        color: "neutral",
                        icon: "i-lucide-search",
                        variant: "outline",
                        onClick: openLookupModal
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Проверить ")
                        ]),
                        _: 1
                      })
                    ])
                  ])
                ]),
                default: withCtx(() => [
                  unref(activeCertificates).length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
                  }, [
                    createVNode("div", { class: "max-h-[42rem] overflow-auto" }, [
                      createVNode(_component_UTable, {
                        columns: certificateColumns,
                        data: unref(activeCertificates),
                        loading: unref(pending),
                        sticky: "header",
                        ui: {
                          root: "w-full overflow-auto",
                          base: "w-full min-w-[72rem]",
                          thead: "bg-charcoal-50/90",
                          tbody: "divide-y divide-charcoal-100",
                          th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                          td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                        }
                      }, {
                        "code-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "font-mono font-medium text-charcoal-950" }, toDisplayString(row.original.code), 1)
                        ]),
                        "services-cell": withCtx(({ row }) => [
                          createVNode("div", { class: "flex max-w-[22rem] flex-wrap gap-2" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(row.original.service_ids, (serviceId) => {
                              return openBlock(), createBlock(_component_UBadge, {
                                key: serviceId,
                                color: "neutral",
                                variant: "soft"
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(unref(serviceNameMap).get(serviceId) || serviceId), 1)
                                ]),
                                _: 2
                              }, 1024);
                            }), 128))
                          ])
                        ]),
                        "expires_at-cell": withCtx(({ row }) => [
                          createTextVNode(toDisplayString(row.original.expires_at ? unref(formatDateTime)(row.original.expires_at) : "Без срока"), 1)
                        ]),
                        "metadata-cell": withCtx(({ row }) => [
                          createVNode("span", { class: "block max-w-[18rem] truncate text-charcoal-500" }, toDisplayString(formatMetadataPreview(row.original.metadata)), 1)
                        ]),
                        "status-cell": withCtx(({ row }) => [
                          createVNode(_component_SharedStatusBadge, {
                            label: row.original.is_used ? "used" : "active"
                          }, null, 8, ["label"])
                        ]),
                        _: 1
                      }, 8, ["data", "loading"])
                    ])
                  ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                    key: 1,
                    description: "Не найдено ни одного действующего сертификата.",
                    icon: "i-lucide-id-card",
                    title: "Активных сертификатов нет"
                  }))
                ]),
                _: 1
              }),
              createVNode(_component_UModal, {
                open: unref(createModalOpen),
                "onUpdate:open": ($event) => isRef(createModalOpen) ? createModalOpen.value = $event : null,
                class: "sm:max-w-2xl",
                description: unref(createModalDescription),
                title: "Создать сертификат"
              }, {
                body: withCtx(() => [
                  createVNode("div", { class: "space-y-4" }, [
                    createVNode(_component_UFormField, { label: "Код сертификата" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(form).code,
                          "onUpdate:modelValue": ($event) => unref(form).code = $event
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UFormField, { label: "Услуги" }, {
                      default: withCtx(() => [
                        createVNode(_component_USelectMenu, {
                          modelValue: unref(form).service_ids,
                          "onUpdate:modelValue": ($event) => unref(form).service_ids = $event,
                          class: "w-full",
                          items: unref(serviceOptions),
                          multiple: "",
                          placeholder: "Выберите услуги",
                          "value-key": "value"
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UFormField, { label: "Действует до" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(form).expires_at,
                          "onUpdate:modelValue": ($event) => unref(form).expires_at = $event,
                          type: "date"
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UFormField, { label: "JSON метаданных" }, {
                      default: withCtx(() => [
                        createVNode(_component_UTextarea, {
                          modelValue: unref(form).metadata,
                          "onUpdate:modelValue": ($event) => unref(form).metadata = $event,
                          rows: 5
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
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
                      onClick: resetCreateForm
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
                      icon: "i-lucide-id-card",
                      onClick: createCertificate
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Создать сертификат ")
                      ]),
                      _: 1
                    })
                  ])
                ]),
                _: 1
              }, 8, ["open", "onUpdate:open", "description"]),
              createVNode(_component_UModal, {
                open: unref(lookupModalOpen),
                "onUpdate:open": ($event) => isRef(lookupModalOpen) ? lookupModalOpen.value = $event : null,
                class: "sm:max-w-2xl",
                description: unref(lookupModalDescription),
                title: "Проверить сертификат"
              }, {
                body: withCtx(() => [
                  createVNode("div", { class: "space-y-4" }, [
                    createVNode(_component_UFormField, { label: "Код сертификата" }, {
                      default: withCtx(() => [
                        createVNode(_component_UInput, {
                          modelValue: unref(lookupCode),
                          "onUpdate:modelValue": ($event) => isRef(lookupCode) ? lookupCode.value = $event : null
                        }, null, 8, ["modelValue", "onUpdate:modelValue"])
                      ]),
                      _: 1
                    }),
                    createVNode("div", { class: "flex justify-end" }, [
                      createVNode(_component_UButton, {
                        color: "neutral",
                        icon: "i-lucide-search",
                        variant: "outline",
                        onClick: lookupCertificate
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Проверить ")
                        ]),
                        _: 1
                      })
                    ]),
                    unref(lookupResult) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                      key: 0,
                      label: "Ответ поиска",
                      value: unref(lookupResult)
                    }, null, 8, ["value"])) : createCommentVNode("", true)
                  ])
                ]),
                footer: withCtx(({ close }) => [
                  createVNode("div", { class: "flex w-full flex-wrap justify-end gap-3" }, [
                    createVNode(_component_UButton, {
                      color: "neutral",
                      variant: "outline",
                      onClick: resetLookupState
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
                    }, 8, ["onClick"])
                  ])
                ]),
                _: 1
              }, 8, ["open", "onUpdate:open", "description"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/certificates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/certificates-ApkoJuN9');
//# sourceMappingURL=certificates-ApkoJuN9.mjs.map
