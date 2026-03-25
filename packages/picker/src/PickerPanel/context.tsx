import { reactiveComputed, type ReactiveComputedReturn } from '@vueuse/core';
import {
  computed,
  defineComponent,
  inject,
  provide,
  reactive,
  type ComputedRef,
  type InjectionKey,
  type Reactive,
  type Ref,
} from 'vue';
import type { FilledPanelClassNames, FilledPanelStyles } from '../hooks/useSemantic';
import type { DateType, PanelMode, SharedPanelProps } from '../interface';

export interface SharedPanelContextProps {
  classNames: FilledPanelClassNames;
  styles: FilledPanelStyles;
}

const SharedPanelContext: InjectionKey<Reactive<SharedPanelContextProps>> = Symbol('SharedPanelContext');

export const useSharedPanelContextInject = () => {
  return inject(SharedPanelContext, reactive({} as SharedPanelContextProps));
};

export const useSharedPanelContextProvider = (props: Reactive<SharedPanelContextProps>) => {
  provide(SharedPanelContext, props);
};

export interface PanelContextProps extends Pick<
  SharedPanelProps,
  | 'prefixCls'
  | 'cellRender'
  | 'generateConfig'
  | 'locale'
  | 'onSelect'
  | 'hoverValue'
  | 'hoverRangeValue'
  | 'onHover'
  | 'values'
  | 'pickerValue'

  // Limitation
  | 'disabledDate'
  | 'minDate'
  | 'maxDate'

  // Icon
  | 'prevIcon'
  | 'nextIcon'
  | 'superPrevIcon'
  | 'superNextIcon'
> {
  /** Tell current panel type */
  panelType: PanelMode;

  // Shared
  now: DateType;

  classNames: FilledPanelClassNames;
  styles: FilledPanelStyles;
}

/** Used for each single Panel. e.g. DatePanel */
const PanelContext: InjectionKey<Reactive<PanelContextProps>> = Symbol('PanelContext');

export const usePanelContextInject = () => {
  return inject(PanelContext, reactive({} as PanelContextProps));
};

export const usePanelContextProvider = (props: Reactive<PanelContextProps>) => {
  provide(PanelContext, props);
};

/**
 * Get shared props for the SharedPanelProps interface.
 */
export function useInfo(
  props: ReactiveComputedReturn<SharedPanelProps>,
  panelType: Ref<PanelMode>,
): [sharedProps: ReactiveComputedReturn<PanelContextProps>, now: ComputedRef<DateType>] {
  // TODO: this is not good to get from each props.
  // Should move to `SharedPanelContext` instead.
  const {
    prefixCls,
    generateConfig,
    locale,
    disabledDate,
    minDate,
    maxDate,
    cellRender,
    hoverValue,
    hoverRangeValue,
    onHover,
    values,
    pickerValue,
    onSelect,

    // Icons
    // @ts-ignore
    prevIcon,
    nextIcon,
    superPrevIcon,
    superNextIcon,
  } = $(props);

  // ======================= Context ========================
  const { classNames, styles } = $(useSharedPanelContextInject());

  // ========================= MISC =========================
  const now = computed(() => generateConfig.getNow());

  // ========================= Info =========================
  const info = reactiveComputed(() => ({
    now: now.value,
    values,
    pickerValue,
    prefixCls,
    classNames,
    styles,
    disabledDate,
    minDate,
    maxDate,
    cellRender,
    hoverValue,
    hoverRangeValue,
    onHover,
    locale,
    generateConfig,
    onSelect,
    panelType: panelType.value,

    // Icons
    prevIcon,
    nextIcon,
    superPrevIcon,
    superNextIcon,
  }));

  return [info, now];
}

// ============================== Internal ==============================
export interface PickerHackContextProps {
  hidePrev?: boolean;
  hideNext?: boolean;
  hideHeader?: boolean;
  onCellDblClick?: () => void;
}

/**
 * Internal usage for RangePicker to not to show the operation arrow
 */
const PickerHackContext: InjectionKey<Reactive<PickerHackContextProps>> = Symbol('PickerHackContext');

export const usePickerHackContextInject = () => {
  return inject(PickerHackContext, reactive({} as PickerHackContextProps));
};

export const PickerHackContextProvider = defineComponent(({ value }: { value: PickerHackContextProps }) => {
  provide(
    PickerHackContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
