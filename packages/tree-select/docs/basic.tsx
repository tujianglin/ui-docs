import { defineComponent, ref } from 'vue';
import TreeSelect, { SHOW_PARENT } from '../src';
import './assets/index.less';
import { gData } from './utils/dataUtil';

function isLeaf(value: string | undefined) {
  if (!value) {
    return false;
  }
  let queues: any[] = [...gData];
  while (queues.length) {
    // BFS
    const item = queues.shift();
    if (item.value === value) {
      return !item.children;
    }
    if (item.children) {
      queues = queues.concat(item.children);
    }
  }
  return false;
}

function findPath(value: string, data: any[]) {
  const sel: any[] = [];
  function loop(selected: string, children: any[]) {
    for (let i = 0; i < children.length; i += 1) {
      const item = children[i];
      if (selected === item.value) {
        sel.push(item);
        return;
      }
      if (item.children) {
        loop(selected, item.children);
        if (sel.length) {
          sel.push(item);
          return;
        }
      }
    }
  }
  loop(value, data);
  return sel;
}

export default defineComponent(() => {
  const tsOpen = ref(false);
  const searchValue = ref('0-0-0-label');
  const value = ref<string | undefined>('0-0-0-value1');

  const lv = ref<any>({ value: '0-0-0-value', label: 'spe label' });

  const multipleValue = ref<string[]>([]);

  const simpleSearchValue = ref<string | undefined>('test111');
  const simpleTreeData = ref<any[]>([
    { key: 1, pId: 0, label: 'test1', value: 'test1' },
    { key: 121, pId: 0, label: 'test2', value: 'test2' },
    { key: 11, pId: 1, label: 'test11', value: 'test11' },
    { key: 12, pId: 1, label: 'test12', value: 'test12' },
    { key: 111, pId: 11, label: 'test111', value: 'test111' },
  ]);

  const treeDataSimpleMode = {
    id: 'id',
    rootPId: 0,
  } as const;

  const onSearch = (val: string, ...args: any[]) => {
    console.log('Do Search:', val, ...args);
    searchValue.value = val;
  };

  const onChange = (val: any, ...rest: any[]) => {
    console.log('onChange', val, ...rest);
    value.value = val;
  };

  const onChangeChildren = (val: any, ...args: any[]) => {
    const preValue = value.value;
    console.log('onChangeChildren', val, ...args);

    if (!val) {
      value.value = undefined;
      return;
    }

    value.value = isLeaf(val) ? val : preValue;
  };

  const onChangeLV = (next: any, ...args: any[]) => {
    console.log('labelInValue', next, ...args);
    if (!next) {
      lv.value = undefined;
      return;
    }
    const path = findPath(next.value, gData)
      .map((i) => i.label)
      .reverse()
      .join(' > ');
    lv.value = { value: next.value, label: path };
  };

  const onSelect = (...args) => {
    // use onChange instead
    console.log(args);
  };

  const onMultipleChange = (value) => {
    console.log('onMultipleChange', value);
    multipleValue.value = value;
  };

  const onPopupVisibleChange = (visible) => {
    console.log(visible, value.value);
    if (Array.isArray(value.value) && value.value.length > 1 && value.value.length < 3) {
      window.alert('please select more than two item or less than one item.');
      return false;
    }
    return true;
  };

  return () => (
    <div style={{ margin: '20px' }}>
      <h2>single select</h2>
      <TreeSelect
        style={{ width: '300px' }}
        transitionName="rc-tree-select-dropdown-slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        placeholder={() => <i>请下拉选择</i>}
        showSearch={{ treeNodeFilterProp: 'label', filterTreeNode: false, onSearch }}
        allowClear
        treeLine
        value={value.value}
        treeData={gData}
        open={tsOpen.value}
        onChange={(val, ...args) => {
          console.log('onChange', val, ...args);
          value.value = val;
        }}
        onPopupVisibleChange={(open) => {
          console.log('single onPopupVisibleChange', open);
          tsOpen.value = open;
        }}
        onSelect={onSelect}
        onPopupScroll={(evt) => {
          console.log('onPopupScroll:', evt.target);
        }}
      />
      <h2>single select (just select children)</h2>
      <TreeSelect
        style={{ width: '300px' }}
        transitionName="rc-tree-select-dropdown-slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        placeholder={() => <i>请下拉选择</i>}
        showSearch={{ treeNodeFilterProp: 'label', filterTreeNode: false }}
        allowClear
        treeLine
        value={value.value}
        treeData={gData}
        onChange={onChangeChildren}
      />
      <h2>multiple select</h2>
      <TreeSelect
        style={{ width: '300px' }}
        transitionName="rc-tree-select-dropdown-slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        placeholder={() => <i>请下拉选择</i>}
        multiple
        value={multipleValue.value}
        treeData={gData}
        showSearch={{ treeNodeFilterProp: 'title' }}
        onChange={onMultipleChange}
        onSelect={onSelect}
        allowClear
      />
      <h2>check select</h2>
      <TreeSelect
        allowClear
        class="check-select"
        transitionName="rc-tree-select-dropdown-slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        style={{ width: '300px' }}
        popupAlign={{
          overflow: { adjustY: 0, adjustX: 0 },
          offset: [0, 2],
        }}
        onPopupVisibleChange={onPopupVisibleChange}
        placeholder={() => <i>请下拉选择</i>}
        treeLine
        maxTagTextLength={10}
        value={value.value}
        showSearch={{ autoClearSearchValue: true, treeNodeFilterProp: 'title' }}
        treeData={gData}
        treeCheckable
        showCheckedStrategy={SHOW_PARENT}
        onChange={onChange}
        onSelect={onSelect}
        maxTagCount="responsive"
        maxTagPlaceholder={(valueList) => {
          // console.log('Max Tag Rest Value:', valueList);
          return `${valueList.length} rest...`;
        }}
      />
      <h2>labelInValue & show path</h2>
      <TreeSelect
        style={{ width: '500px' }}
        transitionName="rc-tree-select-dropdown-slide-up"
        choiceTransitionName="rc-tree-select-selection__choice-zoom"
        placeholder={() => <i>请下拉选择</i>}
        showSearch={{ treeNodeFilterProp: 'label', filterTreeNode: false }}
        allowClear
        treeLine
        value={lv.value}
        labelInValue
        treeData={gData}
        onChange={onChangeLV}
      />
      <h2>use treeDataSimpleMode</h2>
      <TreeSelect
        style={{ width: '300px' }}
        placeholder={() => <i>请下拉选择</i>}
        // treeLine
        maxTagTextLength={10}
        showSearch={{
          searchValue: simpleSearchValue.value,
          onSearch: (val) => (simpleSearchValue.value = val),
          treeNodeFilterProp: 'title',
        }}
        value={value.value}
        treeData={simpleTreeData.value}
        treeDataSimpleMode={treeDataSimpleMode}
        treeCheckable
        showCheckedStrategy={SHOW_PARENT}
        onChange={onChange}
        onSelect={(...args) => {
          simpleSearchValue.value = '';
          onSelect(...args);
        }}
      />
      <h2>Testing in extreme conditions (Boundary conditions test) </h2>
      <TreeSelect
        style={{ width: '200px' }}
        popupStyle={{ maxHeight: '200px', overflow: 'auto' }}
        defaultValue="leaf1"
        multiple
        treeCheckable
        showCheckedStrategy={SHOW_PARENT}
        treeDefaultExpandAll
        treeData={[
          { key: '', value: '', label: 'empty value', children: [] },
          {
            key: '0',
            value: '0',
            label: '0 label',
            children: [
              { key: '00', value: '00', label: '00 label', children: [] },
              { key: '01', value: '01', label: '01 label', children: [] },
            ],
          },
        ]}
        onChange={(val, ...args) => console.log(val, ...args)}
      />

      <h2>title render</h2>
      <TreeSelect open style={{ width: '300px' }} treeData={gData} treeTitleRender={(node) => node.label + 'ok'} />
    </div>
  );
});
