# DateCycle · 公历农历节气假期对照表

**简体中文** | [English](README.en.md)

![零依赖](https://img.shields.io/badge/dependencies-0-brightgreen)
![零构建](https://img.shields.io/badge/build-none-blue)
![纯静态](https://img.shields.io/badge/web-static-lightgrey)
![数据不出本机](https://img.shields.io/badge/data-local--only-orange)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

> 选好起止日期，一键生成公历 / 农历 / 星期 / 节气 / 中国假期对照表并导出 CSV —— 零依赖、零构建、数据不出本机。

![界面截图](https://cdn.jsdelivr.net/gh/isnotry/DateCycle@main/docs/screenshot.png)

**[在线使用](https://isnotry.github.io/DateCycle/)**

---

## 它是什么

DateCycle 是一个纯前端的日期对照表工具：选好起止日期，生成「公历日期 / 农历日期 / 星期 / 节气 / 中国假期」对照表，并可导出 CSV。

它没有后端、没有构建步骤、没有第三方依赖 —— `index.html` + `script.js` + `database/` 就是全部。

换算数据以 JSON 形式随仓库分发：`database/all.json` 覆盖 1901-01-01 ~ 2100-12-31 共 73,048 天，`database/holidays/{年份}.json` 覆盖 2007 ~ 2027 年的中国法定假期。页面运行时只读同源静态文件，不联网、不注册、不上报。

## 特性

- **纯静态零构建** —— 没有 npm、没有打包器，起个静态服务器就能跑
- **73,048 天农历数据** —— 1901-01-01 到 2100-12-31，含干支纪年、生肖与闰月标记
- **二十四节气** —— 节气当天单列显示，繁体字自动转简体
- **中国法定假期** —— 2007 ~ 2027 逐年数据，区分放假「（休）」与调休上班「（班）」
- **范围可调** —— 日期选择器支持 2000-01-01 ~ 2100-12-31
- **两列可隐藏** —— 「隐藏农历年份」只留月日，「隐藏星期」整列移除，表格与 CSV 同步
- **一键导出 CSV** —— 导出当前范围，文件名带起止日期
- **假期懒加载** —— 只按需请求涉及年份的 `holidays/{年份}.json`，取回后在内存缓存
- **多种数据格式** —— 全量 `all.json` / `all.csv` / `all.bin`，逐年 `json` / `min` / `zip`
- **Docker 一键部署** —— 附带 `Dockerfile` 与 `docker-compose.yml`

## 快速开始

### 在线使用

点击 **[在线使用](https://isnotry.github.io/DateCycle/)** 即可打开，无需安装、不用注册 —— 站点由 GitHub Pages 从仓库 `main` 分支自动发布。

### 本地使用

必须用 HTTP 服务打开：直接双击 `index.html`（`file://` 协议）时浏览器会拦截 `fetch`，页面取不到数据。

```bash
cd DateCycle
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。

### Docker 运行

```bash
docker compose up -d
```

compose 把容器 80 端口映射到宿主机 8080，打开 `http://localhost:8080`。

## 日期对照规则

| 输入 / 操作 | 结果 | 说明 |
|---|---|---|
| `2025-01-01` | 农历「十二月初二」 | 默认勾选「隐藏农历年份」，只显示月 + 日 |
| 取消勾选「隐藏农历年份」 | 农历「甲辰年十二月初二」 | 干支纪年取自数据的 `lunar.year` |
| `2025-07-25` | 农历「闰六月初一」 | 数据里写的是「閏六月」，页面做 閏 → 闰 替换 |
| `2025-01-05` | 节气「小寒」 | 节气只在当天有值，其余日期留空 |
| 数据里写作「驚蟄」 | 页面显示「惊蛰」 | 内置 5 字映射：處暑 / 驚蟄 / 穀雨 / 小滿 / 芒種 |
| `2025-01-26` | 假期「春节（班）」 | `isOffDay: false` —— 调休上班日 |
| `2025-01-28` | 假期「春节（休）」 | `isOffDay: true` —— 放假 |
| `2031-01-01` | 假期列留空 | `holidays/` 只覆盖到 2027 年 |
| `1901-01-01` | 农历「庚子年十一月十一」 | `all.json` 最早一天，但选择器下限是 2000-01-01 |

## 界面说明

| 位置 | 元素 | 作用 |
|---|---|---|
| 表单 | 「开始日期」选择器 | 对照表起点，默认 2025-01-01，可选 2000-01-01 ~ 2100-12-31 |
| 表单 | 「结束日期」选择器 | 对照表终点，默认 2030-01-01 |
| 表单 | 「隐藏农历年份」复选框 | 默认勾选；勾选只显示「月 + 日」，取消后显示「干支年 + 月 + 日」 |
| 表单 | 「隐藏星期」复选框 | 默认勾选；勾选后表格与 CSV 都去掉「星期」列 |
| 表单 | 「生成对照表」按钮 | 按当前范围与选项渲染结果表格 |
| 表单 | 「下载CSV」按钮 | 按当前范围与选项导出 CSV |
| 结果区 | 结果表格 | 五列：公历日期 / 农历日期 / 星期 / 节气 / 中国假期 |
| 结果区 | 「处理中，请稍候...」 | 生成过程中的加载提示 |
| 页脚 | 「GitHub 开源仓库」文字链接 | 新标签页打开本仓库源码 |

## 核心算法口径

```text
农历 / 节气   在 all.json 里按 (gregorian.year, month, date) 查找 → 取 lunar / solarTerm
中国假期      按年份 fetch database/holidays/{年份}.json → 在 days[] 里按 date 匹配 → name + 后缀
CSV 导出      与表格同列，逗号分隔，UTF-8 编码，不带 BOM
```

- 农历文案两个分支：勾选「隐藏农历年份」→ `月 + 日`；取消勾选 → `干支年 + 年 + 月 + 日`
- 节气繁体转简体只覆盖 5 个字：處暑 → 处暑、驚蟄 → 惊蛰、穀雨 → 谷雨、小滿 → 小满、芒種 → 芒种
- 假期后缀由 `isOffDay` 决定：`true` → `（休）`，`false` → `（班）`
- 星期列由浏览器本地计算（`Date.getDay()`），不使用数据里的 `day` 字段
- 导出的文件名固定为 `公历农历节气假期对照表_{起}_{止}.csv`

## 数据与隐私

页面加载后数据全部来自同源静态文件：没有接口调用，没有 `localStorage` / Cookie，没有埋点上报，断网也能正常用。

| 文件 | 内容 | 规模 |
|---|---|---|
| `database/all.json` | 干支纪年 + 农历月日 + 闰月标记 + 节气 + 生肖 | 73,048 天（1901 ~ 2100），约 11 MB |
| `database/holidays/{年份}.json` | 中国法定假期，字段 `days[]{date, name, isOffDay}` | 2007 ~ 2027，共 677 条 |
| `database/all.csv` / `all.bin` | 全量数据的 CSV 版与二进制版 | 约 3.3 MB / 约 360 KB |
| `database/json/`、`json/min/`、`json/zip/` | 逐年拆分：缩进 JSON、单行 JSON、zip 包 | 各 200 个文件（1901 ~ 2100） |
| `database/origin/` | 原始对照表文本 | 200 个文件（1901 ~ 2100） |

页面实际只读 `all.json` 与 `holidays/`；其余是随仓库附带的分发格式。2027 年的假期尚未公布，该文件目前是空数组。

## 目录结构

```text
DateCycle/
├── index.html                     # 页面骨架 + 内联样式
├── script.js                      # 数据加载 / 换算 / 渲染 / CSV 导出
├── database/
│   ├── all.json                   # 全量对照数据（1901 ~ 2100）
│   ├── all.csv                    # 同数据的 CSV 版
│   ├── all.bin                    # 同数据的二进制版
│   ├── holidays/{年份}.json        # 逐年中国法定假期（2007 ~ 2027）
│   ├── json/{年份}.json            # 逐年对照数据（1901 ~ 2100）
│   │   ├── min/{年份}.min.json     # 单行压缩版
│   │   └── zip/{年份}.zip          # zip 压缩包
│   └── origin/{年份}.txt           # 原始对照表文本
├── docs/
│   └── screenshot.png             # README 配图
├── Dockerfile                     # nginx:alpine 静态托管
├── docker-compose.yml             # 映射到宿主机 8080
├── LICENSE                        # MIT
├── README.md                      # 中文说明（本文件）
└── README.en.md                   # 英文说明
```

## 开发说明

- 前端只有一个 `script.js`，纯 DOM 操作、无框架，改完刷新页面即可生效。
- `all.json` 是 11 MB 的单文件，首次打开会全量解析；`solarToLunar()` 与 `getSolarTerm()` 每次都线性遍历数组，范围开到整世纪会明显变慢。
- 更新假期数据：把新的 `{年份}.json` 丢进 `database/holidays/` 就行，前端按年份自动请求，无需改代码。
- 假期数据的字段来自 [holiday-cn](https://github.com/NateScarlet/holiday-cn) 的 schema，保留 `date` / `name` / `isOffDay` 三个字段即可。
- 导出的 CSV 是 UTF-8 但不带 BOM，Windows 版 Excel 双击打开可能中文乱码 —— 用「数据 → 从文本/CSV 导入」并选 UTF-8，或在 `Blob` 内容前置 `\uFEFF`。
- 页脚链接指回上游仓库；如果你 fork 自用，记得把 `index.html` 里那个 `href` 换成自己的地址。

## 浏览器支持

- Chrome / Edge / Firefox / Safari 现代版本均可用，不支持 IE。
- 依赖的能力：`fetch`、`async/await`、`Blob` + `URL.createObjectURL`、`<input type="date">`。
- 必须通过 HTTP(S) 打开：`file://` 下浏览器会拦截 `fetch('database/all.json')`，页面没有数据。
- 已知偏差：日期用 `new Date('YYYY-MM-DD')` 构造（按 UTC 解析）却按本地时间取值，在 UTC 以西的时区会整体偏一天；中国大陆（UTC+8）不受影响。

## 许可

[MIT](LICENSE) © 2026 isnotry
