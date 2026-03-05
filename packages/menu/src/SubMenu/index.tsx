import Overflow from '@vc-com/overflow';
import { warning } from '@vc-com/util/lib/warning';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, shallowRef, watch, type CSSProperties } from 'vue';
import { useFullProps, useRef, type FocusEventHandler, type MouseEventHandler } from 'vue-jsx-vapor';
import type { VueNode } from '../../../util/src/types';
import { resolveVNode } from '../../../util/src/vnode';
import Icon from '../Icon';
import { useMenuId } from '../context/IdContext';
import MenuContextProvider, { useMenuContextInject } from '../context/MenuContext';
import {
  PathTrackerContextProvider,
  useFullPath,
  usePathRegisterContextInject,
  usePathUserContextInject,
} from '../context/PathContext';
import { usePrivateContextInject } from '../context/PrivateContext';
import useActive from '../hooks/useActive';
import useDirectionStyle from '../hooks/useDirectionStyle';
import useMemoCallback from '../hooks/useMemoCallback';
import type { MenuInfo, SubMenuType } from '../interface';
import { parseChildren } from '../utils/commonUtil';
import { warnItemProp } from '../utils/warnUtil';
import InlineSubMenuList from './InlineSubMenuList';
import PopupTrigger from './PopupTrigger';
import SubMenuList from './SubMenuList';

export type SemanticName = 'list' | 'listTitle';
export interface SubMenuProps extends Omit<SubMenuType, 'key' | 'children' | 'label'> {
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  title?: VueNode;

  /** @private Used for rest popup. Do not use in your prod */
  internalPopupClose?: boolean;

  /** @private Internal filled key. Do not set it directly */
  eventKey?: string;

  /** @private Do not use. Private warning empty usage */
  warnKey?: boolean;
  // >>>>>>>>>>>>>>>>>>>>> Next  Round <<<<<<<<<<<<<<<<<<<<<<<
  // onDestroy?: DestroyEventHandler;
}

const InternalSubMenu = defineComponent(
  ({
    style,
    class: className,

    styles,
    classNames: menuClassNames,

    title,
    eventKey,
    warnKey,

    disabled,
    internalPopupClose,

    // Icons
    itemIcon,
    expandIcon,

    // Popup
    popupClassName,
    popupOffset,
    popupStyle,

    // Events
    onClick,
    onMouseEnter,
    onMouseLeave,
    onTitleClick,
    onTitleMouseEnter,
    onTitleMouseLeave,
    popupRender: propsPopupRender,
    ...restProps
  }: SubMenuProps) => {
    const props = useFullProps() as SubMenuProps;
    const domDataId = useMenuId(computed(() => eventKey));

    const {
      prefixCls,
      mode,
      openKeys,

      // Disabled
      disabled: contextDisabled,
      overflowDisabled,

      // ActiveKey
      activeKey,

      // SelectKey
      selectedKeys,

      // Icon
      // @ts-ignore
      itemIcon: contextItemIcon,
      expandIcon: contextExpandIcon,

      // Events
      onItemClick,
      onOpenChange,

      onActive,
      popupRender: contextPopupRender,
    } = $(useMenuContextInject());

    const { _internalRenderSubMenuItem } = usePrivateContextInject();

    const { isSubPathKey } = $(usePathUserContextInject());
    const connectedPath = useFullPath();

    const subMenuPrefixCls = computed(() => `${prefixCls}-submenu`);
    const mergedDisabled = computed(() => contextDisabled || disabled);
    const elementRef = useRef<HTMLDivElement>();
    const popupRef = useRef<HTMLUListElement>();

    // ================================ Warn ================================
    if (process.env.NODE_ENV !== 'production' && warnKey) {
      warning(false, 'SubMenu should not leave undefined `key`.');
    }

    // ================================ Icon ================================
    // @ts-ignore
    const mergedItemIcon = computed(() => itemIcon ?? contextItemIcon);
    const mergedExpandIcon = computed(() => expandIcon ?? contextExpandIcon);

    // ================================ Open ================================
    const originOpen = computed(() => openKeys.includes(eventKey));
    const open = computed(() => !overflowDisabled && originOpen.value);

    // =============================== Select ===============================
    const childrenSelected = computed(() => isSubPathKey(selectedKeys, eventKey));

    // =============================== Active ===============================
    const activeProps = useActive(
      computed(() => eventKey),
      mergedDisabled,
      onTitleMouseEnter,
      onTitleMouseLeave,
    );

    // Fallback of active check to avoid hover on menu title or disabled item
    const childrenActive = ref(false);

    const triggerChildrenActive = (newActive: boolean) => {
      if (!mergedDisabled.value) {
        childrenActive.value = newActive;
      }
    };

    const onInternalMouseEnter: MouseEventHandler<HTMLLIElement> = (domEvent) => {
      triggerChildrenActive(true);

      onMouseEnter?.({
        key: eventKey,
        domEvent,
      });
    };

    const onInternalMouseLeave: MouseEventHandler<HTMLLIElement> = (domEvent) => {
      triggerChildrenActive(false);

      onMouseLeave?.({
        key: eventKey,
        domEvent,
      });
    };

    const mergedActive = computed(() => {
      if (activeProps.active) {
        return activeProps.active;
      }

      if (mode !== 'inline') {
        return childrenActive.value || isSubPathKey([activeKey], eventKey);
      }

      return false;
    });

    // ========================== DirectionStyle ==========================
    const directionStyle = useDirectionStyle(computed(() => connectedPath.value.length));

    // =============================== Events ===============================
    // >>>> Title click
    const onInternalTitleClick: MouseEventHandler<HTMLElement> = (e) => {
      // Skip if disabled
      if (mergedDisabled.value) {
        return;
      }

      onTitleClick?.({
        key: eventKey,
        domEvent: e,
      });

      // Trigger open by click when mode is `inline`
      if (mode === 'inline') {
        onOpenChange(eventKey, !originOpen.value);
      }
    };

    // >>>> Context for children click
    const onMergedItemClick = useMemoCallback((info: MenuInfo) => {
      onClick?.(warnItemProp(info));
      onItemClick(info);
    });

    // >>>>> Visible change
    const onPopupVisibleChange = (newVisible: boolean) => {
      if (mode !== 'inline') {
        onOpenChange(eventKey, newVisible);
      }
    };

    /**
     * Used for accessibility. Helper will focus element without key board.
     * We should manually trigger an active
     */
    const onInternalFocus: FocusEventHandler<HTMLDivElement> = () => {
      onActive(eventKey);
    };

    // Cache mode if it change to `inline` which do not have popup motion
    const triggerModeRef = shallowRef(mode);

    // =============================== Render ===============================
    return () => {
      const popupId = domDataId.value && `${domDataId.value}-popup`;

      const expandIconNode = (
        <Icon
          icon={mode !== 'horizontal' ? mergedExpandIcon.value : undefined}
          props={{
            ...props,
            isOpen: open.value,
            // [Legacy] Not sure why need this mark
            isSubMenu: true,
          }}
        >
          <i class={`${subMenuPrefixCls.value}-arrow`} />
        </Icon>
      );

      // >>>>> Title
      let titleNode = (
        <div
          role="menuitem"
          style={directionStyle.value}
          class={`${subMenuPrefixCls.value}-title`}
          tabindex={mergedDisabled.value ? null : -1}
          ref={elementRef}
          title={typeof title === 'string' ? title : null}
          data-menu-id={overflowDisabled && domDataId.value ? null : domDataId.value}
          aria-expanded={open.value}
          aria-haspopup
          aria-controls={popupId}
          aria-disabled={mergedDisabled.value}
          onClick={onInternalTitleClick}
          onFocus={onInternalFocus}
          {...activeProps}
        >
          {resolveVNode(title)}

          {/* Only non-horizontal mode shows the icon */}
          {expandIconNode}
        </div>
      );

      if (mode !== 'inline' && connectedPath.value.length > 1) {
        triggerModeRef.value = 'vertical';
      } else {
        triggerModeRef.value = mode;
      }
      const popupContentTriggerMode = triggerModeRef.value;
      const renderPopupContent = () => {
        const originNode = (
          <MenuContextProvider
            classNames={menuClassNames}
            styles={styles}
            mode={popupContentTriggerMode === 'horizontal' ? 'vertical' : popupContentTriggerMode}
          >
            <SubMenuList id={popupId} ref={popupRef}>
              <slot></slot>
            </SubMenuList>
          </MenuContextProvider>
        );
        const mergedPopupRender = propsPopupRender || contextPopupRender;
        if (mergedPopupRender) {
          const node = mergedPopupRender(originNode, {
            item: props,
            keys: connectedPath.value,
          });
          return node;
        }
        return originNode;
      };

      if (!overflowDisabled) {
        const triggerMode = triggerModeRef.value;

        // Still wrap with Trigger here since we need avoid react re-mount dom node
        // Which makes motion failed
        titleNode = (
          <PopupTrigger
            mode={triggerMode}
            prefixCls={subMenuPrefixCls.value}
            visible={!internalPopupClose && open && mode !== 'inline'}
            popupClassName={popupClassName}
            popupOffset={popupOffset}
            popupStyle={popupStyle}
            popup={renderPopupContent({})}
            disabled={mergedDisabled.value}
            onVisibleChange={onPopupVisibleChange}
          >
            {titleNode}
          </PopupTrigger>
        );
      }

      // >>>>> List node
      let listNode = (
        <Overflow.Item
          role="none"
          {...restProps}
          component="li"
          style={style}
          class={clsx(subMenuPrefixCls.value, `${subMenuPrefixCls.value}-${mode}`, className, {
            [`${subMenuPrefixCls.value}-open`]: open.value,
            [`${subMenuPrefixCls.value}-active`]: mergedActive.value,
            [`${subMenuPrefixCls.value}-selected`]: childrenSelected.value,
            [`${subMenuPrefixCls.value}-disabled`]: mergedDisabled.value,
          })}
          onMouseenter={onInternalMouseEnter}
          onMouseleave={onInternalMouseLeave}
        >
          {titleNode}

          {/* Inline mode */}
          <InlineSubMenuList v-if={!overflowDisabled} id={popupId} open={open.value} keyPath={connectedPath.value}>
            <slot></slot>
          </InlineSubMenuList>
        </Overflow.Item>
      );

      if (_internalRenderSubMenuItem) {
        listNode = _internalRenderSubMenuItem(listNode, props, {
          selected: childrenSelected.value,
          active: mergedActive.value,
          open: open.value,
          disabled: mergedDisabled.value,
        }) as JSX.Element;
      }

      // >>>>> Render
      return (
        <MenuContextProvider
          classNames={menuClassNames}
          styles={styles}
          onItemClick={onMergedItemClick}
          mode={mode === 'horizontal' ? 'vertical' : mode}
          itemIcon={mergedItemIcon.value}
          expandIcon={mergedExpandIcon.value}
        >
          {listNode}
        </MenuContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);

const SubMenu = defineComponent(
  (props: SubMenuProps) => {
    const slots = defineSlots();
    const connectedKeyPath = useFullPath(computed(() => props.eventKey));

    // ==================== Record KeyPath ====================
    const measure = usePathRegisterContextInject();

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

    // ======================== Render ========================

    return () => {
      const children = slots.default?.();
      const childList = computed(() => parseChildren(children, connectedKeyPath.value));
      let renderNode;
      if (measure) {
        renderNode = childList;
      } else {
        renderNode = (
          <InternalSubMenu ref={ref} {...props}>
            {childList}
          </InternalSubMenu>
        );
      }
      return <PathTrackerContextProvider value={connectedKeyPath.value}>{renderNode}</PathTrackerContextProvider>;
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'SubMenu' : undefined },
);

export default SubMenu;
