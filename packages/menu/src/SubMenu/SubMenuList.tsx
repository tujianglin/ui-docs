import { clsx } from 'clsx';
import { defineComponent, getCurrentInstance } from 'vue';
import type { HTMLAttributes } from 'vue-jsx-vapor';
import { useMenuContextInject } from '../context/MenuContext';

export interface SubMenuListProps extends HTMLAttributes<HTMLUListElement> {}

const SubMenuList = defineComponent(
  ({ class: className, ...restProps }: SubMenuListProps) => {
    const { prefixCls, mode, rtl } = $(useMenuContextInject());

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };

    return () => (
      <ul
        class={clsx(
          prefixCls,
          rtl && `${prefixCls}-rtl`,
          `${prefixCls}-sub`,
          `${prefixCls}-${mode === 'inline' ? 'inline' : 'vertical'}`,
          className,
        )}
        role="menu"
        {...restProps}
        data-menu-list
        ref={changeRef}
      >
        <slot></slot>
      </ul>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'SubMenuList' : undefined },
);

export default SubMenuList;
