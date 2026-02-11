import type { CollapseProps } from '@vc-com/collapse';
import Collapse from '@vc-com/collapse';
import './assets/index.less';

const App = () => {
  const items: CollapseProps['items'] = [
    {
      label: <input onKeydown={(e) => e.stopPropagation()} />,
      children: 'content',
    },
    {
      label: 'title 2',
      children: 'content 2',
      collapsible: 'disabled',
    },
    {
      label: 'title 3',
      children: 'content 3',
      onItemClick: console.log,
    },
  ];

  return <Collapse items={items} />;
};

export default App;
