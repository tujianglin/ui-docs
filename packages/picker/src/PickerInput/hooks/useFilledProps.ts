import { reactiveComputed, type ReactiveComputedReturn } from '@vueuse/core';
import { computed, ref, type ComputedRef, type Ref } from 'vue';
import useLocale from '../../hooks/useLocale';
import { fillShowTimeConfig, getTimeProps } from '../../hooks/useTimeConfig';
import type { DateType, FormatType, InternalMode, PickerMode } from '../../interface';
import { toArray } from '../../utils/miscUtil';
import type { RangePickerProps } from '../RangePicker';
import { fillClearIcon } from '../Selector/hooks/useClearIcon';
import useDisabledBoundary from './useDisabledBoundary';
import { useFieldFormat } from './useFieldFormat';
import useInputReadOnly from './useInputReadOnly';
import useInvalidate from './useInvalidate';

type UseInvalidate = typeof useInvalidate;

type PickedProps = Pick<
  RangePickerProps,
  | 'generateConfig'
  | 'locale'
  | 'picker'
  | 'prefixCls'
  | 'styles'
  | 'classNames'
  | 'order'
  | 'components'
  | 'allowClear'
  | 'needConfirm'
  | 'format'
  | 'inputReadOnly'
  | 'disabledDate'
  | 'minDate'
  | 'maxDate'
  | 'defaultOpenValue'
  | 'previewValue'
> & {
  multiple?: boolean;
  // RangePicker showTime definition is different with Picker
  showTime?: any;
  value?: any;
  defaultValue?: any;
  pickerValue?: any;
  defaultPickerValue?: any;
};

type ExcludeBooleanType<T> = T extends boolean ? never : T;

type ToArrayType<T> = T extends any[] ? T : DateType[];

function useList<T>(value: Ref<T | T[]>, fillMode: Ref<boolean> = ref(false)) {
  return computed(() => {
    const list = value.value ? toArray(value.value) : value.value;

    if (fillMode?.value && list) {
      list[1] = list[1] || list[0];
    }

    return list;
  });
}

/**
 * Align the outer props with unique typed and fill undefined props.
 * This is shared with both RangePicker and Picker. This will do:
 * - Convert `value` & `defaultValue` to array
 * - handle the legacy props fill like `clearIcon` + `allowClear` = `clearIcon`
 */
export default function useFilledProps<InProps extends PickedProps, UpdaterProps extends object>(
  props: ReactiveComputedReturn<InProps>,
  updater?: () => UpdaterProps,
): [
  filledProps: ReactiveComputedReturn<
    Omit<InProps, keyof UpdaterProps | 'showTime' | 'value' | 'defaultValue'> &
      UpdaterProps & {
        picker: PickerMode;
        showTime?: ExcludeBooleanType<InProps['showTime']>;
        value?: ToArrayType<InProps['value']>;
        defaultValue?: ToArrayType<InProps['value']>;
        pickerValue?: ToArrayType<InProps['value']>;
        defaultPickerValue?: ToArrayType<InProps['value']>;
      }
  >,
  internalPicker: ComputedRef<InternalMode>,
  complexPicker: ComputedRef<boolean>,
  formatList: Ref<FormatType[]>,
  maskFormat: Ref<string>,
  isInvalidateDate: ReturnType<UseInvalidate>,
] {
  const {
    generateConfig,
    locale,
    picker = 'date',
    prefixCls = 'rc-picker',
    previewValue = 'hover',
    styles = {},
    classNames = {},
    order = true,
    components = {},
    allowClear,
    needConfirm,
    multiple,
    format,
    inputReadOnly,
    disabledDate,
    minDate,
    maxDate,
    showTime,

    value,
    defaultValue,
    pickerValue,
    defaultPickerValue,
  } = $(props) as InProps;

  const values = useList(computed(() => value));
  const defaultValues = useList(computed(() => defaultValue));
  const pickerValues = useList(computed(() => pickerValue));
  const defaultPickerValues = useList(computed(() => defaultPickerValue));

  // ======================== Picker ========================
  /** Almost same as `picker`, but add `datetime` for `date` with `showTime` */
  const internalPicker = computed(() => (picker === 'date' && showTime ? 'datetime' : picker) as InternalMode);

  /** The picker is `datetime` or `time` */
  const multipleInteractivePicker = computed(() => internalPicker.value === 'time' || internalPicker.value === 'datetime');
  const complexPicker = computed(() => multipleInteractivePicker.value || multiple);
  const mergedNeedConfirm = computed(() => needConfirm ?? multipleInteractivePicker.value);

  // ========================== Time ==========================
  // Auto `format` need to check `showTime.showXXX` first.
  // And then merge the `locale` into `mergedShowTime`.
  const { timeProps, localeTimeProps, showTimeFormat, propFormat } = $(reactiveComputed(() => getTimeProps(props)));

  // ======================= Locales ========================
  const mergedLocale = useLocale(
    computed(() => locale as any),
    reactiveComputed(() => localeTimeProps),
  );

  const mergedShowTime = computed(() =>
    fillShowTimeConfig(internalPicker.value, showTimeFormat, propFormat, timeProps, mergedLocale.value),
  );

  // ======================== Props =========================
  const filledProps = computed(() => ({
    ...props,
    previewValue,
    prefixCls,
    locale: mergedLocale.value,
    picker,
    styles,
    classNames,
    order,
    components: { ...components },
    // @ts-ignore
    clearIcon: fillClearIcon(prefixCls, allowClear),
    showTime: mergedShowTime.value,
    value: values.value,
    defaultValue: defaultValues.value,
    pickerValue: pickerValues.value,
    defaultPickerValue: defaultPickerValues.value,
    ...updater?.(),
  }));

  // ======================== Format ========================
  const [formatList, maskFormat] = useFieldFormat(
    internalPicker,
    mergedLocale,
    computed(() => format),
  );

  // ======================= ReadOnly =======================
  const mergedInputReadOnly = useInputReadOnly(
    formatList,
    computed(() => inputReadOnly),
    computed(() => multiple),
  );

  // ======================= Boundary =======================
  const disabledBoundaryDate = useDisabledBoundary(
    computed(() => generateConfig),
    computed(() => locale),
    computed(() => disabledDate),
    computed(() => minDate),
    computed(() => maxDate),
  );

  // ====================== Invalidate ======================
  const isInvalidateDate = useInvalidate(
    computed(() => generateConfig),
    computed(() => picker),
    disabledBoundaryDate,
    mergedShowTime,
  );

  // ======================== Merged ========================
  const mergedProps = reactiveComputed(
    () =>
      ({
        ...filledProps.value,
        needConfirm: mergedNeedConfirm.value,
        inputReadOnly: mergedInputReadOnly.value,
        disabledDate: disabledBoundaryDate,
      }) as any,
  );

  return [mergedProps, internalPicker, complexPicker, formatList, maskFormat, isInvalidateDate];
}
