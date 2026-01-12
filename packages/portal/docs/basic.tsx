import { defineComponent, onUnmounted, ref, version } from 'vue';
import Portal from '../src';
import './basic.less';

export default defineComponent({
  name: 'BasicDemo',
  setup() {
    const show = ref(true);
    const customizeContainer = ref(false);
    const lock = ref(true);
    const divRef = ref<HTMLDivElement>();

    onUnmounted(() => {
      console.log('Demo unmount!!');
    });

    const getContainer = () => (customizeContainer.value ? () => divRef.value : undefined);
    const contentCls = () => (customizeContainer.value ? '' : 'abs');

    return () => (
      <>
        <input type="text" />
        <div style={{ height: '100px' }}>
          <div style={{ border: '2px solid red' }}>
            Vue Version: {version}
            <button onClick={() => (show.value = !show.value)}>show: {show.value.toString()}</button>
            <button onClick={() => (customizeContainer.value = !customizeContainer.value)}>
              customize container: {customizeContainer.value.toString()}
            </button>
            <button onClick={() => (lock.value = !lock.value)}>lock scroll: {lock.value.toString()}</button>
            <div id="customize" ref={divRef} style={{ border: '1px solid green', minHeight: '10px' }} />
          </div>

          <Portal
            open={show.value}
            getContainer={getContainer()}
            autoLock={lock.value}
            onEsc={({ top, event }) => {
              console.log('root onEsc', { top, event });
            }}
          >
            <p class={[contentCls(), 'root']}>Hello Root</p>
            <Portal
              open={show.value}
              getContainer={getContainer()}
              autoLock={lock.value}
              onEsc={({ top, event }) => {
                console.log('parent onEsc', { top, event });
              }}
            >
              <p class={[contentCls(), 'parent']}>Hello Parent</p>
              <Portal
                open={show.value}
                getContainer={getContainer()}
                autoLock={lock.value}
                onEsc={({ top, event }) => {
                  console.log('children onEsc', { top, event });
                }}
              >
                <p class={[contentCls(), 'children']}>Hello Children</p>
              </Portal>
            </Portal>
          </Portal>
        </div>
      </>
    );
  },
});
