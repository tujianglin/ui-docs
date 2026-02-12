import { reactiveComputed } from '@vueuse/core';
import { defineComponent, ref, shallowRef } from 'vue';
import useColorDrag from '../hooks/useColorDrag';
import type { BaseColorPickerProps, TransformOffset } from '../interface';
import { calcOffset, calculateColor } from '../util';
import Handler from './Handler';
import Palette from './Palette';
import Transform from './Transform';

export type PickerProps = BaseColorPickerProps;

const Picker = defineComponent(
  ({ color, onChange, prefixCls, onChangeComplete, disabled }: PickerProps) => {
    const pickerRef = ref<HTMLDivElement>();
    const transformRef = ref<HTMLDivElement>();
    const colorRef = shallowRef(color);

    const onDragChange = (offsetValue: TransformOffset) => {
      const calcColor = calculateColor({
        offset: offsetValue,
        targetRef: transformRef,
        containerRef: pickerRef,
        color,
      });
      colorRef.value = calcColor;
      onChange(calcColor);
    };

    const [offset, dragStartHandle] = useColorDrag(
      reactiveComputed(() => ({
        color,
        containerRef: pickerRef,
        targetRef: transformRef,
        calculate: () => calcOffset(color),
        onDragChange,
        onDragChangeComplete: () => onChangeComplete?.(colorRef.value),
        disabledDrag: disabled,
      })),
    );

    return () => (
      <div
        ref={pickerRef}
        class={`${prefixCls}-select`}
        onMousedown={dragStartHandle as any}
        onTouchstart_passive={dragStartHandle}
      >
        <Palette prefixCls={prefixCls}>
          <Transform x={offset.value.x} y={offset.value.y} ref={transformRef}>
            <Handler color={color.toRgbString()} prefixCls={prefixCls} />
          </Transform>
          <div
            class={`${prefixCls}-saturation`}
            style={{
              backgroundColor: `hsl(${color.toHsb().h},100%, 50%)`,
              backgroundImage: 'linear-gradient(0deg, #000, transparent),linear-gradient(90deg, #fff, hsla(0, 0%, 100%, 0))',
            }}
          />
        </Palette>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Picker;
