import { defineComponent, Fragment, reactive, watch, type CSSProperties, type HTMLAttributes, type VNodeRef } from 'vue';
import type { CSSMotionProps } from './CSSMotion';
import OriginCSSMotion from './CSSMotion';
import { diffKeys, parseKeys, STATUS_ADD, STATUS_KEEP, STATUS_REMOVE, STATUS_REMOVED, type KeyObject } from './util/diff';
import { supportTransition } from './util/motion';

const MOTION_PROP_NAMES = [
  'eventProps',
  'visible',
  'motionName',
  'motionAppear',
  'motionEnter',
  'motionLeave',
  'motionLeaveImmediately',
  'motionDeadline',
  'removeOnLeave',
  'leavedClassName',
  'onAppearPrepare',
  'onAppearStart',
  'onAppearActive',
  'onAppearEnd',
  'onEnterStart',
  'onEnterActive',
  'onEnterEnd',
  'onLeaveStart',
  'onLeaveActive',
  'onLeaveEnd',
];

export interface CSSMotionListProps extends Omit<CSSMotionProps, 'onVisibleChanged'>, HTMLAttributes {
  keys: (PropertyKey | { key: PropertyKey; [name: string]: any })[];
  component?: string | false;

  /** This will always trigger after final visible changed. Even if no motion configured. */
  onVisibleChanged?: (visible: boolean, info: { key: PropertyKey }) => void;
  /** All motion leaves in the screen */
  onAllRemoved?: () => void;
}

export interface CSSMotionListState {
  keyEntities: KeyObject[];
}

/**
 * Generate a CSSMotionList component with config
 * @param transitionSupport No need since CSSMotionList no longer depends on transition support
 * @param CSSMotion CSSMotion component
 */
export function genCSSMotionList(_transitionSupport: boolean, CSSMotion = OriginCSSMotion): CSSMotionListProps {
  const CSSMotionList = defineComponent((props: CSSMotionListProps, { slots }) => {
    defineSlots<{
      default: (props: {
        visible?: boolean;
        class?: string;
        style?: CSSProperties;
        index?: number;
        [key: string]: any;
        ref: VNodeRef;
      }) => any;
    }>();

    const state = reactive({
      keyEntities: [] as KeyObject[],
    });

    // Update keyEntities
    watch(
      () => props.keys,
      (newKeys) => {
        const parsedKeyObjects = parseKeys(newKeys as any);
        const mixedKeyEntities = diffKeys(state.keyEntities, parsedKeyObjects);

        state.keyEntities = mixedKeyEntities.filter((entity) => {
          const prevEntity = state.keyEntities.find(({ key }) => entity.key === key);
          if (prevEntity && prevEntity.status === STATUS_REMOVED && entity.status === STATUS_REMOVE) {
            return false;
          }
          return true;
        });
      },
      { immediate: true },
    );

    // Remove key
    function removeKey(removedRowKey: PropertyKey) {
      state.keyEntities = state.keyEntities.map((entity) => {
        if (entity.key !== removedRowKey) return entity;
        return { ...entity, status: STATUS_REMOVED };
      });

      const restKeysCount = state.keyEntities.filter(({ status }) => status !== STATUS_REMOVED).length;

      if (restKeysCount === 0 && props.onAllRemoved) {
        props.onAllRemoved();
      }
    }

    return () => {
      const children = slots.default;
      const { keyEntities } = state;
      const { component, onVisibleChanged, onAllRemoved: _, ...restProps } = props;
      const Component = component || Fragment;
      const motionProps: CSSMotionProps = {};
      MOTION_PROP_NAMES.forEach((prop) => {
        motionProps[prop] = restProps[prop];
        delete restProps[prop];
      });
      delete restProps.keys;

      const content = keyEntities.map(({ status, ...eventProps }, index) => {
        const visible = status === STATUS_ADD || status === STATUS_KEEP;
        return (
          <CSSMotion
            {...motionProps}
            key={eventProps.key}
            visible={visible}
            eventProps={eventProps}
            onVisibleChanged={(changedVisible) => {
              onVisibleChanged?.(changedVisible, { key: eventProps.key });
              if (!changedVisible) removeKey(eventProps.key);
            }}
          >
            {(p) => children?.({ ...p, index })}
          </CSSMotion>
        );
      });

      // Fragment 分支：直接返回 children（最像“空标签”）
      if (Component === Fragment) {
        return content;
      }

      // 非 Fragment：正常包一层
      return <Component {...restProps}>{content}</Component>;
    };
  });

  return CSSMotionList;
}

export default genCSSMotionList(supportTransition);
