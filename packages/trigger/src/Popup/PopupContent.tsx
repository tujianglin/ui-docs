import { filterEmpty } from '@vc-com/util/src/props-util';
import { defineComponent, shallowRef } from 'vue';

export interface PopupContentProps {
  cache?: boolean;
}

const PopupContent = defineComponent((props: PopupContentProps) => {
  const cachedChildren = shallowRef();
  const slots = defineSlots<{ default: () => any }>();
  return () => {
    const children = filterEmpty(slots.default?.());

    if (!props.cache) {
      cachedChildren.value = children;
      return children;
    }

    if (!cachedChildren.value) {
      cachedChildren.value = children;
    }
    return cachedChildren.value;
  };
});

export default PopupContent;
