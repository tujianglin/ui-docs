import type { CSSMotionProps } from '@vc-com/motion';
import type { PortalProps } from '@vc-com/portal';
import Portal from '@vc-com/portal';
import { getShadowRoot } from '@vc-com/util/lib/Dom/shadow';
import { useId } from '@vc-com/util/lib/hooks/useId';
import type { VueNode } from '@vc-com/util/lib/types';
import { resolveToElement } from '@vc-com/util/lib/vnode';
import Popup, { type MobileConfig } from './Popup';
import type { TriggerContextProps } from './context';
import { TriggerContextProvider, useTriggerContextInject, useUniqueContextInject } from './context';
import useAction from './hooks/useAction';
import useAlign from './hooks/useAlign';
import useDelay from './hooks/useDelay';
import useWatch from './hooks/useWatch';
import useWinClick from './hooks/useWinClick';

import type { ActionType, AlignType, ArrowPos, ArrowTypeOuter, BuildInPlacements } from './interface';
import { getAlignPopupClassName } from './util';

export type { ActionType, AlignType, ArrowTypeOuter as ArrowType, BuildInPlacements };

import { useResizeObserver } from '@vc-com/resize-observer';
import { useControlledState } from '@vc-com/util/src';
import { filterEmpty } from '@vc-com/util/src/props-util';
import clsx from 'clsx';
import {
  computed,
  createVNode,
  defineComponent,
  nextTick,
  reactive,
  ref,
  shallowRef,
  watch,
  watchEffect,
  type Component,
  type CSSProperties,
} from 'vue';
import type { MouseEvent, MouseEventHandler } from 'vue-jsx-vapor';
import UniqueProvider, { type UniqueProviderProps } from './UniqueProvider';

export { UniqueProvider };
export type { UniqueProviderProps };

export interface TriggerRef {
  nativeElement: HTMLElement;
  popupElement: HTMLDivElement;
  forceAlign: VoidFunction;
}

// Removed Props List
// Seems this can be auto
// getDocument?: (element?: HTMLElement) => Document;

// New version will not wrap popup with `rc-trigger-popup-content` when multiple children

export interface TriggerProps {
  action?: ActionType[];
  showAction?: ActionType[];
  hideAction?: ActionType[];

  prefixCls?: string;

  zIndex?: number;

  onPopupAlign?: (element: HTMLElement, align: AlignType) => void;

  stretch?: string;

  // ==================== Open =====================
  popupVisible?: boolean;
  defaultPopupVisible?: boolean;
  onOpenChange?: (visible: boolean) => void;
  afterOpenChange?: (visible: boolean) => void;

  // =================== Portal ====================
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  forceRender?: boolean;
  autoDestroy?: boolean;

  // ==================== Mask =====================
  mask?: boolean;
  maskClosable?: boolean;

  // =================== Motion ====================
  /** Set popup motion. You can ref `rc-motion` for more info. */
  popupMotion?: CSSMotionProps;
  /** Set mask motion. You can ref `rc-motion` for more info. */
  maskMotion?: CSSMotionProps;

  // ==================== Delay ====================
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;

  focusDelay?: number;
  blurDelay?: number;

  // ==================== Popup ====================
  popup: (() => VueNode) | VueNode;
  popupPlacement?: string;
  builtinPlacements?: BuildInPlacements;
  popupAlign?: AlignType;
  popupClassName?: string;
  /** Pass to `UniqueProvider` UniqueContainer */
  uniqueContainerClassName?: string;
  /** Pass to `UniqueProvider` UniqueContainer */
  uniqueContainerStyle?: CSSProperties;
  popupStyle?: CSSProperties;
  getPopupClassNameFromAlign?: (align: AlignType) => string;
  onPopupClick?: MouseEventHandler<HTMLDivElement>;

  alignPoint?: boolean; // Maybe we can support user pass position in the future

  /**
   * Trigger will memo content when close.
   * This may affect the case if want to keep content update.
   * Set `fresh` to `false` will always keep update.
   */
  fresh?: boolean;

  /**
   * Config with UniqueProvider to shared the floating popup.
   */
  unique?: boolean;

  // ==================== Arrow ====================
  arrow?: boolean | ArrowTypeOuter;

  // // ========================== Mobile ==========================
  /**
   * @private Bump fixed position at bottom in mobile.
   * Will replace the config of root
   * This will directly trade as mobile view which will not check what real is.
   * This is internal usage currently, do not use in your prod.
   */
  mobile?: MobileConfig;
}

export function generateTrigger(PortalComponent: Component = Portal) {
  const Trigger = defineComponent(
    ({
      prefixCls = 'rc-trigger-popup',

      // Action
      action = ['hover'],
      showAction,
      hideAction,

      // Open
      popupVisible,
      defaultPopupVisible,
      onOpenChange,
      afterOpenChange,

      // Delay
      mouseEnterDelay,
      mouseLeaveDelay = 0.1,

      focusDelay,
      blurDelay,

      // Mask
      mask,
      maskClosable = true,

      // Portal
      getPopupContainer,
      forceRender,
      autoDestroy,

      // Popup
      popup,
      popupClassName,
      uniqueContainerClassName,
      uniqueContainerStyle,
      popupStyle,

      popupPlacement,
      builtinPlacements = {},
      popupAlign,
      zIndex,
      stretch,
      getPopupClassNameFromAlign,
      fresh,
      unique,

      alignPoint,

      onPopupClick,
      onPopupAlign,

      // Arrow
      arrow,

      // Motion
      popupMotion,
      maskMotion,

      // Private
      mobile,

      ...restProps
    }: TriggerProps) => {
      const slots = defineSlots<{ default: (_props?: { open: boolean }) => any }>();
      const mergedAutoDestroy = computed(() => autoDestroy || false);
      const openUncontrolled = computed(() => popupVisible === undefined);

      // =========================== Mobile ===========================
      const isMobile = computed(() => !!mobile);

      // ========================== Context ===========================
      const subPopupElements = ref<Record<string, HTMLElement | null>>({});
      const parentContext = useTriggerContextInject();
      const context = computed<TriggerContextProps>(() => {
        return {
          registerSubPopup: (id, subPopupEle) => {
            subPopupElements.value[id] = subPopupEle;

            parentContext?.registerSubPopup(id, subPopupEle);
          },
        };
      });

      // ======================== UniqueContext =========================
      const uniqueContext = useUniqueContextInject();
      // =========================== Popup ============================
      const id = useId();
      const popupEle = shallowRef<HTMLDivElement | null>(null);
      // Used for forwardRef popup. Not use internal
      const externalPopupRef = shallowRef<HTMLDivElement | null>(null);
      const setPopupRef = (node: any) => {
        const element = resolveToElement(node) as HTMLDivElement | null;
        externalPopupRef.value = element;
        if (popupEle.value !== element) {
          popupEle.value = element;
        }
        parentContext?.registerSubPopup(id.value, element ?? null);
      };

      // =========================== Target ===========================
      // Use state to control here since `useRef` update not trigger render
      const targetEle = shallowRef<HTMLElement>();
      // Used for forwardRef target. Not use internal
      const externalForwardRef = shallowRef<HTMLElement | null>(null);
      const setTargetRef = (node: any) => {
        const element = resolveToElement(node);
        if (element && targetEle.value !== element) {
          targetEle.value = element as HTMLElement;
          externalForwardRef.value = element as HTMLElement;
        } else if (!element) {
          targetEle.value = null;
          externalForwardRef.value = null;
        }
      };

      const originChildProps = reactive<Record<string, any>>({});
      const baseActionProps = shallowRef<Record<string, any>>({});
      const hoverActionProps = shallowRef<Record<string, any>>({});
      const cloneProps = computed<Record<string, any>>(() => ({
        ...baseActionProps.value,
        ...hoverActionProps.value,
      }));

      const inPopupOrChild = (ele: EventTarget) => {
        const childDOM = targetEle.value;
        return (
          childDOM?.contains(ele as HTMLElement) ||
          (childDOM && getShadowRoot(childDOM)?.host === ele) ||
          ele === childDOM ||
          popupEle.value?.contains(ele as HTMLElement) ||
          (popupEle.value && getShadowRoot(popupEle.value)?.host === ele) ||
          ele === popupEle.value ||
          Object.values(subPopupElements.value).some(
            (subPopupEle) => subPopupEle?.contains(ele as HTMLElement) || ele === subPopupEle,
          )
        );
      };

      // =========================== Arrow ============================
      const innerArrow = computed<ArrowTypeOuter>(() =>
        arrow
          ? {
              // true and Object likely
              ...(arrow !== true ? arrow : {}),
            }
          : null,
      );

      // ============================ Open ============================
      const [internalOpen, setInternalOpen] = useControlledState(
        defaultPopupVisible || false,
        computed(() => popupVisible),
      );

      const mergedOpen = computed(() => internalOpen.value || false);

      // ========================== Children ==========================

      // Support ref
      const isOpen = () => mergedOpen.value;

      // Extract common options for UniqueProvider
      const getUniqueOptions = (delay: number = 0) => ({
        popup,
        target: targetEle.value,
        delay,
        prefixCls,
        popupClassName,
        uniqueContainerClassName,
        uniqueContainerStyle,
        popupStyle,
        popupPlacement,
        builtinPlacements,
        popupAlign,
        zIndex,
        mask,
        maskClosable,
        popupMotion,
        maskMotion,
        arrow: innerArrow.value,
        getPopupContainer,
        getPopupClassNameFromAlign,
        id: id.value,
        onEsc,
      });

      // Handle controlled state changes for UniqueProvider
      // Only sync to UniqueProvider when it's controlled mode
      // If there is a parentContext, don't call uniqueContext methods
      watch([mergedOpen, targetEle], () => {
        if (uniqueContext && unique && targetEle.value && !openUncontrolled.value && !parentContext) {
          if (mergedOpen.value) {
            uniqueContext.show(getUniqueOptions(mouseEnterDelay), isOpen);
          } else {
            uniqueContext.hide(mouseLeaveDelay);
          }
        }
      });

      const openRef = shallowRef(mergedOpen.value);

      const internalTriggerOpen = (nextOpen: boolean) => {
        nextTick(() => {
          if (mergedOpen.value !== nextOpen) {
            setInternalOpen(nextOpen);
            onOpenChange?.(nextOpen);
          }
        });
      };

      // Trigger for delay
      const delayInvoke = useDelay();

      const triggerOpen = (nextOpen: boolean, delay: number = 0) => {
        // If it's controlled mode, always use internal trigger logic
        // UniqueProvider will be synced through useLayoutEffect
        if (popupVisible !== undefined) {
          delayInvoke(() => {
            internalTriggerOpen(nextOpen);
          }, delay);
          return;
        }

        // If UniqueContext exists and not controlled, pass delay to Provider instead of handling it internally
        // If there is a parentContext, don't call uniqueContext methods
        if (uniqueContext && unique && openUncontrolled.value && !parentContext) {
          if (nextOpen) {
            uniqueContext?.show(getUniqueOptions(delay) as any, isOpen);
          } else {
            uniqueContext.hide(delay);
          }
          return;
        }

        delayInvoke(() => {
          internalTriggerOpen(nextOpen);
        }, delay);
      };

      function onEsc({ top }: Parameters<PortalProps['onEsc']>[0]) {
        if (top) {
          console.log(1);
          triggerOpen(false);
        }
      }

      // ========================== Motion ============================
      const inMotion = shallowRef(false);
      watch(mergedOpen, () => {
        if (mergedOpen.value) {
          inMotion.value = true;
        }
      });

      const motionPrepareResolve = shallowRef<VoidFunction>(null);

      // =========================== Align ============================
      const mousePos = ref<[x: number, y: number] | null>(null);
      const setMousePosByEvent = (event: Pick<MouseEvent, 'clientX' | 'clientY'>) => {
        mousePos.value = [event.clientX, event.clientY];
      };

      const [ready, offsetX, offsetY, offsetR, offsetB, arrowX, arrowY, scaleX, scaleY, alignInfo, onAlign] = useAlign(
        mergedOpen,
        popupEle,
        computed(() => (alignPoint && mousePos.value !== null ? mousePos.value : targetEle.value)),
        computed(() => popupPlacement),
        computed(() => builtinPlacements),
        computed(() => popupAlign),
        onPopupAlign,
        isMobile,
      );

      const [showActions, hideActions] = useAction(
        computed(() => action),
        computed(() => showAction),
        computed(() => hideAction),
      );

      const clickToShow = computed(() => showActions.value.has('click'));
      const clickToHide = computed(() => hideActions.value.has('click') || hideActions.value.has('contextmenu'));

      const triggerAlign = () => {
        if (!inMotion.value) {
          onAlign();
        }
      };

      const onScroll = () => {
        if (openRef.value && alignPoint && clickToHide.value) {
          triggerOpen(false);
        }
      };

      useWatch(mergedOpen, targetEle, popupEle, triggerAlign, onScroll);

      watch([mousePos, () => popupPlacement], async () => {
        await nextTick();
        triggerAlign();
      });

      // When no builtinPlacements and popupAlign changed
      watch(
        () => popupAlign,
        async () => {
          await nextTick();
          if (mergedOpen.value && !builtinPlacements?.[popupPlacement]) {
            triggerAlign();
          }
        },
      );

      const alignedClassName = computed(() => {
        const baseClassName = getAlignPopupClassName(builtinPlacements, prefixCls, alignInfo.value, alignPoint);

        return clsx(baseClassName, getPopupClassNameFromAlign?.(alignInfo.value));
      });

      // ============================ Refs ============================
      defineExpose({
        get nativeElement() {
          return externalForwardRef.value;
        },
        get popupElement() {
          return externalPopupRef.value;
        },
        forceAlign: triggerAlign,
      });

      // ========================== Stretch ===========================
      const targetWidth = shallowRef(0);
      const targetHeight = shallowRef(0);

      const syncTargetSize = () => {
        if (stretch && targetEle.value) {
          const rect = targetEle.value.getBoundingClientRect();
          targetWidth.value = rect.width;
          targetHeight.value = rect.height;
        }
      };

      const onTargetResize = () => {
        syncTargetSize();
        triggerAlign();
      };

      // ========================== Motion ============================
      const onVisibleChanged = (visible: boolean) => {
        inMotion.value = false;
        onAlign();
        afterOpenChange?.(visible);
      };

      // We will trigger align when motion is in prepare
      const onPrepare = () =>
        new Promise<void>((resolve) => {
          syncTargetSize();
          motionPrepareResolve.value = resolve;
        });

      watch(
        motionPrepareResolve,
        () => {
          if (motionPrepareResolve.value) {
            onAlign();
            motionPrepareResolve.value();
            motionPrepareResolve.value = null;
          }
        },
        { flush: 'post' },
      );

      // =========================== Action ===========================
      /**
       * Util wrapper for trigger action
       * @param target
       * @param eventName  Listen event name
       * @param nextOpen  Next open state after trigger
       * @param delay Delay to trigger open change
       * @param callback Callback if current event need additional action
       * @param ignoreCheck  Ignore current event if check return true
       */
      function wrapperAction(
        target: Record<string, any>,
        eventName: string,
        nextOpen: boolean,
        delay?: number,
        callback?: (event: Event) => void,
        ignoreCheck?: () => boolean,
      ) {
        target[eventName] = (event: any, ...args: any[]) => {
          if (!ignoreCheck || !ignoreCheck()) {
            callback?.(event);
            triggerOpen(nextOpen, delay);
          }

          // Pass to origin
          originChildProps[eventName]?.(event, ...args);
        };
      }

      // ======================= Action: Touch ========================
      const touchToShow = computed(() => showActions.value?.has('touch'));
      const touchToHide = computed(() => hideActions.value?.has('touch'));

      /** Used for prevent `hover` event conflict with mobile env */
      const touchedRef = shallowRef(false);

      watchEffect(() => {
        const nextCloneProps: Record<string, any> = {};
        if (touchToShow.value || touchToHide.value) {
          nextCloneProps.onTouchstartPassive = (...args: any[]) => {
            touchedRef.value = true;

            if (openRef.value && touchToHide.value) {
              triggerOpen(false);
            } else if (!openRef.value && touchToShow.value) {
              triggerOpen(true);
            }

            // Pass to origin
            originChildProps.onTouchstartPassive?.(...args);
          };
        }

        // ======================= Action: Click ========================
        if (clickToShow.value || clickToHide.value) {
          nextCloneProps.onClick = (event: MouseEvent<HTMLElement>, ...args: any[]) => {
            if (openRef.value && clickToHide.value) {
              triggerOpen(false);
            } else if (!openRef.value && clickToShow.value) {
              setMousePosByEvent(event);
              triggerOpen(true);
            }

            // Pass to origin
            originChildProps?.onClick?.(event, ...args);
            touchedRef.value = false;
          };
        }
        baseActionProps.value = nextCloneProps;
      });

      // Click to hide is special action since click popup element should not hide
      const onPopupPointerDown = useWinClick(
        mergedOpen,
        computed(() => clickToHide.value || touchToHide.value),
        targetEle,
        popupEle,
        computed(() => mask),
        computed(() => maskClosable),
        inPopupOrChild,
        triggerOpen,
      );

      // ======================= Action: Hover ========================
      const hoverToShow = computed(() => showActions.value?.has('hover'));
      const hoverToHide = computed(() => hideActions.value?.has('hover'));

      let onPopupMouseEnter: any;
      let onPopupMouseLeave: undefined | ((event: MouseEvent) => void);

      const ignoreMouseTrigger = () => {
        return touchedRef.value;
      };

      watchEffect(() => {
        const nextHoverProps: Record<string, any> = {};
        if (hoverToShow.value) {
          const onMouseEnterCallback = (event: any) => {
            setMousePosByEvent(event);
          };

          // Compatible with old browser which not support pointer event
          wrapperAction(nextHoverProps, 'onMouseenter', true, mouseEnterDelay, onMouseEnterCallback, ignoreMouseTrigger);
          wrapperAction(nextHoverProps, 'onPointerenter', true, mouseEnterDelay, onMouseEnterCallback, ignoreMouseTrigger);

          onPopupMouseEnter = (event: any) => {
            // Only trigger re-open when popup is visible
            if ((mergedOpen.value || inMotion.value) && popupEle?.value?.contains(event.target as HTMLElement)) {
              triggerOpen(true, mouseEnterDelay);
            }
          };

          // Align Point
          if (alignPoint) {
            nextHoverProps.onMouseMove = (event: any) => {
              originChildProps.onMousemove?.(event);
            };
          }
        } else {
          onPopupMouseEnter = undefined;
        }

        if (hoverToHide.value) {
          wrapperAction(nextHoverProps, 'onMouseleave', false, mouseLeaveDelay, undefined, ignoreMouseTrigger);
          wrapperAction(nextHoverProps, 'onPointerleave', false, mouseLeaveDelay, undefined, ignoreMouseTrigger);

          onPopupMouseLeave = (event: MouseEvent) => {
            const { relatedTarget } = event;
            if (relatedTarget && inPopupOrChild(relatedTarget)) {
              return;
            }
            triggerOpen(false, mouseLeaveDelay);
          };
        } else {
          onPopupMouseLeave = undefined;
        }

        // ======================= Action: Focus ========================
        if (showActions.value.has('focus')) {
          wrapperAction(nextHoverProps, 'onFocus', true, focusDelay);
        }

        if (hideActions.value.has('focus')) {
          wrapperAction(nextHoverProps, 'onBlur', false, blurDelay);
        }

        // ==================== Action: ContextMenu =====================
        if (showActions.value.has('contextmenu')) {
          nextHoverProps.onContextmenu = (event: any, ...args: any[]) => {
            if (openRef.value && hideActions.value.has('contextmenu')) {
              triggerOpen(false);
            } else {
              setMousePosByEvent(event);
              triggerOpen(true);
            }

            event.preventDefault();

            // Pass to origin
            originChildProps.onContextmenu?.(event, ...args);
          };
        }
        hoverActionProps.value = nextHoverProps;
      });

      // ============================ Perf ============================
      const rendedRef = shallowRef(false);
      watchEffect(() => {
        rendedRef.value ||= forceRender || mergedOpen.value || inMotion.value;
      });

      // =================== Resize Observer ===================
      // Use hook to observe target element resize
      // Pass targetEle directly instead of a function so the hook will re-observe when target changes
      useResizeObserver(mergedOpen, targetEle, onTargetResize);
      const arrowPos = computed<ArrowPos>(() => ({
        x: arrowX.value,
        y: arrowY.value,
      }));
      return () => {
        // ========================== Children ==========================
        const child = filterEmpty(slots?.default?.() ?? [])?.[0];
        // =========================== Render ===========================
        const mergedChildrenProps = {
          ...originChildProps,
          ...cloneProps.value,
        };
        // Pass props into cloneProps for nest usage
        const passedProps: Record<string, any> = {};
        const passedEventList = [
          'onContextmenu',
          'onClick',
          'onMousedown',
          'onTouchstartPassive',
          'onMouseenter',
          'onMouseleave',
          'onFocus',
          'onBlur',
        ];

        passedEventList.forEach((eventName) => {
          if (restProps[eventName]) {
            passedProps[eventName] = (...args: any[]) => {
              mergedChildrenProps[eventName]?.(...args);
              restProps[eventName](...args);
            };
          }
        });

        const triggerNode = createVNode(child, {
          ...mergedChildrenProps,
          ...passedProps,
          ref: setTargetRef,
        });
        return (
          <>
            {triggerNode}
            {rendedRef.value && (!uniqueContext || !unique) && (
              <TriggerContextProvider value={context.value}>
                <Popup
                  portal={PortalComponent}
                  ref={setPopupRef}
                  prefixCls={prefixCls}
                  popup={popup}
                  class={clsx(popupClassName, !isMobile.value && alignedClassName.value)}
                  style={popupStyle}
                  target={targetEle.value!}
                  onMouseEnter={onPopupMouseEnter}
                  onMouseLeave={onPopupMouseLeave}
                  // https://github.com/ant-design/ant-design/issues/43924
                  onPointerEnter={onPopupMouseEnter}
                  zIndex={zIndex}
                  // Open
                  open={mergedOpen.value}
                  keepDom={inMotion.value}
                  fresh={fresh}
                  // Click
                  onClick={onPopupClick}
                  onPointerDownCapture={onPopupPointerDown}
                  // Mask
                  mask={mask}
                  // Motion
                  motion={popupMotion}
                  maskMotion={maskMotion}
                  onVisibleChanged={onVisibleChanged}
                  onPrepare={onPrepare}
                  // Portal
                  forceRender={forceRender}
                  autoDestroy={mergedAutoDestroy.value}
                  getPopupContainer={getPopupContainer}
                  onEsc={onEsc}
                  // Arrow
                  align={alignInfo.value}
                  arrow={innerArrow.value}
                  arrowPos={arrowPos.value}
                  // Align
                  ready={ready.value}
                  offsetX={offsetX.value}
                  offsetY={offsetY.value}
                  offsetR={offsetR.value}
                  offsetB={offsetB.value}
                  onAlign={triggerAlign}
                  // Stretch
                  stretch={stretch}
                  targetWidth={targetWidth.value / scaleX.value}
                  targetHeight={targetHeight.value / scaleY.value}
                  // Mobile
                  mobile={mobile}
                />
              </TriggerContextProvider>
            )}
          </>
        );
      };
    },
    { inheritAttrs: false },
  );

  return Trigger;
}

export default generateTrigger(Portal);
