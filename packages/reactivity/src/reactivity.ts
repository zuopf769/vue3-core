import { isObject } from "@vue/shared";
import { muableHandlers, ReactiveFlags } from "./baseHandlers";

// 采用 WeakMap 存储代理对象，key只能是对象
// 1: 被代理对象target对象为key， value是代理对象；2：避免内存泄漏
const reactiveMap = new WeakMap();
export function reactive(target: object) {
  // reactive 只能处理对象类型的数据，不是对象不处理
  if (!isObject(target)) return;

  // 防止对象重复被代理
  // 1）判断这个对象是否已经被代理过，是不是一个proxy对象，如果代理过就会走到get方法
  // 2) 如果被代理过了，是代理对象就直接返回
  // 3) 如果没被代理过，就创建一个代理对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 缓存可以采用映射表 {{target} -> proxy}
  // 看一下这个对象是否有被代理过
  // 同一个对象，多次调用reactive，只返回第一次创建的代理对象
  let existingProxy = reactiveMap.get(target);
  if (existingProxy) return existingProxy;

  const proxy = new Proxy(target, muableHandlers); // 没有代理过创建代理
  reactiveMap.set(target, proxy); // 缓存代理结果

  // 1） 在vue3.0的时候 会创造一个反向映射表 {代理的结果 -》 原内容}
  // 2) 目前不用创建反向映射表，用的方式是，如果这个对象被代理过了说明已经被proxy拦截过了
  return proxy;
}
