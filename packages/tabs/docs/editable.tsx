import { computed, defineComponent, ref } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import Tabs from '../src';
import './assets/index.less';

export default defineComponent(() => {
  const countRef = useRef(8);
  const tabs = ref(
    new Array(countRef.value).fill(0).map((_, index) => {
      return {
        key: `${index}`,
        content: `tab content ${index + 1}`,
      };
    }),
  );

  const editable = computed(() => {
    return {
      onEdit: (editType: 'add' | 'remove', { key }: any) => {
        if (editType === 'remove') {
          tabs.value = tabs.value.filter((item) => item.key != key);
        } else if (editType === 'add') {
          tabs.value = [
            ...tabs.value,
            {
              key: `${++countRef.value}`,
              content: `tab content ${countRef.value}`,
            },
          ];
        }
      },
    };
  });

  return () => (
    <div style={{ maxWidth: '550px' }}>
      <Tabs
        editable={editable.value}
        defaultActiveKey="8"
        items={tabs.value.map(({ key, content }) => ({
          key,
          label: `tab ${key}`,
          children: content,
        }))}
      />
    </div>
  );
});
