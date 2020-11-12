import { isString, isArray, isText } from '../shared/utils'
import { h, isSameVNodeType, isTextType, TextType } from './vnode'

export function createRenderer(renderOptions) {
  const {
    createText: hostCreateText,
    createElement: hostCreateElement,
    insert: hostInsert,
    setProperty: hostSetProperty,
    remove: hostRemove,
  } = renderOptions

  const patch = (n1, n2, container) => {
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    const { type } = n2
    if (isString(type)) {
      processElement(n1, n2, container)
    } else if (isTextType(type)) {
      processText(n1, n2, container)
    } else {
      type.patch(internals, { n1, n2, container })
    }
  }

  const unmount = (vnode, doRemove = true) => {
    const { type } = vnode
    if (isString(type)) {
      vnode.children.forEach(c => unmount(c, false))
      if (doRemove) hostRemove(vnode.node)
    } else if (isTextType(type)) {
      if (doRemove) hostRemove(vnode.node)
    } else {
      type.unmount(internals, { vnode, doRemove })
    }
  }

  const getNode = (vnode) => {
    const { type } = vnode
    if (isString(type) || isTextType(type)) {
      return vnode.node
    } else {
      return type.getNode(internals, { vnode })
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      const node = n2.node = hostCreateText(n2.props.nodeValue)
      hostInsert(node, container)
    } else {
      const node = n2.node = n1.node
      if (node.nodeValue !== n2.props.nodeValue) {
        node.nodeValue = n2.props.nodeValue
      }
    }
  }

  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      const node = n2.node = hostCreateElement(n2.type)
      patchProps(null, n2.props, node)
      mountChildren(n2, node)
      hostInsert(node, container)
    } else {
      const node = n2.node = n1.node
      patchProps(n1.props, n2.props, node)
      patchChildren(n1, n2, node)
    }
  }

  const mountChildren = (vnode, container) => {
    let children = vnode.props.children
    children = isArray(children) ? children : [children]
    vnode.children = []
    for (let i = 0; i < children.length; i++) {
      let child = children[i]
      if (child == null) continue
      child = isText(child) ? h(TextType, { nodeValue: child }) : child
      vnode.children[i] = child
      patch(null, child, container)
    }
  }

  const patchChildren = (n1, n2, container) => {
    const oldChildren = n1.children // 拿到旧的 VNode[]
    let newChildren = n2.props.children // 新的 children
    newChildren = isArray(newChildren) ? newChildren : [newChildren]
    n2.children = [] // 新的 VNode[]

    for (let i = 0; i < newChildren.length; i++) {
      if (newChildren[i] == null) continue
      let newChild = newChildren[i]
      // 处理 Text，Text 也会建立 VNode，Text 不直接暴露给开发者，而是在内部处理
      newChild = isText(newChild) ? h(TextType, { nodeValue: newChild }) : newChild
      n2.children[i] = newChild
      newChild.parent = n2 // 与 n2.children 建立内部 VNode Tree

      let oldChild = null
      for (let j = 0; j < oldChildren.length; j++) { // key diff
        if (oldChildren[j] == null) continue
        if (isSameVNodeType(oldChildren[j], newChild)) { // 找到 key 和 type 一样的 VNode
          oldChild = oldChildren[j]
          oldChildren[j] = null // 找到的就变为 null，最后不是 null 的就是需要移除的，全部 unmount 即可
          break
        }
      }
      patch(oldChild, newChild, container)
      // 我们并没有考虑移动节点的情况，而且是根据顺序 diff 的 newVNode
      // 如果之前 node 在 container 中，appendChild 会先移除之前的 node，然后添加到末尾
      hostInsert(getNode(newChild), container)
    }

    for (let oldChild of oldChildren) {
      if (oldChild != null) unmount(oldChild)
    }
  }

  const patchProps = (oldProps, newProps, node) => {
    oldProps = oldProps ?? {}
    newProps = newProps ?? {}
    // remove old props
    Object.keys(oldProps).forEach((propName) => {
      if (propName !== 'children' && propName !== 'key' && !(propName in newProps)) {
        hostSetProperty(node, propName, null, oldProps[propName]);
      }
    });
    // update old props
    Object.keys(newProps).forEach((propName) => {
      if (propName !== 'children' && propName !== 'key' && oldProps[propName] !== newProps[propName]) {
        hostSetProperty(node, propName, newProps[propName], oldProps[propName]);
      }
    });
  }

  const internals = {
    patch,
    unmount,
    mountChildren,
    patchChildren,
    renderOptions,
  }

  return {
    render(vnode, container) {
      if (vnode == null) {
        if (container.vnode) {
          unmount(container.vnode)
        }
      } else {
        patch(container.vnode ?? null, vnode, container)
      }
      container.vnode = vnode
    },
  }
}
