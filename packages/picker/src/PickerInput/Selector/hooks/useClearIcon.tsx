import type { VueNode } from '@vc-com/util/lib/types';

/**
 * Used for `useFilledProps` since it already in the React.useMemo
 */
export function fillClearIcon(prefixCls: any, allowClear?: boolean | { clearIcon?: VueNode }) {
  if (allowClear === false) {
    return null;
  }

  const config = allowClear && typeof allowClear === 'object' ? allowClear : {};

  return config.clearIcon || <span class={`${prefixCls}-clear-btn`} />;
}
