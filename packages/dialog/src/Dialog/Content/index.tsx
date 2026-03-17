import CSSMotion from '@vc-com/motion';
import type { CSSMotionRef } from '@vc-com/motion/CSSMotion';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, type CSSProperties } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import { offset } from '../../util';
import type { PanelProps, PanelRef } from './Panel';
import Panel from './Panel';

export type CSSMotionStateRef = Pick<CSSMotionRef, 'inMotion' | 'enableMotion'>;

export type ContentRef = PanelRef & CSSMotionStateRef;

export type ContentProps = {
  motionName: string;
  ariaId: string;
  onVisibleChanged: (visible: boolean) => void;
} & PanelProps;

const Content = defineComponent(
  ({
    prefixCls,
    title,
    style,
    class: className,
    visible,
    forceRender,
    destroyOnHidden,
    motionName,
    ariaId,
    onVisibleChanged,
    mousePosition,
    onClose: _ = () => ({}),
    onMousedown: _1 = () => ({}),
    onMouseup: _2 = () => ({}),
  }: ContentProps) => {
    const props = useFullProps() as unknown as ContentProps;
    const dialogRef = useRef<{ nativeElement: HTMLElement } & CSSMotionStateRef>(null);

    const panelRef = useRef<PanelRef>(null);

    // ============================== Refs ==============================
    defineExpose({
      get nativeElement() {
        return panelRef.value;
      },
      focus: () => {
        panelRef.value?.focus();
      },
      inMotion: () => {
        dialogRef.value?.inMotion?.();
      },
      enableMotion: () => {
        dialogRef.value?.enableMotion?.();
      },
    });

    // ============================= Style ==============================
    const transformOrigin = ref<string>();
    const contentStyle = computed(() => {
      const result = {} as CSSProperties;
      if (transformOrigin.value) {
        result.transformOrigin = transformOrigin.value;
      }
      return result;
    });

    function onPrepare() {
      if (!dialogRef.value?.nativeElement) {
        return;
      }

      const elementOffset = offset(dialogRef.value.nativeElement);

      transformOrigin.value =
        mousePosition && (mousePosition.x || mousePosition.y)
          ? `${mousePosition.x - elementOffset.left}px ${mousePosition.y - elementOffset.top}px`
          : '';
    }
    // ============================= Render =============================
    return () => (
      <CSSMotion
        visible={visible}
        onVisibleChanged={onVisibleChanged}
        onAppearPrepare={onPrepare}
        onEnterPrepare={onPrepare}
        forceRender={forceRender}
        motionName={motionName}
        removeOnLeave={destroyOnHidden}
        ref={dialogRef}
      >
        {({ class: motionClassName, style: motionStyle, ref: motionRef }) => (
          <Panel
            {...props}
            ref={panelRef}
            title={title}
            ariaId={ariaId}
            prefixCls={prefixCls}
            holderRef={motionRef}
            style={{ ...motionStyle, ...style, ...contentStyle.value }}
            class={clsx(className, motionClassName)}
          >
            <slot></slot>
          </Panel>
        )}
      </CSSMotion>
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  Content.displayName = 'Content';
}

export default Content;
