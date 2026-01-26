import type { TriggerProps } from '@vc-com/trigger';
import type { CSSProperties, Ref } from 'vue';
import type { AriaAttributes, HTMLAttributes } from 'vue-jsx-vapor';
import type { VueNode } from '../../util/src/types';
import type { Gap } from './hooks/useTarget';
import type { PlacementType } from './placements';
import { type DefaultPanelProps } from './TourStep/DefaultPanel';

export type SemanticName = 'section' | 'footer' | 'actions' | 'header' | 'title' | 'description' | 'mask';

export type HTMLAriaDataAttributes = AriaAttributes & {
  [key: `data-${string}`]: unknown;
} & Pick<HTMLAttributes<HTMLDivElement>, 'role'>;

export interface TourStepInfo {
  arrow?: boolean | { pointAtCenter: boolean };
  target?: Ref<HTMLElement> | (() => HTMLElement) | null | (() => null);
  title: (() => VueNode) | VueNode;
  description?: (() => VueNode) | VueNode;
  placement?: PlacementType;
  mask?:
    | boolean
    | {
        style?: CSSProperties;
        // to fill mask color, e.g. rgba(80,0,0,0.5)
        color?: string;
      };
  class?: string;
  style?: CSSProperties;
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  closeIcon?: VueNode;
  closable?: boolean | ({ closeIcon?: VueNode } & HTMLAriaDataAttributes);
}

export interface TourStepProps extends TourStepInfo {
  prefixCls?: string;
  total?: number;
  current?: number;
  onClose?: () => void;
  onFinish?: () => void;
  renderPanel?: (step: TourStepProps, current: number) => VueNode;
  onPrev?: () => void;
  onNext?: () => void;
  classes?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
}

export interface TourProps extends Pick<TriggerProps, 'onPopupAlign'> {
  classes?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  class?: string;
  style?: CSSProperties;
  steps?: TourStepInfo[];
  open?: boolean;
  keyboard?: boolean;
  defaultOpen?: boolean;
  defaultCurrent?: number;
  current?: number;
  onChange?: (current: number) => void;
  onClose?: (current: number) => void;
  onFinish?: () => void;
  closeIcon?: TourStepProps['closeIcon'];
  closable?: TourStepProps['closable'];
  mask?:
    | boolean
    | {
        style?: CSSProperties;
        // to fill mask color, e.g. rgba(80,0,0,0.5)
        color?: string;
      };
  arrow?: boolean | { pointAtCenter: boolean };
  rootClassName?: string;
  placement?: PlacementType;
  prefixCls?: string;
  renderPanel?: (props: DefaultPanelProps | TourStepProps, current: number) => VueNode;
  gap?: Gap;
  animated?: boolean | { placeholder: boolean };
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  zIndex?: number;
  getPopupContainer?: TriggerProps['getPopupContainer'] | false;
  builtinPlacements?:
    | TriggerProps['builtinPlacements']
    | ((config?: { arrowPointAtCenter?: boolean }) => TriggerProps['builtinPlacements']);
  disabledInteraction?: boolean;
}
