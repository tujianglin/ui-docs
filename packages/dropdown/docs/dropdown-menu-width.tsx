import Dropdown from '@vc-com/dropdown';
import Menu, { Item as MenuItem } from '@vc-com/menu';
import { defineComponent, reactive } from 'vue';
import './assets/index.less';

const Example = defineComponent(() => {
  const state = reactive({ longList: true });

  const short = () => {
    state.longList = false;
  };

  const long = () => {
    state.longList = true;
  };

  return () => {
    const menuItems = [<MenuItem key="1">1st item</MenuItem>, <MenuItem key="2">2nd item</MenuItem>];

    if (state.longList) {
      menuItems.push(<MenuItem key="3">3rd LONG SUPER LONG item</MenuItem>);
    }
    const menu = () => <Menu>{menuItems}</Menu>;

    return (
      <div>
        <Dropdown overlay={menu}>
          <button>Actions</button>
        </Dropdown>
        <button onClick={long}>Long List</button>
        <button onClick={short}>Short List</button>
      </div>
    );
  };
});

export default Example;
