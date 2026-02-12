import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';

export type ColorBlockProps = {
  color: string;
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  /** Internal usage. Only used in antd ColorPicker semantic structure only */
  innerClassName?: string;
  /** Internal usage. Only used in antd ColorPicker semantic structure only */
  innerStyle?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const ColorBlock = defineComponent(
  ({ color, prefixCls, class: className, style, innerClassName, innerStyle, onClick }: ColorBlockProps) => {
    const colorBlockCls = computed(() => `${prefixCls}-color-block`);
    return () => (
      <div class={clsx(colorBlockCls.value, className)} style={style} onClick={onClick}>
        <div class={clsx(`${colorBlockCls.value}-inner`, innerClassName)} style={{ background: color, ...innerStyle }} />
      </div>
    );
  },
  { inheritAttrs: false },
);

export default ColorBlock;
