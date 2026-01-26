import { defineComponent, ref } from 'vue';
import Tour from '../src/index';
import './basic.less';

const App = defineComponent(() => {
  const createBtnRef = ref<HTMLButtonElement>(null);
  const updateBtnRef = ref<HTMLButtonElement>(null);
  const deleteBtnRef = ref<HTMLButtonElement>(null);
  return () => (
    <div style={{ margin: '300px' }}>
      <div>
        <button class="ant-target" ref={createBtnRef} style={{ marginLeft: '100px' }}>
          Create
        </button>
        <div style={{ height: '200px' }} />
        <button class="ant-target" ref={updateBtnRef}>
          Update
        </button>
        <button class="ant-target" ref={deleteBtnRef}>
          Delete
        </button>
      </div>

      <div style={{ height: '200px' }} />

      <Tour
        defaultCurrent={2}
        steps={[
          {
            title: () => '创建',
            description: (
              <div>
                <span>创建一条数据</span>
                <button>帮助文档</button>
              </div>
            ),
            target: createBtnRef,
            mask: true,
          },
          {
            title: '更新',
            description: (
              <div>
                <span>更新一条数据</span>
                <button>帮助文档</button>
              </div>
            ),
            target: updateBtnRef,
          },
          {
            title: '更新（无阴影）',
            description: (
              <div>
                <span>更新一条数据</span>
                <button>帮助文档</button>
              </div>
            ),
            mask: false,
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
            mask: true,
            style: { color: 'red' },
          },
        ]}
      />
    </div>
  );
});

export default App;
