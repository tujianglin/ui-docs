import { reactiveComputed } from '@vueuse/core';
import clsx from 'clsx';
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useFullProps, useRef, type DragEvent, type KeyboardEvent, type MouseEvent } from 'vue-jsx-vapor';
import pickAttrs from '../../util/src/pickAttrs';
import attrAccept from './attr-accept';
import type { AcceptConfig, BeforeUploadFileType, RcFile, UploadProgressEvent, UploadProps } from './interface';
import defaultRequest from './request';
import traverseFileTree from './traverseFileTree';
import getUid from './uid';

interface ParsedFileInfo {
  origin: RcFile;
  action: string | null;
  data: Record<string, unknown> | null;
  parsedFile: RcFile | null;
}

const AjaxUploader = defineComponent(
  ({
    component: Tag,
    prefixCls,
    class: className,
    classNames = {},
    disabled,
    id,
    name,
    style,
    styles = {},
    multiple,
    accept,
    capture,
    directory,
    openFileDialogOnClick,
    onMouseenter,
    onMouseleave,
    hasControlInside,
    ...otherProps
  }: UploadProps) => {
    const props = useFullProps() as UploadProps;
    const state = reactive({ uid: getUid() });

    const reqs = ref<Record<string, any>>({});

    const fileInput = useRef();

    const _isMounted = ref();

    const filterFile = (file: RcFile | File, force = false) => {
      const { accept, directory } = props;

      let filterFn: Exclude<AcceptConfig['filter'], 'native'>;
      let acceptFormat: string | undefined;

      if (typeof accept === 'string') {
        acceptFormat = accept;
      } else {
        const { filter, format } = accept || {};

        acceptFormat = format;
        if (filter === 'native') {
          filterFn = () => true;
        } else {
          filterFn = filter;
        }
      }

      const mergedFilter =
        filterFn || (directory || force ? (currentFile: RcFile) => attrAccept(currentFile, acceptFormat) : () => true);
      return mergedFilter(file as RcFile);
    };

    function onChange(e) {
      const { files } = e.target;
      const acceptedFiles = [...files].filter((file) => filterFile(file));
      uploadFiles(acceptedFiles);
      reset();
    }

    function onClick(event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) {
      const el = fileInput.value;
      if (!el) {
        return;
      }

      const target = event.target as HTMLElement;

      if (target && target.tagName === 'BUTTON') {
        const parent = el.parentNode as HTMLInputElement;
        parent.focus();
        target.blur();
      }
      el.click();
      if (props?.onClick) {
        props?.onClick?.(event);
      }
    }

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        onClick(e);
      }
    };

    const onDataTransferFiles = async (dataTransfer: DataTransfer | null, existFileCallback?: () => void) => {
      if (!dataTransfer) return;

      const items: DataTransferItem[] = [...(dataTransfer.items || [])];
      let files: File[] = [...(dataTransfer.files || [])];

      if (files.length > 0 || items.some((item) => item.kind === 'file')) {
        existFileCallback?.();
      }

      if (directory) {
        files = await traverseFileTree(Array.prototype.slice.call(items), (currentFile: RcFile) => filterFile(currentFile));
        uploadFiles(files);
      } else {
        let acceptFiles = [...files].filter((file) => filterFile(file, true));
        if (multiple === false) {
          acceptFiles = files.slice(0, 1);
        }

        uploadFiles(acceptFiles);
      }
    };

    const onFilePaste = async (e: ClipboardEvent) => {
      const { pastable } = props;

      if (!pastable) {
        return;
      }

      if (e.type === 'paste') {
        const clipboardData = (e as ClipboardEvent).clipboardData;
        return onDataTransferFiles(clipboardData, () => {
          e.preventDefault();
        });
      }
    };

    const onFileDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const onFileDrop = async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (e.type === 'drop') {
        const dataTransfer = (e as DragEvent<HTMLDivElement>).dataTransfer;

        return onDataTransferFiles(dataTransfer);
      }
    };

    onMounted(() => {
      _isMounted.value = true;

      if (otherProps.pastable) {
        document.addEventListener('paste', onFilePaste);
      }
    });

    onBeforeUnmount(() => {
      _isMounted.value = false;
      abort();
      document.removeEventListener('paste', onFilePaste);
    });

    watch(
      () => otherProps.pastable,
      (val, oVal) => {
        if (val && !oVal) {
          document.addEventListener('paste', onFilePaste);
        } else if (!val && oVal) {
          document.removeEventListener('paste', onFilePaste);
        }
      },
    );

    const uploadFiles = (files: File[]) => {
      const originFiles = [...files] as RcFile[];
      const postFiles = originFiles.map((file: RcFile & { uid?: string }) => {
        // eslint-disable-next-line no-param-reassign
        file.uid = getUid();
        return processFile(file, originFiles);
      });

      // Batch upload files
      Promise.all(postFiles).then((fileList) => {
        const { onBatchStart } = props;

        onBatchStart?.(fileList.map(({ origin, parsedFile }) => ({ file: origin, parsedFile })));

        fileList
          .filter((file) => file.parsedFile !== null)
          .forEach((file) => {
            post(file);
          });
      });
    };

    /**
     * Process file before upload. When all the file is ready, we start upload.
     */
    const processFile = async (file: RcFile, fileList: RcFile[]): Promise<ParsedFileInfo> => {
      const { beforeUpload } = props;

      let transformedFile: BeforeUploadFileType | void = file;
      if (beforeUpload) {
        try {
          transformedFile = await beforeUpload(file, fileList);
        } catch {
          // Rejection will also trade as false
          transformedFile = false;
        }
        if (transformedFile === false) {
          return {
            origin: file,
            parsedFile: null,
            action: null,
            data: null,
          };
        }
      }

      // Get latest action
      const { action } = props;
      let mergedAction: string;
      if (typeof action === 'function') {
        mergedAction = await action(file);
      } else {
        mergedAction = action;
      }

      // Get latest data
      const { data } = props;
      let mergedData: Record<string, unknown>;
      if (typeof data === 'function') {
        mergedData = await data(file);
      } else {
        mergedData = data;
      }

      const parsedData =
        // string type is from legacy `transformFile`.
        // Not sure if this will work since no related test case works with it
        (typeof transformedFile === 'object' || typeof transformedFile === 'string') && transformedFile ? transformedFile : file;

      let parsedFile: File;
      if (parsedData instanceof File) {
        parsedFile = parsedData;
      } else {
        parsedFile = new File([parsedData], file.name, { type: file.type });
      }

      const mergedParsedFile: RcFile = parsedFile as RcFile;
      mergedParsedFile.uid = file.uid;

      return {
        origin: file,
        data: mergedData,
        parsedFile: mergedParsedFile,
        action: mergedAction,
      };
    };

    function post({ data, origin, action, parsedFile }: ParsedFileInfo) {
      if (!_isMounted) {
        return;
      }

      const { onStart, customRequest, name, headers, withCredentials, method } = props;

      const { uid } = origin;

      const request = customRequest || defaultRequest;

      const requestOption = {
        action,
        filename: name,
        data,
        file: parsedFile,
        headers,
        withCredentials,
        method: method || 'post',
        onProgress: (e: UploadProgressEvent) => {
          const { onProgress } = props;
          onProgress?.(e, parsedFile);
        },
        onSuccess: (ret, xhr) => {
          const { onSuccess } = props;
          onSuccess?.(ret, parsedFile, xhr);

          delete reqs.value[uid];
        },
        onError: (err, ret: any) => {
          const { onError } = props;
          onError?.(err, ret, parsedFile);

          delete reqs.value[uid];
        },
      };

      onStart(origin);
      reqs.value[uid] = request(requestOption, { defaultRequest });
    }

    function reset() {
      state.uid = getUid();
    }

    const abort = (file?: any) => {
      if (file) {
        const uid = file.uid ? file.uid : file;
        if (reqs.value[uid] && reqs.value[uid].abort) {
          reqs.value[uid].abort();
        }
        delete reqs.value[uid];
      } else {
        Object.keys(reqs.value).forEach((uid) => {
          if (reqs.value[uid] && reqs.value[uid].abort) {
            reqs.value[uid].abort();
          }
          delete reqs.value[uid];
        });
      }
    };
    // Extract accept format for input element
    const acceptFormat = computed(() => (typeof accept === 'string' ? accept : accept?.format));
    const cls = computed(() =>
      clsx({
        [prefixCls!]: true,
        [`${prefixCls}-disabled`]: disabled,
        [className!]: className,
      }),
    );
    // because input don't have directory/webkitdirectory type declaration
    const dirProps = reactiveComputed(() => (directory ? { directory: 'directory', webkitdirectory: 'webkitdirectory' } : {}));
    const events = reactiveComputed(() =>
      disabled
        ? {}
        : {
            onClick: openFileDialogOnClick ? onClick : () => {},
            onKeydown: openFileDialogOnClick ? onKeyDown : () => {},
            onMouseenter,
            onMouseleave,
            onDrop: onFileDrop,
            onDragover: onFileDragOver,
            tabindex: hasControlInside ? undefined : '0',
          },
    );
    return () => (
      <Tag {...events} class={cls.value} role={hasControlInside ? undefined : 'button'} style={style}>
        <input
          {...pickAttrs(otherProps, { aria: true, data: true })}
          id={id}
          /**
           * https://github.com/ant-design/ant-design/issues/50643,
           * https://github.com/react-component/upload/pull/575#issuecomment-2320646552
           */
          name={name}
          disabled={disabled}
          type="file"
          ref={fileInput}
          onClick={(e) => e.stopPropagation()} // https://github.com/ant-design/ant-design/issues/19948
          key={state.uid}
          style={{ display: 'none', ...styles.input }}
          class={classNames.input}
          accept={acceptFormat.value}
          {...dirProps}
          multiple={multiple}
          onChange={onChange}
          {...(capture != null ? { capture } : {})}
        />
        <slot></slot>
      </Tag>
    );
  },
);

export default AjaxUploader;
