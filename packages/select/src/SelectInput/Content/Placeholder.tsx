import Render from '@vc-com/render';
import { clsx } from 'clsx';
import { defineComponent } from 'vue';
import { useBaseSelectContextInject } from '../../hooks/useBaseProps';
import { useSelectInputContextInject } from '../context';

export interface PlaceholderProps {
  show?: boolean;
}

export default defineComponent(
  ({ show = true }: PlaceholderProps) => {
    const { prefixCls, placeholder, displayValues } = $(useSelectInputContextInject());
    const { classNames, styles } = $(useBaseSelectContextInject());

    return () => (
      <div
        v-if={!displayValues.length}
        class={clsx(`${prefixCls}-placeholder`, classNames?.placeholder)}
        style={{
          visibility: show ? 'visible' : 'hidden',
          ...styles?.placeholder,
        }}
      >
        <Render content={placeholder}></Render>
      </div>
    );
  },
  { inheritAttrs: false },
);
