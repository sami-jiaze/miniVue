import { extend, isArray } from '@myvue/shared'
import { ComputedRefImpl } from './computed'

// 使用 ReactiveEffect 数组 让一个key可以绑定多个effect事件
export type Dep = Set<ReactiveEffect>
export type EffectScheduler = (...args: any[]) => any
export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}

export const createDep = (effects?: ReactiveEffect[]) => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}

type keytoDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, keytoDepMap>()

// 标记当前被执行的effect
export let activeEffect: ReactiveEffect | undefined

// myEffect 主函数
export function myEffect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions,
) {
  const _effect = new ReactiveEffect(fn)
  if (options) {
    extend(_effect, options)
  }
  // 如果没有懒加载
  if (!options || !options.lazy) {
    _effect.run()
  }
}

// 调度器scheduler 作用是控制执行顺序
export class ReactiveEffect<T = any> {
  computed?: ComputedRefImpl<T>
  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
  ) {}

  run() {
    activeEffect = this
    return this.fn()
  }
  stop() {}
}

// 收集依赖
export function track(target: object, key: unknown) {
  console.log('依赖收集', target, key)
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 会出现一个key只能绑定一个effect的bug
  // depsMap?.set(key, activeEffect)

  // 让一个key可以绑定多个effect 即传入一个effect数组
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep)

  console.log('targetMap', targetMap)
}

// 触发依赖
export function trigger(target: object, key: unknown, newValue: unknown) {
  console.log('依赖触发', target, key, newValue)
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  // 会出现一个key只能绑定一个effect的bug
  // const effect = depsMap.get(key) as ReactiveEffect

  // key已经绑定了多个effect 现在依次执行
  const effect: Dep | undefined = depsMap.get(key)

  if (!effect) return
  // 若不为空则触发依赖函数
  // effect.fn()

  triggerEffects(effect)
}

// 利用 dep 依次跟踪指定 key 的所有 effect
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

// 触发指定 key 的所有 effect 依赖
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]
  // 两次for循环 让计算属性的effect先执行 避免重新刷新脏值带来的死循环
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}

// 触发指定依赖
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}
