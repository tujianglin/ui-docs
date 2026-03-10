import Render from '@vc-com/render';
import { defineComponent } from 'vue';
import type { DropdownProps } from './Dropdown';

export type OverlayProps = Pick<DropdownProps, 'overlay' | 'arrow' | 'prefixCls'>;

const Overlay = defineComponent(
  ({ overlay, arrow, prefixCls }: OverlayProps) => {
    return () => (
      <>
        <div v-if={arrow} class={`${prefixCls}-arrow`} />
        <Render content={overlay}></Render>
      </>
    );
  },
  { inheritAttrs: false },
);

export default Overlay;
