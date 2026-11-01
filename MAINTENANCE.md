# 维护主页

这是 `ccwbb78/ccwbb78` 主页 README 的源文件。生成后的 README 和图片已随仓库提供，上传后即可显示，无需先安装依赖。

## 修改内容

修改 `profile.json` 中的简介、项目、技术栈、编码时长或代码量估计，然后使用 Node.js 22 或更高版本运行：

```sh
npm run build
npm run check
```

不需要 `npm install`；没有第三方运行依赖。`README.md` 和 `assets/generated/` 由脚本生成，直接修改它们会在下次生成时被覆盖。

## 数据口径

- GitHub 卡片是近三个月贡献口径（滚动窗口），不是所有分支的全历史提交总数。
- 当公开贡献图能够支持精确的全提交分类时显示 `Commits`，否则显示 `Contributions`，避免将 issue、PR 等贡献误算为提交。
- `Active Days` 为同一区间内至少有一次贡献的日期数。
- `Code Time` 和 `AI Code Time` 当前为手动快照，更新时间在 `profile.json` 中。尚未接入 WakaTime 自动更新，两项可能重叠，不应相加。
- `Lines Added (est.)` 是数量级估计，当前约 50,000 行，不是逐提交计算的精确结果。可在拿到精确值后修改配置与标签；不把上游导入的整个仓库归为个人新增代码。

## 自动更新 GitHub 统计

`.github/workflows/update-profile.yml` 每天北京时间约 10:17 运行，也可在 Actions 中手动执行。计划任务可能延迟。

只读取公开的贡献图聚合和两个公开项目的元数据，不需要个人访问令牌，也不会克隆或读取私有仓库。只使用内置 `GITHUB_TOKEN` 提交本仓库生成结果。若统计页面结构改变、网络失败或数据校验不通过，任务失败并保留上次结果。

本地手动刷新：

```sh
npm test
npm run update
npm run check
```

首次上传时保留 `.github` 文件夹。Actions 需要本仓库允许工作流写入内容；若组织策略或分支保护阻止写入，可以使用本地刷新后自行提交的方式。

## 文件范围

公开文件：README、配置、聚合数据、脚本、工作流和图片。技术图标取自 Devicon v2.16.0，许可随 `assets/icons/LICENSE.devicon.txt` 提供。

`.local/` 是本地方案与检查资料，已加入 `.gitignore`，不属于上传内容。后续添加项目时，只写允许公开的名称、描述和技术栈；不要放入内部文档、运行配置、账号数据或密钥。
