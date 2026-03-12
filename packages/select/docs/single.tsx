/* eslint-disable no-console */
import Select from '@vc-com/select';
import { defineComponent, reactive } from 'vue';
import './assets/index.less';
import './single.less';

const Test = defineComponent(() => {
  const state = reactive({
    destroy: false,
    value: '9',
  });
  const onChange = (e) => {
    let value;
    if (e && e.target) {
      ({ value } = e.target);
    } else {
      value = e;
    }
    console.log('onChange', value);

    state.value = value;
  };

  const onDestroy = () => {
    state.destroy = true;
  };

  const onBlur = (v) => {
    console.log('onBlur', v);
  };

  const onFocus = () => {
    console.log('onFocus');
  };

  const onSearch = (val) => {
    console.log('Search:', val);
  };

  const options = [
    {
      value: null,
      label: '不选择',
      text: '不选择',
    },
    {
      value: '01',
      label: <b style={{ color: 'red' }}>jack</b>,
      text: 'jack',
      title: 'jack',
    },
    {
      value: '11',
      label: 'lucy',
      text: 'lucy',
    },
    {
      value: '21',
      label: 'disabled',
      text: 'disabled',
      disabled: true,
    },
    {
      value: '31',
      label: 'yiminghe',
      text: 'yiminghe',
      className: 'test-option',
      style: { background: 'yellow' },
    },
    ...Array.from({ length: 10 }, (_, i) => ({
      value: String(i),
      label: `${i}-text`,
      text: String(i),
    })),
  ];

  return () => (
    <div v-if={!state.destroy} style={{ margin: '20px' }}>
      <div
        style={{ height: '150px', background: 'rgba(0, 255, 0, 0.1)' }}
        onMousedown={(e) => {
          e.preventDefault();
        }}
      >
        Prevent Default
      </div>

      <h2>Single Select</h2>

      <div>
        <Select
          autofocus
          id="my-select"
          value={state.value}
          placeholder="placeholder"
          showSearch={{
            onSearch,
            optionFilterProp: 'text',
          }}
          onBlur={onBlur}
          onFocus={onFocus}
          allowClear
          onChange={onChange}
          onPopupScroll={() => {
            console.log('Scroll!');
          }}
          options={options}
        ></Select>
      </div>
      <h2>native select</h2>
      <select value={state.value} style={{ width: '500px' }} onChange={onChange}>
        <option value="01">jack</option>
        <option value="11">lucy</option>
        <option value="21" disabled>
          disabled
        </option>
        <option value="31">yiminghe</option>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <option value={i} key={i}>
            {i}
          </option>
        ))}
      </select>

      <h2>RTL Select</h2>

      <div style={{ width: '300px' }}>
        <Select
          id="my-select-rtl"
          placeholder="rtl"
          direction="rtl"
          popupMatchSelectWidth={300}
          popupStyle={{ minWidth: '300px' }}
          style={{ width: '500px' }}
          options={[
            {
              label: '1',
              value: '1',
            },
            {
              label: '2',
              value: '2',
            },
          ]}
        ></Select>
      </div>

      <p>
        <button type="button" onClick={onDestroy}>
          destroy
        </button>
      </p>
    </div>
  );
});

export default Test;
