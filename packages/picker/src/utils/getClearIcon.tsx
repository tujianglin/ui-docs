import type { VueNode } from '@vc-com/util/lib/types';

export function getClearIcon(prefixCls: string, allowClear?: boolean | { clearIcon?: VueNode }, clearIcon?: VueNode) {
  const mergedClearIcon = typeof allowClear === 'object' ? allowClear.clearIcon : clearIcon;

  return mergedClearIcon || <span class={`${prefixCls}-clear-btn`} />;
}
