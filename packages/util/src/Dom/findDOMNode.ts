import { Fragment, isVNode, type VNode } from 'vue';

export function isDOM(node: any): node is HTMLElement | SVGElement {
  // https://developer.mozilla.org/en-US/docs/Web/API/Element
  // Since XULElement is also subclass of Element, we only need HTMLElement and SVGElement
  return node instanceof HTMLElement || node instanceof SVGElement;
}

/**
 * Retrieves a DOM node via a ref, and does not invoke `findDOMNode`.
 */
export function getDOM(node: any): HTMLElement | SVGElement | null {
  if (!node) {
    return null;
  }

  if (node && typeof node === 'object' && isDOM(node.nativeElement)) {
    return node.nativeElement;
  }

  if (isDOM(node)) {
    return node as any;
  }

  if (typeof node === 'object' && isDOM((node as any).$el)) {
    return (node as any).$el;
  }

  return null;
}

/**
 * Return if a node is a DOM node. Else will return by `findDOMNode`
 */
export function findDOMNode<T = Element | Text>(
  node: HTMLElement | SVGElement | { nativeElement: T } | { current: T },
): T | null {
  const domNode = getDOM(node);
  if (domNode) {
    return domNode as T;
  }

  if (node && typeof node === 'object' && 'current' in node) {
    const refDomNode = getDOM(node.current);
    if (refDomNode) {
      return refDomNode as T;
    }
  }

  return null;
}

export function isEmptyElement(c: any) {
  return (
    c && (c.type === Comment || (c.type === Fragment && c.children.length === 0) || (c.type === Text && c.children.trim() === ''))
  );
}

export function isValid(value: any): boolean {
  return value !== undefined && value !== null && value !== '';
}

function isRenderableNode(vnode: VNode): boolean {
  if (vnode.type === Comment) return false;
  if (vnode.type === Text && String(vnode.children).trim() === '') return false;
  return true;
}

export const skipFlattenKey = Symbol('skipFlatten');

export const flattenChildren = (children = [], filterEmpty = true): VNode[] => {
  const temp = Array.isArray(children) ? children : [children];
  const res = [];
  temp.forEach((child) => {
    if (Array.isArray(child)) {
      res.push(...flattenChildren(child, filterEmpty));
    } else if (child && child.type === Fragment) {
      if (child.key === skipFlattenKey) {
        res.push(child);
      } else {
        res.push(...flattenChildren(child.children, filterEmpty));
      }
    } else if (child && isVNode(child)) {
      if (filterEmpty && !isEmptyElement(child)) {
        res.push(child);
      } else if (!filterEmpty) {
        res.push(child);
      }
    } else if (isValid(child)) {
      res.push(child);
    }
  });
  res.some(isRenderableNode);
  return res;
};
