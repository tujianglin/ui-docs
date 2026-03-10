import CSSMotion from '@vc-com/motion';
import Render from '@vc-com/render';
import KeyCode from '@vc-com/util/lib/KeyCode';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useFullProps, useRef, type HTMLAttributes } from 'vue-jsx-vapor';
import type { CollapsePanelProps } from './interface';
import PanelContent from './PanelContent';

const CollapsePanel = defineComponent(
  ({
    showArrow = true,
    headerClass,
    isActive,
    onItemClick,
    forceRender,
    class: className,
    classNames: customizeClassNames = {},
    styles = {},
    prefixCls,
    collapsible,
    accordion,
    panelKey,
    extra,
    header,
    expandIcon,
    openMotion,
    destroyOnHidden,
    children,
    ...resetProps
  }: CollapsePanelProps) => {
    const props = useFullProps();
    const disabled = computed(() => collapsible === 'disabled');

    const ifExtraExist = computed(() => extra !== null && extra !== undefined && typeof extra !== 'boolean');

    const collapsibleProps = computed(() => ({
      onClick: () => {
        onItemClick?.(panelKey);
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.keyCode === KeyCode.ENTER || e.which === KeyCode.ENTER) {
          onItemClick?.(panelKey);
        }
      },
      role: accordion ? 'tab' : 'button',
      ['aria-expanded']: isActive,
      ['aria-disabled']: disabled.value,
      tabIndex: disabled.value ? -1 : 0,
    }));

    // ======================== Icon ========================
    const iconNodeInner = computed(() => (typeof expandIcon === 'function' ? expandIcon(props) : <i class="arrow" />));
    const IconNode = () =>
      iconNodeInner.value && (
        <div
          class={clsx(`${prefixCls}-expand-icon`, customizeClassNames?.icon)}
          style={styles?.icon}
          {...(['header', 'icon'].includes(collapsible) ? collapsibleProps.value : {})}
        >
          {iconNodeInner.value}
        </div>
      );

    const collapsePanelClassNames = computed(() =>
      clsx(
        `${prefixCls}-item`,
        {
          [`${prefixCls}-item-active`]: isActive,
          [`${prefixCls}-item-disabled`]: disabled.value,
        },
        className,
      ),
    );

    const headerClassName = computed(() =>
      clsx(
        headerClass,
        `${prefixCls}-header`,
        {
          [`${prefixCls}-collapsible-${collapsible}`]: !!collapsible,
        },
        customizeClassNames?.header,
      ),
    );

    // ======================== HeaderProps ========================
    const headerProps = computed<HTMLAttributes<HTMLDivElement>>(() => ({
      class: headerClassName.value,
      style: styles?.header,
      ...(['header', 'icon'].includes(collapsible) ? {} : collapsibleProps.value),
    }));

    const domRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });
    // ======================== Render ========================
    return () => (
      <div {...resetProps} ref={domRef} class={collapsePanelClassNames.value}>
        <div {...headerProps.value}>
          <IconNode v-if={showArrow}></IconNode>
          <span
            class={clsx(`${prefixCls}-title`, customizeClassNames?.title)}
            style={styles?.title}
            {...(collapsible === 'header' ? collapsibleProps.value : {})}
          >
            <Render content={header}></Render>
          </span>
          {ifExtraExist.value && (
            <div class={`${prefixCls}-extra`}>
              <Render content={extra}></Render>
            </div>
          )}
        </div>
        <CSSMotion
          visible={isActive}
          leavedClassName={`${prefixCls}-panel-hidden`}
          {...openMotion}
          forceRender={forceRender}
          removeOnLeave={destroyOnHidden}
        >
          {({ class: motionClassName, style: motionStyle, ref: motionRef }) => {
            return (
              <PanelContent
                ref={motionRef}
                prefixCls={prefixCls}
                class={motionClassName}
                classNames={customizeClassNames}
                style={motionStyle}
                styles={styles}
                isActive={isActive}
                forceRender={forceRender}
                role={accordion ? 'tabpanel' : undefined}
                children={children}
              ></PanelContent>
            );
          }}
        </CSSMotion>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default CollapsePanel;
