import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, ref, watch, watchEffect, type CSSProperties } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import { useQRCode } from './hooks/useQRCode';
import type { QRPropsCanvas } from './interface';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FRONT_COLOR,
  DEFAULT_LEVEL,
  DEFAULT_MINVERSION,
  DEFAULT_SIZE,
  excavateModules,
  generatePath,
  isSupportPath2d,
} from './utils';

const QRCodeCanvas = defineComponent(
  ({
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    bgColor = DEFAULT_BACKGROUND_COLOR,
    fgColor = DEFAULT_FRONT_COLOR,
    minVersion = DEFAULT_MINVERSION,
    marginSize,
    style,
    imageSettings,
    boostLevel,
    ...otherProps
  }: QRPropsCanvas) => {
    const imgSrc = computed(() => imageSettings?.src);
    const _canvas = useRef<HTMLCanvasElement>(null);
    const _image = useRef<HTMLImageElement>(null);

    const isImageLoaded = ref(false);

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

    watchEffect(() => {
      if (_canvas.value) {
        const canvas = _canvas.value;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return;
        }

        let cellsToDraw = cells;
        const image = _image.value;
        const haveImageToRender =
          isImageLoaded.value &&
          calculatedImageSettings != null &&
          image !== null &&
          image.complete &&
          image.naturalHeight !== 0 &&
          image.naturalWidth !== 0;

        if (haveImageToRender) {
          if (calculatedImageSettings.excavation != null) {
            cellsToDraw = excavateModules(cells, calculatedImageSettings.excavation);
          }
        }

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.height = canvas.width = size * pixelRatio;
        const scale = (size / numCells) * pixelRatio;
        ctx.scale(scale, scale);

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, numCells, numCells);

        ctx.fillStyle = fgColor;
        if (isSupportPath2d) {
          ctx.fill(new Path2D(generatePath(cellsToDraw, margin)));
        } else {
          cells.forEach((row, rdx) => {
            row.forEach((cell, cdx) => {
              if (cell) {
                ctx.fillRect(cdx + margin, rdx + margin, 1, 1);
              }
            });
          });
        }

        if (calculatedImageSettings) {
          ctx.globalAlpha = calculatedImageSettings.opacity;
        }

        if (haveImageToRender) {
          ctx.drawImage(
            image,
            calculatedImageSettings.x + margin,
            calculatedImageSettings.y + margin,
            calculatedImageSettings.w,
            calculatedImageSettings.h,
          );
        }
      }
    });

    watch(
      imgSrc,
      () => {
        isImageLoaded.value = false;
      },
      { immediate: true },
    );

    const canvasStyle = computed<CSSProperties>(() => ({
      height: `${size}px`,
      width: `${size}px`,
      ...style,
    }));

    return () => (
      <>
        <canvas style={canvasStyle.value} height={size} width={size} ref={_canvas} role="img" {...otherProps} />
        <img
          v-if={imgSrc.value !== null}
          alt="QR-Code"
          src={imgSrc.value}
          key={imgSrc.value}
          style={{ display: 'none' }}
          onLoad={() => {
            isImageLoaded.value = true;
          }}
          ref={_image}
          // when crossOrigin is not set, the image will be tainted
          // and the canvas cannot be exported to an image
          cross-origin={calculatedImageSettings?.crossOrigin}
        />
      </>
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  QRCodeCanvas.displayName = 'QRCodeCanvas';
}

export { QRCodeCanvas };
