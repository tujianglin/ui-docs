import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { SharedContentProps } from '.';
import { useBaseSelectContextInject } from '../../hooks/useBaseProps';
import { useSelectContextInject } from '../../SelectContext';
import { getTitle } from '../../utils/commonUtil';
import { useSelectInputContextInject } from '../context';
import Input from '../Input';
import Placeholder from './Placeholder';

const SingleContent = defineComponent(
  ({ inputProps }: SharedContentProps) => {
    const { prefixCls, searchValue, activeValue, displayValues, maxlength, mode, components } = $(useSelectInputContextInject());
    const { triggerOpen, title: rootTitle, showSearch, classNames, styles } = $(useBaseSelectContextInject());
    const selectContext = useSelectContextInject();

    const inputChanged = ref(false);

    const combobox = computed(() => mode === 'combobox');
    const displayValue = computed(() => displayValues[0]);

    // Implement the same logic as the old SingleSelector
    const mergedSearchValue = computed(() => {
      if (combobox.value && activeValue && !inputChanged.value && triggerOpen) {
        return activeValue;
      }
      return showSearch ? searchValue : '';
    });

    const {
      className: optionClassName,
      style: optionStyle,
      titleValue: optionTitle,
      nextHasStyle: hasOptionStyle,
    } = $(
      reactiveComputed(() => {
        let className: string | undefined;
        let style: CSSProperties | undefined;
        let titleValue: string | undefined;

        if (displayValue.value && selectContext?.flattenOptions) {
          // @ts-ignore
          const option = selectContext.flattenOptions?.find((opt) => opt.value === displayValue.value.value);
          if (option?.data) {
            className = option.data.className;
            style = option.data.style;
            titleValue = getTitle(option.data);
          }
        }

        if (displayValue.value && !titleValue) {
          titleValue = getTitle(displayValue.value);
        }

        if (rootTitle !== undefined) {
          titleValue = rootTitle;
        }

        const nextHasStyle = !!className || !!style;

        return { className, style, titleValue, nextHasStyle } as const;
      }),
    );

    watch(
      [combobox, () => activeValue],
      () => {
        if (combobox.value) {
          inputChanged.value = false;
        }
      },
      { immediate: true },
    );

    // ========================== Render ==========================
    const showHasValueCls = computed(
      () =>
        displayValue.value &&
        // @ts-ignore
        displayValue.value.label !== null &&
        displayValue.value.label !== undefined &&
        String(displayValue.value.label).trim() !== '',
    );

    const shouldRenderValue = computed(() => !(combobox.value && components?.input));

    const RenderValue = () => {
      return shouldRenderValue.value ? (
        displayValue.value ? (
          hasOptionStyle ? (
            <div
              class={clsx(`${prefixCls}-content-value`, optionClassName)}
              style={{
                ...(mergedSearchValue.value ? { visibility: 'hidden' } : {}),
                ...optionStyle,
              }}
              title={optionTitle}
            >
              {/* @ts-ignore */}
              {displayValue.value.label}
            </div>
          ) : (
            displayValue.value.label
          )
        ) : (
          <Placeholder show={!mergedSearchValue.value} />
        )
      ) : null;
    };

    const domRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return domRef.value?.nativeElement;
      },
    });

    return () => (
      <div
        class={clsx(
          `${prefixCls}-content`,
          showHasValueCls.value && `${prefixCls}-content-has-value`,
          mergedSearchValue.value && `${prefixCls}-content-has-search-value`,
          hasOptionStyle && `${prefixCls}-content-has-option-style`,
          classNames?.content,
        )}
        style={styles?.content}
        title={hasOptionStyle ? undefined : optionTitle}
      >
        <RenderValue></RenderValue>
        <Input
          ref={domRef}
          {...(inputProps as any)}
          value={mergedSearchValue.value}
          maxlength={mode === 'combobox' ? maxlength : undefined}
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
