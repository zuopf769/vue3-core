import { isFunction } from "@vue/shared";
import { activeEffect, ReactiveEffect } from "./effect";
import { trackEffects, triggerEffects } from "./baseHandlers";

let noop = () => {};

/**
 *
 * 1. 计算属性本身也支持依赖收集：哪个effect用这个计算属性就收集哪个effect
 * 2. 这个计算属性本身又是基于effect实现的，计算属性取值时依赖的属性也会取值，该依赖属性收集的就是计算属性内部的effect
 * 3. 当计算属性依赖的响应式数据发生变化的时候，会触发计算属性内置的effect执行scheduler, 这个scheduler会触发依赖该计算属性的effect执行getter方法重新计算新值
 *
 */
class ComputedRefImpl {
  // 依赖收集： 哪个effect用这个计算属性就收集他
  public dep;
  // 意味着有这个属性，需要.value来取值
  public __v_ifRef = true;
  // 是否脏，如果脏，则重新计算
  public _dirty = true;
  // 计算值，缓缓的结果
  public _value;
  // 依赖发生变化，就需要重新计算，肯定是个effect
  public effect;
  // 内置effect的fn是传入的getter
  constructor(getter, public setter) {
    // effect(fn)会立即执行fn，但是我们希望自己控制run()的时机，所以这里使用ReactiveEffect
    // 计算属性里面依赖的属性收集的effect就是此effect,计算属性依赖的值变化后会触发此effect的scheduler执行
    this.effect = new ReactiveEffect(getter, () => {
      // 计算属性依赖的属性发生变化，trigger会调到这里的scheduler
      // 脏了，需要重新计算
      this._dirty = true;
      // 需要触发依赖该计算属性的effect重新执行fn,fn执行的时候会调用计算属性内部的vale的getter方法，getter方法再调用计算属性的get方法重新计算新值
      triggerEffects(this.dep);
    });
  }

  // 类的属性访问器，Object.defineProperty(obj, key, { get: fn })
  // 取值的时候进行依赖收集
  get value() {
    // 用户取计算属性的值的时候发生依赖收集
    // 计算属性收集自己的依赖收集
    // 这个effect不是上面内置的effect
    if (activeEffect) {
      // 有activeEffect, 证明这个计算属性在某个effect中
      // 需要让计算属性收集该effect
      trackEffects(this.dep || (this.dep = new Set()));
    }

    // 如果是脏值, 执行函数
    if (this._dirty) {
      // 意味取过了
      this._dirty = false;
      // 取值才执行，并且把取到的值缓存起来
      // 执行上面内置的effect的run导致activeEffect是上面内置的effect，然后计算属性依赖的属性取值，收集到的effect就是内置的effect
      this._value = this.effect.run();
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
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
