import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { defineComponent } from 'vue';
import { resolveVNode } from '../../../util/src/vnode';
import type { TourStepProps } from '../interface';

export type DefaultPanelProps = Exclude<TourStepProps, 'closable'> & {
  closable: Exclude<TourStepProps['closable'], boolean>;
};

export default defineComponent(
  ({
    prefixCls,
    current,
    total,
    title,
    description,
    onClose,
    onPrev,
    onNext,
    onFinish,
    class: className,
    closable,
    classes: tourClassNames,
    styles,
  }: DefaultPanelProps) => {
    return () => {
      const ariaProps = pickAttrs(closable || {}, true);
      const closeIcon = closable?.closeIcon ?? <span class={`${prefixCls}-close-x`}>&times;</span>;
      const mergedClosable = !!closable;
      return (
        <div class={clsx(`${prefixCls}-panel`, className)}>
          <div class={clsx(`${prefixCls}-section`, tourClassNames?.section)} style={styles?.section}>
            <button
              v-if={mergedClosable}
              type="button"
              onClick={onClose}
              aria-label="Close"
              {...ariaProps}
              class={`${prefixCls}-close`}
            >
              {closeIcon}
            </button>
            <div class={clsx(`${prefixCls}-header`, tourClassNames?.header)} style={styles?.header}>
              <div class={clsx(`${prefixCls}-title`, tourClassNames?.title)} style={styles?.title} key={`title-${current}`}>
                {resolveVNode(title)}
              </div>
            </div>
            <div
              class={clsx(`${prefixCls}-description`, tourClassNames?.description)}
              style={styles?.description}
              key={`desc-${current}`}
            >
              {resolveVNode(description)}
            </div>
            <div class={clsx(`${prefixCls}-footer`, tourClassNames?.footer)} style={styles?.footer}>
              <div class={`${prefixCls}-sliders`}>
                {total > 1
                  ? [...Array.from({ length: total }).keys()].map((item, index) => {
                      return <span key={item} class={index === current ? 'active' : ''} />;
                    })
                  : null}
              </div>
              <div class={clsx(`${prefixCls}-actions`, tourClassNames?.actions)} style={styles?.actions}>
                <button v-if={current !== 0} class={`${prefixCls}-prev-btn`} onClick={onPrev}>
                  Prev
                </button>
                <button v-if={current === total - 1} class={`${prefixCls}-finish-btn`} onClick={onFinish}>
                  Finish
                </button>
                <button v-else class={`${prefixCls}-next-btn`} onClick={onNext}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
  { inheritAttrs: false },
);
