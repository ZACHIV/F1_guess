# Turn 1 猜赛道准备清单

更新时间：2026-04-20

## 目标

先做一个单玩法版本：
- 只做 `根据一号弯猜赛道`
- 不和现有“整圈音频猜赛道”强绑定
- 优先复用仓库现有题库、赛道 SVG、telemetry、答题和结果页能力

补充约束：
- 题面必须保留足够准确的赛道边界与角点形状，不能只靠中心线路径或粗略轨迹。
- 仅凭“右转 90 度”这类抽象几何不足以区分赛道；需要能看出边界、外沿、内角、路面宽度变化等信息。

## 现在已经有的

### 1. 已有完整的“猜赛道”主游戏壳

- 主应用已经能加载题库、随机出题、提交答案、显示结果页。
- 当前可玩的 challenge 必须具备赛道 SVG 和 telemetry 资源。

证据：
- [src/player/App.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/App.jsx) `getPlayableChallenges()` 只要求 `trackSvgSrc`、`telemetryLocationSrc`、`telemetryCarDataSrc`，说明现有玩法核心依赖已经齐全。
- [src/player/App.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/App.jsx#L78) 到 [src/player/App.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/App.jsx#L87)

### 2. 现有题库覆盖 24 条赛道

- `src/data/challenge-library.json` 里已有 24 条 challenge。
- 当前分类都还是 `Race Pole Onboard`，但每条记录都带赛道名、国家、SVG、location telemetry、car telemetry。

证据：
- [src/data/challenge-library.json](/home/zhangzheng/0_platform/personal/F1_guess/src/data/challenge-library.json)
- 当前盘点结果：24 条记录，24 条不同赛道。

### 3. 现成的赛道可视化基础已经可复用

- 现在的轨迹图不是依赖静态背景图，而是用 telemetry 点动态归一化后画出来。
- 这意味着现有渲染基础设施可以复用，但它只能证明“能画路径”，不能证明“题面精度足够”。

证据：
- [src/lib/telemetry-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/lib/telemetry-utils.js#L18) 到 [src/lib/telemetry-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/lib/telemetry-utils.js#L50)
- [src/player/components/TrackHUD.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/TrackHUD.jsx#L49) 到 [src/player/components/TrackHUD.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/TrackHUD.jsx#L70)

补充判断：
- telemetry 轨迹和当前 HUD 更适合表现赛车行进路线，不适合作为边界敏感型 Turn 1 题面的最终素材来源。

### 4. 现有答案判定和多语言已经能直接复用

- 用户输入支持赛道名、国家名、别名、中文别名。
- 这部分不用为 Turn 1 模式重写。

证据：
- [src/player/answer-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/player/answer-utils.js#L45) 到 [src/player/answer-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/player/answer-utils.js#L72)

### 5. 现有交互和结果页也大体可复用

- 当前已有开始、暂停、重播、投降、提交答案、结果揭晓、下一题这些完整流程。
- 结果页已有赛道揭晓和赛道说明文案。

证据：
- [src/player/components/InteractionDock.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/InteractionDock.jsx#L47) 到 [src/player/components/InteractionDock.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/InteractionDock.jsx#L116)
- [src/player/components/ResultReviewPage.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/ResultReviewPage.jsx#L93) 到 [src/player/components/ResultReviewPage.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/ResultReviewPage.jsx#L129)
- [src/player/track-notes.js](/home/zhangzheng/0_platform/personal/F1_guess/src/player/track-notes.js)

### 6. 现有 Studio / 题库管理可以继续承接新玩法

- 题库读写、排序、复制、编辑都已经有。
- 这意味着 Turn 1 模式优先应该扩展 challenge schema，而不是另起一套数据源。

证据：
- [server/lib/challenge-library.mjs](/home/zhangzheng/0_platform/personal/F1_guess/server/lib/challenge-library.mjs)
- [src/studio.js](/home/zhangzheng/0_platform/personal/F1_guess/src/studio.js#L9) 到 [src/studio.js](/home/zhangzheng/0_platform/personal/F1_guess/src/studio.js#L33)

## 现在还缺什么

### 1. 缺 Turn 1 模式自己的数据字段

当前 challenge schema 只有“整圈音频猜赛道”所需字段，没有 Turn 1 专用字段，例如：
- `gameMode`
- `segmentStartMs`
- `segmentEndMs`
- `turnNumber`
- `cornerName`
- `focusType`
- `focusBounds` 或 `focusTelemetryWindow`
- `revealLabel`

当前没有这些字段的直接证据：
- [src/lib/challenge-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/lib/challenge-utils.js)
- [src/studio.js](/home/zhangzheng/0_platform/personal/F1_guess/src/studio.js#L9) 到 [src/studio.js](/home/zhangzheng/0_platform/personal/F1_guess/src/studio.js#L33)

### 2. 缺“一号弯题面素材”的生成方式

虽然现有 telemetry 足够画出轨迹，但仓库里还没有：
- 高精度赛道边界数据源
- 从精确赛道边界里裁出一号弯局部的脚本
- 统一的 Turn 1 题面导出逻辑

当前现有 SVG 来源也不足以直接满足这个要求：
- 当前 challenge 统一写的是 `F1DB white-outline track SVG`
- 本地导入逻辑也只会从 `submodule/f1db/src/assets/circuits/white-outline` 复制资源
- 这类资源更接近风格化轮廓图，不是为“边界细节辨识”设计的精确赛道 footprint

证据：
- [server/lib/f1db-local.mjs](/home/zhangzheng/0_platform/personal/F1_guess/server/lib/f1db-local.mjs#L139) 到 [server/lib/f1db-local.mjs](/home/zhangzheng/0_platform/personal/F1_guess/server/lib/f1db-local.mjs#L160)
- [submodule/f1db/README.md](/home/zhangzheng/0_platform/personal/F1_guess/submodule/f1db/README.md#L113) 到 [submodule/f1db/README.md#L123](/home/zhangzheng/0_platform/personal/F1_guess/submodule/f1db/README.md#L123)
- [src/data/challenge-library.json](/home/zhangzheng/0_platform/personal/F1_guess/src/data/challenge-library.json)

这部分是最关键的实现空缺。

### 3. 缺 Turn 1 模式自己的交互文案和规则

当前文案明显围绕“听音频猜赛道”：
- helper copy 提示用户按播放键听引擎声
- 交互上默认有播放、暂停、重播
- 结果页现在还保留“与 Max 比拼时间”的叙事

证据：
- [src/lib/challenge-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/lib/challenge-utils.js#L10) 到 [src/lib/challenge-utils.js](/home/zhangzheng/0_platform/personal/F1_guess/src/lib/challenge-utils.js#L16)
- [src/player/game-config.js](/home/zhangzheng/0_platform/personal/F1_guess/src/player/game-config.js)
- [src/player/components/InteractionDock.jsx](/home/zhangzheng/0_platform/personal/F1_guess/src/player/components/InteractionDock.jsx)

### 4. 缺 Turn 1 的题库来源标准

要先确定一号弯题面究竟基于什么来源：
- 方案 A：高精度赛道边界矢量图
- 方案 B：真实赛道平面图 / CAD 风格图 / 可验证的 corner map
- 方案 C：真实赛道截图 / 卫星图 / 官方转播画面

原先考虑过“用 telemetry 轨迹切片”这条路，但在边界精度要求下应视为不满足玩法要求。

目前最缺的是统一、可信、可批量处理的赛道边界素材。

### 5. 缺玩法层面的难度设计

还没有定义这些规则：
- 是开放输入还是四选一
- 每题是否限时
- 是否允许跳过
- 一轮几题
- 是否显示弯名揭晓，例如 `La Source` / `Abbey`
- 是否先做单题 demo，再做连续闯关

这部分还没进代码，也还没形成仓库内规格文档。

## 最务实的 MVP 路线

建议先做一个最小版本：

### 题面

- 不再使用 telemetry 局部轨迹作为最终题面
- 先建立一套高精度赛道边界素材
- 再从边界素材里裁出一号弯局部图

### 交互

- 一题一屏
- 四选一优先
- 保留现有开始 / 提交 / 下一题骨架
- 去掉音频播放相关控件

### 数据

每条 challenge 先补一组最小字段：
- `gameMode: "turn-1-track"`
- `turnNumber: 1`
- `cornerName`
- `cornerAssetSrc`
- `cornerCropBounds`
- `sourceType`
- `sourceVersion`
- `options`

### 结果页

- 揭晓赛道名
- 揭晓 1 号弯名字
- 显示完整赛道边界图，并高亮题面对应片段

## 推荐优先级

1. 先确定高精度赛道边界素材的来源和格式
2. 再做一号弯裁图规范
3. 再补 challenge schema
4. 再做 Turn 1 专用 UI

## 一号弯切割方案

现在真正要解决的不是“有没有足够精度的 SVG”，而是“如何稳定拿到 Turn 1 的局部视窗”。

### 推荐路线：半自动定位 + 手工微调

不要一开始追求全自动识别所有赛道的一号弯。

更稳的做法是：
- 用程序先给出一个 `Turn 1` 候选裁切框
- 在 Studio 里人工微调
- 把最终结果存成数据，而不是每次运行时现算

这样做的原因：
- 各赛道的起终点附近结构差异很大
- 有些一号弯是明显的急弯，有些是高速变向或复合弯
- 即使几何上找到了“第一个大曲率点”，题面是否“好猜”仍然需要人工判断

### 技术上怎么切

建议基于 SVG path 几何，而不是基于像素截图。

具体流程：

1. 读取主 path
- 当前赛道 SVG 基本都是一个主 `path`。
- 可以直接取第一个可见 path 的 `d`。

2. 在浏览器里测量路径
- 用原生 `SVGPathElement.getTotalLength()`
- 用原生 `SVGPathElement.getPointAtLength()`
- 这样不需要新依赖

3. 沿路径均匀采样
- 例如每 2 到 4 像素采一个点
- 为每个点计算切线方向
- 再计算相邻切线的转角变化，得到“曲率强度”

4. 找起终点之后的第一个有效弯
- 从路径起点向前扫描
- 先跳过起跑直线上的低曲率区域
- 找到第一个累计转角超过阈值的连续区间
- 把这个区间视为 `Turn 1` 候选段

5. 扩展为题面裁切框
- 取候选段全部采样点的包围盒
- 再加 padding
- padding 不能只贴着弯本身，要保留进弯、弯心、出弯的边界形状
- 输出为 `x/y/width/height`

6. 人工微调并保存
- 在 Studio 里显示候选框
- 支持拖拽和缩放
- 保存到 challenge 数据里

### 为什么不用运行时自动切

运行时自动切的问题：
- 不稳定
- 调参成本高
- 用户看到的是最终题面，不是算法过程

更合理的是把裁切结果当成内容资产：
- 预生成
- 人工校正
- 固化入库

### 最小可落地数据结构

建议每条 Turn 1 challenge 增加：
- `turn1PathStart`
- `turn1PathEnd`
- `turn1CropBounds`
- `turn1Apex`
- `turn1CornerName`
- `turn1Rotation`
- `turn1Scale`

其中：
- `turn1PathStart` / `turn1PathEnd`
  表示在整条 path 上的一号弯区间
- `turn1CropBounds`
  表示最终题面的裁切框
- `turn1Rotation`
  用于把题面统一旋转到更好辨识的朝向

### 最现实的执行顺序

1. 先做一个浏览器侧 path 采样工具
2. 自动给出 24 条赛道的 Turn 1 候选框
3. 在 Studio 里逐条人工确认
4. 把最终裁切结果写回题库

### 关键判断

这个问题更像“内容 authoring 工具问题”，不是“前端渲染问题”。

所以最值得先做的不是新游戏页，而是：
- `Turn 1` 候选裁切工具
- Studio 微调界面
- 持久化格式

## 当前结论

这个仓库离 “Turn 1 猜赛道” 并不远。

真正已经具备的核心资产是：
- 24 条赛道题库
- 赛道 SVG 导入链路
- location telemetry
- 答案判定
- 结果揭晓页
- 题库编辑能力

真正还缺的关键不是 UI 壳，而是：
- 高精度赛道边界资产
- Turn 1 的数据结构
- Turn 1 题面的裁图与导出逻辑
- Turn 1 模式自己的文案与规则

如果只追求一个最快可落地的第一版，正确路径应该是：
- 先建立可批量使用的精确赛道边界题面
- 再在现有游戏壳上承接 Turn 1 玩法
