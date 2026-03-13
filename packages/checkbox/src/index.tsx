import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps, useRef, type ChangeEvent, type InputHTMLAttributes } from 'vue-jsx-vapor';

export interface CheckboxChangeEvent {
  target: CheckboxChangeEventTarget;
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent: any;
}

export interface CheckboxChangeEventTarget extends CheckboxProps {
  checked: boolean;
}

export interface CheckboxRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  input: HTMLInputElement | null;
  nativeElement: HTMLElement | null;
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'> {
  prefixCls?: string;
  onChange?: (e: CheckboxChangeEvent) => void;
}

export const Checkbox = defineComponent(
  ({
    prefixCls = 'rc-checkbox',
    class: className,
    style,
    disabled,
    type = 'checkbox',
    title,
    onChange,
    ...inputProps
  }: CheckboxProps) => {
    const rawValue = defineModel('checked', { default: false });
    const props = useFullProps() as CheckboxProps;
    const inputRef = useRef<HTMLInputElement>(null);
    const holderRef = useRef<HTMLElement>(null);

    defineExpose({
      focus: (options) => {
        inputRef.value?.focus(options);
      },
      blur: () => {
        inputRef.value?.blur();
      },
      get input() {
        return inputRef.value;
      },
      get nativeElement() {
        return holderRef.value;
      },
    });

    const classString = computed(() =>
      clsx(prefixCls, className, {
        [`${prefixCls}-checked`]: rawValue.value,
        [`${prefixCls}-disabled`]: disabled,
      }),
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }

      rawValue.value = e.target.checked;

      onChange?.({
        target: {
          ...props,
          type,
          checked: e.target.checked,
        },
        stopPropagation() {
          e.stopPropagation();
        },
        preventDefault() {
          e.preventDefault();
        },
        nativeEvent: e,
      });
    };

    return () => (
      <span class={classString.value} title={title} style={style} ref={holderRef}>
        <input
          {...inputProps}
          class={`${prefixCls}-input`}
          ref={inputRef}
          onChange={handleChange}
          disabled={disabled}
          checked={!!rawValue.value}
          type={type}
        />
      </span>
    );
  },
  { inheritAttrs: false },
);

export default Checkbox;
