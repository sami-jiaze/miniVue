import { hasOwn, isArray, isObject } from '@myvue/shared'
import { ITERATE_KEY, track, trigger } from './effect'
import { TriggerOpTypes } from './operations'
import { myReactive } from './reactive'

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    // 代理对象可以通过 raw 属性访问原始数据
    if (key === 'raw') return target
    const res = Reflect.get(target, key, receiver)
    if (!isReadonly && typeof key !== 'symbol') {
      // 收集依赖
      track(target, key)
    }
    // 如果是浅响应，则直接返回原始值
    if (shallow) {
      return res
    }
    if (isObject(res)) {
      return myReactive(res)
    }
    return res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: any,
  ) {
    const oldVal = target[key]
    const res = Reflect.set(target, key, value, receiver)
    // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
    const type = Object.prototype.hasOwnProperty.call(target, key)
      ? TriggerOpTypes.SET
      : TriggerOpTypes.ADD

    // target === receiver.raw 说明 receiver 就是 target 的代理对象
    if (target === receiver.raw) {
      // 比较新值与旧值，当不全等的时候且不是 NaN,才触发依赖
      if (oldVal !== value && (oldVal === oldVal || value === value))
        trigger(target, key, type)
    }

    return res
  }
}

function deleteProperty(target: object, key: string | symbol): boolean {
  // 检查被操作的属性是否是对象自己的属性
  const hadKey = hasOwn(target, key)
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, key, TriggerOpTypes.DELETE)
  }
  return result
}

// 通过 has 拦截函数实现对 in 操作符的代理
function has(target: object, key: string | symbol): boolean {
  track(target, key)
  return Reflect.has(target, key)
}

// 拦截 for...in 循环
function ownKeys(target: object): (string | symbol)[] {
  track(target, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}

// reactive拦截器
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys,
}

// readonly拦截器
export const readonlyHandlers: ProxyHandler<object> = {}
