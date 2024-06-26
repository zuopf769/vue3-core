let s = new Set(["a"]);
s.forEach(function (item) {
  console.log("xxxx");
  // 删除元素
  s.delete(item);
  // 添加元素,接着循环，会死循环，因为是循环和删除添加同一个引用导致的
  // 解决方案是循环的对象需要拷贝一份原来的set
  s.add(item);
});

// 数组也有类似的情况
