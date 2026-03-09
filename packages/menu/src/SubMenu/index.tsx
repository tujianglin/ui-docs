import Overflow from '@vc-com/overflow';
import type { VueNode } from '@vc-com/util/lib/types';
import { resolveVNode } from '@vc-com/util/lib/vnode';
import { warning } from '@vc-com/util/lib/warning';
import { clsx } from 'clsx';
import { omit } from 'es-toolkit';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
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
    onMouseenter,
    onMouseleave,
    onTitleClick,
    onTitleMouseEnter,
    onTitleMouseLeave,
    popupRender: propsPopupRender,
    ...restProps
  }: SubMenuProps) => {
    const slots = defineSlots();
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

    const { isSubPathKey } = usePathUserContextInject();
    const connectedPath = useFullPath();

    const subMenuPrefixCls = computed(() => `${prefixCls}-submenu`);
    const mergedDisabled = computed(() => disabled ?? contextDisabled);
    const elementRef = ref<HTMLDivElement>();
    const popupRef = ref<HTMLUListElement>();

    // ================================ Warn ================================
    if (process.env.NODE_ENV !== 'production' && warnKey) {
      warning(false, 'SubMenu should not leave undefined `key`.');
    }

    // ================================ Icon ================================
    // @ts-ignore
    const mergedItemIcon = computed(() => itemIcon ?? contextItemIcon?.value);
    const mergedExpandIcon = computed(() => expandIcon ?? contextExpandIcon?.value);

    // ================================ Open ================================
    const originOpen = computed(() => openKeys?.includes(eventKey));

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

    const onInternalMouseEnter = (domEvent) => {
      triggerChildrenActive(true);
      onMouseenter?.({
        key: eventKey,
        domEvent,
      });
    };

    const onInternalMouseLeave = (domEvent) => {
      triggerChildrenActive(false);

      onMouseleave?.({
        key: eventKey,
        domEvent,
      });
    };

    const mergedActive = computed(() => {
      if (activeProps?.active) {
        return activeProps?.active;
      }

      if (mode !== 'inline') {
        return childrenActive.value || isSubPathKey([activeKey], eventKey);
      }
      return false;
    });

    // ========================== DirectionStyle ==========================
    const directionStyle = useDirectionStyle(computed(() => connectedPath?.value.length));

    // =============================== Events ===============================
    // >>>> Title click
    const onInternalTitleClick = (e) => {
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
    const onInternalFocus = () => {
      onActive(eventKey);
    };

    // =============================== Render ===============================
    const popupId = computed(() => domDataId.value && `${domDataId.value}-popup`);

    const ExpandIconNode = () => {
      return (
        <Icon
          icon={mode !== 'horizontal' ? mergedExpandIcon.value : undefined}
          props={{
            ...props,
            isOpen: open.value,
            // [Legacy] Not sure why need this mark
            isSubMenu: true,
          }}
        >
          <i class={`${subMenuPrefixCls?.value}-arrow`} />
        </Icon>
      );
    };

    // >>>>> Title
    const TitleNode = () => {
      let titleNode = (
        <div
          role="menuitem"
          style={directionStyle.value}
          class={`${subMenuPrefixCls.value}-title`}
          tabindex={mergedDisabled?.value ? null : -1}
          ref={elementRef}
          title={typeof title === 'string' ? title : null}
          data-menu-id={overflowDisabled && domDataId?.value ? null : domDataId?.value}
          aria-expanded={open.value}
          aria-haspopup
          aria-controls={popupId.value}
          aria-disabled={mergedDisabled.value}
          onClick={onInternalTitleClick}
          onFocus={onInternalFocus}
          {...omit(activeProps, ['active'])}
        >
          {resolveVNode(title)}
          {/* Only non-horizontal mode shows the icon */}
          <ExpandIconNode></ExpandIconNode>
        </div>
      );
      if (!overflowDisabled) {
        const triggerMode = triggerModeRef.value;

        // Still wrap with Trigger here since we need avoid react re-mount dom node
        // Which makes motion failed
        titleNode = (
          <PopupTrigger
            mode={triggerMode}
            prefixCls={subMenuPrefixCls.value}
            visible={!internalPopupClose && open.value && mode !== 'inline'}
            popupClassName={popupClassName}
            popupOffset={popupOffset}
            popupStyle={popupStyle}
            popup={renderPopupContent()}
            disabled={mergedDisabled.value}
            onVisibleChange={onPopupVisibleChange}
          >
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
              aria-controls={popupId.value}
              aria-disabled={mergedDisabled.value}
              onClick={onInternalTitleClick}
              onFocus={onInternalFocus}
              {...activeProps}
            >
              {resolveVNode(title)}

              {/* Only non-horizontal mode shows the icon */}
              <ExpandIconNode></ExpandIconNode>
            </div>
          </PopupTrigger>
        );
      }

      return titleNode;
    };

    // Cache mode if it change to `inline` which do not have popup motion
    const triggerModeRef = computed(() => {
      let result = mode;
      if (mode !== 'inline' && connectedPath.value.length > 1) {
        result = 'vertical';
      } else {
        result = mode;
      }
      return result;
    });

    const popupContentTriggerMode = computed(() => triggerModeRef.value);
    const renderPopupContent = () => {
      const originNode = (
        <MenuContextProvider
          classNames={menuClassNames}
          styles={styles}
          mode={popupContentTriggerMode.value === 'horizontal' ? 'vertical' : popupContentTriggerMode.value}
        >
          <SubMenuList id={popupId.value} ref={popupRef}>
            {slots?.default?.()}
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

    const domRef = ref();

    defineExpose({
      get el() {
        return domRef.value || {};
      },
    });

    // >>>>> List node
    const ListNode = () => {
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
          <TitleNode></TitleNode>
          <InlineSubMenuList v-if={!overflowDisabled} id={popupId.value} open={open.value} keyPath={connectedPath.value}>
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
      return listNode;
    };
    return () => (
      <MenuContextProvider
        classNames={menuClassNames}
        styles={styles}
        onItemClick={onMergedItemClick}
        mode={mode === 'horizontal' ? 'vertical' : mode}
        itemIcon={mergedItemIcon.value}
        expandIcon={mergedExpandIcon.value}
      >
        <ListNode>
          <slot></slot>
        </ListNode>
      </MenuContextProvider>
    );
  },
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
      const childList = parseChildren(children, connectedKeyPath.value);
      let renderNode;
      if (measure) {
        renderNode = childList;
      } else {
        renderNode = <InternalSubMenu {...props}>{childList}</InternalSubMenu>;
      }
      return <PathTrackerContextProvider value={connectedKeyPath.value}>{renderNode}</PathTrackerContextProvider>;
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'SubMenu' : undefined },
);

export default SubMenu;
