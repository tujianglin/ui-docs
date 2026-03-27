import { useComposeRef } from '@vc-com/util/lib/ref';
import { defineComponent, isVNode } from 'vue';
import type { TabBarExtraContent, TabBarExtraMap, TabBarExtraPosition } from '../interface';

interface ExtraContentProps {
  position: TabBarExtraPosition;
  prefixCls: string;
  extra?: TabBarExtraContent;
}

const ExtraContent = defineComponent(
  ({ position, prefixCls, extra }: ExtraContentProps) => {
    return () => {
      if (!extra) {
        return null;
      }

      let content;

      // Parse extra
      let assertExtra: TabBarExtraMap = {};
      if (typeof extra === 'object' && !isVNode(extra)) {
        assertExtra = extra as TabBarExtraMap;
      } else {
        assertExtra.right = extra;
      }

      if (position === 'right') {
        content = assertExtra.right;
      }

      if (position === 'left') {
        content = assertExtra.left;
      }

      return (
        <div v-if={content} ref={useComposeRef()} class={`${prefixCls}-extra-content`}>
          {content}
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'ExtraContent' : '' },
);

export default ExtraContent;
