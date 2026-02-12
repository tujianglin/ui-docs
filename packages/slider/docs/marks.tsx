import Slider from '@vc-com/slider';
import type { CSSProperties } from 'vue';
import './assets/index.less';

const style: CSSProperties = {
  width: '400px',
  margin: '50px',
};

const marks = {
  '-10': '-10°C',
  0: <strong>0°C</strong>,
  26: '26°C',
  37: '37°C',
  50: '50°C',
  100: {
    style: {
      color: 'red',
    },
    label: <strong>100°C</strong>,
  },
};

function log(value) {
  console.log(value); //eslint-disable-line
}

export default () => (
  <div>
    <div style={style}>
      <p>Slider with marks, `step=null`</p>
      <Slider
        min={-10}
        marks={marks}
        step={null}
        onChange={log}
        value={20}
        onChangeComplete={(v) => console.log('AfterChange:', v)}
      />
    </div>

    <div style={style}>
      <p>Range Slider with marks, `step=null`, pushable, draggableTrack</p>
      <Slider
        range
        min={-10}
        marks={marks}
        step={null}
        onChange={log}
        value={[-10, 0]}
        allowCross={false}
        pushable
        onChangeComplete={(v) => console.log('AfterChange:', v)}
      />
    </div>

    <div style={style}>
      <p>Slider with marks and steps</p>
      <Slider dots min={-10} marks={marks} step={10} onChange={log} value={20} />
    </div>
    <div style={style}>
      <p>Reversed Slider with marks and steps</p>
      <Slider dots reverse min={-10} marks={marks} step={10} onChange={log} value={20} />
    </div>

    <div style={style}>
      <p>Slider with marks, `included=false`</p>
      <Slider min={-10} marks={marks} included={false} value={20} />
    </div>
    <div style={style}>
      <p>Slider with marks and steps, `included=false`</p>
      <Slider min={-10} marks={marks} step={10} included={false} value={20} />
    </div>

    <div style={style}>
      <p>Range with marks</p>
      <Slider range min={-10} marks={marks} onChange={log} value={[20, 25, 30, 40]} />
    </div>
    <div style={style}>
      <p>Range with marks and steps</p>
      <Slider range min={-10} marks={marks} step={10} onChange={log} value={[20, 40]} />
    </div>
  </div>
);
