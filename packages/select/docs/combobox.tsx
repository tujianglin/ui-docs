import { defineComponent, effect, ref } from 'vue';
import Select from '../src';
import './assets/index.less';

const ComboboxDemo = defineComponent({
  name: 'ComboboxDemo',
  setup() {
    const disabled = ref(false);
    const value = ref('');
    const asyncOptions = ref<{ value: string }[]>([]);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const onActive = (val: any) => {
      console.log('onActive', val);
    };

    const onChange = (val: any, option: any) => {
      console.log('onChange', val, option);
      value.value = val;
    };

    const onKeyDown = (e) => {
      if (e.keyCode === 13) {
        console.log('onEnter', value.value);
      }
    };

    const onSelect = (v: any, option: any) => {
      console.log('onSelect', v, option);
    };

    const onSearch = (text: string) => {
      console.log('onSearch:', text);
    };

    const onAsyncChange = (val: any) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        console.log(val);
        asyncOptions.value = [{ value: val }, { value: `${val}-${val}` }];
      }, 1000);
    };

    effect(() => {
      console.log(asyncOptions.value);
    });

    const toggleDisabled = () => {
      disabled.value = !disabled.value;
    };

    const reset = () => {
      value.value = '';
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
      <div style={{ margin: '20px' }}>
        <h2>combobox</h2>
        <p>
          <button type="button" onClick={toggleDisabled}>
            toggle disabled
          </button>
          <button type="button" onClick={reset}>
            reset
          </button>
        </p>

        <Select
          value={value.value}
          mode="combobox"
          onChange={onChange}
          onActive={onActive}
          showSearch={{
            filterOption: (inputValue: string, option: any) => {
              if (!inputValue) {
                return true;
              }
              return (option.value as string)?.includes(inputValue);
            },
          }}
          options={options}
        ></Select>

        <div>
          <Select
            disabled={disabled.value}
            style={{ width: '500px' }}
            onChange={onChange}
            onSelect={onSelect}
            showSearch={{
              onSearch: onSearch,
            }}
            onInputKeyDown={onKeyDown}
            notFoundContent=""
            allowClear
            placeholder="please input, max len: 10"
            value={value.value}
            maxLength={10}
            mode="combobox"
            backfill
            onFocus={() => console.log('focus')}
            onBlur={() => console.log('blur')}
            options={options}
          ></Select>

          <h3>Async Input Element</h3>
          <Select
            mode="combobox"
            notFoundContent={null}
            style={{ width: '200px' }}
            options={asyncOptions.value}
            onChange={onAsyncChange}
          />
        </div>
      </div>
    );
  },
});

export default ComboboxDemo;
