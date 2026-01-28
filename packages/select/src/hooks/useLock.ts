import { onBeforeUnmount, ref, shallowRef, type Ref } from 'vue';

/**
 * Locker return cached mark.
 * If set to `true`, will return `true` in a short time even if set `false`.
 * If set to `false` and then set to `true`, will change to `true`.
 * And after time duration, it will back to `null` automatically.
 */
export default function useLock(duration: Ref<number> = ref(250)): [() => boolean, (lock: boolean) => void] {
  const lockRef = shallowRef<boolean>(null);
  const timeoutRef = shallowRef<number>(null);

  // Clean up
  onBeforeUnmount(() => {
    window.clearTimeout(timeoutRef.value);
  });

  function doLock(locked: boolean) {
    if (locked || lockRef.value === null) {
      lockRef.value = locked;
    }

    window.clearTimeout(timeoutRef.value);
    timeoutRef.value = window.setTimeout(() => {
      lockRef.value = null;
    }, duration.value);
  }

  return [() => lockRef.value, doLock];
}
