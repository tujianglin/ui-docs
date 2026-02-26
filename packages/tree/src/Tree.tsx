// TODO: Fully accessibility support
// Reference: https://www.w3.org/WAI/ARIA/apg/patterns/treeview

import pickAttrs from '@vc-com/util/lib/pickAttrs';
import type { VueNode } from '@vc-com/util/lib/types';
import { warning } from '@vc-com/util/lib/warning';
import clsx from 'clsx';
import {
  defineComponent,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  watchEffect,
  type CSSProperties,
} from 'vue';
import {
  useFullProps,
  useRef,
  type FocusEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type UIEventHandler,
} from 'vue-jsx-vapor';
import {
  TreeContextProvider,
  type NodeDragEventParams,
  type NodeMouseEventHandler,
  type NodeMouseEventParams,
} from './contextTypes';
import type { DropIndicatorProps } from './DropIndicator';
import DropIndicator from './DropIndicator';
import type {
  BasicDataNode,
  DataNode,
  Direction,
  EventDataNode,
  FieldNames,
  FlattenNode,
  IconType,
  Key,
  KeyEntities,
  SafeKey,
  TreeNodeProps,
} from './interface';
import NodeList, { MOTION_KEY, MotionEntity, type NodeListRef } from './NodeList';
import {
  arrAdd,
  arrDel,
  calcDropPosition,
  calcSelectedKeys,
  conductExpandParent,
  getDragChildrenKeys,
  parseCheckedKeys,
  posToArr,
} from './util';
import { conductCheck } from './utils/conductUtil';
import getEntity from './utils/keyUtil';
import {
  convertDataToEntities,
  convertNodePropsToEventData,
  fillFieldNames,
  flattenTreeData,
  getTreeNodeProps,
  isLeafNode,
  warningWithoutKey,
} from './utils/treeUtil';

const MAX_RETRY_TIMES = 10;

export interface CheckInfo<TreeDataType extends BasicDataNode = DataNode> {
  event: 'check';
  node: EventDataNode<TreeDataType>;
  checked: boolean;
  nativeEvent: MouseEvent;
  checkedNodes: TreeDataType[];
  checkedNodesPositions?: { node: TreeDataType; pos: string }[];
  halfCheckedKeys?: Key[];
}

export interface AllowDropOptions<TreeDataType extends BasicDataNode = DataNode> {
  dragNode: TreeDataType;
  dropNode: TreeDataType;
  dropPosition: -1 | 0 | 1;
}
export type AllowDrop<TreeDataType extends BasicDataNode = DataNode> = (options: AllowDropOptions<TreeDataType>) => boolean;

export type DraggableFn = (node: DataNode) => boolean;
export type DraggableConfig = {
  icon?: VueNode | false;
  nodeDraggable?: DraggableFn;
};

export type ExpandAction = false | 'click' | 'doubleClick';

export type SemanticName = 'itemIcon' | 'item' | 'itemTitle';
export interface TreeProps<TreeDataType extends BasicDataNode = DataNode> {
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  classNames?: Partial<Record<SemanticName, string>>;
  focusable?: boolean;
  activeKey?: Key | null;
  tabIndex?: number;
  children?: VueNode;
  treeData?: TreeDataType[]; // Generate treeNode by children
  fieldNames?: FieldNames;
  showLine?: boolean;
  showIcon?: boolean;
  icon?: IconType;
  selectable?: boolean;
  expandAction?: ExpandAction;
  disabled?: boolean;
  multiple?: boolean;
  checkable?: boolean | VueNode;
  checkStrictly?: boolean;
  draggable?: DraggableFn | boolean | DraggableConfig;
  defaultExpandParent?: boolean;
  autoExpandParent?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: Key[];
  expandedKeys?: Key[];
  defaultCheckedKeys?: Key[];
  checkedKeys?: Key[] | { checked: Key[]; halfChecked: Key[] };
  defaultSelectedKeys?: Key[];
  selectedKeys?: Key[];
  allowDrop?: AllowDrop<TreeDataType>;
  titleRender?: (node: TreeDataType) => VueNode;
  dropIndicatorRender?: (props: DropIndicatorProps) => VueNode;
  onFocus?: FocusEventHandler<HTMLDivElement>;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onClick?: NodeMouseEventHandler<TreeDataType>;
  onDoubleClick?: NodeMouseEventHandler<TreeDataType>;
  onScroll?: UIEventHandler<HTMLElement>;
  onExpand?: (
    expandedKeys: Key[],
    info: {
      node: EventDataNode<TreeDataType>;
      expanded: boolean;
      nativeEvent: MouseEvent;
    },
  ) => void;
  onCheck?: (checked: { checked: Key[]; halfChecked: Key[] } | Key[], info: CheckInfo<TreeDataType>) => void;
  onSelect?: (
    selectedKeys: Key[],
    info: {
      event: 'select';
      selected: boolean;
      node: EventDataNode<TreeDataType>;
      selectedNodes: TreeDataType[];
      nativeEvent: MouseEvent;
    },
  ) => void;
  onLoad?: (
    loadedKeys: Key[],
    info: {
      event: 'load';
      node: EventDataNode<TreeDataType>;
    },
  ) => void;
  loadData?: (treeNode: EventDataNode<TreeDataType>) => Promise<any>;
  loadedKeys?: Key[];
  onMouseEnter?: (info: NodeMouseEventParams<TreeDataType>) => void;
  onMouseLeave?: (info: NodeMouseEventParams<TreeDataType>) => void;
  onRightClick?: (info: { event: MouseEvent; node: EventDataNode<TreeDataType> }) => void;
  onDragStart?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDragEnter?: (info: NodeDragEventParams<TreeDataType> & { expandedKeys: Key[] }) => void;
  onDragOver?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDragLeave?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDragEnd?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDrop?: (
    info: NodeDragEventParams<TreeDataType> & {
      dragNode: EventDataNode<TreeDataType>;
      dragNodesKeys: Key[];
      dropPosition: number;
      dropToGap: boolean;
    },
  ) => void;
  /**
   * Used for `rc-tree-select` only.
   * Do not use in your production code directly since this will be refactor.
   */
  onActiveChange?: (key: Key) => void;
  filterTreeNode?: (treeNode: EventDataNode<TreeDataType>) => boolean;
  motion?: any;
  switcherIcon?: IconType;

  // Virtual List
  height?: number;
  itemHeight?: number;
  scrollWidth?: number;
  itemScrollOffset?: number;
  virtual?: boolean;

  // direction for drag logic
  direction?: Direction;

  rootClassName?: string;
  rootStyle?: CSSProperties;
}

interface TreeState<TreeDataType extends BasicDataNode = DataNode> {
  keyEntities: KeyEntities<TreeDataType>;

  indent: number | null;

  selectedKeys: Key[];
  checkedKeys: Key[];
  halfCheckedKeys: Key[];
  loadedKeys: Key[];
  loadingKeys: Key[];
  expandedKeys: Key[];

  draggingNodeKey: Key;
  dragChildrenKeys: Key[];

  // for details see comment in Tree.state
  dropPosition: -1 | 0 | 1 | null;
  dropLevelOffset: number | null;
  dropContainerKey: Key | null;
  dropTargetKey: Key | null;
  dropTargetPos: string | null;
  dropAllowed: boolean;
  dragOverNodeKey: Key | null;

  treeData: TreeDataType[];
  flattenNodes: FlattenNode<TreeDataType>[];

  activeKey: Key | null;

  // Record if list is changing
  listChanging: boolean;

  prevProps: TreeProps;

  fieldNames: FieldNames;
}

const Tree = defineComponent(
  ({
    prefixCls = 'rc-tree',
    showLine = false,
    showIcon = true,
    selectable = true,
    multiple = false,
    checkable = false,
    disabled = false,
    checkStrictly = false,
    draggable = false,
    defaultExpandParent = true,
    autoExpandParent = false,
    defaultExpandAll = false,
    defaultExpandedKeys = [],
    defaultCheckedKeys = [],
    defaultSelectedKeys = [],
    dropIndicatorRender = DropIndicator as any,
    allowDrop = () => true,
    expandAction = false,
    activeKey,
    class: className,
    style,
    styles,
    classNames: treeClassNames,
    focusable,
    tabIndex = 0,
    icon,
    switcherIcon,
    motion,
    loadData,
    filterTreeNode,
    height,
    itemHeight,
    scrollWidth,
    virtual,
    titleRender,
    onContextMenu,
    onScroll,
    direction,
    rootClassName,
    rootStyle,
    fieldNames,
    loadedKeys,
    treeData,
    onExpand,
    onDragStart,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDragEnd,
    onDrop,
    onClick,
    onDoubleClick,
    onSelect,
    onCheck,
    onMouseEnter,
    onMouseLeave,
    onRightClick,
    onLoad,
  }: TreeProps) => {
    const props = useFullProps() as unknown as TreeProps;
    const destroyed = ref(false);

    const delayedDragEnterLogic = ref<Record<SafeKey, number>>();

    const loadingRetryTimes = ref<Record<SafeKey, number>>({});

    const state = reactive<TreeState>({
      keyEntities: {},

      indent: null,

      selectedKeys: [],
      checkedKeys: [],
      halfCheckedKeys: [],
      loadedKeys: [],
      loadingKeys: [],
      expandedKeys: [],

      draggingNodeKey: null,
      dragChildrenKeys: [],

      // dropTargetKey is the key of abstract-drop-node
      // the abstract-drop-node is the real drop node when drag and drop
      // not the DOM drag over node
      dropTargetKey: null,
      dropPosition: null, // the drop position of abstract-drop-node, inside 0, top -1, bottom 1
      dropContainerKey: null, // the container key of abstract-drop-node if dropPosition is -1 or 1
      dropLevelOffset: null, // the drop level offset of abstract-drag-over-node
      dropTargetPos: null, // the pos of abstract-drop-node
      dropAllowed: true, // if drop to abstract-drop-node is allowed
      // the abstract-drag-over-node
      // if mouse is on the bottom of top dom node or no the top of the bottom dom node
      // abstract-drag-over-node is the top node
      dragOverNodeKey: null,

      treeData: [],
      flattenNodes: [],

      activeKey: null,

      listChanging: false,

      prevProps: null,

      fieldNames: fillFieldNames(),
    });

    const dragStartMousePosition = ref(null);

    const dragNodeProps = ref<TreeNodeProps>(null);

    const currentMouseOverDroppableNodeKey = ref(null);

    const listRef = useRef<NodeListRef>();

    onMounted(() => {
      destroyed.value = false;
      onUpdated();
    });

    function onUpdated() {
      const { itemScrollOffset = 0 } = props;
      if (activeKey !== undefined && activeKey !== state.activeKey) {
        state.activeKey = activeKey;

        if (activeKey !== null) {
          scrollTo({ key: activeKey, offset: itemScrollOffset });
        }
      }
    }

    onBeforeUnmount(() => {
      window.removeEventListener('dragend', onWindowDragEnd);
      destroyed.value = true;
    });

    // fieldNames
    watchEffect(() => {
      state.fieldNames = fillFieldNames(fieldNames);
    });

    // Check if `treeData` or `children` changed and save into the state.
    watchEffect(() => {
      // Save flatten nodes info and convert `treeData` into keyEntities
      if (treeData) {
        // @ts-ignore
        state.treeData = treeData;
        const entitiesMap = convertDataToEntities(treeData, { fieldNames: state.fieldNames });
        state.keyEntities = {
          [MOTION_KEY]: MotionEntity,
          ...entitiesMap.keyEntities,
        };

        // Warning if treeNode not provide key
        if (process.env.NODE_ENV !== 'production') {
          warningWithoutKey(treeData, state.fieldNames);
        }
      }
    });

    // ================ expandedKeys =================
    let init = false; // 处理 defaultXxxx api, 仅仅首次有效
    watch(
      [() => defaultExpandedKeys, () => autoExpandParent, () => state.keyEntities],
      ([_n, newAutoExpandParent], [_o, oldAutoExpandParent]) => {
        if (init && newAutoExpandParent !== oldAutoExpandParent) {
          state.expandedKeys =
            autoExpandParent || (!init && defaultExpandParent)
              ? conductExpandParent(defaultExpandedKeys, state.keyEntities)
              : defaultExpandedKeys;
        } else if (!init && defaultExpandAll) {
          const cloneKeyEntities = { ...state.keyEntities };
          delete cloneKeyEntities[MOTION_KEY];

          // Only take the key who has the children to enhance the performance
          const nextExpandedKeys: Key[] = [];
          Object.keys(cloneKeyEntities).forEach((key) => {
            const entity = cloneKeyEntities[key];
            if (entity.children && entity.children.length) {
              nextExpandedKeys.push(entity.key);
            }
          });
          state.expandedKeys = nextExpandedKeys;
          console.log(nextExpandedKeys);
        } else if (!init && defaultExpandedKeys) {
          state.expandedKeys =
            autoExpandParent || defaultExpandParent
              ? conductExpandParent(defaultExpandedKeys, state.keyEntities)
              : defaultExpandedKeys;
        }
        init = true;
      },
      { immediate: true, deep: true },
    );

    // ================ flattenNodes =================
    watchEffect(() => {
      state.flattenNodes = flattenTreeData(state.treeData, state.expandedKeys, state.fieldNames);
    });

    // ================ selectedKeys =================
    watchEffect(() => {
      if (selectable) {
        if (defaultSelectedKeys !== undefined) {
          state.selectedKeys = calcSelectedKeys(defaultSelectedKeys, props);
        }
      }
    });

    // ================= checkedKeys =================
    watchEffect(() => {
      if (checkable) {
        let checkedKeyEntity;

        if (defaultCheckedKeys !== undefined) {
          checkedKeyEntity = parseCheckedKeys(defaultCheckedKeys) || {};
        } else if (state.treeData) {
          // If `treeData` changed, we also need check it
          checkedKeyEntity = parseCheckedKeys(defaultCheckedKeys) || {
            checkedKeys: state.checkedKeys,
            halfCheckedKeys: state.halfCheckedKeys,
          };
        }

        if (checkedKeyEntity) {
          let { checkedKeys: newCheckedKeys = [], halfCheckedKeys: newHalfCheckedKeys = [] } = checkedKeyEntity;

          if (!checkStrictly) {
            const conductKeys = conductCheck(newCheckedKeys, true, state.keyEntities);
            ({ checkedKeys: newCheckedKeys, halfCheckedKeys: newHalfCheckedKeys } = conductKeys);
          }
          state.checkedKeys = newCheckedKeys;
          state.halfCheckedKeys = newHalfCheckedKeys;
        }
      }
    });

    // ================= loadedKeys ==================
    watchEffect(() => {
      if (loadedKeys) {
        state.loadedKeys = loadedKeys;
      }
    });

    function onNodeDragStart(event, nodeProps) {
      const { expandedKeys, keyEntities } = state;
      const { eventKey } = nodeProps;

      dragNodeProps.value = nodeProps;
      dragStartMousePosition.value = {
        x: event.clientX,
        y: event.clientY,
      };

      const newExpandedKeys = arrDel(expandedKeys, eventKey);

      Object.assign(state, {
        draggingNodeKey: eventKey,
        dragChildrenKeys: getDragChildrenKeys(eventKey, keyEntities),
        indent: listRef.value.getIndentWidth(),
      });

      setExpandedKeys(newExpandedKeys);

      window.addEventListener('dragend', onWindowDragEnd);

      onDragStart?.({ event, node: convertNodePropsToEventData(nodeProps) });
    }

    /**
     * [Legacy] Select handler is smaller than node,
     * so that this will trigger when drag enter node or select handler.
     * This is a little tricky if customize css without padding.
     * Better for use mouse move event to refresh drag state.
     * But let's just keep it to avoid event trigger logic change.
     */
    function onNodeDragEnter(event, nodeProps: TreeNodeProps) {
      const { expandedKeys, keyEntities, dragChildrenKeys, flattenNodes, indent } = state;
      const { pos, eventKey } = nodeProps;

      // record the key of node which is latest entered, used in dragleave event.
      if (currentMouseOverDroppableNodeKey.value !== eventKey) {
        currentMouseOverDroppableNodeKey.value = eventKey;
      }

      if (!dragNodeProps) {
        resetDragState();
        return;
      }

      const { dropPosition, dropLevelOffset, dropTargetKey, dropContainerKey, dropTargetPos, dropAllowed, dragOverNodeKey } =
        // @ts-ignore
        calcDropPosition(
          event,
          dragNodeProps.value as any,
          nodeProps,
          indent,
          dragStartMousePosition.value,
          allowDrop,
          flattenNodes,
          keyEntities,
          expandedKeys,
          direction,
        );

      if (
        // don't allow drop inside its children
        dragChildrenKeys.includes(dropTargetKey) ||
        // don't allow drop when drop is not allowed caculated by calcDropPosition
        !dropAllowed
      ) {
        resetDragState();
        return;
      }

      // Side effect for delay drag
      if (!delayedDragEnterLogic.value) {
        delayedDragEnterLogic.value = {};
      }
      Object.keys(delayedDragEnterLogic.value).forEach((key) => {
        clearTimeout(delayedDragEnterLogic.value[key]);
      });

      if (dragNodeProps.value.eventKey !== nodeProps.eventKey) {
        // hoist expand logic here
        // since if logic is on the bottom
        // it will be blocked by abstract dragover node check
        //   => if you dragenter from top, you mouse will still be consider as in the top node
        event.persist();
        delayedDragEnterLogic.value[pos] = window.setTimeout(() => {
          if (state.draggingNodeKey === null) {
            return;
          }

          let newExpandedKeys = [...expandedKeys];
          const entity = getEntity(keyEntities, nodeProps.eventKey);

          if (entity && (entity.children || []).length) {
            newExpandedKeys = arrAdd(expandedKeys, nodeProps.eventKey);
          }

          if (!props.hasOwnProperty('expandedKeys')) {
            setExpandedKeys(newExpandedKeys);
          }

          onExpand?.(newExpandedKeys, {
            node: convertNodePropsToEventData(nodeProps),
            expanded: true,
            nativeEvent: event.nativeEvent,
          });
        }, 800);
      }

      // Skip if drag node is self
      if (dragNodeProps.value.eventKey === dropTargetKey && dropLevelOffset === 0) {
        resetDragState();
        return;
      }

      // Update drag over node and drag state
      Object.assign(state, {
        dragOverNodeKey,
        dropPosition,
        dropLevelOffset,
        dropTargetKey,
        dropContainerKey,
        dropTargetPos,
        dropAllowed,
      });

      onDragEnter?.({
        event,
        node: convertNodePropsToEventData(nodeProps),
        expandedKeys,
      });
    }

    function onNodeDragOver(event, nodeProps: TreeNodeProps) {
      const { dragChildrenKeys, flattenNodes, keyEntities, expandedKeys, indent } = state;

      if (!dragNodeProps.value) {
        return;
      }

      const { dropPosition, dropLevelOffset, dropTargetKey, dropContainerKey, dropTargetPos, dropAllowed, dragOverNodeKey } =
        // @ts-ignore
        calcDropPosition(
          event,
          dragNodeProps.value as any,
          nodeProps,
          indent,
          dragStartMousePosition.value,
          allowDrop,
          flattenNodes,
          keyEntities,
          expandedKeys,
          direction,
        );

      if (dragChildrenKeys.includes(dropTargetKey) || !dropAllowed) {
        // don't allow drop inside its children
        // don't allow drop when drop is not allowed calculated by calcDropPosition
        return;
      }

      // Update drag position

      if (dragNodeProps.value.eventKey === dropTargetKey && dropLevelOffset === 0) {
        if (
          !(
            state.dropPosition === null &&
            state.dropLevelOffset === null &&
            state.dropTargetKey === null &&
            state.dropContainerKey === null &&
            state.dropTargetPos === null &&
            state.dropAllowed === false &&
            state.dragOverNodeKey === null
          )
        ) {
          resetDragState();
        }
      } else if (
        !(
          dropPosition === state.dropPosition &&
          dropLevelOffset === state.dropLevelOffset &&
          dropTargetKey === state.dropTargetKey &&
          dropContainerKey === state.dropContainerKey &&
          dropTargetPos === state.dropTargetPos &&
          dropAllowed === state.dropAllowed &&
          dragOverNodeKey === state.dragOverNodeKey
        )
      ) {
        Object.assign(state, {
          dropPosition,
          dropLevelOffset,
          dropTargetKey,
          dropContainerKey,
          dropTargetPos,
          dropAllowed,
          dragOverNodeKey,
        });
      }

      onDragOver?.({ event, node: convertNodePropsToEventData(nodeProps) });
    }

    function onNodeDragLeave(event, nodeProps) {
      // if it is outside the droppable area
      // currentMouseOverDroppableNodeKey will be updated in dragenter event when into another droppable receiver.
      if (
        currentMouseOverDroppableNodeKey.value === nodeProps.eventKey &&
        !event.currentTarget.contains(event.relatedTarget as Node)
      ) {
        resetDragState();
        currentMouseOverDroppableNodeKey.value = null;
      }

      onDragLeave?.({ event, node: convertNodePropsToEventData(nodeProps) });
    }

    // since stopPropagation() is called in treeNode
    // if onWindowDrag is called, whice means state is keeped, drag state should be cleared
    function onWindowDragEnd(event) {
      onNodeDragEnd(event, null);
      window.removeEventListener('dragend', onWindowDragEnd);
    }

    // if onNodeDragEnd is called, onWindowDragEnd won't be called since stopPropagation() is called
    function onNodeDragEnd(event, nodeProps) {
      state.dragOverNodeKey = null;

      cleanDragState();

      onDragEnd?.({ event, node: convertNodePropsToEventData(nodeProps) });

      dragNodeProps.value = null;

      window.removeEventListener('dragend', onWindowDragEnd);
    }

    function onNodeDrop(event, _: TreeNodeProps, outsideTree: boolean = false) {
      const { dragChildrenKeys, dropPosition, dropTargetKey, dropTargetPos, dropAllowed } = state;

      if (!dropAllowed) {
        return;
      }

      state.dragOverNodeKey = null;
      cleanDragState();

      if (dropTargetKey === null) return;

      const abstractDropNodeProps = {
        ...getTreeNodeProps(dropTargetKey, getTreeNodeRequiredProps()),
        active: getActiveItem()?.key === dropTargetKey,
        data: getEntity(state.keyEntities, dropTargetKey).node,
      };

      const dropToChild = dragChildrenKeys.includes(dropTargetKey);

      warning(!dropToChild, "Can not drop to dragNode's children node. This is a bug of rc-tree. Please report an issue.");

      const posArr = posToArr(dropTargetPos);

      const dropResult = {
        event,
        node: convertNodePropsToEventData(abstractDropNodeProps),
        // @ts-ignore
        dragNode: dragNodeProps.value ? convertNodePropsToEventData(dragNodeProps.value) : null,
        dragNodesKeys: [dragNodeProps.value.eventKey].concat(dragChildrenKeys),
        dropToGap: dropPosition !== 0,
        dropPosition: dropPosition + Number(posArr[posArr.length - 1]),
      };

      if (!outsideTree) {
        onDrop?.(dropResult);
      }

      dragNodeProps.value = null;
    }

    function resetDragState() {
      Object.assign(state, {
        dragOverNodeKey: null,
        dropPosition: null,
        dropLevelOffset: null,
        dropTargetKey: null,
        dropContainerKey: null,
        dropTargetPos: null,
        dropAllowed: false,
      });
    }

    function cleanDragState() {
      const { draggingNodeKey } = state;
      if (draggingNodeKey !== null) {
        Object.assign(state, {
          draggingNodeKey: null,
          dropPosition: null,
          dropContainerKey: null,
          dropTargetKey: null,
          dropLevelOffset: null,
          dropAllowed: true,
          dragOverNodeKey: null,
        });
      }
      dragStartMousePosition.value = null;
      currentMouseOverDroppableNodeKey.value = null;
    }

    function triggerExpandActionExpand(e, treeNode) {
      const { expandedKeys, flattenNodes } = state;
      const { expanded, key, isLeaf } = treeNode;

      if (isLeaf || e.shiftKey || e.metaKey || e.ctrlKey) {
        return;
      }

      const node = flattenNodes.filter((nodeItem) => nodeItem.key === key)[0];
      const eventNode = convertNodePropsToEventData({
        ...getTreeNodeProps(key, getTreeNodeRequiredProps()),
        data: node.data,
      });

      setExpandedKeys(expanded ? arrDel(expandedKeys, key) : arrAdd(expandedKeys, key));
      onNodeExpand(e, eventNode);
    }

    function onNodeClick(e, treeNode) {
      if (expandAction === 'click') {
        triggerExpandActionExpand(e, treeNode);
      }

      onClick?.(e, treeNode);
    }

    function onNodeDoubleClick(e, treeNode) {
      if (expandAction === 'doubleClick') {
        triggerExpandActionExpand(e, treeNode);
      }

      onDoubleClick?.(e, treeNode);
    }

    function onNodeSelect(e, treeNode) {
      let { selectedKeys } = state;
      const { keyEntities, fieldNames } = state;
      const { selected } = treeNode;
      const key = treeNode[fieldNames.key];
      const targetSelected = !selected;

      // Update selected keys
      if (!targetSelected) {
        selectedKeys = arrDel(selectedKeys, key);
      } else if (!multiple) {
        selectedKeys = [key];
      } else {
        selectedKeys = arrAdd(selectedKeys, key);
      }

      // [Legacy] Not found related usage in doc or upper libs
      const selectedNodes = selectedKeys
        .map((selectedKey) => {
          const entity = getEntity(keyEntities, selectedKey);
          return entity ? entity.node : null;
        })
        .filter(Boolean);

      setUncontrolledState({ selectedKeys });

      onSelect?.(selectedKeys, {
        event: 'select',
        selected: targetSelected,
        node: treeNode,
        selectedNodes,
        nativeEvent: e.nativeEvent,
      });
    }

    function onNodeCheck(e, treeNode: EventDataNode, checked: boolean) {
      const { keyEntities, checkedKeys: oriCheckedKeys, halfCheckedKeys: oriHalfCheckedKeys } = state;
      const { key } = treeNode;

      // Prepare trigger arguments
      let checkedObj: { checked: Key[]; halfChecked: Key[] } | Key[];

      const eventObj: Partial<CheckInfo> = {
        event: 'check',
        node: treeNode,
        checked,
        nativeEvent: e.nativeEvent,
      };

      if (checkStrictly) {
        const checkedKeys = checked ? arrAdd(oriCheckedKeys, key) : arrDel(oriCheckedKeys, key);
        const halfCheckedKeys = arrDel(oriHalfCheckedKeys, key);
        checkedObj = { checked: checkedKeys, halfChecked: halfCheckedKeys };

        eventObj.checkedNodes = checkedKeys
          .map((checkedKey) => getEntity(keyEntities, checkedKey))
          .filter(Boolean)
          .map((entity) => entity.node);

        setUncontrolledState({ checkedKeys });
      } else {
        // Always fill first
        let { checkedKeys, halfCheckedKeys } = conductCheck([...oriCheckedKeys, key], true, keyEntities);

        // If remove, we do it again to correction
        if (!checked) {
          const keySet = new Set(checkedKeys);
          keySet.delete(key);
          ({ checkedKeys, halfCheckedKeys } = conductCheck(Array.from(keySet), { checked: false, halfCheckedKeys }, keyEntities));
        }

        checkedObj = checkedKeys;

        // [Legacy] This is used for `rc-tree-select`
        eventObj.checkedNodes = [];
        eventObj.checkedNodesPositions = [];
        eventObj.halfCheckedKeys = halfCheckedKeys;

        checkedKeys.forEach((checkedKey) => {
          const entity = getEntity(keyEntities, checkedKey);
          if (!entity) return;

          const { node, pos } = entity;

          eventObj.checkedNodes.push(node);
          eventObj.checkedNodesPositions.push({ node, pos });
        });
        setUncontrolledState({ checkedKeys }, false, { halfCheckedKeys });
      }

      onCheck?.(checkedObj, eventObj as CheckInfo);
    }

    function onNodeLoad(treeNode: EventDataNode) {
      const { key } = treeNode;
      const { keyEntities } = state;

      // Skip if has children already
      const entity = getEntity(keyEntities, key);
      if (entity?.children?.length) {
        return;
      }

      const loadPromise = new Promise<void>((resolve, reject) => {
        // We need to get the latest state of loading/loaded keys

        if (!loadData || state.loadedKeys.includes(key) || state.loadingKeys.includes(key)) {
          return null;
        }

        // Process load data
        const promise = loadData(treeNode);
        promise
          .then(() => {
            const { loadedKeys: currentLoadedKeys } = state;
            const newLoadedKeys = arrAdd(currentLoadedKeys, key);

            // onLoad should trigger before internal setState to avoid `loadData` trigger twice.
            // https://github.com/ant-design/ant-design/issues/12464
            onLoad?.(newLoadedKeys, {
              event: 'load',
              node: treeNode,
            });

            setUncontrolledState({
              loadedKeys: newLoadedKeys,
            });
            state.loadingKeys = arrDel(state.loadingKeys, key);

            resolve();
          })
          .catch((e) => {
            state.loadingKeys = arrDel(state.loadingKeys, key);

            // If exceed max retry times, we give up retry
            loadingRetryTimes.value[key as SafeKey] = (loadingRetryTimes.value[key as SafeKey] || 0) + 1;
            if (loadingRetryTimes.value[key as SafeKey] >= MAX_RETRY_TIMES) {
              const { loadedKeys: currentLoadedKeys } = state;

              warning(false, 'Retry for `loadData` many times but still failed. No more retry.');

              setUncontrolledState({
                loadedKeys: arrAdd(currentLoadedKeys, key),
              });
              resolve();
            }

            reject(e);
          });
      });

      // Not care warning if we ignore this
      loadPromise.catch(() => {});

      return loadPromise;
    }

    function onNodeMouseEnter(event, node) {
      onMouseEnter?.({ event, node });
    }

    function onNodeMouseLeave(event, node) {
      onMouseLeave?.({ event, node });
    }

    function onNodeContextMenu(event, node) {
      if (onRightClick) {
        event.preventDefault();
        onRightClick({ event, node });
      }
    }
    function onFocus(...args) {
      const { activeKey, selectedKeys, flattenNodes } = state;

      if (!disabled && activeKey === null) {
        const visibleSelectedKey = selectedKeys.find((key) => {
          return flattenNodes.some((nodeItem) => nodeItem.key === key);
        });

        if (visibleSelectedKey !== undefined) {
          onActiveChange(visibleSelectedKey);
        } else {
          onActiveChange(flattenNodes?.[0]?.key || null);
        }
      }
      // @ts-ignore
      props.onFocus?.(...args);
    }

    function onBlur(...args) {
      onActiveChange(null);

      // @ts-ignore
      props.onBlur?.(...args);
    }

    function getTreeNodeRequiredProps() {
      const {
        expandedKeys,
        selectedKeys,
        loadedKeys,
        loadingKeys,
        checkedKeys,
        halfCheckedKeys,
        dragOverNodeKey,
        dropPosition,
        keyEntities,
      } = state;
      return {
        expandedKeys: expandedKeys || [],
        selectedKeys: selectedKeys || [],
        loadedKeys: loadedKeys || [],
        loadingKeys: loadingKeys || [],
        checkedKeys: checkedKeys || [],
        halfCheckedKeys: halfCheckedKeys || [],
        dragOverNodeKey,
        dropPosition,
        keyEntities: keyEntities,
      };
    }

    // =========================== Expanded ===========================
    /** Set uncontrolled `expandedKeys`. This will also auto update `flattenNodes`. */
    function setExpandedKeys(expandedKeys: Key[]) {
      const { treeData, fieldNames } = state;
      // @ts-ignore
      const flattenNodes = flattenTreeData(treeData, expandedKeys, fieldNames);
      setUncontrolledState({ expandedKeys, flattenNodes }, true);
    }

    function onNodeExpand(e, treeNode: EventDataNode) {
      let { expandedKeys } = state;
      const { listChanging, fieldNames } = state;
      const { expanded } = treeNode;
      const key = treeNode[fieldNames.key];

      // Do nothing when motion is in progress
      if (listChanging) {
        return;
      }

      // Update selected keys
      const certain = expandedKeys.includes(key);
      const targetExpanded = !expanded;

      warning((expanded && certain) || (!expanded && !certain), 'Expand state not sync with index check');

      expandedKeys = targetExpanded ? arrAdd(expandedKeys, key) : arrDel(expandedKeys, key);

      setExpandedKeys(expandedKeys);

      onExpand?.(expandedKeys, {
        node: treeNode,
        expanded: targetExpanded,
        nativeEvent: e.nativeEvent,
      });

      // Async Load data
      if (targetExpanded && loadData) {
        const loadPromise = onNodeLoad(treeNode);
        if (loadPromise) {
          loadPromise
            .then(() => {
              // [Legacy] Refresh logic
              // @ts-ignore
              const newFlattenTreeData = flattenTreeData(state.treeData, expandedKeys, fieldNames);
              setUncontrolledState({ flattenNodes: newFlattenTreeData });
            })
            .catch(() => {
              const { expandedKeys: currentExpandedKeys } = state;
              const expandedKeysToRestore = arrDel(currentExpandedKeys, key);
              setExpandedKeys(expandedKeysToRestore);
            });
        }
      }
    }

    function onListChangeStart() {
      setUncontrolledState({
        listChanging: true,
      });
    }

    function onListChangeEnd() {
      setTimeout(() => {
        setUncontrolledState({
          listChanging: false,
        });
      });
    }

    // =========================== Keyboard ===========================
    function onActiveChange(newActiveKey: Key | null) {
      const { activeKey } = state;
      const { onActiveChange, itemScrollOffset = 0 } = props;

      if (activeKey === newActiveKey) {
        return;
      }
      state.activeKey = newActiveKey;
      if (newActiveKey !== null) {
        scrollTo({ key: newActiveKey, offset: itemScrollOffset });
      }

      onActiveChange?.(newActiveKey);
    }

    function getActiveItem() {
      const { activeKey, flattenNodes } = state;
      if (activeKey === null) {
        return null;
      }

      // @ts-ignore
      return flattenNodes.find(({ key }) => key === activeKey) || null;
    }

    function offsetActiveKey(offset: number) {
      const { flattenNodes, activeKey } = state;

      let index = flattenNodes.findIndex(({ key }) => key === activeKey);

      // Align with index
      if (index === -1 && offset < 0) {
        index = flattenNodes.length;
      }

      index = (index + offset + flattenNodes.length) % flattenNodes.length;

      const item = flattenNodes[index];
      if (item) {
        const { key } = item;
        onActiveChange(key);
      } else {
        onActiveChange(null);
      }
    }

    function onKeyDown(event) {
      const { activeKey, expandedKeys, checkedKeys, flattenNodes, keyEntities } = state;

      if (disabled) {
        return;
      }

      // >>>>>>>>>> Direction
      switch (event.key) {
        case 'ArrowUp': {
          offsetActiveKey(-1);
          event.preventDefault();
          break;
        }
        case 'ArrowDown': {
          offsetActiveKey(1);
          event.preventDefault();
          break;
        }
        case 'Home': {
          onActiveChange(flattenNodes?.[0]?.key);
          event.preventDefault();
          break;
        }
        case 'End': {
          onActiveChange(flattenNodes?.[flattenNodes.length - 1]?.key);
          event.preventDefault();
          break;
        }
      }

      // >>>>>>>>>> Expand & Selection
      const activeItem = getActiveItem();
      if (activeItem && activeItem.data) {
        const treeNodeRequiredProps = getTreeNodeRequiredProps();
        const eventNode = convertNodePropsToEventData({
          ...getTreeNodeProps(activeKey, treeNodeRequiredProps),
          data: activeItem.data,
          active: true,
        });
        const entity = getEntity(keyEntities, activeKey);
        const hasChildren = !!entity?.children?.length;
        const expandable = !isLeafNode(activeItem.data.isLeaf, loadData, hasChildren, eventNode.loaded);

        const canCheck = checkable && !eventNode.disabled && eventNode.checkable !== false && !eventNode.disableCheckbox;
        const canSelect = !checkable && selectable && !eventNode.disabled && eventNode.selectable !== false;

        switch (event.key) {
          // >>> Expand
          case 'ArrowLeft': {
            // Collapse if possible
            if (expandable && expandedKeys.includes(activeKey)) {
              onNodeExpand({}, eventNode);
            } else if (activeItem.parent) {
              onActiveChange(activeItem.parent.key);
            }
            event.preventDefault();
            break;
          }
          case 'ArrowRight': {
            // Expand if possible
            if (expandable && !expandedKeys.includes(activeKey)) {
              onNodeExpand({}, eventNode);
            } else if (activeItem.children && activeItem.children.length) {
              onActiveChange(activeItem.children[0].key);
            }
            event.preventDefault();
            break;
          }

          case 'Enter': {
            if (expandable) {
              event.preventDefault();
              onNodeExpand({}, eventNode);
            } else if (canCheck) {
              if (!checkedKeys.includes(activeKey)) {
                event.preventDefault();
                onNodeCheck({}, eventNode, true);
              }
            } else if (canSelect && !eventNode.selected) {
              event.preventDefault();
              onNodeSelect({}, eventNode);
            }
            break;
          }

          case ' ': {
            if (canCheck) {
              event.preventDefault();
              onNodeCheck({}, eventNode, !checkedKeys.includes(activeKey));
            } else if (canSelect) {
              event.preventDefault();
              onNodeSelect({}, eventNode);
            }
            break;
          }
        }
      }

      props.onKeyDown?.(event);
    }

    /**
     * Only update the value which is not in props
     */

    function setUncontrolledState(
      nState: Partial<TreeState>,
      atomic: boolean = false,
      forceState: Partial<TreeState> | null = null,
    ) {
      if (!destroyed.value) {
        let needSync = false;
        let allPassed = true;
        const newState = {};

        Object.keys(nState).forEach((name) => {
          if (props.hasOwnProperty(name)) {
            allPassed = false;
            return;
          }

          needSync = true;
          newState[name] = nState[name];
        });
        if (needSync && (!atomic || allPassed)) {
          Object.assign(state, {
            ...newState,
            ...forceState,
          } as TreeState);
        }
      }
    }

    function scrollTo(scroll) {
      listRef.value.scrollTo(scroll);
    }
    const vm = getCurrentInstance();
    function changeRef(el) {
      listRef.value = el;
      vm.exposeProxy = el || {};
      vm.exposed = el || {};
    }
    return () => {
      const {
        flattenNodes,
        keyEntities,
        draggingNodeKey,
        dropLevelOffset,
        dropContainerKey,
        dropTargetKey,
        dropPosition,
        dragOverNodeKey,
        indent,
      } = state;

      const domProps: HTMLAttributes<HTMLDivElement> = pickAttrs(props, {
        aria: true,
        data: true,
      });

      // It's better move to hooks but we just simply keep here
      let draggableConfig: DraggableConfig;
      if (draggable) {
        if (typeof draggable === 'object') {
          draggableConfig = draggable;
        } else if (typeof draggable === 'function') {
          draggableConfig = {
            nodeDraggable: draggable,
          };
        } else {
          draggableConfig = {};
        }
      }

      const contextValue = {
        styles,
        classNames: treeClassNames,
        prefixCls,
        selectable,
        showIcon,
        icon,
        switcherIcon,
        draggable: draggableConfig,
        draggingNodeKey,
        checkable,
        checkStrictly,
        disabled,
        keyEntities,
        dropLevelOffset,
        dropContainerKey,
        dropTargetKey,
        dropPosition,
        dragOverNodeKey,
        indent,
        direction,
        dropIndicatorRender,
        loadData,
        filterTreeNode,
        titleRender,
        onNodeClick,
        onNodeDoubleClick,
        onNodeExpand,
        onNodeSelect,
        onNodeCheck,
        onNodeLoad,
        onNodeMouseEnter,
        onNodeMouseLeave,
        onNodeContextMenu,
        onNodeDragStart,
        onNodeDragEnter,
        onNodeDragOver,
        onNodeDragLeave,
        onNodeDragEnd,
        onNodeDrop,
      };
      return (
        <TreeContextProvider value={contextValue}>
          <div
            class={clsx(prefixCls, className, rootClassName, {
              [`${prefixCls}-show-line`]: showLine,
            })}
            style={rootStyle}
          >
            <NodeList
              ref={changeRef}
              prefixCls={prefixCls}
              // @ts-ignore
              style={style}
              data={flattenNodes}
              disabled={disabled}
              selectable={selectable}
              checkable={!!checkable}
              motion={motion}
              dragging={draggingNodeKey !== null}
              height={height}
              itemHeight={itemHeight}
              virtual={virtual}
              focusable={focusable}
              tabIndex={tabIndex}
              activeItem={getActiveItem()}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onActiveChange={onActiveChange}
              onListChangeStart={onListChangeStart}
              onListChangeEnd={onListChangeEnd}
              onContextMenu={onContextMenu}
              onScroll={onScroll}
              scrollWidth={scrollWidth}
              {...getTreeNodeRequiredProps()}
              {...domProps}
            />
          </div>
        </TreeContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);

export default Tree;
