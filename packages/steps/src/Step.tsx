import KeyCode from '@vc-com/util/lib/KeyCode';
import type { RenderNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import type { KeyboardEventHandler, MouseEventHandler } from 'vue-jsx-vapor';
import { useStepsContextInject } from './Context';
import Rail from './Rail';
import StepIcon, { useStepIconSemanticContextProvider } from './StepIcon';
import type { Status, StepItem, StepsProps } from './Steps';
import { useUnstableContextInject } from './UnstableContext';

function hasContent<T>(value: T) {
  return value !== undefined && value !== null;
}

export interface StepProps {
  // style
  prefixCls?: string;
  classNames: StepsProps['classNames'];
  styles: StepsProps['styles'];

  // data
  data: StepItem;
  nextStatus?: Status;
  active?: boolean;
  index: number;
  last: boolean;

  // render
  iconRender?: StepsProps['iconRender'];
  icon?: RenderNode;
  itemRender?: StepsProps['itemRender'];
  itemWrapperRender?: StepsProps['itemWrapperRender'];

  // Event
  onClick: (index: number) => void;
}

const Step = defineComponent(
  ({
    // style
    prefixCls,
    classNames,
    styles,

    // data
    data,
    last,
    nextStatus,
    active,
    index,

    // render
    itemRender,
    iconRender,
    itemWrapperRender,

    // events
    onClick,
  }: StepProps) => {
    const itemCls = computed(() => `${prefixCls}-item`);

    // ======================== Contexts ========================
    const { railFollowPrevStatus } = $(useUnstableContextInject());
    const { ItemComponent } = $(useStepsContextInject());

    // ========================== Data ==========================
    const {
      onClick: onItemClick,
      // @ts-ignore
      title,
      subTitle,
      content,
      disabled,
      icon,
      status,

      class: className,
      // @ts-ignore
      style,
      classNames: itemClassNames = {},
      styles: itemStyles = {},
    } = $(reactiveComputed(() => data || {}));

    const renderInfo = computed(() => ({
      item: data,
      index,
      active,
    }));

    // ========================= Click ==========================
    const clickable = computed(() => !!(onClick || onItemClick) && !disabled);

    useStepIconSemanticContextProvider(
      reactiveComputed(() => ({
        class: itemClassNames.icon,
        style: itemStyles.icon,
      })),
    );
    return () => {
      const accessibilityProps: {
        role?: string;
        tabindex?: number;
        onClick?: MouseEventHandler<HTMLLIElement>;
        onKeydown?: KeyboardEventHandler<HTMLLIElement>;
      } = {};

      if (clickable) {
        accessibilityProps.role = 'button';
        accessibilityProps.tabindex = 0;
        accessibilityProps.onClick = (e) => {
          onItemClick?.(e);
          onClick?.(index);
        };

        accessibilityProps.onKeydown = (e) => {
          const { which } = e;
          if (which === KeyCode.ENTER || which === KeyCode.SPACE) {
            onClick?.(index);
          }
        };
      }

      // ========================= Render =========================
      const mergedStatus = status || 'wait';

      // @ts-ignore
      const hasTitle = hasContent(title);
      const hasSubTitle = hasContent(subTitle);

      const classString = clsx(
        itemCls.value,
        `${itemCls.value}-${mergedStatus}`,
        {
          [`${itemCls.value}-custom`]: icon,
          [`${itemCls.value}-active`]: active,
          [`${itemCls.value}-disabled`]: disabled === true,
          [`${itemCls.value}-empty-header`]: !hasTitle && !hasSubTitle,
        },
        className,
        classNames.item,
        itemClassNames.root,
      );

      let iconNode = <StepIcon />;
      if (iconRender) {
        iconNode = iconRender(iconNode, {
          ...renderInfo.value,
          components: {
            Icon: StepIcon as any,
          },
        }) as any;
      }

      const wrapperNode = (
        <div
          class={clsx(`${itemCls.value}-wrapper`, classNames.itemWrapper, itemClassNames.wrapper)}
          style={{ ...styles.itemWrapper, ...itemStyles.wrapper }}
        >
          {/* Icon */}
          {iconNode}
          <div
            class={clsx(`${itemCls.value}-section`, classNames.itemSection, itemClassNames.section)}
            style={{ ...styles.itemSection, ...itemStyles.section }}
          >
            <div
              class={clsx(`${itemCls.value}-header`, classNames.itemHeader, itemClassNames.header)}
              style={{ ...styles.itemHeader, ...itemStyles.header }}
            >
              <div
                v-if={hasTitle}
                class={clsx(`${itemCls.value}-title`, classNames.itemTitle, itemClassNames.title)}
                style={{ ...styles.itemTitle, ...itemStyles.title }}
              >
                {title}
              </div>
              <div
                v-if={hasSubTitle}
                title={typeof subTitle === 'string' ? subTitle : undefined}
                class={clsx(`${itemCls.value}-subtitle`, classNames.itemSubtitle, itemClassNames.subtitle)}
                style={{ ...styles.itemSubtitle, ...itemStyles.subtitle }}
              >
                {subTitle}
              </div>

              <Rail
                v-if={!last}
                prefixCls={itemCls.value}
                class={clsx(classNames.itemRail, itemClassNames.rail)}
                style={{ ...styles.itemRail, ...itemStyles.rail }}
                status={railFollowPrevStatus ? status : nextStatus}
              />
            </div>
            <div
              v-if={hasContent(content)}
              class={clsx(`${itemCls.value}-content`, classNames.itemContent, itemClassNames.content)}
              style={{ ...styles.itemContent, ...itemStyles.content }}
            >
              {content}
            </div>
          </div>
        </div>
      );

      let stepNode = (
        <ItemComponent
          {...accessibilityProps}
          class={classString}
          style={{
            ...styles.item,
            ...itemStyles.root,
            // @ts-ignore
            ...style,
          }}
        >
          {itemWrapperRender ? itemWrapperRender(wrapperNode) : wrapperNode}
        </ItemComponent>
      );

      if (itemRender) {
        stepNode = itemRender(stepNode, renderInfo.value) || (null as any);
      }

      return stepNode;
    };
  },
);

export default Step;
