import type { CSSProperties } from 'vue';
import type { KeyboardEvent, MouseEvent } from 'vue-jsx-vapor';
import type { Key, RenderNode, VueNode } from '../../util/src/types';
import type { SubMenuProps } from './SubMenu';

// ========================= Options =========================
interface ItemSharedProps {
  style?: CSSProperties;
  class?: string;
}

export interface SubMenuType extends ItemSharedProps {
  type?: 'submenu';

  label?: RenderNode;

  children: ItemType[];

  disabled?: boolean;

  key: string;

  rootClassName?: string;

  // >>>>> Icon
  itemIcon?: RenderIconType;
  expandIcon?: RenderIconType;

  // >>>>> Active
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;

  // >>>>> Popup
  popupClassName?: string;
  popupOffset?: number[];
  popupStyle?: CSSProperties;
  popupRender?: PopupRender;

  // >>>>> Events
  onClick?: MenuClickEventHandler;
  onTitleClick?: (info: MenuTitleInfo) => void;
  onTitleMouseEnter?: MenuHoverEventHandler;
  onTitleMouseLeave?: MenuHoverEventHandler;
}

export interface MenuItemType extends ItemSharedProps {
  type?: 'item';

  label?: RenderNode;

  disabled?: boolean;

  itemIcon?: RenderIconType;

  extra?: RenderNode;

  key: Key;

  // >>>>> Active
  onMouseenter?: MenuHoverEventHandler;
  onMouseleave?: MenuHoverEventHandler;

  // >>>>> Events
  onClick?: MenuClickEventHandler;
}

export interface MenuItemGroupType extends ItemSharedProps {
  type: 'group';

  label?: RenderNode;

  children?: ItemType[];
}

export interface MenuDividerType extends Omit<ItemSharedProps, 'ref'> {
  type: 'divider';
}

export type ItemType = SubMenuType | MenuItemType | MenuItemGroupType | MenuDividerType | null;

// ========================== Basic ==========================
export type MenuMode = 'horizontal' | 'vertical' | 'inline';

export type BuiltinPlacements = Record<string, any>;

export type TriggerSubMenuAction = 'click' | 'hover';

export interface RenderIconInfo {
  isSelected?: boolean;
  isOpen?: boolean;
  isSubMenu?: boolean;
  disabled?: boolean;
}

export type RenderIconType = RenderNode | ((props: RenderIconInfo) => RenderNode);

export interface MenuInfo {
  key: string;
  keyPath: string[];
  /** @deprecated This will not support in future. You should avoid to use this */
  item: VueNode;
  domEvent: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;
}

export interface MenuTitleInfo {
  key: string;
  domEvent: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;
}

// ========================== Hover ==========================
export type MenuHoverEventHandler = (info: { key: string; domEvent: MouseEvent<HTMLElement> }) => void;

// ======================== Selection ========================
export interface SelectInfo extends MenuInfo {
  selectedKeys: string[];
}

export type SelectEventHandler = (info: SelectInfo) => void;

// ========================== Click ==========================
export type MenuClickEventHandler = (info: MenuInfo) => void;

export type MenuRef = {
  /**
   * Focus active child if any, or the first child which is not disabled will be focused.
   * @param options
   */
  focus: (options?: FocusOptions) => void;
  list: HTMLUListElement;
  findItem: (params: { key: string }) => HTMLElement | null;
};

// ======================== Component ========================
export type ComponentType = 'submenu' | 'item' | 'group' | 'divider';

export type Components = Partial<Record<ComponentType, any>>;

export type PopupRender = (node: VueNode, info: { item: SubMenuProps; keys: string[] }) => VueNode;
