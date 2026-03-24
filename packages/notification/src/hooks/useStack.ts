import { computed, type ComputedRef, type Reactive } from 'vue';
import type { StackConfig } from '../interface';

const DEFAULT_OFFSET = 8;
const DEFAULT_THRESHOLD = 3;
const DEFAULT_GAP = 16;

type StackParams = Exclude<StackConfig, boolean>;

type UseStack = (config?: Reactive<StackConfig>) => [ComputedRef<boolean>, ComputedRef<StackParams>];

const useStack: UseStack = (config) => {
  const result = computed<StackParams>(() => {
    const res = {
      offset: DEFAULT_OFFSET,
      threshold: DEFAULT_THRESHOLD,
      gap: DEFAULT_GAP,
    };
    if (config && typeof config === 'object') {
      res.offset = config.offset ?? DEFAULT_OFFSET;
      res.threshold = config.threshold ?? DEFAULT_THRESHOLD;
      res.gap = config.gap ?? DEFAULT_GAP;
    }
    return res;
  });
  return [computed(() => !!config), result];
};

export default useStack;
