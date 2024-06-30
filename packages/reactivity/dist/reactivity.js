// packages/shared/src/index.ts
var isObject = (value) => {
  return value !== null && typeof value === "object";
};

// packages/reactivity/src/effect.ts
var activeEffect = void 0;
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
function cleanupEffect(effect2) {
  let { deps } = effect2;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect2);
  }
  effect2.deps.length = 0;
}
var ReactiveEffect = class {
  // 默认会将fn挂载到类的实例上
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    // stop停止effect会置为false
    this.active = true;
    // 收集effect中使用到的属性
    // effect中要记录哪些属性是在effect中调用的
    this.deps = [];
    // 用来记录effect的父effect
    this.parent = null;
  }
  run() {
    try {
      if (!this.active) {
        return this.fn();
      }
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  // 停止effect
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
};

// packages/reactivity/src/baseHandlers.ts
var muableHandlers = {
  // receiver是代理对象
  get(target, key, receiver) {
    console.log("activeEffect \u4F9D\u8D56\u6536\u96C6=>", key, activeEffect);
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, "get", key);
    debugger;
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      res = reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, "set", key, value, oldValue);
    }
    return result;
  }
};
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    let shouldTrack = dep.has(activeEffect);
    if (!shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
}
function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const deps = depsMap.get(key);
  if (deps) {
    const effects = [...deps];
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (!effect2.scheduler) {
          effect2.run();
        } else {
          effect2.scheduler();
        }
      }
    });
  }
}

// packages/reactivity/src/reactivity.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target)) return;
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  let existingProxy = reactiveMap.get(target);
  if (existingProxy) return existingProxy;
  const proxy = new Proxy(target, muableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
export {
  ReactiveEffect,
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
