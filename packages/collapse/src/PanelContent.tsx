import { resolveVNode } from '@vc-com/util/lib/vnode';
import { clsx } from 'clsx';
import { defineComponent, ref, watch } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { CollapsePanelProps } from './interface';

const PanelContent = defineComponent(
  ({
    prefixCls,
    forceRender,
    class: className,
    style,
    children,
    isActive,
    role,
    classNames: customizeClassNames,
    styles,
  }: CollapsePanelProps) => {
    const rendered = ref(isActive || forceRender);

    watch(
      [() => forceRender, () => isActive],
      () => {
        if (forceRender || isActive) {
          rendered.value = true;
        }
      },
      { immediate: true, deep: true },
    );

    const domRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });

    return () => (
      <div
        v-if={rendered.value}
        ref={domRef}
        class={clsx(
          `${prefixCls}-panel`,
          {
            [`${prefixCls}-panel-active`]: isActive,
            [`${prefixCls}-panel-inactive`]: !isActive,
          },
          className,
        )}
        style={style}
        role={role}
      >
        <div class={clsx(`${prefixCls}-body`, customizeClassNames?.body)} style={styles?.body}>
          {resolveVNode(children)}
        </div>
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV === 'development' ? 'PanelContent' : undefined },
);

export default PanelContent;
