import Menu, { MenuItem, type MenuRef } from '@vc-com/menu';
import { getDOM } from '@vc-com/util/lib/Dom/findDOMNode';
import { computed, defineComponent, watch } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { DataDrivenOptionProps } from './Mentions';
import { useMentionsContextInject } from './MentionsContext';

export interface DropdownMenuProps {
  prefixCls?: string;
  options: DataDrivenOptionProps[];
  opened: boolean;
}

/**
 * We only use Menu to display the candidate.
 * The focus is controlled by textarea to make accessibility easy.
 */
const DropdownMenu = defineComponent(
  ({ prefixCls, options, opened }: DropdownMenuProps) => {
    // @ts-ignore
    const { notFoundContent, activeIndex, setActiveIndex, selectOption, onFocus, onBlur, onScroll } =
      $(useMentionsContextInject());

    const activeOption = computed(() => options[activeIndex] || {});
    const menuRef = useRef<MenuRef>(null);

    let removeListListeners: VoidFunction | undefined;
    const bindListEvents = (list?: HTMLUListElement | null) => {
      if (removeListListeners) {
        removeListListeners();
        removeListListeners = undefined;
      }
      if (!list) {
        return;
      }
      const handleFocus = (e) => {
        onFocus?.(e);
      };
      const handleBlur = (e) => {
        onBlur?.(e);
      };
      const handleScroll = (e) => {
        onScroll?.(e);
      };

      list.addEventListener('focusin', handleFocus);
      list.addEventListener('focusout', handleBlur);
      list.addEventListener('scroll', handleScroll);

      removeListListeners = () => {
        list.removeEventListener('focusin', handleFocus);
        list.removeEventListener('focusout', handleBlur);
        list.removeEventListener('scroll', handleScroll);
      };
    };

    watch(
      () => menuRef.value?.list,
      (list, _, onCleanup) => {
        if (list) {
          list = getDOM(list) as any;
        }
        bindListEvents(list || null);
        onCleanup(() => {
          removeListListeners?.();
          removeListListeners = undefined;
        });
      },
      {
        immediate: true,
        flush: 'post',
      },
    );

    // Monitor the changes in ActiveIndex and scroll to the visible area if there are any changes
    watch([() => activeIndex, () => activeOption.value.key, () => opened], () => {
      if (activeIndex === -1 || !menuRef.value || !opened) {
        return;
      }

      const activeItem = menuRef.value?.findItem?.({ key: activeOption.value.key });

      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
        });
      }
    });
    return () => (
      <Menu
        ref={menuRef}
        prefixCls={`${prefixCls}-menu`}
        activeKey={activeOption.value.key}
        onSelect={({ key }) => {
          const option = options.find(({ key: optionKey }) => optionKey === key);
          selectOption(option);
        }}
      >
        {options.map((option, index) => {
          const { key, disabled, class: className, style, label } = option;
          return (
            <MenuItem
              key={key}
              disabled={disabled}
              class={className}
              style={style}
              onMouseenter={() => {
                if (!disabled) {
                  setActiveIndex(index);
                }
              }}
            >
              {label}
            </MenuItem>
          );
        })}

        <MenuItem v-if={!options.length} disabled>
          {/* @ts-ignore */}
          {notFoundContent}
        </MenuItem>
      </Menu>
    );
  },
  { inheritAttrs: false },
);

export default DropdownMenu;
