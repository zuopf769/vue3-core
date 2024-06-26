// 全局变量, 用来记录当前正在执行的effect
// 为了方便执行effect的时候依赖收集
export let activeEffect = undefined;

export function effect(fn) {
  // 将用户的函数，拿到变成一个响应式的函数
  // 创建一个响应式effect, 并且让effect立即执行
  const _effect = new ReactiveEffect(fn);
  // 默认让用户的函数执行一次
  _effect.run();
}

function cleanupEffect(effect) {
  // 每次执行effect之前，我们应该清理掉effect中依赖的所有属性

  // 属性记录了effect {key: new set()}
  let { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    // deps[i] 是一个set
    // 因为此次的set和targetMap中的depsMap的set是同一个引用类型, 所以这里删除那边也就删除了
    deps[i].delete(effect);
  }

  // 清除effect中deps数组
  effect.deps.length = 0;
}

// 响应式effect
export class ReactiveEffect {
  // stop停止effect会置为false
  public active = true;
  // 收集effect中使用到的属性
  // effect中要记录哪些属性是在effect中调用的
  public deps = [];
  // 用来记录effect的父effect
  public parent = null;
  // 默认会将fn挂载到类的实例上
  constructor(public fn) {}

  run() {
    // 当运行的时候 我们需要将属性和对应的effect关联起来
    // 利用js是单线程的特性，先放在全局，在取值
    try {
      // 不是激活状态
      if (!this.active) {
        return this.fn();
      }
      // 正在执行的effect的父effect为当前effect
      // 不是嵌套的effect, 父effect为null
      this.parent = activeEffect;
      // 正在执行的effect为当前effect
      activeEffect = this;
      // 触发属性的get 依赖收集，在调用用户函数的时候会发生取值操作
      cleanupEffect(this);
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
