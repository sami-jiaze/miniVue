import { extend, isArray } from '@myvue/shared'
import { ComputedRefImpl } from './computed'
import { Dep } from './dep'
import { TriggerOpTypes } from './operations'

// 使用 ReactiveEffect 数组 让一个key可以绑定多个effect事件
export type EffectScheduler = (...args: any[]) => any
export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}
export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export const createDep = (effects?: ReactiveEffect[]) => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}

type keytoDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, keytoDepMap>()

// 标记当前被执行的effect
export let activeEffect: ReactiveEffect | undefined
// 正在执行的effect栈
const effectStack: ReactiveEffect[] = []
// for in
export const ITERATE_KEY = Symbol()

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
  // 把 _effect.run 这个方法返回
  // 让用户可以自行选择调用的时机调用 fn
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}

export let shouldTrack = true

export class ReactiveEffect<T = any> {
  // 当前对象是否是有效的，为false则是已加stop的了
  active = true
  // 分支处理 依赖数组
  deps: Dep[] = []
  computed?: ComputedRefImpl<T>
  constructor(
    public fn: () => T,
    // 调度器scheduler 作用是控制执行顺序
    public scheduler: EffectScheduler | null = null,
  ) {}

  run() {
    // 如果当前effect已经被stop 直接监听函数，不做收集逻辑
    // if (!this.active) return this.fn()

    // 在每次副作用函数重新执行之前，清除上一次建立的响应联系
    // 解决分支切换导致的冗余副作用的问题
    cleanupEffect(this)
    activeEffect = this
    // 嵌套问题 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(this)
    const result = this.fn()
    // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，
    // 并把activeEffect 还原为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]

    return result
  }
  stop() {}
}

// 收集依赖
export function track(target: object, key: unknown) {
  // console.log('依赖收集', target, key)
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

  // console.log('targetMap', targetMap)
}

// 触发依赖
export function trigger(target: object, key: unknown, type: TriggerOpTypes) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  // 获取对应的 target - key - effect
  const effect: Dep | undefined = depsMap.get(key)

  const effectsToRun = new Set()
  if (!effect) return
  // 将与 key 相关联的副作用函数添加到 effectsToRun
  effect &&
    effect.forEach((fn) => {
      if (fn !== activeEffect) effectsToRun.add(fn)
    })

  // 只有当操作类型为 'ADD' 时，才触发与 ITERATE_KEY 相关联的副作用函数
  if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
    // 取得与 ITERATE_KEY 相关联的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY)
    // 将与 ITERATE_KEY 相关联的副作用函数也添加到 effectsToRun
    iterateEffects &&
      iterateEffects.forEach((fn) => {
        if (fn !== activeEffect) effectsToRun.add(fn)
      })
  }

  triggerEffects(effect)
}

// 利用 dep 依次跟踪指定 key 的所有 effect
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
  // dep 就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到 activeEffect.deps 数组中
  activeEffect!.deps.push(dep)
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

// 清除建立的响应联系
function cleanupEffect(effectFn: ReactiveEffect) {
  const { deps } = effectFn
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effectFn)
  }
  deps.length = 0
}
