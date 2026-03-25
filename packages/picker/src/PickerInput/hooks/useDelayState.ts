import { onBeforeUnmount, ref, shallowRef, type Ref } from 'vue';
import useControlledState from '../../../../util/src/hooks/useControlledState';
import raf from '../../../../util/src/raf';

/**
 * Will be `true` immediately for next effect.
 * But will be `false` for a delay of effect.
 */
export default function useDelayState<T>(
  value: Ref<T>,
  defaultValue?: T,
  onChange?: (next: T) => void,
): [state: Ref<T>, setState: (nextState: T, immediately?: boolean) => void] {
  const [state, setState] = useControlledState<T>(defaultValue, value);

  // Need force update to ensure React re-render
  const forceUpdate = ref(Symbol('update'));

  const triggerUpdate = (nextState: T) => {
    setState(nextState);
    forceUpdate.value = Symbol('update');
  };

  const nextValueRef = shallowRef<T>(value.value);

  // ============================= Update =============================
  const rafRef = shallowRef<number>();
  const cancelRaf = () => {
    raf.cancel(rafRef.value);
  };

  const doUpdate = () => {
    triggerUpdate(nextValueRef.value);

    if (onChange && state !== nextValueRef.value) {
      onChange(nextValueRef.value);
    }
  };

  const updateValue = (next: T, immediately?: boolean) => {
    cancelRaf();

    nextValueRef.value = next;

    if (next || immediately) {
      doUpdate();
    } else {
      rafRef.value = raf(doUpdate);
    }
  };

  onBeforeUnmount(() => {
    cancelRaf();
  });

  return [state, updateValue];
}
