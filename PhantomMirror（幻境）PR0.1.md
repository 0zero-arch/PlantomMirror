# PhantomMirror（幻境）PR0\.1

## Phase 1 产品需求与研发规划 V0\.1

**产品名称：** PhantomMirror
**中文名称：** 幻境
**产品 Slogan：** 让天下没有难变帅的人。

**文档版本：** V0\.1
**项目阶段：** Phase 1 / MVP 技术与产品验证阶段
**项目性质：** 长期产品项目
**当前角色：** 产品负责人 / 技术负责人 / 核心开发者
**计划周期：** 2026\-10 ～ 2027\-06（允许根据实验结果动态调整）

---

# 一、项目总览

## 1\.1 产品愿景

PhantomMirror 希望解决一个长期存在但缺乏可靠解决方案的问题：

> **一个人如何知道什么样的外貌改变真正适合自己，并在实际执行之前尽可能看到可信的结果？**
> 
> 

目前用户在改变发型、穿搭、妆容甚至进行更进一步的外貌改变时，通常依赖：

- 明星/博主照片

- 理发师经验

- 朋友建议

- 短视频教程

- AI 图片生成

- 传统美颜/换装 App

这些方式能够提供“参考”，但通常不能很好地解决：

> **“这个东西放在我自己身上，到底会怎么样？”**
> 
> 

PhantomMirror 希望逐渐建立一套：

> **个人外貌数据 → 个性化分析 → 个性化方案 → 结果模拟 → 真实执行 → 结果反馈 → 模型持续优化**
> 
> 

的闭环。

---

# 二、长期产品方向

PhantomMirror 长期可能形成以下产品体系：

```Plain Text
PhantomMirror
                         │
             Personal Appearance Model
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
      Hair             Face           Fashion
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  AI Recommendation
                         ↓
                    Simulation
                         ↓
                   Execution Plan
                         ↓
                   Real-world Result
                         ↓
                     Feedback
                         ↓
                    Model Update
```

未来可能扩展：

- AI 发型分析

- AI 发型模拟

- 发型推荐

- 发型执行方案

- 理发师辅助

- 智能镜

- 3D Head Model

- Hair Geometry

- Hair Physics

- 多角度人体/头部扫描

- 移动端

- B2B 理发店系统

- Beauty Tech API

- 个性化外貌模型

但这些均不属于 Phase 1 的核心开发范围。

---

# 三、Phase 1 定位

## 3\.1 Phase 1 核心目标

验证：

> **用户上传自己的照片后，PhantomMirror 是否能够利用 AI/CV 技术理解用户自身特征，并生成一个比普通“换发型”更加个性化、更加可信的发型效果。**
> 
> 

核心产品闭环：

```Plain Text
用户
 ↓
上传照片
 ↓
照片质量检查
 ↓
人脸/头发分析
 ↓
个人外貌特征 Profile
 ↓
选择目标发型
 ↓
AI 个性化模拟
 ↓
结果展示
 ↓
用户评价
 ↓
数据记录
```

---

# 四、Phase 1 要回答的核心问题

Phase 1 不是单纯为了“开发一个网站”。

必须回答以下问题：

### Q1：用户是否愿意使用？

用户是否愿意上传自己的照片进行发型分析。

### Q2：用户是否认为分析有价值？

用户是否认为系统对自己的脸型、头发等信息分析有一定参考意义。

### Q3：AI 是否能够保持用户身份？

生成新发型后：

- 是否仍然像用户本人？

- 五官是否发生明显变化？

- 脸型是否被改变？

- 发际线是否合理？

### Q4：个性化发型效果是否可信？

用户是否认为：

> “这个发型如果真的剪出来，大概会是这个感觉。”
> 
> 

### Q5：用户是否愿意继续使用？

用户是否愿意：

- 更换发型

- 再次生成

- 保存方案

- 分享

- 带着结果去理发店

### Q6：技术瓶颈在哪里？

需要确定：

- 2D 图片是否足够？

- 是否需要多角度照片？

- 是否需要头部 3D？

- 是否需要头发结构分析？

- 是否需要更多数据？

- 是否需要自研模型？

---

# 五、Phase 1 成功标准

Phase 1 不以“代码完成”作为成功标准。

而以实验结果作为成功标准。

## 5\.1 最低成功标准

能够实现：

```Plain Text
照片
 ↓
用户分析
 ↓
选择发型
 ↓
个性化生成
 ↓
用户评价
```

并能够稳定运行。

---

## 5\.2 产品验证标准

至少完成：

- 10～20 名真实用户测试

- 多种脸型

- 多种头发类型

- 多种目标发型

记录：

- 原始照片

- 分析结果

- 目标发型

- AI 生成结果

- 用户评价

- 用户修改行为

- 最终选择

---

## 5\.3 技术验证标准

至少验证：

### 身份一致性

用户仍然能够被识别为本人。

### 发型一致性

生成的目标发型与参考发型具有明显对应关系。

### 个性化

不同用户输入相同发型时，不应该得到完全相同的“模板套图”。

### 可用性

结果达到普通用户可以理解和参考的程度。

---

# 六、目标用户

## 6\.1 Phase 1 核心用户

优先选择：

> **有明确发型改变需求、但不知道自己适合什么发型的人。**
> 
> 

例如：

- 准备理发的人

- 想尝试新发型的人

- 经常换发型的人

- 对自己的发型不满意的人

- 不知道如何向理发师描述需求的人

---

## 6\.2 暂不重点服务

Phase 1 暂不重点考虑：

- 医美用户

- 植发用户

- 假发用户

- 专业造型师

- 大型连锁理发店

- 美妆品牌

- 电商平台

这些属于后续商业化方向。

---

# 七、核心用户故事

## User Story 001：寻找发型

> 我准备理发，但是不知道什么发型适合我，希望系统能够根据我的实际情况给我一些参考。
> 
> 

---

## User Story 002：验证参考图

> 我在网上看到一个发型很好看，但是不知道自己剪出来是否也好看，希望在理发之前看到自己的效果。
> 
> 

---

## User Story 003：减少沟通成本

> 我不知道应该如何向理发师描述自己想要的发型，希望能够拿一个比较直观的结果给理发师看。
> 
> 

---

## User Story 004：保存个人发型历史

> 我希望保存自己尝试过的发型，以后理发的时候能够查看过去的效果。
> 
> 

---

# 八、核心产品流程

```Plain Text
进入 PhantomMirror
        ↓
上传照片
        ↓
照片质量检测
        ↓
人脸检测
        ↓
头发检测
        ↓
个人特征分析
        ↓
生成 Personal Appearance Profile
        ↓
选择发型
        ↓
AI Hairstyle Simulation
        ↓
结果展示
        ↓
用户评价
        ↓
保存
```

---

# 九、Phase 1 功能需求

# 9\.1 用户模块

## F001 用户进入

Phase 1 可以不要求完整注册体系。

优先支持：

- 游客体验

- 简单 Session

- 可选匿名 User ID

原因：

> 当前目标是验证产品，而不是建设完整用户体系。
> 
> 

---

# 9\.2 图片上传模块

## F101 上传照片

用户可以上传：

- 手机照片

- 相册照片

支持：

- JPG

- JPEG

- PNG

---

## F102 图片质量检测

检测：

- 是否存在人脸

- 人脸是否完整

- 是否过度模糊

- 是否过暗

- 是否过曝

- 头发是否被严重遮挡

- 人脸角度是否过大

如果质量不足：

```Plain Text
照片质量不足
请上传：
正面
光线正常
面部清晰
头发完整
的照片
```

---

# 9\.3 人脸分析模块

## F201 Face Detection

获取：

- Face Bounding Box

- Face Landmarks

- Face Pose

---

## F202 Face Shape

尝试识别：

- Oval

- Round

- Square

- Rectangle

- Heart

- Diamond

- 等

注意：

> Phase 1 不要求证明脸型分类具有医学/科学意义。
> 
> 

它只是产品实验中的一个特征。

---

# 9\.4 Hair Analysis

## F301 Hair Segmentation

得到：

```Plain Text
Hair Mask
```

用于：

- AI 生成

- 发型区域控制

- 后续分析

---

## F302 Hair Type

尝试获得：

- Straight

- Wavy

- Curly

- Coily

---

## F303 Hair Length

例如：

- Short

- Medium

- Long

---

## F304 Hair Density

尝试分析：

- Low

- Medium

- High

---

## F305 Hair Frizziness

尝试分析：

- Low

- Medium

- High

---

# 十、Personal Appearance Profile

Phase 1 建立第一个个人外貌数据结构。

```Plain Text
PersonalAppearanceProfile

User
 ├── Face
 │    ├── Landmarks
 │    ├── Face Shape
 │    └── Head Pose
 │
 └── Hair
      ├── Hair Mask
      ├── Hair Type
      ├── Hair Length
      ├── Hair Density
      └── Frizziness
```

注意：

> Profile 是 PhantomMirror 后续非常重要的基础数据结构。
> 
> 

未来可以不断扩展。

---

# 十一、发型库

## 11\.1 Hairstyle

每一个发型建立独立对象。

例如：

```Plain Text
Hairstyle

id
name
category
gender
length
texture
volume
reference_image
description
metadata
```

---

## 11\.2 第一阶段发型分类

例如：

### 男性

- Buzz Cut

- Crew Cut

- French Crop

- Textured Crop

- Side Part

- Slick Back

- Middle Part

- Undercut

- Fade

- Mullet

### 女性

Phase 1 可以选择少量典型发型作为实验，不需要建设庞大数据库。

---

# 十二、AI Hairstyle Simulation

## F501 目标

输入：

```Plain Text
User Photo
+
Personal Appearance Profile
+
Target Hairstyle
```

输出：

```Plain Text
Personalized Hairstyle Image
```

---

## F502 核心要求

### Identity Preservation

尽量保持：

- 五官

- 脸型

- 肤色

- 人脸比例

---

### Hairstyle Preservation

目标发型应该保持：

- 轮廓

- 长度

- 方向

- 刘海

- 两侧

- 顶部结构

---

### Naturalness

避免：

- 发型与头部脱离

- 发际线异常

- 头发穿模

- 脸部变化

- 五官变化

- 明显 AI 感

---

# 十三、AI 技术路线

Phase 1 不强制自研模型。

采用：

```Plain Text
第三方 API
+
开源模型
+
传统 CV
+
自己的业务逻辑
```

进行组合。

---

# 十四、第三方 AI 能力

重点研究：

## Perfect Corp\.

可能使用：

- Face Analysis

- Hair Analysis

- Hair Type

- Hair Density

- Hair Length

- Hair Frizziness

- Hairstyle Try\-On

目标：

> 判断哪些能力直接购买/调用更合理。
> 
> 

---

# 十五、AI 能力分层

以后所有 AI 能力分成三类：

## BUY

已经成熟：

> 直接使用第三方 API。
> 
> 

---

## BUILD

已有成熟开源方案：

> 自己集成部署。
> 
> 

---

## RESEARCH

目前没有成熟方案：

> 自己研究。
> 
> 

例如：

```Plain Text
Hair Segmentation
→ BUY / BUILD

Face Landmark
→ BUY / BUILD

Hairstyle Generation
→ BUY / BUILD

Real Hairstyle Outcome Prediction
→ RESEARCH
```

这个分类以后可以不断变化。

---

# 十六、用户反馈模块

用户看完结果后：

### F601

喜欢

### F602

不喜欢

### F603

重新生成

### F604

换一个发型

### F605

保存

### F606

评价

例如：

```Plain Text
这个发型：
○ 很适合我
○ 还可以
○ 不太适合
○ 完全不适合
```

---

# 十七、数据闭环

Phase 1 开始建立最重要的数据结构：

```Plain Text
Original Photo
      ↓
Personal Profile
      ↓
Target Hairstyle
      ↓
AI Prediction
      ↓
User Feedback
```

未来扩展：

```Plain Text
↓
Actual Haircut
      ↓
Final Photo
      ↓
Prediction vs Reality
      ↓
Model Update
```

这部分是 PhantomMirror 长期最重要的数据资产之一。

---

# 十八、第一阶段暂不实现真实剪发闭环

虽然长期目标是：

```Plain Text
Prediction
→ Execution
→ Outcome
```

但是 Phase 1 只完成：

```Plain Text
Prediction
→ User Feedback
```

原因：

需要先证明：

> **用户是否认可我们的预测价值。**
> 
> 

---

# 十九、前端模块

Phase 1 推荐：

> Web 优先。
> 
> 

暂时不开发原生 iOS / Android。

---

## Frontend 页面

### P001 首页

内容：

- 产品介绍

- 开始体验

---

### P002 图片上传页

功能：

- 上传

- 图片预览

- 重新上传

---

### P003 分析页

显示：

```Plain Text
正在分析你的头发……
正在分析你的脸型……
正在生成个人特征……
```

---

### P004 发型选择页

显示：

- 发型图片

- 发型名称

- 分类

- 选择按钮

---

### P005 结果页

显示：

```Plain Text
Before
After
```

支持：

- 对比

- 换发型

- 重新生成

- 保存

---

### P006 Feedback

收集：

- 喜欢程度

- 原因

- 其他意见

---

# 二十、Backend 模块

Backend 第一阶段建议采用：

> **模块化单体架构。**
> 
> 

不要一开始微服务化。

---

## Backend 服务

```Plain Text
API Layer
    │
    ├── User
    ├── Photo
    ├── Profile
    ├── Hairstyle
    ├── Simulation
    └── Feedback
```

---

# 二十一、AI Task Service

AI 任务可能需要较长时间。

因此不要：

```Plain Text
HTTP Request
    ↓
同步等待 AI
    ↓
返回
```

而采用：

```Plain Text
Create Task
    ↓
task_id
    ↓
AI Worker
    ↓
生成
    ↓
保存结果
    ↓
Task Success
```

前端：

```Plain Text
GET /tasks/{task_id}
```

查询状态。

---

# 二十二、推荐后端架构

```Plain Text
Web
                     │
                     ↓
                  Nginx
                     │
                     ↓
                Backend API
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
    PostgreSQL      Redis       Object Storage
       │             │             │
       │             │             ├── Original
       │             │             ├── Mask
       │             │             └── Result
       │             │
       │             └── Task / Cache
       │
       └── User / Profile / Result
                     
                     ↓
                 AI Worker
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
         CV       Hair AI    Generation
```

Phase 1 可以进一步简化。

---

# 二十三、数据库核心表

## users

```Plain Text
id
anonymous_id
created_at
updated_at
```

---

## photos

```Plain Text
id
user_id
storage_key
type
width
height
created_at
```

---

## appearance\_profiles

```Plain Text
id
user_id

face_shape
face_landmarks
head_pose

hair_type
hair_length
hair_density
hair_frizziness

created_at
updated_at
```

---

## hairstyles

```Plain Text
id
name
category
gender
reference_image
metadata
created_at
```

---

## simulations

```Plain Text
id
user_id
photo_id
hairstyle_id

provider
model
task_id

input_data
output_image
status

created_at
completed_at
```

---

## feedbacks

```Plain Text
id
simulation_id
rating
reason
comment
created_at
```

---

# 二十四、对象存储

照片属于大文件。

不要直接存数据库。

数据库：

```Plain Text
storage_key
```

对象存储：

```Plain Text
original/
analysis/
mask/
result/
```

---

# 二十五、AI Pipeline

建议形成统一 Pipeline：

```Plain Text
Image
 ↓
Validation
 ↓
Face Detection
 ↓
Face Landmark
 ↓
Hair Segmentation
 ↓
Hair Analysis
 ↓
Profile
 ↓
Hairstyle Selection
 ↓
Generation
 ↓
Quality Check
 ↓
Result
```

---

# 二十六、AI Provider 抽象

不要在业务代码里直接写死某一家 API。

例如：

```Plain Text
AIProvider

├── PerfectCorpProvider
├── OpenAIProvider
├── LocalModelProvider
└── FutureProvider
```

业务层：

```Plain Text
HairstyleService
       ↓
AIProvider
```

而不是：

```Plain Text
HairstyleService
       ↓
PerfectCorp API
```

原因：

未来需要：

- 更换供应商

- 比较不同模型

- 控制成本

- A/B Test

- 自研模型

---

# 二十七、实验体系

PhantomMirror 所有关键技术都必须实验化。

每个实验记录：

```Plain Text
Experiment ID
实验目标
假设
输入
方法
模型
参数
输出
评价标准
结果
结论
下一步
```

---

# 二十八、核心实验

## EXP\-001

### 人脸身份保持实验

测试：

> AI 改变发型后是否仍然保持本人身份。
> 
> 

测试：

10 人 × 5 发型

---

## EXP\-002

### Hair Segmentation

测试：

> 能否准确获得头发区域。
> 
> 

---

## EXP\-003

### Hairstyle Generation

测试：

> 参考发型是否能够准确迁移到目标用户。
> 
> 

---

## EXP\-004

### 不同发质测试

测试：

- 直发

- 波浪

- 卷发

- 不同发量

---

## EXP\-005

### 不同脸型测试

测试：

- Oval

- Round

- Square

- Rectangle

- Heart

- Diamond

---

## EXP\-006

### 第三方 API 对比

比较：

```Plain Text
Perfect Corp
VS
其他 API
VS
开源模型
```

评价：

- 生成质量

- 身份保持

- 发型保持

- 速度

- 成本

- API 易用性

- 商业授权

- 数据隐私

---

# 二十九、用户测试

Phase 1 后期进行真实用户测试。

目标：

> 10～20 人。
> 
> 

每个用户记录：

```Plain Text
User
 ↓
Original Photo
 ↓
Analysis
 ↓
Hairstyle
 ↓
Prediction
 ↓
Feedback
```

如果条件允许：

```Plain Text
Prediction
 ↓
Actual Haircut
 ↓
Actual Photo
```

---

# 三十、核心指标

## 产品指标

### Photo Upload Rate

用户进入后是否愿意上传照片。

---

### Analysis Completion Rate

上传后是否能够完成分析。

---

### Simulation Completion Rate

分析后是否愿意生成发型。

---

### Result Satisfaction

用户对结果满意程度。

---

### Re\-generation Rate

用户是否愿意继续尝试。

---

### Save Rate

用户是否保存结果。

---

# 三十一、技术指标

## Identity Similarity

生成前后身份一致程度。

---

## Hairstyle Similarity

生成结果与目标发型的一致程度。

---

## Generation Success Rate

生成成功率。

---

## Generation Latency

平均生成时间。

---

## Cost Per Generation

每次生成成本。

---

# 三十二、隐私与安全

PhantomMirror 处理：

- 人脸

- 外貌

- 用户照片

因此从第一版就必须考虑隐私。

---

## 基本原则

### 最小化

只收集产品真正需要的数据。

### 明确授权

用户明确知道照片用于什么。

### 可删除

允许用户删除照片和结果。

### 访问控制

用户不能访问其他用户照片。

### 存储安全

对象存储不能默认公开。

### 日志安全

避免在日志中记录：

- 原始图片

- 人脸数据

- Token

- API Key

---

# 三十三、Phase 1 技术栈建议

注意：

> 以下只是 V0\.1 建议，不是强制锁定。
> 
> 

## Frontend

```Plain Text
React / Next.js
TypeScript
```

---

## Backend

结合已有后端基础：

```Plain Text
Python FastAPI
```

或者：

```Plain Text
Go
```

但 AI Pipeline 建议 Python。

因此 Phase 1 可以：

```Plain Text
Frontend
Next.js

Backend
FastAPI

AI
Python

Database
PostgreSQL

Cache / Queue
Redis

Storage
S3-compatible Object Storage
```

---

# 三十四、项目代码结构建议

```Plain Text
PhantomMirror/

├── docs/
│   ├── product/
│   ├── architecture/
│   ├── research/
│   └── experiments/
│
├── frontend/
│
├── backend/
│
├── ai/
│   ├── face/
│   ├── hair/
│   ├── generation/
│   └── pipeline/
│
├── data/
│
├── experiments/
│
└── README.md
```

---

# 三十五、研发原则

## 原则 1：产品驱动技术

不是：

> 我想学 3D，所以做 3D。
> 
> 

而是：

> 产品发现 2D 不够，所以研究 3D。
> 
> 

---

## 原则 2：实验优先

任何重大技术决策：

> 先实验，再决定。
> 
> 

---

## 原则 3：能买不造

成熟能力：

> API / SaaS / 开源方案优先。
> 
> 

---

## 原则 4：核心能力逐渐自研

只有当：

- 成本过高

- 效果不足

- 数据形成优势

- 商业限制

时，再考虑自研。

---

## 原则 5：不要过早架构

Phase 1：

> Modular Monolith
> 
> 

而不是：

> Microservices \+ Kubernetes \+ Service Mesh
> 
> 

---

# 三十六、Phase 1 月度计划

## 2026\-10

### 产品与竞品研究

目标：

- 完成 PRD V0\.1

- 研究 Perfect Corp\.

- 研究 YouCam

- 研究 AI Hairstyle 产品

- 明确 MVP

输出：

```Plain Text
PRD V0.1
竞品分析
技术能力地图
实验计划
```

---

# 2026\-11

## Computer Vision

学习：

- OpenCV

- NumPy

- Face Detection

- Face Landmark

- Segmentation

实验：

```Plain Text
照片
 ↓
Face
 ↓
Hair
```

输出：

> 第一版个人特征提取 Pipeline。
> 
> 

---

# 2026\-12

## AI Image Generation

学习：

- Diffusion

- Image\-to\-Image

- Reference Image

- Identity Preservation

- Control

- Prompt / Conditioning

实验：

```Plain Text
用户照片
+
发型参考图
 ↓
AI
 ↓
结果
```

---

# 2027\-01

## Identity Preservation

重点：

> AI 换发型以后还是不是这个人？
> 
> 

测试：

10 人 × 多种发型。

输出：

> Identity Preservation Benchmark V0\.1
> 
> 

---

# 2027\-02

## Hair Intelligence

研究：

- Hair Segmentation

- Hair Type

- Hair Density

- Hair Length

- Hair Direction

- Hair Volume

开始建立：

```Plain Text
PersonalAppearanceProfile
```

---

# 2027\-03

## Prototype V0\.1

完成：

```Plain Text
Web
 ↓
Upload
 ↓
Analysis
 ↓
Hairstyle
 ↓
Generation
 ↓
Result
```

---

# 2027\-04

## Real User Test

10～20 名真实用户。

收集：

- 使用过程

- 满意度

- 失败案例

- AI 错误

- 用户需求

---

# 2027\-05

## Error Analysis

重点不是继续堆功能。

而是回答：

> **为什么 AI 结果和用户预期不一致？**
> 
> 

建立：

```Plain Text
Error Taxonomy
```

例如：

- Face Error

- Hair Error

- Identity Error

- Hairstyle Error

- Lighting Error

- Geometry Error

- User Expectation Error

---

# 2027\-06

## Phase 1 Review

最终输出：

```Plain Text
PhantomMirror Prototype V0.1
+
用户测试报告
+
技术实验报告
+
问题清单
+
```



