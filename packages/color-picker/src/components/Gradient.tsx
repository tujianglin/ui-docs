import { computed, defineComponent } from 'vue';
import { Color } from '../color';
import type { HsbaColorType } from '../interface';
import { generateColor } from '../util';

const Gradient = defineComponent(
  ({
    colors,
    direction = 'to right',
    type,
    prefixCls,
  }: {
    colors: (Color | string)[];
    direction?: string;
    type?: HsbaColorType;
    prefixCls?: string;
  }) => {
    const gradientColors = computed(() =>
      colors
        .map((color, idx) => {
          let result = generateColor(color);
          if (type === 'alpha' && idx === colors.length - 1) {
            result = new Color(result.setA(1));
          }
          return result.toRgbString();
        })
        .join(','),
    );

    return () => (
      <div
        class={`${prefixCls}-gradient`}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${direction}, ${gradientColors.value})`,
        }}
      >
        <slot></slot>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Gradient;
