export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
  createElement: (tag): Element => {
    const el = document.createElement(tag)
    // console.log('el',el);
    return el
  },
  setElementText: (el: Element, text) => {
    el.textContent = text
  },
  remove(child: Element) {
    const parent = child.parentNode
    if(parent) {
      parent.removeChild(child)
    }
  },
  createText(text: string) {
    return document.createTextNode(text)
  },
  setText(node, text) {
    node.nodeValue = text
    return node.nodeValue
  },
  createComment(text: string) {
    return document.createComment(text)
  },
}
