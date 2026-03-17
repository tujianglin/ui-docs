import Render from '@vc-com/render';
import { useLockFocus } from '@vc-com/util/lib/Dom/focus';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { computed, defineComponent, toRefs, type CSSProperties } from 'vue';
import { useRef, type MouseEventHandler } from 'vue-jsx-vapor';
import { useRefContextInject } from '../../context';
import type { IDialogPropTypes } from '../../IDialogPropTypes';
import MemoChildren from './MemoChildren.vue';

export interface PanelProps extends Omit<IDialogPropTypes, 'getOpenCount'> {
  prefixCls: string;
  ariaId?: string;
  onMousedown?: MouseEventHandler;
  onMouseup?: MouseEventHandler;
  holderRef?: any;
  /** Used for focus lock. When true and open, focus will lock into the panel */
  isFixedPos?: boolean;
}

export type PanelRef = {
  focus: () => void;
};

const Panel = defineComponent(
  ({
    prefixCls,
    class: className,
    style,
    title,
    ariaId,
    footer,
    closable,
    closeIcon,
    onClose,
    bodyProps,
    modalRender,
    onMousedown,
    onMouseup,
    holderRef,
    visible,
    forceRender,
    width,
    height,
    classNames: modalClassNames,
    styles: modalStyles,
    isFixedPos,
    focusTrap,
  }: PanelProps) => {
    // ================================= Refs =================================
    const { panel: panelRef } = toRefs(useRefContextInject());
    const internalRef = useRef<HTMLDivElement>(null);
    const mergedRef = (el) => {
      panelRef.value = el;
      internalRef.value = el;
      holderRef.value = el;
    };

    const [ignoreElement] = useLockFocus(
      computed(() => visible && isFixedPos && focusTrap !== false),
      () => internalRef.value,
    );

    defineExpose({
      focus: () => {
        internalRef.value?.focus({ preventScroll: true });
      },
    });

    // ================================ Style =================================
    const contentStyle = computed(() => {
      const result = {} as CSSProperties;
      if (width !== undefined) {
        result.width = `${width}px`;
      }
      if (height !== undefined) {
        result.height = `${height}px`;
      }
      return result;
    });
    // ================================ Render ================================

    const closableObj = computed(() => {
      if (typeof closable === 'object' && closable !== null) {
        return closable;
      }
      if (closable) {
        return { closeIcon: closeIcon ?? <span class={`${prefixCls}-close-x`} /> };
      }
      return {};
    });

    const ariaProps = computed(() => pickAttrs(closableObj.value, true));
    const closeBtnIsDisabled = computed(() => typeof closable === 'object' && closable.disabled);

    return () => {
      const footerNode = (
        <div v-if={footer} class={clsx(`${prefixCls}-footer`, modalClassNames?.footer)} style={{ ...modalStyles?.footer }}>
          <Render content={footer}></Render>
        </div>
      );

      const headerNode = (
        <div v-if={title} class={clsx(`${prefixCls}-header`, modalClassNames?.header)} style={{ ...modalStyles?.header }}>
          <div class={clsx(`${prefixCls}-title`, modalClassNames?.title)} id={ariaId} style={{ ...modalStyles?.title }}>
            <Render content={title}></Render>
          </div>
        </div>
      );
      const closerNode = (
        <button
          v-if={closable}
          type="button"
          onClick={onClose}
          aria-label="Close"
          {...ariaProps.value}
          class={clsx(`${prefixCls}-close`, modalClassNames?.close)}
          disabled={closeBtnIsDisabled.value}
          style={modalStyles?.close}
        >
          <Render content={closableObj.value.closeIcon}></Render>
        </button>
      );
      const content = (
        <div class={clsx(`${prefixCls}-container`, modalClassNames?.container)} style={modalStyles?.container}>
          {closerNode}
          {headerNode}
          <div class={clsx(`${prefixCls}-body`, modalClassNames?.body)} style={modalStyles?.body} {...bodyProps}>
            <slot></slot>
          </div>
          {footerNode}
        </div>
      );

      return (
        <div
          key="dialog-element"
          role="dialog"
          aria-labelledby={title ? ariaId : null}
          aria-modal="true"
          ref={mergedRef}
          style={{ ...style, ...contentStyle.value }}
          class={clsx(prefixCls, className)}
          onMousedown={onMousedown}
          onMouseup={onMouseup}
          tabindex={-1}
          onFocus={(e) => {
            ignoreElement(e.target);
          }}
        >
          <MemoChildren shouldUpdate={visible || forceRender}>
            {() => (modalRender ? modalRender(content) : content)}
          </MemoChildren>
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Panel' : undefined },
);

export default Panel;
