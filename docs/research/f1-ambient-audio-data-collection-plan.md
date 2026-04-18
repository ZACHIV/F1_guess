# F1 白噪音功能数据采集方案

更新时间：2026-04-18

## 背景

目标功能：
- 播放不同车队或不同动力单元在不同赛道上的引擎声
- 单场收听时长可以接近 2 小时
- 第一阶段不追求真实逐圈重建，只要先拿到单圈素材并做循环或轻量拼接即可

当前仓库现状：
- 仓库已经有成熟的 `单圈音频 + telemetry + 赛道 SVG` 内容结构
- 本地 Studio 已支持：
  - 从视频 URL 提取音频
  - 从 OpenF1 拉取 `location` 和 `car_data`
  - 将资产写入 `public/audio`、`public/telemetry`、`public/assets/tracks`
- 这意味着白噪音功能不需要重做采集链，主要卡点在于“如何稳定找到免费可用的 onboard 素材”

## 结论

### 1. 没有稳定的“官方免费整库”

如果目标是“免费获得一场比赛中，不同车队某一圈的单圈 onboard 视频”，目前没有一个稳定、完整、官方免费的资源库。

免费资源是存在的，但非常碎，主要来自：
- F1 官方免费公开视频
- YouTube 上的官方或二创上传
- B 站的 F1 TV 搬运和民间整理

这些来源能支撑 MVP，但不适合做长期稳定自动化采集。

### 2. 免费资源最适合做 MVP，不适合做全量库

最现实的免费方案不是追求：
- 任意车队
- 任意比赛
- 任意指定圈

而是先做到：
- 同一赛道
- 同一车队或同动力单元
- 有一条 60 到 120 秒的干净 onboard 音频
- 尽量少解说、少 team radio、少背景音乐

对“白噪音”场景来说，这已经足够做出第一版体验。

### 3. 真正完整的方案最终还是会落到 F1 TV

如果未来目标升级为：
- 任意车队
- 任意站点
- 任意一圈
- 可系统化补库

最靠谱的源头仍然是 `F1 TV`，再配合第三方观看工具。

但这不是免费路径。

## 推荐的采集策略

建议按三个层级做。

### 层级 A：免费 MVP

来源优先级：
1. F1 官方站免费视频
2. YouTube 官方或高质量二创
3. B 站搬运和合集

采集原则：
- 优先收 `杆位圈 / Sprint 杆位圈 / Top Onboards / 精选 onboard`
- 接受“不是目标车队完整正赛某一圈”，只要音色足够代表该车队或动力单元即可
- 优先收“干净单圈”，不要追求一开始就做整场

适合的使用场景：
- 先做“赛道白噪音模式”
- 先做“车队音色对比模式”
- 先做“动力单元风格包”

### 层级 B：半系统化补库

当免费素材不够时，继续找：
- F1 官方 `Top 10 Onboards`
- 赛季年度 `Top 50 Onboards`
- B 站按车手、按分站整理的 onboard 合集
- 民间上传的 `Onboard Cameras` 系列视频

这一层的目标不是自动化，而是人工筛选和补档。

### 层级 C：长期完整库

如果后续真的要做成长期产品能力，再考虑：
- 订阅 F1 TV
- 使用 MultiViewer、Race Control、f1viewer 一类工具辅助观看和整理
- 按会话、车手、圈次建正式资产索引

## 现阶段建议的“采集单位”

不要先按“车企”这个不够精确的概念采。

建议按下面的字段组织素材：

| 字段 | 说明 |
| --- | --- |
| `season` | 年份 |
| `grandPrix` | 分站 |
| `trackName` | 赛道名 |
| `teamName` | 车队 |
| `powerUnit` | 动力单元供应商 |
| `driverName` | 车手 |
| `sessionType` | `qualifying` / `sprint` / `race` |
| `lapType` | `pole` / `fastest` / `selected` / `top-onboard-compilation` |
| `sourcePlatform` | `formula1` / `youtube` / `bilibili` / `f1tv` |
| `sourceUrl` | 原视频链接 |
| `audioQuality` | `clean` / `usable` / `noisy` |
| `radioIntrusion` | `none` / `light` / `heavy` |
| `commentaryIntrusion` | `none` / `light` / `heavy` |
| `hasTelemetry` | 是否已找到对应 telemetry |

这样后续即使同一赛道存在多个来源，也能继续扩，而不是互相覆盖。

## 为什么“单圈循环”是当前最优方案

### 可行性

仓库已经验证了：
- 单圈音频能提取
- 单圈 telemetry 能获取
- 单圈素材能在播放器中正常消费

所以白噪音模式最省事的第一版就是：
- 找到一条干净单圈音频
- 去掉头尾无关内容
- 用交叉淡入淡出做 loop
- 需要更长播放时直接循环

### 听感优化

整圈死循环虽然简单，但会有重复感。

建议分两步走：

#### V1：整圈 loop
- 最快上线
- 适合先验证产品感觉

#### V1.5：基于 telemetry 的轻量分段拼接
- 读取 OpenF1 的 `car_data`
- 按 `throttle / speed / rpm / brake / gear` 做粗分段
- 典型段落可分为：
  - 全油门直道段
  - 中速巡航段
  - 重刹段
  - 出弯拉转速段
- 按同一赛道原始节奏重新拼接

这样会比纯整圈循环自然很多，但实现成本仍然可控。

## 免费素材从哪里找

### A. F1 官方免费内容

优点：
- 画面和音频质量最好
- 元数据最干净
- 来源稳定

缺点：
- 不全
- 更偏向杆位圈、精选 onboard、赛季合辑

已确认可用的官方免费视频示例：
- [Lewis Hamilton 中国站 Sprint 杆位圈](https://www.formula1.com/en/latest/article/watch-ride-along-with-hamilton-for-his-sprint-qualifying-pole-lap-in-china.3CMxCQKWMVqLtAmULm91TS)
- [George Russell 中国站 Sprint 杆位圈](https://www.formula1.com/en/latest/article/watch-ride-onboard-as-russell-takes-chinese-gp-sprint-pole.2ZkJTdIMjUSMlfj2I2skSK)
- [Top 50 Onboards of 2024](https://www.formula1.com/en/video/top-50-onboards-of-2024.1818866222513383830)
- [2025 Bahrain GP Top 10 Onboards](https://www.formula1.com/en/video/top-10-onboards-the-best-action-from-bahrain.6060942609001)
- [2022 沙特站发车 360° 多车 onboard](https://www.formula1.com/en/latest/article/exclusive-take-an-interactive-360-degree-ride-with-the-top-four-drivers-at-the-start-of-the-saudi-arabian-gp.3L6A9OwjSsV69qrNITn4G8)

适合搜的关键词：
- `site:formula1.com "Ride onboard" "driver name" "track"`
- `site:formula1.com "Top 10 Onboards" "track"`
- `site:formula1.com "onboard" Formula 1`

### B. YouTube

优点：
- 结果多
- 官方和二创混合，容易捡漏

缺点：
- 结果很杂
- 很多视频有解说、二次剪辑、背景音乐
- 下架风险高

适合搜的关键词：
- `"Onboard Cameras" "driver" "Grand Prix"`
- `"Pole Lap" "driver" Formula 1`
- `"Fastest Lap" "driver" Formula 1 onboard`
- `"F1 TV" onboard "driver"`

### C. B 站

优点：
- 很多 F1 TV 搬运
- 能找到官方免费内容之外的车手 onboard
- 有些账号会按分站或按车手整理合集

缺点：
- 稳定性一般
- 搬运视频随时会失效
- 搜索结果依赖标题习惯

已确认可用的 B 站示例：
- [2023 British Grand Prix Onboard Cameras (Verstappen)](https://www.bilibili.com/video/BV1Qu411j7T9/)
- [2023 Japanese Grand Prix Onboard Cameras (Piastri)](https://www.bilibili.com/video/BV1i84y1D7c6/)
- [2023 Belgian Grand Prix Onboard Cameras (Tsunoda)](https://www.bilibili.com/video/BV1Sk4y137xT/)
- [2024 Hungarian GP Norris 杆位圈](https://www.bilibili.com/video/BV1ZU411U7AC/)
- [2021 Bahrain GP Top 10 Onboards 搬运](https://www.bilibili.com/video/BV11A411N7C2/)

其中最值得重点关注的是：
- `F1 GP Record`

这个搬运体系里能看到很多非冠军车队、非杆位车手的 onboard，例如：
- Bahrain GP (Alonso)
- Bahrain GP (Norris)
- Australia GP (Zhou)
- Australia GP (Sainz)
- Spanish GP (Russell)
- Canadian GP (Hamilton)
- Belgian GP (Tsunoda)
- Japanese GP (Piastri)

适合搜的关键词：
- `F1 Grand Prix Onboard Cameras 车手名`
- `F1 GP Record`
- `F1 车载视角`
- `F1 TV 搬运 onboard`
- `British Grand Prix Onboard Cameras Norris`

## 与当前仓库最匹配的落地方式

### 方案 1：继续沿用现有 Studio 采集流程

最推荐。

做法：
1. 先找到视频 URL
2. 用现有 Studio 提取整段音频
3. 用现有 OpenF1 导入对应单圈 telemetry
4. 存为新的 ambient 资产记录

理由：
- 仓库已经有这整套流程
- 不需要重做抓取工具
- 只需要新增“白噪音模式”的数据清单

### 方案 2：单独维护一份 ambient library

建议不要一开始把白噪音素材直接塞进当前猜赛道 challenge 列表。

更合理的做法是新增一份单独的文档或 JSON 清单，例如：
- `docs/research/f1-ambient-audio-catalog.md`
- `src/data/ambient-library.json`

字段建议：
- `id`
- `title`
- `audioSrc`
- `loopStrategy`
- `sourceUrl`
- `teamName`
- `powerUnit`
- `driverName`
- `trackName`
- `sessionKey`
- `lapNumber`
- `telemetryLocationSrc`
- `telemetryCarDataSrc`
- `qualityNotes`

### 方案 3：优先围绕“动力单元”而不是“全车队”补库

如果免费素材不够，建议先把目标收缩成：
- Mercedes 动力单元
- Ferrari 动力单元
- Honda / RBPT 动力单元
- Renault / Alpine 动力单元

原因：
- 白噪音场景下，用户感知的核心常常是音色风格
- 同动力单元内部的差异，通常比“你是否准确拿到了这支车队某一指定圈”更不重要
- 这样更容易先收出一套最小可用库

## 推荐的实际执行顺序

### 第一阶段：先做 8 到 12 条“够用素材”

建议覆盖：
- 4 个动力单元
- 4 到 6 条代表性赛道
- 每个组合至少 1 条可循环单圈

目标不是全面，而是先验证：
- 循环听感是否成立
- 用户是否真的喜欢这种模式
- 赛道差异和动力单元差异是否能被感知

### 第二阶段：补齐高价值车队和高价值赛道

优先：
- Ferrari
- Mercedes
- Red Bull
- McLaren

优先赛道：
- Monza
- Spa
- Suzuka
- Bahrain
- Silverstone
- Monaco

这些站点更容易找到公开素材，也更容易听出节奏差异。

### 第三阶段：再考虑“任意圈”

只有在前两阶段已经证明产品方向成立后，才值得继续追求：
- 正赛指定圈
- 同车手多圈
- 长时段真实节奏拼接

## 风险与限制

### 1. 免费内容覆盖不完整

这是当前最大限制。

你能免费找到很多素材，但无法保证：
- 任意车队都有
- 任意站点都有
- 任意圈都能找到

### 2. 音频清洁度不稳定

很多素材会混入：
- 解说
- team radio
- 背景音乐
- 剪辑过渡音效

所以“找到视频”不等于“能直接做白噪音”。

### 3. Telemetry 覆盖也会有缺口

OpenF1 虽然很好用，但个别会话或圈次可能缺失、异常，仓库当前也已经接受了“占位/手工替换”的处理方式。

### 4. 版权边界需要注意

这里不做法律判断，但从平台视频提取音频并用于产品内容，存在版权和使用范围风险。

如果后续要公开上线或商用，这部分需要单独评估。

## 现阶段最推荐的判断标准

对一条候选素材，不要先问：
- 它是不是正赛某队某一指定圈？

先问：
- 它是否是干净的 onboard 音频？
- 它是否足够代表这支车队或这个动力单元的音色？
- 它是否有 60 到 120 秒的稳定段落？
- 它是否容易被切成可循环音频？
- 它是否能在当前仓库中快速接入？

只要这些答案大体是“是”，它就适合先进入 MVP 资产库。

## 后续建议

最近一步建议：
1. 先新增一份 ambient 素材清单，不和 challenge 混用
2. 先人工挑 8 到 12 条音频质量最好的素材
3. 每条素材先做整圈 loop 版
4. 再挑 2 到 3 条做 telemetry 分段拼接实验

如果这一步听感成立，再继续补库。

## 参考资源

### 官方数据与工具
- [OpenF1 Docs](https://openf1.org/docs/)
- [OpenF1 GitHub](https://github.com/br-g/openf1)
- [FastF1 Docs](https://docs.fastf1.dev/)
- [Fast-F1 GitHub](https://github.com/theOehrly/Fast-F1)
- [f1db GitHub](https://github.com/f1db/f1db)

### F1 TV 生态
- [MultiViewer](https://multiviewer.dev/)
- [Race Control](https://github.com/robvdpol/RaceControl)
- [f1viewer](https://github.com/SoMuchForSubtlety/f1viewer)

### 可借鉴的音频合成方向
- [Real-Time-Car-Audio-Emitter](https://github.com/mnursey/Real-Time-Car-Audio-Emitter)
- [engine-sim](https://github.com/ange-yaghi/engine-sim)

## 一句话版本

免费路线能做出白噪音 MVP，但做不到稳定的“任意车队任意圈素材库”。

当前最优解是：
- 用官方免费内容 + B 站搬运补库
- 每条先收单圈干净 onboard
- 先做 loop
- 后续再用 telemetry 做更自然的拼接
