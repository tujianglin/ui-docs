import { CSSMotionList } from '@vc-com/motion';
import clsx from 'clsx';
import { defineComponent, onMounted, reactive, ref } from 'vue';
import './list.less';

export default defineComponent(() => {
  const count = ref(1);
  const checkedMap = reactive<Record<string, boolean>>({});
  const keyList = ref<any[]>([]);

  const onFlushMotion = () => {
    let keys = [];
    for (let i = 0; i < count.value; i += 1) {
      if (checkedMap[i] !== false) {
        keys.push(i);
      }
    }

    keys = keys.map((key) => {
      if (key === 3) {
        return { key, background: 'orange' };
      }
      return key;
    });

    keyList.value = keys;
  };

  onMounted(() => {
    onFlushMotion();
  });

  const onCountChange = (event) => {
    count.value = Number((event.target as HTMLInputElement).value);
  };

  // Motion
  const onCollapse = () => ({ width: 0, margin: '0 -5px 0 0' });

  return () => (
    <div>
      key 3 is a different component with others.
      {/* Input field */}
      <div>
        <label>
          node count
          <input type="number" min={0} value={count.value} onChange={onCountChange} />
        </label>
        <button type="button" onClick={onFlushMotion}>
          Flush Motion
        </button>
      </div>
      {/* Motion State */}
      <div>
        {Array.from({ length: count.value })
          .fill(undefined)
          .map((_, key) => {
            const checked = checkedMap[key] !== false;
            return (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    checkedMap[key] = !checked;
                  }}
                />
                {key}
              </label>
            );
          })}
      </div>
      {/* Motion List */}
      <CSSMotionList
        keys={keyList.value}
        motionName="list-transition"
        onAppearStart={onCollapse}
        onEnterStart={onCollapse}
        onLeaveActive={onCollapse}
        onVisibleChanged={(changedVisible, info) => {
          console.log('Visible Changed >>>', changedVisible, info);
        }}
      >
        {({ key, background, class: className, style }) => {
          return (
            <div class={clsx('list-demo-block', className)} style={{ ...style, background }}>
              <span>{key}</span>
            </div>
          );
        }}
      </CSSMotionList>
    </div>
  );
});
