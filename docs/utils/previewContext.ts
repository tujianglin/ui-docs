import type { Ref } from 'vue';

export type PreviewContext = {
  isPreview: boolean;
  activeVariant?: Ref<string> | string;
};
