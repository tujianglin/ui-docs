<script setup lang="ts">
import genCalc from '../src/util/calc';
import genMaxMin from '../src/util/maxmin';
import { merge as mergeToken } from '../src/util/statistic';

// ============ Demo 1: Calculator ============
const calcDemo = () => {
  const unitlessCssVar = new Set<string>();
  const calc = genCalc('css', unitlessCssVar);

  const result1 = calc(10).add(5).equal();
  const result2 = calc(100).sub(20).mul(2).equal();
  const result3 = calc(50).div(2).add(10).equal();

  return { result1, result2, result3 };
};

const calcResults = calcDemo();

// ============ Demo 2: MaxMin ============
const maxMinDemo = () => {
  const cssMaxMin = genMaxMin('css');
  const jsMaxMin = genMaxMin('js');

  return {
    cssMax: cssMaxMin.max(10, 20, 30),
    cssMin: cssMaxMin.min(10, 20, 5),
    jsMax: jsMaxMin.max(10, 20, 30),
    jsMin: jsMaxMin.min(10, 20, 5),
  };
};

const maxMinResults = maxMinDemo();

// ============ Demo 3: Token Merge ============
const tokenMergeDemo = () => {
  const baseToken = {
    colorPrimary: '#1890ff',
    fontSize: 14,
  };

  const componentToken = {
    colorPrimary: '#52c41a',
    borderRadius: 4,
  };

  const merged = mergeToken(baseToken, componentToken);
  return merged;
};

const mergedToken = tokenMergeDemo();
</script>

<template>
  <Story title="cssinjs-utils" group="工具">
    <Variant title="Calculator">
      <div class="demo-container">
        <h3>CSS Calculator Demo</h3>
        <p>CSS-in-JS 计算器工具，支持链式调用</p>

        <div class="result-box">
          <div class="result-item">
            <span class="label">calc(10).add(5):</span>
            <code>{{ calcResults.result1 }}</code>
          </div>
          <div class="result-item">
            <span class="label">calc(100).sub(20).mul(2):</span>
            <code>{{ calcResults.result2 }}</code>
          </div>
          <div class="result-item">
            <span class="label">calc(50).div(2).add(10):</span>
            <code>{{ calcResults.result3 }}</code>
          </div>
        </div>

        <pre class="code-block">
import genCalc from '@vc-com/cssinjs-utils';

const calc = genCalc('css', new Set());
const result = calc(10).add(5).equal(); // "15px"
        </pre>
      </div>
    </Variant>

    <Variant title="MaxMin">
      <div class="demo-container">
        <h3>Max/Min 工具</h3>
        <p>生成 CSS max()/min() 函数或 JS Math.max/min</p>

        <div class="result-box">
          <h4>CSS Mode</h4>
          <div class="result-item">
            <span class="label">max(10, 20, '30px'):</span>
            <code>{{ maxMinResults.cssMax }}</code>
          </div>
          <div class="result-item">
            <span class="label">min(10, 20, '5px'):</span>
            <code>{{ maxMinResults.cssMin }}</code>
          </div>

          <h4>JS Mode</h4>
          <div class="result-item">
            <span class="label">max(10, 20, 30):</span>
            <code>{{ maxMinResults.jsMax }}</code>
          </div>
          <div class="result-item">
            <span class="label">min(10, 20, 5):</span>
            <code>{{ maxMinResults.jsMin }}</code>
          </div>
        </div>
      </div>
    </Variant>

    <Variant title="Token Merge">
      <div class="demo-container">
        <h3>Token 合并工具</h3>
        <p>合并多个 token 对象，支持统计追踪</p>

        <div class="result-box">
          <pre>{{ JSON.stringify(mergedToken, null, 2) }}</pre>
        </div>

        <pre class="code-block">
import { merge as mergeToken } from '@vc-com/cssinjs-utils';

const merged = mergeToken(baseToken, componentToken);
        </pre>
      </div>
    </Variant>

    <Variant title="genStyleUtils">
      <div class="demo-container">
        <h3>样式生成工具</h3>
        <p>核心工具函数，用于生成组件样式 hooks</p>

        <pre class="code-block">
import genStyleUtils from '@vc-com/cssinjs-utils';

const { genStyleHooks, genSubStyleComponent } = genStyleUtils({
  usePrefix: () => ({ rootPrefixCls: 'a', iconPrefixCls: 'a-icon' }),
  useToken: () => ({ token, theme, hashId, cssVar }),
});

// 生成组件样式 hook
const useButtonStyle = genStyleHooks('Button', (token, info) => ({
  [`.${info.prefixCls}`]: {
    color: token.colorPrimary,
    fontSize: token.fontSize,
  },
}));
        </pre>
      </div>
    </Variant>
  </Story>
</template>

<style scoped>
.demo-container {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demo-container h3 {
  margin: 0 0 8px;
  color: #1a1a1a;
}

.demo-container h4 {
  margin: 16px 0 8px;
  color: #666;
  font-size: 14px;
}

.demo-container p {
  margin: 0 0 16px;
  color: #666;
}

.result-box {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-family: monospace;
}

code {
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
  color: #1890ff;
  font-family: monospace;
}

.code-block {
  background: #1a1a1a;
  color: #e6e6e6;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
</style>
