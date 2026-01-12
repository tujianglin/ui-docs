import { defineComponent, onMounted, ref, version } from 'vue';
import Portal from '../src';
import './basic.less';

const Child = defineComponent({
  name: 'Child',
  setup() {
    const divRef = ref<HTMLPreElement>();

    onMounted(() => {
      const path: Element[] = [];

      for (let cur: HTMLElement | null = divRef.value ?? null; cur; cur = cur.parentElement) {
        path.push(cur);
      }

      console.log('Path:', path);
    });

    return () => (
      <pre ref={divRef} style={{ border: '1px solid red' }}>
        <p>Hello Child {version}</p>
      </pre>
    );
  },
});

export default defineComponent({
  name: 'InlineOrderDemo',
  setup() {
    const show1 = ref(false);
    const show2 = ref(false);

    return () => (
      <>
        <button
          onClick={() => {
            show1.value = !show1.value;
          }}
        >
          Trigger Inner Child
        </button>
        <button
          onClick={() => {
            show2.value = !show2.value;
          }}
        >
          Trigger Outer Child
        </button>

        <Portal open>
          <div style={{ border: '1px solid red' }}>
            <p>Hello Root {version}</p>

            {show1.value && (
              <Portal open>
                <Child />
              </Portal>
            )}
          </div>
        </Portal>

        {show2.value && (
          <Portal open>
            <Child />
          </Portal>
        )}
      </>
    );
  },
});
