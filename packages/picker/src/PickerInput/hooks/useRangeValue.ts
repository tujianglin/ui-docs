import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import type { ReactiveComputedReturn } from '@vueuse/core';
import { computed, type Ref, watch } from 'vue';
import type { GenerateConfig } from '../../generate';
import useSyncState from '../../hooks/useSyncState';
import type { BaseInfo, DateType, FormatType, Locale, ReplaceListType } from '../../interface';
import { formatValue, isSame, isSameTimestamp } from '../../utils/dateUtil';
import { fillIndex } from '../../utils/miscUtil';
import type { RangePickerProps } from '../RangePicker';
import type { ReplacedPickerProps } from '../SinglePicker';
import useLockEffect from './useLockEffect';

const EMPTY_VALUE: any[] = [];

// Submit Logic:
// * ✅ Value:
//    * merged value using controlled value, if not, use stateValue
//    * When merged value change, [1] resync calendar value and submit value
// * ✅ Calender Value:
//    * 💻 When user typing is validate, change the calendar value
//    * 🌅 When user click on the panel, change the calendar value
// * Submit Value:
//    * 💻 When user blur the input, flush calendar value to submit value
//    * 🌅 When user click on the panel is no needConfirm, flush calendar value to submit value
//    * 🌅 When user click on the panel is needConfirm and click OK, flush calendar value to submit value
// * Blur logic & close logic:
//    * ✅ For value, always try flush submit
//    * ✅ If `needConfirm`, reset as [1]
//    * Else (`!needConfirm`)
//      * If has another index field, active another index
// * ✅ Flush submit:
//    * If all the start & end field is confirmed or all blur or panel closed
//    * Update `needSubmit` mark to true
//    * trigger onChange by `needSubmit` and update stateValue

type TriggerCalendarChange = (calendarValues: DateType[]) => void;

function useUtil(generateConfig: Ref<GenerateConfig>, locale: Ref<Locale>, formatList: Ref<FormatType[]>) {
  const getDateTexts = (dates: DateType[]) => {
    return dates.map((date) =>
      formatValue(date, { generateConfig: generateConfig.value, locale: locale.value, format: formatList.value?.[0] }),
    ) as any as ReplaceListType<Required<DateType[]>, string>;
  };

  const isSameDates = (source: DateType[], target: DateType[]) => {
    const maxLen = Math.max(source.length, target.length);
    let diffIndex = -1;

    for (let i = 0; i < maxLen; i += 1) {
      const prev = source[i] || null;
      const next = target[i] || null;

      if (prev !== next && !isSameTimestamp(generateConfig.value, prev, next)) {
        diffIndex = i;
        break;
      }
    }

    return [diffIndex < 0, diffIndex !== 0];
  };

  return [getDateTexts, isSameDates] as const;
}

function orderDates(dates: DateType[], generateConfig: GenerateConfig) {
  return [...dates].sort((a, b) => (generateConfig.isAfter(a, b) ? 1 : -1)) as DateType[];
}

/**
 * Used for internal value management.
 * It should always use `mergedValue` in render logic
 */
function useCalendarValue(mergedValue: Ref<DateType[]>) {
  const [calendarValue, setCalendarValue] = useSyncState(mergedValue);

  /** Sync calendarValue & submitValue back with value */
  const syncWithValue = () => {
    setCalendarValue(mergedValue.value);
  };

  watch(
    mergedValue,
    () => {
      syncWithValue();
    },
    { immediate: true, deep: true },
  );

  return [calendarValue, setCalendarValue] as const;
}

/**
 * Control the internal `value` align with prop `value` and provide a temp `calendarValue` for ui.
 * `calendarValue` will be reset when blur & focus & open.
 */
export function useInnerValue(
  generateConfig: Ref<GenerateConfig>,
  locale: Ref<Locale>,
  formatList: Ref<FormatType[]>,
  /** Used for RangePicker. `true` means [DateType, DateType] or will be DateType[] */
  rangeValue: Ref<boolean>,
  /**
   * Trigger order when trigger calendar value change.
   * This should only used in SinglePicker with `multiple` mode.
   * So when `rangeValue` is `true`, order will be ignored.
   */
  order: Ref<boolean>,
  defaultValue?: DateType[],
  value?: Ref<DateType[]>,
  onCalendarChange?: (dates: DateType[], dateStrings: ReplaceListType<Required<DateType[]>, string>, info: BaseInfo) => void,
  onOk?: (dates: DateType[]) => void,
) {
  // This is the root value which will sync with controlled or uncontrolled value
  const [innerValue, setInnerValue] = useControlledState(defaultValue, value);
  const mergedValue = computed(() => innerValue.value || (EMPTY_VALUE as DateType[]));

  // ========================= Inner Values =========================
  const [calendarValue, setCalendarValue] = useCalendarValue(mergedValue);

  // ============================ Change ============================
  const [getDateTexts, isSameDates] = useUtil(generateConfig, locale, formatList);

  const triggerCalendarChange: TriggerCalendarChange = (nextCalendarValues) => {
    let clone = [...nextCalendarValues];

    if (rangeValue.value) {
      for (let i = 0; i < 2; i += 1) {
        clone[i] = clone[i] || null;
      }
    } else if (order.value) {
      clone = orderDates(
        clone.filter((date) => date),
        generateConfig.value,
      );
    }

    // Update merged value
    const [isSameMergedDates, isSameStart] = isSameDates(calendarValue(), clone);
    if (!isSameMergedDates) {
      setCalendarValue(clone);

      // Trigger calendar change event
      if (onCalendarChange) {
        const cellTexts = getDateTexts(clone);
        onCalendarChange(clone, cellTexts, { range: isSameStart ? 'end' : 'start' });
      }
    }
  };

  const triggerOk = () => {
    if (onOk) {
      onOk(calendarValue());
    }
  };

  return [mergedValue, setInnerValue, calendarValue, triggerCalendarChange, triggerOk] as const;
}

export default function useRangeValue(
  info: ReactiveComputedReturn<
    Pick<RangePickerProps, 'generateConfig' | 'locale' | 'allowEmpty' | 'order' | 'picker'> & ReplacedPickerProps
  >,
  mergedValue: Ref<DateType[]>,
  setInnerValue: (nextValue: DateType[]) => void,
  getCalendarValue: () => DateType[],
  triggerCalendarChange: TriggerCalendarChange,
  disabled: Ref<ReplaceListType<Required<DateType[]>, boolean>>,
  formatList: Ref<FormatType[]>,
  focused: Ref<boolean>,
  open: Ref<boolean>,
  isInvalidateDate: (date: DateType, info?: { from?: DateType; activeIndex: number }) => boolean,
): [
  /** Trigger `onChange` by check `disabledDate` */
  flushSubmit: (index: number, needTriggerChange: boolean) => void,
  /** Trigger `onChange` directly without check `disabledDate` */
  triggerSubmitChange: (value: DateType[]) => boolean,
] {
  const {
    // MISC
    generateConfig,
    locale,

    picker,

    onChange,

    // Checker
    allowEmpty,
    order,
  } = $(info) as Pick<RangePickerProps, 'generateConfig' | 'locale' | 'allowEmpty' | 'order' | 'picker'> & ReplacedPickerProps;

  const orderOnChange = computed(() => (disabled.value.some((d) => d) ? false : order));

  // ============================= Util =============================
  const [getDateTexts, isSameDates] = useUtil(
    computed(() => generateConfig),
    computed(() => locale),
    formatList,
  );

  // ============================ Values ============================
  // Used for trigger `onChange` event.
  // Record current value which is wait for submit.
  const [submitValue, setSubmitValue] = useSyncState(mergedValue);

  /** Sync calendarValue & submitValue back with value */
  const syncWithValue = () => {
    setSubmitValue(mergedValue.value);
  };

  watch(
    mergedValue,
    () => {
      syncWithValue();
    },
    { immediate: true, deep: true },
  );

  // ============================ Submit ============================
  const triggerSubmit = (nextValue?: DateType[]) => {
    const isNullValue = nextValue === null;

    let clone = [...(nextValue || submitValue())] as DateType[];

    // Fill null value
    if (isNullValue) {
      const maxLen = Math.max(disabled.value.length, clone.length);

      for (let i = 0; i < maxLen; i += 1) {
        if (!disabled.value[i]) {
          clone[i] = null;
        }
      }
    }

    // Only when exist value to sort
    if (orderOnChange.value && clone[0] && clone[1]) {
      clone = orderDates(clone, generateConfig);
    }

    // Sync `calendarValue`
    triggerCalendarChange(clone);

    // ========= Validate check =========
    const [start, end] = clone;

    // >>> Empty
    const startEmpty = !start;
    const endEmpty = !end;

    const validateEmptyDateRange = allowEmpty
      ? // Validate empty start
        (!startEmpty || allowEmpty[0]) &&
        // Validate empty end
        (!endEmpty || allowEmpty[1])
      : true;

    // >>> Order
    const validateOrder =
      !order ||
      startEmpty ||
      endEmpty ||
      isSame(generateConfig, locale, start, end, picker) ||
      generateConfig.isAfter(end, start);

    // >>> Invalid
    const validateDates =
      // Validate start
      (disabled.value[0] || !start || !isInvalidateDate(start, { activeIndex: 0 })) &&
      // Validate end
      (disabled.value[1] || !end || !isInvalidateDate(end, { from: start, activeIndex: 1 }));
    // >>> Result
    const allPassed =
      // Null value is from clear button
      isNullValue ||
      // Normal check
      (validateEmptyDateRange && validateOrder && validateDates);

    if (allPassed) {
      // Sync value with submit value
      setInnerValue(clone);

      const [isSameMergedDates] = isSameDates(clone, mergedValue.value);

      // Trigger `onChange` if needed
      if (onChange && !isSameMergedDates) {
        const everyEmpty = clone.every((val) => !val);
        onChange(
          // Return null directly if all date are empty
          isNullValue && everyEmpty ? null : clone,
          everyEmpty ? null : getDateTexts(clone),
        );
      }
    }

    return allPassed;
  };

  // ========================= Flush Submit =========================
  const flushSubmit = (index: number, needTriggerChange: boolean) => {
    const nextSubmitValue = fillIndex(submitValue(), index, getCalendarValue()[index]);
    setSubmitValue(nextSubmitValue);

    if (needTriggerChange) {
      triggerSubmit();
    }
  };

  // ============================ Effect ============================
  // All finished action trigger after 2 frames
  const interactiveFinished = computed(() => !focused.value && !open.value);

  useLockEffect(
    computed(() => !interactiveFinished.value),
    () => {
      if (interactiveFinished.value) {
        // Always try to trigger submit first
        triggerSubmit();

        // Trigger calendar change since this is a effect reset
        // https://github.com/ant-design/ant-design/issues/22351
        triggerCalendarChange(mergedValue.value);

        // Sync with value anyway
        syncWithValue();
      }
    },
    2,
  );

  // ============================ Return ============================
  return [flushSubmit, triggerSubmit];
}
