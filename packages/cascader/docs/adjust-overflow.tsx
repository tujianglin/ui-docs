import type { BuildInPlacements } from '@vc-com/trigger/interface';
import { defineComponent, ref } from 'vue';
import Cascader from '../src';
import './assets/index.less';

const addressOptions = [
  {
    label: '福建',
    value: 'fj',
    children: [
      {
        label: '福州',
        value: 'fuzhou',
        children: [
          {
            label: '马尾',
            value: 'mawei',
          },
        ],
      },
      {
        label: '泉州',
        value: 'quanzhou',
      },
    ],
  },
  {
    label: '浙江',
    value: 'zj',
    children: [
      {
        label: '杭州',
        value: 'hangzhou',
        children: [
          {
            label: '余杭',
            value: 'yuhang',
          },
        ],
      },
    ],
  },
  {
    label: '北京',
    value: 'bj',
    children: [
      {
        label: '朝阳区',
        value: 'chaoyang',
      },
      {
        label: '海淀区',
        value: 'haidian',
        disabled: true,
      },
    ],
  },
];

const MyCascader = defineComponent(({ builtinPlacements }: { builtinPlacements?: BuildInPlacements }) => {
  const inputValue = ref('');

  const onChange = (value, selectedOptions) => {
    console.log(value, selectedOptions);
    inputValue.value = selectedOptions.map((o) => o.label).join(', ');
  };

  return () => (
    <Cascader options={addressOptions} builtinPlacements={builtinPlacements} onChange={onChange}>
      <input
        placeholder={builtinPlacements ? 'Will not adjust position' : 'Will adjust position'}
        value={inputValue.value}
        style={{ width: '170px' }}
      />
    </Cascader>
  );
});

const placements = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustY: 1,
    },
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustY: 1,
    },
  },
  bottomRight: {
    points: ['tr', 'br'],
    offset: [0, 4],
    overflow: {
      adjustY: 1,
    },
  },
  topRight: {
    points: ['br', 'tr'],
    offset: [0, -4],
    overflow: {
      adjustY: 1,
    },
  },
};

const Demo = defineComponent(() => {
  return () => (
    <div>
      <MyCascader />
      <br />
      <br />
      <MyCascader builtinPlacements={placements} />
    </div>
  );
});

export default Demo;
