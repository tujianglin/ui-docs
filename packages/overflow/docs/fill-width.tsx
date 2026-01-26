import { defineComponent, onMounted, ref, shallowRef, watch, type CSSProperties } from 'vue';
import Overflow from '../src';
import './assets/index.less';
import './common.less';

interface ItemType {
  value: string | number;
  label: string;
}

function createData(count: number): ItemType[] {
  const data: ItemType[] = new Array(count).fill(undefined).map((_, index) => ({
    value: index,
    label: `Label ${index}`,
  }));

  return data;
}

function renderItem(item: ItemType) {
  return (
    <div
      style={{
        margin: '0 16px 0 8px',
        padding: '4px 8px',
        background: 'rgba(255, 0, 0, 0.2)',
      }}
    >
      {item.label}
    </div>
  );
}

function renderRest(items: ItemType[]) {
  return (
    <div
      style={{
        margin: '0 16px 0 8px',
        padding: '4px 8px',
        background: 'rgba(255, 0, 0, 0.2)',
      }}
    >
      +{items.length}...
    </div>
  );
}

const inputStyle: CSSProperties = {
  border: 'none',
  fontSize: 12,
  margin: 0,
  outline: 'none',
  lineHeight: '20px',
  fontFamily: '-apple-system',
  padding: '0 4px',
};

const Demo = defineComponent(() => {
  const responsive = ref(true);
  const inputValue = ref('');
  const inputWidth = ref(0);
  const data = ref(createData(3));
  const inputRef = shallowRef<HTMLInputElement>();
  const measureRef = shallowRef<HTMLDivElement>();

  watch(
    inputValue,
    () => {
      inputWidth.value = measureRef.value?.offsetWidth || 0;
    },
    { flush: 'post', immediate: true },
  );

  onMounted(() => {
    inputRef.value.focus();
  });

  return () => (
    <div style={{ padding: '32px' }}>
      <button
        type="button"
        onClick={() => {
          responsive.value = !responsive.value;
        }}
      >
        {responsive.value ? 'Responsive' : 'MaxCount: 6'}
      </button>
      <select
        style={{ width: '200px', height: '32px' }}
        value={data.value.length}
        onChange={({ target: { value } }) => {
          data.value = createData(Number(value));
        }}
      >
        <option value={0}>0</option>
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={200}>200</option>
      </select>

      <div
        style={{
          border: '5px solid green',
          padding: '8px',
          maxWidth: '300px',
          marginTop: '32px',
        }}
      >
        <Overflow
          data={data.value}
          renderItem={renderItem}
          renderRest={renderRest}
          maxCount={responsive.value ? 'responsive' : 6}
          suffix={() => (
            <div style={{ position: 'relative', maxWidth: '100%' }}>
              <input
                style={{
                  ...inputStyle,
                  background: 'rgba(0, 0, 0, 0.1)',
                  width: inputWidth.value + 'px',
                  minWidth: '10px',
                  maxWidth: '100%',
                }}
                value={inputValue.value}
                onChange={(e) => {
                  inputValue.value = e.target.value;
                }}
                ref={inputRef}
              />
              <div
                style={{
                  ...inputStyle,
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: 0,
                  top: `200%`,
                }}
                ref={measureRef}
              >
                {inputValue.value}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
});

export default Demo;
