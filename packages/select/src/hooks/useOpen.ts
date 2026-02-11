import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { computed, onMounted, ref, shallowRef, type ComputedRef, type Ref } from 'vue';

const internalMacroTask = (fn: VoidFunction) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = fn;
  channel.port2.postMessage(null);
};

export const macroTask = (fn: VoidFunction, times = 1) => {
  if (times <= 0) {
    fn();
    return;
  }

  internalMacroTask(() => {
    macroTask(fn, times - 1);
  });
};

/**
 * Trigger by latest open call, if nextOpen is undefined, means toggle.
 * `weak` means this call can be ignored if previous call exists.
 */
export type TriggerOpenType = (
  nextOpen?: boolean,
  config?: {
    cancelFun?: () => boolean;
  },
) => void;

/**
 * When `open` is controlled, follow the controlled value;
 * Otherwise use uncontrolled logic.
 * Setting `open` takes effect immediately,
 * but setting it to `false` is delayed via MessageChannel.
 *
 * SSR handling: During SSR, `open` is always false to avoid Portal issues.
 * On client-side hydration, it syncs with the actual open state.
 */
export default function useOpen(
  defaultOpen: Ref<boolean>,
  propOpen: Ref<boolean>,
  onOpen: (nextOpen: boolean) => void,
  postOpen: (nextOpen: boolean) => boolean,
): [ComputedRef<boolean>, ComputedRef<boolean>, TriggerOpenType, Ref<boolean>] {
  // SSR not support Portal which means we need delay `open` for the first time render
  const rendered = ref(false);

  onMounted(() => {
    rendered.value = true;
  });

  const [stateOpen, internalSetOpen] = useControlledState(defaultOpen.value, propOpen);

  // Lock for options update
  const lock = ref(false);

  // During SSR, always return false for open state
  const ssrSafeOpen = computed(() => (rendered.value ? stateOpen.value : false));
  const mergedOpen = computed(() => postOpen(ssrSafeOpen.value));

  const taskIdRef = shallowRef(0);

  const triggerEvent = (nextOpen: boolean) => {
    if (onOpen && mergedOpen.value !== nextOpen) {
      onOpen(nextOpen);
    }
    internalSetOpen(nextOpen);
  };

  const toggleOpen: TriggerOpenType = (nextOpen, config = {}) => {
    const { cancelFun } = config;

    taskIdRef.value += 1;

    const id = taskIdRef.value;

    const nextOpenVal = typeof nextOpen === 'boolean' ? nextOpen : !mergedOpen.value;
    lock.value = !nextOpenVal;

    function triggerUpdate() {
      if (
        // Always check if id is match
        id === taskIdRef.value &&
        // Check if need to cancel
        !cancelFun?.()
      ) {
        triggerEvent(nextOpenVal);
        lock.value = false;
      }
    }

    // Weak update can be ignored
    if (nextOpenVal) {
      triggerUpdate();
    } else {
      macroTask(() => {
        triggerUpdate();
      });
    }
  };

  return [ssrSafeOpen, mergedOpen, toggleOpen, lock];
}
