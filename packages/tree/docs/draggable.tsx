import { defineComponent, reactive } from 'vue';
import Tree from '../src';
import type { Key } from '../src/interface';
import './assets/index.less';
import './draggable.less';
import { generateData } from './utils/dataUtil';

export default defineComponent(() => {
  const state = reactive({
    gData: generateData(2, 2, 2),
    autoExpandParent: true,
    expandedKeys: [
      '0-0-key',
      '0-0-0-key',
      '0-0-0-0-key',
      '0-0-0-1-key',
      '0-0-1-key',
      '0-0-1-0-key',
      '0-0-1-1-key',
      '0-1-key',
      '0-1-0-key',
      '0-1-0-0-key',
      '0-1-0-1-key',
      '0-1-1-key',
      '0-1-1-0-key',
      '0-1-1-1-key',
    ] as Key[],
  });

  const onDragStart = (info) => {
    console.log('start', info);
  };

  const onDragEnter = () => {
    console.log('enter');
  };

  const onDrop = (info) => {
    console.log('drop', info);
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (data, key, callback) => {
      data.forEach((item, index, arr) => {
        if (item.key === key) {
          callback(item, index, arr);
          return;
        }
        if (item.children) {
          loop(item.children, key, callback);
        }
      });
    };
    const data = [...state.gData];

    // Find dragObject
    let dragObj;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (dropPosition === 0) {
      // Drop on the content
      loop(data, dropKey, (item) => {
        // eslint-disable-next-line no-param-reassign
        item.children = item.children || [];
        // where to insert 示例添加到尾部，可以是随意位置
        item.children.unshift(dragObj);
      });
    } else {
      // Drop on the gap (insert before or insert after)
      let ar;
      let i;
      loop(data, dropKey, (_, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }
    state.gData = data;
  };

  const onExpand = (expandedKeys) => {
    console.log('onExpand', expandedKeys);
    state.expandedKeys = expandedKeys;
    state.autoExpandParent = false;
  };
  return () => (
    <div class="draggable-demo">
      <h2>draggable</h2>
      <p>drag a node into another node</p>
      <div style={{ border: '1px solid red' }}>
        <Tree
          expandedKeys={state.expandedKeys}
          onExpand={onExpand}
          autoExpandParent={state.autoExpandParent}
          draggable={{
            icon: '↕️',
          }}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          treeData={state.gData}
          // Virtual
          height={200}
          itemHeight={20}
          virtual={false}
        />
        <div draggable>This element is draggable, but it cannot be dragged into tree.</div>
      </div>
    </div>
  );
});
