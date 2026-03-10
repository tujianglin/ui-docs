import Dropdown from '@vc-com/dropdown';
import Menu, { Item as MenuItem } from '@vc-com/menu';
import { defineComponent } from 'vue';
import './assets/index.less';

const ContextMenu = defineComponent(() => {
  const menu = (
    <Menu style={{ width: '140px' }}>
      <MenuItem key="1">one</MenuItem>
      <MenuItem key="2">two</MenuItem>
    </Menu>
  );

  return () => (
    <Dropdown trigger={['contextmenu']} overlay={menu} animation="slide-up" alignPoint>
      <div
        role="button"
        style={{
          border: '1px solid #000',
          padding: '100px 0',
          textAlign: 'center',
        }}
      >
        Right click me!
      </div>
    </Dropdown>
  );
});

export default ContextMenu;
