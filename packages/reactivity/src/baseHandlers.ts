export enum ReactiveFlags {
  "IS_REACTIVE" = "__v_isReactive",
}

export const muableHandlers: ProxyHandler<Record<any, any>> = {
  // receiver是代理对象
  get(target, key, receiver) {
    // 不能直接返回target.key，因为target是被代理的原始对象，如果直接返回target.key，那么后续的set、get操作会直接修改原始对象，而不是代理对象
    // return target.key;

    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 使用Reflect.get获取代理对象上的属性，这样就可以保证后续的set、get操作都是针对代理对象
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    //设置的时候，让属性对应的effect执行
    Reflect.set(target, key, value, receiver);
    return true;
  },
};
