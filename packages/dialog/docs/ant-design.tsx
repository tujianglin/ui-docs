/* eslint no-console:0 */
import Dialog from '@vc-com/dialog';
import Select from '@vc-com/select';
import { defineComponent, ref } from 'vue';
import '../../select/docs/assets/index.less';
import './assets/index.less';

const clearPath =
  'M793 242H366v-74c0-6.7-7.7-10.4-12.9' +
  '-6.3l-142 112c-4.1 3.2-4.1 9.4 0 12.6l142 112c' +
  '5.2 4.1 12.9 0.4 12.9-6.3v-74h415v470H175c-4.4' +
  ' 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h618c35.3 0 64-' +
  '28.7 64-64V306c0-35.3-28.7-64-64-64z';

const getSvg = (path: string, props = {}, align = false) => (
  <i {...props}>
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" style={align ? { verticalAlign: '-0.125em ' } : {}}>
      <path d={path} />
    </svg>
  </i>
);

const MyControl = defineComponent(() => {
  const visible1 = ref(false);
  const visible2 = ref(false);
  const visible3 = ref(false);
  const width = ref(600);
  const destroyOnHidden = ref(false);
  const center = ref(false);
  const mousePosition = ref({ x: null, y: null });
  const useIcon = ref(false);
  const forceRender = ref(false);

  const onClick = (e) => {
    mousePosition.value = { x: e.pageX, y: e.pageY };
    visible1.value = true;
  };

  const onClose = () => {
    visible1.value = false;
  };

  const onClose2 = () => {
    visible2.value = false;
  };

  const onClose3 = () => {
    visible3.value = false;
  };

  const closeAll = () => {
    visible1.value = false;
    visible2.value = false;
    visible3.value = false;
  };

  const onDestroyOnHiddenChange = (e) => {
    destroyOnHidden.value = e.target.checked;
  };

  const onForceRenderChange = (e) => {
    forceRender.value = e.target.checked;
  };

  const changeWidth = () => {
    width.value = width.value === 600 ? 800 : 600;
  };

  const centerEvent = (e) => {
    center.value = e.target.checked;
  };

  const toggleCloseIcon = () => {
    useIcon.value = !useIcon.value;
  };

  return () => {
    const style = { width: width.value + 'px' };

    let wrapClassName = '';
    if (center.value) {
      wrapClassName = 'center';
    }
    const dialog = (
      <Dialog
        visible={visible1.value}
        animation="zoom"
        maskAnimation="fade"
        onClose={onClose}
        style={style}
        title="dialog1"
        classNames={{ wrapper: wrapClassName }}
        mousePosition={mousePosition.value}
        destroyOnHidden={destroyOnHidden.value}
        closeIcon={useIcon.value ? getSvg(clearPath, {}, true) : undefined}
        forceRender={forceRender.value}
        focusTriggerAfterClose={false}
      >
        <input autofocus />
        <p>basic modal</p>
        <button
          type="button"
          onClick={() => {
            visible1.value = false;
            visible2.value = true;
          }}
        >
          打开第二个并关闭当前的
        </button>
        <button
          type="button"
          onClick={() => {
            visible2.value = true;
          }}
        >
          打开第二个
        </button>
        <button type="button" onClick={changeWidth}>
          change width
        </button>
        <button type="button" onClick={toggleCloseIcon}>
          use custom icon, is using icon: {(useIcon.value && 'true') || 'false'}.
        </button>
        <div style={{ height: '200px' }}>
          <Select popupStyle={{ zIndex: 9999999 }} options={[{ label: 'Light', value: 'light' }]}></Select>
        </div>
      </Dialog>
    );

    const dialog2 = (
      <Dialog visible={visible2.value} title="dialog2" onClose={onClose2}>
        <input autofocus />
        <p>basic modal</p>
        <button
          type="button"
          onClick={() => {
            visible3.value = true;
          }}
        >
          打开第三个
        </button>
        <button
          type="button"
          onClick={() => {
            visible2.value = false;
          }}
        >
          关闭当前
        </button>
        <button type="button" onClick={closeAll}>
          关闭所有
        </button>
        <button type="button" onClick={changeWidth}>
          change width
        </button>
        <button type="button" onClick={toggleCloseIcon}>
          use custom icon, is using icon: {(useIcon.value && 'true') || 'false'}.
        </button>
        <div style={{ height: '200px' }} />
      </Dialog>
    );

    const dialog3 = (
      <Dialog forceRender title="dialog3" visible={visible3.value} onClose={onClose3}>
        <p>initialized with forceRender and visbile true</p>
        <button
          type="button"
          onClick={() => {
            visible3.value = false;
          }}
        >
          关闭当前
        </button>
        <button type="button" onClick={closeAll}>
          关闭所有
        </button>
        <button type="button" onClick={changeWidth}>
          change width
        </button>
        <button type="button" onClick={toggleCloseIcon}>
          use custom icon, is using icon: {(useIcon.value && 'true') || 'false'}.
        </button>
        <div style={{ height: '200px' }} />
      </Dialog>
    );
    return (
      <div style={{ width: '90%', margin: '0 auto', height: '150vh' }}>
        <style>
          {`
          .center {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          `}
        </style>
        <p>
          <button type="button" class="btn btn-primary" onClick={onClick}>
            show dialog
          </button>
          &nbsp;
          <label>
            destroy on hidden:
            <input type="checkbox" checked={destroyOnHidden.value} onChange={onDestroyOnHiddenChange} />
          </label>
          &nbsp;
          <label>
            center
            <input type="checkbox" checked={center.value} onChange={centerEvent} />
          </label>
          &nbsp;
          <label>
            force render
            <input type="checkbox" checked={forceRender.value} onChange={onForceRenderChange} />
          </label>
          <input placeholder="Useless Input" onClick={onClick} />
        </p>
        {dialog}
        {dialog2}
        {dialog3}
      </div>
    );
  };
});

export default MyControl;
