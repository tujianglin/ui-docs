import { reactiveComputed } from '@vueuse/core';
import type { Ref } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';
import { useMenuContextInject } from '../context/MenuContext';
import type { MenuHoverEventHandler } from '../interface';

interface ActiveObj {
  active: boolean;
  onMouseenter?: MouseEventHandler<HTMLElement>;
  onMouseleave?: MouseEventHandler<HTMLElement>;
}

export default function useActive(
  eventKey: Ref<string>,
  disabled: Ref<boolean>,
  onMouseenter?: MenuHoverEventHandler,
  onMouseleave?: MenuHoverEventHandler,
): ActiveObj {
  const {
    // Active
    activeKey,
    onActive,
    onInactive,
  } = $(useMenuContextInject());

  // Skip when disabled
  return reactiveComputed(() => {
    const ret: ActiveObj = {
      active: activeKey === eventKey.value,
    };
    if (!disabled.value) {
      ret.onMouseenter = (domEvent) => {
        onMouseenter?.({
          key: eventKey.value,
          domEvent,
        });
        onActive(eventKey.value);
      };
      ret.onMouseleave = (domEvent) => {
        onMouseleave?.({
          key: eventKey.value,
          domEvent,
        });
        onInactive(eventKey.value);
      };
    }
    return ret;
  });
}
