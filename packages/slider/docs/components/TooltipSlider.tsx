import type { SliderProps } from '@vc-com/slider';
import Slider from '@vc-com/slider';
import type { TooltipRef } from '@vc-com/tooltip';
import Tooltip from '@vc-com/tooltip';
import raf from '@vc-com/util/lib/raf';
import { defineComponent, watch } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import '../../../tooltip/docs/assets/bootstrap.less';
import type { VueNode } from '../../../util/src/types';

interface HandleTooltipProps {
  value: number;
  visible: boolean;
  tipFormatter?: (value: number) => VueNode;
}

const HandleTooltip = defineComponent(
  ({ value, visible, tipFormatter = (val) => `${val} %`, ...restProps }: HandleTooltipProps) => {
    const tooltipRef = useRef<TooltipRef>();
    const rafRef = useRef<number | null>(null);

    function cancelKeepAlign() {
      raf.cancel(rafRef.value!);
    }

    function keepAlign() {
      rafRef.value = raf(() => {
        tooltipRef.value?.forceAlign();
      });
    }

    watch([() => value, () => visible], (_n, _o, onCleanup) => {
      if (visible) {
        keepAlign();
      } else {
        cancelKeepAlign();
      }
      onCleanup(cancelKeepAlign);
    });

    return () => (
      <Tooltip
        placement="top"
        overlay={tipFormatter(value)}
        styles={{ container: { minHeight: 'auto' } }}
        ref={tooltipRef}
        visible={visible}
        {...restProps}
      >
        <slot></slot>
      </Tooltip>
    );
  },
);

export const handleRender: SliderProps['handleRender'] = (node, props) => (
  <HandleTooltip value={props.value} visible={props.dragging}>
    {node}
  </HandleTooltip>
);

interface TooltipSliderProps extends SliderProps {
  tipFormatter?: (value: number) => VueNode;
  tipProps?: any;
}

const TooltipSlider = defineComponent(({ tipFormatter, tipProps, ...props }: TooltipSliderProps) => {
  const value = defineModel<number | number[]>('value');
  const tipHandleRender: SliderProps['handleRender'] = (node, handleProps) => (
    <HandleTooltip value={handleProps.value} visible={handleProps.dragging} tipFormatter={tipFormatter} {...tipProps}>
      {node}
    </HandleTooltip>
  );

  return () => <Slider {...props} handleRender={tipHandleRender} v-model:value={value.value} />;
});

export default TooltipSlider;
