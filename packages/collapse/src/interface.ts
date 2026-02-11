import type { CSSMotionProps } from '@vc-com/motion';
import type { Key, RenderNode, VueNode } from '@vc-com/util/lib/types';
import type { CSSProperties, Ref } from 'vue';
import type { HtmlHTMLAttributes } from 'vue-jsx-vapor';
export type CollapsibleType = 'header' | 'icon' | 'disabled';

export interface ItemType extends Omit<
  CollapsePanelProps,
  | 'header' // alias of label
  | 'prefixCls'
  | 'panelKey' // alias of key
  | 'isActive'
  | 'accordion'
  | 'openMotion'
  | 'expandIcon'
> {
  key?: CollapsePanelProps['panelKey'];
  label?: CollapsePanelProps['header'];
  ref?: Ref<HTMLDivElement>;
}

export interface CollapseProps {
  prefixCls?: string;
  openMotion?: CSSMotionProps;
  onChange?: (key: Key[]) => void;
  accordion?: boolean;
  class?: string;
  style?: CSSProperties;
  destroyOnHidden?: boolean;
  expandIcon?: (props: Record<string, any>) => VueNode;
  collapsible?: CollapsibleType;
  /**
   * Collapse items content
   * @since 3.6.0
   */
  items?: ItemType[];
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
}

export type SemanticName = 'header' | 'title' | 'body' | 'icon';

export interface CollapsePanelProps extends HtmlHTMLAttributes<HTMLDivElement> {
  id?: string;
  header?: RenderNode;
  prefixCls?: string;
  headerClass?: string;
  showArrow?: boolean;
  class?: string;
  classNames?: Partial<Record<SemanticName, string>>;
  style?: CSSProperties;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  isActive?: boolean;
  openMotion?: CSSMotionProps;
  destroyOnHidden?: boolean;
  accordion?: boolean;
  forceRender?: boolean;
  extra?: RenderNode;
  onItemClick?: (panelKey: Key) => void;
  expandIcon?: (props: Record<string, any>) => VueNode;
  panelKey?: Key;
  role?: string;
  collapsible?: CollapsibleType;
  children?: RenderNode;
}
