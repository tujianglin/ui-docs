/* eslint-disable react/no-unknown-property */
import raf from '@vc-com/util/lib/raf';
import { clsx } from 'clsx';
import { computed, defineComponent, onUnmounted, ref, type CSSProperties } from 'vue';

/**
 * When click and hold on a button - the speed of auto changing the value.
 */
const STEP_INTERVAL = 200;

/**
 * When click and hold on a button - the delay before auto changing the value.
 */
const STEP_DELAY = 600;

export interface StepHandlerProps {
  prefixCls: string;
  action: 'up' | 'down';
  disabled?: boolean;
  class?: string;
  style?: CSSProperties;
  onStep: (up: boolean, emitter: 'handler' | 'keyboard' | 'wheel') => void;
}

const StepHandler = defineComponent(
  ({ prefixCls, action, disabled, class: className, style, onStep }: StepHandlerProps) => {
    // ======================== MISC ========================
    const isUpAction = computed(() => action === 'up');

    // ======================== Step ========================
    const stepTimeoutRef = ref<any>();
    const frameIds = ref<number[]>([]);

    const onStopStep = () => {
      clearTimeout(stepTimeoutRef.value);
    };

    // We will interval update step when hold mouse down
    const onStepMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      onStopStep();

      onStep(isUpAction.value, 'handler');

      // Loop step for interval
      function loopStep() {
        onStep(isUpAction.value, 'handler');

        stepTimeoutRef.value = setTimeout(loopStep, STEP_INTERVAL);
      }

      // First time press will wait some time to trigger loop step update
      stepTimeoutRef.value = setTimeout(loopStep, STEP_DELAY);
    };

    onUnmounted(() => {
      onStopStep();
      frameIds.value.forEach((id) => {
        raf.cancel(id);
      });
    });

    // ======================= Render =======================
    const actionClassName = computed(() => `${prefixCls}-action`);

    const mergedClassName = computed(() =>
      clsx(
        actionClassName.value,
        `${actionClassName.value}-${action}`,
        {
          [`${actionClassName.value}-${action}-disabled`]: disabled,
        },
        className,
      ),
    );

    // fix: https://github.com/ant-design/ant-design/issues/43088
    // In Safari, When we fire onmousedown and onmouseup events in quick succession,
    // there may be a problem that the onmouseup events are executed first,
    // resulting in a disordered program execution.
    // So, we need to use requestAnimationFrame to ensure that the onmouseup event is executed after the onmousedown event.
    const safeOnStopStep = () => frameIds.value.push(raf(onStopStep));

    return () => (
      <span
        unselectable="on"
        role="button"
        onMouseup={safeOnStopStep}
        onMouseleave={safeOnStopStep}
        onMousedown={(e) => {
          onStepMouseDown(e);
        }}
        aria-label={isUpAction.value ? 'Increase Value' : 'Decrease Value'}
        aria-disabled={disabled}
        class={mergedClassName.value}
        style={style}
      >
        <slot>
          <span unselectable="on" class={`${prefixCls}-action-${action}-inner`} />
        </slot>
      </span>
    );
  },
  { inheritAttrs: false },
);

export default StepHandler;
