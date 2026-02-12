import { computed, defineComponent, type CSSProperties } from 'vue';
import type { RenderNode } from '../../../util/src/types';
import { resolveVNode } from '../../../util/src/vnode';
import Mark from './Mark';

export interface MarkObj {
  style?: CSSProperties;
  label?: RenderNode;
}

export interface InternalMarkObj extends MarkObj {
  value: number;
}

export interface MarksProps {
  prefixCls: string;
  marks?: InternalMarkObj[];
  onClick: (value: number) => void;
}

const Marks = defineComponent(
  ({ prefixCls, marks, onClick }: MarksProps) => {
    const markPrefixCls = computed(() => `${prefixCls}-mark`);

    return () => {
      // Not render mark if empty
      if (!marks.length) {
        return null;
      }
      return (
        <div class={markPrefixCls.value}>
          {marks.map(({ value, style, label }) => (
            <Mark key={value} prefixCls={markPrefixCls.value} style={style} value={value} onClick={onClick}>
              {resolveVNode(label)}
            </Mark>
          ))}
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default Marks;
