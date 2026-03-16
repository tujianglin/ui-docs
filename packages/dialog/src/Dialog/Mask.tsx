import CSSMotion from '@vc-com/motion';
import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import type { HTMLAttributes } from 'vue-jsx-vapor';

export type MaskProps = {
  prefixCls: string;
  visible: boolean;
  motionName?: string;
  style?: CSSProperties;
  maskProps?: HTMLAttributes<HTMLDivElement>;
  className?: string;
};

const Mask = defineComponent(
  ({ prefixCls, style, visible, maskProps, motionName, className }: MaskProps) => {
    return () => (
      <CSSMotion key="mask" visible={visible} motionName={motionName} leavedClassName={`${prefixCls}-mask-hidden`}>
        {({ class: motionClassName, style: motionStyle, ref: motionRef }) => (
          <div
            ref={motionRef}
            style={{ ...motionStyle, ...style }}
            class={clsx(`${prefixCls}-mask`, motionClassName, className)}
            {...maskProps}
          />
        )}
      </CSSMotion>
    );
  },
  { inheritAttrs: false },
);

export default Mask;
