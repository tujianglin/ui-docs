import { filterEmpty } from '@vc-com/util/lib/props-util';
import { useComposeRef } from '@vc-com/util/lib/ref';
import type { RenderNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';

export interface TabPaneProps {
  tab?: RenderNode;
  class?: string;
  style?: CSSProperties;
  disabled?: boolean;
  children?: RenderNode;
  forceRender?: boolean;
  closable?: boolean;
  closeIcon?: RenderNode;
  icon?: RenderNode;

  // Pass by TabPaneList
  prefixCls?: string;
  tabKey?: string;
  id?: string;
  animated?: boolean;
  active?: boolean;
  destroyOnHidden?: boolean;
}

const TabPane = defineComponent(
  ({ prefixCls, class: className, style, id, active, tabKey, children }: TabPaneProps) => {
    const slots = defineSlots();

    return () => {
      const hasContent = filterEmpty(slots.default?.())?.[0];
      return (
        <div
          ref={useComposeRef()}
          id={id && `${id}-panel-${tabKey}`}
          role="tabpanel"
          tabindex={active && hasContent ? 0 : -1}
          aria-labelledby={id && `${id}-tab-${tabKey}`}
          aria-hidden={!active}
          style={style}
          class={clsx(prefixCls, active && `${prefixCls}-active`, className)}
        >
          {children}
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'TabPane' : undefined },
);

export default TabPane;
