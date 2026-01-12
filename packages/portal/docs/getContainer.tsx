import { defineComponent, onMounted, ref } from 'vue';
import Portal from '../src';

const Content = defineComponent({
  name: 'Content',
  setup() {
    onMounted(() => {
      console.log('Content Mount!');
    });

    return () => <>Bamboo</>;
  },
});

export default defineComponent({
  name: 'GetContainerDemo',
  setup() {
    const divRef = ref<HTMLDivElement>();

    return () => (
      <div ref={divRef} class="holder" style={{ minHeight: '10px', border: '1px solid blue' }}>
        <Portal
          open
          getContainer={() => {
            return divRef.value;
          }}
        >
          <Content />
        </Portal>
      </div>
    );
  },
});
