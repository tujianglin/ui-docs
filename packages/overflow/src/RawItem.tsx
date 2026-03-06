import { clsx } from 'clsx';
import { defineComponent } from 'vue';
import { useRef, type HTMLAttributes } from 'vue-jsx-vapor';
import Item from './Item';
import { OverflowContextProvider, useOverflowContextInject } from './context';

export interface RawItemProps extends HTMLAttributes<any> {
  component?: any;
}

const RawItem = defineComponent(
  (props: RawItemProps) => {
    const context = useOverflowContextInject();
    const domRef = useRef();

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });

    // Render directly when context not provided
    return () => {
      if (!context) {
        const { component: Component = 'div', ...restProps } = props;
        return (
          <Component {...restProps} ref={domRef}>
            <slot></slot>
          </Component>
        );
      }

      const { class: contextClassName, ...restContext } = context as any;
      const { class: className, ...restProps } = props;

      // Do not pass context to sub item to avoid multiple measure
      return (
        <OverflowContextProvider value={null}>
          <Item ref={domRef} class={clsx(contextClassName, className)} {...restContext} {...restProps}>
            <slot></slot>
          </Item>
        </OverflowContextProvider>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'RawItem' : undefined },
);

export default RawItem;
