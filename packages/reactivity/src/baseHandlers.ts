import { activeEffect } from "./effect";

export enum ReactiveFlags {
  "IS_REACTIVE" = "__v_isReactive",
}

export const muableHandlers: ProxyHandler<Record<any, any>> = {
  // receiver是代理对象
  get(target, key, receiver) {
    // 不能直接返回target.key，因为target是被代理的原始对象，如果直接返回target.key，那么后续的set、get操作会直接修改原始对象，而不是代理对象
    // return target[key];

    // 取值的时候，让属性和effect产生关系
    console.log("activeEffect 依赖收集=>", activeEffect);
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 使用Reflect.get获取代理对象上的属性，这样就可以保证后续的set、get操作都是针对代理对象
    const res = Reflect.get(target, key, receiver);
    track(target, "get", key);
    return res;
  },
  set(target, key: any, value, receiver) {
    // 等会赋值的时候可以重新触发effect执行
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);

    if (oldValue !== value) {
      trigger(target, "set", key, value, oldValue);
    }

    return result;
  },
};

// 进行依赖收集 targetMap记录响应式对象属性依赖的effect  每个effect记录依赖的响应式对象属性字段
//
// Map1 = {({ name: 'zuopf', age: 30 }):Map2}
// Map2 = {name: set()}
// { name: 'jw', age: 30 } -> {name => [effect,effect]}
const targetMap = new WeakMap();
function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target); // {对象：map}
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map())); // 初始化depsMap
    }
    // 获取该属性被哪些effect收集  第一次为false
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set())); // 初始化该属性的依赖effect {对象：{ 属性 :[ dep, dep ]}}
    }
    // 看是否应该被收集
    let shouldTrack = dep.has(activeEffect);
    if (!shouldTrack) {
      // 把当前活跃的efftct添加到属性的set中
      dep.add(activeEffect);
      // activeEffect收集依赖属性所有的 Set([effect1...]) ，这样后续可以用于清理
      activeEffect.deps.push(dep);
    }
  }
}
export function trigger(target, type, key?, newValue?, oldValue?) {
  debugger;
  const depsMap = targetMap.get(target); // 获取对应的映射表 {属性1：[effect1..],属性2:[effect2...] }
  if (!depsMap) {
    //没有被收集过直接返回
    return;
  }
  const effects = depsMap.get(key); // 查看该属性有没有被effect收集 | 查看该属性收集的effect
  // 执行该属性收集的所有effect
  effects &&
    effects.forEach((effect) => {
      // 避免死循环
      // 当前执行的effect会放到全局上；当又重新执行当前effect时， 则不再执行
      if (effect !== activeEffect) {
        effect.run();
      }
    });
}
