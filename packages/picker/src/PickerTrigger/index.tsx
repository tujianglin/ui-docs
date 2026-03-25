import Trigger from '@vc-com/trigger';
import type { AlignType, BuildInPlacements } from '@vc-com/trigger/interface';
import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import type { RenderNode } from '../../../util/src/types';
import { usePickerContextInject } from '../PickerInput/context';
import { getRealPlacement } from '../utils/uiUtil';

const BUILT_IN_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  bottomRight: {
    points: ['tr', 'br'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
  },
  topRight: {
    points: ['br', 'tr'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
  },
};

export type PickerTriggerProps = {
  popupElement: RenderNode;
  popupStyle?: CSSProperties;
  transitionName?: string;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  popupAlign?: AlignType;
  range?: boolean;

  // Placement
  popupClassName?: string;
  placement?: string;
  builtinPlacements?: BuildInPlacements;
  direction?: 'ltr' | 'rtl';

  // Visible
  visible: boolean;
  onClose: () => void;
};

const PickerTrigger = defineComponent(
  ({
    popupElement,
    popupStyle,
    popupClassName,
    popupAlign,
    transitionName,
    getPopupContainer,
    range,
    placement,
    builtinPlacements = BUILT_IN_PLACEMENTS,
    direction,

    // Visible
    visible,
    onClose,
  }: PickerTriggerProps) => {
    const { prefixCls } = $(usePickerContextInject());
    const dropdownPrefixCls = computed(() => `${prefixCls}-dropdown`);

    const realPlacement = computed(() => getRealPlacement(placement, direction === 'rtl'));

    return () => (
      <Trigger
        showAction={[]}
        hideAction={['click']}
        popupPlacement={realPlacement.value}
        builtinPlacements={builtinPlacements}
        prefixCls={dropdownPrefixCls.value}
        popupMotion={{ motionName: transitionName }}
        popup={popupElement}
        popupAlign={popupAlign}
        popupVisible={visible}
        popupClassName={clsx(popupClassName, {
          [`${dropdownPrefixCls.value}-range`]: range,
          [`${dropdownPrefixCls.value}-rtl`]: direction === 'rtl',
        })}
        popupStyle={popupStyle}
        stretch="minWidth"
        getPopupContainer={getPopupContainer}
        onOpenChange={(nextVisible) => {
          if (!nextVisible) {
            onClose();
          }
        }}
      >
        <slot></slot>
      </Trigger>
    );
  },
);

export default PickerTrigger;
