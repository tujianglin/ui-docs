import { computed, type Ref } from 'vue';
import type { GenerateConfig } from '../../generate';
import type { DateType, DisabledDate, Locale } from '../../interface';
import { isSame } from '../../utils/dateUtil';
import { getFromDate } from '../../utils/miscUtil';

/**
 * RangePicker need additional logic to handle the `disabled` case. e.g.
 * [disabled, enabled] should end date not before start date
 */
export default function useRangeDisabledDate(
  values: Ref<DateType[]>,
  disabled: Ref<[boolean, boolean]>,
  activeIndexList: Ref<number[]>,
  generateConfig: Ref<GenerateConfig>,
  locale: Ref<Locale>,
  disabledDate?: DisabledDate,
) {
  const activeIndex = computed(() => activeIndexList.value[activeIndexList.value?.length - 1]);

  const rangeDisabledDate: DisabledDate = (date, info) => {
    const [start, end] = values.value;

    const mergedInfo = {
      ...info,
      from: getFromDate(values.value, activeIndexList.value),
    };

    // ============================ Disabled ============================
    // Should not select days before the start date
    if (
      activeIndex.value === 1 &&
      disabled.value[0] &&
      start &&
      // Same date isOK
      !isSame(generateConfig.value, locale.value, start, date, mergedInfo.type) &&
      // Before start date
      generateConfig.value.isAfter(start, date)
    ) {
      return true;
    }

    // Should not select days after the end date
    if (
      activeIndex.value === 0 &&
      disabled.value[1] &&
      end &&
      // Same date isOK
      !isSame(generateConfig.value, locale.value, end, date, mergedInfo.type) &&
      // After end date
      generateConfig.value.isAfter(date, end)
    ) {
      return true;
    }

    // ============================= Origin =============================
    return disabledDate?.(date, mergedInfo);
  };

  return rangeDisabledDate;
}
