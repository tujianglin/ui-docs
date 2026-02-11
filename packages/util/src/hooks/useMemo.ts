import { computed, type ComputedRef } from 'vue';

interface Cache<Value, Condition> {
  condition?: Condition;
  value?: Value;
  inited?: boolean;
}

/**
 * Vue 版本 useMemo（受控重算）
 * - condition 用函数返回，让 Vue 在 computed 内追踪依赖
 * - shouldUpdate 决定是否重算
 */
export default function useMemo<Value, Condition>(
  getValue: () => Value,
  condition: () => Condition,
  shouldUpdate: (prev: Condition, next: Condition) => boolean,
): ComputedRef<Value> {
  const cache: Cache<Value, Condition> = {};

  return computed(() => {
    const next = condition();

    if (!cache.inited || shouldUpdate(cache.condition as Condition, next)) {
      cache.value = getValue();
      cache.condition = next;
      cache.inited = true;
    }

    return cache.value as Value;
  });
}
