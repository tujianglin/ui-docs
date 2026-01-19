import CSSMotion from '@vc-com/motion';
import { defineComponent, ref } from 'vue';
import './transition-inside-debug.less';

export default defineComponent(() => {
  const visible = ref(true);

  return () => (
    <div style="height: 300px;">
      <button onClick={() => (visible.value = true)} type="button">
        visible = true
      </button>
      <button onClick={() => (visible.value = false)} type="button">
        visible = false
      </button>
      <CSSMotion
        visible={visible.value}
        motionName="debug-transition"
        onEnterStart={() => ({
          maxHeight: '0px',
        })}
        onEnterActive={() => ({
          maxHeight: '200px',
        })}
        onLeaveStart={() => ({
          maxHeight: '200px',
        })}
        onLeaveActive={() => ({
          maxHeight: '0px',
        })}
      >
        {({ class: className, style, ref }) => (
          <div
            class={className}
            style={{
              width: '200px',
              height: '200px',
              background: 'green',
              ...style,
            }}
            ref={ref}
          >
            <div class="inner-block">Hover when closing</div>
          </div>
        )}
      </CSSMotion>
    </div>
  );
});
