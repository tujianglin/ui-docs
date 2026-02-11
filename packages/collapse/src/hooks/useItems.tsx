import type { Key } from '@vc-com/util/lib/types';
import type { ReactiveComputedReturn } from '@vueuse/core';
import clsx from 'clsx';
import { computed, type CSSProperties, type Ref } from 'vue';
import type { CollapsePanelProps, CollapseProps, ItemType } from '../interface';
import CollapsePanel from '../Panel';

type Props = Pick<CollapsePanelProps, 'prefixCls' | 'onItemClick' | 'openMotion' | 'expandIcon' | 'classNames' | 'styles'> &
  Pick<CollapseProps, 'accordion' | 'collapsible' | 'destroyOnHidden'> & {
    activeKey: Key[];
  };

function mergeSemantic<T>(src: T, tgt: T, mergeFn: (a: any, b: any) => any) {
  if (!src || !tgt) {
    return src || tgt;
  }

  const keys = Array.from(new Set([...Object.keys(src), ...Object.keys(tgt)]));
  const result = {};
  keys.forEach((key) => {
    result[key] = mergeFn(src[key], tgt[key]);
  });
  return result;
}

function mergeSemanticClassNames<T>(src: T, tgt: T) {
  return mergeSemantic(src, tgt, (a: string, b: string) => clsx(a, b));
}

function mergeSemanticStyles<T>(src: T, tgt: T) {
  return mergeSemantic(src, tgt, (a: CSSProperties, b: CSSProperties) => ({
    ...a,
    ...b,
  }));
}

const convertItemsToNodes = (items: ItemType[], props: Props) => {
  const {
    prefixCls,
    accordion,
    collapsible,
    destroyOnHidden,
    onItemClick,
    activeKey,
    openMotion,
    expandIcon,
    classNames: collapseClassNames,
    styles: collapseStyles,
  } = props;

  return items.map((item, index) => {
    const {
      label,
      key: rawKey,
      collapsible: rawCollapsible,
      onItemClick: rawOnItemClick,
      destroyOnHidden: rawDestroyOnHidden,
      classNames,
      styles,
      ...restProps
    } = item;

    // You may be puzzled why you want to convert them all into strings, me too.
    // Maybe: https://github.com/react-component/collapse/blob/aac303a8b6ff30e35060b4f8fecde6f4556fcbe2/src/Collapse.tsx#L15
    const key = String(rawKey ?? index);
    const mergeCollapsible = rawCollapsible ?? collapsible;
    const mergedDestroyOnHidden = rawDestroyOnHidden ?? destroyOnHidden;

    const handleItemClick = (value: Key) => {
      if (mergeCollapsible === 'disabled') {
        return;
      }
      onItemClick(value);
      rawOnItemClick?.(value);
    };

    let isActive = false;
    if (accordion) {
      isActive = activeKey[0] === key;
    } else {
      isActive = activeKey.indexOf(key) > -1;
    }

    return (
      <CollapsePanel
        {...restProps}
        classNames={mergeSemanticClassNames(collapseClassNames, classNames)}
        styles={mergeSemanticStyles(collapseStyles, styles)}
        prefixCls={prefixCls}
        key={key}
        panelKey={key}
        isActive={isActive}
        accordion={accordion}
        openMotion={openMotion}
        expandIcon={expandIcon}
        header={label}
        collapsible={mergeCollapsible}
        onItemClick={handleItemClick}
        destroyOnHidden={mergedDestroyOnHidden}
      ></CollapsePanel>
    );
  });
};

function useItems(items?: Ref<ItemType[]>, props?: ReactiveComputedReturn<Props>) {
  return computed(() => {
    if (Array.isArray(items.value)) {
      return convertItemsToNodes(items.value, props);
    }
    return [];
  });
}

export default useItems;
