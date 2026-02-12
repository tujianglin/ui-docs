import { resolveToElement } from '@vc-com/util/lib/vnode';
import { computed, defineComponent, ref } from 'vue';
import type { MutationObserverProps } from './interface';
import useMutateObserver from './useMutateObserver';

const MutateObserver = defineComponent(
  ({ options, onMutate = () => {} }: MutationObserverProps) => {
    const slots = defineSlots({ default: () => <></> });

    const target = ref<HTMLElement | SVGElement>(null);

    useMutateObserver(
      target,
      onMutate,
      computed(() => options),
    );

    function setTarget(node) {
      target.value = resolveToElement(node);
    }

    // =========================== Render ===========================

    return () => {
      const children = slots.default?.();
      if (!children) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('MutationObserver need children props');
        }
        return null;
      }
      return <slots.default ref={setTarget}></slots.default>;
    };
  },
  { inheritAttrs: false },
);

export default MutateObserver;
