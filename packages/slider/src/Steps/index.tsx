import { computed, defineComponent, type CSSProperties } from 'vue';
import { useSliderContextInject } from '../context';
import type { InternalMarkObj } from '../Marks';
import Dot from './Dot';

export interface StepsProps {
  prefixCls: string;
  marks: InternalMarkObj[];
  dots?: boolean;
  style?: CSSProperties | ((dotValue: number) => CSSProperties);
  activeStyle?: CSSProperties | ((dotValue: number) => CSSProperties);
}

const Steps = defineComponent((props: StepsProps) => {
  const { prefixCls, marks, dots, style, activeStyle } = props;
  const { min, max, step } = $(useSliderContextInject());

  const stepDots = computed<number[]>(() => {
    const dotSet = new Set<number>();

    // Add marks
    marks.forEach((mark) => {
      dotSet.add(mark.value);
    });

    // Fill dots
    if (dots && step !== null) {
      let current = min;
      while (current <= max) {
        dotSet.add(current);
        current += step;
      }
    }

    return Array.from(dotSet);
  });

  return () => (
    <div class={`${prefixCls}-step`}>
      {stepDots.value.map((dotValue) => (
        <Dot prefixCls={prefixCls} key={dotValue} value={dotValue} style={style} activeStyle={activeStyle} />
      ))}
    </div>
  );
});

export default Steps;
