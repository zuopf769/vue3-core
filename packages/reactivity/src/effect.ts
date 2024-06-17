// 全局变量, 用来记录当前正在执行的effect
// 为了方便执行effect的时候依赖收集
export let activeEffect = undefined;

export function effect(fn) {
  // 创建一个响应式effect, 并且让effect立即执行
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

// 响应式effect
export class ReactiveEffect {
  // 用来记录effect的父effect
  parent = null;
  // 默认会将fn挂载到类的实例上
  constructor(public fn) {}

  run() {
    try {
      // 正在执行的effect的父effect为当前effect
      // 不是嵌套的effect, 父effect为null
      this.parent = activeEffect;
      // 正在执行的effect为当前effect
      activeEffect = this;
      return this.fn();
    } finally {
      // 执行完effect后的清理工作
      // activeEffect = null;
      // 执行完effect后, 将activeEffect指向父effect
      activeEffect = this.parent;
      // 执行完effect后, 将父effect置为null
      this.parent = null;
    }
  }
}
