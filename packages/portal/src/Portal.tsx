import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { warningOnce } from '@vc-com/util/lib/warning';
import { computed, defineComponent, onMounted, provide, ref, Teleport, watch } from 'vue';
import { OrderContextKey } from './Context';
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

const Portal = defineComponent(({ open, autoLock, getContainer, debug, autoDestroy = true, onEsc }: PortalProps) => {
  const slots = defineSlots();
  const shouldRender = ref(open);

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
  const innerContainer = ref<ContainerType | false | null | undefined>(undefined);

  // 挂载后获取容器
  onMounted(() => {
    const customizeContainer = getPortalContainer(getContainer);
    innerContainer.value = customizeContainer ?? null;
  });

  watch(
    () => getContainer,
    () => {
      const customizeContainer = getPortalContainer(getContainer);
      innerContainer.value = customizeContainer ?? null;
    },
  );

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
  // let childRef: React.Ref<any> = null;

  // if (children && supportRef(children) && ref) {
  //   childRef = getNodeRef(children);
  // }

  // const mergedRef = useComposeRef(childRef, ref);

  // ========================= Render ==========================
  // Do not render when nothing need render
  // When innerContainer is `undefined`, it may not ready since user use ref in the same render
  const renderInline = computed(() => mergedContainer.value === false || inlineMock());

  // Render inline

  // let reffedChildren = children;
  // if (ref) {
  //   reffedChildren = React.cloneElement(children as any, {
  //     ref: mergedRef,
  //   });
  // }

  provide(OrderContextKey, queueCreate);

  return () => {
    if (!mergedRender.value || !canUseDom() || innerContainer.value === undefined) {
      return null;
    }
    return (
      <>
        <slots.default v-if={renderInline.value}></slots.default>
        <Teleport v-else to={mergedContainer.value || 'body'}>
          <slots.default></slots.default>
        </Teleport>
      </>
    );
  };
});

if (process.env.NODE_ENV !== 'production') {
  Portal.displayName = 'Portal';
}

export default Portal;
