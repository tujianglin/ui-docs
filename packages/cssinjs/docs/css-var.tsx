import { defineComponent, ref } from 'vue';
import './basic.less';
import Button from './components/Button';
import { DesignTokenProvider } from './components/theme';

const Demo = defineComponent({
  name: 'Demo',
  setup() {
    return () => (
      <>
        <Button>Default</Button>
        <Button type="primary">Primary</Button>
        <Button type="ghost">Ghost</Button>
        <Button class="btn-override">Override By ClassName</Button>
      </>
    );
  },
});

export default defineComponent({
  name: 'CssVarDemo',
  setup() {
    const show = ref(true);
    const color = ref('royalblue');

    const toggleColor = () => {
      color.value = color.value === 'royalblue' ? 'mediumslateblue' : 'royalblue';
    };

    return () => (
      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px' }}>
        <h3>默认情况下不会自动删除添加的样式</h3>

        <label>
          <input type="checkbox" checked={show.value} onChange={(e) => (show.value = (e.target as HTMLInputElement).checked)} />
          Show Components
        </label>

        <button onClick={toggleColor}>Change theme</button>

        {show.value && (
          <div>
            <Demo />
            <br />
            <DesignTokenProvider value={{ token: { primaryColor: color.value } }}>
              <Demo />
            </DesignTokenProvider>
            <br />
            <DesignTokenProvider value={{ token: { primaryColor: 'orange' }, hashed: true }}>
              <Demo />
            </DesignTokenProvider>
          </div>
        )}
      </div>
    );
  },
});
