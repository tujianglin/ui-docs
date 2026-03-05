import type { CSSMotionProps } from '@vc-com/motion';
import Overflow from '@vc-com/overflow';
import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { useId } from '@vc-com/util/lib/hooks/useId';
import isEqual from '@vc-com/util/lib/isEqual';
import { warning } from '@vc-com/util/lib/warning';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type CSSProperties } from 'vue';
import { useRef, type HTMLAttributes } from 'vue-jsx-vapor';
import type { VueNode } from '../../util/src/types';
import { IdContextProvider } from './context/IdContext';
import MenuContextProvider from './context/MenuContext';
import { PathRegisterContextProvider, PathUserContextProvider } from './context/PathContext';
import { PrivateContextProvider } from './context/PrivateContext';
import { getFocusableElements, refreshElements, useAccessibility } from './hooks/useAccessibility';
import useKeyRecords, { OVERFLOW_KEY } from './hooks/useKeyRecords';
import useMemoCallback from './hooks/useMemoCallback';
import type {
  BuiltinPlacements,
  Components,
  ItemType,
  MenuClickEventHandler,
  MenuInfo,
  MenuMode,
  PopupRender,
  RenderIconType,
  SelectEventHandler,
  SelectInfo,
  TriggerSubMenuAction,
} from './interface';
import MenuItem from './MenuItem';
import SubMenu, { type SemanticName } from './SubMenu';
import { parseItems } from './utils/nodeUtil';
import { warnItemProp } from './utils/warnUtil';

/**
 * Menu modify after refactor:
 * ## Add
 * - disabled
 *
 * ## Remove
 * - openTransitionName
 * - openAnimation
 * - onDestroy
 * - siderCollapsed: Seems antd do not use this prop (Need test in antd)
 * - collapsedWidth: Seems this logic should be handle by antd Layout.Sider
 */

// optimize for render
const EMPTY_LIST: string[] = [];

export interface MenuProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onClick' | 'onSelect' | 'dir' | 'style'> {
  prefixCls?: string;
  style?: CSSProperties;
  rootClassName?: string;
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  items?: ItemType[];

  disabled?: boolean;
  /** @private Disable auto overflow. Pls note the prop name may refactor since we do not final decided. */
  disabledOverflow?: boolean;

  /** direction of menu */
  direction?: 'ltr' | 'rtl';

  // Mode
  mode?: MenuMode;
  inlineCollapsed?: boolean;

  // Open control
  defaultOpenKeys?: string[];
  openKeys?: string[];

  // Active control
  activeKey?: string;
  defaultActiveFirst?: boolean;

  // Selection
  selectable?: boolean;
  multiple?: boolean;

  defaultSelectedKeys?: string[];
  selectedKeys?: string[];

  onSelect?: SelectEventHandler;
  onDeselect?: SelectEventHandler;

  // Level
  inlineIndent?: number;

  // Motion
  /** Menu motion define. Use `defaultMotions` if you need config motion of each mode */
  motion?: CSSMotionProps;
  /** Default menu motion of each mode */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMotions?: Partial<{ [key in MenuMode | 'other']: CSSMotionProps }>;

  // Popup
  subMenuOpenDelay?: number;
  subMenuCloseDelay?: number;
  forceSubMenuRender?: boolean;
  triggerSubMenuAction?: TriggerSubMenuAction;
  builtinPlacements?: BuiltinPlacements;

  // Icon
  itemIcon?: RenderIconType;
  expandIcon?: RenderIconType;
  overflowedIndicator?: VueNode;
  /** @private Internal usage. Do not use in your production. */
  overflowedIndicatorPopupClassName?: string;

  // >>>>> Function
  getPopupContainer?: (node: HTMLElement) => HTMLElement;

  // >>>>> Events
  onClick?: MenuClickEventHandler;
  onOpenChange?: (openKeys: string[]) => void;

  // >>>>> Internal
  /***
   * @private Only used for `pro-layout`. Do not use in your prod directly
   * and we do not promise any compatibility for this.
   */
  _internalRenderMenuItem?: (
    originNode: VueNode,
    menuItemProps: any,
    stateProps: {
      selected: boolean;
    },
  ) => VueNode;
  /***
   * @private Only used for `pro-layout`. Do not use in your prod directly
   * and we do not promise any compatibility for this.
   */
  _internalRenderSubMenuItem?: (
    originNode: VueNode,
    subMenuItemProps: any,
    stateProps: {
      selected: boolean;
      open: boolean;
      active: boolean;
      disabled: boolean;
    },
  ) => VueNode;

  /**
   * @private NEVER! EVER! USE IN PRODUCTION!!!
   * This is a hack API for `antd` to fix `findDOMNode` issue.
   * Not use it! Not accept any PR try to make it as normal API.
   * By zombieJ
   */
  _internalComponents?: Components;

  popupRender?: PopupRender;
}

interface LegacyMenuProps extends MenuProps {
  openTransitionName?: string;
  openAnimation?: string;
}

const Menu = defineComponent(
  ({
    prefixCls = 'rc-menu',
    rootClassName,
    style,
    class: className,
    styles,
    classNames: menuClassNames,
    tabindex = 0,
    items,
    direction,

    id,

    // Mode
    mode = 'vertical',
    inlineCollapsed,

    // Disabled
    disabled,
    disabledOverflow,

    // Open
    subMenuOpenDelay = 0.1,
    subMenuCloseDelay = 0.1,
    forceSubMenuRender,
    defaultOpenKeys,
    openKeys,

    // Active
    activeKey,
    defaultActiveFirst,

    // Selection
    selectable = true,
    multiple = false,
    defaultSelectedKeys,
    selectedKeys,
    onSelect,
    onDeselect,

    // Level
    inlineIndent = 24,

    // Motion
    motion,
    defaultMotions,

    // Popup
    triggerSubMenuAction = 'hover',
    builtinPlacements,

    // Icon
    itemIcon,
    expandIcon,
    overflowedIndicator = '...',
    overflowedIndicatorPopupClassName,

    // Function
    getPopupContainer,

    // Events
    onClick,
    onOpenChange,
    onKeydown,

    // Deprecated
    openAnimation,
    openTransitionName,

    // Internal
    _internalRenderMenuItem,
    _internalRenderSubMenuItem,

    _internalComponents,

    popupRender,
    ...restProps
  }: LegacyMenuProps) => {
    const slots = defineSlots();
    const mounted = ref(false);

    const childList = computed(() => parseItems(slots.default?.(), items, EMPTY_LIST, _internalComponents, prefixCls));

    const measureChildList = computed(() => parseItems(slots.default?.(), items, EMPTY_LIST, {}, prefixCls));

    const containerRef = useRef<HTMLUListElement>();

    const uuid = useId(id ? `rc-menu-uuid-${id}` : 'rc-menu-uuid');

    const isRtl = computed(() => direction === 'rtl');

    // ========================= Warn =========================
    if (process.env.NODE_ENV !== 'production') {
      warning(
        !openAnimation && !openTransitionName,
        '`openAnimation` and `openTransitionName` is removed. Please use `motion` or `defaultMotion` instead.',
      );
    }

    // ========================= Open =========================
    const [innerOpenKeys, setMergedOpenKeys] = useControlledState(
      defaultOpenKeys,
      computed(() => openKeys),
    );
    const mergedOpenKeys = computed(() => innerOpenKeys.value || EMPTY_LIST);

    // React 18 will merge mouse event which means we open key will not sync
    // ref: https://github.com/ant-design/ant-design/issues/38818
    const triggerOpenKeys = (keys: string[], forceFlush = false) => {
      function doUpdate() {
        setMergedOpenKeys(keys);
        onOpenChange?.(keys);
      }

      if (forceFlush) {
        nextTick(doUpdate);
      } else {
        doUpdate();
      }
    };

    // >>>>> Cache & Reset open keys when inlineCollapsed changed
    const inlineCacheOpenKeys = ref(mergedOpenKeys.value);

    const mountRef = shallowRef(false);

    // ========================= Mode =========================
    const { mergedMode, mergedInlineCollapsed } = $(
      reactiveComputed(() => {
        if ((mode === 'inline' || mode === 'vertical') && inlineCollapsed) {
          return { mergedMode: 'vertical' as MenuMode, mergedInlineCollapsed: inlineCollapsed };
        }
        return { mergedMode: mode, mergedInlineCollapsed: false };
      }),
    );

    const isInlineMode = computed(() => mergedMode === 'inline');

    const internalMode = ref(mergedMode);
    const internalInlineCollapsed = ref(mergedInlineCollapsed);

    watch(
      [() => mergedMode, () => mergedInlineCollapsed],
      () => {
        internalMode.value = mergedMode;
        internalInlineCollapsed.value = mergedInlineCollapsed;

        if (!mountRef.value) {
          return;
        }
        // Synchronously update MergedOpenKeys
        if (isInlineMode) {
          setMergedOpenKeys(inlineCacheOpenKeys.value);
        } else {
          // Trigger open event in case its in control
          triggerOpenKeys(EMPTY_LIST);
        }
      },
      { immediate: true, deep: true },
    );

    // ====================== Responsive ======================
    const lastVisibleIndex = ref(0);
    const allVisible = computed(
      () => lastVisibleIndex.value >= childList.value.length - 1 || internalMode.value !== 'horizontal' || disabledOverflow,
    );

    // Cache
    watch(
      mergedOpenKeys,
      () => {
        if (isInlineMode.value) {
          inlineCacheOpenKeys.value = mergedOpenKeys.value;
        }
      },
      { immediate: true, deep: true },
    );

    onMounted(() => {
      mountRef.value = true;
    });

    onBeforeUnmount(() => {
      mountRef.value = false;
    });

    // ========================= Path =========================
    const {
      registerPath,
      unregisterPath,
      refreshOverflowKeys,

      isSubPathKey,
      getKeyPath,
      getKeys,
      getSubPathKeys,
    } = useKeyRecords();

    const registerPathContext = computed(() => ({ registerPath, unregisterPath }));

    const pathUserContext = computed(() => ({ isSubPathKey }));

    onMounted(() => {
      watch(
        [lastVisibleIndex, allVisible],
        () => {
          refreshOverflowKeys(
            allVisible.value ? EMPTY_LIST : childList.value.slice(lastVisibleIndex.value + 1).map((child) => child.key as string),
          );
        },
        { immediate: true, deep: true },
      );
    });

    // ======================== Active ========================
    const [mergedActiveKey, setMergedActiveKey] = useControlledState(
      activeKey || ((defaultActiveFirst && childList[0]?.key) as string),
      computed(() => activeKey),
    );

    const onActive = useMemoCallback((key: string) => {
      setMergedActiveKey(key);
    });

    const onInactive = useMemoCallback(() => {
      setMergedActiveKey(undefined);
    });

    defineExpose({
      list: containerRef.value,
      focus: (options) => {
        const keys = getKeys();
        const { elements, key2element, element2key } = refreshElements(keys, uuid.value);
        const focusableElements = getFocusableElements(containerRef.value, elements);

        let shouldFocusKey: string;
        if (mergedActiveKey.value && keys.includes(mergedActiveKey.value)) {
          shouldFocusKey = mergedActiveKey.value;
        } else {
          shouldFocusKey = focusableElements[0]
            ? element2key.get(focusableElements[0])
            : (childList.value.find((node) => !node.props.disabled)?.key as string);
        }
        const elementToFocus = key2element.get(shouldFocusKey);

        if (shouldFocusKey && elementToFocus) {
          elementToFocus?.focus?.(options);
        }
      },
      findItem: ({ key: itemKey }) => {
        const keys = getKeys();
        const { key2element } = refreshElements(keys, uuid.value);
        return key2element.get(itemKey) || null;
      },
    });

    // ======================== Select ========================
    // >>>>> Select keys
    const [internalSelectKeys, setMergedSelectKeys] = useControlledState(
      defaultSelectedKeys || [],
      computed(() => selectedKeys),
    );
    const mergedSelectKeys = computed(() => {
      if (Array.isArray(internalSelectKeys.value)) {
        return internalSelectKeys.value;
      }

      if (internalSelectKeys.value === null || internalSelectKeys.value === undefined) {
        return EMPTY_LIST;
      }

      return [internalSelectKeys.value];
    });

    // >>>>> Trigger select
    const triggerSelection = (info: MenuInfo) => {
      if (selectable) {
        // Insert or Remove
        const { key: targetKey } = info;
        const exist = mergedSelectKeys.value.includes(targetKey);
        let newSelectKeys: string[];

        if (multiple) {
          if (exist) {
            newSelectKeys = mergedSelectKeys.value.filter((key) => key !== targetKey);
          } else {
            newSelectKeys = [...mergedSelectKeys.value, targetKey];
          }
        } else {
          newSelectKeys = [targetKey];
        }

        setMergedSelectKeys(newSelectKeys);

        // Trigger event
        const selectInfo: SelectInfo = {
          ...info,
          selectedKeys: newSelectKeys,
        };

        if (exist) {
          onDeselect?.(selectInfo);
        } else {
          onSelect?.(selectInfo);
        }
      }

      // Whatever selectable, always close it
      if (!multiple && mergedOpenKeys.value.length && internalMode.value !== 'inline') {
        triggerOpenKeys(EMPTY_LIST);
      }
    };

    // ========================= Open =========================
    /**
     * Click for item. SubMenu do not have selection status
     */
    const onInternalClick = useMemoCallback((info: MenuInfo) => {
      onClick?.(warnItemProp(info));
      triggerSelection(info);
    });

    const onInternalOpenChange = useMemoCallback((key: string, open: boolean) => {
      let newOpenKeys = mergedOpenKeys.value.filter((k) => k !== key);

      if (open) {
        newOpenKeys.push(key);
      } else if (internalMode.value !== 'inline') {
        // We need find all related popup to close
        const subPathKeys = getSubPathKeys(key);
        newOpenKeys = newOpenKeys.filter((k) => !subPathKeys.has(k));
      }

      if (!isEqual(mergedOpenKeys.value, newOpenKeys, true)) {
        triggerOpenKeys(newOpenKeys, true);
      }
    });

    // ==================== Accessibility =====================
    const triggerAccessibilityOpen = (key: string, open?: boolean) => {
      const nextOpen = open ?? !mergedOpenKeys.value.includes(key);

      onInternalOpenChange(key, nextOpen);
    };

    const onInternalKeyDown = useAccessibility(
      internalMode,
      mergedActiveKey,
      isRtl,
      uuid,

      containerRef,
      getKeys,
      getKeyPath,

      setMergedActiveKey,
      triggerAccessibilityOpen,

      onKeydown,
    );

    // ======================== Effect ========================
    onMounted(() => {
      mounted.value = true;
    });

    // ======================= Context ========================
    const privateContext = computed(() => ({
      _internalRenderMenuItem,
      _internalRenderSubMenuItem,
    }));

    // ======================== Render ========================
    return () => {
      // >>>>> Children
      const wrappedChildList =
        internalMode.value !== 'horizontal' || disabledOverflow
          ? childList.value
          : // Need wrap for overflow dropdown that do not response for open
            childList.value.map((child, index) => (
              // Always wrap provider to avoid sub node re-mount
              <MenuContextProvider
                key={child.key}
                overflowDisabled={index > lastVisibleIndex.value}
                classNames={menuClassNames}
                styles={styles}
              >
                {child}
              </MenuContextProvider>
            ));

      // >>>>> Container
      const container = (
        <Overflow
          id={id}
          ref={containerRef as any}
          prefixCls={`${prefixCls}-overflow`}
          component="ul"
          itemComponent={MenuItem}
          class={clsx(
            prefixCls,
            `${prefixCls}-root`,
            `${prefixCls}-${internalMode.value}`,
            className,
            {
              [`${prefixCls}-inline-collapsed`]: internalInlineCollapsed.value,
              [`${prefixCls}-rtl`]: isRtl.value,
            },
            rootClassName,
          )}
          dir={direction}
          style={style}
          role="menu"
          tabindex={tabindex}
          data={wrappedChildList}
          renderRawItem={(node) => node}
          renderRawRest={(omitItems) => {
            // We use origin list since wrapped list use context to prevent open
            const len = omitItems.length;

            const originOmitItems = len ? childList.value.slice(-len) : null;

            return (
              <SubMenu
                eventKey={OVERFLOW_KEY}
                title={overflowedIndicator}
                disabled={allVisible.value}
                internalPopupClose={len === 0}
                popupClassName={overflowedIndicatorPopupClassName}
              >
                {originOmitItems}
              </SubMenu>
            );
          }}
          maxCount={internalMode.value !== 'horizontal' || disabledOverflow ? Overflow.INVALIDATE : Overflow.RESPONSIVE}
          ssr="full"
          data-menu-list
          onVisibleChange={(newLastIndex) => {
            lastVisibleIndex.value = newLastIndex;
          }}
          onKeydown={onInternalKeyDown}
          {...restProps}
        />
      );
      // >>>>> Render
      return (
        <PrivateContextProvider value={privateContext.value}>
          <IdContextProvider value={uuid.value}>
            <MenuContextProvider
              prefixCls={prefixCls}
              rootClassName={rootClassName}
              classNames={menuClassNames}
              styles={styles}
              mode={internalMode.value}
              openKeys={mergedOpenKeys.value}
              rtl={isRtl.value}
              // Disabled
              disabled={disabled}
              // Motion
              motion={mounted.value ? motion : null}
              defaultMotions={mounted.value ? defaultMotions : null}
              // Active
              activeKey={mergedActiveKey.value}
              onActive={onActive}
              onInactive={onInactive}
              // Selection
              selectedKeys={mergedSelectKeys.value}
              // Level
              inlineIndent={inlineIndent}
              // Popup
              subMenuOpenDelay={subMenuOpenDelay}
              subMenuCloseDelay={subMenuCloseDelay}
              forceSubMenuRender={forceSubMenuRender}
              builtinPlacements={builtinPlacements}
              triggerSubMenuAction={triggerSubMenuAction}
              getPopupContainer={getPopupContainer}
              // Icon
              itemIcon={itemIcon}
              expandIcon={expandIcon}
              // Events
              onItemClick={onInternalClick}
              onOpenChange={onInternalOpenChange}
              popupRender={popupRender}
            >
              <PathUserContextProvider value={pathUserContext.value}>{container}</PathUserContextProvider>

              {/* Measure menu keys. Add `display: none` to avoid some developer miss use the Menu */}
              <div style={{ display: 'none' }} aria-hidden>
                <PathRegisterContextProvider value={registerPathContext.value}>
                  {measureChildList.value}
                </PathRegisterContextProvider>
              </div>
            </MenuContextProvider>
          </IdContextProvider>
        </PrivateContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);

export default Menu;
