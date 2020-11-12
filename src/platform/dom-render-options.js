export const domRenderOptions = {
  createElement: tag => document.createElement(tag),

  createText: text => document.createTextNode(text),

  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor)
  },

  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  setProperty: (node, propName, newValue, oldValue) => {
    if (propName[0] === 'o' && propName[1] === 'n') {
      const eventType = propName.toLowerCase().slice(2);
  
      if (!node.listeners) node.listeners = {};
      node.listeners[eventType] = newValue;
  
      if (newValue) {
        if (!oldValue) {
          node.addEventListener(eventType, eventProxy);
        }
      } else {
        node.removeEventListener(eventType, eventProxy);
      }
    } else if (newValue !== oldValue) {
      if (propName in node) {
        node[propName] = newValue == null ? '' : newValue
      } else if (newValue == null || newValue === false) {
        node.removeAttribute(propName)
      } else {
        node.setAttribute(propName, newValue)
      }
    }
  },
}

function eventProxy(e) {
  // this: node
  this.listeners[e.type](e)
}
