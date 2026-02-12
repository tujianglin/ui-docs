import { defineComponent, type CSSProperties } from 'vue';

const Palette = defineComponent(
  ({ style, prefixCls }: { style?: CSSProperties; prefixCls?: string }) => {
    return () => (
      <div
        class={`${prefixCls}-palette`}
        style={{
          position: 'relative',
          ...style,
        }}
      >
        <slot></slot>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Palette;
