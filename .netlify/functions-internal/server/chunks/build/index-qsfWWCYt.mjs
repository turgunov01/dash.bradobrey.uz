globalThis.__timing__.logStart('Load chunks/build/index-qsfWWCYt');import { T as makeDestructurable, U as watchPausable, V as tryOnMounted, W as camelize, X as toArray, Y as watchImmediate, a2 as isObject, $ as noop, a0 as tryOnScopeDispose, Z as isDef, a1 as notNullish } from './server.mjs';
import { shallowRef, defineComponent, ref, computed, toValue, watch, unref, getCurrentInstance, nextTick, watchEffect } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';

// @__NO_SIDE_EFFECTS__
function createReusableTemplate(options = {}) {
  const { inheritAttrs = true } = options;
  const render = shallowRef();
  const define = defineComponent({ setup(_, { slots }) {
    return () => {
      render.value = slots.default;
    };
  } });
  const reuse = defineComponent({
    inheritAttrs,
    props: options.props,
    setup(props, { attrs, slots }) {
      return () => {
        var _render$value;
        if (!render.value && true) throw new Error("[VueUse] Failed to find the definition of reusable template");
        const vnode = (_render$value = render.value) === null || _render$value === void 0 ? void 0 : _render$value.call(render, {
          ...options.props == null ? keysToCamelKebabCase(attrs) : props,
          $slots: slots
        });
        return inheritAttrs && (vnode === null || vnode === void 0 ? void 0 : vnode.length) === 1 ? vnode[0] : vnode;
      };
    }
  });
  return makeDestructurable({
    define,
    reuse
  }, [define, reuse]);
}
function keysToCamelKebabCase(obj) {
  const newObj = {};
  for (const key in obj) newObj[camelize(key)] = obj[key];
  return newObj;
}
const defaultWindow = void 0;
function unrefElement(elRef) {
  var _$el;
  const plain = toValue(elRef);
  return (_$el = plain === null || plain === void 0 ? void 0 : plain.$el) !== null && _$el !== void 0 ? _$el : plain;
}
function useEventListener(...args) {
  const register = (el, event, listener, options) => {
    el.addEventListener(event, listener, options);
    return () => el.removeEventListener(event, listener, options);
  };
  const firstParamTargets = computed(() => {
    const test = toArray(toValue(args[0])).filter((e) => e != null);
    return test.every((e) => typeof e !== "string") ? test : void 0;
  });
  return watchImmediate(() => {
    var _firstParamTargets$va, _firstParamTargets$va2;
    return [
      (_firstParamTargets$va = (_firstParamTargets$va2 = firstParamTargets.value) === null || _firstParamTargets$va2 === void 0 ? void 0 : _firstParamTargets$va2.map((e) => unrefElement(e))) !== null && _firstParamTargets$va !== void 0 ? _firstParamTargets$va : [defaultWindow].filter((e) => e != null),
      toArray(toValue(firstParamTargets.value ? args[1] : args[0])),
      toArray(unref(firstParamTargets.value ? args[2] : args[1])),
      toValue(firstParamTargets.value ? args[3] : args[2])
    ];
  }, ([raw_targets, raw_events, raw_listeners, raw_options], _, onCleanup) => {
    if (!(raw_targets === null || raw_targets === void 0 ? void 0 : raw_targets.length) || !(raw_events === null || raw_events === void 0 ? void 0 : raw_events.length) || !(raw_listeners === null || raw_listeners === void 0 ? void 0 : raw_listeners.length)) return;
    const optionsClone = isObject(raw_options) ? { ...raw_options } : raw_options;
    const cleanups = raw_targets.flatMap((el) => raw_events.flatMap((event) => raw_listeners.map((listener) => register(el, event, listener, optionsClone))));
    onCleanup(() => {
      cleanups.forEach((fn) => fn());
    });
  }, { flush: "post" });
}
// @__NO_SIDE_EFFECTS__
function useMounted() {
  const isMounted = shallowRef(false);
  getCurrentInstance();
  return isMounted;
}
// @__NO_SIDE_EFFECTS__
function useSupported(callback) {
  const isMounted = /* @__PURE__ */ useMounted();
  return computed(() => {
    isMounted.value;
    return Boolean(callback());
  });
}
function useMutationObserver(target, callback, options = {}) {
  const { window: window$1 = defaultWindow, ...mutationOptions } = options;
  let observer;
  const isSupported = /* @__PURE__ */ useSupported(() => window$1 && "MutationObserver" in window$1);
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = void 0;
    }
  };
  const stopWatch = watch(computed(() => {
    const items = toArray(toValue(target)).map(unrefElement).filter(notNullish);
    return new Set(items);
  }), (newTargets) => {
    cleanup();
    if (isSupported.value && newTargets.size) {
      observer = new MutationObserver(callback);
      newTargets.forEach((el) => observer.observe(el, mutationOptions));
    }
  }, {
    immediate: true,
    flush: "post"
  });
  const takeRecords = () => {
    return observer === null || observer === void 0 ? void 0 : observer.takeRecords();
  };
  const stop = () => {
    stopWatch();
    cleanup();
  };
  tryOnScopeDispose(stop);
  return {
    isSupported,
    stop,
    takeRecords
  };
}
function onElementRemoval(target, callback, options = {}) {
  const { window: window$1 = defaultWindow, document: document$1 = window$1 === null || window$1 === void 0 ? void 0 : window$1.document, flush = "sync" } = options;
  if (!window$1 || !document$1) return noop;
  let stopFn;
  const cleanupAndUpdate = (fn) => {
    stopFn === null || stopFn === void 0 || stopFn();
    stopFn = fn;
  };
  const stopWatch = watchEffect(() => {
    const el = unrefElement(target);
    if (el) {
      const { stop } = useMutationObserver(document$1, (mutationsList) => {
        if (mutationsList.map((mutation) => [...mutation.removedNodes]).flat().some((node) => node === el || node.contains(el))) callback(mutationsList);
      }, {
        window: window$1,
        childList: true,
        subtree: true
      });
      cleanupAndUpdate(stop);
    }
  }, { flush });
  const stopHandle = () => {
    stopWatch();
    cleanupAndUpdate();
  };
  tryOnScopeDispose(stopHandle);
  return stopHandle;
}
// @__NO_SIDE_EFFECTS__
function useActiveElement(options = {}) {
  var _options$document;
  const { window: window$1 = defaultWindow, deep = true, triggerOnRemoval = false } = options;
  const document$1 = (_options$document = options.document) !== null && _options$document !== void 0 ? _options$document : window$1 === null || window$1 === void 0 ? void 0 : window$1.document;
  const getDeepActiveElement = () => {
    let element = document$1 === null || document$1 === void 0 ? void 0 : document$1.activeElement;
    if (deep) {
      var _element$shadowRoot;
      while (element === null || element === void 0 ? void 0 : element.shadowRoot) element = element === null || element === void 0 || (_element$shadowRoot = element.shadowRoot) === null || _element$shadowRoot === void 0 ? void 0 : _element$shadowRoot.activeElement;
    }
    return element;
  };
  const activeElement = shallowRef();
  const trigger = () => {
    activeElement.value = getDeepActiveElement();
  };
  if (window$1) {
    const listenerOptions = {
      capture: true,
      passive: true
    };
    useEventListener(window$1, "blur", (event) => {
      if (event.relatedTarget !== null) return;
      trigger();
    }, listenerOptions);
    useEventListener(window$1, "focus", trigger, listenerOptions);
  }
  if (triggerOnRemoval) onElementRemoval(activeElement, trigger, { document: document$1 });
  trigger();
  return activeElement;
}
function cloneFnJSON(source) {
  return JSON.parse(JSON.stringify(source));
}
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey = "__vueuse_ssr_handlers__";
const handlers = /* @__PURE__ */ getHandlers();
function getHandlers() {
  if (!(globalKey in _global)) _global[globalKey] = _global[globalKey] || {};
  return _global[globalKey];
}
function getSSRHandler(key, fallback) {
  return handlers[key] || fallback;
}
function guessSerializerType(rawInit) {
  return rawInit == null ? "any" : rawInit instanceof Set ? "set" : rawInit instanceof Map ? "map" : rawInit instanceof Date ? "date" : typeof rawInit === "boolean" ? "boolean" : typeof rawInit === "string" ? "string" : typeof rawInit === "object" ? "object" : !Number.isNaN(rawInit) ? "number" : "any";
}
const StorageSerializers = {
  boolean: {
    read: (v) => v === "true",
    write: (v) => String(v)
  },
  object: {
    read: (v) => JSON.parse(v),
    write: (v) => JSON.stringify(v)
  },
  number: {
    read: (v) => Number.parseFloat(v),
    write: (v) => String(v)
  },
  any: {
    read: (v) => v,
    write: (v) => String(v)
  },
  string: {
    read: (v) => v,
    write: (v) => String(v)
  },
  map: {
    read: (v) => new Map(JSON.parse(v)),
    write: (v) => JSON.stringify(Array.from(v.entries()))
  },
  set: {
    read: (v) => new Set(JSON.parse(v)),
    write: (v) => JSON.stringify(Array.from(v))
  },
  date: {
    read: (v) => new Date(v),
    write: (v) => v.toISOString()
  }
};
const customStorageEventName = "vueuse-storage";
function useStorage(key, defaults$1, storage, options = {}) {
  var _options$serializer;
  const { flush = "pre", deep = true, listenToStorageChanges = true, writeDefaults = true, mergeDefaults = false, shallow, window: window$1 = defaultWindow, eventFilter, onError = (e) => {
    console.error(e);
  }, initOnMounted } = options;
  const data = (shallow ? shallowRef : ref)(typeof defaults$1 === "function" ? defaults$1() : defaults$1);
  const keyComputed = computed(() => toValue(key));
  if (!storage) try {
    storage = getSSRHandler("getDefaultStorage", () => defaultWindow === null || defaultWindow === void 0 ? void 0 : defaultWindow.localStorage)();
  } catch (e) {
    onError(e);
  }
  if (!storage) return data;
  const rawInit = toValue(defaults$1);
  const type = guessSerializerType(rawInit);
  const serializer = (_options$serializer = options.serializer) !== null && _options$serializer !== void 0 ? _options$serializer : StorageSerializers[type];
  const { pause: pauseWatch, resume: resumeWatch } = watchPausable(data, (newValue) => write(newValue), {
    flush,
    deep,
    eventFilter
  });
  watch(keyComputed, () => update(), { flush });
  let firstMounted = false;
  const onStorageEvent = (ev) => {
    if (initOnMounted && !firstMounted) return;
    update(ev);
  };
  const onStorageCustomEvent = (ev) => {
    if (initOnMounted && !firstMounted) return;
    updateFromCustomEvent(ev);
  };
  if (window$1 && listenToStorageChanges) if (storage instanceof Storage) useEventListener(window$1, "storage", onStorageEvent, { passive: true });
  else useEventListener(window$1, customStorageEventName, onStorageCustomEvent);
  if (initOnMounted) tryOnMounted(() => {
    firstMounted = true;
    update();
  });
  else update();
  function dispatchWriteEvent(oldValue, newValue) {
    if (window$1) {
      const payload = {
        key: keyComputed.value,
        oldValue,
        newValue,
        storageArea: storage
      };
      window$1.dispatchEvent(storage instanceof Storage ? new StorageEvent("storage", payload) : new CustomEvent(customStorageEventName, { detail: payload }));
    }
  }
  function write(v) {
    try {
      const oldValue = storage.getItem(keyComputed.value);
      if (v == null) {
        dispatchWriteEvent(oldValue, null);
        storage.removeItem(keyComputed.value);
      } else {
        const serialized = serializer.write(v);
        if (oldValue !== serialized) {
          storage.setItem(keyComputed.value, serialized);
          dispatchWriteEvent(oldValue, serialized);
        }
      }
    } catch (e) {
      onError(e);
    }
  }
  function read(event) {
    const rawValue = event ? event.newValue : storage.getItem(keyComputed.value);
    if (rawValue == null) {
      if (writeDefaults && rawInit != null) storage.setItem(keyComputed.value, serializer.write(rawInit));
      return rawInit;
    } else if (!event && mergeDefaults) {
      const value = serializer.read(rawValue);
      if (typeof mergeDefaults === "function") return mergeDefaults(value, rawInit);
      else if (type === "object" && !Array.isArray(value)) return {
        ...rawInit,
        ...value
      };
      return value;
    } else if (typeof rawValue !== "string") return rawValue;
    else return serializer.read(rawValue);
  }
  function update(event) {
    if (event && event.storageArea !== storage) return;
    if (event && event.key == null) {
      data.value = rawInit;
      return;
    }
    if (event && event.key !== keyComputed.value) return;
    pauseWatch();
    try {
      const serializedData = serializer.write(data.value);
      if (event === void 0 || (event === null || event === void 0 ? void 0 : event.newValue) !== serializedData) data.value = read(event);
    } catch (e) {
      onError(e);
    } finally {
      if (event) nextTick(resumeWatch);
      else resumeWatch();
    }
  }
  function updateFromCustomEvent(event) {
    update(event.detail);
  }
  return data;
}
// @__NO_SIDE_EFFECTS__
function useVModel(props, key, emit, options = {}) {
  var _vm$$emit, _vm$proxy;
  const { clone = false, passive = false, eventName, deep = false, defaultValue, shouldEmit } = options;
  const vm = getCurrentInstance();
  const _emit = emit || (vm === null || vm === void 0 ? void 0 : vm.emit) || (vm === null || vm === void 0 || (_vm$$emit = vm.$emit) === null || _vm$$emit === void 0 ? void 0 : _vm$$emit.bind(vm)) || (vm === null || vm === void 0 || (_vm$proxy = vm.proxy) === null || _vm$proxy === void 0 || (_vm$proxy = _vm$proxy.$emit) === null || _vm$proxy === void 0 ? void 0 : _vm$proxy.bind(vm === null || vm === void 0 ? void 0 : vm.proxy));
  let event = eventName;
  event = event || `update:${key.toString()}`;
  const cloneFn = (val) => !clone ? val : typeof clone === "function" ? clone(val) : cloneFnJSON(val);
  const getValue$1 = () => isDef(props[key]) ? cloneFn(props[key]) : defaultValue;
  const triggerEmit = (value) => {
    if (shouldEmit) {
      if (shouldEmit(value)) _emit(event, value);
    } else _emit(event, value);
  };
  if (passive) {
    const proxy = ref(getValue$1());
    let isUpdating = false;
    watch(() => props[key], (v) => {
      if (!isUpdating) {
        isUpdating = true;
        proxy.value = cloneFn(v);
        nextTick(() => isUpdating = false);
      }
    });
    watch(proxy, (v) => {
      if (!isUpdating && (v !== props[key] || deep)) triggerEmit(v);
    }, { deep });
    return proxy;
  } else return computed({
    get() {
      return getValue$1();
    },
    set(value) {
      triggerEmit(value);
    }
  });
}

export { useStorage as a, useEventListener as b, createReusableTemplate as c, useActiveElement as d, useVModel as u };;globalThis.__timing__.logEnd('Load chunks/build/index-qsfWWCYt');
//# sourceMappingURL=index-qsfWWCYt.mjs.map
