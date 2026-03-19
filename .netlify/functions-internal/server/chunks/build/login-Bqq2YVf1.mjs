globalThis.__timing__.logStart('Load chunks/build/login-Bqq2YVf1');import { f as useSessionStore, c as _sfc_main$3, d as _sfc_main$a, e as useApiClient, n as navigateTo } from './server.mjs';
import { _ as _sfc_main$1 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$2 } from './Input-BrToCniw.mjs';
import { defineComponent, reactive, ref, mergeProps, withCtx, unref, createVNode, createTextVNode, withModifiers, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { l as loginSchema } from '../_/index.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
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
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwind-variants/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/utils/lib/css/icon.js';
import '../routes/renderer.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/server.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/devalue/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/plugins.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/utils.mjs';
import './index-qsfWWCYt.mjs';
import './useKioskApi-l3XfHmhL.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const branchStore = useBranchStore();
    const sessionStore = useSessionStore();
    const form = reactive({
      branch_id: branchStore.activeBranchId || null,
      login: "",
      password: ""
    });
    const fieldErrors = reactive({
      login: "",
      password: ""
    });
    const loading = ref(false);
    function resetFieldErrors() {
      fieldErrors.login = "";
      fieldErrors.password = "";
    }
    function applyFieldErrors(issues) {
      resetFieldErrors();
      for (const issue of issues) {
        const field = String(issue.path[0] || "");
        if ((field === "login" || field === "password") && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
    }
    async function submit() {
      resetFieldErrors();
      const parsed = loginSchema.safeParse(form);
      if (!parsed.success) {
        applyFieldErrors(parsed.error.issues);
        useApiClient().notifyError(new Error(parsed.error.issues[0]?.message || "Некорректные данные для входа"));
        return;
      }
      loading.value = true;
      try {
        await sessionStore.login(parsed.data);
        const sessionBranchId = sessionStore.barber?.branch_id || parsed.data.branch_id || null;
        if (sessionBranchId) {
          branchStore.setActiveBranch(sessionBranchId);
        }
        await navigateTo("/");
      } catch (error) {
        fieldErrors.password = error?.statusMessage || error?.message || "Неверный логин или пароль.";
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = _sfc_main$3;
      const _component_UFormField = _sfc_main$1;
      const _component_UInput = _sfc_main$2;
      const _component_UButton = _sfc_main$a;
      _push(ssrRenderComponent(_component_UCard, mergeProps({ class: "warm-card w-full max-w-md rounded-[2.25rem] border border-charcoal-200 shadow-[0_24px_70px_rgba(18,15,13,0.10)]" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-5"${_scopeId}><div class="space-y-1"${_scopeId}><h1 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId}> Вход </h1></div>`);
            _push2(ssrRenderComponent(_component_UFormField, {
              label: "Логин",
              name: "login",
              error: unref(fieldErrors).login
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UInput, {
                    modelValue: unref(form).login,
                    "onUpdate:modelValue": ($event) => unref(form).login = $event,
                    autocomplete: "username",
                    autofocus: "",
                    class: "w-full",
                    placeholder: "Введите логин"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UInput, {
                      modelValue: unref(form).login,
                      "onUpdate:modelValue": ($event) => unref(form).login = $event,
                      autocomplete: "username",
                      autofocus: "",
                      class: "w-full",
                      placeholder: "Введите логин"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UFormField, {
              label: "Пароль",
              name: "password",
              error: unref(fieldErrors).password
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UInput, {
                    modelValue: unref(form).password,
                    "onUpdate:modelValue": ($event) => unref(form).password = $event,
                    autocomplete: "current-password",
                    class: "w-full",
                    placeholder: "Введите пароль",
                    type: "password"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UInput, {
                      modelValue: unref(form).password,
                      "onUpdate:modelValue": ($event) => unref(form).password = $event,
                      autocomplete: "current-password",
                      class: "w-full",
                      placeholder: "Введите пароль",
                      type: "password"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<div class="pt-1"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UButton, {
              block: "",
              loading: unref(loading),
              color: "primary",
              size: "lg",
              type: "submit"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Войти `);
                } else {
                  return [
                    createTextVNode(" Войти ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                class: "space-y-5",
                onSubmit: withModifiers(submit, ["prevent"])
              }, [
                createVNode("div", { class: "space-y-1" }, [
                  createVNode("h1", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Вход ")
                ]),
                createVNode(_component_UFormField, {
                  label: "Логин",
                  name: "login",
                  error: unref(fieldErrors).login
                }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(form).login,
                      "onUpdate:modelValue": ($event) => unref(form).login = $event,
                      autocomplete: "username",
                      autofocus: "",
                      class: "w-full",
                      placeholder: "Введите логин"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }, 8, ["error"]),
                createVNode(_component_UFormField, {
                  label: "Пароль",
                  name: "password",
                  error: unref(fieldErrors).password
                }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(form).password,
                      "onUpdate:modelValue": ($event) => unref(form).password = $event,
                      autocomplete: "current-password",
                      class: "w-full",
                      placeholder: "Введите пароль",
                      type: "password"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }, 8, ["error"]),
                createVNode("div", { class: "pt-1" }, [
                  createVNode(_component_UButton, {
                    block: "",
                    loading: unref(loading),
                    color: "primary",
                    size: "lg",
                    type: "submit"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Войти ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ], 32)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/login-Bqq2YVf1');
//# sourceMappingURL=login-Bqq2YVf1.mjs.map
