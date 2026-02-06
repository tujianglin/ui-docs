import type { TriggerRef } from '@vc-com/trigger';
import Trigger from '@vc-com/trigger';
import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import KeyCode from '@vc-com/util/lib/KeyCode';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, isRef, nextTick, ref, shallowRef, watch, type CSSProperties } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import { useClosable } from './hooks/useClosable';
import useTarget from './hooks/useTarget';
import type { TourProps, TourStepInfo } from './interface';
import Mask from './Mask';
import Placeholder from './Placeholder';
import { getPlacements } from './placements';
import TourStep from './TourStep';
import { getPlacement } from './util';

const CENTER_PLACEHOLDER: CSSProperties = {
  left: '50%',
  top: '50%',
  width: '1px',
  height: '1px',
};
const defaultScrollIntoViewOptions: ScrollIntoViewOptions = {
  block: 'center',
  inline: 'center',
};

export type { TourProps };

const Tour = defineComponent(
  ({
    prefixCls = 'rc-tour',
    steps = [],
    defaultCurrent,
    current,
    keyboard = true,
    onChange,
    onClose,
    onFinish,
    open,
    defaultOpen,
    mask = true,
    arrow = true,
    rootClassName,
    placement,
    renderPanel,
    gap,
    animated,
    scrollIntoViewOptions = defaultScrollIntoViewOptions,
    zIndex = 1001,
    closeIcon,
    closable,
    builtinPlacements,
    disabledInteraction,
    styles,
    classNames: tourClassNames,
    class: className,
    style,
    getPopupContainer,
    ...restProps
  }: TourProps) => {
    const triggerRef = useRef<TriggerRef>();

    const [mergedCurrent, setMergedCurrent] = useControlledState(
      defaultCurrent || 0,
      computed(() => current),
    );

    const [internalOpen, setMergedOpen] = useControlledState(
      defaultOpen,
      computed(() => open),
    );
    const mergedOpen = computed(() =>
      mergedCurrent.value < 0 || mergedCurrent.value >= steps.length ? false : (internalOpen.value ?? true),
    );

    // Record if already rended in the DOM to avoid `findDOMNode` issue
    const hasOpened = ref(mergedOpen.value);

    const openRef = shallowRef(mergedOpen.value);

    watch(
      mergedOpen,
      async () => {
        await nextTick();
        if (mergedOpen.value) {
          if (!openRef.value) {
            mergedCurrent.value = 0;
          }

          hasOpened.value = true;
        }
        openRef.value = mergedOpen.value;
      },
      { immediate: true, flush: 'post' },
    );

    const {
      target,
      placement: stepPlacement,
      style: stepStyle,
      arrow: stepArrow,
      class: stepClassName,
      mask: stepMask,
      scrollIntoViewOptions: stepScrollIntoViewOptions = defaultScrollIntoViewOptions,
      // @ts-ignore
      closeIcon: stepCloseIcon,
      closable: stepClosable,
    } = $(reactiveComputed(() => steps[mergedCurrent.value] || ({} as TourStepInfo)));

    const mergedClosable = useClosable(
      computed(() => stepClosable),
      computed(() => stepCloseIcon),
      computed(() => closable),
      computed(() => closeIcon),
    );

    const mergedMask = computed(() => mergedOpen?.value && (stepMask ?? mask));
    const mergedScrollIntoViewOptions = computed(() => stepScrollIntoViewOptions ?? scrollIntoViewOptions);

    // ====================== Align Target ======================
    const placeholderRef = useRef();

    const inlineMode = computed(() => getPopupContainer === false);

    const [posInfo, targetElement] = useTarget(
      computed(() => (isRef(target) ? target.value : target) as any),
      computed(() => open),
      computed(() => gap),
      mergedScrollIntoViewOptions,
      inlineMode,
      placeholderRef,
    );

    const mergedPlacement = getPlacement(
      targetElement,
      computed(() => placement),
      computed(() => stepPlacement),
    );

    // ========================= arrow =========================
    const mergedArrow = computed(() => (targetElement?.value ? (typeof stepArrow === 'undefined' ? arrow : stepArrow) : false));
    const arrowPointAtCenter = computed(() =>
      typeof mergedArrow?.value === 'object' ? mergedArrow.value?.pointAtCenter : false,
    );

    watch(
      [arrowPointAtCenter, mergedCurrent],
      () => {
        nextTick(() => {
          triggerRef.value?.forceAlign();
        });
      },
      { immediate: true, flush: 'post' },
    );

    // ========================= Change =========================
    const onInternalChange = (nextCurrent: number) => {
      setMergedCurrent(nextCurrent);
      onChange?.(nextCurrent);
    };

    const mergedBuiltinPlacements = computed(() => {
      if (builtinPlacements) {
        return typeof builtinPlacements === 'function'
          ? builtinPlacements({ arrowPointAtCenter: arrowPointAtCenter.value })
          : builtinPlacements;
      }
      return getPlacements(arrowPointAtCenter.value);
    });
    const handleClose = () => {
      setMergedOpen(false);
      onClose?.(mergedCurrent.value);
    };

    // ========================= Esc Close =========================
    // Use Portal's onEsc to handle Escape key with proper stacking logic
    const handleEscClose = ({ event }: { top: boolean; event: KeyboardEvent }) => {
      if (keyboard && mergedClosable.value !== null) {
        event.preventDefault();
        handleClose();
      }
    };

    // ========================= Keyboard =========================
    // Support ArrowLeft/ArrowRight to navigate steps.
    const keyboardHandler = (e: KeyboardEvent) => {
      // Ignore keyboard events from input-like elements to avoid interfering when typing
      if (KeyCode.isEditableTarget(e)) {
        return;
      }

      if (keyboard && e.key === 'ArrowLeft') {
        if (mergedCurrent.value > 0) {
          e.preventDefault();
          onInternalChange(mergedCurrent.value - 1);
        }
        return;
      }

      if (keyboard && e.key === 'ArrowRight') {
        if (mergedCurrent.value < steps.length - 1) {
          e.preventDefault();
          onInternalChange(mergedCurrent.value + 1);
        }
        return;
      }
    };

    watch(
      mergedOpen,
      async (_n, _o, onCleanup) => {
        await nextTick();
        if (!mergedOpen.value) return;
        window.addEventListener('keydown', keyboardHandler);
        onCleanup(() => {
          window.removeEventListener('keydown', keyboardHandler);
        });
      },
      { flush: 'post', immediate: true },
    );

    const getPopupElement = () => (
      <TourStep
        styles={styles}
        classNames={tourClassNames}
        arrow={mergedArrow.value}
        key="content"
        prefixCls={prefixCls}
        total={steps.length}
        renderPanel={renderPanel}
        onPrev={() => {
          onInternalChange(mergedCurrent.value - 1);
        }}
        onNext={() => {
          onInternalChange(mergedCurrent.value + 1);
        }}
        onClose={handleClose}
        current={mergedCurrent.value}
        onFinish={() => {
          handleClose();
          onFinish?.();
        }}
        {...steps[mergedCurrent.value]}
        closable={mergedClosable.value}
      />
    );

    const mergedShowMask = computed(() => (typeof mergedMask.value === 'boolean' ? mergedMask.value : !!mergedMask.value));
    const mergedMaskStyle = computed(() => (typeof mergedMask.value === 'boolean' ? undefined : mergedMask.value));

    // when targetElement is not exist, use body as triggerDOMNode
    const fallbackDOM = () => {
      return targetElement.value || document.body;
    };

    return () => {
      // ========================= Render =========================
      // Skip if not init yet
      if (targetElement.value === undefined || !hasOpened.value) {
        return null;
      }
      return (
        <>
          <Mask
            getPopupContainer={getPopupContainer}
            styles={styles}
            classNames={tourClassNames}
            zIndex={zIndex}
            prefixCls={prefixCls}
            pos={posInfo.value}
            showMask={mergedShowMask.value}
            style={mergedMaskStyle?.value?.style}
            fill={mergedMaskStyle?.value?.color}
            open={mergedOpen?.value}
            animated={animated}
            rootClass={rootClassName}
            disabledInteraction={disabledInteraction}
            onEsc={handleEscClose}
          />
          <Trigger
            {...restProps}
            // `rc-portal` def bug not support `false` but does support and in used.
            getPopupContainer={getPopupContainer as any}
            builtinPlacements={mergedBuiltinPlacements.value}
            ref={triggerRef}
            popupStyle={stepStyle}
            popupPlacement={mergedPlacement?.value}
            popupVisible={mergedOpen?.value}
            popupClassName={clsx(rootClassName, stepClassName)}
            prefixCls={prefixCls}
            popup={getPopupElement}
            forceRender={false}
            autoDestroy
            zIndex={zIndex}
            arrow={!!mergedArrow?.value}
          >
            <Placeholder
              open={mergedOpen.value}
              autoLock={!inlineMode?.value}
              getContainer={getPopupContainer as any}
              domRef={placeholderRef}
              fallbackDOM={fallbackDOM}
              class={clsx(className, rootClassName, `${prefixCls}-target-placeholder`)}
              style={{
                ...(posInfo?.value
                  ? {
                      left: `${posInfo.value.left}px`,
                      top: `${posInfo.value.top}px`,
                      width: `${posInfo.value.width}px`,
                      height: `${posInfo.value.height}px`,
                      borderRadius: `${posInfo.value.radius}px`,
                    }
                  : CENTER_PLACEHOLDER),
                position: inlineMode?.value ? 'absolute' : 'fixed',
                pointerEvents: 'none',
                ...style,
              }}
            />
          </Trigger>
        </>
      );
    };
  },
  { inheritAttrs: false },
);

export default Tour;
