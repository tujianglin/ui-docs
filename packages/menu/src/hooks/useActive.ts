import { reactiveComputed } from '@vueuse/core';
import type { Ref } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';
import { useMenuContextInject } from '../context/MenuContext';
import type { MenuHoverEventHandler } from '../interface';

interface ActiveObj {
  active: boolean;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
}

export default function useActive(
  eventKey: Ref<string>,
  disabled: Ref<boolean>,
  onMouseEnter?: MenuHoverEventHandler,
  onMouseLeave?: MenuHoverEventHandler,
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
      ret.onMouseEnter = (domEvent) => {
        onMouseEnter?.({
          key: eventKey.value,
          domEvent,
        });
        onActive(eventKey.value);
      };
      ret.onMouseLeave = (domEvent) => {
        onMouseLeave?.({
          key: eventKey.value,
          domEvent,
        });
        onInactive(eventKey.value);
      };
    }
    return ret;
  });
}
