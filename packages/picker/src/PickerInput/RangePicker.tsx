import { useControlledState } from '@vc-com/util';
import omit from '@vc-com/util/lib/omit';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { warning } from '@vc-com/util/lib/warning';
import { clsx } from 'clsx';
import useSemantic from '../hooks/useSemantic';
import type {
  BaseInfo,
  DateType,
  InternalMode,
  OnOpenChange,
  OpenConfig,
  PanelMode,
  RangeTimeProps,
  SelectorProps,
  SharedHTMLAttrs,
  SharedPickerProps,
  ValueDate,
} from '../interface';
import type { PickerPanelProps } from '../PickerPanel';
import PickerTrigger from '../PickerTrigger';
import { pickTriggerProps } from '../PickerTrigger/util';
import { fillIndex, getFromDate, toArray } from '../utils/miscUtil';
// import {usePickerContextProvider} from './context';
import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, nextTick, ref, watch } from 'vue';
import { useRef, type FocusEvent, type FocusEventHandler, type MouseEventHandler } from 'vue-jsx-vapor';
import type { RenderNode } from '../../../util/src/types';
import { usePickerContextProvider } from './context';
import useCellRender from './hooks/useCellRender';
import useFieldsInvalidate from './hooks/useFieldsInvalidate';
import useFilledProps from './hooks/useFilledProps';
import useOpen from './hooks/useOpen';
import useRangeActive from './hooks/useRangeActive';
import useRangeDisabledDate from './hooks/useRangeDisabledDate';
import useRangePickerValue from './hooks/useRangePickerValue';
import useRangeValue, { useInnerValue } from './hooks/useRangeValue';
import useShowNow from './hooks/useShowNow';
import Popup, { type PopupShowTimeConfig } from './Popup';
import RangeSelector, { type SelectorIdType } from './Selector/RangeSelector';

function separateConfig<T>(config: T | [T, T] | null | undefined, defaultConfig: T): [T, T] {
  const singleConfig = config ?? defaultConfig;

  if (Array.isArray(singleConfig)) {
    return singleConfig;
  }

  return [singleConfig, singleConfig];
}

export type RangeValueType = DateType[];

/** Used for change event, it should always be not undefined */
export type NoUndefinedRangeValueType = [start: DateType | null, end: DateType | null];

export interface BaseRangePickerProps extends Omit<SharedPickerProps, 'showTime' | 'id'> {
  // Structure
  id?: SelectorIdType;

  separator?: RenderNode;

  // Value
  value?: RangeValueType | null;
  defaultValue?: RangeValueType;
  onChange?: (dates: NoUndefinedRangeValueType | null, dateStrings: [string, string]) => void;
  onCalendarChange?: (dates: NoUndefinedRangeValueType, dateStrings: [string, string], info: BaseInfo) => void;
  onOk?: (values: NoUndefinedRangeValueType) => void;

  // Placeholder
  placeholder?: [string, string];

  // Picker Value
  /**
   * Config the popup panel date.
   * Every time active the input to open popup will reset with `defaultPickerValue`.
   *
   * Note: `defaultPickerValue` priority is higher than `value` for the first open.
   */
  defaultPickerValue?: [DateType, DateType] | DateType | null;
  /**
   * Config each start & end field popup panel date.
   * When config `pickerValue`, you must also provide `onPickerValueChange` to handle changes.
   */
  pickerValue?: [DateType, DateType] | DateType | null;
  /**
   * Each popup panel `pickerValue` includes `mode` change will trigger the callback.
   * @param date The changed picker value
   * @param info.source `panel` from the panel click. `reset` from popup open or field typing
   * @param info.mode Next `mode` panel
   */
  onPickerValueChange?: (
    date: [DateType, DateType],
    info: BaseInfo & {
      source: 'reset' | 'panel';
      mode: [PanelMode, PanelMode];
    },
  ) => void;

  // Preset
  presets?: ValueDate<Exclude<RangeValueType, null>>[];

  // Control
  disabled?: boolean | [boolean, boolean];
  allowEmpty?: boolean | [boolean, boolean];

  // Time
  showTime?: boolean | RangeTimeProps;

  // Mode
  mode?: [startMode: PanelMode, endMode: PanelMode];
  /** Trigger on each `mode` or `pickerValue` changed. */
  onPanelChange?: (values: DateType[], modes: [startMode: PanelMode, endMode: PanelMode]) => void;
}

export interface RangePickerProps
  extends BaseRangePickerProps, Omit<RangeTimeProps, 'format' | 'defaultValue' | 'defaultOpenValue'> {}

function getActiveRange(activeIndex: number) {
  return activeIndex === 1 ? 'end' : 'start';
}

const RefRangePicker = defineComponent(
  (props: RangePickerProps) => {
    // ========================= Prop =========================
    // @ts-ignore
    const [filledProps, internalPicker, complexPicker, formatList, maskFormat, isInvalidateDate] = useFilledProps(
      reactiveComputed(() => props),
      () => {
        const { disabled, allowEmpty } = props;

        const mergedDisabled = separateConfig(disabled, false);
        const mergedAllowEmpty = separateConfig(allowEmpty, false);

        return {
          disabled: mergedDisabled,
          allowEmpty: mergedAllowEmpty,
        };
      },
    );

    const {
      // Style
      prefixCls,
      rootClassName,
      styles: propStyles,
      classNames: propClassNames,

      previewValue,
      // Value
      defaultValue,
      value,
      needConfirm,
      onKeydown,

      // Disabled
      disabled,
      allowEmpty,
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

      // Picker Value
      defaultPickerValue,
      pickerValue,
      onPickerValueChange,

      // Format
      inputReadOnly,

      suffixIcon,

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
    } = $(filledProps);

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

    // ======================= Semantic =======================
    const [mergedClassNames, mergedStyles] = useSemantic(
      computed(() => propClassNames),
      computed(() => propStyles),
    );

    // ========================= Open =========================
    const [mergedOpen, setMergeOpen] = useOpen(
      computed(() => open),
      defaultOpen,
      computed(() => disabled),
      onOpenChange,
    );

    const triggerOpen: OnOpenChange = (nextOpen, config?: OpenConfig) => {
      // No need to open if all disabled
      if (disabled.some((fieldDisabled) => !fieldDisabled) || !nextOpen) {
        setMergeOpen(nextOpen, config);
      }
    };

    // ======================== Values ========================
    const [mergedValue, setInnerValue, getCalendarValue, triggerCalendarChange, triggerOk] = useInnerValue(
      computed(() => generateConfig),
      computed(() => locale),
      formatList,
      computed(() => true),
      computed(() => false),
      defaultValue,
      computed(() => value),
      onCalendarChange,
      onOk,
    );

    const calendarValue = computed(() => getCalendarValue());

    // ======================== Active ========================
    const [
      focused,
      triggerFocus,
      lastOperation,
      activeIndex,
      nextActiveIndex,
      activeIndexList,
      updateSubmitIndex,
      hasActiveSubmitValue,
    ] = useRangeActive(
      computed(() => disabled),
      computed(() => allowEmpty),
      mergedOpen,
    );

    const onSharedFocus = (event: FocusEvent<HTMLElement>, index?: number) => {
      triggerFocus(true);

      onFocus?.(event, {
        range: getActiveRange(index ?? activeIndex.value),
      });
    };

    const onSharedBlur = (event: FocusEvent<HTMLElement>, index?: number) => {
      triggerFocus(false);

      onBlur?.(event, {
        range: getActiveRange(index ?? activeIndex.value),
      });
    };

    // ======================= ShowTime =======================
    /** Used for Popup panel */
    const mergedShowTime = computed<PopupShowTimeConfig & Pick<RangeTimeProps, 'defaultOpenValue'>>(() => {
      if (!showTime) {
        return null;
      }

      const { disabledTime } = showTime;

      const proxyDisabledTime = disabledTime
        ? (date: DateType) => {
            const range = getActiveRange(activeIndex.value);
            const fromDate = getFromDate(calendarValue.value, activeIndexList.value, activeIndex.value);
            return disabledTime(date, range, {
              from: fromDate,
            });
          }
        : undefined;

      return { ...showTime, disabledTime: proxyDisabledTime };
    });

    // ========================= Mode =========================
    const [modes, setModes] = useControlledState<[PanelMode, PanelMode]>(
      [picker, picker],
      computed(() => mode),
    );

    const mergedMode = computed(() => modes.value[activeIndex.value] || picker);

    /** Extends from `mergedMode` to patch `datetime` mode */
    const internalMode = computed<InternalMode>(() =>
      mergedMode.value === 'date' && mergedShowTime.value ? 'datetime' : mergedMode.value,
    );

    // ====================== PanelCount ======================
    const multiplePanel = computed(() => internalMode.value === picker && internalMode.value !== 'time');

    // ======================= Show Now =======================
    const mergedShowNow = useShowNow(
      computed(() => picker),
      mergedMode,
      computed(() => showNow),
      computed(() => true),
    );

    // ======================== Value =========================
    const [
      /** Trigger `onChange` by check `disabledDate` */
      flushSubmit,
      /** Trigger `onChange` directly without check `disabledDate` */
      triggerSubmitChange,
    ] = useRangeValue(
      reactiveComputed(() => filledProps as any),
      mergedValue,
      setInnerValue,
      getCalendarValue,
      triggerCalendarChange,
      computed(() => disabled),
      formatList,
      focused,
      mergedOpen,
      isInvalidateDate,
    );

    // ===================== DisabledDate =====================
    const mergedDisabledDate = useRangeDisabledDate(
      calendarValue,
      computed(() => disabled),
      activeIndexList,
      computed(() => generateConfig),
      computed(() => locale),
      disabledDate,
    );

    // ======================= Validate =======================
    const [submitInvalidates, onSelectorInvalid] = useFieldsInvalidate(
      calendarValue,
      isInvalidateDate,
      computed(() => allowEmpty),
    );

    // ===================== Picker Value =====================
    const [currentPickerValue, setCurrentPickerValue] = useRangePickerValue(
      computed(() => generateConfig),
      computed(() => locale),
      calendarValue,
      modes,
      mergedOpen,
      activeIndex,
      internalPicker,
      multiplePanel,
      defaultPickerValue,
      computed(() => pickerValue),
      computed(() => mergedShowTime.value?.defaultOpenValue),
      onPickerValueChange,
      computed(() => minDate),
      computed(() => maxDate),
    );

    // >>> Mode need wait for `pickerValue`
    const triggerModeChange = (nextPickerValue: DateType, nextMode: PanelMode, triggerEvent?: boolean) => {
      const clone = fillIndex(modes.value, activeIndex.value, nextMode);

      if (clone[0] !== modes.value[0] || clone[1] !== modes.value[1]) {
        setModes(clone);
      }

      // Compatible with `onPanelChange`
      if (onPanelChange && triggerEvent !== false) {
        const clonePickerValue = [...calendarValue.value];
        if (nextPickerValue) {
          clonePickerValue[activeIndex.value] = nextPickerValue;
        }
        onPanelChange(clonePickerValue, clone);
      }
    };

    // ======================== Change ========================
    const fillCalendarValue = (date: DateType, index: number) =>
      // Trigger change only when date changed
      fillIndex(calendarValue.value, index, date);

    // ======================== Submit ========================
    /**
     * Trigger by confirm operation.
     * This function has already handle the `needConfirm` check logic.
     * - Selector: enter key
     * - Panel: OK button
     */
    const triggerPartConfirm = (date?: DateType, skipFocus?: boolean) => {
      let nextValue = calendarValue.value;

      if (date) {
        nextValue = fillCalendarValue(date, activeIndex.value);
      }
      updateSubmitIndex(activeIndex.value);
      // Get next focus index
      const nextIndex = nextActiveIndex(nextValue);

      // Change calendar value and tell flush it
      triggerCalendarChange(nextValue);
      flushSubmit(activeIndex.value, nextIndex === null);

      if (nextIndex === null) {
        triggerOpen(false, { force: true });
      } else if (!skipFocus) {
        selectorRef.value.focus({ index: nextIndex });
      }
    };

    // ======================== Click =========================
    const onSelectorClick: MouseEventHandler<HTMLDivElement> = (event) => {
      const rootNode = (event.target as HTMLElement).getRootNode();
      if (
        !selectorRef.value.nativeElement.contains((rootNode as Document | ShadowRoot).activeElement ?? document.activeElement)
      ) {
        // Click to focus the enabled input
        const enabledIndex = disabled.findIndex((d) => !d);
        if (enabledIndex >= 0) {
          selectorRef.value.focus({ index: enabledIndex });
        }
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
    const internalHoverValues = ref<RangeValueType>(null);

    const hoverValues = computed(() => {
      return internalHoverValues.value || calendarValue.value;
    });

    // Clean up `internalHoverValues` when closed
    watch(
      mergedOpen,
      () => {
        if (!mergedOpen.value) {
          internalHoverValues.value = null;
        }
      },
      { immediate: true },
    );

    // ========================================================
    // ==                       Panels                       ==
    // ========================================================
    // Save the offset with active bar position
    // const [activeOffset, setActiveOffset] = useState(0);
    const activeInfo = ref<[activeInputLeft: number, activeInputRight: number, selectorWidth: number]>([0, 0, 0]);

    const onSetHover = (date: RangeValueType | null, source: 'cell' | 'preset') => {
      if (previewValue !== 'hover') {
        return;
      }
      internalHoverValues.value = date;
      hoverSource.value = source;
    };

    const onPresetHover = (nextValues) => {
      onSetHover(nextValues, 'preset');
    };

    const onPresetSubmit = (nextValues) => {
      const passed = triggerSubmitChange(nextValues);

      if (passed) {
        lastOperation('preset-click');
        triggerOpen(false, { force: true });
      }
    };

    const onNow = (now: DateType) => {
      triggerPartConfirm(now);
    };

    // ======================== Panel =========================
    const onPanelHover = (date: DateType) => {
      onSetHover(date ? fillCalendarValue(date, activeIndex.value) : null, 'cell');
    };

    // >>> Focus
    const onPanelFocus: FocusEventHandler<HTMLElement> = (event) => {
      triggerOpen(true);
      onSharedFocus(event);
    };

    // >>> MouseDown
    const onPanelMouseDown: MouseEventHandler<HTMLDivElement> = () => {
      lastOperation('panel');
    };

    // >>> Calendar
    const onPanelSelect: PickerPanelProps['onChange'] = (date: DateType) => {
      const clone: RangeValueType = fillIndex(calendarValue.value, activeIndex.value, date);

      // Only trigger calendar event but not update internal `calendarValue` state
      triggerCalendarChange(clone);

      // >>> Trigger next active if !needConfirm
      // Fully logic check `useRangeValue` hook
      if (!needConfirm && !complexPicker.value && internalPicker.value === internalMode.value) {
        triggerPartConfirm(date);
      }
    };

    // >>> Close
    const onPopupClose = () => {
      // Close popup
      triggerOpen(false);
    };

    // >>> cellRender
    const onInternalCellRender = useCellRender(
      computed(() => cellRender),
      computed(() => getActiveRange(activeIndex.value)),
    );

    // >>> Value
    const panelValue = computed(() => calendarValue.value[activeIndex.value] || null);

    // >>> invalid
    const isPopupInvalidateDate = (date) => {
      return isInvalidateDate(date, {
        activeIndex: activeIndex.value,
      });
    };

    const panelProps = computed(() => {
      const domProps = pickAttrs(filledProps, false);
      const restProps = omit(filledProps, [
        ...(Object.keys(domProps) as (keyof SharedHTMLAttrs)[]),
        'onChange',
        'onCalendarChange',
        'style',
        'class',
        'onPanelChange',
        'disabledTime',
        'classNames',
        'styles',
      ]);
      return restProps;
    });

    // ========================================================
    // ==                      Selector                      ==
    // ========================================================

    // ======================== Change ========================
    const onSelectorChange = (date: DateType, index: number) => {
      const clone = fillCalendarValue(date, index);

      triggerCalendarChange(clone);
    };

    const onSelectorInputChange = () => {
      lastOperation('input');
    };

    // ======================= Selector =======================
    const onSelectorFocus: SelectorProps['onFocus'] = (event, index) => {
      // Check if `needConfirm` but user not submit yet
      const activeListLen = activeIndexList.value.length;
      const lastActiveIndex = activeIndexList.value[activeListLen - 1];
      if (
        activeListLen &&
        lastActiveIndex !== index &&
        needConfirm &&
        // Not change index if is not filled
        !allowEmpty[lastActiveIndex] &&
        !hasActiveSubmitValue(lastActiveIndex) &&
        calendarValue.value[lastActiveIndex]
      ) {
        selectorRef.value.focus({ index: lastActiveIndex });
        return;
      }

      lastOperation('input');

      triggerOpen(true, {
        inherit: true,
      });

      // When click input to switch the field, it will not trigger close.
      // Which means it will lose the part confirm and we need fill back.
      // ref: https://github.com/ant-design/ant-design/issues/49512
      if (activeIndex.value !== index && mergedOpen.value && !needConfirm && complexPicker.value) {
        triggerPartConfirm(null, true);
      }

      activeIndex.value = index;

      onSharedFocus(event, index);
    };

    const onSelectorBlur: SelectorProps['onBlur'] = (event, index) => {
      triggerOpen(false);
      if (!needConfirm && lastOperation() === 'input') {
        const nextIndex = nextActiveIndex(calendarValue.value);
        flushSubmit(activeIndex.value, nextIndex === null);
      }

      onSharedBlur(event, index);
    };

    const onSelectorKeyDown: SelectorProps['onKeydown'] = (event, preventDefault) => {
      if (event.key === 'Tab') {
        triggerPartConfirm(null, true);
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
          triggerPartConfirm(null, true);
        }

        // Submit with complex picker
        if (!mergedOpen.value && complexPicker.value && !needConfirm && lastOp === 'panel') {
          triggerOpen(true);
          triggerPartConfirm();
        }
      },
      { immediate: true, flush: 'post' },
    );

    // ====================== DevWarning ======================
    if (process.env.NODE_ENV !== 'production') {
      const isIndexEmpty = (index: number) => {
        return (
          // Value is empty
          !value?.[index] &&
          // DefaultValue is empty
          !defaultValue?.[index]
        );
      };

      if (disabled.some((fieldDisabled, index) => fieldDisabled && isIndexEmpty(index) && !allowEmpty[index])) {
        warning(false, '`disabled` should not set with empty `value`. You should set `allowEmpty` or `value` instead.');
      }
    }
    usePickerContextProvider(context);
    return () => {
      // >>> Render
      const panel = (
        <Popup
          // MISC
          {...(panelProps.value as any)}
          showNow={mergedShowNow.value}
          showTime={mergedShowTime.value}
          // Range
          range
          multiplePanel={multiplePanel.value}
          activeInfo={activeInfo.value}
          // Disabled
          disabledDate={mergedDisabledDate}
          // Focus
          onFocus={onPanelFocus}
          onBlur={onSharedBlur}
          onPanelMouseDown={onPanelMouseDown}
          // Mode
          picker={picker}
          mode={mergedMode.value}
          internalMode={internalMode.value}
          onPanelChange={triggerModeChange}
          // Value
          format={maskFormat.value}
          value={panelValue.value}
          isInvalid={isPopupInvalidateDate}
          onChange={null}
          onSelect={onPanelSelect}
          // PickerValue
          pickerValue={currentPickerValue.value}
          defaultOpenValue={toArray(showTime?.defaultOpenValue)[activeIndex.value]}
          onPickerValueChange={setCurrentPickerValue}
          // Hover
          hoverValue={hoverValues.value}
          onHover={onPanelHover}
          // Submit
          needConfirm={needConfirm}
          onSubmit={triggerPartConfirm}
          onOk={triggerOk}
          // Preset
          presets={presets}
          onPresetHover={onPresetHover}
          onPresetSubmit={onPresetSubmit}
          // Now
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
          // Range
          range
        >
          <RangeSelector
            // Shared
            {...filledProps}
            // Ref
            ref={selectorRef}
            // Style
            class={clsx(filledProps.class, rootClassName, mergedClassNames.value.root)}
            style={{ ...mergedStyles.value.root, ...filledProps.style }}
            // Icon
            suffixIcon={suffixIcon}
            // Active
            activeIndex={focused.value || mergedOpen.value ? activeIndex.value : null}
            activeHelp={!!internalHoverValues.value}
            allHelp={!!internalHoverValues.value && hoverSource.value === 'preset'}
            focused={focused.value}
            onFocus={onSelectorFocus}
            onBlur={onSelectorBlur}
            onKeydown={onSelectorKeyDown}
            onSubmit={triggerPartConfirm}
            // Change
            value={hoverValues.value}
            maskFormat={maskFormat.value}
            onChange={onSelectorChange}
            onInputChange={onSelectorInputChange}
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
            invalid={submitInvalidates.value}
            onInvalid={onSelectorInvalid}
            // Offset
            onActiveInfo={(e) => (activeInfo.value = e)}
          />
        </PickerTrigger>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'RefRangePicker' : undefined },
);

export default RefRangePicker;
