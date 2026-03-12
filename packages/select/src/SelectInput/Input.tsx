import { composeRef } from '@vc-com/util/lib/ref';
import { clsx } from 'clsx';
import { cloneVNode, computed, defineComponent, isVNode, ref, shallowRef, watch, type Ref } from 'vue';
import {
  useFullProps,
  useRef,
  type ChangeEventHandler,
  type ClipboardEventHandler,
  type CompositionEventHandler,
  type CSSProperties,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from 'vue-jsx-vapor';
import { useBaseSelectContextInject } from '../hooks/useBaseProps';
import { useSelectInputContextInject } from './context';

export interface InputProps {
  id?: string;
  readonly?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onKeydown?: KeyboardEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  class?: string;
  style?: CSSProperties;
  maxlength?: number;
  /** width always match content width */
  syncWidth?: boolean;
  /** autoComplete for input */
  autoComplete?: string;
}

const Input = defineComponent(
  ({ onChange, onKeydown, onBlur, style, syncWidth, value, class: className, autoComplete, ...restProps }: InputProps) => {
    const props = useFullProps() as InputProps;
    const {
      prefixCls,
      mode,
      onSearch,
      onSearchSubmit,
      onInputBlur,
      autofocus,
      tokenWithEnter,
      components,
      // @ts-ignore
      placeholder,
    } = $(useSelectInputContextInject());

    const InputComponent = computed(() => components.input || 'input');

    const { id, classNames, styles, open, activeDescendantId, role, disabled } = $(useBaseSelectContextInject());

    const inputCls = clsx(`${prefixCls}-input`, classNames?.input, className);

    // Used to handle input method composition status
    const compositionStatusRef = shallowRef<boolean>(false);

    // Used to handle paste content, similar to original Selector implementation
    const pastedTextRef = shallowRef<string | null>(null);

    // ============================== Refs ==============================
    const inputRef = useRef<HTMLInputElement>(null);

    defineExpose({
      get nativeElement() {
        return inputRef.value;
      },
    });

    // ============================== Data ==============================
    // Handle input changes
    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      let { value: nextVal } = event.target;

      // Handle pasted text with tokenWithEnter, similar to original Selector implementation
      if (tokenWithEnter && pastedTextRef.value && /[\r\n]/.test(pastedTextRef.value)) {
        // CRLF will be treated as a single space for input element
        const replacedText = pastedTextRef.value
          .replace(/[\r\n]+$/, '')
          .replace(/\r\n/g, ' ')
          .replace(/[\r\n]/g, ' ');
        nextVal = nextVal.replace(replacedText, pastedTextRef.value);
      }

      // Reset pasted text reference
      pastedTextRef.value = null;

      // Call onSearch callback
      if (onSearch) {
        onSearch(nextVal, true, compositionStatusRef.value);
      }

      // Call original onChange callback
      onChange?.(event);
    };

    // ============================ Keyboard ============================
    // Handle keyboard events
    const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
      const { key } = event;
      const { value: nextVal } = event.currentTarget;

      // Handle Enter key submission - referencing Selector implementation
      if (key === 'Enter' && mode === 'tags' && !compositionStatusRef.value && onSearchSubmit) {
        onSearchSubmit(nextVal);
      }

      // Call original onKeydown callback
      onKeydown?.(event);
    };

    // Handle blur events
    const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
      // Call onInputBlur callback
      onInputBlur?.();

      // Call original onBlur callback
      onBlur?.(event);
    };

    // Handle input method composition start
    const handleCompositionStart = () => {
      compositionStatusRef.value = true;
    };

    // Handle input method composition end
    const handleCompositionEnd: CompositionEventHandler<HTMLInputElement> = (event) => {
      compositionStatusRef.value = false;

      // Trigger search when input method composition ends, similar to original Selector
      if (mode !== 'combobox') {
        const { value: nextVal } = event.currentTarget;
        onSearch?.(nextVal, true, false);
      }
    };

    // Handle paste events to track pasted content
    const handlePaste: ClipboardEventHandler<HTMLInputElement> = (event) => {
      const { clipboardData } = event;
      const pastedValue = clipboardData?.getData('text');
      pastedTextRef.value = pastedValue || '';
    };

    // ============================= Width ==============================
    const widthCssVar = ref<number | undefined>(undefined);

    // When syncWidth is enabled, adjust input width based on content
    watch(
      [() => syncWidth, () => value],
      () => {
        const input = inputRef.value;

        if (syncWidth && input) {
          input.style.width = '0px';
          const scrollWidth = input.scrollWidth;
          widthCssVar.value = scrollWidth;

          // Reset input style
          input.style.width = '';
        }
      },
      { flush: 'post' },
    );

    // ============================= Render =============================
    // Extract shared input props
    const sharedInputProps = computed(() => ({
      id,
      type: mode === 'combobox' ? 'text' : 'search',
      ...restProps,
      ref: inputRef as Ref<HTMLInputElement>,
      style: {
        ...styles?.input,
        ...style,
        '--select-input-width': widthCssVar.value,
      } as CSSProperties,
      autofocus,
      autocomplete: autoComplete || 'off',
      class: inputCls,
      disabled,
      value: value || '',
      onInput: handleChange,
      onKeydown: handleKeyDown,
      onBlur: handleBlur,
      onPaste: handlePaste,
      onCompositionstart: handleCompositionStart,
      onCompositionend: handleCompositionEnd,
      // Accessibility attributes
      role: role || 'combobox',
      'aria-expanded': open || false,
      'aria-haspopup': 'listbox' as const,
      'aria-owns': open ? `${id}_list` : undefined,
      'aria-autocomplete': 'list' as const,
      'aria-controls': open ? `${id}_list` : undefined,
      'aria-activedescendant': open ? activeDescendantId : undefined,
    }));

    return () => {
      // Handle different InputComponent types
      if (isVNode(InputComponent.value)) {
        // If InputComponent is a ReactElement, use cloneElement with merged props
        const existingProps: any = InputComponent.value.props || {};

        // Start with shared props as base
        const mergedProps = {
          // @ts-ignore
          placeholder: props.placeholder || placeholder,
          ...sharedInputProps.value,
          ...existingProps,
        };

        // Batch update function calls
        Object.keys(existingProps).forEach((key) => {
          const existingValue = (existingProps as any)[key];

          if (typeof existingValue === 'function') {
            // Merge event handlers
            (mergedProps as any)[key] = (...args: any[]) => {
              existingValue(...args);
              (sharedInputProps.value as any)[key]?.(...args);
            };
          }
        });

        // Update ref
        mergedProps.ref = composeRef(InputComponent.value.ref, sharedInputProps.value.ref);

        return cloneVNode(InputComponent.value, mergedProps, true);
      }

      // If InputComponent is a component type, render normally
      const Component = InputComponent.value;
      return <Component {...sharedInputProps.value} />;
    };
  },
  { inheritAttrs: false },
);

export default Input;
