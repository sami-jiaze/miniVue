import { isObject } from '@myvue/shared'
import { mutableHandlers } from './baseHandlers'

export const enum ReactiveFlags {
  // 是否是reactive属性
  IS_REACTIVE = '__v_isReactive',
  // 是否是readonly属性
  IS_READONLY = '__v_isReadonly',
  // 是否阻止成为代理属性
  SKIP = '__v_skip',
  // mark target
  RAW = '__v_raw',
}

export function isReactive(value: boolean) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
export const toReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? myReactive(value as object) : value
}
// 代理缓存的map
export const reactiveMap = new WeakMap<object, any>()

export function shallowReactive(target: object) {

}

// reactive 主函数 target为被代理对象
export function myReactive(target: object) {
  // 如果reactive进入的是readonly的话直接返回，保持只读
  // if (target && target[ReactiveFlags.IS_READONLY]) return target
  return createReactiveObject(target, false, mutableHandlers, reactiveMap)
}

function createReactiveObject(
  // 要代理的数据
  target: object,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>,
) {
  // 如果代理的数据不是obj则直接返回原对象
  // if (isObject(target)) {
  //   return target
  // }
  const exisitProxy = proxyMap.get(target)
  if (exisitProxy) return exisitProxy

  const targetProxy = new Proxy(target, baseHandlers)
  targetProxy[ReactiveFlags.IS_REACTIVE] = true
  // 缓存代理对象
  proxyMap.set(target, targetProxy)

  return targetProxy
}
