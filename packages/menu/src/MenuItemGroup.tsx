import { clsx } from 'clsx';
import { omit } from 'es-toolkit';
import { computed, defineComponent, getCurrentInstance } from 'vue';
import { filterEmpty } from '../../util/src/props-util';
import type { VueNode } from '../../util/src/types';
import { resolveVNode } from '../../util/src/vnode';
import { useMenuContextInject } from './context/MenuContext';
import { useFullPath, usePathRegisterContextInject } from './context/PathContext';
import type { MenuItemGroupType } from './interface';
import { parseChildren } from './utils/commonUtil';

export interface MenuItemGroupProps extends Omit<MenuItemGroupType, 'type' | 'children' | 'label'> {
  title?: VueNode;

  /** @private Internal filled key. Do not set it directly */
  eventKey?: string;

  /** @private Do not use. Private warning empty usage */
  warnKey?: boolean;
}

const InternalMenuItemGroup = defineComponent(
  ({ class: className, title, eventKey: _, ...restProps }: MenuItemGroupProps) => {
    const { prefixCls, classNames: menuClassNames, styles } = $(useMenuContextInject());

    const groupPrefixCls = `${prefixCls}-item-group`;

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };

    return () => (
      <li
        ref={changeRef}
        role="presentation"
        {...restProps}
        onClick={(e) => e.stopPropagation()}
        class={clsx(groupPrefixCls, className)}
      >
        <div
          role="presentation"
          class={clsx(`${groupPrefixCls}-title`, menuClassNames?.listTitle)}
          style={styles?.listTitle}
          title={typeof title === 'string' ? title : undefined}
        >
          {resolveVNode(title)}
        </div>
        <ul role="group" class={clsx(`${groupPrefixCls}-list`, menuClassNames?.list)} style={styles?.list}>
          <slot></slot>
        </ul>
      </li>
    );
  },
  { inheritAttrs: false },
);

const MenuItemGroup = defineComponent(
  (props: MenuItemGroupProps) => {
    const slots = defineSlots();
    const connectedKeyPath = useFullPath(computed(() => props.eventKey));

    const measure = usePathRegisterContextInject();

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };
    return () => {
      const children = filterEmpty(slots.default?.());
      const childList = parseChildren(children, connectedKeyPath.value) as any;
      if (measure) {
        return childList;
      }

      return (
        <InternalMenuItemGroup ref={changeRef} {...omit(props, ['warnKey'])}>
          {childList}
        </InternalMenuItemGroup>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'MenuItemGroup' : undefined },
);

export default MenuItemGroup;
