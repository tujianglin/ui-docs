import contains from '@vc-com/util/lib/Dom/contains';
import { useId } from '@vc-com/util/lib/hooks/useId';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import { useFullProps, useRef, type SyntheticEvent } from 'vue-jsx-vapor';
import type { IDialogPropTypes } from '../IDialogPropTypes';
import { getMotionName } from '../util';
import Content, { type ContentRef } from './Content';
import Mask from './Mask';

const Dialog = defineComponent(
  ({
    prefixCls = 'rc-dialog',
    zIndex,
    visible = false,
    focusTriggerAfterClose = true,
    wrapProps,
    onClose,
    afterOpenChange,
    afterClose,

    // Dialog
    transitionName,
    animation,
    closable = true,

    // Mask
    mask = true,
    maskTransitionName,
    maskAnimation,
    maskClosable = true,
    maskProps,
    rootClassName,
    rootStyle,
    classNames: modalClassNames,
    styles: modalStyles,
  }: IDialogPropTypes) => {
    const props = useFullProps() as IDialogPropTypes;

    const lastOutSideActiveElementRef = useRef<HTMLElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<ContentRef>(null);

    const animatedVisible = ref(visible);
    const isFixedPos = ref(false);

    // ========================== Init ==========================
    const ariaId = useId();

    function saveLastOutSideActiveElementRef() {
      if (!contains(wrapperRef.value, document.activeElement)) {
        lastOutSideActiveElementRef.value = document.activeElement as HTMLElement;
      }
    }

    function focusDialogContent() {
      if (!contains(wrapperRef.value, document.activeElement)) {
        contentRef.value?.focus();
      }
    }

    // ========================= Events =========================
    // Close action will trigger by:
    //   1. When hide motion end
    //   2. Controlled `open` to `false` immediately after set to `true` which will not trigger motion
    function doClose() {
      // Clean up scroll bar & focus back
      animatedVisible.value = false;

      if (mask && lastOutSideActiveElementRef.value && focusTriggerAfterClose) {
        try {
          lastOutSideActiveElementRef.value.focus({ preventScroll: true });
        } catch {
          // Do nothing
        }
        lastOutSideActiveElementRef.value = null;
      }

      // Trigger afterClose only when change visible from true to false
      if (animatedVisible.value) {
        afterClose?.();
      }
    }

    function onDialogVisibleChanged(newVisible: boolean) {
      // Try to focus
      if (newVisible) {
        focusDialogContent();
      } else {
        doClose();
      }
      afterOpenChange?.(newVisible);
    }

    function onInternalClose(e) {
      onClose?.(e);
    }

    // >>> Content
    const mouseDownOnMaskRef = useRef(false);

    // >>> Wrapper
    // Close only when element not on dialog
    let onWrapperClick: (e: SyntheticEvent) => void = null;
    if (maskClosable) {
      onWrapperClick = (e) => {
        if (wrapperRef.value === e.target && mouseDownOnMaskRef.value) {
          onInternalClose(e);
        }
      };
    }

    function onWrapperMouseDown(e: MouseEvent) {
      mouseDownOnMaskRef.value = e.target === wrapperRef.value;
    }

    // ========================= Effect =========================
    watch(
      () => visible,
      () => {
        if (visible) {
          mouseDownOnMaskRef.value = false;
          animatedVisible.value = true;
          saveLastOutSideActiveElementRef();

          // Calc the position style
          if (wrapperRef.value) {
            const computedWrapStyle = getComputedStyle(wrapperRef.value);
            isFixedPos.value = computedWrapStyle.position === 'fixed';
          }
        } else if (animatedVisible.value && contentRef.value.enableMotion() && !contentRef.value?.inMotion()) {
          doClose();
        }
      },
      { immediate: true },
    );

    const mergedStyle = computed<CSSProperties>(() => ({
      zIndex,
      ...modalStyles?.wrapper,
      display: !animatedVisible.value ? 'none' : null,
    }));

    // ========================= Render =========================
    return () => (
      <div class={clsx(`${prefixCls}-root`, rootClassName)} style={rootStyle} {...pickAttrs(props, { data: true })}>
        <Mask
          prefixCls={prefixCls}
          visible={mask && visible}
          motionName={getMotionName(prefixCls, maskTransitionName, maskAnimation)}
          style={{ zIndex, ...modalStyles?.mask }}
          maskProps={maskProps}
          className={modalClassNames?.mask}
        />
        <div
          className={clsx(`${prefixCls}-wrap`, modalClassNames?.wrapper)}
          ref={wrapperRef}
          onClick={onWrapperClick}
          onMouseDown={onWrapperMouseDown}
          style={mergedStyle.value}
          {...wrapProps}
        >
          <Content
            {...props}
            isFixedPos={isFixedPos.value}
            ref={contentRef}
            closable={closable}
            ariaId={ariaId.value}
            prefixCls={prefixCls}
            visible={visible && animatedVisible.value}
            onClose={onInternalClose}
            onVisibleChanged={onDialogVisibleChanged}
            motionName={getMotionName(prefixCls, transitionName, animation)}
          >
            <slot></slot>
          </Content>
        </div>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Dialog;
