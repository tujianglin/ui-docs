import { nextTick, ref, shallowRef, watch, type Ref } from 'vue';

/**
 * Help to merge callback with `useLayoutEffect`.
 * One time will only trigger once.
 */
export default function useUpdate(callback: VoidFunction): () => void {
  const count = ref(0);
  const effectRef = shallowRef(0);
  const callbackRef = shallowRef<VoidFunction>();
  callbackRef.value = callback;

  // Trigger on `useLayoutEffect`
  watch(
    count,
    async () => {
      await nextTick();
      callbackRef.value?.();
    },
    { immediate: true, flush: 'post' },
  );

  // Trigger to update count
  return () => {
    if (effectRef.value !== count.value) {
      return;
    }

    effectRef.value += 1;
    count.value = effectRef.value;
  };
}

type Callback<T> = (ori: T) => T;

export function useUpdateState<T>(defaultState: T | (() => T)): [Ref<T>, (updater: Callback<T>) => void] {
  const batchRef = shallowRef<Callback<T>[]>([]);
  const forceUpdate = ref(Symbol('update'));
  const state = shallowRef<T>(typeof defaultState === 'function' ? (defaultState as any)() : defaultState);

  const flushUpdate = useUpdate(() => {
    let value = state.value;
    batchRef.value.forEach((callback) => {
      value = callback(value);
    });
    batchRef.value = [];

    state.value = value;
    forceUpdate.value = Symbol('update');
  });

  function updater(callback: Callback<T>) {
    batchRef.value.push(callback);
    flushUpdate();
  }

  return [state, updater];
}
