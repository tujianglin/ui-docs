// oxlint-disable no-unused-vars
import { defineComponent } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import AjaxUploader from './AjaxUploader';
import type { RcFile, UploadProps } from './interface';

function empty() {}

export default defineComponent(
  // @ts-ignore
  ({
    component = 'span',
    prefixCls = 'rc-upload',
    data = {},
    headers = {},
    name = 'file',
    onStart = empty,
    onError = empty,
    onSuccess = empty,
    beforeUpload = null,
    customRequest = null,
    withCredentials = false,
    openFileDialogOnClick = true,
    hasControlInside = false,
    multiple = false,
  }: UploadProps) => {
    const props = useFullProps() as UploadProps;
    const uploader = useRef();

    const abort = (file: RcFile) => {
      uploader.value.abort(file);
    };

    defineExpose({
      abort,
    });

    return () => (
      <AjaxUploader {...props} ref={uploader}>
        <slot></slot>
      </AjaxUploader>
    );
  },
);
