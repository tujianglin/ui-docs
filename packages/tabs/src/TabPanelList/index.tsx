import CSSMotion from '@vc-com/motion';
import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import type { AnimatedConfig, TabPosition } from '../interface';
import { useTabContextInject } from '../TabContext';
import TabPane from './TabPane';

export interface TabPanelListProps {
  activeKey: string;
  id: string;
  animated?: AnimatedConfig;
  tabPosition?: TabPosition;
  destroyOnHidden?: boolean;
  contentStyle?: CSSProperties;
  contentClassName?: string;
}

const TabPanelList = defineComponent(
  ({ id, activeKey, animated, tabPosition, destroyOnHidden, contentStyle, contentClassName }: TabPanelListProps) => {
    const { prefixCls, tabs } = $(useTabContextInject());
    return () => {
      const tabPaneAnimated = animated.tabPane;

      const tabPanePrefixCls = `${prefixCls}-tabpane`;

      return (
        <div class={clsx(`${prefixCls}-content-holder`)}>
          <div
            class={clsx(`${prefixCls}-content`, `${prefixCls}-content-${tabPosition}`, {
              [`${prefixCls}-content-animated`]: tabPaneAnimated,
            })}
          >
            {/* @ts-ignore */}
            {tabs.map((item) => {
              const {
                key,
                forceRender,
                style: paneStyle,
                class: paneClassName,
                destroyOnHidden: itemDestroyOnHidden,
                ...restTabProps
              } = item;
              const active = key === activeKey;
              return (
                <CSSMotion
                  key={key}
                  visible={active}
                  forceRender={forceRender}
                  removeOnLeave={!!(destroyOnHidden ?? itemDestroyOnHidden)}
                  leavedClassName={`${tabPanePrefixCls}-hidden`}
                  {...animated.tabPaneMotion}
                >
                  {({ style: motionStyle, class: motionClassName, ref: motionRef }) => (
                    <TabPane
                      {...restTabProps}
                      prefixCls={tabPanePrefixCls}
                      id={id}
                      tabKey={key}
                      animated={tabPaneAnimated}
                      active={active}
                      style={{ ...contentStyle, ...paneStyle, ...motionStyle }}
                      class={clsx(contentClassName, paneClassName, motionClassName)}
                      ref={motionRef}
                    />
                  )}
                </CSSMotion>
              );
            })}
          </div>
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default TabPanelList;
