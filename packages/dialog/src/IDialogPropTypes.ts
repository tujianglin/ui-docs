import type { GetContainer } from '@vc-com/util/lib/PortalWrapper';
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import type { CSSProperties, Ref } from 'vue';
import type { AriaAttributes, SyntheticEvent } from 'vue-jsx-vapor';

export type SemanticName = 'header' | 'body' | 'footer' | 'container' | 'title' | 'wrapper' | 'mask' | 'close';

export type ModalClassNames = Partial<Record<SemanticName, string>>;

export type ModalStyles = Partial<Record<SemanticName, CSSProperties>>;

export type ClosableType = {
  closeIcon?: RenderNode;
  disabled?: boolean;
  afterClose?: () => any;
};

export type IDialogPropTypes = {
  class?: string;
  keyboard?: boolean;
  style?: CSSProperties;
  rootStyle?: CSSProperties;
  mask?: boolean;
  afterClose?: () => void;
  afterOpenChange?: (open: boolean) => void;
  onClose?: (e: SyntheticEvent | KeyboardEvent) => any;
  closable?: boolean | (ClosableType & AriaAttributes);
  maskClosable?: boolean;
  visible?: boolean;
  destroyOnHidden?: boolean;
  mousePosition?: {
    x: number;
    y: number;
  } | null;
  title?: RenderNode;
  footer?: RenderNode;
  transitionName?: string;
  maskTransitionName?: string;
  animation?: any;
  maskAnimation?: any;
  prefixCls?: string;
  width?: string | number;
  height?: string | number;
  zIndex?: number;
  bodyProps?: any;
  maskProps?: any;
  rootClassName?: string;
  classNames?: ModalClassNames;
  styles?: ModalStyles;
  wrapProps?: any;
  getContainer?: GetContainer | false;
  closeIcon?: RenderNode;
  modalRender?: (node: VueNode) => VueNode;
  forceRender?: boolean;
  // https://github.com/ant-design/ant-design/issues/19771
  // https://github.com/react-component/dialog/issues/95
  focusTriggerAfterClose?: boolean;
  focusTrap?: boolean;

  // Refs
  panelRef?: Ref<HTMLDivElement>;
};
