import { isArray, isObject, isString } from './index'

// 规范化 class 类，处理 class 的增强
export function normalizeClass(value: any): string {
	let res = ''
	if (isString(value)) {
		res = value
	}
	else if (isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			const normalized = normalizeClass(value[i])
			if (normalized) {
				res += normalized + ' '
			}
		}
	}
  
	else if (isObject(value)) {
		// 获取到所有的 key(类名)。value 为 boolean 值
		for (const name in value as object) {
			if ((value as object)[name]) {
				res += name + ' '
			}
		}
	}
	// 去左右空格
	return res.trim()
}
