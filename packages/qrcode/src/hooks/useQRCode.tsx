import { reactiveComputed, type ReactiveComputedReturn } from '@vueuse/core';
import { computed } from 'vue';
import type { ErrorCorrectionLevel, ImageSettings } from '../interface';
import { QrCode, QrSegment } from '../libs/qrcodegen';
import { ERROR_LEVEL_MAP, getImageSettings, getMarginSize } from '../utils';

interface Options {
  value: string | string[];
  level: ErrorCorrectionLevel;
  minVersion: number;
  marginSize?: number;
  imageSettings?: ImageSettings;
  size: number;
  boostLevel?: boolean;
}

export const useQRCode = (opt: ReactiveComputedReturn<Options>) => {
  const { value, level, minVersion, marginSize, imageSettings, size, boostLevel } = $(opt);

  const memoizedQrcode = computed<QrCode>(() => {
    const values = Array.isArray(value) ? value : [value];
    const segments = values.reduce<QrSegment[]>((acc, val) => {
      acc.push(...QrSegment.makeSegments(val));
      return acc;
    }, []);
    return QrCode.encodeSegments(segments, ERROR_LEVEL_MAP[level], minVersion, undefined, undefined, boostLevel);
  });

  return reactiveComputed(() => {
    const cs = memoizedQrcode.value.getModules();
    const mg = getMarginSize(marginSize);
    const ncs = cs.length + mg * 2;
    const cis = getImageSettings(cs, size, mg, imageSettings);
    return {
      cells: cs,
      margin: mg,
      numCells: ncs,
      calculatedImageSettings: cis,
      qrcode: memoizedQrcode.value,
    };
  });
};
