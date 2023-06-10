import { isArray, isObject } from '@myvue/shared'
import { VNode, createVNode, isVNode } from './vnode'

// 构建h函数 处理传入的参数 
// 第一个参数既可以是一个字符串 (用于原生元素) 也可以是一个 Vue 组件定义。
// 第二个参数是要传递的 prop，
// 第三个参数是子节点。
// 除了 type 外，其他参数都是可选的

// h主函数 本质是返回一个vnode对象
export function h(type: any, propsOrChildren?: any, children?: any): VNode {
	const l = arguments.length

	if (l === 2) {
    // propsOrChildren 是对象但不是数组
		if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
			if (isVNode(propsOrChildren)) {
				return createVNode(type, null, [propsOrChildren])
			}
			// 不是 VNode， 则第二个参数为 props
			return createVNode(type, propsOrChildren)
		}
		// 如果第二个参数是数组
		else {
			return createVNode(type, null, propsOrChildren)
		}
	}
	else {
		// 如果参数在三个以上，从第三个参数开始，把后续所有参数都作为 children
		if (l > 3) {
			children = Array.prototype.slice.call(arguments, 2)
		}
		else if (l === 3 && isVNode(children)) {
			children = [children]
		}
		return createVNode(type, propsOrChildren, children)
	}
}
