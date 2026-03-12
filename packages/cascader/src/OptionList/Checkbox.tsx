import Render from '@vc-com/render';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';
import { useCascaderContextInject } from '../context';

export interface CheckboxProps {
  prefixCls: string;
  checked?: boolean;
  halfChecked?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler;
  disableCheckbox?: boolean;
}

export default defineComponent(
  ({ prefixCls, checked, halfChecked, disabled, onClick, disableCheckbox }: CheckboxProps) => {
    // @ts-ignore
    const { checkable } = $(useCascaderContextInject());

    const customCheckbox = computed(() => (typeof checkable !== 'boolean' ? checkable : null));

    return () => (
      <span
        class={clsx(`${prefixCls}`, {
          [`${prefixCls}-checked`]: checked,
          [`${prefixCls}-indeterminate`]: !checked && halfChecked,
          [`${prefixCls}-disabled`]: disabled || disableCheckbox,
        })}
        onClick={onClick}
      >
        <Render content={customCheckbox.value}></Render>
      </span>
    );
  },
  { inheritAttrs: false },
);
