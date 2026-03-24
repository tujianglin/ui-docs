import KeyCode from '@vc-com/util/lib/KeyCode';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { computed, defineComponent, getCurrentInstance, ref, watch, type CSSProperties } from 'vue';
import type { KeyboardEventHandler, MouseEventHandler } from 'vue-jsx-vapor';
import type { Key } from '../../util/src/types';
import type { NoticeConfig } from './interface';

export interface NoticeProps extends Omit<NoticeConfig, 'onClose'> {
  prefixCls: string;
  class?: string;
  style?: CSSProperties;
  eventKey: Key;

  onClick?: MouseEventHandler<HTMLDivElement>;
  onNoticeClose?: (key: Key) => void;
  hovering?: boolean;
}

const Notify = defineComponent(
  ({
    prefixCls,
    style,
    class: className,
    duration = 4.5,
    showProgress,
    pauseOnHover = true,

    eventKey,
    content,
    closable,
    props: divProps,

    onClick,
    onNoticeClose,
    times,
    hovering: forcedHovering,
  }: NoticeProps & { times?: number }) => {
    const hovering = ref(false);
    const percent = ref(0);
    const spentTime = ref(0);
    const mergedHovering = computed(() => forcedHovering || hovering.value);
    const shouldPause = computed(() => pauseOnHover && mergedHovering.value);
    const mergedDuration = computed(() => (typeof duration === 'number' ? duration : 0));
    const mergedShowProgress = computed(() => mergedDuration.value > 0 && showProgress);

    // ======================== Close =========================
    const onInternalClose = () => {
      onNoticeClose(eventKey);
    };

    const onCloseKeyDown: KeyboardEventHandler<HTMLButtonElement> = (e) => {
      if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === KeyCode.ENTER) {
        onInternalClose();
      }
    };

    // ======================== Effect ========================
    watch(
      [mergedDuration, shouldPause, () => times],
      (_n, _o, onCleanup) => {
        if (!shouldPause.value && mergedDuration.value > 0) {
          const start = Date.now() - spentTime.value;
          const timeout = setTimeout(
            () => {
              onInternalClose();
            },
            mergedDuration.value * 1000 - spentTime.value,
          );

          onCleanup(() => {
            clearTimeout(timeout);
            if (pauseOnHover) {
              spentTime.value = Date.now() - start;
            }
          });
        }
      },
      { immediate: true, deep: true },
    );

    watch(
      [mergedDuration, spentTime, shouldPause, mergedShowProgress, () => times],
      (_n, _o, onCleanup) => {
        if (!shouldPause.value && mergedShowProgress.value) {
          const start = performance.now();
          let animationFrame: number;

          const calculate = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame((timestamp) => {
              const runtime = timestamp + spentTime.value - start;
              const progress = Math.min(runtime / (mergedDuration.value * 1000), 1);
              percent.value = progress * 100;
              if (progress < 1) {
                calculate();
              }
            });
          };

          calculate();

          onCleanup(() => {
            cancelAnimationFrame(animationFrame);
          });
        }
      },
      { immediate: true, deep: true },
    );

    // ======================== Closable ========================
    const closableObj = computed(() => {
      if (typeof closable === 'object' && closable !== null) {
        return closable;
      }
      return {};
    });

    const ariaProps = computed(() => pickAttrs(closableObj.value, true));

    // ======================== Progress ========================
    const validPercent = computed(
      () => 100 - (!percent.value || percent.value < 0 ? 0 : percent.value > 100 ? 100 : percent.value),
    );

    // ======================== Render ========================
    const noticePrefixCls = computed(() => `${prefixCls}-notice`);

    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };
    return () => (
      <div
        {...divProps}
        ref={changeRef}
        class={clsx(noticePrefixCls.value, className, { [`${noticePrefixCls.value}-closable`]: closable })}
        style={style}
        onMouseenter={(e) => {
          hovering.value = true;
          divProps?.onMouseenter?.(e);
        }}
        onMouseleave={(e) => {
          hovering.value = false;
          divProps?.onMouseleave?.(e);
        }}
        {...{ onClick }}
      >
        {/* Content */}
        <div class={`${noticePrefixCls.value}-content`}>{content}</div>

        {/* Close Icon */}
        <button
          v-if={closable}
          class={`${noticePrefixCls.value}-close`}
          onKeydown={onCloseKeyDown}
          aria-label="Close"
          {...ariaProps.value}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInternalClose();
          }}
        >
          {closableObj.value?.closeIcon ?? 'x'}
        </button>

        {/* Progress Bar */}
        <progress
          v-if={mergedShowProgress.value}
          class={`${noticePrefixCls.value}-progress`}
          max="100"
          value={validPercent.value}
        >
          {validPercent.value + '%'}
        </progress>
      </div>
    );
  },
);

export default Notify;
