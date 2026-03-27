import { defineComponent, ref } from 'vue';
import Tabs from '../src';
import './assets/index.less';

export default defineComponent(() => {
  const destroy = ref(false);
  const items = ref<any>([
    {
      label: 'Light',
      key: 'light',
      children: 'Light!',
      icon: <span>🌞</span>,
    },
    {
      label: 'Bamboo',
      key: 'bamboo',
      children: 'Bamboo!',
      icon: <span>🎋</span>,
    },
    {
      label: 'Cute',
      key: 'cute',
      children: 'Cute!',
      disabled: true,
      icon: <span>🐼</span>,
    },
    {
      label: 'Yo',
      key: 'yo',
      children: 'Yo!',
      icon: <span>👋</span>,
    },
  ]);
  const direction = ref<'ltr' | 'rtl'>('ltr');

  // if (destroy) {
  //   return null;
  // }

  const onTabClick = (key: string) => {
    console.log('onTabClick', key);
  };

  const onTabChange = (key: string) => {
    console.log('onTabChange', key);
  };

  return () => (
    <>
      <Tabs
        v-if={!destroy.value}
        tabBarExtraContent="extra"
        onTabClick={onTabClick}
        onChange={onTabChange}
        direction={direction.value}
        items={items.value}
      />
      <button
        type="button"
        onClick={() => {
          items.value = [
            {
              key: 'yo',
              label: 'Yo',
              children: 'Yo!',
              icon: <span>👋</span>,
            },
          ];
        }}
      >
        Change children
      </button>
      <button
        type="button"
        onClick={() => {
          destroy.value = !destroy.value;
        }}
      >
        Destroy
      </button>
      <button
        type="button"
        onClick={() => {
          direction.value = direction.value === 'ltr' ? 'rtl' : 'ltr';
        }}
      >
        {direction.value === 'ltr' ? 'rtl' : 'ltr'}
      </button>
    </>
  );
});
