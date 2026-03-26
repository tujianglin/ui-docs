import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import omit from '@vc-com/util/lib/omit';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, ref, watch } from 'vue';
import { useRef, type FocusEvent, type FocusEventHandler, type MouseEventHandler } from 'vue-jsx-vapor';
import type { RenderNode } from '../../../util/src/types';
import useSemantic from '../hooks/useSemantic';
import useToggleDates from '../hooks/useToggleDates';
import type {
  BaseInfo,
  DateType,
  InternalMode,
  PanelMode,
  SelectorProps,
  SharedHTMLAttrs,
  SharedPickerProps,
  SharedTimeProps,
  ValueDate,
} from '../interface';
import PickerTrigger from '../PickerTrigger';
import { pickTriggerProps } from '../PickerTrigger/util';
import { toArray } from '../utils/miscUtil';
import { usePickerContextProvider } from './context';
import useCellRender from './hooks/useCellRender';
import useFieldsInvalidate from './hooks/useFieldsInvalidate';
import useFilledProps from './hooks/useFilledProps';
import useOpen from './hooks/useOpen';
import useRangeActive from './hooks/useRangeActive';
import useRangePickerValue from './hooks/useRangePickerValue';
import useRangeValue, { useInnerValue } from './hooks/useRangeValue';
import useShowNow from './hooks/useShowNow';
import Popup from './Popup';
import SingleSelector from './Selector/SingleSelector';

// TODO: isInvalidateDate with showTime.disabledTime should not provide `range` prop

export interface BasePickerProps extends SharedPickerProps {
  // Structure
  id?: string;

  /** Not support `time` or `datetime` picker */
  multiple?: boolean;
  removeIcon?: RenderNode;
  /** Only work when `multiple` is in used */
  maxTagCount?: number | 'responsive';

  // Value
  value?: DateType | DateType[] | null;
  defaultValue?: DateType | DateType[];
  onChange?: (date: DateType | DateType[], dateString: string | string[]) => void;
  onCalendarChange?: (date: DateType | DateType[], dateString: string | string[], info: BaseInfo) => void;
  /**  */
  onOk?: (value?: DateType | DateType[]) => void;

  // Placeholder
  placeholder?: string;

  // Picker Value
  /**
   * Config the popup panel date.
   * Every time active the input to open popup will reset with `defaultPickerValue`.
   *
   * Note: `defaultPickerValue` priority is higher than `value` for the first open.
   */
  defaultPickerValue?: DateType | null;
  /**
   * Config each start & end field popup panel date.
   * When config `pickerValue`, you must also provide `onPickerValueChange` to handle changes.
   */
  pickerValue?: DateType | null;
  /**
   * Each popup panel `pickerValue` change will trigger the callback.
   * @param date The changed picker value
   * @param info.source `panel` from the panel click. `reset` from popup open or field typing.
   */
  onPickerValueChange?: (
    date: DateType,
    info: {
      source: 'reset' | 'panel';
      mode: PanelMode;
    },
  ) => void;

  // Preset
  presets?: ValueDate[];

  // Control
  disabled?: boolean;

  // Mode
  mode?: PanelMode;
  onPanelChange?: (values: DateType, modes: PanelMode) => void;
}

export interface PickerProps extends BasePickerProps, Omit<SharedTimeProps, 'format' | 'defaultValue' | 'defaultOpenValue'> {}

/** Internal usage. For cross function get same aligned props */
export type ReplacedPickerProps = {
  onChange?: (date: DateType | DateType[], dateString: string | string[]) => void;
  onCalendarChange?: (date: DateType | DateType[], dateString: string | string[], info: BaseInfo) => void;
};

const Picker = defineComponent(
  (props: PickerProps) => {
    // ========================= Prop =========================
    // @ts-ignore
    const [filledProps, internalPicker, complexPicker, formatList, maskFormat, isInvalidateDate] = useFilledProps(props);

    const {
      // Style
      prefixCls,
      rootClassName,
      styles: propStyles,
      classNames: propClassNames,

      previewValue,

      // Value
      order,
      defaultValue,
      value,
      needConfirm,
      onChange,
      onKeydown,

      // Disabled
      disabled,
      disabledDate,
      minDate,
      maxDate,

      // Open
      defaultOpen,
      open,
      onOpenChange,

      // Picker
      locale,
      generateConfig,
      picker,
      showNow,
      showTime,

      // Mode
      mode,
      onPanelChange,
      onCalendarChange,
      onOk,
      multiple,

      // Picker Value
      defaultPickerValue,
      pickerValue,
      onPickerValueChange,

      // Format
      inputReadOnly,

      suffixIcon,
      removeIcon,

      // Focus
      onFocus,
      onBlur,

      // Presets
      presets,

      // Render
      components,
      cellRender,

      // Native
      onClick,
    } = $(filledProps as Omit<typeof filledProps, keyof ReplacedPickerProps> & ReplacedPickerProps);

    // ========================= Refs =========================
    const selectorRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return selectorRef.value?.nativeElement;
      },
      focus: (options) => {
        selectorRef.value?.focus(options);
      },
      blur: () => {
        selectorRef.value?.blur();
      },
    });

    // ========================= Util =========================
    function pickerParam<T>(values: T | T[]) {
      if (values === null) {
        return null;
      }

      return multiple ? values : values[0];
    }

    const toggleDates = useToggleDates(
      computed(() => generateConfig),
      computed(() => locale),
      internalPicker,
    );

    // ======================= Semantic =======================
    const [mergedClassNames, mergedStyles] = useSemantic(
      computed(() => propClassNames),
      computed(() => propStyles),
    );

    // ========================= Open =========================
    const [mergedOpen, triggerOpen] = useOpen(
      computed(() => open),
      defaultOpen,
      computed(() => [disabled]),
      onOpenChange,
    );

    // ======================= Calendar =======================
    const onInternalCalendarChange = (dates: DateType[], dateStrings: string[], info: BaseInfo) => {
      if (onCalendarChange) {
        const filteredInfo = {
          ...info,
        };
        delete filteredInfo.range;
        onCalendarChange(pickerParam(dates), pickerParam(dateStrings), filteredInfo);
      }
    };

    const onInternalOk = (dates: DateType[]) => {
      onOk?.(pickerParam(dates));
    };

    // ======================== Values ========================
    const [mergedValue, setInnerValue, getCalendarValue, triggerCalendarChange, triggerOk] = useInnerValue(
      computed(() => generateConfig),
      computed(() => locale),
      formatList,
      computed(() => false),
      computed(() => order),
      defaultValue,
      computed(() => value),
      onInternalCalendarChange,
      onInternalOk,
    );

    const calendarValue = computed(() => getCalendarValue());

    // ======================== Active ========================
    // In SinglePicker, we will always get `activeIndex` is 0.
    const [focused, triggerFocus, lastOperation, activeIndex] = useRangeActive(computed(() => [disabled]));

    const onSharedFocus = (event: FocusEvent<HTMLElement>) => {
      triggerFocus(true);

      onFocus?.(event, {});
    };

    const onSharedBlur = (event: FocusEvent<HTMLElement>) => {
      triggerFocus(false);

      onBlur?.(event, {});
    };

    // ========================= Mode =========================
    const [mergedMode, setMode] = useControlledState(
      picker,
      computed(() => mode),
    );

    /** Extends from `mergedMode` to patch `datetime` mode */
    const internalMode = computed<InternalMode>(() => (mergedMode.value === 'date' && showTime ? 'datetime' : mergedMode.value));

    // ======================= Show Now =======================
    const mergedShowNow = useShowNow(
      computed(() => picker),
      mergedMode,
      computed(() => showNow),
    );

    // ======================== Value =========================
    const onInternalChange = computed<PickerProps['onChange']>(
      () =>
        onChange &&
        ((dates, dateStrings) => {
          onChange(pickerParam(dates), pickerParam(dateStrings));
        }),
    );

    const [
      ,
      /** Trigger `onChange` directly without check `disabledDate` */
      triggerSubmitChange,
    ] = useRangeValue(
      reactiveComputed(() => ({
        ...filledProps,
        onChange: onInternalChange.value,
      })),
      mergedValue,
      setInnerValue,
      getCalendarValue,
      triggerCalendarChange,
      computed(() => []), //disabled,
      formatList,
      focused,
      mergedOpen,
      isInvalidateDate,
    );

    // ======================= Validate =======================
    const [submitInvalidates, onSelectorInvalid] = useFieldsInvalidate(calendarValue, isInvalidateDate);

    const submitInvalidate = computed(() => submitInvalidates.value.some((invalidated) => invalidated));

    // ===================== Picker Value =====================
    // Proxy to single pickerValue
    const onInternalPickerValueChange = (
      dates: DateType[],
      info: BaseInfo & { source: 'reset' | 'panel'; mode: [PanelMode, PanelMode] },
    ) => {
      if (onPickerValueChange) {
        const cleanInfo = { ...info, mode: info.mode[0] };
        delete cleanInfo.range;
        onPickerValueChange(dates[0], cleanInfo);
      }
    };

    const [currentPickerValue, setCurrentPickerValue] = useRangePickerValue(
      computed(() => generateConfig),
      computed(() => locale),
      calendarValue,
      computed(() => [mergedMode.value]),
      mergedOpen,
      activeIndex,
      internalPicker,
      computed(() => false), // multiplePanel,
      defaultPickerValue,
      computed(() => pickerValue),
      computed(() => toArray(showTime?.defaultOpenValue)),
      onInternalPickerValueChange,
      computed(() => minDate),
      computed(() => maxDate),
    );

    // >>> Mode need wait for `pickerValue`
    const triggerModeChange = (nextPickerValue: DateType, nextMode: PanelMode, triggerEvent?: boolean) => {
      setMode(nextMode);

      // Compatible with `onPanelChange`
      if (onPanelChange && triggerEvent !== false) {
        const lastPickerValue: DateType = nextPickerValue || calendarValue.value[calendarValue.value.length - 1];
        onPanelChange(lastPickerValue, nextMode);
      }
    };

    // ======================== Submit ========================
    /**
     * Different with RangePicker, confirm should check `multiple` logic.
     * This will never provide `date` instead.
     */
    const triggerConfirm = () => {
      triggerSubmitChange(getCalendarValue());

      triggerOpen(false, { force: true });
    };

    // ======================== Click =========================
    const onSelectorClick: MouseEventHandler<HTMLDivElement> = (event) => {
      if (!disabled && !selectorRef.value.nativeElement.contains(document.activeElement)) {
        // Click to focus the enabled input
        selectorRef.value.focus();
      }

      triggerOpen(true);

      onClick?.(event);
    };

    const onSelectorClear = () => {
      triggerSubmitChange(null);
      triggerOpen(false, { force: true });
    };

    // ======================== Hover =========================
    const hoverSource = ref<'cell' | 'preset'>(null);
    const internalHoverValue = ref<DateType>(null);

    const hoverValues = computed(() => {
      const values = [internalHoverValue.value, ...calendarValue.value].filter((date) => date);

      return multiple ? values : values.slice(0, 1);
    });

    // Selector values is different with RangePicker
    // which can not use `hoverValue` directly
    const selectorValues = computed(() => {
      if (!multiple && internalHoverValue.value) {
        return [internalHoverValue.value];
      }

      return calendarValue.value.filter((date) => date);
    });

    // Clean up `internalHoverValues` when closed
    watch(
      mergedOpen,
      () => {
        if (!mergedOpen.value) {
          internalHoverValue.value = null;
        }
      },
      { immediate: true },
    );

    const onSetHover = (date: DateType | null, source: 'cell' | 'preset') => {
      if (previewValue !== 'hover') {
        return;
      }
      internalHoverValue.value = date;
      hoverSource.value = source;
    };

    // ========================================================
    // ==                       Panels                       ==
    // ========================================================

    const onPresetHover = (nextValue: DateType | null) => {
      onSetHover(nextValue, 'preset');
    };

    // TODO: handle this
    const onPresetSubmit = (nextValue: DateType) => {
      const nextCalendarValues = multiple ? toggleDates(getCalendarValue(), nextValue) : [nextValue];
      const passed = triggerSubmitChange(nextCalendarValues);

      if (passed && !multiple) {
        triggerOpen(false, { force: true });
      }
    };

    const onNow = (now: DateType) => {
      onPresetSubmit(now);
    };

    // ======================== Panel =========================
    const onPanelHover = (date: DateType | null) => {
      onSetHover(date, 'cell');
    };

    // >>> Focus
    const onPanelFocus: FocusEventHandler<HTMLElement> = (event) => {
      triggerOpen(true);
      onSharedFocus(event);
    };

    // >>> Calendar
    const onPanelSelect = (date: DateType) => {
      lastOperation('panel');

      // Not change values if multiple and value panel is to match with picker
      if (multiple && internalMode.value !== picker) {
        return;
      }

      const nextValues = multiple ? toggleDates(getCalendarValue(), date) : [date];

      // Only trigger calendar event but not update internal `calendarValue` state
      triggerCalendarChange(nextValues);

      // >>> Trigger next active if !needConfirm
      // Fully logic check `useRangeValue` hook
      if (!needConfirm && !complexPicker.value && internalPicker.value === internalMode.value) {
        triggerConfirm();
      }
    };

    // >>> Close
    const onPopupClose = () => {
      // Close popup
      triggerOpen(false);
    };

    // >>> cellRender
    const onInternalCellRender = useCellRender(computed(() => cellRender));

    // >>> invalid

    const panelProps = computed(() => {
      const domProps = pickAttrs(filledProps, false);
      const restProps = omit(filledProps, [
        ...(Object.keys(domProps) as (keyof SharedHTMLAttrs)[]),
        'onChange',
        'onCalendarChange',
        'onPickerValueChange',
        'onOk',
        'style',
        'class',
        'onPanelChange',
        'classNames',
        'styles',
      ]);
      return {
        ...restProps,
        multiple: filledProps.multiple,
      };
    });

    // ========================================================
    // ==                      Selector                      ==
    // ========================================================

    // ======================== Change ========================
    const onSelectorChange = (date: DateType[]) => {
      triggerCalendarChange(date);
    };

    const onSelectorInputChange = () => {
      lastOperation('input');
    };

    // ======================= Selector =======================
    const onSelectorFocus: SelectorProps['onFocus'] = (event) => {
      lastOperation('input');

      triggerOpen(true, {
        inherit: true,
      });

      // setActiveIndex(index);

      onSharedFocus(event);
    };

    const onSelectorBlur: SelectorProps['onBlur'] = (event) => {
      triggerOpen(false);

      onSharedBlur(event);
    };

    const onSelectorKeyDown: SelectorProps['onKeydown'] = (event, preventDefault) => {
      if (event.key === 'Tab') {
        triggerConfirm();
      }

      onKeydown?.(event, preventDefault);
    };

    // ======================= Context ========================
    const context = reactiveComputed(() => ({
      prefixCls,
      locale,
      generateConfig,
      button: components.button,
      input: components.input,
      classNames: mergedClassNames.value,
      styles: mergedStyles.value,
    }));

    // ======================== Effect ========================
    // >>> Mode
    // Reset for every active
    watch(
      [mergedOpen, activeIndex, () => picker],
      async () => {
        await nextTick();
        if (mergedOpen.value && activeIndex.value !== undefined) {
          // Legacy compatible. This effect update should not trigger `onPanelChange`
          triggerModeChange(null, picker, false);
        }
      },
      { immediate: true, flush: 'post' },
    );

    // >>> For complex picker, we need check if need to focus next one
    watch(
      mergedOpen,
      async () => {
        await nextTick();
        const lastOp = lastOperation();
        // Trade as confirm on field leave
        if (!mergedOpen.value && lastOp === 'input') {
          triggerOpen(false);
          triggerConfirm();
        }

        // Submit with complex picker
        if (!mergedOpen.value && complexPicker.value && !needConfirm && lastOp === 'panel') {
          triggerConfirm();
        }
      },
      { immediate: true, flush: 'post' },
    );
    usePickerContextProvider(context);

    return () => {
      // >>> Render
      const panel = (
        <Popup
          // MISC
          {...panelProps.value}
          showNow={mergedShowNow.value}
          showTime={showTime}
          // Disabled
          disabledDate={disabledDate}
          // Focus
          onFocus={onPanelFocus}
          onBlur={onSharedBlur}
          // Mode
          picker={picker}
          mode={mergedMode.value}
          internalMode={internalMode.value}
          onPanelChange={triggerModeChange}
          // Value
          format={maskFormat.value}
          value={calendarValue.value}
          isInvalid={isInvalidateDate as any}
          onChange={null}
          onSelect={onPanelSelect}
          // PickerValue
          pickerValue={currentPickerValue.value}
          defaultOpenValue={showTime?.defaultOpenValue}
          onPickerValueChange={setCurrentPickerValue}
          // Hover
          hoverValue={hoverValues.value}
          onHover={onPanelHover}
          // Submit
          needConfirm={needConfirm}
          onSubmit={triggerConfirm}
          onOk={triggerOk}
          // Preset
          presets={presets}
          onPresetHover={onPresetHover}
          onPresetSubmit={onPresetSubmit}
          onNow={onNow}
          // Render
          cellRender={onInternalCellRender.value}
          // Styles
          classNames={mergedClassNames.value}
          styles={mergedStyles.value}
        />
      );
      // ======================== Render ========================
      return (
        <PickerTrigger
          {...pickTriggerProps(filledProps)}
          popupElement={panel}
          popupStyle={mergedStyles.value.popup.root}
          popupClassName={clsx(rootClassName, mergedClassNames.value.popup.root)}
          // Visible
          visible={mergedOpen.value}
          onClose={onPopupClose}
        >
          <SingleSelector
            // Shared
            {...omit(filledProps, ['onFocus', 'onBlur', 'onKeydown', 'onSubmit', 'onChange', 'onOpenChange', 'onClick'])}
            // Ref
            ref={selectorRef}
            // Style
            class={clsx(filledProps.class, rootClassName, mergedClassNames.value.root)}
            style={{ ...mergedStyles.value.root, ...filledProps.style }}
            // Icon
            suffixIcon={suffixIcon}
            removeIcon={removeIcon}
            // Active
            activeHelp={!!internalHoverValue.value}
            allHelp={!!internalHoverValue.value && hoverSource.value === 'preset'}
            focused={focused.value}
            onFocus={onSelectorFocus}
            onBlur={onSelectorBlur}
            onKeydown={onSelectorKeyDown}
            onSubmit={triggerConfirm}
            // Change
            value={selectorValues.value}
            maskFormat={maskFormat.value}
            onChange={onSelectorChange}
            onInputChange={onSelectorInputChange}
            internalPicker={internalPicker.value}
            // Format
            format={formatList.value}
            inputReadOnly={inputReadOnly}
            // Disabled
            disabled={disabled}
            // Open
            open={mergedOpen.value}
            onOpenChange={triggerOpen}
            // Click
            onClick={onSelectorClick}
            onClear={onSelectorClear}
            // Invalid
            invalid={submitInvalidate.value}
            onInvalid={(invalid) => {
              // Only `single` mode support type date.
              // `multiple` mode can not typing.
              onSelectorInvalid(invalid, 0);
            }}
          />
        </PickerTrigger>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'RefPicker' : undefined },
);

export default Picker;
