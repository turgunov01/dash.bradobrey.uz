globalThis.__timing__.logStart('Load chunks/build/kiosk-D59ztNOP');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$7 } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { e as useApiClient, b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a, h as useAppConfig, i as useComponentUI, r as reactivePick, t as tv, q as get, l as _sfc_main$f, m as _sfc_main$d } from './server.mjs';
import { defineComponent, withAsyncContext, ref, reactive, computed, watch, mergeProps, withCtx, unref, isRef, createVNode, toDisplayString, createTextVNode, openBlock, createBlock, Fragment, renderList, createCommentVNode, useSlots, renderSlot, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderSlot, ssrRenderClass } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { useForwardPropsEmits, TabsRoot, TabsList, TabsIndicator, TabsTrigger, TabsContent } from 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
import { _ as _sfc_main$8 } from './Badge-CKFwwagy.mjs';
import { _ as _sfc_main$4 } from './Table-2pT4H1Ma.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
import { _ as _sfc_main$5 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$6 } from './Input-BrToCniw.mjs';
import { _ as __nuxt_component_10 } from './JsonBlock-DvPUbwNJ.mjs';
import { k as kioskBookingSchema, e as kioskRegisterSchema } from '../_/index.mjs';
import { f as flattenServicesPayload } from './services-D0S0WuHG.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import { u as useKioskApi } from './useKioskApi-l3XfHmhL.mjs';
import { u as useRealtimeQueue } from './useRealtimeQueue-CK9yRiyf.mjs';
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

const theme = {
  "slots": {
    "root": "flex items-center gap-2",
    "list": "relative flex p-1 group",
    "indicator": "absolute transition-[translate,width] duration-200",
    "trigger": [
      "group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75",
      "transition-colors"
    ],
    "leadingIcon": "shrink-0",
    "leadingAvatar": "shrink-0",
    "leadingAvatarSize": "",
    "label": "truncate",
    "trailingBadge": "shrink-0",
    "trailingBadgeSize": "sm",
    "content": "focus:outline-none w-full"
  },
  "variants": {
    "color": {
      "primary": "",
      "secondary": "",
      "success": "",
      "info": "",
      "warning": "",
      "error": "",
      "neutral": ""
    },
    "variant": {
      "pill": {
        "list": "bg-elevated rounded-lg",
        "trigger": "grow",
        "indicator": "rounded-md shadow-xs"
      },
      "link": {
        "list": "border-default",
        "indicator": "rounded-full",
        "trigger": "focus:outline-none"
      }
    },
    "orientation": {
      "horizontal": {
        "root": "flex-col",
        "list": "w-full",
        "indicator": "left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)",
        "trigger": "justify-center"
      },
      "vertical": {
        "list": "flex-col",
        "indicator": "top-0 h-(--reka-tabs-indicator-size) translate-y-(--reka-tabs-indicator-position)"
      }
    },
    "size": {
      "xs": {
        "trigger": "px-2 py-1 text-xs gap-1",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs"
      },
      "sm": {
        "trigger": "px-2.5 py-1.5 text-xs gap-1.5",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs"
      },
      "md": {
        "trigger": "px-3 py-1.5 text-sm gap-1.5",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs"
      },
      "lg": {
        "trigger": "px-3 py-2 text-sm gap-2",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs"
      },
      "xl": {
        "trigger": "px-3 py-2 text-base gap-2",
        "leadingIcon": "size-6",
        "leadingAvatarSize": "xs"
      }
    }
  },
  "compoundVariants": [
    {
      "orientation": "horizontal",
      "variant": "pill",
      "class": {
        "indicator": "inset-y-1"
      }
    },
    {
      "orientation": "horizontal",
      "variant": "link",
      "class": {
        "list": "border-b -mb-px",
        "indicator": "-bottom-px h-px"
      }
    },
    {
      "orientation": "vertical",
      "variant": "pill",
      "class": {
        "indicator": "inset-x-1",
        "list": "items-center"
      }
    },
    {
      "orientation": "vertical",
      "variant": "link",
      "class": {
        "list": "border-s -ms-px",
        "indicator": "-start-px w-px"
      }
    },
    {
      "color": "primary",
      "variant": "pill",
      "class": {
        "indicator": "bg-primary",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      }
    },
    {
      "color": "secondary",
      "variant": "pill",
      "class": {
        "indicator": "bg-secondary",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      }
    },
    {
      "color": "success",
      "variant": "pill",
      "class": {
        "indicator": "bg-success",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
      }
    },
    {
      "color": "info",
      "variant": "pill",
      "class": {
        "indicator": "bg-info",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      }
    },
    {
      "color": "warning",
      "variant": "pill",
      "class": {
        "indicator": "bg-warning",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning"
      }
    },
    {
      "color": "error",
      "variant": "pill",
      "class": {
        "indicator": "bg-error",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      }
    },
    {
      "color": "neutral",
      "variant": "pill",
      "class": {
        "indicator": "bg-inverted",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted"
      }
    },
    {
      "color": "primary",
      "variant": "link",
      "class": {
        "indicator": "bg-primary",
        "trigger": "data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      }
    },
    {
      "color": "secondary",
      "variant": "link",
      "class": {
        "indicator": "bg-secondary",
        "trigger": "data-[state=active]:text-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
      }
    },
    {
      "color": "success",
      "variant": "link",
      "class": {
        "indicator": "bg-success",
        "trigger": "data-[state=active]:text-success focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success"
      }
    },
    {
      "color": "info",
      "variant": "link",
      "class": {
        "indicator": "bg-info",
        "trigger": "data-[state=active]:text-info focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info"
      }
    },
    {
      "color": "warning",
      "variant": "link",
      "class": {
        "indicator": "bg-warning",
        "trigger": "data-[state=active]:text-warning focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning"
      }
    },
    {
      "color": "error",
      "variant": "link",
      "class": {
        "indicator": "bg-error",
        "trigger": "data-[state=active]:text-error focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error"
      }
    },
    {
      "color": "neutral",
      "variant": "link",
      "class": {
        "indicator": "bg-inverted",
        "trigger": "data-[state=active]:text-highlighted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted"
      }
    }
  ],
  "defaultVariants": {
    "color": "primary",
    "variant": "pill",
    "size": "md"
  }
};
const _sfc_main$1 = {
  __name: "UTabs",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false },
    items: { type: Array, required: false },
    color: { type: null, required: false },
    variant: { type: null, required: false },
    size: { type: null, required: false },
    orientation: { type: null, required: false, default: "horizontal" },
    content: { type: Boolean, required: false, default: true },
    valueKey: { type: null, required: false, default: "value" },
    labelKey: { type: null, required: false, default: "label" },
    class: { type: null, required: false },
    ui: { type: Object, required: false },
    defaultValue: { type: [String, Number], required: false, default: "0" },
    modelValue: { type: [String, Number], required: false },
    activationMode: { type: String, required: false },
    unmountOnHide: { type: Boolean, required: false, default: true }
  },
  emits: ["update:modelValue"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const slots = useSlots();
    const appConfig = useAppConfig();
    const uiProp = useComponentUI("tabs", props);
    const rootProps = useForwardPropsEmits(reactivePick(props, "as", "unmountOnHide"), emits);
    const ui = computed(() => tv({ extend: tv(theme), ...appConfig.ui?.tabs || {} })({
      color: props.color,
      variant: props.variant,
      size: props.size,
      orientation: props.orientation
    }));
    const triggersRef = ref([]);
    function setTriggerRef(index, el) {
      triggersRef.value[index] = el;
    }
    __expose({
      triggersRef
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(TabsRoot), mergeProps(unref(rootProps), {
        "model-value": __props.modelValue,
        "default-value": __props.defaultValue,
        orientation: __props.orientation,
        "activation-mode": __props.activationMode,
        "data-slot": "root",
        class: ui.value.root({ class: [unref(uiProp)?.root, props.class] })
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(TabsList), {
              "data-slot": "list",
              class: ui.value.list({ class: unref(uiProp)?.list })
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(unref(TabsIndicator), {
                    "data-slot": "indicator",
                    class: ui.value.indicator({ class: unref(uiProp)?.indicator })
                  }, null, _parent3, _scopeId2));
                  ssrRenderSlot(_ctx.$slots, "list-leading", {}, null, _push3, _parent3, _scopeId2);
                  _push3(`<!--[-->`);
                  ssrRenderList(__props.items, (item, index) => {
                    _push3(ssrRenderComponent(unref(TabsTrigger), {
                      key: index,
                      ref_for: true,
                      ref: (el) => setTriggerRef(index, el),
                      value: unref(get)(item, props.valueKey) ?? String(index),
                      disabled: item.disabled,
                      "data-slot": "trigger",
                      class: ui.value.trigger({ class: [unref(uiProp)?.trigger, item.ui?.trigger] })
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          ssrRenderSlot(_ctx.$slots, "leading", {
                            item,
                            index,
                            ui: ui.value
                          }, () => {
                            if (item.icon) {
                              _push4(ssrRenderComponent(_sfc_main$f, {
                                name: item.icon,
                                "data-slot": "leadingIcon",
                                class: ui.value.leadingIcon({ class: [unref(uiProp)?.leadingIcon, item.ui?.leadingIcon] })
                              }, null, _parent4, _scopeId3));
                            } else if (item.avatar) {
                              _push4(ssrRenderComponent(_sfc_main$d, mergeProps({
                                size: item.ui?.leadingAvatarSize || unref(uiProp)?.leadingAvatarSize || ui.value.leadingAvatarSize()
                              }, { ref_for: true }, item.avatar, {
                                "data-slot": "leadingAvatar",
                                class: ui.value.leadingAvatar({ class: [unref(uiProp)?.leadingAvatar, item.ui?.leadingAvatar] })
                              }), null, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                          }, _push4, _parent4, _scopeId3);
                          if (unref(get)(item, props.labelKey) || !!slots.default) {
                            _push4(`<span data-slot="label" class="${ssrRenderClass(ui.value.label({ class: [unref(uiProp)?.label, item.ui?.label] }))}"${_scopeId3}>`);
                            ssrRenderSlot(_ctx.$slots, "default", {
                              item,
                              index
                            }, () => {
                              _push4(`${ssrInterpolate(unref(get)(item, props.labelKey))}`);
                            }, _push4, _parent4, _scopeId3);
                            _push4(`</span>`);
                          } else {
                            _push4(`<!---->`);
                          }
                          ssrRenderSlot(_ctx.$slots, "trailing", {
                            item,
                            index,
                            ui: ui.value
                          }, () => {
                            if (item.badge || item.badge === 0) {
                              _push4(ssrRenderComponent(_sfc_main$8, mergeProps({
                                color: "neutral",
                                variant: "outline",
                                size: item.ui?.trailingBadgeSize || unref(uiProp)?.trailingBadgeSize || ui.value.trailingBadgeSize()
                              }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                                "data-slot": "trailingBadge",
                                class: ui.value.trailingBadge({ class: [unref(uiProp)?.trailingBadge, item.ui?.trailingBadge] })
                              }), null, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                          }, _push4, _parent4, _scopeId3);
                        } else {
                          return [
                            renderSlot(_ctx.$slots, "leading", {
                              item,
                              index,
                              ui: ui.value
                            }, () => [
                              item.icon ? (openBlock(), createBlock(_sfc_main$f, {
                                key: 0,
                                name: item.icon,
                                "data-slot": "leadingIcon",
                                class: ui.value.leadingIcon({ class: [unref(uiProp)?.leadingIcon, item.ui?.leadingIcon] })
                              }, null, 8, ["name", "class"])) : item.avatar ? (openBlock(), createBlock(_sfc_main$d, mergeProps({
                                key: 1,
                                size: item.ui?.leadingAvatarSize || unref(uiProp)?.leadingAvatarSize || ui.value.leadingAvatarSize()
                              }, { ref_for: true }, item.avatar, {
                                "data-slot": "leadingAvatar",
                                class: ui.value.leadingAvatar({ class: [unref(uiProp)?.leadingAvatar, item.ui?.leadingAvatar] })
                              }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                            ]),
                            unref(get)(item, props.labelKey) || !!slots.default ? (openBlock(), createBlock("span", {
                              key: 0,
                              "data-slot": "label",
                              class: ui.value.label({ class: [unref(uiProp)?.label, item.ui?.label] })
                            }, [
                              renderSlot(_ctx.$slots, "default", {
                                item,
                                index
                              }, () => [
                                createTextVNode(toDisplayString(unref(get)(item, props.labelKey)), 1)
                              ])
                            ], 2)) : createCommentVNode("", true),
                            renderSlot(_ctx.$slots, "trailing", {
                              item,
                              index,
                              ui: ui.value
                            }, () => [
                              item.badge || item.badge === 0 ? (openBlock(), createBlock(_sfc_main$8, mergeProps({
                                key: 0,
                                color: "neutral",
                                variant: "outline",
                                size: item.ui?.trailingBadgeSize || unref(uiProp)?.trailingBadgeSize || ui.value.trailingBadgeSize()
                              }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                                "data-slot": "trailingBadge",
                                class: ui.value.trailingBadge({ class: [unref(uiProp)?.trailingBadge, item.ui?.trailingBadge] })
                              }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                            ])
                          ];
                        }
                      }),
                      _: 2
                    }, _parent3, _scopeId2));
                  });
                  _push3(`<!--]-->`);
                  ssrRenderSlot(_ctx.$slots, "list-trailing", {}, null, _push3, _parent3, _scopeId2);
                } else {
                  return [
                    createVNode(unref(TabsIndicator), {
                      "data-slot": "indicator",
                      class: ui.value.indicator({ class: unref(uiProp)?.indicator })
                    }, null, 8, ["class"]),
                    renderSlot(_ctx.$slots, "list-leading"),
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.items, (item, index) => {
                      return openBlock(), createBlock(unref(TabsTrigger), {
                        key: index,
                        ref_for: true,
                        ref: (el) => setTriggerRef(index, el),
                        value: unref(get)(item, props.valueKey) ?? String(index),
                        disabled: item.disabled,
                        "data-slot": "trigger",
                        class: ui.value.trigger({ class: [unref(uiProp)?.trigger, item.ui?.trigger] })
                      }, {
                        default: withCtx(() => [
                          renderSlot(_ctx.$slots, "leading", {
                            item,
                            index,
                            ui: ui.value
                          }, () => [
                            item.icon ? (openBlock(), createBlock(_sfc_main$f, {
                              key: 0,
                              name: item.icon,
                              "data-slot": "leadingIcon",
                              class: ui.value.leadingIcon({ class: [unref(uiProp)?.leadingIcon, item.ui?.leadingIcon] })
                            }, null, 8, ["name", "class"])) : item.avatar ? (openBlock(), createBlock(_sfc_main$d, mergeProps({
                              key: 1,
                              size: item.ui?.leadingAvatarSize || unref(uiProp)?.leadingAvatarSize || ui.value.leadingAvatarSize()
                            }, { ref_for: true }, item.avatar, {
                              "data-slot": "leadingAvatar",
                              class: ui.value.leadingAvatar({ class: [unref(uiProp)?.leadingAvatar, item.ui?.leadingAvatar] })
                            }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                          ]),
                          unref(get)(item, props.labelKey) || !!slots.default ? (openBlock(), createBlock("span", {
                            key: 0,
                            "data-slot": "label",
                            class: ui.value.label({ class: [unref(uiProp)?.label, item.ui?.label] })
                          }, [
                            renderSlot(_ctx.$slots, "default", {
                              item,
                              index
                            }, () => [
                              createTextVNode(toDisplayString(unref(get)(item, props.labelKey)), 1)
                            ])
                          ], 2)) : createCommentVNode("", true),
                          renderSlot(_ctx.$slots, "trailing", {
                            item,
                            index,
                            ui: ui.value
                          }, () => [
                            item.badge || item.badge === 0 ? (openBlock(), createBlock(_sfc_main$8, mergeProps({
                              key: 0,
                              color: "neutral",
                              variant: "outline",
                              size: item.ui?.trailingBadgeSize || unref(uiProp)?.trailingBadgeSize || ui.value.trailingBadgeSize()
                            }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                              "data-slot": "trailingBadge",
                              class: ui.value.trailingBadge({ class: [unref(uiProp)?.trailingBadge, item.ui?.trailingBadge] })
                            }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                          ])
                        ]),
                        _: 2
                      }, 1032, ["value", "disabled", "class"]);
                    }), 128)),
                    renderSlot(_ctx.$slots, "list-trailing")
                  ];
                }
              }),
              _: 3
            }, _parent2, _scopeId));
            if (!!__props.content) {
              _push2(`<!--[-->`);
              ssrRenderList(__props.items, (item, index) => {
                _push2(ssrRenderComponent(unref(TabsContent), {
                  key: index,
                  value: unref(get)(item, props.valueKey) ?? String(index),
                  "data-slot": "content",
                  class: ui.value.content({ class: [unref(uiProp)?.content, item.ui?.content, item.class] })
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      ssrRenderSlot(_ctx.$slots, item.slot || "content", {
                        item,
                        index,
                        ui: ui.value
                      }, () => {
                        _push3(`${ssrInterpolate(item.content)}`);
                      }, _push3, _parent3, _scopeId2);
                    } else {
                      return [
                        renderSlot(_ctx.$slots, item.slot || "content", {
                          item,
                          index,
                          ui: ui.value
                        }, () => [
                          createTextVNode(toDisplayString(item.content), 1)
                        ])
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode(unref(TabsList), {
                "data-slot": "list",
                class: ui.value.list({ class: unref(uiProp)?.list })
              }, {
                default: withCtx(() => [
                  createVNode(unref(TabsIndicator), {
                    "data-slot": "indicator",
                    class: ui.value.indicator({ class: unref(uiProp)?.indicator })
                  }, null, 8, ["class"]),
                  renderSlot(_ctx.$slots, "list-leading"),
                  (openBlock(true), createBlock(Fragment, null, renderList(__props.items, (item, index) => {
                    return openBlock(), createBlock(unref(TabsTrigger), {
                      key: index,
                      ref_for: true,
                      ref: (el) => setTriggerRef(index, el),
                      value: unref(get)(item, props.valueKey) ?? String(index),
                      disabled: item.disabled,
                      "data-slot": "trigger",
                      class: ui.value.trigger({ class: [unref(uiProp)?.trigger, item.ui?.trigger] })
                    }, {
                      default: withCtx(() => [
                        renderSlot(_ctx.$slots, "leading", {
                          item,
                          index,
                          ui: ui.value
                        }, () => [
                          item.icon ? (openBlock(), createBlock(_sfc_main$f, {
                            key: 0,
                            name: item.icon,
                            "data-slot": "leadingIcon",
                            class: ui.value.leadingIcon({ class: [unref(uiProp)?.leadingIcon, item.ui?.leadingIcon] })
                          }, null, 8, ["name", "class"])) : item.avatar ? (openBlock(), createBlock(_sfc_main$d, mergeProps({
                            key: 1,
                            size: item.ui?.leadingAvatarSize || unref(uiProp)?.leadingAvatarSize || ui.value.leadingAvatarSize()
                          }, { ref_for: true }, item.avatar, {
                            "data-slot": "leadingAvatar",
                            class: ui.value.leadingAvatar({ class: [unref(uiProp)?.leadingAvatar, item.ui?.leadingAvatar] })
                          }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                        ]),
                        unref(get)(item, props.labelKey) || !!slots.default ? (openBlock(), createBlock("span", {
                          key: 0,
                          "data-slot": "label",
                          class: ui.value.label({ class: [unref(uiProp)?.label, item.ui?.label] })
                        }, [
                          renderSlot(_ctx.$slots, "default", {
                            item,
                            index
                          }, () => [
                            createTextVNode(toDisplayString(unref(get)(item, props.labelKey)), 1)
                          ])
                        ], 2)) : createCommentVNode("", true),
                        renderSlot(_ctx.$slots, "trailing", {
                          item,
                          index,
                          ui: ui.value
                        }, () => [
                          item.badge || item.badge === 0 ? (openBlock(), createBlock(_sfc_main$8, mergeProps({
                            key: 0,
                            color: "neutral",
                            variant: "outline",
                            size: item.ui?.trailingBadgeSize || unref(uiProp)?.trailingBadgeSize || ui.value.trailingBadgeSize()
                          }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                            "data-slot": "trailingBadge",
                            class: ui.value.trailingBadge({ class: [unref(uiProp)?.trailingBadge, item.ui?.trailingBadge] })
                          }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                        ])
                      ]),
                      _: 2
                    }, 1032, ["value", "disabled", "class"]);
                  }), 128)),
                  renderSlot(_ctx.$slots, "list-trailing")
                ]),
                _: 3
              }, 8, ["class"]),
              !!__props.content ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(__props.items, (item, index) => {
                return openBlock(), createBlock(unref(TabsContent), {
                  key: index,
                  value: unref(get)(item, props.valueKey) ?? String(index),
                  "data-slot": "content",
                  class: ui.value.content({ class: [unref(uiProp)?.content, item.ui?.content, item.class] })
                }, {
                  default: withCtx(() => [
                    renderSlot(_ctx.$slots, item.slot || "content", {
                      item,
                      index,
                      ui: ui.value
                    }, () => [
                      createTextVNode(toDisplayString(item.content), 1)
                    ])
                  ]),
                  _: 2
                }, 1032, ["value", "class"]);
              }), 128)) : createCommentVNode("", true)
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/@nuxt/ui/dist/runtime/components/Tabs.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "kiosk",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const branchStore = useBranchStore();
    const client = useApiClient();
    const kioskApi = useKioskApi();
    [__temp, __restore] = withAsyncContext(() => branchStore.ensureLoaded()), await __temp, __restore();
    useRealtimeQueue();
    const activeTab = ref("barbers");
    const bookingForm = reactive({
      certificate_code: "",
      customer_name: "",
      payment_method: "cash",
      phone_number: "",
      source: "dashboard-kiosk"
    });
    const deviceName = ref("Планшет ресепшена");
    const selectedBarberId = ref("");
    const selectedServiceIds = ref([]);
    const certificateCode = ref("");
    const certificateResult = ref(null);
    const bookingPending = ref(false);
    const baseTabs = [
      { label: "Барберы", value: "barbers" },
      { label: "Услуги", value: "services" },
      { label: "Бронирование", value: "booking" }
    ];
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("kiosk-dashboard", async () => {
      const [services, barbers] = await Promise.all([
        kioskApi.services({ active: true, grouped: true }),
        branchStore.activeBranchId ? kioskApi.barbers(branchStore.activeBranchId) : Promise.resolve({ data: [] })
      ]);
      return {
        barbers: Array.isArray(barbers?.data) ? barbers.data : [],
        services
      };
    }, {
      watch: [() => branchStore.activeBranchId]
    })), __temp = await __temp, __restore(), __temp);
    const allServices = computed(() => flattenServicesPayload(data.value?.services));
    const barberRows = computed(
      () => (data.value?.barbers || []).map((barber, index) => ({
        barberId: barber.id !== void 0 ? String(barber.id) : "",
        currentClients: barber.current_clients || 0,
        id: String(barber.id ?? barber.user_id ?? barber.name ?? `barber-${index}`),
        name: barber.name || barber.user?.name || "Барбер без имени",
        waitTime: barber.estimated_waiting_time || 0
      }))
    );
    const hasBarbers = computed(() => barberRows.value.length > 0);
    const tabs = computed(
      () => baseTabs.map(
        (tab) => tab.value === "barbers" ? tab : { ...tab, disabled: !hasBarbers.value }
      )
    );
    const serviceRows = computed(
      () => allServices.value.map((service, index) => ({
        category: service.category || service.category_name || "Без категории",
        duration: Number(service.duration || 0),
        id: String(service.id ?? `service-${index}`),
        name: service.name || "Услуга без названия",
        price: service.price ?? 0,
        serviceId: service.id !== void 0 ? String(service.id) : ""
      }))
    );
    const barberColumns = [
      { accessorKey: "name", header: "Барбер" },
      { accessorKey: "currentClients", header: "Клиенты" },
      { accessorKey: "waitTime", header: "Ожидание" },
      { id: "action", header: "" }
    ];
    const serviceColumns = [
      { accessorKey: "category", header: "Категория" },
      { accessorKey: "name", header: "Услуга" },
      { accessorKey: "duration", header: "Длительность" },
      { accessorKey: "price", header: "Цена" },
      { id: "action", header: "" }
    ];
    const selectedBarber = computed(
      () => (data.value?.barbers || []).find((barber) => String(barber.id) === selectedBarberId.value) || null
    );
    const selectedServices = computed(
      () => allServices.value.filter((service) => selectedServiceIds.value.includes(String(service.id)))
    );
    watch(
      barberRows,
      (rows) => {
        if (!rows.length) {
          selectedBarberId.value = "";
          return;
        }
        if (!rows.some((row) => row.barberId === selectedBarberId.value) && rows[0]?.barberId) {
          selectedBarberId.value = rows[0].barberId;
        }
      },
      { immediate: true }
    );
    watch(
      hasBarbers,
      (value) => {
        if (!value && activeTab.value !== "barbers") {
          activeTab.value = "barbers";
        }
      },
      { immediate: true }
    );
    function selectBarber(barberId) {
      selectedBarberId.value = barberId;
    }
    function toggleService(serviceId) {
      if (!serviceId) {
        return;
      }
      if (selectedServiceIds.value.includes(serviceId)) {
        selectedServiceIds.value = selectedServiceIds.value.filter((id) => id !== serviceId);
        return;
      }
      selectedServiceIds.value = [...selectedServiceIds.value, serviceId];
    }
    function handleBarberSelect(_, row) {
      if (!row.original.barberId) {
        return;
      }
      selectBarber(row.original.barberId);
    }
    function handleServiceSelect(_, row) {
      if (!row.original.serviceId) {
        return;
      }
      toggleService(row.original.serviceId);
    }
    async function registerDevice() {
      const payload = kioskRegisterSchema.safeParse({
        branch_id: branchStore.activeBranchId,
        device_name: deviceName.value
      });
      if (!payload.success) {
        client.notifyError(new Error(payload.error.issues[0]?.message || "Некорректные данные регистрации киоска"));
        return;
      }
      await kioskApi.register(payload.data);
    }
    async function lookupCertificate() {
      if (!certificateCode.value) {
        client.notifyError(new Error("Введите код сертификата"));
        return;
      }
      certificateResult.value = await kioskApi.certificate(certificateCode.value);
    }
    async function createBooking() {
      const payload = kioskBookingSchema.safeParse({
        barber_id: selectedBarberId.value,
        branch_id: branchStore.activeBranchId,
        certificate_code: bookingForm.certificate_code || void 0,
        customer_name: bookingForm.customer_name,
        payment_method: bookingForm.payment_method || void 0,
        phone_number: bookingForm.phone_number,
        service_ids: selectedServiceIds.value,
        source: bookingForm.source
      });
      if (!payload.success) {
        client.notifyError(new Error(payload.error.issues[0]?.message || "Некорректные данные записи через киоск"));
        return;
      }
      bookingPending.value = true;
      try {
        await kioskApi.book(payload.data);
        bookingForm.certificate_code = "";
        bookingForm.customer_name = "";
        bookingForm.phone_number = "";
        selectedServiceIds.value = [];
        activeTab.value = "barbers";
        await refresh();
      } finally {
        bookingPending.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$7;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UTabs = _sfc_main$1;
      const _component_UTable = _sfc_main$4;
      const _component_SharedEmptyState = __nuxt_component_9;
      const _component_UFormField = _sfc_main$5;
      const _component_UInput = _sfc_main$6;
      const _component_SharedJsonBlock = __nuxt_component_10;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "kiosk" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Симулятор киоска",
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
                title: "Симулятор киоска",
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
            _push2(`<div class="space-y-6"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Активный филиал </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(branchStore).activeBranch?.name || "Выберите филиал в боковой панели")}</h2></div><div class="overflow-x-auto"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UTabs, {
                    modelValue: unref(activeTab),
                    "onUpdate:modelValue": ($event) => isRef(activeTab) ? activeTab.value = $event : null,
                    content: false,
                    items: unref(tabs),
                    ui: {
                      root: "min-w-max items-start",
                      list: "inline-flex w-max rounded-[1.35rem] bg-charcoal-100 p-1.5",
                      indicator: "rounded-[0.95rem] bg-primary shadow-none",
                      trigger: "h-11 rounded-[0.95rem] px-4 text-sm font-semibold data-[state=active]:text-inverted sm:text-[15px]",
                      label: "whitespace-nowrap"
                    }
                  }, null, _parent3, _scopeId2));
                  _push3(`</div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Активный филиал "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, toDisplayString(unref(branchStore).activeBranch?.name || "Выберите филиал в боковой панели"), 1)
                      ]),
                      createVNode("div", { class: "overflow-x-auto" }, [
                        createVNode(_component_UTabs, {
                          modelValue: unref(activeTab),
                          "onUpdate:modelValue": ($event) => isRef(activeTab) ? activeTab.value = $event : null,
                          content: false,
                          items: unref(tabs),
                          ui: {
                            root: "min-w-max items-start",
                            list: "inline-flex w-max rounded-[1.35rem] bg-charcoal-100 p-1.5",
                            indicator: "rounded-[0.95rem] bg-primary shadow-none",
                            trigger: "h-11 rounded-[0.95rem] px-4 text-sm font-semibold data-[state=active]:text-inverted sm:text-[15px]",
                            label: "whitespace-nowrap"
                          }
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                      ])
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (unref(activeTab) === "barbers") {
              _push2(`<section class="space-y-4"${_scopeId}>`);
              if (unref(barberRows).length) {
                _push2(`<div class="overflow-hidden rounded-[1.5rem] border border-charcoal-200 bg-white/90"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_UTable, {
                  columns: barberColumns,
                  data: unref(barberRows),
                  "get-row-id": (row) => row.id,
                  loading: unref(pending),
                  meta: {
                    class: {
                      tr: (row) => row.original.barberId === unref(selectedBarberId) ? "bg-primary/10 cursor-pointer" : "cursor-pointer"
                    }
                  },
                  "on-select": handleBarberSelect,
                  sticky: "header",
                  ui: {
                    root: "max-h-[32rem] overflow-auto",
                    base: "min-w-[44rem]",
                    thead: "bg-charcoal-50/90",
                    tbody: "divide-y divide-charcoal-100 [&>tr]:data-[selectable=true]:hover:bg-charcoal-50/80",
                    th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                    td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                  }
                }, {
                  "name-cell": withCtx(({ row }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<div${_scopeId2}><p class="font-medium text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.original.name)}</p><p class="text-xs text-charcoal-500"${_scopeId2}>${ssrInterpolate(row.original.barberId === unref(selectedBarberId) ? "Выбранный барбер" : "Нажмите, чтобы назначить")}</p></div>`);
                    } else {
                      return [
                        createVNode("div", null, [
                          createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.name), 1),
                          createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.barberId === unref(selectedBarberId) ? "Выбранный барбер" : "Нажмите, чтобы назначить"), 1)
                        ])
                      ];
                    }
                  }),
                  "waitTime-cell": withCtx(({ row }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<span class="font-medium"${_scopeId2}>${ssrInterpolate(row.original.waitTime)} мин</span>`);
                    } else {
                      return [
                        createVNode("span", { class: "font-medium" }, toDisplayString(row.original.waitTime) + " мин", 1)
                      ];
                    }
                  }),
                  "action-cell": withCtx(({ row }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_UButton, {
                        color: row.original.barberId === unref(selectedBarberId) ? "primary" : "neutral",
                        variant: row.original.barberId === unref(selectedBarberId) ? "solid" : "outline",
                        size: "xs",
                        onClick: ($event) => selectBarber(row.original.barberId)
                      }, {
                        default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(row.original.barberId === unref(selectedBarberId) ? "Выбран" : "Выбрать")}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(row.original.barberId === unref(selectedBarberId) ? "Выбран" : "Выбрать"), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    } else {
                      return [
                        createVNode(_component_UButton, {
                          color: row.original.barberId === unref(selectedBarberId) ? "primary" : "neutral",
                          variant: row.original.barberId === unref(selectedBarberId) ? "solid" : "outline",
                          size: "xs",
                          onClick: ($event) => selectBarber(row.original.barberId)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(row.original.barberId === unref(selectedBarberId) ? "Выбран" : "Выбрать"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color", "variant", "onClick"])
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                _push2(ssrRenderComponent(_component_SharedEmptyState, {
                  description: "Для текущего контекста филиала не получен список барберов.",
                  icon: "i-lucide-scissors",
                  title: "Барберы недоступны"
                }, null, _parent2, _scopeId));
              }
              _push2(`</section>`);
            } else if (unref(activeTab) === "services") {
              _push2(`<section class="space-y-4"${_scopeId}>`);
              if (unref(serviceRows).length) {
                _push2(`<div class="overflow-hidden rounded-[1.5rem] border border-charcoal-200 bg-white/90"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_UTable, {
                  columns: serviceColumns,
                  data: unref(serviceRows),
                  "get-row-id": (row) => row.id,
                  loading: unref(pending),
                  meta: {
                    class: {
                      tr: (row) => unref(selectedServiceIds).includes(row.original.serviceId) ? "bg-primary/10 cursor-pointer" : "cursor-pointer"
                    }
                  },
                  "on-select": handleServiceSelect,
                  sticky: "header",
                  ui: {
                    root: "max-h-[36rem] overflow-auto",
                    base: "min-w-[56rem]",
                    thead: "bg-charcoal-50/90",
                    tbody: "divide-y divide-charcoal-100 [&>tr]:data-[selectable=true]:hover:bg-charcoal-50/80",
                    th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                    td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                  }
                }, {
                  "name-cell": withCtx(({ row }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<div${_scopeId2}><p class="font-medium text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.original.name)}</p><p class="text-xs text-charcoal-500"${_scopeId2}>${ssrInterpolate(unref(selectedServiceIds).includes(row.original.serviceId) ? "Добавлено в запись" : "Доступно для добавления")}</p></div>`);
                    } else {
                      return [
                        createVNode("div", null, [
                          createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.name), 1),
                          createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(unref(selectedServiceIds).includes(row.original.serviceId) ? "Добавлено в запись" : "Доступно для добавления"), 1)
                        ])
                      ];
                    }
                  }),
                  "duration-cell": withCtx(({ row }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<span class="font-medium"${_scopeId2}>${ssrInterpolate(row.original.duration)} мин</span>`);
                    } else {
                      return [
                        createVNode("span", { class: "font-medium" }, toDisplayString(row.original.duration) + " мин", 1)
                      ];
                    }
                  }),
                  "action-cell": withCtx(({ row }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_UButton, {
                        color: unref(selectedServiceIds).includes(row.original.serviceId) ? "primary" : "neutral",
                        variant: unref(selectedServiceIds).includes(row.original.serviceId) ? "solid" : "outline",
                        size: "xs",
                        onClick: ($event) => toggleService(row.original.serviceId)
                      }, {
                        default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(unref(selectedServiceIds).includes(row.original.serviceId) ? "Убрать" : "Добавить")}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(unref(selectedServiceIds).includes(row.original.serviceId) ? "Убрать" : "Добавить"), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    } else {
                      return [
                        createVNode(_component_UButton, {
                          color: unref(selectedServiceIds).includes(row.original.serviceId) ? "primary" : "neutral",
                          variant: unref(selectedServiceIds).includes(row.original.serviceId) ? "solid" : "outline",
                          size: "xs",
                          onClick: ($event) => toggleService(row.original.serviceId)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(selectedServiceIds).includes(row.original.serviceId) ? "Убрать" : "Добавить"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color", "variant", "onClick"])
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                _push2(ssrRenderComponent(_component_SharedEmptyState, {
                  description: "Бэкенд не вернул услуги для киоска.",
                  icon: "i-lucide-badge-dollar-sign",
                  title: "Услуги недоступны"
                }, null, _parent2, _scopeId));
              }
              _push2(`</section>`);
            } else {
              _push2(`<section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Бронирование </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Оформление записи через киоск </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Бронирование "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Оформление записи через киоск ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UFormField, { label: "Имя клиента" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_UInput, {
                            modelValue: unref(bookingForm).customer_name,
                            "onUpdate:modelValue": ($event) => unref(bookingForm).customer_name = $event
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).customer_name,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).customer_name = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_UFormField, { label: "Телефон" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_UInput, {
                            modelValue: unref(bookingForm).phone_number,
                            "onUpdate:modelValue": ($event) => unref(bookingForm).phone_number = $event
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).phone_number,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).phone_number = $event
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
                            modelValue: unref(bookingForm).payment_method,
                            "onUpdate:modelValue": ($event) => unref(bookingForm).payment_method = $event
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).payment_method,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).payment_method = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_UFormField, { label: "Код сертификата" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_UInput, {
                            modelValue: unref(bookingForm).certificate_code,
                            "onUpdate:modelValue": ($event) => unref(bookingForm).certificate_code = $event
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).certificate_code,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).certificate_code = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<div class="flex justify-end"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UButton, {
                      loading: unref(bookingPending),
                      color: "primary",
                      icon: "i-lucide-receipt",
                      onClick: createBooking
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` Создать запись `);
                        } else {
                          return [
                            createTextVNode(" Создать запись ")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode(_component_UFormField, { label: "Имя клиента" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).customer_name,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).customer_name = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Телефон" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).phone_number,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).phone_number = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Способ оплаты" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).payment_method,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).payment_method = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Код сертификата" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).certificate_code,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).certificate_code = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode("div", { class: "flex justify-end" }, [
                          createVNode(_component_UButton, {
                            loading: unref(bookingPending),
                            color: "primary",
                            icon: "i-lucide-receipt",
                            onClick: createBooking
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Создать запись ")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ])
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`<div class="space-y-6"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Сводка записи </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Выбранный набор </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Сводка записи "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Выбранный набор ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-3"${_scopeId2}><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>Барбер</p><p class="mt-2 text-lg font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(selectedBarber)?.name || "Не выбран")}</p></div><div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}>Услуги</p>`);
                    if (unref(selectedServices).length) {
                      _push3(`<div class="mt-3 space-y-2"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(selectedServices), (service) => {
                        _push3(`<div class="rounded-[1rem] bg-sand-100 px-3 py-2 text-sm text-charcoal-700"${_scopeId2}>${ssrInterpolate(service.name)} / ${ssrInterpolate(service.duration || 0)} мин / ${ssrInterpolate(service.price || 0)}</div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(`<p class="mt-2 text-sm text-charcoal-500"${_scopeId2}>Услуги пока не выбраны.</p>`);
                    }
                    _push3(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Барбер"),
                          createVNode("p", { class: "mt-2 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(selectedBarber)?.name || "Не выбран"), 1)
                        ]),
                        createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Услуги"),
                          unref(selectedServices).length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "mt-3 space-y-2"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(selectedServices), (service) => {
                              return openBlock(), createBlock("div", {
                                key: String(service.id),
                                class: "rounded-[1rem] bg-sand-100 px-3 py-2 text-sm text-charcoal-700"
                              }, toDisplayString(service.name) + " / " + toDisplayString(service.duration || 0) + " мин / " + toDisplayString(service.price || 0), 1);
                            }), 128))
                          ])) : (openBlock(), createBlock("p", {
                            key: 1,
                            class: "mt-2 text-sm text-charcoal-500"
                          }, "Услуги пока не выбраны."))
                        ])
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Инструменты </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Регистрация и поиск </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Инструменты "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Регистрация и поиск ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UFormField, { label: "Имя устройства" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_UInput, {
                            modelValue: unref(deviceName),
                            "onUpdate:modelValue": ($event) => isRef(deviceName) ? deviceName.value = $event : null
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_UInput, {
                              modelValue: unref(deviceName),
                              "onUpdate:modelValue": ($event) => isRef(deviceName) ? deviceName.value = $event : null
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_UButton, {
                      color: "neutral",
                      icon: "i-lucide-tablet-smartphone",
                      variant: "outline",
                      onClick: registerDevice
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` Зарегистрировать устройство киоска `);
                        } else {
                          return [
                            createTextVNode(" Зарегистрировать устройство киоска ")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<div class="soft-divider border-t pt-4"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_UFormField, { label: "Поиск сертификата" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_UInput, {
                            modelValue: unref(certificateCode),
                            "onUpdate:modelValue": ($event) => isRef(certificateCode) ? certificateCode.value = $event : null,
                            placeholder: "Код сертификата"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_UInput, {
                              modelValue: unref(certificateCode),
                              "onUpdate:modelValue": ($event) => isRef(certificateCode) ? certificateCode.value = $event : null,
                              placeholder: "Код сертификата"
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_UButton, {
                      class: "mt-3",
                      color: "neutral",
                      icon: "i-lucide-search",
                      variant: "outline",
                      onClick: lookupCertificate
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` Найти сертификат `);
                        } else {
                          return [
                            createTextVNode(" Найти сертификат ")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                    if (unref(certificateResult)) {
                      _push3(ssrRenderComponent(_component_SharedJsonBlock, {
                        label: "Ответ сертификата",
                        value: unref(certificateResult)
                      }, null, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode(_component_UFormField, { label: "Имя устройства" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(deviceName),
                              "onUpdate:modelValue": ($event) => isRef(deviceName) ? deviceName.value = $event : null
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UButton, {
                          color: "neutral",
                          icon: "i-lucide-tablet-smartphone",
                          variant: "outline",
                          onClick: registerDevice
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Зарегистрировать устройство киоска ")
                          ]),
                          _: 1
                        }),
                        createVNode("div", { class: "soft-divider border-t pt-4" }, [
                          createVNode(_component_UFormField, { label: "Поиск сертификата" }, {
                            default: withCtx(() => [
                              createVNode(_component_UInput, {
                                modelValue: unref(certificateCode),
                                "onUpdate:modelValue": ($event) => isRef(certificateCode) ? certificateCode.value = $event : null,
                                placeholder: "Код сертификата"
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_UButton, {
                            class: "mt-3",
                            color: "neutral",
                            icon: "i-lucide-search",
                            variant: "outline",
                            onClick: lookupCertificate
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Найти сертификат ")
                            ]),
                            _: 1
                          })
                        ]),
                        unref(certificateResult) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                          key: 0,
                          label: "Ответ сертификата",
                          value: unref(certificateResult)
                        }, null, 8, ["value"])) : createCommentVNode("", true)
                      ])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div></section>`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                  default: withCtx(() => [
                    createVNode("div", { class: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Активный филиал "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, toDisplayString(unref(branchStore).activeBranch?.name || "Выберите филиал в боковой панели"), 1)
                      ]),
                      createVNode("div", { class: "overflow-x-auto" }, [
                        createVNode(_component_UTabs, {
                          modelValue: unref(activeTab),
                          "onUpdate:modelValue": ($event) => isRef(activeTab) ? activeTab.value = $event : null,
                          content: false,
                          items: unref(tabs),
                          ui: {
                            root: "min-w-max items-start",
                            list: "inline-flex w-max rounded-[1.35rem] bg-charcoal-100 p-1.5",
                            indicator: "rounded-[0.95rem] bg-primary shadow-none",
                            trigger: "h-11 rounded-[0.95rem] px-4 text-sm font-semibold data-[state=active]:text-inverted sm:text-[15px]",
                            label: "whitespace-nowrap"
                          }
                        }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                      ])
                    ])
                  ]),
                  _: 1
                }),
                unref(activeTab) === "barbers" ? (openBlock(), createBlock("section", {
                  key: 0,
                  class: "space-y-4"
                }, [
                  unref(barberRows).length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "overflow-hidden rounded-[1.5rem] border border-charcoal-200 bg-white/90"
                  }, [
                    createVNode(_component_UTable, {
                      columns: barberColumns,
                      data: unref(barberRows),
                      "get-row-id": (row) => row.id,
                      loading: unref(pending),
                      meta: {
                        class: {
                          tr: (row) => row.original.barberId === unref(selectedBarberId) ? "bg-primary/10 cursor-pointer" : "cursor-pointer"
                        }
                      },
                      "on-select": handleBarberSelect,
                      sticky: "header",
                      ui: {
                        root: "max-h-[32rem] overflow-auto",
                        base: "min-w-[44rem]",
                        thead: "bg-charcoal-50/90",
                        tbody: "divide-y divide-charcoal-100 [&>tr]:data-[selectable=true]:hover:bg-charcoal-50/80",
                        th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                        td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                      }
                    }, {
                      "name-cell": withCtx(({ row }) => [
                        createVNode("div", null, [
                          createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.name), 1),
                          createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.original.barberId === unref(selectedBarberId) ? "Выбранный барбер" : "Нажмите, чтобы назначить"), 1)
                        ])
                      ]),
                      "waitTime-cell": withCtx(({ row }) => [
                        createVNode("span", { class: "font-medium" }, toDisplayString(row.original.waitTime) + " мин", 1)
                      ]),
                      "action-cell": withCtx(({ row }) => [
                        createVNode(_component_UButton, {
                          color: row.original.barberId === unref(selectedBarberId) ? "primary" : "neutral",
                          variant: row.original.barberId === unref(selectedBarberId) ? "solid" : "outline",
                          size: "xs",
                          onClick: ($event) => selectBarber(row.original.barberId)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(row.original.barberId === unref(selectedBarberId) ? "Выбран" : "Выбрать"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color", "variant", "onClick"])
                      ]),
                      _: 1
                    }, 8, ["data", "get-row-id", "loading", "meta"])
                  ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                    key: 1,
                    description: "Для текущего контекста филиала не получен список барберов.",
                    icon: "i-lucide-scissors",
                    title: "Барберы недоступны"
                  }))
                ])) : unref(activeTab) === "services" ? (openBlock(), createBlock("section", {
                  key: 1,
                  class: "space-y-4"
                }, [
                  unref(serviceRows).length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "overflow-hidden rounded-[1.5rem] border border-charcoal-200 bg-white/90"
                  }, [
                    createVNode(_component_UTable, {
                      columns: serviceColumns,
                      data: unref(serviceRows),
                      "get-row-id": (row) => row.id,
                      loading: unref(pending),
                      meta: {
                        class: {
                          tr: (row) => unref(selectedServiceIds).includes(row.original.serviceId) ? "bg-primary/10 cursor-pointer" : "cursor-pointer"
                        }
                      },
                      "on-select": handleServiceSelect,
                      sticky: "header",
                      ui: {
                        root: "max-h-[36rem] overflow-auto",
                        base: "min-w-[56rem]",
                        thead: "bg-charcoal-50/90",
                        tbody: "divide-y divide-charcoal-100 [&>tr]:data-[selectable=true]:hover:bg-charcoal-50/80",
                        th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500",
                        td: "px-4 py-4 text-sm text-charcoal-700 align-middle"
                      }
                    }, {
                      "name-cell": withCtx(({ row }) => [
                        createVNode("div", null, [
                          createVNode("p", { class: "font-medium text-charcoal-950" }, toDisplayString(row.original.name), 1),
                          createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(unref(selectedServiceIds).includes(row.original.serviceId) ? "Добавлено в запись" : "Доступно для добавления"), 1)
                        ])
                      ]),
                      "duration-cell": withCtx(({ row }) => [
                        createVNode("span", { class: "font-medium" }, toDisplayString(row.original.duration) + " мин", 1)
                      ]),
                      "action-cell": withCtx(({ row }) => [
                        createVNode(_component_UButton, {
                          color: unref(selectedServiceIds).includes(row.original.serviceId) ? "primary" : "neutral",
                          variant: unref(selectedServiceIds).includes(row.original.serviceId) ? "solid" : "outline",
                          size: "xs",
                          onClick: ($event) => toggleService(row.original.serviceId)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(selectedServiceIds).includes(row.original.serviceId) ? "Убрать" : "Добавить"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color", "variant", "onClick"])
                      ]),
                      _: 1
                    }, 8, ["data", "get-row-id", "loading", "meta"])
                  ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                    key: 1,
                    description: "Бэкенд не вернул услуги для киоска.",
                    icon: "i-lucide-badge-dollar-sign",
                    title: "Услуги недоступны"
                  }))
                ])) : (openBlock(), createBlock("section", {
                  key: 2,
                  class: "grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"
                }, [
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Бронирование "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Оформление записи через киоск ")
                      ])
                    ]),
                    default: withCtx(() => [
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode(_component_UFormField, { label: "Имя клиента" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).customer_name,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).customer_name = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Телефон" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).phone_number,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).phone_number = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Способ оплаты" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).payment_method,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).payment_method = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UFormField, { label: "Код сертификата" }, {
                          default: withCtx(() => [
                            createVNode(_component_UInput, {
                              modelValue: unref(bookingForm).certificate_code,
                              "onUpdate:modelValue": ($event) => unref(bookingForm).certificate_code = $event
                            }, null, 8, ["modelValue", "onUpdate:modelValue"])
                          ]),
                          _: 1
                        }),
                        createVNode("div", { class: "flex justify-end" }, [
                          createVNode(_component_UButton, {
                            loading: unref(bookingPending),
                            color: "primary",
                            icon: "i-lucide-receipt",
                            onClick: createBooking
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Создать запись ")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ])
                      ])
                    ]),
                    _: 1
                  }),
                  createVNode("div", { class: "space-y-6" }, [
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Сводка записи "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Выбранный набор ")
                        ])
                      ]),
                      default: withCtx(() => [
                        createVNode("div", { class: "space-y-3" }, [
                          createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                            createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Барбер"),
                            createVNode("p", { class: "mt-2 text-lg font-semibold text-charcoal-950" }, toDisplayString(unref(selectedBarber)?.name || "Не выбран"), 1)
                          ]),
                          createVNode("div", { class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4" }, [
                            createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500" }, "Услуги"),
                            unref(selectedServices).length ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "mt-3 space-y-2"
                            }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(selectedServices), (service) => {
                                return openBlock(), createBlock("div", {
                                  key: String(service.id),
                                  class: "rounded-[1rem] bg-sand-100 px-3 py-2 text-sm text-charcoal-700"
                                }, toDisplayString(service.name) + " / " + toDisplayString(service.duration || 0) + " мин / " + toDisplayString(service.price || 0), 1);
                              }), 128))
                            ])) : (openBlock(), createBlock("p", {
                              key: 1,
                              class: "mt-2 text-sm text-charcoal-500"
                            }, "Услуги пока не выбраны."))
                          ])
                        ])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Инструменты "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Регистрация и поиск ")
                        ])
                      ]),
                      default: withCtx(() => [
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode(_component_UFormField, { label: "Имя устройства" }, {
                            default: withCtx(() => [
                              createVNode(_component_UInput, {
                                modelValue: unref(deviceName),
                                "onUpdate:modelValue": ($event) => isRef(deviceName) ? deviceName.value = $event : null
                              }, null, 8, ["modelValue", "onUpdate:modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_UButton, {
                            color: "neutral",
                            icon: "i-lucide-tablet-smartphone",
                            variant: "outline",
                            onClick: registerDevice
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" Зарегистрировать устройство киоска ")
                            ]),
                            _: 1
                          }),
                          createVNode("div", { class: "soft-divider border-t pt-4" }, [
                            createVNode(_component_UFormField, { label: "Поиск сертификата" }, {
                              default: withCtx(() => [
                                createVNode(_component_UInput, {
                                  modelValue: unref(certificateCode),
                                  "onUpdate:modelValue": ($event) => isRef(certificateCode) ? certificateCode.value = $event : null,
                                  placeholder: "Код сертификата"
                                }, null, 8, ["modelValue", "onUpdate:modelValue"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_UButton, {
                              class: "mt-3",
                              color: "neutral",
                              icon: "i-lucide-search",
                              variant: "outline",
                              onClick: lookupCertificate
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Найти сертификат ")
                              ]),
                              _: 1
                            })
                          ]),
                          unref(certificateResult) ? (openBlock(), createBlock(_component_SharedJsonBlock, {
                            key: 0,
                            label: "Ответ сертификата",
                            value: unref(certificateResult)
                          }, null, 8, ["value"])) : createCommentVNode("", true)
                        ])
                      ]),
                      _: 1
                    })
                  ])
                ]))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/kiosk.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/kiosk-D59ztNOP');
//# sourceMappingURL=kiosk-D59ztNOP.mjs.map
