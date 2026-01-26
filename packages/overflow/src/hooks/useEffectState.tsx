import { ref, shallowRef, type Ref } from 'vue';
import channelUpdate from './channelUpdate';

type Updater<T> = T | ((origin: T) => T);

type UpdateCallbackFunc = VoidFunction;

type NotifyEffectUpdate = (callback: UpdateCallbackFunc) => void;

/**
 * Batcher for record any `useEffectState` need update.
 */
export function useBatcher() {
  // Updater Trigger
  const updateFuncRef = shallowRef<UpdateCallbackFunc[]>(null);

  // Notify update
  const notifyEffectUpdate: NotifyEffectUpdate = (callback) => {
    if (!updateFuncRef.value) {
      updateFuncRef.value = [];

      channelUpdate(() => {
        updateFuncRef.value.forEach((fn) => {
          fn();
        });
        updateFuncRef.value = null;
      });
    }

    updateFuncRef.value.push(callback);
  };

  return notifyEffectUpdate;
}

/**
 * Trigger state update by `useLayoutEffect` to save perf.
 */
export default function useEffectState<T = any>(
  notifyEffectUpdate: NotifyEffectUpdate,
  defaultValue?: T,
): [Ref<T>, (value: Updater<T>) => void] {
  // Value
  const stateValue = ref<any>(defaultValue);

  // Set State
  const setEffectVal = (nextValue: Updater<T>) => {
    notifyEffectUpdate(() => {
      if (typeof nextValue === 'function') {
        const updater = nextValue as (origin: T | null | undefined) => T;
        stateValue.value = updater(stateValue.value as T);
      } else {
        stateValue.value = nextValue as any;
      }
    });
  };

  return [stateValue, setEffectVal] as const;
}
