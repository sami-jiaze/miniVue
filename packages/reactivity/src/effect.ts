type keytoDepMap = Map<any, ReactiveEffect>
const targetMap = new WeakMap<any, keytoDepMap>()

// 标记当前被执行的effect
export let activeEffect: ReactiveEffect | undefined

// myEffect 主函数
export function myEffect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}

  run() {
    activeEffect = this
    return this.fn()
  }
}

// 收集依赖
export function track(target: object, key: unknown) {
  console.log('依赖收集', target, key)
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  depsMap?.set(key, activeEffect)
  console.log("targetMap", targetMap);
}

// 触发依赖
export function trigger(target: object, key: unknown, newValue: unknown) {
  console.log('依赖触发', target, key, newValue)
  const depsMap =  targetMap.get(target)
  if (!depsMap) return
  const effect = depsMap.get(key) as ReactiveEffect
  if (!effect) return
  // 若不为空则触发依赖函数
  effect.fn();
}
