// Accessibility https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Tab_Role
import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import isMobile from '@vc-com/util/lib/isMobile';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, onMounted, ref, watch, type CSSProperties } from 'vue';
import type { HTMLAttributes } from 'vue-jsx-vapor';
import { useTabContextProvider, type TabContextProps } from './TabContext';
import TabNavListWrapper from './TabNavList/Wrapper';
import TabPanelList from './TabPanelList';
import useAnimateConfig from './hooks/useAnimateConfig';
import type { GetIndicatorSize } from './hooks/useIndicator';
import type {
  AnimatedConfig,
  EditableConfig,
  MoreProps,
  OnTabScroll,
  RenderTabBar,
  Tab,
  TabBarExtraContent,
  TabPosition,
  TabsLocale,
} from './interface';

/**
 * Should added antd:
 * - type
 *
 * Removed:
 * - onNextClick
 * - onPrevClick
 * - keyboard
 */

// Used for accessibility
let uuid = 0;

export type SemanticName = 'popup' | 'item' | 'indicator' | 'content' | 'header' | 'remove';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  id?: string;

  items?: Tab[];

  activeKey?: string;
  defaultActiveKey?: string;
  direction?: 'ltr' | 'rtl';
  animated?: boolean | AnimatedConfig;
  renderTabBar?: RenderTabBar;
  tabBarExtraContent?: TabBarExtraContent;
  tabBarGutter?: number;
  tabBarStyle?: CSSProperties;
  tabPosition?: TabPosition;
  destroyOnHidden?: boolean;

  onChange?: (activeKey: string) => void;
  onTabClick?: (activeKey: string, e: KeyboardEvent | MouseEvent) => void;
  onTabScroll?: OnTabScroll;

  editable?: EditableConfig;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;

  // Accessibility
  locale?: TabsLocale;

  // Icons
  more?: MoreProps;
  /** @private Internal usage. Not promise will rename in future */
  popupClassName?: string;
  indicator?: {
    size?: GetIndicatorSize;
    align?: 'start' | 'center' | 'end';
  };
}

const Tabs = defineComponent(
  ({
    id,
    prefixCls = 'rc-tabs',
    class: className,
    items,
    direction,
    activeKey,
    defaultActiveKey,
    editable,
    animated,
    tabPosition = 'top',
    tabBarGutter,
    tabBarStyle,
    tabBarExtraContent,
    locale,
    more,
    destroyOnHidden,
    renderTabBar,
    onChange,
    onTabClick,
    onTabScroll,
    getPopupContainer,
    popupClassName,
    indicator,
    classNames: tabsClassNames,
    styles,
    ...restProps
  }: TabsProps) => {
    const tabs = computed<Tab[]>(() => (items || []).filter((item) => item && typeof item === 'object' && 'key' in item));
    const rtl = computed(() => direction === 'rtl');

    const mergedAnimated = computed(() => useAnimateConfig(animated));

    // ======================== Mobile ========================
    const mobile = ref(false);
    onMounted(() => {
      // Only update on the client side
      mobile.value = isMobile();
    });

    // ====================== Active Key ======================
    const [mergedActiveKey, setMergedActiveKey] = useControlledState<string>(
      defaultActiveKey ?? tabs.value[0]?.key,
      computed(() => activeKey),
    );
    const activeIndex = ref(tabs.value.findIndex((tab) => tab.key === mergedActiveKey.value));

    // Reset active key if not exist anymore
    watch(
      [tabs, mergedActiveKey, activeIndex],
      () => {
        let newActiveIndex = tabs.value.findIndex((tab) => tab.key === mergedActiveKey.value);
        if (newActiveIndex === -1) {
          newActiveIndex = Math.max(0, Math.min(activeIndex.value, tabs.value.length - 1));
          setMergedActiveKey(tabs.value[newActiveIndex]?.key);
        }
        activeIndex.value = newActiveIndex;
      },
      { immediate: true, deep: true },
    );

    // ===================== Accessibility ====================
    const [mergedId, setMergedId] = useControlledState(
      null,
      computed(() => id),
    );

    // Async generate id to avoid ssr mapping failed
    onMounted(() => {
      if (!id) {
        setMergedId(`rc-tabs-${process.env.NODE_ENV === 'test' ? 'test' : uuid}`);
        uuid += 1;
      }
    });

    // ======================== Events ========================
    function onInternalTabClick(key: string, e: MouseEvent | KeyboardEvent) {
      onTabClick?.(key, e);
      const isActiveChanged = key !== mergedActiveKey.value;
      setMergedActiveKey(key);
      if (isActiveChanged) {
        onChange?.(key);
      }
    }

    // ======================== Render ========================
    const sharedProps = reactiveComputed(() => ({
      id: mergedId.value,
      activeKey: mergedActiveKey.value,
      animated: mergedAnimated.value,
      tabPosition,
      rtl: rtl.value,
      mobile: mobile.value,
    }));

    const tabNavBarProps = reactiveComputed(() => ({
      ...sharedProps,
      editable,
      locale,
      more,
      tabBarGutter,
      onTabClick: onInternalTabClick,
      onTabScroll,
      extra: tabBarExtraContent,
      style: tabBarStyle,
      getPopupContainer,
      popupClassName: clsx(popupClassName, tabsClassNames?.popup),
      indicator,
      styles,
      classNames: tabsClassNames,
    }));

    const memoizedValue = reactiveComputed<TabContextProps>(() => {
      return { tabs: tabs.value, prefixCls };
    });

    useTabContextProvider(memoizedValue);
    return () => (
      <div
        ref={ref}
        id={id}
        class={clsx(
          prefixCls,
          `${prefixCls}-${tabPosition}`,
          {
            [`${prefixCls}-mobile`]: mobile.value,
            [`${prefixCls}-editable`]: editable,
            [`${prefixCls}-rtl`]: rtl.value,
          },
          className,
        )}
        {...restProps}
      >
        {/* @ts-ignore */}
        <TabNavListWrapper {...tabNavBarProps} renderTabBar={renderTabBar} />
        <TabPanelList
          destroyOnHidden={destroyOnHidden}
          {...sharedProps}
          contentStyle={styles?.content}
          contentClassName={tabsClassNames?.content}
          animated={mergedAnimated.value}
        />
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Tabs' : undefined },
);

export default Tabs;
