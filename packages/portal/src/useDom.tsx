import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { computed, inject, nextTick, ref, watch, type Ref } from 'vue';
import { OrderContextKey, type QueueCreate } from './Context';

const EMPTY_LIST = [];

/**
 * Will add `div` to document. Nest call will keep order
 * @param render Render DOM in document
 */
export default function useDom(render: Ref<boolean>, debug?: string): [Ref<HTMLDivElement | null>, Ref<QueueCreate>] {
  const ele = computed(() => {
    if (!canUseDom()) {
      return null;
    }

    const defaultEle = document.createElement('div');

    if (process.env.NODE_ENV !== 'production' && debug) {
      defaultEle.setAttribute('data-debug', debug);
    }

    return defaultEle;
  });

  // ========================== Order ==========================
  const appendedRef = ref(false);

  const queueCreate = inject(OrderContextKey, undefined);
  const queue = ref<VoidFunction[]>(EMPTY_LIST);

  const mergedQueueCreate = computed(
    () =>
      queueCreate?.value ||
      (appendedRef.value
        ? undefined
        : (appendFn: VoidFunction) => {
            const newQueue = [appendFn, ...queue.value];
            queue.value = newQueue;
          }),
  );

  // =========================== DOM ===========================
  function append() {
    if (!ele.value.parentElement) {
      document.body.appendChild(ele.value);
    }

    appendedRef.value = true;
  }

  function cleanup() {
    ele.value.parentElement?.removeChild(ele.value);

    appendedRef.value = false;
  }

  watch(
    render,
    async (_n, _o, onCleanup) => {
      await nextTick();
      if (render.value) {
        if (queueCreate?.value) {
          queueCreate?.value?.(append);
        } else {
          append();
        }
      } else {
        cleanup();
      }
      onCleanup(() => {
        cleanup();
      });
    },
    { flush: 'post', immediate: true },
  );

  watch(
    queue,
    (val) => {
      if (val.length) {
        val.forEach((appendFn) => appendFn());
        queue.value = EMPTY_LIST;
      }
    },
    { immediate: true, deep: true },
  );

  return [ele, mergedQueueCreate];
}
