import { computed, defineComponent, ref } from 'vue';
import type { TabsProps } from '../src';
import Tabs from '../src';
import './assets/index.less';

const items: TabsProps['items'] = [];
for (let i = 0; i < 50; i += 1) {
  items.push({
    key: String(i),
    label: `Tab ${i}`,
    children: `Content of ${i}`,
  });
}
export default defineComponent(() => {
  const key = ref('0');

  // bug Demo
  const extra = computed(() => {
    if (key.value === '0') {
      return <div>额外内容</div>;
    }
    return null;
  });

  return () => (
    <div style={{ maxWidth: 550 }}>
      <Tabs
        activeKey={key.value}
        onChange={(curKey) => (key.value = curKey)}
        tabBarExtraContent={extra.value}
        defaultActiveKey="8"
        items={items}
      />
    </div>
  );
});
