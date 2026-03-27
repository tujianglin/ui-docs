import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { useComposeRef } from '@vc-com/util/lib/ref';
import { clsx } from 'clsx';
import { defineComponent, type CSSProperties } from 'vue';
import {
  useFullProps,
  type AriaAttributes,
  type DialogHTMLAttributes,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
} from 'vue-jsx-vapor';
import { useRefContextInject } from './context';

export interface DrawerPanelRef {
  focus: VoidFunction;
}

export interface DrawerPanelEvents {
  onMouseenter?: MouseEventHandler<HTMLDivElement>;
  onMouseover?: MouseEventHandler<HTMLDivElement>;
  onMouseleave?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onKeydown?: KeyboardEventHandler<HTMLDivElement>;
  onKeyup?: KeyboardEventHandler<HTMLDivElement>;
  onFocus?: FocusEventHandler<HTMLDivElement>;
}

export type DrawerPanelAccessibility = Pick<DialogHTMLAttributes<HTMLDivElement>, keyof AriaAttributes>;

export interface DrawerPanelProps extends DrawerPanelEvents, DrawerPanelAccessibility {
  prefixCls: string;
  class?: string;
  id?: string;
  style?: CSSProperties;
  containerRef?: any;
}

const DrawerPanel = defineComponent(
  ({ prefixCls, class: className, containerRef, ...restProps }: DrawerPanelProps) => {
    const props = useFullProps() as DrawerPanelProps;
    const { panel: panelRef } = $(useRefContextInject());
    const mergedRef = useComposeRef([containerRef, panelRef]);

    // =============================== Render ===============================

    return () => (
      <div
        class={clsx(`${prefixCls}-section`, className)}
        role="dialog"
        ref={mergedRef}
        {...pickAttrs(props, { aria: true })}
        aria-modal="true"
        {...(restProps as any)}
      >
        <slot></slot>
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'DrawerPanel' : undefined },
);

export default DrawerPanel;
