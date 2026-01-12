import { ref, watch, type Ref } from 'vue';
import useEvent from './useEvent';
import { useLayoutUpdateEffect } from './useLayoutEffect';

type Updater<T> = (updater: T | ((origin: T) => T), ignoreDestroy?: boolean) => void;

/** 判断值是否存在（只有 undefined 被认为是空值） */
function hasValue(value: any) {
  return value !== undefined;
}

/**
 * Vue 版本的 useMergedState
 *
 * @deprecated 如果不需要支持 React 18 以下版本，请使用 `useControlledState`。
 *
 * @description
 * 类似于 Vue 的 ref，但支持受控/非受控模式，并提供 onChange 回调。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useMergedState from '@/hooks/useMergedState';
 *
 * const props = defineProps<{
 *   value?: string;
 *   defaultValue?: string;
 * }>();
 *
 * const emit = defineEmits<{
 *   change: [value: string, prevValue: string];
 * }>();
 *
 * const [inputValue, setInputValue] = useMergedState('', {
 *   defaultValue: props.defaultValue,
 *   value: props.value,
 *   onChange: (val, prev) => emit('change', val, prev),
 * });
 * </script>
 * ```
 *
 * @param defaultStateValue - 默认的内部状态值
 * @param option - 配置选项
 * @returns [当前值, 更新函数] 元组
 */
export default function useMergedState<T, R = T>(
  defaultStateValue: T | (() => T),
  option?: {
    defaultValue?: T | (() => T);
    value?: T;
    onChange?: (value: T, prevValue: T) => void;
    postState?: (value: T) => T;
  },
): [Ref<R>, Updater<T>] {
  const { defaultValue, value, onChange, postState } = option || {};

  // ======================= Init =======================
  const getInitialValue = (): T => {
    if (hasValue(value)) {
      return value as T;
    } else if (hasValue(defaultValue)) {
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : (defaultValue as T);
    } else {
      return typeof defaultStateValue === 'function' ? (defaultStateValue as () => T)() : defaultStateValue;
    }
  };

  const innerValue = ref<T>(getInitialValue()) as Ref<T>;
  const prevValue = ref<T>(innerValue.value) as Ref<T>;

  // 合并后的值
  const getMergedValue = (): T => {
    return value !== undefined ? value : innerValue.value;
  };

  // ====================== Change ======================
  const onChangeFn = useEvent(onChange);

  // 监听内部值变化，触发 onChange
  watch(innerValue, (newVal) => {
    if (newVal !== prevValue.value) {
      onChangeFn?.(newVal, prevValue.value);
      prevValue.value = newVal;
    }
  });

  // 当 value 变为 undefined 时同步到内部状态
  useLayoutUpdateEffect(() => {
    if (!hasValue(value)) {
      innerValue.value = value as T;
    }
  }, [() => value]);

  // ====================== Update ======================
  const triggerChange: Updater<T> = useEvent((updater, _ignoreDestroy) => {
    const newValue = typeof updater === 'function' ? (updater as (origin: T) => T)(innerValue.value) : updater;
    innerValue.value = newValue;
  });

  // 计算最终值
  const mergedValue = getMergedValue();
  const postMergedValue = postState ? postState(mergedValue) : mergedValue;

  // 返回包装的 ref
  const resultRef = ref<R>(postMergedValue as unknown as R) as Ref<R>;

  // 监听变化更新 resultRef
  watch([innerValue, () => value], () => {
    const merged = getMergedValue();
    resultRef.value = (postState ? postState(merged) : merged) as unknown as R;
  });

  return [resultRef, triggerChange];
}
