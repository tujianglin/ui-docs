import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, watch } from 'vue';
import { useRef, type UIEventHandler } from 'vue-jsx-vapor';
import { usePanelContextInject } from '../../context';
import useScrollTo from './useScrollTo';

const SCROLL_DELAY = 300;

export type Unit<ValueType = number | string> = {
  label: any;
  value: ValueType;
  disabled?: boolean;
};

export interface TimeUnitColumnProps {
  units: Unit[];
  value: number | string;
  optionalValue?: number | string;
  type: 'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem';
  onChange: (value: number | string) => void;
  onHover: (value: number | string) => void;
  onDblClick?: VoidFunction;
  changeOnScroll?: boolean;
}

// Not use JSON.stringify to avoid dead loop
function flattenUnits(units: Unit<string | number>[]) {
  return units.map(({ value, label, disabled }) => [value, label, disabled].join(',')).join(';');
}

const TimeColumn = defineComponent(
  ({ units, value, optionalValue, type, onChange, onHover, onDblClick, changeOnScroll }: TimeUnitColumnProps) => {
    const { prefixCls, cellRender, now, locale, classNames, styles } = $(usePanelContextInject());

    const panelPrefixCls = computed(() => `${prefixCls}-time-panel`);
    const cellPrefixCls = computed(() => `${prefixCls}-time-panel-cell`);

    // ========================== Refs ==========================
    const ulRef = useRef<HTMLUListElement>(null);

    // ========================= Scroll =========================
    const checkDelayRef = useRef<any>();

    const clearDelayCheck = () => {
      clearTimeout(checkDelayRef.value);
    };

    // ========================== Sync ==========================
    const [syncScroll, stopScroll, isScrolling] = useScrollTo(
      ulRef,
      computed(() => value ?? optionalValue),
    );

    // Effect sync value scroll
    watch(
      [() => value, () => optionalValue, () => flattenUnits(units)],
      async (_n, _o, onCleanup) => {
        await nextTick();
        syncScroll();
        clearDelayCheck();

        onCleanup(() => {
          stopScroll();
          clearDelayCheck();
        });
      },
      { immediate: true, deep: true, flush: 'post' },
    );

    // ========================= Change =========================
    // Scroll event if sync onScroll
    const onInternalScroll: UIEventHandler<HTMLUListElement> = (event) => {
      clearDelayCheck();

      const target = event.target as HTMLUListElement;

      if (!isScrolling() && changeOnScroll) {
        checkDelayRef.value = setTimeout(() => {
          const ul = ulRef.value!;
          const firstLiTop = ul.querySelector<HTMLLIElement>(`li`).offsetTop;
          const liList = Array.from(ul.querySelectorAll<HTMLLIElement>(`li`));
          const liTopList = liList.map((li) => li.offsetTop - firstLiTop);
          const liDistList = liTopList.map((top, index) => {
            if (units[index].disabled) {
              return Number.MAX_SAFE_INTEGER;
            }
            return Math.abs(top - target.scrollTop);
          });

          // Find min distance index
          const minDist = Math.min(...liDistList);
          const minDistIndex = liDistList.findIndex((dist) => dist === minDist);
          const targetUnit = units[minDistIndex];
          if (targetUnit && !targetUnit.disabled) {
            onChange(targetUnit.value);
          }
        }, SCROLL_DELAY);
      }
    };

    // ========================= Render =========================
    const columnPrefixCls = computed(() => `${panelPrefixCls}-column`);

    return () => (
      <ul class={columnPrefixCls.value} ref={ulRef} data-type={type} onScroll={onInternalScroll}>
        {units.map(({ label, value: unitValue, disabled }) => {
          const inner = <div class={`${cellPrefixCls.value}-inner`}>{label}</div>;

          return (
            <li
              key={unitValue}
              style={styles.item}
              class={clsx(cellPrefixCls.value, classNames.item, {
                [`${cellPrefixCls.value}-selected`]: value === unitValue,
                [`${cellPrefixCls.value}-disabled`]: disabled,
              })}
              onClick={() => {
                if (!disabled) {
                  onChange(unitValue);
                }
              }}
              onDblclick={() => {
                if (!disabled && onDblClick) {
                  onDblClick();
                }
              }}
              onMouseenter={() => {
                onHover(unitValue);
              }}
              onMouseleave={() => {
                onHover(null);
              }}
              data-value={unitValue}
            >
              {cellRender
                ? cellRender(unitValue as any, {
                    prefixCls,
                    originNode: inner,
                    today: now,
                    type: 'time',
                    subType: type,
                    locale,
                  })
                : inner}
            </li>
          );
        })}
      </ul>
    );
  },
  { inheritAttrs: false },
);

export default TimeColumn;
