import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { warning } from '@vc-com/util/lib/warning';
import type { ReactiveComputedReturn } from '@vueuse/core';
import { computed } from 'vue';
import type { KeyboardEvent } from 'vue-jsx-vapor';
import type { DateType, SelectorProps } from '../../../interface';
import { formatValue } from '../../../utils/dateUtil';
import type { InputProps } from '../Input';

export default function useInputProps(
  props: ReactiveComputedReturn<
    Pick<
      SelectorProps,
      | 'maskFormat'
      | 'format'
      | 'generateConfig'
      | 'locale'
      | 'preserveInvalidOnBlur'
      | 'inputReadOnly'
      | 'required'
      | 'aria-required'
      | 'onSubmit'
      | 'onFocus'
      | 'onBlur'
      | 'onInputChange'
      | 'onInvalid'
      | 'onOpenChange'
      | 'onKeydown'
      | 'activeHelp'
      | 'name'
      | 'autocomplete'
      | 'open'
      | 'picker'
    > & {
      id?: string | string[];
      value?: DateType[];
      invalid?: boolean | [boolean, boolean];
      placeholder?: string | [string, string];
      disabled?: boolean | [boolean, boolean];
      onChange: (value: DateType | null, index?: number) => void;

      // RangePicker only
      allHelp: boolean;
      activeIndex?: number | null;
    }
  >,
  /** Used for SinglePicker */
  postProps?: (info: { valueTexts: string[] }) => Partial<InputProps>,
) {
  const {
    format,
    maskFormat,
    generateConfig,
    locale,
    preserveInvalidOnBlur,
    inputReadOnly,
    required,
    'aria-required': ariaRequired,
    onSubmit,
    onFocus,
    onBlur,
    onInputChange,
    onInvalid,
    open,
    onOpenChange,
    onKeydown,
    onChange,
    activeHelp,
    name,
    autocomplete,

    id,
    value,
    invalid,
    placeholder,
    disabled,
    activeIndex,
    allHelp,

    picker,
  } = $(props);

  // ======================== Parser ========================
  const parseDate = (str: string, formatStr: string) => {
    const parsed = generateConfig.locale.parse(locale.locale, str, [formatStr]);
    return parsed && generateConfig.isValidate(parsed) ? parsed : null;
  };

  // ========================= Text =========================
  const firstFormat = computed(() => format[0]);

  const getText = (date: DateType) => formatValue(date, { locale, format: firstFormat.value, generateConfig });

  const valueTexts = computed(() => value.map(getText));

  // ========================= Size =========================
  const size = computed(() => {
    const defaultSize = picker === 'time' ? 8 : 10;
    const length =
      typeof firstFormat.value === 'function' ? firstFormat.value(generateConfig.getNow()).length : firstFormat.value.length;
    return Math.max(defaultSize, length) + 2;
  });

  // ======================= Validate =======================
  const validateFormat = (text: string) => {
    for (let i = 0; i < format.length; i += 1) {
      const singleFormat = format[i];

      // Only support string type
      if (typeof singleFormat === 'string') {
        const parsed = parseDate(text, singleFormat);

        if (parsed) {
          return parsed;
        }
      }
    }

    return false;
  };

  // ======================== Input =========================
  const getInputProps = (index?: number): InputProps => {
    function getProp<T>(propValue: T | T[]): T {
      return index !== undefined ? propValue[index] : (propValue as T);
    }

    const pickedAttrs = pickAttrs(props, { aria: true, data: true });

    const inputProps = {
      ...pickedAttrs,

      // ============== Shared ==============
      format: maskFormat,
      validateFormat: (text: string) => !!validateFormat(text),
      preserveInvalidOnBlur,

      readonly: inputReadOnly,

      required,
      'aria-required': ariaRequired,

      name,

      autocomplete,

      size: size.value,

      // ============= By Index =============
      id: getProp(id),

      value: getProp(valueTexts.value) || '',

      invalid: getProp(invalid),

      placeholder: getProp(placeholder),

      active: activeIndex === index,

      helped: allHelp || (activeHelp && activeIndex === index),

      disabled: getProp(disabled),

      onFocus: (event) => {
        onFocus(event, index);
      },
      onBlur: (event) => {
        // Blur do not trigger close
        // Since it may focus to the popup panel
        onBlur(event, index);
      },

      onSubmit,

      // Get validate text value
      onChange: (text: string) => {
        onInputChange();

        const parsed = validateFormat(text);

        if (parsed) {
          onInvalid(false, index);
          onChange(parsed, index);
          return;
        }

        // Tell outer that the value typed is invalid.
        // If text is empty, it means valid.
        onInvalid(!!text, index);
      },
      onHelp: () => {
        onOpenChange(true, { index });
      },
      onKeydown: (event: KeyboardEvent<HTMLDivElement>) => {
        let prevented = false;

        onKeydown?.(event, () => {
          if (process.env.NODE_ENV !== 'production') {
            warning(false, '`preventDefault` callback is deprecated. Please call `event.preventDefault` directly.');
          }
          prevented = true;
        });

        if (!event.defaultPrevented && !prevented) {
          switch (event.key) {
            case 'Escape':
              onOpenChange(false, { index });
              break;
            case 'Enter':
              if (!open) {
                onOpenChange(true);
              }
              break;
          }
        }
      },

      // ============ Post Props ============
      ...postProps?.({ valueTexts: valueTexts.value }),
    };

    // ============== Clean Up ==============
    Object.keys(inputProps).forEach((key) => {
      if (inputProps[key] === undefined) {
        delete inputProps[key];
      }
    });

    return inputProps;
  };

  return [getInputProps, getText] as const;
}
