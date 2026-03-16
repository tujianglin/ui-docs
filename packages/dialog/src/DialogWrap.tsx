import Portal, { type PortalProps } from '@vc-com/portal';
import { computed, defineComponent, ref, watch } from 'vue';
import { useFullProps } from 'vue-jsx-vapor';
import Dialog from './Dialog';
import type { IDialogPropTypes } from './IDialogPropTypes';
import { RefContextProvider } from './context';

// fix issue #10656
/*
 * getContainer remarks
 * Custom container should not be return, because in the Portal component, it will remove the
 * return container element here, if the custom container is the only child of it's component,
 * like issue #10656, It will has a conflict with removeChild method in react-dom.
 * So here should add a child (div element) to custom container.
 * */

const DialogWrap = defineComponent(
  ({
    visible,
    getContainer,
    forceRender,
    destroyOnHidden = false,
    afterClose,
    closable,
    panelRef,
    keyboard = true,
    onClose,
  }: IDialogPropTypes) => {
    const props = useFullProps() as IDialogPropTypes;
    const animatedVisible = ref<boolean>(visible);

    const refContext = computed(() => ({ panel: panelRef?.value }));

    const onEsc: PortalProps['onEsc'] = ({ top, event }) => {
      if (top && keyboard) {
        event.stopPropagation();
        onClose?.(event);
        return;
      }
    };

    watch(
      () => visible,
      () => {
        if (visible) {
          animatedVisible.value = true;
        }
      },
      { immediate: true },
    );

    return () => (
      <RefContextProvider v-if={!(!forceRender && destroyOnHidden && !animatedVisible.value)} value={refContext.value}>
        <Portal
          open={visible || forceRender || animatedVisible.value}
          onEsc={onEsc}
          autoDestroy={false}
          getContainer={getContainer}
          autoLock={visible || animatedVisible.value}
        >
          <Dialog
            {...(props as any)}
            destroyOnHidden={destroyOnHidden}
            afterClose={() => {
              const closableObj = closable && typeof closable === 'object' ? closable : {};
              const { afterClose: closableAfterClose } = closableObj || {};
              closableAfterClose?.();
              afterClose?.();
              animatedVisible.value = false;
            }}
          >
            <slot></slot>
          </Dialog>
        </Portal>
      </RefContextProvider>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'DialogWrap' : undefined },
);

export default DialogWrap;
