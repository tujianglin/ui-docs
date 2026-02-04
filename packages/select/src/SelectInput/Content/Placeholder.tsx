import { resolveVNode } from '@vc-com/util/lib/vnode';
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

    return () => {
      if (displayValues.length) {
        return null;
      }

      return (
        <div
          class={clsx(`${prefixCls}-placeholder`, classNames?.placeholder)}
          style={{
            visibility: show ? 'visible' : 'hidden',
            ...styles?.placeholder,
          }}
        >
          {resolveVNode(placeholder)}
        </div>
      );
    };
  },
  { inheritAttrs: false },
);
