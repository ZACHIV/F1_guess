# F1 官方 2025 `Grill The Grid` 小游戏整理

更新时间：2026-04-17

## 结论

这次检索到的 2025 年官方 `Grill The Grid` 编号正片一共只有 4 期，因此不再做“只选热门几期”的筛选，直接全选。

检索依据：
- F1 官方视频页显示 2025 年 `Episode 1` 到 `Episode 4`
- TheTVDB 的 2025 Season 9 条目同样只列出 4 集，首播日期为 2025-08-06 到 2025-08-27，每周一集

## 4 期列表

| 期数 | 标题 | 首播日期 | 时长 | 核心玩法 |
| --- | --- | --- | --- | --- |
| Episode 1 | `The Face Mash Challenge!` | 2025-08-06 | 24 分钟 | 看“拼脸图”，猜被混合的是哪两位或哪几位车手 |
| Episode 2 | `The Mystery Track Challenge!` | 2025-08-13 | 17 分钟 | 看赛道局部特写，猜是哪条赛道 |
| Episode 3 | `Spot The Mistake` | 2025-08-20 | 25 分钟 | 看 F1 历史图片，找出被改错的地方 |
| Episode 4 | `THE FINALE! Badly Described Races Challenge` | 2025-08-27 | 25 分钟 | 根据“故意描述得很烂/很绕”的比赛描述，猜对应赛事 |

## 每期玩法拆解

### Episode 1: Face Mash

玩法确认：
- F1 官方文案说明，本期把“过去与现在”的车手五官特征混在一起，让现役车手去辨认到底拼出了谁。

适合复用的规则：
- 给玩家一张由 2 位人物面部特征混合而成的图
- 玩家需要在限定时间内说出人物身份
- 可以设置：
  - 直接答名字
  - 四选一
  - 双人组合都答对才得满分

为什么有效：
- 识别门槛低，适合泛用户
- 既考 F1 知识，也考“视觉辨识”
- 退役车手 + 现役车手混用，会显著提升节目效果

### Episode 2: What the track?!

玩法确认：
- F1 官方文案说明：把全球赛道的 12 张图片放大到很局部，且避开明显地标，让车手在 3 分钟内尽量猜出赛道。
- 第三方转录页可见规则细节：可以跳过后再回来，题目总数为 12，限时 3 分钟。

适合复用的规则：
- 给玩家看赛道某一处的局部图，例如：
  - 路肩颜色
  - 围栏/广告牌
  - 建筑边角
  - 地形、树木、水面
- 玩家猜赛道名
- 可以做成：
  - 纯开放题
  - 四选一
  - 逐步放大 / 逐步给更多上下文

为什么有效：
- 非常适合你现在这个赛道猜谜项目
- 玩法天然支持图像、音频、遥测多模态扩展
- “局部特征识别”非常容易做成连玩型题库

### Episode 3: Spot The Mistake

玩法确认：
- F1 官方文案说明：给出从 F1 早期到现代的照片，并在每张图里动一个手脚，让车手在 3 分半内尽量找出所有错误。
- 第三方转录页可见更具体描述：每张图里都有一个错误，玩家要尽量多过图并指出错误点。

适合复用的规则：
- 给玩家一张“被篡改”的 F1 图片
- 错误可能是：
  - 车手号码错
  - 赞助商错
  - 奖杯/赛道/赛车元素错位
  - 时代错配
- 玩家指出错误点即可得分

为什么有效：
- 比单纯竞猜更有互动感
- 可以把题目拆成不同难度层级
- 很适合社交传播，因为玩家会讨论“到底哪里错了”

### Episode 4: Badly Described Races

玩法确认：
- 官方可直接确认标题是 `Badly Described Races`
- 由于官方公开摘要里没有像 Episode 1/2/3 那样给出完整玩法说明，这里按标题做保守推断：
  - 给出一段故意模糊、抽象、误导性很强的比赛描述
  - 让车手猜对应的是哪一场 F1 比赛

这部分属于推断，不把它写成已证实事实。

适合复用的规则：
- 给玩家一句“烂描述”或“梗化描述”
- 玩家猜：
  - 哪一站大奖赛
  - 哪一年
  - 哪场经典比赛/事故/逆转
- 也可反过来做：
  - 先给事件
  - 让玩家写最短的“烂描述”

为什么有效：
- 非常适合资深用户
- 有强梗性，适合做短内容传播
- 比图片题更依赖赛事记忆和叙事记忆

## 玩法层面的共性

2025 这 4 期本质上都符合一个统一框架：

1. 给非常有限的信息
2. 强迫玩家在短时间内识别模式
3. 题面有一点“误导”或“遮蔽”
4. 结果天然适合剪辑成高反应密度内容

它们分别对应 4 种识别能力：
- `Face Mash`：人物识别
- `What the track?!`：地点/赛道识别
- `Spot The Mistake`：异常检测
- `Badly Described Races`：事件语义识别

## 对这个仓库的直接启发

如果是给当前 `F1_guess` 项目借鉴，优先级建议：

1. `What the track?!`
- 跟你现有“猜赛道”主线最贴合
- 可以直接从赛道 SVG、局部截图、遥测轨迹切片、赛道环境图切入

2. `Spot The Mistake`
- 适合做成第二玩法
- 可以复用已有赛道图、车手信息、赛事元数据

3. `Face Mash`
- 传播性强，但与当前 repo 主线相关度略低

4. `Badly Described Races`
- 更偏内容型和资深 F1 用户玩法
- 可以后续做成“文字谜题模式”

## 可直接落地的题型改造

### 方案 A：赛道局部图猜赛道
- 从赛道 SVG 或赛道卫星图截取局部
- 玩家四选一猜赛道
- 连续答对进入更难题

### 方案 B：音频 + 局部图双线索
- 先放一段 onboard 音频
- 再给一个赛道局部图
- 玩家综合猜测

### 方案 C：错误检测模式
- 在赛道图、车手卡、历史事件卡片上故意改一个元素
- 让玩家指出错误

### 方案 D：烂描述猜比赛
- 用一句抽象描述概括经典赛事
- 玩家猜年份 / 分站 / 主角

## 来源

官方来源：
- F1 官方视频页 Episode 1: https://www.formula1.com/en/video/grill-the-grid-2025-episode-1-face-mash.1839629343163024474
- F1 官方视频页 Episode 2: https://www.formula1.com/en/video/grill-the-grid-2025-episode-2-what-the-track.1840353426154662164
- F1 官方视频页 Episode 3: https://www.formula1.com/en/video/grill-the-grid-2025-episode-3-spot-the-mistake.1840809225005034297
- F1 官方视频页 Episode 4: https://www.formula1.com/en/video/grill-the-grid-2025-episode-4-badly-described-races.1841609508719103383
- F1 官方文章（Episode 1 简介）: https://www.formula1.com/en/latest/article/grill-the-grid-watch-as-the-drivers-hilariously-take-on-the-face-mash.43Zf0TdPx3y6AnVXTpTQDK
- F1 官方文章（Episode 2 简介）: https://www.formula1.com/en/latest/article/grill-the-grid-watch-and-play-along-as-the-drivers-take-on-the-what-the.7z9G1HGFL8rALp9uvUhh7G
- F1 官方文章（Episode 3 简介）: https://www.formula1.com/en/latest/article/grill-the-grid-watch-as-drivers-tackle-the-amusing-spot-the-mistake.6X9JoP9mxuz5DoFeUZ2IOp

辅助来源：
- TheTVDB 2025 Season 9 列表（用于核对 2025 年共 4 集、日期与时长）: https://thetvdb.com/series/formula-1-grill-the-grid-447195/seasons/official/9
- 第三方转录页 Episode 2（用于补规则细节，如 12 题、3 分钟、可跳过）: https://lilys.ai/notes/1117393
- 第三方转录页 Episode 3（用于补规则细节，如 3 分半、历史图片中每张有一个错误）: https://lilys.ai/notes/1126391

## 备注

- “2025 年只有 4 期”这个结论，来自官方编号 `Episode 1-4` 与 TheTVDB Season 9 交叉核对。
- Episode 4 的具体规则说明在官方公开摘要里没有像前 3 期那样清楚，因此文档中对其玩法做了显式“推断”标记。
