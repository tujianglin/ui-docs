import ResizeObserver from '@vc-com/resize-observer';
import { useComposeRef } from '@vc-com/util/lib/ref';
import type { VueNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, shallowRef, watch, type CSSProperties, type Ref } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import { isDOM } from '../../../util/src/Dom/findDOMNode';
import { useTabContextInject } from '../TabContext';
import type { SemanticName } from '../Tabs';
import type { GetIndicatorSize } from '../hooks/useIndicator';
import useIndicator from '../hooks/useIndicator';
import useOffsets from '../hooks/useOffsets';
import useSyncState from '../hooks/useSyncState';
import useTouchMove from '../hooks/useTouchMove';
import useUpdate, { useUpdateState } from '../hooks/useUpdate';
import useVisibleRange from '../hooks/useVisibleRange';
import type {
  AnimatedConfig,
  EditableConfig,
  MoreProps,
  OnTabScroll,
  RenderTabBar,
  SizeInfo,
  TabBarExtraContent,
  TabPosition,
  TabSizeMap,
  TabsLocale,
} from '../interface';
import { genDataNodeKey, getRemovable } from '../util';
import AddButton from './AddButton';
import ExtraContent from './ExtraContent';
import OperationNode from './OperationNode';
import TabNode from './TabNode';

export interface TabNavListProps {
  id: string;
  tabPosition: TabPosition;
  activeKey: string;
  rtl: boolean;
  animated?: AnimatedConfig;
  extra?: TabBarExtraContent;
  editable?: EditableConfig;
  more?: MoreProps;
  mobile: boolean;
  tabBarGutter?: number;
  renderTabBar?: RenderTabBar;
  class?: string;
  style?: CSSProperties;
  locale?: TabsLocale;
  onTabClick: (activeKey: string, e) => void;
  onTabScroll?: OnTabScroll;
  children?: (node: VueNode) => VueNode;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  popupClassName?: string;
  indicator?: {
    size?: GetIndicatorSize;
    align?: 'start' | 'center' | 'end';
  };
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
}

const getTabSize = (tab: HTMLElement, containerRect: { left: number; top: number }) => {
  // tabListRef
  const { offsetWidth, offsetHeight, offsetTop, offsetLeft } = tab;
  const { width, height, left, top } = tab.getBoundingClientRect();

  // Use getBoundingClientRect to avoid decimal inaccuracy
  if (Math.abs(width - offsetWidth) < 1) {
    return [width, height, left - containerRect.left, top - containerRect.top];
  }

  return [offsetWidth, offsetHeight, offsetLeft, offsetTop];
};

const getSize = (refObj: Ref<HTMLElement>): SizeInfo => {
  const { offsetWidth = 0, offsetHeight = 0 } = refObj.value || {};

  // Use getBoundingClientRect to avoid decimal inaccuracy
  if (isDOM(refObj.value)) {
    const { width, height } = refObj.value.getBoundingClientRect();

    if (Math.abs(width - offsetWidth) < 1) {
      return [width, height];
    }
  }

  return [offsetWidth, offsetHeight];
};

/**
 * Convert `SizeInfo` to unit value. Such as [123, 456] with `top` position get `123`
 */
const getUnitValue = (size: SizeInfo, tabPositionTopOrBottom: boolean) => {
  return size[tabPositionTopOrBottom ? 0 : 1];
};

const TabNavList = defineComponent(
  ({
    class: className,
    style,
    id,
    animated,
    activeKey,
    rtl,
    extra,
    editable,
    locale,
    tabPosition,
    tabBarGutter,
    children,
    onTabClick,
    onTabScroll,
    indicator,
    classNames: tabsClassNames,
    styles,
  }: TabNavListProps) => {
    const props = useFullProps() as TabNavListProps;
    const { prefixCls, tabs } = $(useTabContextInject());
    const containerRef = useRef<HTMLDivElement>(null);
    const extraLeftRef = useRef<HTMLDivElement>(null);
    const extraRightRef = useRef<HTMLDivElement>(null);
    const tabsWrapperRef = useRef<HTMLDivElement>(null);
    const tabListRef = useRef<HTMLDivElement>(null);
    const operationsRef = useRef<HTMLDivElement>(null);
    const innerAddButtonRef = useRef<HTMLButtonElement>(null);

    const tabPositionTopOrBottom = computed(() => tabPosition === 'top' || tabPosition === 'bottom');

    const [transformLeft, setTransformLeft] = useSyncState(0, (next, prev) => {
      if (tabPositionTopOrBottom.value && onTabScroll) {
        onTabScroll({ direction: next > prev ? 'left' : 'right' });
      }
    });
    const [transformTop, setTransformTop] = useSyncState(0, (next, prev) => {
      if (!tabPositionTopOrBottom.value && onTabScroll) {
        onTabScroll({ direction: next > prev ? 'top' : 'bottom' });
      }
    });

    const containerExcludeExtraSize = ref<SizeInfo>([0, 0]);
    const tabContentSize = ref<SizeInfo>([0, 0]);
    const addSize = ref<SizeInfo>([0, 0]);
    const operationSize = ref<SizeInfo>([0, 0]);

    const [tabSizes, setTabSizes] = useUpdateState<TabSizeMap>(new Map());
    // @ts-ignore
    const tabOffsets = useOffsets(
      computed(() => tabs),
      tabSizes,
      computed(() => tabContentSize.value[0]),
    );

    // ========================== Unit =========================
    const containerExcludeExtraSizeValue = computed(() =>
      getUnitValue(containerExcludeExtraSize.value, tabPositionTopOrBottom.value),
    );
    const tabContentSizeValue = computed(() => getUnitValue(tabContentSize.value, tabPositionTopOrBottom.value));
    const addSizeValue = computed(() => getUnitValue(addSize.value, tabPositionTopOrBottom.value));
    const operationSizeValue = computed(() => getUnitValue(operationSize.value, tabPositionTopOrBottom.value));

    const needScroll = computed(
      () => Math.floor(containerExcludeExtraSizeValue.value) < Math.floor(tabContentSizeValue.value + addSizeValue.value),
    );
    const visibleTabContentValue = computed(() =>
      needScroll.value
        ? containerExcludeExtraSizeValue.value - operationSizeValue.value
        : containerExcludeExtraSizeValue.value - addSizeValue.value,
    );

    // ========================== Util =========================
    const operationsHiddenClassName = computed(() => `${prefixCls}-nav-operations-hidden`);

    const { transformMin, transformMax } = $(
      reactiveComputed(() => {
        let transformMin = 0;
        let transformMax = 0;

        if (!tabPositionTopOrBottom.value) {
          transformMin = Math.min(0, visibleTabContentValue.value - tabContentSizeValue.value);
          transformMax = 0;
        } else if (rtl) {
          transformMin = 0;
          transformMax = Math.max(0, tabContentSizeValue.value - visibleTabContentValue.value);
        } else {
          transformMin = Math.min(0, visibleTabContentValue.value - tabContentSizeValue.value);
          transformMax = 0;
        }
        return { transformMin, transformMax };
      }),
    );

    function alignInRange(value: number): number {
      if (value < transformMin) {
        return transformMin;
      }
      if (value > transformMax) {
        return transformMax;
      }
      return value;
    }

    // ========================= Mobile ========================
    const touchMovingRef = shallowRef<ReturnType<typeof setTimeout>>(null);

    const lockAnimation = ref<number>();

    function doLockAnimation() {
      lockAnimation.value = Date.now();
    }

    function clearTouchMoving() {
      if (touchMovingRef.value) {
        clearTimeout(touchMovingRef.value);
      }
    }

    useTouchMove(tabsWrapperRef, (offsetX, offsetY) => {
      function doMove(setState, offset: number) {
        setState((value) => {
          const newValue = alignInRange(value + offset);
          return newValue;
        });
      }

      // Skip scroll if place is enough
      if (!needScroll.value) {
        return false;
      }

      if (tabPositionTopOrBottom.value) {
        doMove(setTransformLeft, offsetX);
      } else {
        doMove(setTransformTop, offsetY);
      }

      clearTouchMoving();
      doLockAnimation();

      return true;
    });

    watch(
      lockAnimation,
      (_n, _o, onCleanup) => {
        clearTouchMoving();
        if (lockAnimation.value) {
          touchMovingRef.value = setTimeout(() => {
            lockAnimation.value = 0;
          }, 100);
        }

        onCleanup(clearTouchMoving);
      },
      { immediate: true },
    );

    // ===================== Visible Range =====================
    // Render tab node & collect tab offset
    const { visibleStart, visibleEnd } = $(
      // @ts-ignore
      useVisibleRange(
        tabOffsets,
        // Container
        visibleTabContentValue,
        // Transform
        computed(() => (tabPositionTopOrBottom.value ? transformLeft.value : transformTop.value)),
        // Tabs
        tabContentSizeValue,
        // Add
        addSizeValue,
        // Operation
        operationSizeValue,
        reactiveComputed(() => ({ ...props, tabs })),
      ),
    );

    // ========================= Scroll ========================
    const scrollToTab = (key = activeKey) => {
      const tabOffset = tabOffsets.value.get(key) || {
        width: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
      };

      if (tabPositionTopOrBottom) {
        // ============ Align with top & bottom ============
        let newTransform = transformLeft.value;

        // RTL
        if (rtl) {
          if (tabOffset.right < transformLeft.value) {
            newTransform = tabOffset.right;
          } else if (tabOffset.right + tabOffset.width > transformLeft.value + visibleTabContentValue.value) {
            newTransform = tabOffset.right + tabOffset.width - visibleTabContentValue.value;
          }
        }
        // LTR
        else if (tabOffset.left < -transformLeft.value) {
          newTransform = -tabOffset.left;
        } else if (tabOffset.left + tabOffset.width > -transformLeft.value + visibleTabContentValue.value) {
          newTransform = -(tabOffset.left + tabOffset.width - visibleTabContentValue.value);
        }

        setTransformTop(0);
        setTransformLeft(alignInRange(newTransform));
      } else {
        // ============ Align with left & right ============
        let newTransform = transformTop.value;

        if (tabOffset.top < -transformTop.value) {
          newTransform = -tabOffset.top;
        } else if (tabOffset.top + tabOffset.height > -transformTop.value + visibleTabContentValue.value) {
          newTransform = -(tabOffset.top + tabOffset.height - visibleTabContentValue.value);
        }

        setTransformLeft(0);
        setTransformTop(alignInRange(newTransform));
      }
    };

    // ========================= Focus =========================
    const focusKey = ref<string>();
    const isMouse = ref(false);

    // @ts-ignore
    const enabledTabs = computed(() => tabs.filter((tab) => !tab.disabled).map((tab) => tab.key));

    const onOffset = (offset: number) => {
      const currentIndex = enabledTabs.value.indexOf(focusKey.value || activeKey);
      const len = enabledTabs.value.length;
      const nextIndex = (currentIndex + offset + len) % len;
      const newKey = enabledTabs.value[nextIndex];
      focusKey.value = newKey;
    };

    const handleRemoveTab = (removalTabKey: string, e: MouseEvent | KeyboardEvent) => {
      const removeIndex = enabledTabs.value.indexOf(removalTabKey);
      const removeTab = tabs.find((tab) => tab.key === removalTabKey);
      const removable = getRemovable(removeTab?.closable, removeTab?.closeIcon, editable, removeTab?.disabled);

      if (removable) {
        e.preventDefault();
        e.stopPropagation();
        editable.onEdit('remove', { key: removalTabKey, event: e });

        // when remove last tab, focus previous tab
        if (removeIndex === enabledTabs.value.length - 1) {
          onOffset(-1);
        } else {
          onOffset(1);
        }
      }
    };

    const handleMouseDown = (key: string, e) => {
      isMouse.value = true;
      // Middle mouse button
      if (e.button === 1) {
        handleRemoveTab(key, e);
      }
    };

    const handleKeyDown = (e) => {
      const { code } = e;

      const isRTL = rtl && tabPositionTopOrBottom.value;
      const firstEnabledTab = enabledTabs.value[0];
      const lastEnabledTab = enabledTabs.value[enabledTabs.value.length - 1];

      switch (code) {
        // LEFT
        case 'ArrowLeft': {
          if (tabPositionTopOrBottom.value) {
            onOffset(isRTL ? 1 : -1);
          }
          break;
        }

        // RIGHT
        case 'ArrowRight': {
          if (tabPositionTopOrBottom.value) {
            onOffset(isRTL ? -1 : 1);
          }
          break;
        }

        // UP
        case 'ArrowUp': {
          e.preventDefault();
          if (!tabPositionTopOrBottom.value) {
            onOffset(-1);
          }
          break;
        }

        // DOWN
        case 'ArrowDown': {
          e.preventDefault();
          if (!tabPositionTopOrBottom.value) {
            onOffset(1);
          }
          break;
        }

        // HOME
        case 'Home': {
          e.preventDefault();
          focusKey.value = firstEnabledTab;
          break;
        }

        // END
        case 'End': {
          e.preventDefault();
          focusKey.value = lastEnabledTab;
          break;
        }

        // Enter & Space
        case 'Enter':
        case 'Space': {
          e.preventDefault();
          onTabClick(focusKey.value ?? activeKey, e);
          break;
        }
        // Backspace
        case 'Backspace':
        case 'Delete': {
          handleRemoveTab(focusKey.value, e);
          break;
        }
      }
    };

    // ========================== Tab ==========================
    const tabNodeStyle = computed(() => {
      const result: CSSProperties = {};
      if (tabPositionTopOrBottom.value) {
        result[rtl ? 'marginRight' : 'marginLeft'] = `${tabBarGutter}px`;
      } else {
        result.marginTop = `${tabBarGutter}px`;
      }
      return result;
    });

    // Update buttons records
    const updateTabSizes = () =>
      setTabSizes(() => {
        const newSizes: TabSizeMap = new Map();
        const listRect = tabListRef.value?.getBoundingClientRect();

        tabs.forEach(({ key }) => {
          const btnNode = tabListRef.value?.querySelector<HTMLElement>(`[data-node-key="${genDataNodeKey(key)}"]`);
          if (btnNode) {
            const [width, height, left, top] = getTabSize(btnNode, listRect);
            newSizes.set(key, { width, height, left, top });
          }
        });
        return newSizes;
      });

    watch(
      tabs,
      () => {
        updateTabSizes();
      },
      { immediate: true, deep: true },
    );
    const onListHolderResize = useUpdate(() => {
      // Update wrapper records
      const newOperationSize = getSize(operationsRef);
      const containerSize = getSize(containerRef);
      const extraLeftSize = getSize(extraLeftRef);
      const extraRightSize = getSize(extraRightRef);
      containerExcludeExtraSize.value = [
        containerSize[0] - extraLeftSize[0] - extraRightSize[0],
        containerSize[1] - extraLeftSize[1] - extraRightSize[1],
      ];

      const newAddSize = getSize(innerAddButtonRef);
      addSize.value = newAddSize;

      // const newOperationSize = getSize(operationsRef, 'operationsRef');
      operationSize.value = newOperationSize;

      // Which includes add button size
      const tabContentFullSize = getSize(tabListRef);
      tabContentSize.value = [tabContentFullSize[0] - newAddSize[0], tabContentFullSize[1] - newAddSize[1]];

      // Update buttons records
      updateTabSizes();
    });

    // ======================== Dropdown =======================
    const startHiddenTabs = computed(() => tabs.slice(0, visibleStart));
    const endHiddenTabs = computed(() => tabs.slice(visibleEnd + 1));
    const hiddenTabs = computed(() => [...startHiddenTabs.value, ...endHiddenTabs.value]);

    // =================== Link & Operations ===================
    const activeTabOffset = computed(() => tabOffsets.value.get(activeKey));
    const { style: indicatorStyle } = useIndicator(
      reactiveComputed(() => ({
        activeTabOffset: activeTabOffset.value,
        horizontal: tabPositionTopOrBottom.value,
        indicator,
        rtl,
      })),
    );

    // ========================= Effect ========================
    watch(
      [() => activeKey, () => transformMin, () => transformMax, activeTabOffset, tabOffsets, tabPositionTopOrBottom],
      () => {
        scrollToTab();
      },
      { immediate: true, deep: true },
    );

    // Should recalculate when rtl changed
    watch(
      () => rtl,
      () => {
        onListHolderResize();
      },
      { immediate: true, deep: true },
    );

    // ========================= Render ========================

    return () => {
      const hasDropdown = !!hiddenTabs.value.length;
      const wrapPrefix = `${prefixCls}-nav-wrap`;
      let pingLeft: boolean;
      let pingRight: boolean;
      let pingTop: boolean;
      let pingBottom: boolean;

      if (tabPositionTopOrBottom.value) {
        if (rtl) {
          pingRight = transformLeft.value > 0;
          pingLeft = transformLeft.value !== transformMax;
        } else {
          pingLeft = transformLeft.value < 0;
          pingRight = transformLeft.value !== transformMin;
        }
      } else {
        pingTop = transformTop.value < 0;
        pingBottom = transformTop.value !== transformMin;
      }
      const tabNodes = tabs.map((tab, i) => {
        // @ts-ignore
        const { key } = tab;
        return (
          <TabNode
            id={id}
            prefixCls={prefixCls}
            key={key}
            tab={tab}
            classNames={{
              item: tabsClassNames?.item,
              remove: tabsClassNames?.remove,
            }}
            styles={{
              /* first node should not have margin left */
              item: i === 0 ? styles?.item : { ...tabNodeStyle.value, ...styles?.item },
              remove: styles?.remove,
            }}
            closable={tab.closable}
            editable={editable}
            active={key === activeKey}
            focus={key === focusKey.value}
            renderWrapper={children}
            removeAriaLabel={locale?.removeAriaLabel}
            tabCount={enabledTabs.value.length}
            currentPosition={i + 1}
            onClick={(e) => {
              onTabClick(key, e);
            }}
            onKeydown={handleKeyDown}
            onFocus={() => {
              if (!isMouse.value) {
                focusKey.value = key;
              }
              scrollToTab(key);
              doLockAnimation();
              if (!tabsWrapperRef.value) {
                return;
              }
              // Focus element will make scrollLeft change which we should reset back
              if (!rtl) {
                tabsWrapperRef.value.scrollLeft = 0;
              }
              tabsWrapperRef.value.scrollTop = 0;
            }}
            onBlur={() => {
              focusKey.value = undefined;
            }}
            onMousedown={(e) => handleMouseDown(key, e)}
            onMouseup={() => {
              isMouse.value = false;
            }}
          />
        );
      });
      return (
        <ResizeObserver onResize={onListHolderResize}>
          <div
            ref={useComposeRef([containerRef])}
            role="tablist"
            aria-orientation={tabPositionTopOrBottom.value ? 'horizontal' : 'vertical'}
            class={clsx(`${prefixCls}-nav`, className, tabsClassNames?.header)}
            style={{ ...styles?.header, ...style }}
            onKeydown={() => {
              // No need animation when use keyboard
              doLockAnimation();
            }}
          >
            <ExtraContent ref={extraLeftRef} position="left" extra={extra} prefixCls={prefixCls} />

            <ResizeObserver onResize={onListHolderResize}>
              <div
                class={clsx(wrapPrefix, {
                  [`${wrapPrefix}-ping-left`]: pingLeft,
                  [`${wrapPrefix}-ping-right`]: pingRight,
                  [`${wrapPrefix}-ping-top`]: pingTop,
                  [`${wrapPrefix}-ping-bottom`]: pingBottom,
                })}
                ref={tabsWrapperRef}
              >
                <ResizeObserver onResize={onListHolderResize}>
                  <div
                    ref={tabListRef}
                    class={`${prefixCls}-nav-list`}
                    style={{
                      transform: `translate(${transformLeft.value}px, ${transformTop.value}px)`,
                      transition: lockAnimation.value ? 'none' : undefined,
                    }}
                  >
                    {tabNodes}
                    <AddButton
                      ref={innerAddButtonRef}
                      prefixCls={prefixCls}
                      locale={locale}
                      editable={editable}
                      style={{
                        ...(tabNodes.length === 0 ? undefined : tabNodeStyle.value),
                        visibility: hasDropdown ? 'hidden' : null,
                      }}
                    />
                    <div
                      class={clsx(`${prefixCls}-ink-bar`, tabsClassNames?.indicator, {
                        [`${prefixCls}-ink-bar-animated`]: animated.inkBar,
                      })}
                      style={{ ...indicatorStyle.value, ...styles?.indicator }}
                    />
                  </div>
                </ResizeObserver>
              </div>
            </ResizeObserver>

            <OperationNode
              {...props}
              removeAriaLabel={locale?.removeAriaLabel}
              ref={operationsRef}
              prefixCls={prefixCls}
              tabs={hiddenTabs.value}
              class={!hasDropdown && operationsHiddenClassName.value}
              popupStyle={styles?.popup}
              tabMoving={!!lockAnimation.value}
            />

            <ExtraContent ref={extraRightRef} position="right" extra={extra} prefixCls={prefixCls} />
          </div>
        </ResizeObserver>
      );
    };
  },
  { inheritAttrs: false },
);

export default TabNavList;
