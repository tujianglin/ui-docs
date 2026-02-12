import { defineComponent } from 'vue';
import type { HTMLAttributes } from 'vue-jsx-vapor';

export interface AffixProps extends HTMLAttributes<HTMLDivElement> {}

// Affix is a simple wrapper which should not read context or logical props
export default defineComponent(
  (props: AffixProps) => {
    const slots = defineSlots<{ default: () => any }>();

    return () => {
      if (!slots.default?.()) {
        return null;
      }
      return <div {...props}>{slots.default?.()}</div>;
    };
  },
  { inheritAttrs: false },
);
