export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  createElement: (tag): Element => {
    const el = document.createElement(tag)
    return el
  },
  setElementText: (el: Element, text) => {
    el.textContent = text;
  }
}