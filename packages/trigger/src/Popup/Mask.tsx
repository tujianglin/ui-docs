import type { CSSMotionProps } from '@vc-com/motion';
import CSSMotion from '@vc-com/motion';
import { clsx } from 'clsx';
import { defineComponent } from 'vue';

export interface MaskProps {
  prefixCls: string;
  open?: boolean;
  zIndex?: number;
  mask?: boolean;

  // Motion
  motion?: CSSMotionProps;

  mobile?: boolean;
}

export default defineComponent((props: MaskProps) => {
  const { prefixCls, open, zIndex, mask, motion, mobile } = $(props);
  return () => {
    if (!mask) {
      return null;
    }
    return (
      <CSSMotion {...motion} motionAppear visible={open} removeOnLeave>
        {({ class: className }) => (
          <div style={{ zIndex }} class={clsx(`${prefixCls}-mask`, mobile && `${prefixCls}-mobile-mask`, className)} />
        )}
      </CSSMotion>
    );
  };
});
