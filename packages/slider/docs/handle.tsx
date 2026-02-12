import Slider from '@vc-com/slider';
import type { CSSProperties } from 'vue';
import './assets/index.less';
import TooltipSlider, { handleRender } from './components/TooltipSlider';

const wrapperStyle: CSSProperties = {
  width: '400px',
  margin: '50px',
};

export default () => (
  <div>
    <div style={wrapperStyle}>
      <p>Slider with custom handle</p>
      <Slider min={0} max={20} value={3} handleRender={handleRender} />
    </div>
    <div style={wrapperStyle}>
      <p>Reversed Slider with custom handle</p>
      <Slider min={0} max={20} reverse value={3} handleRender={handleRender} />
    </div>
    <div style={wrapperStyle}>
      <p>Slider with fixed values</p>
      <Slider min={20} value={20} marks={{ 20: 20, 40: 40, 100: 100 }} step={null} />
    </div>
    <div style={wrapperStyle}>
      <p>Range with custom tooltip</p>
      <TooltipSlider range min={0} max={20} value={[3, 10]} tipFormatter={(value) => `${value}!`} />
    </div>
    <div style={wrapperStyle}>
      <p>Keyboard events disabled</p>
      <Slider value={3} keyboard={false} />
    </div>
  </div>
);
