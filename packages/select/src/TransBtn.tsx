import type { RenderNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';

export interface TransBtnProps {
  class: string;
  style?: CSSProperties;
  customizeIcon: RenderNode;
  customizeIconProps?: any;
  onMouseDown?: MouseEventHandler<HTMLSpanElement>;
  onClick?: MouseEventHandler<HTMLSpanElement>;
}

/**
 * Small wrapper for Select icons (clear/arrow/etc.).
 * Prevents default mousedown to avoid blurring or caret moves, and
 * renders a custom icon or a fallback icon span.
 *
 * DOM structure:
 * <span className={className} ...>
 *   { icon || <span className={`${className}-icon`}>{children}</span> }
 * </span>
 */
const TransBtn = defineComponent(
  ({ class: className, style, customizeIcon, customizeIconProps, onMouseDown, onClick }: TransBtnProps) => {
    const slots = defineSlots({ default: () => <></> });

    return () => {
      const icon = typeof customizeIcon === 'function' ? customizeIcon(customizeIconProps) : customizeIcon;
      return (
        <span
          class={className}
          onMousedown={(event) => {
            event.preventDefault();
            onMouseDown?.(event);
          }}
          style={{ userSelect: 'none', WebkitUserSelect: 'none', ...style }}
          unselectable="on"
          onClick={onClick}
          aria-hidden
        >
          {icon !== undefined ? (
            icon
          ) : (
            <span class={clsx(className.split(/\s+/).map((cls) => `${cls}-icon`))}>
              <slots.default />
            </span>
          )}
        </span>
      );
    };
  },
  { inheritAttrs: false },
);

export default TransBtn;
