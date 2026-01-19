/**
 * CSS 样式属性类型
 */
export type CSSProperties = Partial<CSSStyleDeclaration>;

export interface SetStyleOptions {
  element?: HTMLElement;
}

/**
 * 设置元素样式的工具函数
 *
 * @description
 * 便捷地设置元素样式，并返回之前的样式以便恢复。
 * 兼容 IE 浏览器（IE 不会合并 overflow 样式，需要单独设置）。
 * @see https://github.com/ant-design/ant-design/issues/19393
 *
 * @example
 * ```ts
 * import setStyle from '@/setStyle';
 *
 * // 设置样式并保存旧样式
 * const oldStyle = setStyle({
 *   overflow: 'hidden',
 *   position: 'fixed',
 * });
 *
 * // 之后可以恢复旧样式
 * setStyle(oldStyle);
 * ```
 *
 * @useCases 适用场景
 * 1. **滚动锁定** - 打开模态框时锁定页面滚动
 * 2. **临时样式** - 需要临时修改样式后恢复
 * 3. **动画过渡** - 动画前后的样式切换
 *
 * @param style - 要设置的样式对象
 * @param options - 配置选项
 * @param options.element - 目标元素，默认为 document.body
 * @returns 元素之前的样式
 */
function setStyle(style: CSSProperties, options: SetStyleOptions = {}): CSSProperties {
  if (!style) {
    return {};
  }

  const { element = document.body } = options;
  const oldStyle: CSSProperties = {};

  const styleKeys = Object.keys(style) as (keyof CSSStyleDeclaration)[];

  // IE 浏览器兼容处理
  styleKeys.forEach((key) => {
    (oldStyle as any)[key] = element.style[key];
  });

  styleKeys.forEach((key) => {
    (element.style as any)[key] = (style as any)[key];
  });

  return oldStyle;
}

export default setStyle;
