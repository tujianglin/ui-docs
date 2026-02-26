/**
 * Handle virtual list of the TreeNodes.
 */

import { getId, useId } from '@vc-com/util/lib/hooks/useId';
import VirtualList, { type ListRef, type ScrollTo } from '@vc-com/virtual-list';
import { computed, defineComponent, nextTick, ref, toRaw, watch, type CSSProperties } from 'vue';
import { useRef, type FocusEventHandler, type KeyboardEventHandler } from 'vue-jsx-vapor';
import MotionTreeNode from './MotionTreeNode';
import type { BasicDataNode, DataEntity, DataNode, FlattenNode, Key, KeyEntities } from './interface';
import { findExpandedKeys, getExpandRange } from './utils/diffUtil';
import { getKey, getTreeNodeProps } from './utils/treeUtil';

export const MOTION_KEY = `RC_TREE_MOTION_${Math.random()}`;

const MotionNode: DataNode = {
  key: MOTION_KEY,
};

export const MotionEntity: DataEntity = {
  key: MOTION_KEY,
  level: 0,
  index: 0,
  pos: '0',
  node: MotionNode,
  nodes: [MotionNode],
};

const MotionFlattenData: FlattenNode = {
  parent: null,
  children: [],
  pos: MotionEntity.pos,
  data: MotionNode,
  title: null,
  key: MOTION_KEY,
  /** Hold empty list here since we do not use it */
  isStart: [],
  isEnd: [],
};

export interface NodeListRef {
  scrollTo: ScrollTo;
  getIndentWidth: () => number;
}

interface NodeListProps<TreeDataType extends BasicDataNode = any> {
  prefixCls: string;
  style: CSSProperties;
  data: FlattenNode<TreeDataType>[];
  motion: any;
  focusable?: boolean;
  activeItem: FlattenNode<TreeDataType>;
  tabIndex: number;
  checkable?: boolean;
  selectable?: boolean;
  disabled?: boolean;

  expandedKeys: Key[];
  selectedKeys: Key[];
  checkedKeys: Key[];
  loadedKeys: Key[];
  loadingKeys: Key[];
  halfCheckedKeys: Key[];
  keyEntities: KeyEntities;

  dragging: boolean;
  dragOverNodeKey: Key;
  dropPosition: number;

  // Virtual list
  height: number;
  itemHeight: number;
  virtual?: boolean;
  scrollWidth?: number;

  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onFocus?: FocusEventHandler<HTMLDivElement>;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  onActiveChange: (key: Key) => void;

  onListChangeStart: () => void;
  onListChangeEnd: () => void;
}

/**
 * We only need get visible content items to play the animation.
 */
export function getMinimumRangeTransitionRange(list: FlattenNode[], virtual: boolean, height: number, itemHeight: number) {
  if (virtual === false || !height) {
    return list;
  }

  return list.slice(0, Math.ceil(height / itemHeight) + 1);
}

function itemKey(item: FlattenNode) {
  const { key, pos } = item;
  return getKey(key, pos);
}

const NodeList = defineComponent(
  ({
    prefixCls,
    data,
    selectable: _,
    checkable: _1,
    expandedKeys,
    selectedKeys,
    checkedKeys,
    loadedKeys,
    loadingKeys,
    halfCheckedKeys,
    keyEntities,
    disabled,

    dragging,
    dragOverNodeKey,
    dropPosition,
    motion,

    height,
    itemHeight,
    virtual,
    scrollWidth,

    focusable,
    activeItem,
    tabIndex,

    onKeyDown,
    onFocus,
    onBlur,
    onActiveChange,

    onListChangeStart,
    onListChangeEnd,

    ...domProps
  }: NodeListProps) => {
    const treeId = useId();

    // =============================== Ref ================================
    const listRef = useRef<ListRef>(null);
    const indentMeasurerRef = useRef<HTMLDivElement>(null);
    defineExpose({
      scrollTo: (scroll) => {
        listRef.value.scrollTo(scroll);
      },
      getIndentWidth: () => indentMeasurerRef.value.offsetWidth,
    });

    // ============================== Motion ==============================
    const prevExpandedKeys = ref(expandedKeys);
    const prevData = ref(data);
    const transitionData = ref(data);
    const transitionRange = ref([]);
    const motionType = ref<'show' | 'hide' | null>(null);

    // When motion end but data change, this will makes data back to previous one
    const dataRef = ref(data);
    watch(
      () => data,
      (val) => {
        dataRef.value = val;
      },
      { immediate: true, deep: true },
    );

    function onMotionEnd() {
      const latestData = dataRef.value;

      prevData.value = latestData;
      transitionData.value = latestData;
      transitionRange.value = [];
      motionType.value = null;

      onListChangeEnd();
    }

    // Do animation if expanded keys changed
    // layoutEffect here to avoid blink of node removing
    watch(
      () => [expandedKeys, data],
      () => {
        nextTick(() => {
          prevExpandedKeys.value = expandedKeys;
        });

        const diffExpanded = findExpandedKeys(prevExpandedKeys.value, expandedKeys);

        if (diffExpanded.key !== null) {
          if (diffExpanded.add) {
            const keyIndex = prevData.value.findIndex(({ key }) => key === diffExpanded.key);

            const rangeNodes = getMinimumRangeTransitionRange(
              // @ts-ignore
              getExpandRange(prevData.value, data, diffExpanded.key),
              virtual,
              height,
              itemHeight,
            );

            const newTransitionData: FlattenNode[] = prevData.value.slice();
            newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);

            transitionData.value = newTransitionData;
            transitionRange.value = rangeNodes;
            motionType.value = 'show';
          } else {
            const keyIndex = data.findIndex(({ key }) => key === diffExpanded.key);

            const rangeNodes = getMinimumRangeTransitionRange(
              getExpandRange(data, prevData.value, diffExpanded.key),
              virtual,
              height,
              itemHeight,
            );

            const newTransitionData: FlattenNode[] = data.slice();
            newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);
            transitionData.value = newTransitionData;
            transitionRange.value = rangeNodes;
            motionType.value = 'hide';
          }
        } else if (toRaw(prevData.value) !== toRaw(data)) {
          // If whole data changed, we just refresh the list
          prevData.value = data;
          transitionData.value = data;
        }
      },
      { deep: true, flush: 'post' },
    );

    // We should clean up motion if is changed by dragging
    watch(
      () => dragging,
      () => {
        if (!dragging) {
          onMotionEnd();
        }
      },
      { immediate: true },
    );

    // @ts-ignore
    const mergedData = computed(() => (motion ? transitionData.value : data));

    const treeNodeRequiredProps = computed(() => ({
      expandedKeys,
      selectedKeys,
      loadedKeys,
      loadingKeys,
      checkedKeys,
      halfCheckedKeys,
      dragOverNodeKey,
      dropPosition,
      keyEntities,
    }));

    const RenderTreeNode = ({ treeNode }: { treeNode: FlattenNode }) => {
      const {
        pos,
        data: { ...restProps },
        title,
        key,
        isStart,
        isEnd,
      } = treeNode;
      const mergedKey = getKey(key, pos);
      delete restProps.key;
      delete restProps.children;
      const treeNodeProps = getTreeNodeProps(mergedKey, treeNodeRequiredProps.value);
      return (
        <MotionTreeNode
          {...(restProps as Omit<typeof restProps, 'children'>)}
          {...treeNodeProps}
          title={title}
          active={!!activeItem && key === activeItem.key}
          pos={pos}
          data={treeNode.data}
          isStart={isStart}
          isEnd={isEnd}
          motion={motion}
          motionNodes={key === MOTION_KEY ? transitionRange.value : null}
          motionType={motionType.value}
          onMotionStart={onListChangeStart}
          onMotionEnd={onMotionEnd}
          treeNodeRequiredProps={treeNodeRequiredProps.value}
          treeId={treeId.value}
          onMouseMove={() => {
            onActiveChange?.(null);
          }}
        />
      );
    };

    return () => (
      <>
        <div
          class={`${prefixCls}-treenode`}
          aria-hidden
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            visibility: 'hidden',
            height: 0,
            overflow: 'hidden',
            border: 0,
            padding: 0,
          }}
        >
          <div class={`${prefixCls}-indent`}>
            <div ref={indentMeasurerRef} class={`${prefixCls}-indent-unit`} />
          </div>
        </div>
        <VirtualList
          {...domProps}
          data={mergedData.value}
          itemKey={itemKey}
          height={height}
          fullHeight={false}
          virtual={virtual}
          itemHeight={itemHeight}
          scrollWidth={scrollWidth}
          prefixCls={`${prefixCls}-list`}
          ref={listRef}
          role="tree"
          tabindex={focusable !== false && !disabled ? tabIndex : undefined}
          aria-activedescendant={activeItem ? getId(treeId.value, activeItem.key) : undefined}
          onKeydown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onVisibleChange={(originList) => {
            // The best match is using `fullList` - `originList` = `restList`
            // and check the `restList` to see if has the MOTION_KEY node
            // but this will cause performance issue for long list compare
            // we just check `originList` and repeat trigger `onMotionEnd`
            if (originList.every((item) => itemKey(item) !== MOTION_KEY)) {
              onMotionEnd();
            }
          }}
        >
          {({ item: treeNode }) => <RenderTreeNode treeNode={treeNode}></RenderTreeNode>}
        </VirtualList>
      </>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'NodeList' : undefined },
);

export default NodeList;
