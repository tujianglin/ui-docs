import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import KeyCode from '@vc-com/util/lib/KeyCode';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { HTMLAttributes, KeyboardEvent, KeyboardEventHandler, MouseEvent } from 'vue-jsx-vapor';

export type SwitchChangeEventHandler = (
  checked: boolean,
  event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
) => void;
export type SwitchClickEventHandler = SwitchChangeEventHandler;

interface SwitchProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'> {
  class?: string;
  prefixCls?: string;
  disabled?: boolean;
  checkedChildren?: VueNode;
  unCheckedChildren?: VueNode;
  onChange?: SwitchChangeEventHandler;
  onKeydown?: KeyboardEventHandler<HTMLButtonElement>;
  onClick?: SwitchClickEventHandler;
  tabindex?: number;
  checked?: boolean;
  defaultChecked?: boolean;
  loadingIcon?: VueNode;
  style?: CSSProperties;
  title?: string;
  styles?: { content?: CSSProperties };
  classNames?: { content?: string };
}

const Switch = defineComponent(
  ({
    prefixCls = 'rc-switch',
    class: className,
    checked,
    defaultChecked,
    disabled,
    loadingIcon,
    checkedChildren,
    unCheckedChildren,
    onClick,
    onChange,
    onKeydown,
    styles,
    classNames: switchClassNames,
    ...restProps
  }: SwitchProps) => {
    const [innerChecked, setInnerChecked] = useControlledState<boolean>(
      defaultChecked ?? false,
      computed(() => checked),
    );

    function triggerChange(newChecked: boolean, event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) {
      let mergedChecked = innerChecked.value;

      if (!disabled) {
        mergedChecked = newChecked;
        setInnerChecked(mergedChecked);
        onChange?.(mergedChecked, event);
      }

      return mergedChecked;
    }

    function onInternalKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
      if (e.which === KeyCode.LEFT) {
        triggerChange(false, e);
      } else if (e.which === KeyCode.RIGHT) {
        triggerChange(true, e);
      }
      onKeydown?.(e);
    }

    function onInternalClick(e: MouseEvent<HTMLButtonElement>) {
      const ret = triggerChange(!innerChecked.value, e);
      // [Legacy] trigger onClick with value
      onClick?.(ret, e);
    }

    const switchClassName = computed(() =>
      clsx(prefixCls, className, {
        [`${prefixCls}-checked`]: innerChecked.value,
        [`${prefixCls}-disabled`]: disabled,
      }),
    );

    return () => (
      <button
        {...restProps}
        type="button"
        role="switch"
        aria-checked={innerChecked.value}
        disabled={disabled}
        class={switchClassName.value}
        onKeydown={onInternalKeyDown}
        onClick={onInternalClick}
      >
        {loadingIcon}
        <span class={`${prefixCls}-inner`}>
          <span class={clsx(`${prefixCls}-inner-checked`, switchClassNames?.content)} style={styles?.content}>
            {checkedChildren}
          </span>
          <span class={clsx(`${prefixCls}-inner-unchecked`, switchClassNames?.content)} style={styles?.content}>
            {unCheckedChildren}
          </span>
        </span>
      </button>
    );
  },
  { inheritAttrs: false, name: 'Switch' },
);

export default Switch;
