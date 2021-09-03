export function uuid(prefix) {
  const uuid = 'xxxyxxx_im'.replace(/[x]/g, function () {
    const r = Math.random() * 10 | 0;
    return r + '';
  });
  return (prefix || Date.now()) + '-' + uuid;
}

export function throttle(handler, wait){ // 第一次参数为主要函数，第二个参数为毫秒
  let lastTime = 0; //记录过去的时间
  return function(){
    let nowTime = new Date().getTime(); //获取时间戳
    if(nowTime - lastTime > wait){
      // 用时间戳记录当前时间，当前时间 减去 上一次的时间，如果大于 wait(你设置的 1000毫秒) 说明 过去1000毫秒了，
      // 用户可以点击第二次了。
      handler.apply(this, arguments); // 执行 主要函数， 但是此时的 handler函数的this指向window，也
      // 没有事件源对象， apply改变this 指向oBtn，传入 事件源 arguments[0]  (e)
      lastTime = nowTime; // 主要函数执行后， 当前时间就成了过去的时间了。
    }
  }
}
