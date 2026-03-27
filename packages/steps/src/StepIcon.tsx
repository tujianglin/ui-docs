import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { computed, defineComponent, inject, provide, reactive, type CSSProperties, type InjectionKey, type Reactive } from 'vue';
import type { HTMLAttributes } from 'vue-jsx-vapor';
import { useStepsContextInject } from './Context';

export interface StepIconSemanticContextProps {
  class?: string;
  style?: CSSProperties;
}

const StepIconSemanticContext: InjectionKey<Reactive<StepIconSemanticContextProps>> = Symbol('StepIconSemanticContext');

export const useStepIconSemanticContextInject = (): Reactive<StepIconSemanticContextProps> => {
  return inject(StepIconSemanticContext, reactive({}));
};

export const useStepIconSemanticContextProvider = (props: Reactive<StepIconSemanticContextProps>) => {
  provide(StepIconSemanticContext, props);
};

export type StepIconProps = Omit<HTMLAttributes<HTMLDivElement>, 'style'> & { style?: CSSProperties };

const StepIcon = defineComponent(
  ({ class: className, style, ...restProps }: StepIconProps) => {
    const { prefixCls, classNames, styles } = $(useStepsContextInject());
    const { class: itemClassName, style: itemStyle } = $(useStepIconSemanticContextInject());

    const itemCls = computed(() => `${prefixCls}-item`);

    return () => (
      <div
        {...pickAttrs(restProps, false)}
        class={clsx(`${itemCls.value}-icon`, classNames.itemIcon, itemClassName, className)}
        style={{ ...styles.itemIcon, ...itemStyle, ...style }}
      >
        <slot></slot>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default StepIcon;
