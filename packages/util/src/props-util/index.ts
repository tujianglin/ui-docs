import type { Ref, VNode, VNodeNormalizedChildren } from 'vue';
import { Comment, Fragment, isVNode, Text, toRef } from 'vue';
import { isValid } from '../Dom/findDOMNode';
import omit from '../omit';

export function falseToUndefined(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value === false ? undefined : value]));
}

function isEmptyTextVNode(v: VNode) {
  if (v.type !== Text) return false;
  const s = typeof v.children === 'string' ? v.children : String(v.children ?? '');
  return s.trim() === '';
}

function isEmptyFragmentVNode(v: VNode) {
  if (v.type !== Fragment) return false;

  // Fragment children 可能不是 array
  if (!Array.isArray(v.children)) return true; // 非数组基本可以视为“没有可渲染子节点”
  return filterEmpty(v.children).length === 0;
}

export function isEmptyElement(c: any) {
  if (!isVNode(c)) return true; // 非 VNode：当作空（避免脏值流入）
  return c.type === Comment || isEmptyTextVNode(c) || isEmptyFragmentVNode(c);
}
export function filterEmpty(children: any = []) {
  const list = Array.isArray(children) ? children : [children];
  const res: any[] = [];

  for (const child of list) {
    if (child == null || child === false || child === true) continue; // 常见无意义值

    if (Array.isArray(child)) {
      res.push(...filterEmpty(child));
      continue;
    }

    if (isVNode(child) && child.type === Fragment) {
      // Fragment children 可能不是 array，这里安全处理
      res.push(...filterEmpty(child.children as any));
      continue;
    }

    res.push(child);
  }

  return res.filter((c) => !isEmptyElement(c));
}

export const skipFlattenKey = Symbol('skipFlatten');
function flattenChildren(children?: VNode | VNodeNormalizedChildren, isFilterEmpty = true) {
  const temp = Array.isArray(children) ? children : [children];
  const res: any[] = [];
  temp.forEach((child: any) => {
    if (Array.isArray(child)) {
      res.push(...flattenChildren(child, isFilterEmpty));
    } else if (isValid(child)) {
      res.push(child);
    } else if (child && typeof child === 'object' && child.type === Fragment) {
      if (child.key === skipFlattenKey) {
        res.push(child);
      } else {
        res.push(...flattenChildren(child.children, isFilterEmpty));
      }
    } else if (child && isVNode(child)) {
      if (isFilterEmpty && !isEmptyElement(child)) {
        res.push(child);
      } else if (!isFilterEmpty) {
        res.push(child);
      }
    }
  });
  if (isFilterEmpty) {
    return filterEmpty(res);
  }
  return res;
}

export { flattenChildren };

export function toPropsRefs<T extends Record<string, any>, K extends keyof T>(obj: T, ...args: K[]) {
  const _res: Record<any, any> = {};
  args.forEach((key) => {
    _res[key] = toRef(obj, key);
  });
  return _res as { [key in K]-?: Ref<T[key]> };
}

export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const res: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key as keyof T];
    if (value !== undefined) {
      res[key as keyof T] = value;
    }
  });
  return res;
}

interface RemoveBaseAttributesOptions {
  class?: boolean;
  style?: boolean;
  omits?: string[];
}
const defaultOptions = {
  class: true,
  style: true,
};

export function pureAttrs(attrs: Record<string, any>, options: RemoveBaseAttributesOptions = defaultOptions) {
  const enableClass = options.class ?? defaultOptions.class;
  const enableStyle = options.style ?? defaultOptions.style;
  const newAttrs = { ...attrs };
  if (enableClass) {
    delete newAttrs.class;
  }
  if (enableStyle) {
    delete newAttrs.style;
  }
  if (options.omits && options.omits.length > 0) {
    return omit(newAttrs, options.omits);
  }
  return newAttrs;
}

export function getAttrStyleAndClass(attrs: Record<string, any>, options?: RemoveBaseAttributesOptions) {
  return {
    className: attrs.class,
    style: attrs.style,
    restAttrs: pureAttrs(attrs, options),
  } as { className: any; style: any; restAttrs: Record<string, any> };
}

export function getStylePxValue(value: number | string | undefined | null) {
  if (typeof value === 'number') {
    return `${value}px`;
  } else if (typeof value === 'string') {
    const trimed = value.trim();
    if (Number.isNaN(Number(trimed))) {
      return trimed;
    } else {
      return `${Number(trimed)}px`;
    }
  }
  return value;
}
