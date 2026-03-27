// zombieJ: To compatible with `renderTabBar` usage.

import { defineComponent } from 'vue';
import type { TabNavListProps } from '.';
import TabNavList from '.';

export type TabNavListWrapperProps = Required<Omit<TabNavListProps, 'children' | 'className'>> & TabNavListProps;

// We have to create a TabNavList components.
const TabNavListWrapper = defineComponent(
  ({ renderTabBar, ...restProps }: TabNavListWrapperProps) => {
    return () => {
      if (renderTabBar) {
        return renderTabBar(restProps, TabNavList) as any;
      }

      return <TabNavList {...restProps} />;
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'TabNavListWrapper' : undefined },
);

export default TabNavListWrapper;
