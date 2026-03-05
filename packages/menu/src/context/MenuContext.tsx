import type { CSSMotionProps } from '@vc-com/motion';
import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { SubMenuProps } from '..';
import type {
  BuiltinPlacements,
  MenuClickEventHandler,
  MenuMode,
  PopupRender,
  RenderIconType,
  TriggerSubMenuAction,
} from '../interface';

export interface MenuContextProps {
  prefixCls: string;
  classNames?: SubMenuProps['classNames'];
  styles?: SubMenuProps['styles'];
  rootClassName?: string;
  openKeys: string[];
  rtl?: boolean;

  // Mode
  mode: MenuMode;

  // Disabled
  disabled?: boolean;
  // Used for overflow only. Prevent hidden node trigger open
  overflowDisabled?: boolean;

  // Active
  activeKey: string;
  onActive: (key: string) => void;
  onInactive: (key: string) => void;

  // Selection
  selectedKeys: string[];

  // Level
  inlineIndent: number;

  // Motion
  motion?: CSSMotionProps;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMotions?: Partial<{ [key in MenuMode | 'other']: CSSMotionProps }>;

  // Popup
  subMenuOpenDelay: number;
  subMenuCloseDelay: number;
  forceSubMenuRender?: boolean;
  builtinPlacements?: BuiltinPlacements;
  triggerSubMenuAction?: TriggerSubMenuAction;

  popupRender?: PopupRender;

  // Icon
  itemIcon?: RenderIconType;
  expandIcon?: RenderIconType;

  // Function
  onItemClick: MenuClickEventHandler;
  onOpenChange: (key: string, open: boolean) => void;
  getPopupContainer: (node: HTMLElement) => HTMLElement;
}

const MenuContext: InjectionKey<Reactive<MenuContextProps>> = Symbol('MenuContext');

function mergeProps(origin: MenuContextProps, target: Partial<MenuContextProps>): MenuContextProps {
  const clone = { ...origin };

  Object.keys(target).forEach((key) => {
    const value = target[key];
    if (value !== undefined) {
      clone[key] = value;
    }
  });

  return clone;
}

export const useMenuContextInject = () => {
  return inject(MenuContext, reactive({} as MenuContextProps));
};

export const MenuContextProvider = defineComponent((props: { value: MenuContextProps }) => {
  provide(
    MenuContext,
    reactiveComputed(() => props.value),
  );
  return () => <slot></slot>;
});

export interface InheritableContextProps extends Partial<MenuContextProps> {
  locked?: boolean;
}

const InheritableContextProvider = defineComponent(
  ({ locked: _, ...restProps }: InheritableContextProps) => {
    const context = useMenuContextInject();
    // @ts-ignore
    const inheritContext = computed(() => mergeProps(context, restProps));
    return () => (
      <MenuContextProvider value={inheritContext.value}>
        <slot></slot>
      </MenuContextProvider>
    );
  },
  {
    inheritAttrs: false,
  },
);

export default InheritableContextProvider;
