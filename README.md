# E-Tools 金融投资工具箱

> 一个极简而强大的个人金融投资管理与复盘工具箱，支持局域网部署。集成了自选股管理、复盘笔记、复利计算与公司估值等核心功能，帮助您在波动的市场中保持纪律，沉淀策略。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vuedotjs)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)](https://www.sqlite.org/)

**[🚀 在线演示 Demo](https://and80506.github.io/E-Tools/)**
> *💡 提示：在线演示版由于无后端服务支撑，采用了纯前端模拟数据，您在页面中的任何操作修改不会被真正持久化，请随意点击体验界面的各项交互功能。*

---

## 项目简介

E-Tools 是一款专为个人投资者设计的工具箱，主要用于本地局域网环境下的投资辅助与复盘管理。无论您是价值投资者还是趋势交易者，都可以通过本工具记录投资日常、进行财务演算，进而构建属于自己的交易系统。所有数据默认基于 SQLite 存储于本地，充分保障投资隐私。

---

## 功能亮点

### 📊 股票自选管理
- 一键添加自选股，随时追踪关注标的
- 股票代码直达东方财富网，快速查看详细行情
- 自定义多维标签分类（如：白马股、短线、观察仓）
- 界面简洁、操作顺滑的列表管理

### 📝 沉浸式复盘笔记
- **全局复盘**：记录每日大盘走势、行业轮动、整体投资策略及心态感悟
- **个股专属复盘**：精准追踪某只个股的技术面、基本面或交易计划
- 智能焦点快捷键支持（按下 `Cmd/Ctrl + S` 即可实现局部保存）
- 日历热力图高亮：复盘历史一目了然，支持快速前后跳转查阅
- 全屏沉浸模式，排除干扰，专注总结

### 🧮 复利财富模拟计算器
- 直观的复利收益演算工具
- 动态调整年化收益率与投资年限，规划您的长期财富增长目标

### 📈 公司估值反推 (段永平法)
- 提供基于自由现金流折现（DCF）原理的简易估值模型
- 根据现价反推市场隐含的增长率预期，辅助评估安全边际

### 🛡️ 局域网服务与隐私
- 提供一键启动脚本 (`start.sh`)
- 支持在本机或家庭/办公室局域网设备间共享访问
- 纯本地数据存储 (SQLite / JSON Fallback)，数据完全由您掌控

---

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/your-username/e-tools.git
cd e-tools

# 2. 安装服务端与前端依赖
npm install

# 3. 快速启动 (将同时启动前端预览与后端 API 服务)
./start.sh
```

> **注意：** 启动后，终端会打印出本地访问地址及局域网 IP 地址，您可以直接在电脑、平板或手机浏览器中访问使用。

---

## 项目结构

```text
e-tools/
├── server/               # 后端 Express API 服务
│   ├── index.js          # 服务入口
│   ├── db.js             # SQLite 数据库服务
│   └── routes/           # API 路由模块
├── src/                  # 前端 Vue 3 源码
│   ├── api/              # 前端 API 接口封装
│   ├── components/       # 页面与组件 (复盘、自选股等)
│   ├── App.vue           # 根组件及布局
│   └── main.js           # Vue 应用入口
├── start.sh              # 一键启动脚本
└── package.json          # 项目依赖配置
```

---

## 贡献指南

欢迎任何形式的贡献！如果您发现了 Bug 或是对功能有新的想法，请随时提交 Issue 或 Pull Request。

## 许可证

本项目基于 [MIT License](LICENSE) 许可协议开源。
