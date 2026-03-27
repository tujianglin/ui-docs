/* eslint react/no-did-mount-set-state: 0, react/prop-types: 0 */
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { HtmlHTMLAttributes } from 'vue-jsx-vapor';
import { useStepsContextProvider } from './Context';
import Step from './Step';
import type StepIcon from './StepIcon';

export type Status = 'error' | 'process' | 'finish' | 'wait';

const EmptyObject = {};

export type SemanticName =
  | 'root'
  | 'item'
  | 'itemWrapper'
  | 'itemHeader'
  | 'itemTitle'
  | 'itemSubtitle'
  | 'itemSection'
  | 'itemContent'
  | 'itemIcon'
  | 'itemRail';

export type ItemSemanticName = 'root' | 'wrapper' | 'header' | 'title' | 'subtitle' | 'section' | 'content' | 'icon' | 'rail';

export type ComponentType = any;

export type StepItem = {
  content?: RenderNode;
  disabled?: boolean;
  icon?: RenderNode;
  status?: Status;
  subTitle?: RenderNode;
  title?: RenderNode;
  classNames?: Partial<Record<ItemSemanticName, string>>;
  styles?: Partial<Record<ItemSemanticName, CSSProperties>>;
} & Pick<HtmlHTMLAttributes<HTMLLIElement>, 'onClick' | 'class' | 'style'>;

export type StepIconRender = (info: {
  index: number;
  status: Status;
  title: RenderNode;
  content: RenderNode;
  node: RenderNode;
}) => VueNode;

export type RenderInfo = {
  index: number;
  active: boolean;
  item: StepItem;
};

export interface StepsProps {
  // style
  prefixCls?: string;
  style?: CSSProperties;
  className?: string;
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  rootClassName?: string;

  // layout
  orientation?: 'horizontal' | 'vertical';
  titlePlacement?: 'horizontal' | 'vertical';

  // a11y
  /** Internal usage of antd. Do not deps on this. */
  components?: {
    root?: ComponentType;
    item?: ComponentType;
  };

  // data
  status?: Status;
  current?: number;
  initial?: number;
  items?: StepItem[];
  onChange?: (current: number) => void;

  // render
  iconRender?: (
    originNode: VueNode,
    info: RenderInfo & {
      components: {
        Icon: typeof StepIcon;
      };
    },
  ) => VueNode;
  itemRender?: (originNode: VueNode, info: RenderInfo) => VueNode;
  itemWrapperRender?: (originNode: VueNode) => VueNode;
}

const Steps = defineComponent(
  ({
    // style
    prefixCls = 'rc-steps',
    style,
    className,
    classNames = EmptyObject as NonNullable<StepsProps['classNames']>,
    styles = EmptyObject as NonNullable<StepsProps['styles']>,
    rootClassName,

    // layout
    orientation,
    titlePlacement,
    components,

    // data
    status = 'process',
    current = 0,
    initial = 0,
    onChange,
    items,

    // render
    iconRender,
    itemRender,
    itemWrapperRender,

    ...restProps
  }: StepsProps) => {
    // ============================= layout =============================
    const isVertical = computed(() => orientation === 'vertical');
    const mergedOrientation = computed(() => (isVertical.value ? 'vertical' : 'horizontal'));
    const mergeTitlePlacement = computed(() => (!isVertical.value && titlePlacement === 'vertical' ? 'vertical' : 'horizontal'));

    // ============================= styles =============================
    const classString = computed(() =>
      clsx(
        prefixCls,
        `${prefixCls}-${mergedOrientation.value}`,
        `${prefixCls}-title-${mergeTitlePlacement.value}`,
        rootClassName,
        className,
        classNames.root,
      ),
    );

    // ============================== Data ==============================
    const mergedItems = computed(() => (items || []).filter(Boolean));
    const statuses = computed(() =>
      mergedItems.value.map(({ status: itemStatus }, index) => {
        const stepNumber = initial + index;

        if (!itemStatus) {
          if (stepNumber === current) {
            return status;
          } else if (stepNumber < current) {
            return 'finish';
          }
          return 'wait';
        }

        return itemStatus;
      }),
    );

    // ============================= events =============================
    const onStepClick = (next: number) => {
      if (onChange && current !== next) {
        onChange(next);
      }
    };

    // ============================= render =============================
    const renderStep = (item: StepItem, index: number) => {
      const stepIndex = initial + index;

      const itemStatus = statuses.value[index];
      const nextStatus = statuses.value[index + 1];

      const data = {
        ...item,
        status: itemStatus,
      };

      return (
        <Step
          key={stepIndex}
          // Style
          prefixCls={prefixCls}
          classNames={classNames}
          styles={styles}
          // Data
          data={data}
          nextStatus={nextStatus}
          active={stepIndex === current}
          index={stepIndex}
          last={mergedItems.value.length - 1 === index}
          // Render
          iconRender={iconRender}
          itemRender={itemRender}
          itemWrapperRender={itemWrapperRender}
          onClick={onChange && onStepClick}
        />
      );
    };
    // =========================== components ===========================
    const RootComponent = computed(() => components?.root ?? 'div');
    const ItemComponent = computed(() => components?.item ?? 'div');

    // ============================ contexts ============================
    const stepIconContext = reactiveComputed(() => ({
      prefixCls,
      classNames,
      styles,
      ItemComponent: ItemComponent.value,
    }));

    useStepsContextProvider(stepIconContext);

    return () => {
      return (
        <RootComponent.value
          class={classString.value}
          style={{
            ...style,
            ...styles?.root,
          }}
          {...restProps}
        >
          {mergedItems.value.map(renderStep)}
        </RootComponent.value>
      );
    };
  },
  { inheritAttrs: false },
);

export default Steps;
