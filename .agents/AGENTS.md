# Data Constraints

**严格禁止估算与 Mock 数据**：
对于所有的股票、大盘、基本面及金融财务数据，必须通过正式的数据接口（如真实的后端 API、第三方金融数据源）获取真实数据。在任何情况下，**都不允许使用估算、捏造或者 Mock 的方式来生成数据供图表或列表使用**。如果获取不到某个真实数据指标，应当在界面上隐藏该指标或提示“暂无数据”，绝不可进行估算。

# Deployment Constraints

**GitHub Pages 纯静态部署与数据构建**：
针对 GitHub Pages 部署，必须在构建期（Build time）预先拉取各页面所需的数据，并生成静态 `.json` 文件放置于 `public/data/` 目录下，前端必须通过区分专属演示环境（`import.meta.env.VITE_APP_ENV === 'ghpages'`）进行数据降级读取，因为 GitHub Pages 不支持任何动态 Node.js 后端。真实的生产环境（`import.meta.env.PROD`）不应受此影响，应继续使用动态接口。
