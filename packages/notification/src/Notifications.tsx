import type { CSSMotionProps } from '@vc-com/motion';
import type { Key, VueNode } from '@vc-com/util/lib/types';
import { computed, defineComponent, ref, Teleport, watch, type CSSProperties } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { InnerOpenConfig, OpenConfig, Placement, Placements, StackConfig } from './interface';
import NoticeList from './NoticeList';

export interface NotificationsProps {
  prefixCls?: string;
  motion?: CSSMotionProps | ((placement: Placement) => CSSMotionProps);
  container?: HTMLElement | ShadowRoot;
  maxCount?: number;
  class?: (placement: Placement) => string;
  style?: (placement: Placement) => CSSProperties;
  onAllRemoved?: VoidFunction;
  stack?: StackConfig;
  renderNotifications?: (node: VueNode, info: { prefixCls: string; key: Key }) => VueNode;
}

export interface NotificationsRef {
  open: (config: OpenConfig) => void;
  close: (key: Key) => void;
  destroy: () => void;
}

// ant-notification ant-notification-topRight
const Notifications = defineComponent(
  ({
    prefixCls = 'rc-notification',
    container,
    motion,
    maxCount,
    class: className,
    style,
    onAllRemoved,
    stack,
    renderNotifications,
  }: NotificationsProps) => {
    const configList = ref<any[]>([]);

    // ======================== Close =========================
    const onNoticeClose = (key: Key) => {
      // Trigger close event
      // @ts-ignore
      const config = configList.value.find((item) => item.key === key);
      const closable = config?.closable;
      const closableObj = closable && typeof closable === 'object' ? closable : {};
      const { onClose: closableOnClose } = closableObj;
      closableOnClose?.();
      config?.onClose?.();
      configList.value = configList.value.filter((item) => item.key !== key);
    };

    // ========================= Refs =========================
    defineExpose({
      open: (config) => {
        let clone = [...configList.value];

        // Replace if exist
        const index = clone.findIndex((item) => item.key === config.key);
        const innerConfig: InnerOpenConfig = { ...config };
        if (index >= 0) {
          innerConfig.times = ((configList.value[index] as InnerOpenConfig)?.times || 0) + 1;
          clone[index] = innerConfig;
        } else {
          innerConfig.times = 0;
          clone.push(innerConfig);
        }

        if (maxCount > 0 && clone.length > maxCount) {
          clone = clone.slice(-maxCount);
        }

        configList.value = clone;
      },
      close: (key) => {
        onNoticeClose(key);
      },
      destroy: () => {
        configList.value = [];
      },
    });

    // ====================== Placements ======================
    const placements = ref<any>({});

    watch(
      [configList],
      () => {
        const nextPlacements: Placements = {};

        configList.value.forEach((config) => {
          const { placement = 'topRight' } = config;

          if (placement) {
            nextPlacements[placement] = nextPlacements[placement] || [];
            nextPlacements[placement].push(config);
          }
        });

        // Fill exist placements to avoid empty list causing remove without motion
        Object.keys(placements.value).forEach((placement) => {
          nextPlacements[placement] = nextPlacements[placement] || [];
        });

        placements.value = nextPlacements;
      },
      { immediate: true, deep: true },
    );

    // Clean up container if all notices fade out
    const onAllNoticeRemoved = (placement: Placement) => {
      const clone = {
        ...placements.value,
      };
      const list = clone[placement] || [];

      if (!list.length) {
        delete clone[placement];
      }

      placements.value = clone;
    };

    // Effect tell that placements is empty now
    const emptyRef = useRef(false);
    watch(
      placements,
      () => {
        if (Object.keys(placements.value).length > 0) {
          emptyRef.value = true;
        } else if (emptyRef.value) {
          // Trigger only when from exist to empty
          onAllRemoved?.();
          emptyRef.value = false;
        }
      },
      { immediate: true, deep: true },
    );
    // ======================== Render ========================

    const placementList = computed(() => Object.keys(placements.value) as Placement[]);

    return () => (
      <Teleport v-if={container} to={container}>
        {placementList.value?.map((placement) => {
          const placementConfigList = placements.value[placement];
          const list = (
            <NoticeList
              key={placement}
              configList={placementConfigList}
              placement={placement}
              prefixCls={prefixCls}
              class={typeof className === 'function' ? className?.(placement) : ''}
              style={style?.(placement)}
              motion={motion}
              onNoticeClose={onNoticeClose}
              onAllNoticeRemoved={onAllNoticeRemoved}
              stack={stack}
            />
          );

          return renderNotifications ? renderNotifications(list, { prefixCls, key: placement }) : list;
        })}
      </Teleport>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Notifications' : undefined },
);

export default Notifications;
