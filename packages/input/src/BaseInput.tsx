import { clsx } from 'clsx';
import { computed, createVNode, defineComponent, type VNode } from 'vue';
import { useFullProps, useRef, type MouseEventHandler } from 'vue-jsx-vapor';
import { filterEmpty } from '../../util/src/props-util';
import type { VueNode } from '../../util/src/types';
import { resolveVNode } from '../../util/src/vnode';
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
    readOnly,
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
    const slots = defineSlots({
      default: () => <></>,
    });
    const props = useFullProps();
    const value = defineModel<ValueType>('value');
    const AffixWrapperComponent = computed(() => components?.affixWrapper || 'span');
    const GroupWrapperComponent = computed(() => components?.groupWrapper || 'span');
    const WrapperComponent = computed(() => components?.wrapper || 'span');
    const GroupAddonComponent = computed(() => components?.groupAddon || 'span');

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
          const needClear = !disabled && !readOnly && value.value;
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
            [`${affixWrapperPrefixCls}-readonly`]: readOnly,
            [`${affixWrapperPrefixCls}-input-with-clear-btn`]: suffix && allowClear && value.value,
          },
          classNames?.affixWrapper,
          classNames?.variant,
        );

        const suffixNode = (suffix || allowClear) && (
          <span class={clsx(`${prefixCls}-suffix`, classNames?.suffix)} style={styles?.suffix}>
            {clearIcon}
            {suffix}
          </span>
        );

        element = (
          <AffixWrapperComponent.value
            class={affixWrapperCls}
            style={styles?.affixWrapper}
            onClick={onInputClick}
            {...dataAttrs?.affixWrapper}
            ref={containerRef}
          >
            {prefix && (
              <span class={clsx(`${prefixCls}-prefix`, classNames?.prefix)} style={styles?.prefix}>
                {resolveVNode(prefix)}
              </span>
            )}
            {element}
            {suffixNode}
          </AffixWrapperComponent.value>
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
          <GroupWrapperComponent.value class={mergedGroupClassName} ref={groupRef}>
            <WrapperComponent.value class={mergedWrapperClassName}>
              {addonBefore && <GroupAddonComponent.value class={addonCls}>{resolveVNode(addonBefore)}</GroupAddonComponent.value>}
              {element}
              {addonAfter && <GroupAddonComponent.value class={addonCls}>{resolveVNode(addonAfter)}</GroupAddonComponent.value>}
            </WrapperComponent.value>
          </GroupWrapperComponent.value>
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
