import type { DataEntity, DataNode } from '@vc-com/tree/interface';
import { convertDataToEntities } from '@vc-com/tree/utils/treeUtil';
import { shallowRef, type Ref } from 'vue';
import type { DefaultOptionType, InternalFieldNames } from '../Cascader';
import { VALUE_SPLIT } from '../utils/commonUtil';

export interface OptionsInfo {
  keyEntities: Record<string, DataEntity>;
  pathKeyEntities: Record<string, DataEntity>;
}

export type GetEntities = () => OptionsInfo['pathKeyEntities'];

/** Lazy parse options data into conduct-able info to avoid perf issue in single mode */
export default (options: Ref<DefaultOptionType[]>, fieldNames: Ref<InternalFieldNames>) => {
  const cacheRef = shallowRef<{
    options: DefaultOptionType[];
    info: OptionsInfo;
  }>({
    options: [],
    info: { keyEntities: {}, pathKeyEntities: {} },
  });

  const getEntities: GetEntities = () => {
    if (cacheRef.value.options !== options.value) {
      cacheRef.value.options = options.value;
      cacheRef.value.info = convertDataToEntities(options.value as DataNode[], {
        fieldNames: fieldNames.value as any,
        initWrapper: (wrapper) => ({
          ...wrapper,
          pathKeyEntities: {},
        }),
        processEntity: (entity, wrapper) => {
          const pathKey = (entity.nodes as DefaultOptionType[]).map((node) => node[fieldNames.value.value]).join(VALUE_SPLIT);

          (wrapper as unknown as OptionsInfo).pathKeyEntities[pathKey] = entity;

          // Overwrite origin key.
          // this is very hack but we need let conduct logic work with connect path
          entity.key = pathKey;
        },
      }) as any;
    }

    return cacheRef.value.info.pathKeyEntities;
  };

  return getEntities;
};
