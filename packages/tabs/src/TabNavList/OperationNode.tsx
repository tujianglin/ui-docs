import Dropdown from '@vc-com/dropdown';
import Menu, { MenuItem } from '@vc-com/menu';
import KeyCode from '@vc-com/util/lib/KeyCode';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch, type CSSProperties } from 'vue';
import { useComposeRef } from '../../../util/src/ref';
import type { EditableConfig, MoreProps, Tab, TabsLocale } from '../interface';
import type { SemanticName } from '../Tabs';
import { getRemovable } from '../util';
import AddButton from './AddButton';

export interface OperationNodeProps {
  prefixCls: string;
  class?: string;
  style?: CSSProperties;
  id: string;
  tabs: Tab[];
  rtl: boolean;
  tabBarGutter?: number;
  activeKey: string;
  mobile: boolean;
  more?: MoreProps;
  editable?: EditableConfig;
  locale?: TabsLocale;
  removeAriaLabel?: string;
  onTabClick: (key: string, e) => void;
  tabMoving?: boolean;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  popupClassName?: string;
  popupStyle?: CSSProperties;
  styles?: Pick<Partial<Record<SemanticName, CSSProperties>>, 'remove'>;
  classNames?: Pick<Partial<Record<SemanticName, string>>, 'remove'>;
}

const OperationNode = defineComponent(
  ({
    prefixCls,
    id,
    tabs,
    locale,
    mobile,
    more: moreProps = {},
    style,
    class: className,
    editable,
    tabBarGutter,
    rtl,
    removeAriaLabel,
    onTabClick,
    getPopupContainer,
    popupClassName,
    popupStyle,
    classNames,
    styles,
  }: OperationNodeProps) => {
    // ======================== Dropdown ========================
    const open = ref(false);
    const selectedKey = ref<string>(null);

    const moreIcon = computed(() => moreProps?.icon || 'More');

    const popupId = computed(() => `${id}-more-popup`);
    const dropdownPrefix = computed(() => `${prefixCls}-dropdown`);
    const selectedItemId = computed(() => (selectedKey.value !== null ? `${popupId.value}-${selectedKey.value}` : null));

    const dropdownAriaLabel = computed(() => locale?.dropdownAriaLabel);

    function onRemoveTab(event, key: string) {
      event.preventDefault();
      event.stopPropagation();
      editable.onEdit('remove', { key, event });
    }

    function selectOffset(offset: -1 | 1) {
      const enabledTabs = tabs.filter((tab) => !tab.disabled);
      let selectedIndex = enabledTabs.findIndex((tab) => tab.key === selectedKey.value) || 0;
      const len = enabledTabs.length;

      for (let i = 0; i < len; i += 1) {
        selectedIndex = (selectedIndex + offset + len) % len;
        const tab = enabledTabs[selectedIndex];
        if (!tab.disabled) {
          selectedKey.value = tab.key;
          return;
        }
      }
    }

    function onKeyDown(e) {
      const { which } = e;

      if (!open.value) {
        if ([KeyCode.DOWN, KeyCode.SPACE, KeyCode.ENTER].includes(which)) {
          open.value = true;
          e.preventDefault();
        }
        return;
      }

      switch (which) {
        case KeyCode.UP:
          selectOffset(-1);
          e.preventDefault();
          break;
        case KeyCode.DOWN:
          selectOffset(1);
          e.preventDefault();
          break;
        case KeyCode.ESC:
          open.value = false;
          break;
        case KeyCode.SPACE:
        case KeyCode.ENTER:
          if (selectedKey.value !== null) {
            onTabClick(selectedKey.value, e);
          }
          break;
      }
    }

    // ========================= Effect =========================
    watch(
      selectedKey,
      () => {
        // We use query element here to avoid React strict warning
        const ele = document.getElementById(selectedItemId.value);
        if (ele && ele.scrollIntoView) {
          ele.scrollIntoView(false);
        }
      },
      { immediate: true },
    );

    watch(
      open,
      () => {
        if (!open.value) {
          selectedKey.value = null;
        }
      },
      { immediate: true },
    );

    // ========================= Render =========================
    const moreStyle = computed(() => {
      const result: CSSProperties = {
        marginInlineStart: tabBarGutter,
      };

      if (!tabs.length) {
        result.visibility = 'hidden';
        result.order = 1;
      }
      return result;
    });

    const overlayClassName = computed(() => clsx(popupClassName, { [`${dropdownPrefix.value}-rtl`]: rtl }));

    return () => {
      const menu = (
        <Menu
          onClick={({ key, domEvent }) => {
            onTabClick(key, domEvent);
            open.value = false;
          }}
          prefixCls={`${dropdownPrefix.value}-menu`}
          id={popupId.value}
          tabindex={-1}
          role="listbox"
          aria-activedescendant={selectedItemId.value}
          selectedKeys={[selectedKey.value]}
          aria-label={dropdownAriaLabel.value !== undefined ? dropdownAriaLabel.value : 'expanded dropdown'}
        >
          {tabs.map((tab) => {
            const { closable, disabled, closeIcon, key, label } = tab;
            const removable = getRemovable(closable, closeIcon, editable, disabled);
            return (
              <MenuItem
                key={key}
                id={`${popupId}-${key}`}
                role="option"
                aria-controls={id && `${id}-panel-${key}`}
                disabled={disabled}
              >
                {/* {tab.tab} */}
                <span>{label}</span>
                <button
                  v-if={removable}
                  type="button"
                  aria-label={removeAriaLabel || 'remove'}
                  tabindex={0}
                  class={clsx(`${dropdownPrefix.value}-menu-item-remove`, classNames?.remove)}
                  style={styles?.remove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTab(e, key);
                  }}
                >
                  {closeIcon || editable.removeIcon || '×'}
                </button>
              </MenuItem>
            );
          })}
        </Menu>
      );

      const moreNode = (
        <Dropdown
          v-if={!mobile}
          prefixCls={dropdownPrefix.value}
          overlay={menu}
          visible={tabs.length ? open.value : false}
          onVisibleChange={(v) => (open.value = v)}
          overlayClassName={overlayClassName.value}
          overlayStyle={popupStyle}
          mouseEnterDelay={0.1}
          mouseLeaveDelay={0.1}
          getPopupContainer={getPopupContainer}
          {...moreProps}
        >
          <button
            type="button"
            class={`${prefixCls}-nav-more`}
            style={moreStyle.value}
            aria-haspopup="listbox"
            aria-controls={popupId.value}
            id={`${id}-more`}
            aria-expanded={open.value}
            onKeydown={onKeyDown}
          >
            {moreIcon.value}
          </button>
        </Dropdown>
      );

      return (
        <div class={clsx(`${prefixCls}-nav-operations`, className)} style={style} ref={useComposeRef()}>
          {moreNode}
          <AddButton prefixCls={prefixCls} locale={locale} editable={editable} />
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default OperationNode;
