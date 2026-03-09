/* eslint-disable no-console, react/require-default-props, no-param-reassign */

import type { CSSMotionProps } from '@vc-com/motion';
import { defineComponent, reactive } from 'vue';
import Menu, { Divider, Item as MenuItem, type MenuProps, SubMenu } from '../src';
import './assets/index.less';

function handleClick(info) {
  console.log(`clicked ${info.key}`);
  console.log(info);
}

const collapseNode = () => {
  return { height: '0px' };
};
const expandNode = (node) => {
  return { height: `${node.scrollHeight}px` };
};

const horizontalMotion: CSSMotionProps = {
  motionName: 'rc-menu-open-slide-up',
  motionAppear: true,
  motionEnter: true,
  motionLeave: true,
};

const verticalMotion: CSSMotionProps = {
  motionName: 'rc-menu-open-zoom',
  motionAppear: true,
  motionEnter: true,
  motionLeave: true,
};

export const inlineMotion: CSSMotionProps = {
  motionName: 'rc-menu-collapse',
  motionAppear: true,
  onAppearStart: collapseNode,
  onAppearActive: expandNode,
  onEnterStart: collapseNode,
  onEnterActive: expandNode,
  onLeaveStart: expandNode,
  onLeaveActive: collapseNode,
};

const motionMap: Record<MenuProps['mode'], CSSMotionProps> = {
  horizontal: horizontalMotion,
  inline: inlineMotion,
  vertical: verticalMotion,
};

const nestSubMenu = (
  <SubMenu title={<span class="submenu-title-wrapper">offset sub menu 2</span>} key="4" popupOffset={[10, 15]}>
    <MenuItem key="4-1">inner inner</MenuItem>
    <Divider />
    <SubMenu key="4-2" title={<span class="submenu-title-wrapper">sub menu 1</span>}>
      <SubMenu title={<span class="submenu-title-wrapper">sub 4-2-0</span>} key="4-2-0">
        <MenuItem key="4-2-0-1">inner inner</MenuItem>
        <MenuItem key="4-2-0-2">inner inner2</MenuItem>
      </SubMenu>
      <MenuItem key="4-2-1">inn</MenuItem>
      <SubMenu title={<span class="submenu-title-wrapper">sub menu 4</span>} key="4-2-2">
        <MenuItem key="4-2-2-1">inner inner</MenuItem>
        <MenuItem key="4-2-2-2">inner inner2</MenuItem>
      </SubMenu>
      <SubMenu title={<span class="submenu-title-wrapper">sub menu 3</span>} key="4-2-3">
        <MenuItem key="4-2-3-1">inner inner</MenuItem>
        <MenuItem key="4-2-3-2">inner inner2</MenuItem>
      </SubMenu>
    </SubMenu>
  </SubMenu>
);

function onOpenChange(value) {
  console.log('onOpenChange', value);
}

const children1 = [
  <SubMenu title={<span class="submenu-title-wrapper">sub menu</span>} key="1">
    <MenuItem key="1-1">0-1</MenuItem>
    <MenuItem key="1-2">0-2</MenuItem>
  </SubMenu>,
  nestSubMenu,
  <MenuItem key="2">1</MenuItem>,
  <MenuItem key="3">outer</MenuItem>,
  <MenuItem key="5" disabled>
    disabled
  </MenuItem>,
  <MenuItem key="6">outer3</MenuItem>,
];

const children2 = [
  <SubMenu title={<span class="submenu-title-wrapper">sub menu</span>} key="1">
    <MenuItem key="1-1">0-1</MenuItem>
    <MenuItem key="1-2">0-2</MenuItem>
  </SubMenu>,
  <MenuItem key="2">1</MenuItem>,
  <MenuItem key="3">outer</MenuItem>,
];

const customizeIndicator = <span>Add More Items</span>;

interface CommonMenuProps extends MenuProps {
  triggerSubMenuAction?: MenuProps['triggerSubMenuAction'];
  updateChildrenAndOverflowedIndicator?: boolean;
}

interface CommonMenuState {
  children: any;
  overflowedIndicator: any;
}

export const CommonMenu = defineComponent((props: CommonMenuProps) => {
  const state = reactive<CommonMenuState>({
    children: children1,
    overflowedIndicator: undefined,
  });

  const toggleChildren = () => {
    state.children = state.children === children1 ? children2 : children1;
  };

  const toggleOverflowedIndicator = () => {
    state.overflowedIndicator = state.overflowedIndicator === undefined ? customizeIndicator : undefined;
  };

  return () => (
    <div>
      {props.updateChildrenAndOverflowedIndicator && (
        <div>
          <button type="button" onClick={toggleChildren}>
            toggle children
          </button>
          <button type="button" onClick={toggleOverflowedIndicator}>
            toggle overflowedIndicator
          </button>
        </div>
      )}
      <Menu
        onClick={handleClick}
        triggerSubMenuAction={props.triggerSubMenuAction}
        onOpenChange={onOpenChange}
        selectedKeys={['3']}
        overflowedIndicator={state.overflowedIndicator}
        {...props}
        items={[
          {
            type: 'submenu',
            label: 'sub menu',
            key: '1',
            children: [
              {
                key: '1-1',
                label: '0-1',
              },
              {
                key: '1-2',
                label: '0-2',
              },
            ],
          },
          {
            type: 'submenu',
            label: 'offset sub menu 2',
            key: '4',
            popupOffset: [10, 15],
            children: [
              {
                key: '4-1',
                label: 'inner inner',
              },
              {
                type: 'divider',
              },
              {
                type: 'submenu',
                key: '4-2',
                label: 'sub menu 1',
                children: [
                  {
                    type: 'submenu',
                    key: '4-2-0',
                    label: 'sub 4-2-0',
                    children: [
                      {
                        key: '4-2-0-1',
                        label: 'inner inner',
                      },
                      {
                        key: '4-2-0-2',
                        label: 'inner inner2',
                      },
                    ],
                  },
                  {
                    key: '4-2-1',
                    label: 'inn',
                  },
                  {
                    type: 'submenu',
                    key: '4-2-2',
                    label: 'sub menu 4',
                    children: [
                      {
                        key: '4-2-2-1',
                        label: 'inner inner',
                      },
                      {
                        key: '4-2-2-2',
                        label: 'inner inner2',
                      },
                    ],
                  },
                  {
                    type: 'submenu',
                    key: '4-2-3',
                    label: 'sub menu 3',
                    children: [
                      {
                        key: '4-2-3-1',
                        label: 'inner inner',
                      },
                      {
                        key: '4-2-3-2',
                        label: 'inner inner2',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]}
      ></Menu>
    </div>
  );
});

const Demo = defineComponent(() => {
  const HorizontalMenu = () => (
    <CommonMenu
      mode="horizontal"
      // use openTransition for antd
      defaultMotions={motionMap}
    />
  );

  const horizontalMenu2 = (
    <CommonMenu
      mode="horizontal"
      // use openTransition for antd
      defaultMotions={motionMap}
      triggerSubMenuAction="click"
      updateChildrenAndOverflowedIndicator
    />
  );

  const verticalMenu = <CommonMenu mode="vertical" defaultMotions={motionMap} />;

  const inlineMenu = <CommonMenu mode="inline" defaultOpenKeys={['1']} motion={inlineMotion} />;

  return () => (
    <div style={{ margin: '20px' }}>
      <h2>antd menu</h2>
      <div>
        <h3>horizontal</h3>

        <div style={{ margin: '20px' }}>
          <HorizontalMenu></HorizontalMenu>
        </div>
        <h3>horizontal and click</h3>

        <div style={{ margin: '20px' }}>{horizontalMenu2}</div>
        <h3>vertical</h3>

        <div style={{ margin: '20px', width: '200px' }}>{verticalMenu}</div>
        <h3>inline</h3>

        <div style={{ margin: '20px', width: '400px' }}>{inlineMenu}</div>
      </div>
    </div>
  );
});

export default Demo;
/* eslint-enable */
