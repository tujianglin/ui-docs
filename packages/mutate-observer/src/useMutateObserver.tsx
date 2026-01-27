import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { computed, watch, type Ref } from 'vue';

const defaultOptions: MutationObserverInit = {
  subtree: true,
  childList: true,
  attributeFilter: ['style', 'class'],
};

const useMutateObserver = (
  nodeOrList: Ref<HTMLElement | HTMLElement[] | SVGElement | SVGElement[]>,
  callback: MutationCallback,
  optionss: Ref<MutationObserverInit>,
) => {
  const options = computed(() => optionss?.value || defaultOptions);

  watch(
    [options, nodeOrList],
    (_n, _o, onCleanup) => {
      if (!canUseDom() || !nodeOrList.value) {
        return;
      }

      let instance: MutationObserver;

      const nodeList = Array.isArray(nodeOrList.value) ? nodeOrList.value : [nodeOrList.value];

      if ('MutationObserver' in window) {
        instance = new MutationObserver(callback);

        nodeList.forEach((element) => {
          instance.observe(element, options.value);
        });
      }
      onCleanup(() => {
        instance?.takeRecords();
        instance?.disconnect();
      });
    },
    { immediate: true, deep: true },
  );
};

export default useMutateObserver;
