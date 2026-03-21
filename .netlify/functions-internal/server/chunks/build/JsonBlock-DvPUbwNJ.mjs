globalThis.__timing__.logStart('Load chunks/build/JsonBlock-DvPUbwNJ');import { c as _sfc_main$3 } from './server.mjs';
import { defineComponent, mergeProps, createSlots, withCtx, createVNode, toDisplayString, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/server-renderer/index.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "JsonBlock",
  __ssrInlineRender: true,
  props: {
    label: {},
    value: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = _sfc_main$3;
      _push(ssrRenderComponent(_component_UCard, mergeProps({ class: "warm-card rounded-[1.5rem] border border-charcoal-200" }, _attrs), createSlots({
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<pre class="overflow-auto text-xs leading-6 text-charcoal-700"${_scopeId}>${ssrInterpolate(JSON.stringify(__props.value, null, 2))}</pre>`);
          } else {
            return [
              createVNode("pre", { class: "overflow-auto text-xs leading-6 text-charcoal-700" }, toDisplayString(JSON.stringify(__props.value, null, 2)), 1)
            ];
          }
        }),
        _: 2
      }, [
        __props.label ? {
          name: "header",
          fn: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<p class="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal-500"${_scopeId}>${ssrInterpolate(__props.label)}</p>`);
            } else {
              return [
                createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.22em] text-charcoal-500" }, toDisplayString(__props.label), 1)
              ];
            }
          }),
          key: "0"
        } : void 0
      ]), _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/shared/JsonBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_10 = Object.assign(_sfc_main, { __name: "SharedJsonBlock" });

export { __nuxt_component_10 as _ };;globalThis.__timing__.logEnd('Load chunks/build/JsonBlock-DvPUbwNJ');
//# sourceMappingURL=JsonBlock-DvPUbwNJ.mjs.map
