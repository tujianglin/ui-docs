import { defineComponent, shallowRef } from 'vue';

export interface PopupContentProps {
  cache?: boolean;
}

const PopupContent = defineComponent((props: PopupContentProps) => {
  const cachedChildren = shallowRef();
  const slots = defineSlots();
  return () => {
    const children = <slots.default />;

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
