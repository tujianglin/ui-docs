import { clsx } from 'clsx';
import { computed, type CSSProperties } from 'vue';
import { useSliderContextInject } from '../context';
import { getDirectionStyle } from '../util';

export interface DotProps {
  prefixCls: string;
  value: number;
  style?: CSSProperties | ((dotValue: number) => CSSProperties);
  activeStyle?: CSSProperties | ((dotValue: number) => CSSProperties);
}

const Dot = ({ prefixCls, value, style, activeStyle }: DotProps) => {
  const { min, max, direction, included, includedStart, includedEnd } = $(useSliderContextInject());

  const dotClassName = computed(() => `${prefixCls}-dot`);
  const active = computed(() => included && includedStart <= value && value <= includedEnd);

  // ============================ Offset ============================
  const mergedStyle = computed(() => {
    let result: CSSProperties = {
      ...getDirectionStyle(direction, value, min, max),
      ...(typeof style === 'function' ? style(value) : style),
    };

    if (active.value) {
      result = {
        ...result,
        ...(typeof activeStyle === 'function' ? activeStyle(value) : activeStyle),
      };
    }
    return result;
  });
  return <span class={clsx(dotClassName.value, { [`${dotClassName.value}-active`]: active.value })} style={mergedStyle.value} />;
};

export default Dot;
