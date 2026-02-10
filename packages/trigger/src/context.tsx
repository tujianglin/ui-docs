import type { CSSMotionProps } from '@vc-com/motion';
import type { PortalProps } from '@vc-com/portal';
import { defineComponent, inject, provide, type CSSProperties, type InjectionKey } from 'vue';
import type { TriggerProps } from './index';
import type { AlignType, ArrowTypeOuter, BuildInPlacements } from './interface';

// ===================== Nest =====================
export interface TriggerContextProps {
  registerSubPopup: (id: string, node: HTMLElement) => void;
}

const TriggerContext: InjectionKey<TriggerContextProps | null> = Symbol('TriggerContext');

export const useTriggerContextInject = () => inject(TriggerContext, null);

export const TriggerContextProvider = defineComponent(({ value }: { value?: TriggerContextProps }) => {
  provide(TriggerContext, value);
  return () => <slot></slot>;
});

// ==================== Unique ====================
export interface UniqueShowOptions {
  id: string;
  popup: TriggerProps['popup'];
  target: HTMLElement;
  delay: number;
  prefixCls?: string;
  popupClassName?: string;
  uniqueContainerClassName?: string;
  uniqueContainerStyle?: CSSProperties;
  popupStyle?: CSSProperties;
  popupPlacement?: string;
  builtinPlacements?: BuildInPlacements;
  popupAlign?: AlignType;
  zIndex?: number;
  mask?: boolean;
  maskClosable?: boolean;
  popupMotion?: CSSMotionProps;
  maskMotion?: CSSMotionProps;
  arrow?: ArrowTypeOuter;
  getPopupContainer?: TriggerProps['getPopupContainer'];
  getPopupClassNameFromAlign?: (align: AlignType) => string;
  onEsc?: PortalProps['onEsc'];
}

export interface UniqueContextProps {
  show: (options: UniqueShowOptions, isOpen: () => boolean) => void;
  hide: (delay: number) => void;
}

const UniqueContext: InjectionKey<UniqueContextProps | null> = Symbol('UniqueContext');

export const useUniqueContextInject = () => inject(UniqueContext, null);

export const UniqueContextProvider = defineComponent(({ value }: { value?: UniqueContextProps }) => {
  provide(UniqueContext, value);
  return () => <slot></slot>;
});
