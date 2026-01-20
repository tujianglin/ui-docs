import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { filterEmpty } from '@vc-com/util/lib/props-util';
import { warningOnce } from '@vc-com/util/lib/warning';
import { computed, createVNode, defineComponent, isVNode, ref, shallowRef, Teleport, watch, watchEffect } from 'vue';
import { useOrderContextProvider } from './Context';
import { inlineMock } from './mock';
import useDom from './useDom';
import useEscKeyDown from './useEscKeyDown';
import useScrollLocker from './useScrollLocker';

export type ContainerType = Element | DocumentFragment;

export type GetContainer = string | ContainerType | (() => ContainerType) | false;

export type EscCallback = ({ top, event }: { top: boolean; event: KeyboardEvent }) => void;

export interface PortalProps {
  /** Customize container element. Default will create a div in document.body when `open` */
  getContainer?: GetContainer;
  /** Show the portal children */
  open?: boolean;
  /** Remove `children` when `open` is `false`. Set `false` will not handle remove process */
  autoDestroy?: boolean;
  /** Lock screen scroll when open */
  autoLock?: boolean;
  onEsc?: EscCallback;

  /** @private debug name. Do not use in prod */
  debug?: string;
}

const getPortalContainer = (getContainer: GetContainer) => {
  if (getContainer === false) {
    return false;
  }

  if (!canUseDom() || !getContainer) {
    return null;
  }

  if (typeof getContainer === 'string') {
    return document.querySelector(getContainer);
  }
  if (typeof getContainer === 'function') {
    return getContainer();
  }
  return getContainer;
};

const Portal = defineComponent(
  ({ open, autoLock, getContainer, debug, autoDestroy = true, onEsc }: PortalProps) => {
    const slots = defineSlots<{ default?: () => any }>();
    const shouldRender = shallowRef(open);

    const mergedRender = computed(() => shouldRender.value || open);

    // ========================= Warning =========================
    if (process.env.NODE_ENV !== 'production') {
      warningOnce(
        canUseDom() || !open,
        `Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.`,
      );
    }

    // ====================== Should Render ======================
    watch(
      [() => open, () => autoDestroy],
      () => {
        if (autoDestroy || open) {
          shouldRender.value = open;
        }
      },
      { immediate: true },
    );

    // ======================== Container ========================
    const innerContainer = ref<ContainerType | false>(getPortalContainer(getContainer));

    watchEffect(() => {
      const customizeContainer = getPortalContainer(getContainer);
      innerContainer.value = customizeContainer ?? null;
    });

    const [defaultContainer, queueCreate] = useDom(
      computed(() => mergedRender.value && !innerContainer.value),
      debug,
    );
    const mergedContainer = computed(() => innerContainer.value ?? defaultContainer.value);

    // ========================= Locker ==========================
    useScrollLocker(
      computed(
        () =>
          autoLock &&
          open &&
          canUseDom() &&
          (mergedContainer.value === defaultContainer.value || mergedContainer.value === document.body),
      ),
    );

    // ========================= Esc Keydown ==========================
    useEscKeyDown(
      computed(() => open),
      onEsc,
    );

    // =========================== Ref ===========================
    const dom = shallowRef();
    const setRef = (el: any) => {
      dom.value = el;
    };
    defineExpose({
      get dom() {
        return dom.value;
      },
    });

    useOrderContextProvider(queueCreate);

    return () => {
      if (!mergedRender.value || !canUseDom() || innerContainer.value === undefined) {
        return null;
      }
      const renderInline = mergedContainer.value === false || inlineMock();
      const reffedChildren = filterEmpty(<slots.default />);

      if (renderInline) {
        return reffedChildren;
      }

      const child =
        reffedChildren.length === 1
          ? isVNode(reffedChildren[0])
            ? createVNode(reffedChildren[0], {
                ref: setRef,
              })
            : reffedChildren[0]
          : reffedChildren;
      return <Teleport to={mergedContainer.value || 'body'}>{child}</Teleport>;
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' && 'Portal' },
);

export default Portal;
