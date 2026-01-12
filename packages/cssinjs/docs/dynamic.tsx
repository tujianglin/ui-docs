import { defineComponent, ref } from 'vue';
import Button from './components/Button';
import Spin from './components/Spin';
import { DesignTokenProvider } from './components/theme';

/**
 * 动态样式示例
 * 1:1 还原 React 版本 dynamic.tsx
 */

const randomColor = () =>
  `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;

export default defineComponent({
  name: 'DynamicDemo',
  setup() {
    const show = ref(true);
    const primaryColor = ref(randomColor());

    const handleRandomColor = () => {
      primaryColor.value = randomColor();
    };

    return () => (
      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px' }}>
        <h3>随机样式，新的 Token 生成删除原本的全部 style</h3>

        <label>
          <input type="checkbox" checked={show.value} onChange={(e) => (show.value = (e.target as HTMLInputElement).checked)} />
          Show Components
        </label>

        <DesignTokenProvider value={{ token: { primaryColor: primaryColor.value } }}>
          {show.value && (
            <div style={{ display: 'flex', columnGap: '8px' }}>
              <Button type="primary" {...{ onClick: handleRandomColor }}>
                Random Primary Color
              </Button>
              <Spin />
            </div>
          )}
        </DesignTokenProvider>
      </div>
    );
  },
});
