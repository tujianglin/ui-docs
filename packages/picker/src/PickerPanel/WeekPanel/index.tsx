import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import type { DateType, SharedPanelProps } from '../../interface';
import { isInRange, isSameWeek } from '../../utils/dateUtil';
import DatePanel from '../DatePanel';

const WeekPanel = defineComponent(
  ({ prefixCls, generateConfig, locale, value, hoverValue, hoverRangeValue }: SharedPanelProps) => {
    const props = useFullProps() as SharedPanelProps;
    // =============================== Row ================================
    const localeName = computed(() => locale.locale);

    const rowPrefixCls = computed(() => `${prefixCls}-week-panel-row`);

    const rowClassName = (currentDate: DateType) => {
      const rangeCls = {};

      if (hoverRangeValue) {
        const [rangeStart, rangeEnd] = hoverRangeValue;

        const isRangeStart = isSameWeek(generateConfig, localeName.value, rangeStart, currentDate);
        const isRangeEnd = isSameWeek(generateConfig, localeName.value, rangeEnd, currentDate);

        rangeCls[`${rowPrefixCls.value}-range-start`] = isRangeStart;
        rangeCls[`${rowPrefixCls.value}-range-end`] = isRangeEnd;
        rangeCls[`${rowPrefixCls.value}-range-hover`] =
          !isRangeStart && !isRangeEnd && isInRange(generateConfig, rangeStart, rangeEnd, currentDate);
      }

      if (hoverValue) {
        rangeCls[`${rowPrefixCls.value}-hover`] = hoverValue.some((date) =>
          isSameWeek(generateConfig, localeName.value, currentDate, date),
        );
      }

      return clsx(
        rowPrefixCls.value,
        {
          [`${rowPrefixCls.value}-selected`]:
            !hoverRangeValue && isSameWeek(generateConfig, localeName.value, value, currentDate),
        },
        // Patch for hover range
        rangeCls,
      );
    };

    // ============================== Render ==============================
    return () => <DatePanel {...props} mode="week" panelName="week" rowClassName={rowClassName} />;
  },
  { inheritAttrs: false },
);

export default WeekPanel;
