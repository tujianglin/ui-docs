import Collapse, { type CollapseProps } from '@vc-com/collapse';
import type { Key } from '@vc-com/util/lib/types';
import { defineComponent, ref } from 'vue';
import motion from './_util/motionUtil';
import './assets/index.less';

const initLength = 3;

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

function random() {
  return parseInt((Math.random() * 10).toString(), 10) + 1;
}

const arrowPath =
  'M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88' +
  '.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.' +
  '6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-0.7 5.' +
  '2-2L869 536.2c14.7-12.8 14.7-35.6 0-48.4z';

function expandIcon({ isActive }: { isActive?: boolean }) {
  return (
    <i style={{ marginRight: '.5rem' }}>
      <svg
        viewBox="0 0 1024 1024"
        width="1em"
        height="1em"
        fill="currentColor"
        style={{
          verticalAlign: '-.125em',
          transition: 'transform .2s',
          transform: `rotate(${isActive ? 90 : 0}deg)`,
        }}
      >
        <path d={arrowPath} />
      </svg>
    </i>
  ) as JSX.Element;
}

const App = defineComponent(() => {
  const accordion = ref(false);
  const activeKey = ref<Key[]>(['4']);

  const time = random();

  const items: CollapseProps['items'] = [
    ...Array.from({ length: initLength }, (_, i) => {
      const key = String(i + 1);
      return {
        key,
        label: `This is panel header ${key}`,
        children: <p>{text.repeat(time)}</p>,
      };
    }),

    {
      key: String(initLength + 1),
      label: `This is panel header ${initLength + 1}`,
      children: (
        <Collapse
          activeKey={['1']}
          expandIcon={expandIcon}
          items={[
            {
              key: '1',
              label: 'This is panel nest panel',
              // 原来你写在 Panel 上的 id="header-test"，在 items 里没有对应字段
              // 想保留就包一层容器挂 id
              children: () => (
                <div id="header-test">
                  <p>{text}</p>
                </div>
              ),
            },
          ]}
        />
      ),
    },

    {
      key: String(initLength + 2),
      label: `This is panel header ${initLength + 2}`,
      extra: () => <div>111</div>,
      children: (
        <Collapse
          activeKey={['1']}
          items={[
            {
              key: '1',
              label: 'This is panel nest panel',
              children: (
                <div id="another-test">
                  <form>
                    <label for="test">Name:&nbsp;</label>
                    <input type="text" id="test" />
                  </form>
                </div>
              ),
              extra: () => <div>111</div>,
            },
          ]}
        />
      ),
    },
  ];

  const tools = (
    <>
      <br />
      <br />
      <button type="button" onClick={() => (accordion.value = !accordion.value)}>
        {accordion.value ? 'Mode: accordion' : 'Mode: collapse'}
      </button>
      <br />
      <br />
      <button type="button" onClick={() => (activeKey.value = ['2'])}>
        active header 2
      </button>
      <br />
      <br />
    </>
  );

  return () => (
    <>
      {tools}
      <Collapse
        accordion={accordion.value}
        v-model:activeKey={activeKey.value}
        expandIcon={expandIcon}
        openMotion={motion}
        items={items}
      ></Collapse>
    </>
  );
});

export default App;
