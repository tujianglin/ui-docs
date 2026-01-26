import Portal, { type PortalProps } from '@vc-com/portal';
import { defineComponent, type CSSProperties, type Ref } from 'vue';

export interface PlaceholderProps extends Pick<PortalProps, 'open' | 'autoLock' | 'getContainer'> {
  domRef: Ref<any>;
  class: string;
  style: CSSProperties;
  fallbackDOM: () => HTMLElement | null;
}

const Placeholder = defineComponent(
  ({ open, autoLock, getContainer, domRef, class: className, style, fallbackDOM }: PlaceholderProps) => {
    defineComponent({
      get nativeElement() {
        return domRef?.value || fallbackDOM();
      },
    });

    return () => (
      <Portal open={open} autoLock={autoLock} getContainer={getContainer}>
        <div ref={domRef} class={className} style={style} />
      </Portal>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Placeholder' : undefined },
);

export default Placeholder;
