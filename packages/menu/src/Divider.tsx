import { clsx } from 'clsx';
import { defineComponent } from 'vue';
import { useMenuContextInject } from './context/MenuContext';
import { usePathRegisterContextInject } from './context/PathContext';
import type { MenuDividerType } from './interface';

export type DividerProps = Omit<MenuDividerType, 'type'>;

export default defineComponent(
  ({ class: className, style }: DividerProps) => {
    const { prefixCls } = $(useMenuContextInject());
    const measure = usePathRegisterContextInject();

    return () => {
      if (measure) {
        return null;
      }
      return <li role="separator" class={clsx(`${prefixCls}-item-divider`, className)} style={style} />;
    };
  },
  { inheritAttrs: false },
);
