globalThis.__timing__.logStart('Load chunks/build/auth-Duc4oGv1');import { useSSRContext, mergeProps } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderSlot } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-[var(--dashboard-shell)] px-4 py-8 sm:px-6 lg:px-8" }, _attrs))}><div class="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/auth.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const auth = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { auth as default };;globalThis.__timing__.logEnd('Load chunks/build/auth-Duc4oGv1');
//# sourceMappingURL=auth-Duc4oGv1.mjs.map
