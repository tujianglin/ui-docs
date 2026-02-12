import pickAttrs from '@vc-com/util/lib/pickAttrs';
import type { Key } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import useItems from './hooks/useItems';
import type { CollapseProps } from './interface';

function getActiveKeysArray(activeKey: Key | Key[]): Key[] {
  let currentActiveKey = activeKey;
  if (!Array.isArray(currentActiveKey)) {
    const activeKeyType = typeof currentActiveKey;
    currentActiveKey = activeKeyType === 'number' || activeKeyType === 'string' ? [currentActiveKey] : [];
  }
  return currentActiveKey.map((key) => String(key));
}

const Collapse = defineComponent(
  ({
    prefixCls = 'rc-collapse',
    destroyOnHidden = false,
    style,
    accordion,
    class: className,
    collapsible,
    openMotion,
    expandIcon,
    onChange,
    items,
    classNames: customizeClassNames,
    styles,
  }: CollapseProps) => {
    const props = useFullProps();
    const collapseClassName = computed(() => clsx(prefixCls, className));

    const internalActiveKey = defineModel<Key | Key[]>('activeKey');

    const activeKey = computed(() => getActiveKeysArray(internalActiveKey.value));

    const triggerActiveKey = (next) => {
      const nextKeys = getActiveKeysArray(next);
      internalActiveKey.value = nextKeys;
      onChange?.(nextKeys);
    };

    const onItemClick = (key: Key) => {
      if (accordion) {
        triggerActiveKey(activeKey.value[0] === key ? [] : [key]);
      } else {
        triggerActiveKey(
          activeKey.value.includes(key) ? activeKey.value.filter((item) => item !== key) : [...activeKey.value, key],
        );
      }
    };

    // ======================== Children ========================

    const mergedChildren = useItems(
      computed(() => items),
      reactiveComputed(() => ({
        prefixCls,
        accordion,
        openMotion,
        expandIcon,
        collapsible,
        destroyOnHidden,
        onItemClick,
        activeKey: activeKey.value,
        classNames: customizeClassNames,
        styles,
      })),
    );

    const domRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });
    // ======================== Render ========================
    return () => (
      <div
        ref={domRef}
        class={collapseClassName.value}
        style={style}
        role={accordion ? 'tablist' : undefined}
        {...pickAttrs(props, { aria: true, data: true })}
      >
        {mergedChildren.value}
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Collapse;
