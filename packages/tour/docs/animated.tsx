import { defineComponent } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import Tour from '../src/index';
import './basic.less';

const App = defineComponent(() => {
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const updateBtnRef = useRef<HTMLButtonElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  return () => (
    <div style={{ margin: '300px' }}>
      <div>
        <button
          class="ant-target"
          ref={createBtnRef}
          // style={{ marginLeft: 100 }}
        >
          Create
        </button>
        {/* <div style={{ height: 200 }} /> */}
        <button class="ant-target" ref={updateBtnRef}>
          Update
        </button>
        <button class="ant-target" ref={deleteBtnRef}>
          Delete
        </button>
      </div>

      <div style={{ height: '200px' }} />

      <Tour
        defaultCurrent={0}
        animated={true}
        steps={[
          {
            title: '创建',
            description: '创建一条数据',
            target: createBtnRef,
            // mask: true,
          },
          {
            title: '更新',
            description: () => (
              <div>
                <span>更新一条数据</span>
                <button>帮助文档</button>
              </div>
            ),
            target: updateBtnRef,
          },
          {
            title: '删除',
            description: (
              <div>
                <span>危险操作：删除一条数据</span>
                <button>帮助文档</button>
              </div>
            ),
            target: deleteBtnRef,
            // mask: true,
            // style: { color: 'red' },
          },
        ]}
      />
    </div>
  );
});

export default App;
