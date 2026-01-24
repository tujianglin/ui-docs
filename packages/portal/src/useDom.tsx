import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { computed, nextTick, onUnmounted, shallowRef, watch, type ComputedRef, type Ref } from 'vue';
import { useOrderContextInject, type QueueCreate } from './Context';

const EMPTY_LIST = [];

/**
 * Will add `div` to document. Nest call will keep order
 * @param render Render DOM in document
 */
export default function useDom(render: Ref<boolean>, debug?: string): [HTMLDivElement | null, ComputedRef<QueueCreate>] {
  const eleFun = () => {
    if (!canUseDom()) return null;

    const defaultEle = document.createElement('div');

    if (process.env.NODE_ENV !== 'production' && debug) defaultEle.setAttribute('data-debug', debug);
    return defaultEle;
  };
  const ele = eleFun();

  // ========================== Order ==========================
  const appendedRef = shallowRef(false);
  const queueCreate = useOrderContextInject();
  const queue = shallowRef<VoidFunction[]>([]);

  const mergedQueueCreate = computed(
    () =>
      queueCreate?.value ||
      (appendedRef.value
        ? undefined
        : (appendFn: VoidFunction) => {
            queue.value = [appendFn, ...queue.value];
          }),
  );

  // =========================== DOM ===========================
  function append() {
    if (!ele?.parentElement) document.body.appendChild(ele!);
    appendedRef.value = true;
  }

  function cleanup() {
    if (ele?.parentElement) {
      ele?.parentElement?.removeChild(ele);
    } else {
      if (ele && appendedRef.value) {
        document.body?.removeChild?.(ele!);
      }
    }

    appendedRef.value = false;
  }

  watch(
    render,
    () => {
      if (render.value) {
        if (queueCreate?.value) queueCreate.value(append);
        else append();
      } else {
        nextTick(() => {
          cleanup();
        });
      }
    },
    {
      immediate: true,
    },
  );

  onUnmounted(cleanup);

  watch(
    queue,
    () => {
      if (queue.value.length) {
        queue.value.forEach((fn) => fn());
        queue.value = [...EMPTY_LIST];
      }
    },
    {
      flush: 'post',
      immediate: true,
    },
  );

  return [ele, mergedQueueCreate];
}
