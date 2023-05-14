// 收集依赖
export function track(target: object, key: unknown) {
  console.log("依赖收集", target, key);
  
}

// 触发依赖
export function trigger(target: object, key: unknown, newValue: unknown) {
  console.log("依赖触发", target, key, newValue);
}
