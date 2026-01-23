import Portal from '@vc-com/portal';
import { defineComponent, ref } from 'vue';
import Trigger from '../src';
import './assets/index.less';

const PortalDemo = defineComponent(() => {
  return () => (
    <Portal open getContainer={() => document.body}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: 'red',
          zIndex: 999,
        }}
      >
        PortalNode
      </div>
    </Portal>
  );
});

export default defineComponent(() => {
  const open = ref(false);
  const open1 = ref(false);
  const open2 = ref(false);
  const open3 = ref(false);

  return () => (
    <div>
      <style innerHTML="body { overflow-x: hidden; }" />

      <Trigger
        arrow
        popupVisible={open.value}
        onOpenChange={(next) => {
          console.log('Visible Change:', next);
          open.value = next;
        }}
        popupMotion={{
          motionName: 'rc-trigger-popup-zoom',
        }}
        popup={() => (
          <div
            style={{
              background: 'yellow',
              border: '1px solid blue',
              width: '200px',
              height: '60px',
              opacity: 0.9,
            }}
          >
            <button
              onClick={() => {
                open.value = false;
              }}
            >
              Close
            </button>

            <PortalDemo />
          </div>
        )}
        // popupVisible
        popupStyle={{ boxShadow: '0 0 5px red' }}
        popupAlign={{
          points: ['tc', 'bc'],
          overflow: {
            shiftX: 50,
            adjustY: true,
          },
          htmlRegion: 'scroll',
        }}
      >
        <button
          disabled
          style={{
            // background: 'green',
            // color: '#FFF',
            paddingBlock: '30px',
            paddingInline: '70px',
            opacity: 0.9,
            transform: 'scale(0.6)',
            display: 'inline-block',
          }}
        >
          Button Target
        </button>
      </Trigger>

      <Trigger
        arrow
        action={['click']}
        popupVisible={open1.value}
        onOpenChange={(next) => {
          console.log('Visible Change:', next);
          open1.value = next;
        }}
        popupMotion={{
          motionName: 'rc-trigger-popup-zoom',
        }}
        popup={() => (
          <div
            style={{
              background: 'yellow',
              border: '1px solid blue',
              width: '200px',
              height: '60px',
              opacity: 0.9,
            }}
          >
            <button
              onClick={() => {
                open1.value = false;
              }}
            >
              Close
            </button>
          </div>
        )}
        // popupVisible
        popupStyle={{ boxShadow: '0 0 5px red' }}
        popupAlign={{
          points: ['tc', 'bc'],
          overflow: {
            shiftX: 50,
            adjustY: true,
          },
          htmlRegion: 'scroll',
        }}
      >
        <span
          style={{
            background: 'green',
            color: '#FFF',
            paddingBlock: '30px',
            paddingInline: '70px',
            opacity: 0.9,
            transform: 'scale(0.6)',
            display: 'inline-block',
          }}
        >
          Target Click
        </span>
      </Trigger>

      <Trigger
        arrow
        action={['contextmenu']}
        popupVisible={open2.value}
        onOpenChange={(next) => {
          console.log('Visible Change:', next);
          open2.value = next;
        }}
        popupMotion={{
          motionName: 'rc-trigger-popup-zoom',
        }}
        popup={() => (
          <div
            style={{
              background: 'yellow',
              border: '1px solid blue',
              width: '200px',
              height: '60px',
              opacity: 0.9,
            }}
          >
            Target ContextMenu1
          </div>
        )}
        popupStyle={{ boxShadow: '0 0 5px red' }}
        popupAlign={{
          points: ['tc', 'bc'],
          overflow: {
            shiftX: 50,
            adjustY: true,
          },
          htmlRegion: 'scroll',
        }}
      >
        <span
          style={{
            background: 'blue',
            color: '#FFF',
            paddingBlock: '30px',
            paddingInline: '70px',
            opacity: 0.9,
            transform: 'scale(0.6)',
            display: 'inline-block',
          }}
        >
          Target ContextMenu1
        </span>
      </Trigger>

      <Trigger
        arrow
        action={['contextmenu']}
        popupVisible={open3.value}
        onOpenChange={(next) => {
          console.log('Visible Change:', next);
          open3.value = next;
        }}
        popupMotion={{
          motionName: 'rc-trigger-popup-zoom',
        }}
        popup={() => (
          <div
            style={{
              background: 'yellow',
              border: '1px solid blue',
              width: '200px',
              height: '60px',
              opacity: 0.9,
            }}
          >
            Target ContextMenu2
          </div>
        )}
        popupStyle={{ boxShadow: '0 0 5px red' }}
        popupAlign={{
          points: ['tc', 'bc'],
          overflow: {
            shiftX: 50,
            adjustY: true,
          },
          htmlRegion: 'scroll',
        }}
      >
        <span
          style={{
            background: 'blue',
            color: '#FFF',
            paddingBlock: '30px',
            paddingInline: '70px',
            opacity: 0.9,
            transform: 'scale(0.6)',
            display: 'inline-block',
          }}
        >
          Target ContextMenu2
        </span>
      </Trigger>
    </div>
  );
});
