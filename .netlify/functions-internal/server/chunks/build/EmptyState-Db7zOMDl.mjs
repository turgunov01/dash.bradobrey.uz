globalThis.__timing__.logStart('Load chunks/build/EmptyState-Db7zOMDl');import { c as _sfc_main$3, j as _sfc_main$f } from './server.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, toDisplayString, renderSlot, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate, ssrRenderSlot } from 'file://D:/projects/bradobrey-dashboard/node_modules/.pnpm/vue@3.5.30_typescript@5.9.3/node_modules/vue/server-renderer/index.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "EmptyState",
  __ssrInlineRender: true,
  props: {
    description: {},
    icon: {},
    title: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = _sfc_main$3;
      const _component_UIcon = _sfc_main$f;
      _push(ssrRenderComponent(_component_UCard, mergeProps({ class: "warm-card rounded-[1.75rem] border border-dashed border-charcoal-200" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex flex-col items-start gap-4"${_scopeId}><div class="flex size-12 items-center justify-center rounded-2xl bg-sand-100 text-brass-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UIcon, {
              name: __props.icon || "i-lucide-package-open",
              class: "size-6"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="space-y-2"${_scopeId}><h3 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId}>${ssrInterpolate(__props.title)}</h3><p class="max-w-xl text-sm leading-6 text-charcoal-500"${_scopeId}>${ssrInterpolate(__props.description)}</p></div>`);
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex flex-col items-start gap-4" }, [
                createVNode("div", { class: "flex size-12 items-center justify-center rounded-2xl bg-sand-100 text-brass-700" }, [
                  createVNode(_component_UIcon, {
                    name: __props.icon || "i-lucide-package-open",
                    class: "size-6"
                  }, null, 8, ["name"])
                ]),
                createVNode("div", { class: "space-y-2" }, [
                  createVNode("h3", { class: "barbershop-heading text-2xl text-charcoal-950" }, toDisplayString(__props.title), 1),
                  createVNode("p", { class: "max-w-xl text-sm leading-6 text-charcoal-500" }, toDisplayString(__props.description), 1)
                ]),
                renderSlot(_ctx.$slots, "default")
              ])
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/shared/EmptyState.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_9 = Object.assign(_sfc_main, { __name: "SharedEmptyState" });

export { __nuxt_component_9 as _ };;globalThis.__timing__.logEnd('Load chunks/build/EmptyState-Db7zOMDl');
//# sourceMappingURL=EmptyState-Db7zOMDl.mjs.map
