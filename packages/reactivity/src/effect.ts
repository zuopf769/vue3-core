// 全局变量, 用来记录当前正在执行的effect
// 为了方便执行effect的时候依赖收集
export let activeEffect = undefined;

export function effect(fn) {
  // 将用户的函数，拿到变成一个响应式的函数
  // 创建一个响应式effect, 并且让effect立即执行
  const _effect = new ReactiveEffect(fn);
  // 默认让用户的函数执行一次
  _effect.run();

  const runner = _effect.run.bind(_effect); // 保证run执行的时候this指向当前的effect实例_effect
  runner.effect = _effect; // 将effect实例作为自定义属性挂载到runner函数上
  return runner; // 返回runner让用户手动调用effect的run方法，让effect执行
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
      // 不是激活状态调用run也会执行effect的fn,但是不会走后面的依赖收集
      if (!this.active) {
        // return了，失活了不会继续执行后面的依赖收集了
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
  // 停止effect
  stop() {
    // 判断effect是否是激活状态
    if (this.active) {
      // 停止effect之前，我们需要清理掉effect中依赖的所有属性
      cleanupEffect(this);
      // 停止effect后，将active置为false
      this.active = false;
    }
  }
}
