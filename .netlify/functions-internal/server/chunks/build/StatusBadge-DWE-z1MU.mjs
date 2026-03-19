globalThis.__timing__.logStart('Load chunks/build/StatusBadge-DWE-z1MU');import { _ as _sfc_main$1 } from './Badge-CKFwwagy.mjs';
import { defineComponent, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { a as formatStatusLabel } from './display-CyQec-Wd.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "StatusBadge",
  __ssrInlineRender: true,
  props: {
    label: {}
  },
  setup(__props) {
    const props = __props;
    const color = computed(() => {
      const value = String(props.label || "").toLowerCase();
      if (["completed", "done", "paid", "active", "ready", "success"].includes(value)) {
        return "primary";
      }
      if (["pending", "waiting", "called", "started", "in_progress"].includes(value)) {
        return "warning";
      }
      if (["cancelled", "no_show", "not_in_time", "inactive", "error"].includes(value)) {
        return "error";
      }
      return "neutral";
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UBadge = _sfc_main$1;
      _push(ssrRenderComponent(_component_UBadge, mergeProps({
        color: unref(color),
        variant: "soft"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(formatStatusLabel)(__props.label))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(formatStatusLabel)(__props.label)), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/shared/StatusBadge.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_7 = Object.assign(_sfc_main, { __name: "SharedStatusBadge" });

export { __nuxt_component_7 as _ };;globalThis.__timing__.logEnd('Load chunks/build/StatusBadge-DWE-z1MU');
//# sourceMappingURL=StatusBadge-DWE-z1MU.mjs.map
