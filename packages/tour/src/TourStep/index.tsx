import { defineComponent } from 'vue';
import type { TourStepInfo, TourStepProps } from '../interface';
import DefaultPanel, { type DefaultPanelProps } from './DefaultPanel';

export type { TourStepInfo, TourStepProps };

const TourStep = defineComponent(
  (props: DefaultPanelProps) => {
    return () => {
      const { current, renderPanel } = props;
      return <>{typeof renderPanel === 'function' ? renderPanel(props, current) : <DefaultPanel {...props} />}</>;
    };
  },
  { inheritAttrs: false },
);

export default TourStep;
