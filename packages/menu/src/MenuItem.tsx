import KeyCode from '@vc-com/util/lib/KeyCode';
import omit from '@vc-com/util/lib/omit';
import { clsx } from 'clsx';
import { computed, defineComponent, watch } from 'vue';
import {
  useFullProps,
  useRef,
  type FocusEventHandler,
  type HTMLAttributes,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
} from 'vue-jsx-vapor';
import Overflow from '../../overflow/src';
import { warning } from '../../util/src/warning';
import { useMenuId } from './context/IdContext';
import { useMenuContextInject } from './context/MenuContext';
import { useFullPath, usePathRegisterContextInject } from './context/PathContext';
import { usePrivateContextInject } from './context/PrivateContext';
import useActive from './hooks/useActive';
import useDirectionStyle from './hooks/useDirectionStyle';
import Icon from './Icon';
import type { MenuInfo, MenuItemType } from './interface';
import { warnItemProp } from './utils/warnUtil';

export interface MenuItemProps
  extends
    Omit<MenuItemType, 'label' | 'key'>,
    Omit<HTMLAttributes<HTMLLIElement>, 'onClick' | 'onMouseenter' | 'onMouseleave' | 'onSelect' | 'class' | 'style'> {
  /** @private Internal filled key. Do not set it directly */
  eventKey?: string;

  /** @private Do not use. Private warning empty usage */
  warnKey?: boolean;
}

// Since Menu event provide the `info.item` which point to the MenuItem node instance.
// We have to use class component here.
// This should be removed from doc & api in future.
const LegacyMenuItem = defineComponent(
  (_: Record<string, any>) => {
    const props = useFullProps() as any;
    return () => {
      const { title, attribute, elementRef, ...restProps } = props;

      // Here the props are eventually passed to the DOM element.
      // React does not recognize non-standard attributes.
      // Therefore, remove the props that is not used here.
      // ref: https://github.com/ant-design/ant-design/issues/41395
      const passedProps = omit(restProps, ['eventKey', 'popupClassName', 'popupOffset', 'onTitleClick']);
      warning(!attribute, '`attribute` of Menu.Item is deprecated. Please pass attribute directly.');
      return (
        <Overflow.Item {...attribute} title={typeof title === 'string' ? title : undefined} {...passedProps} ref={elementRef}>
          <slot></slot>
        </Overflow.Item>
      );
    };
  },
  { inheritAttrs: false },
);

/**
 * Real Menu Item component
 */
const InternalMenuItem = defineComponent(
  ({
    style,
    class: className,

    eventKey,
    warnKey,
    disabled,
    itemIcon,

    // Aria
    role,

    // Active
    onMouseenter,
    onMouseleave,

    onClick,
    onKeydown,

    onFocus,

    ...restProps
  }: MenuItemProps) => {
    const props = useFullProps() as MenuItemProps;
    const domDataId = useMenuId(computed(() => eventKey));

    const {
      prefixCls,
      onItemClick,

      disabled: contextDisabled,
      overflowDisabled,

      // Icon
      // @ts-ignore
      itemIcon: contextItemIcon,

      // Select
      selectedKeys,

      // Active
      onActive,
    } = $(useMenuContextInject());

    const { _internalRenderMenuItem } = usePrivateContextInject();

    const itemCls = computed(() => `${prefixCls}-item`);

    const legacyMenuItemRef = useRef<any>();
    const elementRef = useRef<HTMLLIElement>();
    const mergedDisabled = computed(() => contextDisabled || disabled);

    const connectedKeys = useFullPath(computed(() => eventKey));

    // ================================ Warn ================================
    if (process.env.NODE_ENV !== 'production' && warnKey) {
      warning(false, 'MenuItem should not leave undefined `key`.');
    }

    // ============================= Info =============================
    const getEventInfo = (e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): MenuInfo => {
      return {
        key: eventKey,
        // Note: For legacy code is reversed which not like other antd component
        keyPath: [...connectedKeys.value].reverse(),
        item: legacyMenuItemRef.value,
        domEvent: e,
      };
    };

    // ============================= Icon =============================
    // @ts-ignore
    const mergedItemIcon = computed(() => itemIcon || contextItemIcon);

    // ============================ Active ============================
    const activeProps = useActive(
      computed(() => eventKey),
      mergedDisabled,
      onMouseenter,
      onMouseleave,
    );

    // ============================ Select ============================
    const selected = computed(() => selectedKeys.includes(eventKey));

    // ======================== DirectionStyle ========================
    const directionStyle = useDirectionStyle(computed(() => connectedKeys.value.length));

    // ============================ Events ============================
    const onInternalClick: MouseEventHandler<HTMLLIElement> = (e) => {
      if (mergedDisabled.value) {
        return;
      }

      const info = getEventInfo(e);

      onClick?.(warnItemProp(info));
      onItemClick(info);
    };

    const onInternalKeyDown: KeyboardEventHandler<HTMLLIElement> = (e) => {
      onKeydown?.(e);

      if (e.which === KeyCode.ENTER) {
        const info = getEventInfo(e);

        // Legacy. Key will also trigger click event
        onClick?.(warnItemProp(info));
        onItemClick(info);
      }
    };

    /**
     * Used for accessibility. Helper will focus element without key board.
     * We should manually trigger an active
     */
    const onInternalFocus: FocusEventHandler<HTMLLIElement> = (e) => {
      onActive(eventKey);
      onFocus?.(e);
    };
    // ============================ Render ============================
    return () => {
      const optionRoleProps: HTMLAttributes<HTMLDivElement> & { component: string } = {
        component: 'li',
      };

      if (props.role === 'option') {
        optionRoleProps['aria-selected'] = selected.value;
      }
      let renderNode = (
        <LegacyMenuItem
          ref={legacyMenuItemRef}
          elementRef={elementRef}
          role={role === null ? 'none' : role || 'menuitem'}
          tabIndex={disabled ? null : -1}
          data-menu-id={overflowDisabled && domDataId.value ? null : domDataId.value}
          {...omit(restProps, ['extra'])}
          {...omit(activeProps, ['active'])}
          {...optionRoleProps}
          aria-disabled={disabled}
          style={{
            ...directionStyle.value,
            ...style,
          }}
          class={clsx(
            itemCls.value,
            {
              [`${itemCls.value}-active`]: activeProps.active,
              [`${itemCls.value}-selected`]: selected.value,
              [`${itemCls.value}-disabled`]: mergedDisabled.value,
            },
            className,
          )}
          onClick={onInternalClick}
          onKeydown={onInternalKeyDown}
          onFocus={onInternalFocus}
        >
          <slot></slot>
          <Icon
            props={{
              ...props,
              isSelected: selected.value,
            }}
            icon={mergedItemIcon.value}
          />
        </LegacyMenuItem>
      );

      if (_internalRenderMenuItem) {
        renderNode = _internalRenderMenuItem(renderNode, props, { selected: selected.value }) as JSX.Element;
      }

      return renderNode;
    };
  },
  { inheritAttrs: false },
);

const MenuItem = defineComponent(
  (props: MenuItemProps) => {
    // ==================== Record KeyPath ====================
    const measure = usePathRegisterContextInject();
    const connectedKeyPath = useFullPath(computed(() => props.eventKey));

    // eslint-disable-next-line consistent-return
    watch(
      connectedKeyPath,
      (_n, _o, onCleanup) => {
        if (measure) {
          measure.registerPath(props.eventKey, connectedKeyPath.value);

          onCleanup(() => {
            measure.unregisterPath(props.eventKey, connectedKeyPath.value);
          });
        }
      },
      { immediate: true, deep: true },
    );

    return () => {
      if (measure) {
        return null;
      }

      // ======================== Render ========================
      return (
        <InternalMenuItem {...props}>
          <slot></slot>
        </InternalMenuItem>
      );
    };
  },
  { inheritAttrs: false },
);

export default MenuItem;
