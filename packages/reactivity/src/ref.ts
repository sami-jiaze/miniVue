import { hasChanged } from '@myvue/shared'
import {
  activeEffect,
  createDep,
  trackEffects,
  triggerEffects,
} from './effect'
import { Dep } from './dep'
import { toReactive } from './reactive'

export interface Ref<T = any> {
  value: T
}

// 是否能使用ref 是否已拥有了响应性
export function isRef(value: any): value is Ref {
  return !!(value && value.__v_isRef)
}

// ref 主函数
export function myRef(value?: unknown) {
  return createRef(value, false)
}

// shallow 表示浅层的响应性(即：只有 .value 是响应性的)
function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }

  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T
  // 原始数据
  private _rawValue: T
  public dep?: Dep = undefined
  public readonly __v_isRef: boolean = true

  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = value
    // 如果 __v_isShallow 为 true，则 value 不会被转化为 reactive 数据，
    // 即如果当前 value 为复杂数据类型，则会失去响应性。
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newVal: T) {
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal
      // 更新 .value 的值
      this._value = toReactive(newVal)
      triggerRefValue(this)
    }
  }
}

// 收集ref依赖
export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

// 触发ref依赖
export function triggerRefValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}
