import Render from '@vc-com/render';
import { filterEmpty } from '@vc-com/util/lib/props-util';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, createVNode, defineComponent, type VNode } from 'vue';
import { useFullProps, useRef, type MouseEventHandler } from 'vue-jsx-vapor';
import type { BaseInputProps, ValueType } from './interface';
import { hasAddon, hasPrefixSuffix } from './utils/commonUtils';

export interface HolderRef {
  /** Provider holder ref. Will return `null` if not wrap anything */
  nativeElement: HTMLElement | null;
}

const BaseInput = defineComponent(
  ({
    prefixCls,
    prefix,
    suffix,
    addonBefore,
    addonAfter,
    class: className,
    style,
    disabled,
    readonly,
    focused,
    triggerFocus,
    allowClear,
    handleReset,
    hidden,
    classNames,
    dataAttrs,
    styles,
    components,
    onClear,
  }: BaseInputProps) => {
    const slots = defineSlots<{ default: () => any }>();
    const props = useFullProps();
    const value = defineModel<ValueType>('value');

    const containerRef = useRef<HTMLDivElement>(null);

    const onInputClick: MouseEventHandler = (e) => {
      if (containerRef.value?.contains(e.target as Element)) {
        triggerFocus?.();
      }
    };

    const hasAffix = computed(() => hasPrefixSuffix(props));

    // ======================== Ref ======================== //
    const groupRef = useRef<HTMLDivElement>(null);

    defineExpose({
      get nativeElement() {
        return groupRef.value || containerRef.value;
      },
    });

    // `className` and `style` are always on the root element
    return () => {
      const AffixWrapperComponent = components?.affixWrapper || 'span';
      const GroupWrapperComponent = components?.groupWrapper || 'span';
      const WrapperComponent = components?.wrapper || 'span';
      const GroupAddonComponent = components?.groupAddon || 'span';
      const inputElement = filterEmpty(slots.default?.())[0];
      let element: VueNode = createVNode(inputElement, {
        value: value.value,
        class: clsx(inputElement.props?.class, !hasAffix.value && classNames?.variant) || null,
      });

      // ================== Prefix & Suffix ================== //
      if (hasAffix.value) {
        // ================== Clear Icon ================== //
        let clearIcon = null;
        if (allowClear) {
          const needClear = !disabled && !readonly && value.value;
          const clearIconCls = `${prefixCls}-clear-icon`;
          const iconNode = typeof allowClear === 'object' && allowClear?.clearIcon ? allowClear.clearIcon : '✖';

          clearIcon = (
            <button
              type="button"
              tabindex={-1}
              onClick={(event) => {
                handleReset?.(event);
                onClear?.();
              }}
              // Do not trigger onBlur when clear input
              // https://github.com/ant-design/ant-design/issues/31200
              onMousedown={(e) => e.preventDefault()}
              class={clsx(clearIconCls, {
                [`${clearIconCls}-hidden`]: !needClear,
                [`${clearIconCls}-has-suffix`]: !!suffix,
              })}
            >
              {iconNode}
            </button>
          );
        }

        const affixWrapperPrefixCls = `${prefixCls}-affix-wrapper`;
        const affixWrapperCls = clsx(
          affixWrapperPrefixCls,
          {
            [`${prefixCls}-disabled`]: disabled,
            [`${affixWrapperPrefixCls}-disabled`]: disabled, // Not used, but keep it
            [`${affixWrapperPrefixCls}-focused`]: focused, // Not used, but keep it
            [`${affixWrapperPrefixCls}-readonly`]: readonly,
            [`${affixWrapperPrefixCls}-input-with-clear-btn`]: suffix && allowClear && value.value,
          },
          classNames?.affixWrapper,
          classNames?.variant,
        );

        const suffixNode = (
          <span v-if={suffix || allowClear} class={clsx(`${prefixCls}-suffix`, classNames?.suffix)} style={styles?.suffix}>
            {clearIcon}
            <Render content={suffix}></Render>
          </span>
        );

        element = (
          <AffixWrapperComponent
            class={affixWrapperCls}
            style={styles?.affixWrapper}
            onClick={onInputClick}
            {...dataAttrs?.affixWrapper}
            ref={containerRef}
          >
            <span v-if={prefix} class={clsx(`${prefixCls}-prefix`, classNames?.prefix)} style={styles?.prefix}>
              <Render content={prefix}></Render>
            </span>
            {element}
            {suffixNode}
          </AffixWrapperComponent>
        );
      }

      // ================== Addon ================== //
      if (hasAddon(props)) {
        const wrapperCls = `${prefixCls}-group`;
        const addonCls = `${wrapperCls}-addon`;
        const groupWrapperCls = `${wrapperCls}-wrapper`;

        const mergedWrapperClassName = clsx(`${prefixCls}-wrapper`, wrapperCls, classNames?.wrapper);

        const mergedGroupClassName = clsx(
          groupWrapperCls,
          {
            [`${groupWrapperCls}-disabled`]: disabled,
          },
          classNames?.groupWrapper,
        );

        // Need another wrapper for changing display:table to display:inline-block
        // and put style prop in wrapper
        element = (
          <GroupWrapperComponent class={mergedGroupClassName} ref={groupRef}>
            <WrapperComponent class={mergedWrapperClassName}>
              <GroupAddonComponent v-if={addonBefore} class={addonCls}>
                <Render content={addonBefore}></Render>
              </GroupAddonComponent>
              {element}
              <GroupAddonComponent v-if={addonAfter} class={addonCls}>
                <Render content={addonAfter}></Render>
              </GroupAddonComponent>
            </WrapperComponent>
          </GroupWrapperComponent>
        );
      }

      return createVNode(element, {
        class: clsx((element as VNode).props?.class, className) || null,
        style: {
          ...(element as VNode).props?.style,
          ...style,
        },
        hidden,
      });
    };
  },
  { inheritAttrs: false },
);

export default BaseInput;
