import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { warning } from '@vc-com/util/lib/warning';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, watch, type CSSProperties } from 'vue';
import { useFullProps, useRef, type HTMLAttributes } from 'vue-jsx-vapor';
import useLocale from '../hooks/useLocale';
import { fillShowTimeConfig, getTimeProps } from '../hooks/useTimeConfig';
import useToggleDates from '../hooks/useToggleDates';
import type {
  CellRender,
  Components,
  DateType,
  InternalMode,
  OnPanelChange,
  PanelMode,
  PanelSemanticName,
  PickerMode,
  SharedPanelProps,
  SharedTimeProps,
} from '../interface';
import { usePickerContextInject } from '../PickerInput/context';
import useCellRender from '../PickerInput/hooks/useCellRender';
import { isSame } from '../utils/dateUtil';
import { pickProps, toArray } from '../utils/miscUtil';
import { PickerHackContextProvider, usePickerHackContextInject, useSharedPanelContextProvider } from './context';
import DatePanel from './DatePanel';
import DateTimePanel from './DateTimePanel';
import DecadePanel from './DecadePanel';
import MonthPanel from './MonthPanel';
import QuarterPanel from './QuarterPanel';
import TimePanel from './TimePanel';
import WeekPanel from './WeekPanel';
import YearPanel from './YearPanel';

const DefaultComponents: Components = {
  date: DatePanel,
  datetime: DateTimePanel,
  week: WeekPanel,
  month: MonthPanel,
  quarter: QuarterPanel,
  year: YearPanel,
  decade: DecadePanel,
  time: TimePanel,
};

export interface PickerPanelRef {
  nativeElement: HTMLDivElement;
}

export interface BasePickerPanelProps
  extends
    Pick<
      SharedPanelProps,
      // MISC
      | 'locale'
      | 'generateConfig'

      // Disabled
      | 'disabledDate'
      | 'minDate'
      | 'maxDate'

      // Icon
      | 'prevIcon'
      | 'nextIcon'
      | 'superPrevIcon'
      | 'superNextIcon'
    >,
    SharedTimeProps,
    Pick<HTMLAttributes<HTMLDivElement>, 'tabindex'> {
  // Style
  prefixCls?: string;

  direction?: 'ltr' | 'rtl';

  // Value
  onSelect?: (date: DateType) => void;

  // Panel control
  defaultPickerValue?: DateType | null;
  pickerValue?: DateType | null;
  onPickerValueChange?: (date: DateType) => void;

  // Mode
  mode?: PanelMode;
  /**
   * Compatible with origin API.
   * Not mean the PickerPanel `onChange` event.
   */
  onPanelChange?: OnPanelChange;
  picker?: PickerMode;

  // Time
  showTime?: true | SharedTimeProps;

  // Week
  /**
   * Only worked in `date` mode. Show the value week
   */
  showWeek?: boolean;

  // Cell
  cellRender?: CellRender;

  // Hover
  /** @private Used for Picker passing */
  hoverValue?: DateType[];
  /** @private Used for Picker passing */
  hoverRangeValue?: [start: DateType, end: DateType];
  /** @private Used for Picker passing */
  onHover?: (date: DateType) => void;

  // Components
  components?: Components;

  /** @private This is internal usage. Do not use in your production env */
  hideHeader?: boolean;
}

export interface SinglePickerPanelProps<DateType extends object = any> extends BasePickerPanelProps {
  multiple?: false;

  defaultValue?: DateType | null;
  value?: DateType | null;
  onChange?: (date: DateType) => void;
}

export type PickerPanelProps<DateType extends object = any> = BasePickerPanelProps & {
  /** multiple selection. Not support time or datetime picker */
  multiple?: boolean;

  defaultValue?: DateType | DateType[] | null;
  value?: DateType | DateType[] | null;
  onChange?: (date: DateType | DateType[]) => void;
  styles?: Partial<Record<PanelSemanticName, CSSProperties>>;
  classNames?: Partial<Record<PanelSemanticName, string>>;
};

const PickerPanel = defineComponent(
  ({
    classNames: panelClassNames,
    styles: panelStyles,

    locale,
    generateConfig,

    direction,

    // Style
    prefixCls,
    tabindex = 0,

    // Value
    multiple,
    defaultValue,
    value,
    onChange,
    onSelect,

    // Picker control
    defaultPickerValue,
    pickerValue,
    onPickerValueChange,

    // Mode
    mode,
    onPanelChange,
    picker = 'date',
    showTime,

    // Hover
    hoverValue,
    hoverRangeValue,

    // Cell
    cellRender,

    // Components
    components = {},

    hideHeader,
  }: PickerPanelProps) => {
    const props = useFullProps() as PickerPanelProps;
    // ======================== Context ========================
    const { prefixCls: contextPrefixCls, classNames: pickerClassNames, styles: pickerStyles } = $(usePickerContextInject());

    // ======================== prefixCls ========================
    const mergedPrefixCls = computed(() => contextPrefixCls || prefixCls || 'rc-picker');

    // ========================== Refs ==========================
    const rootRef = useRef<HTMLDivElement>();

    defineExpose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    // ========================== Time ==========================
    // Auto `format` need to check `showTime.showXXX` first.
    // And then merge the `locale` into `mergedShowTime`.
    const { timeProps, localeTimeProps, showTimeFormat, propFormat } = $(reactiveComputed(() => getTimeProps(props)));

    // ========================= Locale =========================
    const filledLocale = useLocale(
      computed(() => locale),
      localeTimeProps,
    );

    // ========================= Picker =========================
    const internalPicker = computed<InternalMode>(() => (picker === 'date' && showTime ? 'datetime' : picker));

    // ======================== ShowTime ========================
    const mergedShowTime = computed(() =>
      fillShowTimeConfig(internalPicker.value, showTimeFormat, propFormat, timeProps, filledLocale.value),
    );

    // ========================== Now ===========================
    const now = computed(() => generateConfig.getNow());

    // ========================== Mode ==========================
    const [mergedMode, setMergedMode] = useControlledState<PanelMode>(
      picker || 'date',
      computed(() => mode),
    );

    const internalMode = computed<InternalMode>(() =>
      mergedMode.value === 'date' && mergedShowTime.value ? 'datetime' : mergedMode.value,
    );

    // ========================= Toggle =========================
    const toggleDates = useToggleDates(
      computed(() => generateConfig),
      computed(() => locale),
      internalPicker,
    );

    // ========================= Value ==========================
    // >>> Real value
    // Interactive with `onChange` event which only trigger when the `mode` is `picker`
    const [innerValue, setMergedValue] = useControlledState(
      defaultValue,
      computed(() => value),
    );

    const mergedValue = computed(() => {
      // Clean up `[null]`
      const values = toArray(innerValue.value).filter((val) => val);
      return multiple ? values : values.slice(0, 1);
    });

    // Sync value and only trigger onChange event when changed
    const triggerChange = (nextValue: DateType[] | null) => {
      setMergedValue(nextValue);

      if (
        onChange &&
        (nextValue === null ||
          mergedValue.value.length !== nextValue.length ||
          mergedValue.value.some((ori, index) => !isSame(generateConfig, locale, ori, nextValue[index], internalPicker.value)))
      ) {
        onChange?.(multiple ? nextValue : nextValue[0]);
      }
    };

    // >>> CalendarValue
    // CalendarValue is a temp value for user operation
    // which will only trigger `onCalendarChange` but not `onChange`
    const onInternalSelect = (newDate: DateType) => {
      onSelect?.(newDate);

      if (mergedMode.value === picker) {
        const nextValues = multiple ? toggleDates(mergedValue.value, newDate) : [newDate];

        triggerChange(nextValues);
      }
    };

    // >>> PickerValue
    // PickerValue is used to control the value displaying panel
    const [mergedPickerValue, setInternalPickerValue] = useControlledState(
      defaultPickerValue || mergedValue.value[0] || now.value,
      computed(() => pickerValue),
    );
    watch(
      () => mergedValue.value[0],
      () => {
        if (mergedValue.value[0] && !pickerValue) {
          setInternalPickerValue(mergedValue.value[0]);
        }
      },
      { immediate: true, deep: true },
    );

    // Both trigger when manually pickerValue or mode change
    const triggerPanelChange = (viewDate?: DateType, nextMode?: PanelMode) => {
      onPanelChange?.(viewDate || pickerValue, nextMode || mergedMode.value);
    };

    const setPickerValue = (nextPickerValue: DateType, triggerPanelEvent = false) => {
      setInternalPickerValue(nextPickerValue);
      onPickerValueChange?.(nextPickerValue);

      if (triggerPanelEvent) {
        triggerPanelChange(nextPickerValue);
      }
    };

    const triggerModeChange = (nextMode: PanelMode, viewDate?: DateType) => {
      setMergedMode(nextMode);

      if (viewDate) {
        setPickerValue(viewDate);
      }

      triggerPanelChange(viewDate, nextMode);
    };

    const onPanelValueSelect = (nextValue: DateType) => {
      onInternalSelect(nextValue);
      setPickerValue(nextValue);

      // Update mode if needed
      if (mergedMode.value !== picker) {
        const decadeYearQueue: PanelMode[] = ['decade', 'year'];
        const decadeYearMonthQueue: PanelMode[] = [...decadeYearQueue, 'month'];

        const pickerQueue: Partial<Record<PickerMode, PanelMode[]>> = {
          quarter: [...decadeYearQueue, 'quarter'],
          week: [...decadeYearMonthQueue, 'week'],
          date: [...decadeYearMonthQueue, 'date'],
        };

        const queue = pickerQueue[picker] || decadeYearMonthQueue;
        const index = queue.indexOf(mergedMode.value);
        const nextMode = queue[index + 1];

        if (nextMode) {
          triggerModeChange(nextMode, nextValue);
        }
      }
    };

    // ======================= Hover Date =======================
    const hoverRangeDate = computed<[DateType, DateType] | null>(() => {
      let start: DateType;
      let end: DateType;

      if (Array.isArray(hoverRangeValue)) {
        [start, end] = hoverRangeValue;
      } else {
        start = hoverRangeValue;
      }

      // Return for not exist
      if (!start && !end) {
        return null;
      }

      // Fill if has empty
      start = start || end;
      end = end || start;

      return generateConfig.isAfter(start, end) ? [end, start] : [start, end];
    });

    // ======================= Components =======================
    // >>> cellRender
    const onInternalCellRender = useCellRender(computed(() => cellRender));

    // ======================= Components =======================
    const PanelComponent = computed(
      () => (components[internalMode.value] || DefaultComponents[internalMode.value] || DatePanel) as typeof DatePanel,
    );

    // ======================== Context =========================
    const sharedPanelContext = reactiveComputed(() => ({
      classNames: pickerClassNames?.popup ?? panelClassNames ?? {},
      styles: pickerStyles?.popup ?? panelStyles ?? {},
    }));

    const parentHackContext = usePickerHackContextInject();
    const pickerPanelContext = computed(() => ({
      ...parentHackContext,
      hideHeader,
    }));

    // ======================== Warnings ========================
    if (process.env.NODE_ENV !== 'production') {
      warning(
        !mergedValue.value || mergedValue.value.every((val) => generateConfig.isValidate(val)),
        'Invalidate date pass to `value` or `defaultValue`.',
      );
    }

    // ========================= Render =========================
    const panelCls = computed(() => `${mergedPrefixCls.value}-panel`);

    const panelProps = computed(() =>
      pickProps(props, [
        // Week
        'showWeek',

        // Icons
        'prevIcon',
        'nextIcon',
        'superPrevIcon',
        'superNextIcon',

        // Disabled
        'disabledDate',
        'minDate',
        'maxDate',

        // Hover
        'onHover',
      ]),
    );
    useSharedPanelContextProvider(sharedPanelContext);
    return () => (
      <PickerHackContextProvider value={pickerPanelContext.value}>
        <div ref={rootRef} tabindex={tabindex} class={clsx(panelCls.value, { [`${panelCls.value}-rtl`]: direction === 'rtl' })}>
          <PanelComponent.value
            {...panelProps.value}
            // Time
            showTime={mergedShowTime.value}
            // MISC
            prefixCls={mergedPrefixCls.value}
            locale={filledLocale.value}
            generateConfig={generateConfig}
            // Mode
            onModeChange={triggerModeChange}
            // Value
            pickerValue={mergedPickerValue.value}
            onPickerValueChange={(nextPickerValue) => {
              setPickerValue(nextPickerValue, true);
            }}
            value={mergedValue.value[0]}
            onSelect={onPanelValueSelect}
            values={mergedValue.value}
            // Render
            cellRender={onInternalCellRender.value}
            // Hover
            hoverRangeValue={hoverRangeDate.value}
            hoverValue={hoverValue}
          />
        </div>
      </PickerHackContextProvider>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'PanelPicker' : undefined },
);

// Make support generic
export default PickerPanel;
