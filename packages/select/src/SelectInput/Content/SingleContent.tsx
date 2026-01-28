import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import { useRef, type HTMLAttributes } from 'vue-jsx-vapor';
import type { SharedContentProps } from '.';
import { resolveVNode } from '../../../../util/src/vnode';
import { useBaseSelectContextInject } from '../../hooks/useBaseProps';
import { useSelectContextInject } from '../../SelectContext';
import { getTitle } from '../../utils/commonUtil';
import { useSelectInputContextInject } from '../context';
import Input from '../Input';
import Placeholder from './Placeholder';

const SingleContent = defineComponent(
  ({ inputProps }: SharedContentProps) => {
    const { prefixCls, searchValue, activeValue, displayValues, maxLength, mode } = $(useSelectInputContextInject());
    const { triggerOpen, title: rootTitle, showSearch, classNames, styles } = $(useBaseSelectContextInject());
    const selectContext = useSelectContextInject();

    const inputChanged = ref(false);

    const combobox = mode === 'combobox';
    const displayValue = displayValues[0];

    // Implement the same logic as the old SingleSelector
    const mergedSearchValue = computed(() => {
      if (combobox && activeValue && !inputChanged.value && triggerOpen) {
        return activeValue;
      }

      return showSearch ? searchValue : '';
    });

    // Extract option props, excluding label and value, and handle className/style merging
    const optionProps = computed(() => {
      const restProps: HTMLAttributes<HTMLDivElement> = {
        class: `${prefixCls}-content-value`,
        style: mergedSearchValue.value
          ? {
              visibility: 'hidden',
            }
          : {},
      };

      if (displayValue && selectContext?.flattenOptions) {
        // @ts-ignore
        const option = selectContext.flattenOptions.find((opt) => opt.value === displayValue.value);
        if (option?.data) {
          const { class: className, style } = option.data;
          Object.assign(restProps, {
            title: getTitle(option.data),
            class: clsx(restProps.class, className),
            style: { ...(restProps.style as CSSProperties), ...style },
          });
        }
      }

      if (displayValue && !restProps.title) {
        restProps.title = getTitle(displayValue);
      }

      if (rootTitle !== undefined) {
        restProps.title = rootTitle;
      }

      return restProps;
    });

    watch(
      [() => combobox, () => activeValue],
      () => {
        if (combobox) {
          inputChanged.value = false;
        }
      },
      { immediate: true },
    );

    const domRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return domRef.value?.nativeElement;
      },
    });

    return () => (
      <div class={clsx(`${prefixCls}-content`, classNames?.content)} style={styles?.content}>
        <div v-if={displayValue} {...optionProps.value}>
          {resolveVNode(displayValue.label)}
        </div>
        <Placeholder v-else show={!mergedSearchValue.value} />
        <Input
          ref={domRef}
          {...(inputProps as any)}
          v-model:value={mergedSearchValue.value}
          maxLength={mode === 'combobox' ? maxLength : undefined}
          onChange={(e) => {
            inputChanged.value = true;
            inputProps.onChange?.(e);
          }}
        />
      </div>
    );
  },
  { inheritAttrs: false },
);

export default SingleContent;
