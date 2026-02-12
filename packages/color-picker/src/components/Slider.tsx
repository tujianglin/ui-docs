import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, shallowRef } from 'vue';
import { Color } from '../color';
import useColorDrag from '../hooks/useColorDrag';
import type { HsbaColorType, TransformOffset } from '../interface';
import { calcOffset, calculateColor } from '../util';
import Gradient from './Gradient';
import Handler from './Handler';
import Palette from './Palette';
import Transform from './Transform';

export interface BaseSliderProps {
  prefixCls: string;
  colors: { percent: number; color: string }[];
  min: number;
  max: number;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  onChangeComplete: (value: number) => void;
  type: HsbaColorType;
  color: Color;
}

const Slider = defineComponent(({ prefixCls, colors, disabled, onChange, onChangeComplete, color, type }: BaseSliderProps) => {
  const sliderRef = ref<HTMLDivElement>();
  const transformRef = ref<HTMLDivElement>();
  const colorRef = shallowRef<Color>(color);

  const getValue = (c: Color) => {
    return type === 'hue' ? c.getHue() : c.a * 100;
  };

  const onDragChange = (offsetValue: TransformOffset) => {
    const calcColor = calculateColor({
      offset: offsetValue,
      targetRef: transformRef,
      containerRef: sliderRef,
      color,
      type,
    });

    colorRef.value = calcColor;
    onChange(getValue(calcColor));
  };

  const [offset, dragStartHandle] = useColorDrag(
    reactiveComputed(() => ({
      color,
      targetRef: transformRef.value,
      containerRef: sliderRef.value,
      calculate: () => calcOffset(color, type),
      onDragChange,
      onDragChangeComplete() {
        onChangeComplete(getValue(colorRef.value));
      },
      direction: 'x',
      disabledDrag: disabled,
    })),
  );

  const handleColor = computed(() => {
    if (type === 'hue') {
      const hsb = color.toHsb();
      hsb.s = 1;
      hsb.b = 1;
      hsb.a = 1;

      const lightColor = new Color(hsb);
      return lightColor;
    }

    return color;
  });

  // ========================= Gradient =========================
  const gradientList = computed(() => colors.map((info) => `${info.color} ${info.percent}%`));

  // ========================== Render ==========================
  return () => (
    <div
      ref={sliderRef}
      class={clsx(`${prefixCls}-slider`, `${prefixCls}-slider-${type}`)}
      onMousedown={dragStartHandle as any}
      onTouchstart_passive={dragStartHandle as any}
    >
      <Palette prefixCls={prefixCls}>
        <Transform x={offset.value.x} y={offset.value.y} ref={transformRef}>
          <Handler size="small" color={handleColor.value.toHexString()} prefixCls={prefixCls} />
        </Transform>
        <Gradient colors={gradientList.value} type={type} prefixCls={prefixCls} />
      </Palette>
    </div>
  );
});

export default Slider;
