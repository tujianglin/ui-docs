import { clsx } from 'clsx';
import { defineComponent } from 'vue';

type HandlerSize = 'default' | 'small';

const Handler = defineComponent(
  ({ size = 'default', color, prefixCls }: { size?: HandlerSize; color?: string; prefixCls?: string }) => {
    return () => (
      <div
        class={clsx(`${prefixCls}-handler`, {
          [`${prefixCls}-handler-sm`]: size === 'small',
        })}
        style={{ backgroundColor: color }}
      />
    );
  },
  { inheritAttrs: true },
);

export default Handler;
