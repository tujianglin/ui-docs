/* eslint no-console: 0 */
import Rate from '@vc-com/rate';
import './assets/index.less';

function onChange(v: number) {
  console.log('selected star', v);
}

export default () => (
  <div style={{ margin: '50px' }}>
    <h2>Base</h2>
    <Rate defaultValue={2.5} onChange={onChange} style={{ fontSize: '40px' }} allowHalf allowClear={false} />
    <br />
    <Rate defaultValue={2.5} onChange={onChange} style={{ fontSize: '50px', marginTop: '24px' }} allowHalf character="$" />
    <br />
    <Rate
      defaultValue={1}
      onChange={onChange}
      style={{ fontSize: '50px', marginTop: '24px' }}
      character={({ index }) => {
        return index + 1;
      }}
    />
    <br />
    <Rate
      defaultValue={2.5}
      onChange={onChange}
      style={{ fontSize: '50px', marginTop: '24px' }}
      allowHalf
      character={<i class="anticon anticon-star" />}
    />
    <h2>Disabled</h2>
    <Rate
      defaultValue={2}
      onChange={onChange}
      disabled
      style={{ fontSize: '50px', marginTop: '24px' }}
      character={<i class="anticon anticon-star" />}
    />
    <h2>RTL</h2>
    <Rate
      defaultValue={1}
      direction="rtl"
      onChange={onChange}
      allowHalf
      style={{ fontSize: '50px', marginTop: '24px' }}
      character={<i class="anticon anticon-star" />}
    />
  </div>
);
