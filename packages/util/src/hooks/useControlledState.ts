import { ref, type Ref } from 'vue';
import { useLayoutEffect } from './useLayoutEffect';

type Updater<T> = (updater: T | ((origin: T) => T)) => void;

/**
 * Vue 版本的 useControlledState
 *
 * @description
 * 类似于 Vue 的 ref，但支持受控/非受控模式。
 * 当外部传入 value 时使用外部值（受控），否则使用内部状态（非受控）。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useControlledState from '@/hooks/useControlledState';
 *
 * const props = defineProps<{
 *   value?: string;
 * }>();
 *
 * // 如果 props.value 存在则使用 props.value（受控）
 * // 否则使用 'default' 作为内部状态（非受控）
 * const [inputValue, setInputValue] = useControlledState('default', props.value);
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **表单组件** - Input、Select 等需要支持 v-model 的组件
 * 2. **可选受控** - 允许用户选择受控或非受控模式
 * 3. **默认值处理** - 在非受控模式下提供默认值
 *
 * @param defaultStateValue - 默认的内部状态值
 * @param value - 外部传入的受控值（可选）
 * @returns [当前值, 更新函数] 元组
 */
export default function useControlledState<T>(defaultStateValue: T | (() => T), value?: T): [Ref<T>, Updater<T>] {
  const innerValue = ref<T>(
    typeof defaultStateValue === 'function' ? (defaultStateValue as () => T)() : defaultStateValue,
  ) as Ref<T>;

  // 当 value 变化时同步到内部状态
  useLayoutEffect(
    (mount) => {
      if (!mount && value !== undefined) {
        innerValue.value = value;
      }
    },
    [() => value],
  );

  // 合并后的值：优先使用外部 value
  const getMergedValue = (): T => {
    return value !== undefined ? value : innerValue.value;
  };

  const setInnerValue: Updater<T> = (updater) => {
    const newValue = typeof updater === 'function' ? (updater as (origin: T) => T)(innerValue.value) : updater;
    innerValue.value = newValue;
  };

  // 返回一个包装的 Ref，getter 返回合并值
  const mergedRef = ref<T>(getMergedValue()) as Ref<T>;

  // 使用 watch 同步
  useLayoutEffect(() => {
    mergedRef.value = getMergedValue();
  }, [() => value, innerValue]);

  return [mergedRef, setInnerValue];
}
