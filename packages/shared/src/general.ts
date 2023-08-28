// 是否为数组
export const isArray = Array.isArray

// 是否为对象
export const isObject = (val: unknown) => {
  return val !== null && typeof val === 'object'
}

// 是否为函数
export const isFunction = (val: unknown) => {
  return typeof val === 'function'
}

// 是否为string
export const isString = (val: unknown) => {
  return typeof val === 'string'
}

// 值是否发送改变
export const hasChanged = (newVal: any, oldVal: any): boolean => {
  return !Object.is(newVal, oldVal)
}

// 合并
export const extend = Object.assign

// 空对象
export const EMPTY_OBJ: { readonly [key: string]: any } = {}

// 匹配on正则表达式
const onRE = /^on[A-Z]/
// 是否是事件绑定
export const isOn = (key: string) => {
  return onRE.test(key)
}

// 表示对象自有属性（而不是继承来的属性）中是否具有指定的属性。
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol,
): key is keyof typeof val => hasOwnProperty.call(val, key)

// 检测组件传递的 props 是否发生变化
export function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  // 如果新旧 props 的数量变了，则说明有变化
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }
  // 只有
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    // 有不相等的 props，则说明有变化
    if (nextProps[key] !== prevProps[key]) return true
  }
  return false
}
