import type { RenderNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { defineComponent } from 'vue';
import type { HtmlHTMLAttributes } from 'vue-jsx-vapor';
import { usePickerContextInject } from '../context';
export interface IconProps extends HtmlHTMLAttributes<HTMLElement> {
  icon?: RenderNode;
  type: 'suffix' | 'clear';
}

const Icon = defineComponent(({ icon, type, ...restProps }: IconProps) => {
  const { prefixCls, classNames, styles } = $(usePickerContextInject());

  return () => (
    <span v-if={icon} class={clsx(`${prefixCls}-${type}`, classNames.suffix)} style={styles.suffix} {...restProps}>
      {icon}
    </span>
  );
});

export interface ClearIconProps extends Omit<IconProps, 'type'> {
  onClear: VoidFunction;
}

export const ClearIcon = defineComponent(
  ({ onClear, ...restProps }: ClearIconProps) => {
    return () => (
      <Icon
        {...restProps}
        type="clear"
        role="button"
        onMousedown={(e) => {
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
      />
    );
  },
  { inheritAttrs: false },
);

export default Icon;
