import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import type { TooltipProps } from './Tooltip';

export interface ContentProps {
  prefixCls?: string;
  id?: string;
  classNames?: TooltipProps['classNames'];
  styles?: TooltipProps['styles'];
  class?: string;
  style?: CSSProperties;
}

const Popup = defineComponent(
  (props: ContentProps) => {
    const { prefixCls, id, classNames, styles, class: className, style } = $(props);
    const slots = defineSlots({
      default: () => <></>,
    });

    return () => (
      <div
        id={id}
        class={clsx(`${prefixCls}-container`, classNames?.container, className)}
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
