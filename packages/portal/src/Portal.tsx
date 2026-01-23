import canUseDom from '@vc-com/util/lib/Dom/canUseDom';
import { filterEmpty } from '@vc-com/util/lib/props-util';
import { warning } from '@vc-com/util/lib/warning';
import { computed, createVNode, defineComponent, isVNode, onMounted, shallowRef, Teleport, watch, type PropType } from 'vue';
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

const Portal = defineComponent({
  inheritAttrs: false,
  props: {
    getContainer: {
      type: [String, Function] as PropType<GetContainer | string>,
      default: 'body',
    },
    open: {
      type: Boolean,
      default: undefined,
    },
    autoDestroy: {
      type: Boolean,
      default: true,
    },
    autoLock: {
      type: Boolean,
      default: undefined,
    },
    onEsc: {
      type: Function as PropType<EscCallback>,
    },
    debug: {
      type: String,
    },
  },
  setup(props, { slots, expose }) {
    const shouldRender = shallowRef(props.open);
    const mergedRender = computed(() => shouldRender.value || props.open);
    // ========================= Warning =========================
    if (process.env.NODE_ENV !== 'production') {
      warning(
        canUseDom() || !open,
        `Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.`,
      );
    }
    // ====================== Should Render ======================
    watch([() => props.open, () => props.autoDestroy], () => {
      if (props.autoDestroy || props.open) shouldRender.value = props.open;
    });

    // ======================== Container ========================
    const innerContainer = shallowRef<ContainerType | false | null>(getPortalContainer(props.getContainer!));
    onMounted(() => {
      const customizeContainer = getPortalContainer(props.getContainer!);
      // Tell component that we check this in effect which is safe to be `null`
      innerContainer.value = customizeContainer ?? null;
    });

    watch(
      () => props.getContainer,
      () => {
        const customizeContainer = getPortalContainer(props.getContainer!);
        // Tell component that we check this in effect which is safe to be `null`
        innerContainer.value = customizeContainer ?? null;
      },
    );

    const [defaultContainer, queueCreate] = useDom(
      computed(() => !!(mergedRender.value && !innerContainer.value)),
      props.debug,
    );

    useOrderContextProvider(queueCreate);

    const mergedContainer = computed(() => innerContainer.value ?? defaultContainer);

    // ========================= Locker ==========================
    useScrollLocker(
      computed(
        () =>
          !!(
            props.autoLock &&
            props.open &&
            canUseDom() &&
            (mergedContainer.value === defaultContainer || mergedContainer.value === document.body)
          ),
      ),
    );

    // ========================= Esc Keydown ==========================
    useEscKeyDown(
      computed(() => !!props.open),
      (...args) => {
        props.onEsc?.(...args);
      },
    );

    const elementEl = shallowRef();
    const setRef = (el: any) => {
      elementEl.value = el;
    };
    expose({
      elementEl,
    });

    return () => {
      // ========================= Render ==========================
      // Do not render when nothing need render
      // When innerContainer is `undefined`, it may not ready since user use ref in the same render
      if (!mergedRender.value || !canUseDom() || innerContainer.value === undefined) return null;
      // Render inline
      const renderInline = mergedContainer.value === false || inlineMock();

      const reffedChildren = filterEmpty(slots.default?.() ?? []);
      if (renderInline) {
        return reffedChildren;
      } else {
        const child =
          reffedChildren.length === 1
            ? isVNode(reffedChildren[0])
              ? createVNode(reffedChildren[0], {
                  ref: setRef,
                })
              : reffedChildren[0]
            : reffedChildren;
        return <Teleport to={mergedContainer.value}>{child}</Teleport>;
      }
    };
  },
});

export default Portal;
