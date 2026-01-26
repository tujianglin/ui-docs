import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import type { TooltipProps } from './Tooltip';

export interface ContentProps {
  prefixCls?: string;
  id?: string;
  classes?: TooltipProps['classes'];
  styles?: TooltipProps['styles'];
  class?: string;
  style?: CSSProperties;
}

const Popup = defineComponent(
  (props: ContentProps) => {
    const { prefixCls, id, classes, styles, class: className, style } = $(props);
    const slots = defineSlots({
      default: () => <></>,
    });

    return () => (
      <div
        id={id}
        class={clsx(`${prefixCls}-container`, classes?.container, className)}
        style={{ ...styles?.container, ...style }}
        role="tooltip"
      >
        <slots.default></slots.default>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Popup;
