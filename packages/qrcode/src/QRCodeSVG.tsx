import { reactiveComputed } from '@vueuse/core';
import { defineComponent } from 'vue';
import { useQRCode } from './hooks/useQRCode';
import type { QRPropsSVG } from './interface';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FRONT_COLOR,
  DEFAULT_LEVEL,
  DEFAULT_MINVERSION,
  DEFAULT_SIZE,
  excavateModules,
  generatePath,
} from './utils';

const QRCodeSVG = defineComponent(
  ({
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    bgColor = DEFAULT_BACKGROUND_COLOR,
    fgColor = DEFAULT_FRONT_COLOR,
    minVersion = DEFAULT_MINVERSION,
    title,
    marginSize,
    imageSettings,
    boostLevel,
    ...otherProps
  }: QRPropsSVG) => {
    const { margin, cells, numCells, calculatedImageSettings } = $(
      useQRCode(
        reactiveComputed(() => ({
          value,
          level,
          minVersion,
          marginSize,
          imageSettings,
          size,
          boostLevel,
        })),
      ),
    );

    return () => {
      let cellsToDraw = cells;
      let image = null;
      if (imageSettings != null && calculatedImageSettings != null) {
        if (calculatedImageSettings.excavation != null) {
          cellsToDraw = excavateModules(cells, calculatedImageSettings.excavation);
        }

        image = (
          <image
            href={imageSettings.src}
            height={calculatedImageSettings.h}
            width={calculatedImageSettings.w}
            x={calculatedImageSettings.x + margin}
            y={calculatedImageSettings.y + margin}
            preserveAspectRatio="none"
            opacity={calculatedImageSettings.opacity}
            // when crossOrigin is not set, the image will be tainted
            // and the canvas cannot be exported to an image
            crossOrigin={calculatedImageSettings.crossOrigin}
          />
        );
      }

      const fgPath = generatePath(cellsToDraw, margin);

      return (
        <svg height={size} width={size} viewBox={`0 0 ${numCells} ${numCells}`} role="img" {...otherProps}>
          {!!title && <title>{title}</title>}
          <path fill={bgColor} d={`M0,0 h${numCells}v${numCells}H0z`} shape-rendering="crispEdges" />
          <path fill={fgColor} d={fgPath} shape-rendering="crispEdges" />
          {image}
        </svg>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'QRCodeSVG' : undefined },
);

export { QRCodeSVG };
