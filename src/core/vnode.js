export function h(type, props, ...children) {
  props = props ?? {}

  const key = props.key ?? null
  delete props.key

  // 注意 props.children 和 children 的不同
  // props.children 因为子组件会使用所以是没有处理过的
  // children 是为了维持内部的 VNode 树结构而创建的，类型是一个 VNode 数组
  if (children.length === 1) {
    props.children = children[0]
  } else if (children.length > 1) {
    props.children = children
  }

  return {
    type,
    props,
    key, // key diff 用的
    node: null, // 宿主环境的元素（dom node……），组件 VNode 为 null
    parent: null, // parent VNode
    children: null, // VNode[]，建立内部 VNode 树结构
  }
}

export const TextType = Symbol('TextType')
export const isTextType = (v) => v === TextType

export const isSameVNodeType = (n1, n2) => n1.type === n2.type && n1.key === n2.key
