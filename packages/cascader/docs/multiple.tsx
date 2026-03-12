/* eslint-disable @typescript-eslint/no-shadow */
import { defineComponent, ref } from 'vue';
import Cascader from '../src';
import './assets/index.less';

const { SHOW_CHILD } = Cascader;

const optionLists = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    isLeaf: false,
    disableCheckbox: true,
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    isLeaf: false,
    disableCheckbox: false,
  },
];

const Demo = defineComponent(() => {
  const options = ref(optionLists);
  const value = ref<string[][]>([]);

  const onChange = (val, selectedOptions) => {
    console.log(val, selectedOptions);
    value.value = val;
  };

  const loadData = (selectedOptions) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    // targetOption.loading = true;

    // // load options lazily
    setTimeout(() => {
      targetOption.loading = false;
      targetOption.children = [
        {
          label: `${targetOption.label} Dynamic 1`,
          value: 'dynamic1',
          disableCheckbox: false,
        },
        {
          label: `${targetOption.label} Dynamic 2`,
          value: 'dynamic2',
          disableCheckbox: true,
        },
      ];
      options.value = [...options.value];
    }, 1000);
  };

  // 直接选中一级选项，但是此时二级选项没有全部选中
  return () => (
    <Cascader
      checkable
      options={options.value}
      showCheckedStrategy={SHOW_CHILD}
      loadData={loadData}
      value={value.value}
      onChange={onChange}
      changeOnSelect
    />
  );
});

export default Demo;
