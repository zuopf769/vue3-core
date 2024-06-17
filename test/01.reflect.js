// 原始对象、被代理对象
const person = {
  name: "zuopf",
  get aliasName() {
    // 属性访问器
    return "handsome " + this.name;
  },
};

// 返回的是代理对象
const proxy = new Proxy(person, {
  get(target, key, recevier) {
    console.log(key);

    /**
     *  aliasName
     *  handsome zuopf
     */
    // 不会输出name，因为在aliasName中访问name时this是person不是代理对象，所以不会走proxy的get方法
    // target[key]  - this = person
    // return target[key];

    /**
     *  aliasName
     *  name
     *  handsome zuopf
     */
    // receiver是代理对象，保证aliasName中的this一直是代理对象receiver
    // Reflect.get(target, key, recevier); - this = receiver
    return Reflect.get(target, key, recevier);
  },
  set(target, key, value, recevier) {
    target[key] = value;
    return Reflect.set(target, key, value, recevier);
  },
});

// 如果用户修改了name属性 ，我们是无法监控到的
console.log(proxy.aliasName);
