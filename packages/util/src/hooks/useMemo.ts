interface Cache<Value, Condition> {
  condition?: Condition;
  value?: Value;
}

/**
 * Vue 版本的 useMemo
 *
 * @description
 * 类似于 Vue 的 computed，但使用自定义的 shouldUpdate 函数来判断是否需要重新计算。
 * 当 shouldUpdate 返回 true 时才重新执行 getValue。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useMemo from '@/hooks/useMemo';
 *
 * const expensiveValue = useMemo(
 *   () => computeExpensiveValue(a, b),
 *   [a, b],
 *   (prev, next) => prev[0] !== next[0] || prev[1] !== next[1]
 * );
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **复杂计算缓存** - 昂贵的计算操作需要缓存
 * 2. **自定义比较** - 需要自定义依赖比较逻辑
 * 3. **引用稳定性** - 保持对象/数组引用稳定
 *
 * @param getValue - 获取值的函数
 * @param condition - 条件依赖
 * @param shouldUpdate - 判断是否需要更新的函数
 * @returns 缓存的值
 */
export default function useMemo<Value, Condition = any[]>(
  getValue: () => Value,
  condition: Condition,
  shouldUpdate: (prev: Condition, next: Condition) => boolean,
): Value {
  // 使用闭包保持缓存
  const cache: Cache<Value, Condition> = {};

  if (!('value' in cache) || shouldUpdate(cache.condition as Condition, condition)) {
    cache.value = getValue();
    cache.condition = condition;
  }

  return cache.value as Value;
}
