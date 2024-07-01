// packages/shared/src/index.ts
var isObject = (value) => {
  return value !== null && typeof value === "object";
};
var isFunction = (value) => {
  return typeof value === "function";
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
    trackEffects(dep);
  }
}
function trackEffects(dep) {
  let shouldTrack = dep.has(activeEffect);
  if (!shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const deps = depsMap.get(key);
  triggerEffects(deps);
}
function triggerEffects(deps) {
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

// packages/reactivity/src/computed.ts
var noop = () => {
};
var ComputedRefImpl = class {
  // 内置effect的fn是传入的getter
  constructor(getter, setter) {
    this.setter = setter;
    // 意味着有这个属性，需要.value来取值
    this.__v_ifRef = true;
    // 是否脏，如果脏，则重新计算
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
      triggerEffects(this.dep);
    });
  }
  // 类的属性访问器，Object.defineProperty(obj, key, { get: fn })
  // 取值的时候进行依赖收集
  get value() {
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = /* @__PURE__ */ new Set()));
    }
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = noop;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
export {
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
