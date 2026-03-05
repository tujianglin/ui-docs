import { computed, defineComponent, inject, provide, ref, type InjectionKey, type Ref } from 'vue';
const EmptyList: string[] = [];

// ========================= Path Register =========================
export interface PathRegisterContextProps {
  registerPath: (key: string, keyPath: string[]) => void;
  unregisterPath: (key: string, keyPath: string[]) => void;
}

const PathRegisterContext: InjectionKey<PathRegisterContextProps> = Symbol('PathRegisterContext');

export const usePathRegisterContextInject = () => {
  return inject(PathRegisterContext, null);
};

export const PathRegisterContextProvider = defineComponent((props: { value: PathRegisterContextProps }) => {
  provide(PathRegisterContext, props.value);
  return () => <slot></slot>;
});
// ========================= Path Tracker ==========================
const PathTrackerContext: InjectionKey<Ref<string[]>> = Symbol('PathTrackerContext');

export const usePathTrackerContextInject = () => {
  return inject(PathTrackerContext, ref(EmptyList));
};

export const PathTrackerContextProvider = defineComponent((props: { value: string[] }) => {
  provide(
    PathTrackerContext,
    computed(() => props.value),
  );
  return () => <slot></slot>;
});

export function useFullPath(eventKey?: Ref<string>) {
  const parentKeyPath = usePathTrackerContextInject();
  return computed(() => (eventKey?.value !== undefined ? [...parentKeyPath.value, eventKey?.value] : parentKeyPath.value));
}

// =========================== Path User ===========================
export interface PathUserContextProps {
  isSubPathKey: (pathKeys: string[], eventKey: string) => boolean;
}

const PathUserContext: InjectionKey<PathUserContextProps> = Symbol('PathUserContext');

export const usePathUserContextInject = () => {
  return inject(PathUserContext, {} as PathUserContextProps);
};

export const PathUserContextProvider = defineComponent((props: { value: PathUserContextProps }) => {
  provide(PathUserContext, props.value);
  return () => <slot></slot>;
});
