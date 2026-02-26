import { defineComponent, reactive, ref } from 'vue';
import Tree from '../src';
import type { Key } from '../src/interface';
import './assets/index.less';
import './basic.less';

const treeData = [
  {
    key: '0-0',
    title: 'parent 1',
    children: [
      { key: '0-0-0', title: 'parent 1-1', children: [{ key: '0-0-0-0', title: 'parent 1-1-0' }] },
      {
        key: '0-0-1',
        title: 'parent 1-2',
        children: [
          { key: '0-0-1-0', title: 'parent 1-2-0', disableCheckbox: true },
          { key: '0-0-1-1', title: 'parent 1-2-1' },
          { key: '0-0-1-2', title: 'parent 1-2-2' },
          { key: '0-0-1-3', title: 'parent 1-2-3' },
          { key: '0-0-1-4', title: 'parent 1-2-4' },
          { key: '0-0-1-5', title: 'parent 1-2-5' },
          { key: '0-0-1-6', title: 'parent 1-2-6' },
          { key: '0-0-1-7', title: 'parent 1-2-7' },
          { key: '0-0-1-8', title: 'parent 1-2-8' },
          { key: '0-0-1-9', title: 'parent 1-2-9' },
          { key: 1128, title: 1128 },
        ],
      },
    ],
  },
];

export default defineComponent(() => {
  const keys: Key[] = ['0-0-0-0'];
  const state = reactive({
    defaultExpandedKeys: keys,
    defaultSelectedKeys: keys,
    defaultCheckedKeys: keys,
  });

  const selKey = ref<Key | null>(null);

  const onExpand = (expandedKeys: Key[]) => {
    console.log('onExpand', expandedKeys);
  };

  const onSelect = (selectedKeys: Key[], info: any) => {
    console.log('selected', selectedKeys, info);
    selKey.value = info.node.key;
  };

  const onCheck = (checkedKeys: any, info: any) => {
    console.log('onCheck', checkedKeys, info);
  };

  return () => {
    return (
      <div style={{ margin: '0 20px' }}>
        <Tree
          prefixCls="rc-tree"
          class="myCls"
          showLine
          checkable
          selectable={false}
          defaultExpandAll
          onExpand={onExpand}
          defaultSelectedKeys={state.defaultSelectedKeys}
          defaultCheckedKeys={state.defaultCheckedKeys}
          onSelect={onSelect}
          onCheck={onCheck}
          treeData={treeData as any}
        />
      </div>
    );
  };
});
