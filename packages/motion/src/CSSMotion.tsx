import { findDOMNode } from '@vc-com/util/lib/Dom/findDOMNode';
import { getNodeRef, supportRef } from '@vc-com/util/lib/ref';
import { clsx } from 'clsx';
import {
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  ref,
  toRefs,
  unref,
  watch,
  type CSSProperties,
  type VNodeRef,
} from 'vue';
import { useRef } from 'vue-jsx-vapor';
import { useMotionContext } from './context';
import useStatus from './hooks/useStatus';
import { isActive } from './hooks/useStepQueue';
import type { MotionEndEventHandler, MotionEventHandler, MotionPrepareEventHandler, MotionStatus } from './interface';
import { STATUS_NONE, STEP_PREPARE, STEP_START } from './interface';
import { getTransitionName, supportTransition } from './util/motion';

export interface CSSMotionRef {
  nativeElement: HTMLElement;
  inMotion: () => boolean;
  enableMotion: () => boolean;
}

export type CSSMotionConfig =
  | boolean
  | {
      transitionSupport?: boolean;
    };

export type MotionName =
  | string
  | {
      appear?: string;
      enter?: string;
      leave?: string;
      appearActive?: string;
      enterActive?: string;
      leaveActive?: string;
    };

export interface CSSMotionProps {
  motionName?: MotionName;
  visible?: boolean;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  motionDeadline?: number;
  /**
   * Create element in view even the element is invisible.
   * Will patch `display: none` style on it.
   */
  forceRender?: boolean;
  /**
   * Remove element when motion end. This will not work when `forceRender` is set.
   */
  removeOnLeave?: boolean;
  leavedClassName?: string;
  /** @private Used by CSSMotionList. Do not use in your production. */
  eventProps?: object;

  // Prepare groups
  /** Prepare phase is used for measure element info. It will always trigger even motion is off */
  onAppearPrepare?: MotionPrepareEventHandler;
  /** Prepare phase is used for measure element info. It will always trigger even motion is off */
  onEnterPrepare?: MotionPrepareEventHandler;
  /** Prepare phase is used for measure element info. It will always trigger even motion is off */
  onLeavePrepare?: MotionPrepareEventHandler;

  // Normal motion groups
  onAppearStart?: MotionEventHandler;
  onEnterStart?: MotionEventHandler;
  onLeaveStart?: MotionEventHandler;

  onAppearActive?: MotionEventHandler;
  onEnterActive?: MotionEventHandler;
  onLeaveActive?: MotionEventHandler;

  onAppearEnd?: MotionEndEventHandler;
  onEnterEnd?: MotionEndEventHandler;
  onLeaveEnd?: MotionEndEventHandler;

  // Special
  /** This will always trigger after final visible changed. Even if no motion configured. */
  onVisibleChanged?: (visible: boolean) => void;

  internalRef?: VNodeRef;
}

export interface CSSMotionState {
  status?: MotionStatus;
  statusActive?: boolean;
  newStatus?: boolean;
  statusStyle?: CSSProperties;
  prevProps?: CSSMotionProps;
}

/**
 * `transitionSupport` is used for none transition test case.
 * Default we use browser transition event support check.
 */

export function genCSSMotion(config: CSSMotionConfig) {
  let transitionSupport = config;

  if (typeof config === 'object') {
    ({ transitionSupport } = config);
  }

  function isSupportTransition(props: CSSMotionProps, contextMotion?: boolean) {
    return !!(props.motionName && transitionSupport && contextMotion !== false);
  }

  const CSSMotion = defineComponent(
    (props: CSSMotionProps, { slots }) => {
      defineSlots<{
        default: (props: { visible?: boolean; class?: string; style?: CSSProperties; [key: string]: any; ref: VNodeRef }) => any;
      }>();

      const {
        // Default config
        visible,
        removeOnLeave,

        forceRender,
        motionName,
        leavedClassName,
        eventProps,
      } = $(props);

      const { motion: contextMotion } = toRefs(useMotionContext());

      const supportMotion = computed(() => isSupportTransition(props, contextMotion?.value));

      // Ref to the react node, it may be a HTMLElement
      const nodeRef = useRef();

      function getDomElement() {
        return findDOMNode(nodeRef.value) as HTMLElement;
      }

      const [status, statusStep, statusStyle, mergedVisible] = useStatus(
        supportMotion,
        computed(() => visible),
        getDomElement,
        props,
      );

      // Record whether content has rendered
      // Will return null for un-rendered even when `removeOnLeave={false}`
      const renderedRef = ref(mergedVisible.value);
      watch(
        mergedVisible,
        () => {
          if (mergedVisible.value) {
            renderedRef.value = true;
          }
        },
        { immediate: true },
      );

      // ====================== Refs ======================

      defineExpose({
        get nativeElement() {
          return getDomElement();
        },
        inMotion() {
          return status.value !== STATUS_NONE;
        },
        enableMotion() {
          return supportMotion.value;
        },
      });

      // ===================== Render =====================

      // We should render children when motionStyle is sync with stepStatus

      return () => {
        let result = null;
        const children = slots.default;
        const mergedProps = { ...eventProps, visible: visible };
        if (!children) {
          result = null;
        } else if (status.value === STATUS_NONE) {
          // Stable children
          if (mergedVisible.value) {
            result = children({ ...mergedProps, ref: nodeRef });
          } else if (!removeOnLeave && renderedRef.value && leavedClassName) {
            result = children({ ...mergedProps, class: leavedClassName, ref: nodeRef });
          } else if (forceRender || (!removeOnLeave && !leavedClassName)) {
            result = children({ ...mergedProps, style: { display: 'none' }, ref: nodeRef });
          } else {
            result = null;
          }
        } else {
          // In motion
          let statusSuffix: string;
          if (statusStep.value === STEP_PREPARE) {
            statusSuffix = 'prepare';
          } else if (isActive(statusStep.value)) {
            statusSuffix = 'active';
          } else if (statusStep.value === STEP_START) {
            statusSuffix = 'start';
          }

          const motionCls = getTransitionName(motionName, `${status.value}-${statusSuffix}`);

          result = children({
            ...mergedProps,
            class: clsx(getTransitionName(motionName, status.value), {
              [motionCls]: motionCls && statusSuffix,
              [motionName as string]: typeof unref(motionName) === 'string',
            }),
            style: statusStyle.value,
            ref: nodeRef,
          });
        }

        // Auto inject ref if child node not have `ref` props
        if (isVNode(result) && supportRef(result[0])) {
          const originNodeRef = getNodeRef(result[0]);
          if (!originNodeRef) {
            result = cloneVNode(result, { ref: nodeRef });
          }
        }
        return result;
      };
    },
    { inheritAttrs: false, name: 'CSSMotion' },
  );

  return CSSMotion;
}

export default genCSSMotion(supportTransition);
