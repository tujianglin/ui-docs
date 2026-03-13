import Trigger from '@vc-com/trigger';
import { computed, defineComponent, ref, type CSSProperties } from 'vue';
import DropdownMenu from './DropdownMenu';
import type { DataDrivenOptionProps, Direction, Placement } from './Mentions';

const BUILT_IN_PLACEMENTS = {
  bottomRight: {
    points: ['tl', 'br'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  bottomLeft: {
    points: ['tr', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  topRight: {
    points: ['bl', 'tr'],
    offset: [0, -4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  topLeft: {
    points: ['br', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
};

interface KeywordTriggerProps {
  loading?: boolean;
  options: DataDrivenOptionProps[];
  prefixCls?: string;
  placement?: Placement;
  direction?: Direction;
  visible?: boolean;
  transitionName?: string;
  getPopupContainer?: () => HTMLElement;
  popupClassName?: string;
  popupStyle?: CSSProperties;
}

const KeywordTrigger = defineComponent(
  ({
    prefixCls,
    options,
    visible,
    transitionName,
    getPopupContainer,
    popupClassName,
    popupStyle,
    direction,
    placement,
  }: KeywordTriggerProps) => {
    const dropdownPrefix = computed(() => `${prefixCls}-dropdown`);
    const opened = ref(false);

    const dropdownPlacement = computed(() => {
      let popupPlacement;
      if (direction === 'rtl') {
        popupPlacement = placement === 'top' ? 'topLeft' : 'bottomLeft';
      } else {
        popupPlacement = placement === 'top' ? 'topRight' : 'bottomRight';
      }
      return popupPlacement;
    });

    return () => (
      <Trigger
        prefixCls={dropdownPrefix.value}
        popupVisible={visible}
        popup={<DropdownMenu prefixCls={dropdownPrefix.value} options={options} opened={opened.value} />}
        popupPlacement={dropdownPlacement.value}
        popupMotion={{ motionName: transitionName }}
        builtinPlacements={BUILT_IN_PLACEMENTS}
        getPopupContainer={getPopupContainer}
        popupClassName={popupClassName}
        popupStyle={popupStyle}
        afterOpenChange={(e) => (opened.value = e)}
      >
        <slot></slot>
      </Trigger>
    );
  },
);

export default KeywordTrigger;
