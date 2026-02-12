import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import { useSliderContextInject } from '../context';
import { getDirectionStyle } from '../util';

export interface MarkProps {
  prefixCls: string;
  style?: CSSProperties;
  value: number;
  onClick: (value: number) => void;
}

const Mark = defineComponent(
  ({ prefixCls, style, value, onClick }: MarkProps) => {
    const { min, max, direction, includedStart, includedEnd, included } = $(useSliderContextInject());

    const textCls = computed(() => `${prefixCls}-text`);

    // ============================ Offset ============================
    const positionStyle = computed(() => getDirectionStyle(direction, value, min, max));

    return () => (
      <span
        class={clsx(textCls.value, {
          [`${textCls.value}-active`]: included && includedStart <= value && value <= includedEnd,
        })}
        style={{ ...positionStyle.value, ...style }}
        onMousedown={(e) => {
          e.stopPropagation();
        }}
        onClick={() => {
          onClick(value);
        }}
      >
        <slot></slot>
      </span>
    );
  },
  { inheritAttrs: false },
);

export default Mark;
