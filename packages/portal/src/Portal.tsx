import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { warning } from '@vc-com/util/lib/warning';
import { computed, defineComponent, onMounted, shallowRef, Teleport, watch } from 'vue';
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
    const shouldRender = shallowRef(open);
    const mergedRender = computed(() => shouldRender.value || open);
    // ========================= Warning =========================
    if (process.env.NODE_ENV !== 'production') {
      warning(
        canUseDom() || !open,
        `Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.`,
      );
    }
    // ====================== Should Render ======================
    watch([() => open, () => autoDestroy], () => {
      if (autoDestroy || open) shouldRender.value = open;
    });

    // ======================== Container ========================
    const innerContainer = shallowRef<ContainerType | false | null>(getPortalContainer(getContainer!));
    onMounted(() => {
      const customizeContainer = getPortalContainer(getContainer!);
      // Tell component that we check this in effect which is safe to be `null`
      innerContainer.value = customizeContainer ?? null;
    });

    watch(
      () => getContainer,
      () => {
        const customizeContainer = getPortalContainer(getContainer!);
        // Tell component that we check this in effect which is safe to be `null`
        innerContainer.value = customizeContainer ?? null;
      },
    );

    const [defaultContainer, queueCreate] = useDom(
      computed(() => !!(mergedRender.value && !innerContainer.value)),
      debug,
    );

    useOrderContextProvider(queueCreate);

    const mergedContainer = computed(() => {
      return innerContainer.value ?? defaultContainer;
    });

    // ========================= Locker ==========================
    useScrollLocker(
      computed(
        () =>
          !!(
            autoLock &&
            open &&
            canUseDom() &&
            (mergedContainer.value === defaultContainer || mergedContainer.value === document.body)
          ),
      ),
    );

    // ========================= Esc Keydown ==========================
    useEscKeyDown(
      computed(() => !!open),
      (...args) => {
        // @ts-ignore
        onEsc?.(...args);
      },
    );

    return () => {
      // ========================= Render ==========================
      // Do not render when nothing need render
      // When innerContainer is `undefined`, it may not ready since user use ref in the same render
      if (!mergedRender.value || !canUseDom() || innerContainer.value === undefined) return null;
      // Render inline
      const renderInline = mergedContainer.value === false || inlineMock();

      if (renderInline) {
        return <slot></slot>;
      } else {
        return (
          <Teleport to={mergedContainer.value}>
            <slot></slot>
          </Teleport>
        );
      }
    };
  },
  { inheritAttrs: false },
);

export default Portal;
