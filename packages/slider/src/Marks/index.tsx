import Render from '@vc-com/render';
import type { RenderNode } from '@vc-com/util/lib/types';
import { computed, defineComponent, type CSSProperties } from 'vue';
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

    return () => (
      <div v-if={marks.length} class={markPrefixCls.value}>
        <Mark
          v-for={{ value, style, label } in marks}
          key={value}
          prefixCls={markPrefixCls.value}
          style={style}
          value={value}
          onClick={onClick}
        >
          <Render content={label}></Render>
        </Mark>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Marks;
