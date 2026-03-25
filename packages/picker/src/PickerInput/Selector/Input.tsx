import raf from '@vc-com/util/lib/raf';
import type { RenderNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, ref, watch, watchEffect } from 'vue';
import {
  useFullProps,
  useRef,
  type ChangeEventHandler,
  type ClipboardEventHandler,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
} from 'vue-jsx-vapor';
import type { PickerRef } from '../../interface';
import { leftPad } from '../../utils/miscUtil';
import { usePickerContextInject } from '../context';
import useLockEffect from '../hooks/useLockEffect';
import Icon from './Icon';
import MaskFormat from './MaskFormat';
import { getMaskRange } from './util';

// Format logic
//
// First time on focus:
//  1. check if the text is valid, if not fill with format
//  2. set highlight cell to the first cell
// Cells
//  1. Selection the index cell, set inner `cacheValue` to ''
//  2. Key input filter non-number char, patch after the `cacheValue`
//    1. Replace the `cacheValue` with input align the cell length
//    2. Re-selection the mask cell
//  3. If `cacheValue` match the limit length or cell format (like 1 ~ 12 month), go to next cell

export interface InputRef extends PickerRef {
  inputElement: HTMLInputElement;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  format?: string;
  validateFormat: (value: string) => boolean;
  active?: boolean;
  /** Used for single picker only */
  showActiveCls?: boolean;
  suffixIcon?: RenderNode;
  value?: string;
  onChange: (value: string) => void;
  onSubmit: VoidFunction;
  /** Meaning value is from the hover cell getting the placeholder text */
  helped?: boolean;
  /**
   * Trigger when input need additional help.
   * Like open the popup for interactive.
   */
  onHelp: () => void;
  preserveInvalidOnBlur?: boolean;
  invalid?: boolean;

  clearIcon?: RenderNode;
}

const Input = defineComponent(
  ({
    class: className,
    active,
    showActiveCls = true,
    suffixIcon,
    format,
    validateFormat,
    onChange,
    onInput: _onInput,
    helped,
    onHelp,
    onSubmit,
    onKeydown,
    preserveInvalidOnBlur = false,
    invalid,
    clearIcon,
    // Pass to input
    ...restProps
  }: InputProps) => {
    const props = useFullProps() as InputProps;
    const { value, onFocus, onBlur, onMouseup } = $(props);

    // @ts-ignore
    const { prefixCls, input: Component = 'input', classNames, styles } = $(usePickerContextInject());
    const inputPrefixCls = computed(() => `${prefixCls}-input`);

    // ======================== Value =========================
    const focused = ref(false);
    const internalInputValue = ref<string>(value);
    const focusCellText = ref<string>('');
    const focusCellIndex = ref<number>(null);
    const forceSelectionSyncMark = ref<object>(null);

    const inputValue = computed(() => internalInputValue.value || '');

    // Sync value if needed
    watchEffect(() => {
      internalInputValue.value = value;
    });

    // ========================= Refs =========================
    const holderRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // When mousedown get focus, defer selection to mouseUp so click position is used
    const mouseDownRef = useRef(false);

    defineExpose({
      get nativeElement() {
        return holderRef.value;
      },
      get inputElement() {
        return inputRef.value;
      },
      focus: (options) => {
        inputRef.value.focus(options);
      },
      blur: () => {
        inputRef.value.blur();
      },
    });

    // ======================== Format ========================
    const maskFormat = computed(() => new MaskFormat(format || ''));

    const { selectionStart, selectionEnd } = $(
      reactiveComputed(() => {
        if (helped) {
          return { selectionStart: 0, selectionEnd: 0 };
        }

        return maskFormat?.value?.getSelection(focusCellIndex.value);
      }),
    );

    // ======================== Modify ========================
    // When input modify content, trigger `onHelp` if is not the format
    const onModify = (text: string) => {
      if (text && text !== format && text !== value) {
        onHelp();
      }
    };

    // ======================== Change ========================
    /**
     * Triggered by paste, keyDown and focus to show format
     */
    const triggerInputChange = (text: string) => {
      if (validateFormat(text)) {
        onChange(text);
      }
      internalInputValue.value = text;
      onModify(text);
    };

    // Directly trigger `onChange` if `format` is empty
    const onInternalChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      // Hack `onChange` with format to do nothing
      if (!format) {
        const text = event.target.value;

        onModify(text);
        internalInputValue.value = text;
        onChange(text);
      }
    };

    const onFormatPaste: ClipboardEventHandler<HTMLInputElement> = (event) => {
      // Block paste until selection is set (after mouseUp when focus was by mousedown)
      if (mouseDownRef.value) {
        event.preventDefault();
        return;
      }

      // Get paste text
      const pasteText = event.clipboardData.getData('text');

      if (validateFormat(pasteText)) {
        triggerInputChange(pasteText);
      }
    };

    // ======================== Mouse =========================
    // When `mouseDown` get focus, it's better to not to change the selection
    // Since the up position maybe not is the first cell
    const onFormatMouseDown: MouseEventHandler<HTMLInputElement> = () => {
      mouseDownRef.value = true;
    };

    const onFormatMouseUp: MouseEventHandler<HTMLInputElement> = (event) => {
      const { selectionStart: start } = event.target as HTMLInputElement;

      const closeMaskIndex = maskFormat.value.getMaskCellIndex(start);
      focusCellIndex.value = closeMaskIndex;

      // Force update the selection
      forceSelectionSyncMark.value = {};

      onMouseup?.(event);

      mouseDownRef.value = false;
    };

    // ====================== Focus Blur ======================
    const onFormatFocus: FocusEventHandler<HTMLInputElement> = (event) => {
      focused.value = true;
      focusCellIndex.value = 0;
      focusCellText.value = '';

      onFocus(event);
    };

    const onSharedBlur: FocusEventHandler<HTMLInputElement> = (event) => {
      onBlur(event);
    };

    const onFormatBlur: FocusEventHandler<HTMLInputElement> = (event) => {
      focused.value = false;

      onSharedBlur(event);
    };

    // ======================== Active ========================
    // Check if blur need reset input value
    useLockEffect(
      computed(() => active),
      () => {
        if (!active && !preserveInvalidOnBlur) {
          internalInputValue.value = value;
        }
      },
    );

    // ======================= Keyboard =======================
    const onSharedKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
      if (event.key === 'Enter' && validateFormat(inputValue.value)) {
        onSubmit();
      }

      onKeydown?.(event);
    };

    const onFormatKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
      // Block key input until selection is set (after mouseUp when focus was by mousedown)
      if (mouseDownRef.value) {
        event.preventDefault();
        return;
      }

      onSharedKeyDown(event);

      const { key } = event;

      // Save the cache with cell text
      let nextCellText: string = null;

      // Fill in the input
      let nextFillText: string = null;

      const maskCellLen = selectionEnd - selectionStart;
      const cellFormat = format.slice(selectionStart, selectionEnd);

      // Cell Index
      const offsetCellIndex = (offset: number) => {
        let nextIndex = focusCellIndex.value + offset;
        nextIndex = Math.max(nextIndex, 0);
        nextIndex = Math.min(nextIndex, maskFormat?.value?.size() - 1);
        focusCellIndex.value = nextIndex;
      };

      // Range
      const offsetCellValue = (offset: number) => {
        const [rangeStart, rangeEnd, rangeDefault] = getMaskRange(cellFormat);

        const currentText = inputValue.value.slice(selectionStart, selectionEnd);
        const currentTextNum = Number(currentText);

        if (isNaN(currentTextNum)) {
          return String(rangeDefault ? rangeDefault : offset > 0 ? rangeStart : rangeEnd);
        }

        const num = currentTextNum + offset;
        const range = rangeEnd - rangeStart + 1;
        return String(rangeStart + ((range + num - rangeStart) % range));
      };

      switch (key) {
        // =============== Remove ===============
        case 'Backspace':
        case 'Delete':
          nextCellText = '';
          nextFillText = cellFormat;
          break;

        // =============== Arrows ===============
        // Left key
        case 'ArrowLeft':
          nextCellText = '';
          offsetCellIndex(-1);
          break;

        // Right key
        case 'ArrowRight':
          nextCellText = '';
          offsetCellIndex(1);
          break;

        // Up key
        case 'ArrowUp':
          nextCellText = '';
          nextFillText = offsetCellValue(1);
          break;

        // Down key
        case 'ArrowDown':
          nextCellText = '';
          nextFillText = offsetCellValue(-1);
          break;

        // =============== Number ===============
        default:
          if (!isNaN(Number(key))) {
            nextCellText = focusCellText + key;
            nextFillText = nextCellText;
          }
          break;
      }

      // Update cell text
      if (nextCellText !== null) {
        focusCellText.value = nextCellText;

        if (nextCellText.length >= maskCellLen) {
          // Go to next cell
          offsetCellIndex(1);
          focusCellText.value = '';
        }
      }

      // Update the input text
      if (nextFillText !== null) {
        // Replace selection range with `nextCellText`
        const nextFocusValue =
          // before
          inputValue.value.slice(0, selectionStart) +
          // replace
          leftPad(nextFillText, maskCellLen) +
          // after
          inputValue.value.slice(selectionEnd);
        triggerInputChange(nextFocusValue.slice(0, format.length));
      }

      // Always trigger selection sync after key down
      forceSelectionSyncMark.value = {};
    };

    // ======================== Format ========================
    const rafRef = useRef<number>();

    watch(
      [
        maskFormat,
        () => format,
        focused,
        inputValue,
        focusCellIndex,
        () => selectionStart,
        () => selectionEnd,
        forceSelectionSyncMark,
      ],
      async (_n, _o, onCleanup) => {
        await nextTick();
        if (!focused.value || !format || mouseDownRef.value) {
          return;
        }

        // Reset with format if not match
        if (!maskFormat.value.match(inputValue.value)) {
          triggerInputChange(format);
          return;
        }

        // Match the selection range
        inputRef.value.setSelectionRange(selectionStart, selectionEnd);

        // Chrome has the bug anchor position looks not correct but actually correct
        rafRef.value = raf(() => {
          inputRef.value.setSelectionRange(selectionStart, selectionEnd);
        });

        onCleanup(() => {
          raf.cancel(rafRef.value);
        });
      },
      { immediate: true, deep: true, flush: 'post' },
    );

    // ======================== Render ========================
    return () => {
      // Input props for format
      const inputProps: InputHTMLAttributes<HTMLInputElement> = format
        ? {
            onFocus: onFormatFocus,
            onBlur: onFormatBlur,
            onKeydown: onFormatKeyDown,
            onMousedown: onFormatMouseDown,
            onMouseup: onFormatMouseUp,
            onPaste: onFormatPaste,
          }
        : {};

      return (
        <div
          ref={holderRef}
          class={clsx(
            inputPrefixCls.value,
            {
              [`${inputPrefixCls.value}-active`]: active && showActiveCls,
              [`${inputPrefixCls.value}-placeholder`]: helped,
            },
            className,
          )}
        >
          <Component
            ref={inputRef}
            aria-invalid={invalid}
            autocomplete="off"
            {...restProps}
            onKeydown={onSharedKeyDown}
            onBlur={onSharedBlur}
            // Replace with format
            {...inputProps}
            // Value
            value={inputValue.value}
            onInput={onInternalChange}
            class={classNames.input}
            style={styles.input}
          />
          <Icon type="suffix" icon={suffixIcon} />
          {clearIcon}
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Input' : undefined },
);

export default Input;
