# Repository Guidelines

## 项目结构与模块组织

- `src/` 为组件源码与导出入口，主要入口是 `src/index.ts`。
- `src/components/` 存放单个组件（多为 `.tsx`）。
- `playground/` 用于本地示例与交互验证。
- `public/` 与 `index.html` 为静态资源与 Vite 入口。
- `dist/` 为构建产物输出目录。

## 开发、构建与预览

使用 `pnpm` 作为包管理器。

- `pnpm dev`：启动 Vite 开发服务并加载 `playground/`。
- `pnpm build`：构建生产包并生成类型定义。
- `pnpm build:types`：仅生成类型定义（`tsconfig.build.json`）。
- `pnpm preview`：本地预览构建产物。

## 代码风格与命名约定

- 统一由 ESLint + oxlint/oxfmt + Prettier 管理格式与质量；`lefthook` 在提交前自动修复。
- Prettier 关键约定：单引号、行宽 130、结尾分号、尾随逗号。
- 组件文件名使用 PascalCase（例：`src/components/Input.tsx`）。
- Vue 规则：组件名 PascalCase、props 使用 camelCase、模板事件使用短横线（例：`update:model-value`）。

## 测试指南

当前仓库未配置测试脚本或测试框架。若新增测试，建议使用 `*.spec.ts` 或 `tests/` 目录，并在 `package.json` 中补充 `pnpm test` 等脚本说明。

## 提交与 Pull Request 指南

- 采用 Conventional Commits，类型限定为：feat、fix、docs、style、refactor、perf、test、build、ci、chore、revert。
- 推荐使用 `pnpm commit`（触发 `lefthook` 与 `czg`），提交信息需包含清晰的 subject。
- PR 需包含：变更说明、关联 issue、UI 变更截图/录屏（如有）、破坏性变更说明，以及必要的 `playground/` 示例更新。
