import { reactiveComputed } from '@vueuse/core';
import { toRefs, type ComputedRef, type Ref } from 'vue';
import type { ActionType } from '../interface';

type InternalActionType = ActionType | 'touch';

type ActionTypes = InternalActionType | InternalActionType[];

function toArray<T>(val?: T | T[]) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}

export default function useAction(
  action: ComputedRef<ActionTypes>,
  showAction?: ComputedRef<ActionTypes>,
  hideAction?: ComputedRef<ActionTypes>,
): [showAction: Ref<Set<InternalActionType>>, hideAction: Ref<Set<InternalActionType>>] {
  const { showActionSet, hideActionSet } = toRefs(
    reactiveComputed(() => {
      const mergedShowAction = toArray(showAction.value ?? action.value);
      const mergedHideAction = toArray(hideAction.value ?? action.value);

      const showActionSet = new Set(mergedShowAction);
      const hideActionSet = new Set(mergedHideAction);

      if (showActionSet.has('hover') && !showActionSet.has('click')) {
        showActionSet.add('touch');
      }

      if (hideActionSet.has('hover') && !hideActionSet.has('click')) {
        hideActionSet.add('touch');
      }

      return { showActionSet, hideActionSet };
    }),
  );
  return [showActionSet, hideActionSet] as const;
}
