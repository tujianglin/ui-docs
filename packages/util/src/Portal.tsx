import { defineComponent, onBeforeUnmount, onMounted, shallowRef, Teleport, watchEffect } from 'vue';
import canUseDom from './Dom/canUseDom';

export type PortalRef = {};

export interface PortalProps {
  didUpdate?: (prevProps: PortalProps) => void;
  getContainer: () => HTMLElement;
}

const Portal = defineComponent(
  (props: PortalProps) => {
    const { didUpdate, getContainer } = $(props);

    const parentRef = shallowRef<ParentNode>(null);
    const containerRef = shallowRef<HTMLElement>(null);

    // Create container in client side with sync to avoid useEffect not get ref
    const initRef = shallowRef<boolean>(false);

    if (!initRef.value && canUseDom()) {
      containerRef.value = getContainer();
      parentRef.value = containerRef.value.parentNode;
      initRef.value = true;
    }

    // [Legacy] Used by `rc-trigger`
    watchEffect(() => {
      didUpdate?.(props);
    });

    onMounted(() => {
      // Restore container to original place
      // React 18 StrictMode will unmount first and mount back for effect test:
      // https://reactjs.org/blog/2022/03/29/react-v18.html#new-strict-mode-behaviors
      if (containerRef.value.parentNode === null && parentRef.value !== null) {
        parentRef.value.appendChild(containerRef.value);
      }
    });

    onBeforeUnmount(() => {
      containerRef.value?.parentNode?.removeChild(containerRef.value);
    });

    return () => {
      if (containerRef.value) {
        return (
          <Teleport to={containerRef.value}>
            <slot></slot>
          </Teleport>
        );
      }
      return null;
    };
  },
  { inheritAttrs: false },
);

export default Portal;
