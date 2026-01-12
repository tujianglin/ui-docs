<script setup lang="ts">
import Animation from './animation.vue';
import AutoPrefix from './auto-prefix.vue';
import Basic from './basic.vue';
import CssVar from './css-var.tsx';
import DiffSalt from './diff-salt.vue';
import Dynamic from './dynamic.tsx';
import FirstRender from './first-render.vue';
import Layer from './layer.vue';
import LogicalProperties from './logical-properties.vue';
import Px2rem from './px2rem.vue';
import Seed from './seed.vue';
import Shadow from './shadow.vue';
import Theme from './theme.vue';
</script>

<template>
  <Story title="CSS-in-JS" label="cssinjs" group="工具" order="1" :cols="2">
    <Variant title="基础用法">
      <Basic />
    </Variant>

    <Variant title="混合主题">
      <Theme />
    </Variant>

    <Variant title="混合 SeedToken">
      <Seed />
    </Variant>

    <Variant title="动态样式">
      <Dynamic />
    </Variant>

    <Variant title="Keyframes 动画">
      <Animation />
    </Variant>

    <Variant title="CSS 变量">
      <CssVar />
    </Variant>

    <Variant title="@layer 支持">
      <Layer />
    </Variant>

    <Variant title="px2rem 转换">
      <Px2rem />
    </Variant>

    <Variant title="Auto Prefix">
      <AutoPrefix />
    </Variant>

    <Variant title="Logical Properties">
      <LogicalProperties />
    </Variant>

    <Variant title="不同 Salt">
      <DiffSalt />
    </Variant>

    <Variant title="Shadow DOM">
      <Shadow />
    </Variant>

    <Variant title="首次渲染性能">
      <FirstRender />
    </Variant>
  </Story>
</template>

<docs lang="md">
# CSS-in-JS

Vue 3 版本的 CSS-in-JS 解决方案，从 Ant Design 的 @ant-design/cssinjs 移植而来。

## 特性

- 样式注册与缓存
- 主题派生 (Theme Derivative)
- CSS 变量支持
- Keyframes 动画
- @layer 支持
- px2rem 转换
- SSR 支持

## 核心 API

### useStyleRegister

注册组件样式到全局样式表。

```ts
import { useStyleRegister } from '@vc-com/cssinjs';

useStyleRegister({ theme, token, hashId, path: ['my-component'] }, () => ({
  '.my-component': {
    color: token.primaryColor,
    padding: '8px 16px',
  },
}));
```

### useCacheToken

缓存主题派生 token。

```ts
import { useCacheToken, createTheme } from '@vc-com/cssinjs';

const theme = createTheme((designToken) => ({
  ...designToken,
  primaryColorDisabled: lighten(designToken.primaryColor, 0.5),
}));

const [token, hashId] = useCacheToken(theme, [designToken], {
  salt: 'my-app',
  cssVar: { prefix: 'my', key: 'theme-key' },
});
```

### Keyframes

创建 CSS 动画。

```ts
import { Keyframes } from '@vc-com/cssinjs';

const fadeIn = new Keyframes('fadeIn', {
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

// 在样式中使用
{
  animationName: fadeIn,
  animationDuration: '0.3s',
}
```

### StyleProvider

提供样式上下文配置。

```vue
<template>
  <StyleProvider :hash-priority="'high'" :layer="true">
    <App />
  </StyleProvider>
</template>
```

## Props (StyleProvider)

| 属性名       | 类型                    | 默认值  | 说明                     |
| ------------ | ----------------------- | ------- | ------------------------ |
| hashPriority | `'low' \| 'high'`       | `'low'` | hash 选择器优先级        |
| layer        | `boolean`               | `false` | 是否使用 @layer 包裹样式 |
| container    | `Element \| ShadowRoot` | -       | 样式注入容器             |
| transformers | `Transformer[]`         | -       | 样式转换器               |
| linters      | `Linter[]`              | -       | 样式检查器               |

## Transformers

- `autoPrefixTransformer` - 自动添加浏览器前缀
- `legacyLogicalPropertiesTransformer` - 逻辑属性转换
- `px2remTransformer` - px 转 rem

## Linters

- `logicalPropertiesLinter` - 检查逻辑属性兼容性
- `legacyNotSelectorLinter` - 检查 :not 选择器兼容性
- `parentSelectorLinter` - 检查父选择器使用
- `NaNLinter` - 检查 NaN 值
</docs>
