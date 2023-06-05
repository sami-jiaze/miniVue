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

// 值是否发送改变
export const hasChanged = (newVal: any, oldVal: any): boolean => {
  return !Object.is(newVal, oldVal)
}

// 合并
export const extend = Object.assign

// 空对象
export const EMPTY_OBJ: { readonly [key: string]: any } = {}
