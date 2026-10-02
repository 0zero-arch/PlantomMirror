# PhantomMirror（幻境）客户端/云端 模块拆解与架构设计

## Phase 1 客户端、后端与 AI 云端架构及研发排期 V0\.1

**项目：** PhantomMirror（幻境）
**阶段：** Phase 1 / MVP 技术验证
**核心目标：** 建立第一个可运行的“用户照片 → AI 分析 → 个性化发型模拟 → 用户反馈”闭环。
**计划周期：** 2026\-10 ～ 2027\-06
**开发模式：** Solo Founder \+ AI Coding Assistant
**核心原则：** AI 辅助开发，但保留人工学习、架构设计、技术实验和代码理解时间。

---

# 一、Phase 1 技术目标

Phase 1 不追求建设最终产品。

本阶段只建设：

```Plain Text
PhantomMirror
                          │
                          ↓
                    Client 客户端
                          │
                          ↓
                    Backend 云端
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
           用户数据     图片系统     AI Task
                          │           │
                          │           ↓
                          │       AI Provider
                          │           │
                          │       ┌───┴────┐
                          │       ↓        ↓
                          │    Hair AI   Image AI
                          │
                          ↓
                    Object Storage
                          │
                          ↓
                    AI 生成结果
                          │
                          ↓
                    Client 展示
                          │
                          ↓
                    User Feedback
```

最终形成：

> **一个真正能跑起来的 PhantomMirror V0\.1。**
> 
> 

---

# 二、Phase 1 技术范围

## 2\.1 本阶段包含

### Client

- Flutter

- Web / Mobile 基础体验

- 图片选择

- 图片上传

- 分析状态

- 发型选择

- 结果展示

- 用户反馈

### Backend

- API Gateway / REST API

- User

- Photo

- Appearance Profile

- Hairstyle

- AI Task

- Simulation

- Feedback

- Authentication / Session

- Object Storage

- Database

- Redis / Queue

### AI

- Face Analysis

- Hair Analysis

- Hairstyle Try\-On

- Image Generation

- AI Provider 抽象层

- AI 结果评价

### Infrastructure

- Docker

- CI/CD

- Object Storage

- PostgreSQL

- Redis

- Monitoring

- Logging

---

# 三、Phase 1 暂不包含

以下全部进入 Backlog：

- 原生 iOS App

- 原生 Android App

- 自研 iOS/Android UI

- ESP32

- ToF

- 深度摄像头

- 3D Head

- Gaussian Splatting

- Hair Physics

- 专业摄像头

- 智能镜子

- 理发店 SaaS

- 医美

- 大规模推荐系统

- 自研基础模型

- 大规模 GPU 集群

---

# 四、客户端技术路线

## 4\.1 是否需要 Flutter \+ iOS \+ Android 全部开发？

不需要。

Phase 1 推荐：

> **Flutter 作为主要客户端技术。**
> 
> 

最终：

```Plain Text
Flutter
                     │
             ┌───────┴───────┐
             ↓               ↓
          Android           iOS
```

一套业务代码。

---

# 五、为什么现在不同时做原生 iOS / Android？

因为 PhantomMirror 当前最大的未知数不是：

> “我们的 App UI 做得够不够漂亮？”
> 
> 

而是：

> “AI 发型模拟到底有没有产品价值？”
> 
> 

如果现在同时：

```Plain Text
Flutter
+
Swift
+
Kotlin
```

相当于同时维护三套客户端。

对于 Solo Founder 来说：

> **投入产出比非常低。**
> 
> 

---

# 六、但 Flutter 不等于不学原生

这是 Phase 1 非常重要的一点。

你仍然需要学习：

### Android 基础

- Android Application

- Activity

- Permission

- Camera

- Storage

- Network

- Lifecycle

### iOS 基础

- App Lifecycle

- Camera

- Photo Library

- Permission

- Network

- Swift 基础

- SwiftUI 基础

但这些知识的目的不是马上写原生 App。

而是理解：

> **Flutter 最终是如何运行在 Android / iOS 上的。**
> 
> 

---

# 七、客户端模块划分

```Plain Text
Flutter App
│
├── Core
│   ├── Network
│   ├── Storage
│   ├── Config
│   └── Error
│
├── Features
│   │
│   ├── Home
│   │
│   ├── Photo
│   │   ├── Pick
│   │   ├── Preview
│   │   └── Upload
│   │
│   ├── Analysis
│   │   ├── Status
│   │   └── Profile
│   │
│   ├── Hairstyle
│   │   ├── List
│   │   ├── Detail
│   │   └── Select
│   │
│   ├── Simulation
│   │   ├── Progress
│   │   ├── Result
│   │   └── Compare
│   │
│   └── Feedback
│
└── Shared
    ├── Widgets
    ├── Theme
    └── Utils
```

---

# 八、客户端页面

## C001 Home

功能：

- 产品介绍

- 开始体验

---

## C002 Photo Upload

功能：

- 相机

- 相册

- 图片选择

- 图片裁剪

- 图片预览

---

## C003 Upload

流程：

```Plain Text
选择图片
 ↓
本地检查
 ↓
获取上传地址
 ↓
上传 Object Storage
 ↓
通知 Backend
```

---

## C004 Analysis

显示：

```Plain Text
正在分析你的脸型
正在分析你的头发
正在建立个人特征
```

---

## C005 Hairstyle

显示：

- 发型列表

- 发型图片

- 分类

- 风格

- 长度

- 选择

---

## C006 Simulation

显示：

```Plain Text
正在为你生成专属发型……
```

---

## C007 Result

核心：

```Plain Text
Original
    ↕
Result
```

支持：

- 前后对比

- 保存

- 换发型

- 重新生成

---

## C008 Feedback

例如：

```Plain Text
这个结果：

非常满意
满意
一般
不满意
非常不满意
```

以及：

> 为什么？
> 
> 

---

# 九、客户端与 Backend 的边界

客户端：

> **负责用户交互。**
> 
> 

Backend：

> **负责业务、数据、权限、AI任务。**
> 
> 

客户端不应该：

- 保存 AI API Key

- 直接调用 Perfect Corp

- 直接调用内部 AI 服务

- 决定 AI Pipeline

- 操作数据库

---

# 十、Backend 技术路线

## 10\.1 推荐

Phase 1：

> **TypeScript \+ NestJS**
> 
> 

原因：

```Plain Text
Flutter
     ↓
REST API
     ↓
NestJS
     ↓
PostgreSQL / Redis
```

TypeScript 对 API / JSON / Web 开发比较顺手。

---

# 十一、为什么暂时不推荐 Java？

Java 本身当然完全可以做。

如果以后：

- 团队 Java 化

- 企业客户

- 大型后端团队

- Spring Cloud

- 大型 B2B 系统

Java 会非常合理。

但 PhantomMirror Phase 1 是：

> Solo \+ AI \+ 快速实验。
> 
> 

因此不建议为了“企业级”提前引入：

- Spring Cloud

- 微服务

- 注册中心

- 配置中心

- MQ 集群

- Kubernetes

---

# 十二、为什么 AI 不放进 TypeScript？

AI/CV 部分推荐：

> **Python**
> 
> 

形成：

```Plain Text
Backend
                 TypeScript/NestJS
                       │
                       ↓
                  AI Task Layer
                       │
                       ↓
                    Python
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         CV       AI Provider   Local Model
```

原因：

Python 的 AI/CV 生态更加成熟。

---

# 十三、Backend 模块

```Plain Text
Backend
│
├── Auth
├── User
├── Photo
├── Appearance
├── Hairstyle
├── Simulation
├── AI Task
├── Feedback
└── Admin
```

---

# 十四、User Module

负责：

- 用户 ID

- Session

- 登录

- 用户数据

Phase 1 可以支持：

> Anonymous User
> 
> 

避免注册系统过度复杂。

---

# 十五、Photo Module

负责：

- 图片元数据

- 上传

- 图片状态

- 图片权限

- 删除

数据库只保存：

```Plain Text
photo_id
user_id
storage_key
metadata
```

真正图片：

> Object Storage
> 
> 

---

# 十六、Appearance Module

负责：

```Plain Text
PersonalAppearanceProfile
```

例如：

```JSON
{
  "face_shape": "oval",
  "hair_type": "straight",
  "hair_length": "short",
  "hair_density": "medium",
  "hair_frizziness": "low"
}
```

注意：

> 这些字段只是 Phase 1 数据结构，不能把第三方 AI 输出直接当成“绝对真实的人体属性”。
> 
> 

---

# 十七、Hairstyle Module

管理：

- 发型

- 分类

- Reference Image

- Style ID

- Metadata

例如：

```Plain Text
hairstyle_id
name
category
gender
length
texture
provider_style_id
reference_image
```

---

# 十八、Simulation Module

这是整个产品的核心业务模块。

负责：

```Plain Text
Photo
+
Appearance Profile
+
Hairstyle
        ↓
Simulation
```

---

# 十九、AI Task Module

AI 任务统一管理。

状态：

```Plain Text
CREATED
UPLOADING
QUEUED
PROCESSING
SUCCESS
FAILED
CANCELLED
```

---

# 二十、为什么一定要做 Task？

因为 AI 图片生成不是普通：

```Plain Text
GET /user
```

这种请求。

它可能：

```Plain Text
提交
 ↓
排队
 ↓
AI 处理
 ↓
生成
 ↓
返回
```

所以：

```Plain Text
POST /simulations
```

返回：

```JSON
{
  "task_id": "xxx",
  "status": "PROCESSING"
}
```

然后客户端：

```Plain Text
GET /tasks/{task_id}
```

或者未来：

> WebSocket / SSE
> 
> 

获得状态变化。

---

# 二十一、核心 API

## POST /photos/upload\-url

获取上传地址。

返回：

```JSON
{
  "photo_id": "xxx",
  "upload_url": "xxx"
}
```

---

## POST /photos/\{id\}/complete

通知 Backend：

> 图片上传完成。
> 
> 

---

## POST /analysis

创建分析任务。

---

## GET /analysis/\{task\_id\}

查询分析状态。

---

## GET /hairstyles

获得发型列表。

---

## POST /simulations

创建模拟任务。

---

## GET /simulations/\{id\}

获取模拟状态。

---

## POST /feedback

提交反馈。

---

# 二十二、最重要的：图片怎么走？

这是整个 Phase 1 最重要的基础设施设计。

**不要这样做：**

```Plain Text
Flutter
 ↓
Backend
 ↓
Backend 保存图片
 ↓
Backend 再上传 AI
```

这样会让 Backend 成为巨大的图片搬运工。

---

# 二十三、推荐架构：客户端直传对象存储

采用：

> **Pre\-signed URL**
> 
> 

流程：

```Plain Text
Flutter
             │
             │ 1. 请求上传地址
             ↓
          Backend
             │
             │ 2. 生成 Presigned URL
             ↓
       Object Storage
             ↑
             │
             │ 3. Flutter 直接上传
             │
          Flutter
```

完成以后：

```Plain Text
Flutter
   │
   │ 4. complete
   ↓
Backend
```

这样 Backend 不需要传输整个图片文件。

---

# 二十四、AI 图片处理流程

完整流程：

```Plain Text
Flutter
                            │
                            │
                     Upload Request
                            ↓
                         Backend
                            │
                            ↓
                    Presigned URL
                            │
                            ↓
                    Object Storage
                            │
                            │
                            ↓
                    Backend Create Task
                            │
                            ↓
                      AI Orchestrator
                            │
               ┌────────────┼────────────┐
               ↓            ↓            ↓
          Perfect Corp   Other API    Local Model
               │            │            │
               └────────────┼────────────┘
                            ↓
                       AI Result
                            │
                            ↓
                    Object Storage
                            │
                            ↓
                         Backend
                            │
                            ↓
                         Flutter
```

---

# 二十五、为什么 AI API 必须经过 Backend？

因为：

```Plain Text
Flutter
 ↓
Perfect Corp API
```

意味着：

> API Key 可能暴露给客户端。
> 
> 

这是不允许的。

正确：

```Plain Text
Flutter
 ↓
PhantomMirror Backend
 ↓
AI Provider
```

API Key：

> 只存在云端。
> 
> 

---

# 二十六、Phase 1 AI Provider Strategy

这里我们不要赌一家。

建立：

```Plain Text
AIProvider
│
├── PerfectCorpProvider
├── GeminiProvider
├── OpenAIProvider
└── LocalProvider
```

---

# 二十七、第一优先级：Perfect Corp

目前 Perfect Corp\. 已经公开提供 Hair \& Beard API，包括：

- AI Hairstyle Virtual Try\-On

- Hair Type Detection

- Hair Length Detection

- Hair Frizziness Detection

- Hair Density Detection

官方还提供 API Playground，并允许开发者先测试。

其 Hairstyle API 官方说明采用用户图片 \+ `style_id` 的方式调用，并返回生成结果；官方文档也明确支持 Flutter、JavaScript、Java、Python、Node\.js 等接入方式。

因此：

> **Perfect Corp 是 Phase 1 第一候选供应商。**
> 
> 

---

# 二十八、但绝对不能直接相信“官方效果最好”

Perfect Corp\. 官方宣称其 Hairstyle API 强调：

- 面部特征保持

- 发丝和发梢完整性

- 高保真

- 商业级一致性

这些是**供应商自己的产品声明**，不是我们自己的测试结论。

所以 PhantomMirror 必须建立：

> **自己的 Benchmark。**
> 
> 

---

# 二十九、AI Benchmark

准备：

```Plain Text
20 人
×
10 个发型
=
200 次测试
```

记录：

最终得到：

> PhantomMirror Hair Generation Benchmark V0\.1
> 
> 

---

# 三十、第二候选：通用图像生成 API

通用模型也应该测试。

例如 Gemini API 目前支持：

> text \+ image → image editing / image\-to\-image
> 
> 

并支持对输入图像进行局部修改、保持其他内容不变等图像编辑流程。

这类 API 的优势：

- 灵活

- 可以自由描述发型

- 可以进行多轮修改

- 可以做更复杂的图像编辑

但问题是：

> **它不一定天然适合“严格发型替换”。**
> 
> 

所以它应该作为 Benchmark 的候选，而不是默认方案。

---

# 三十一、第三类：自己部署模型

例如：

```Plain Text
Open Source Model
       ↓
GPU Server
       ↓
Python
       ↓
Inference
```

Phase 1：

> 只做实验，不急于生产。
> 
> 

原因：

自己部署意味着：

- GPU

- CUDA

- 模型下载

- 显存

- 推理优化

- 并发

- 模型更新

- 运维

这些会快速吃掉 Solo Founder 的时间。

---

# 三十二、AI Provider 抽象层

Backend 不能写成：

```Plain Text
simulation.service.ts
    ↓
PerfectCorp API
```

而应该：

```Plain Text
simulation.service.ts
          ↓
AIProvider
          ↓
┌─────────┼─────────┐
↓         ↓         ↓
Perfect  Gemini    Local
```

---

# 三十三、统一接口

例如逻辑上：

```TypeScript
interface HairstyleProvider {

    analyzeHair(input): Promise<HairAnalysis>;

    analyzeFace(input): Promise<FaceAnalysis>;

    generateHairstyle(input): Promise<GenerationResult>;

}
```

具体实现：

```Plain Text
PerfectCorpHairstyleProvider
GeminiHairstyleProvider
LocalHairstyleProvider
```

这样以后：

> 更换 AI 供应商 ≠ 重写整个产品。
> 
> 

---

# 三十四、图片存储架构

建议：

```Plain Text
Object Storage
│
├── original/
│
├── processed/
│
├── analysis/
│
├── mask/
│
└── generated/
```

数据库只保存：

```Plain Text
storage_key
```

---

# 三十五、图片生命周期

原始照片：

```Plain Text
Upload
 ↓
Analysis
 ↓
Generation
 ↓
Feedback
```

之后根据产品策略：

> 自动删除 / 用户删除 / 长期保存。
> 
> 

Phase 1 建议：

> 默认最小化保存。
> 
> 

---

# 三十六、数据库

推荐：

> PostgreSQL
> 
> 

核心表：

```Plain Text
users
photos
appearance_profiles
hairstyles
ai_tasks
simulations
feedbacks
```

---

# 三十七、Redis

第一阶段用途：

```Plain Text
Redis
│
├── Task Queue
├── Cache
├── Rate Limit
└── Session
```

不要一开始把 Redis 当数据库。

---

# 三十八、AI Worker

推荐：

```Plain Text
NestJS
   │
   ↓
Queue
   │
   ↓
Python Worker
   │
   ↓
AI Provider
```

Worker 负责：

- 下载/读取图片

- 调用 AI

- 处理结果

- 保存结果

- 更新 Task 状态

---

# 三十九、完整云端架构

```Plain Text
Internet
                            │
                            ↓
                     ┌─────────────┐
                     │ Load Balancer│
                     └──────┬──────┘
                            │
                            ↓
                     ┌─────────────┐
                     │ NestJS API  │
                     └──────┬──────┘
                            │
            ┌───────────────┼────────────────┐
            ↓               ↓                ↓
       PostgreSQL         Redis         Object Storage
            │               │                │
            │               │                │
            │               ↓                │
            │            Task Queue          │
            │               │                │
            │               ↓                │
            │        ┌──────────────┐        │
            │        │ AI Worker    │        │
            │        │ Python       │        │
            │        └──────┬───────┘        │
            │               │                │
            │       ┌───────┼────────┐       │
            │       ↓       ↓        ↓       │
            │   Perfect   Gemini   Local     │
            │     API      API    Model      │
            │       │       │        │       │
            └───────┴───────┴────────┴───────┘
```

---

# 四十、Phase 1 不需要 Kubernetes

明确：

> 不需要 Kubernetes。
> 
> 

不需要：

- Service Mesh

- Kafka

- Kubernetes

- Istio

- 微服务集群

第一阶段：

```Plain Text
Docker Compose
+
单体 Backend
+
Worker
+
PostgreSQL
+
Redis
+
Object Storage
```

足够。

---

# 四十一、研发时间分配原则

你特别提出：

> AI 可以帮忙写代码，但是必须保留原生知识学习。
> 
> 

因此 Phase 1 每个月建议：

```Plain Text
40% 产品/技术学习
30% 自己设计/阅读/调试
20% AI 辅助编码
10% 文档/复盘
```

而不是：

```Plain Text
90% Claude 写代码
10% 看代码
```

---

# 四十二、为什么 AI Coding 不能占 90%？

因为你最终需要自己理解：

```Plain Text
为什么这么设计？
为什么这么分模块？
为什么这样传图片？
为什么这个 API 是异步？
为什么这个数据库这么设计？
为什么 AI Provider 要抽象？
```

否则项目做出来了：

> 你拥有代码，但没有拥有系统。
> 
> 

---

# 四十三、月度排期

## 2026\-10

### 主题

> 产品 \+ 架构基础 \+ AI API 调研
> 
> 

### 学习

Flutter：

- Dart 基础

- Widget

- State

- Navigation

- HTTP

- File

- Permission

Backend：

- NestJS

- REST

- TypeScript

- PostgreSQL

AI：

- API

- Image\-to\-Image

- AI Provider

### 开发

完成：

```Plain Text
Flutter Hello World
        ↓
NestJS
        ↓
GET /health
```

### AI 实验

直接使用 Perfect Corp Playground。

测试：

> 自己的照片 \+ 不同发型。
> 
> 

---

# 四十四、2026\-11

## Flutter \+ Client

学习：

- Flutter Layout

- State Management

- HTTP

- File Picker

- Image

- Permission

开发：

```Plain Text
Home
 ↓
Upload
 ↓
Preview
 ↓
Result Mock
```

此时：

> AI 可以先不用接。
> 
> 

---

# 四十五、2026\-12

## Backend \+ Object Storage

学习：

- REST API

- PostgreSQL

- Redis

- Object Storage

- Presigned URL

- Authentication

开发：

```Plain Text
Flutter
 ↓
Backend
 ↓
Presigned URL
 ↓
Object Storage
```

完成：

> 用户可以真正上传图片。
> 
> 

---

# 四十六、2027\-01

## AI Integration

学习：

- AI API

- Async Task

- Webhook / Polling

- Image Processing

- Prompt / Reference Image

开发：

```Plain Text
Photo
 ↓
Backend
 ↓
AI Provider
 ↓
Result
```

首先接：

> Perfect Corp\.
> 
> 

---

# 四十七、2027\-02

## AI Benchmark

不急着继续堆代码。

测试：

```Plain Text
Perfect Corp
VS
Gemini / 其他候选
VS
开源模型
```

至少：

> 20 人 × 10 发型。
> 
> 

形成：

> AI Hairstyle Benchmark V0\.1
> 
> 

---

# 四十八、2027\-03

## 完整 Prototype

完成：

```Plain Text
Flutter
 ↓
Upload
 ↓
Analysis
 ↓
Hairstyle
 ↓
Generate
 ↓
Result
 ↓
Feedback
```

这时候才算：

> PhantomMirror V0\.1 Alpha
> 
> 

---

# 四十九、2027\-04

## 原生与客户端深入

这一个月适当降低新功能开发。

学习：

### Android

- Kotlin

- Activity

- Camera

- Permission

- Lifecycle

### iOS

- Swift

- SwiftUI

- Camera

- Permission

- Lifecycle

目标：

> 理解 Flutter 与底层平台的关系。
> 
> 

不是马上重写 App。

---

# 五十、2027\-05

## Real User Testing

目标：

> 10～20 名真实用户。
> 
> 

测试：

```Plain Text
Original
 ↓
Analysis
 ↓
Hairstyle
 ↓
Prediction
 ↓
Feedback
```

重点记录：

> AI 哪里失败。
> 
> 

---

# 五十一、2027\-06

## Phase 1 Review

完成：

- Product Review

- Architecture Review

- AI Benchmark

- User Testing

- Cost Analysis

- Error Analysis

输出：

> PhantomMirror Phase 1 Final Report
> 
> 

然后决定 Phase 2。

---

# 五十二、每月时间结构

为了避免你“AI 写一天代码，然后感觉自己学会了”，每个月建议固定：

## Week A

> 学习基础知识
> 
> 

## Week B

> 自己设计
> 
> 

## Week C

> AI 辅助开发
> 
> 

## Week D

> 调试 \+ 实验 \+ 总结
> 
> 

如果某个月实验复杂：

> 允许延期。
> 
> 

---

# 五十三、每个功能的开发模式

例如：

## 功能：图片上传

第一步：

> 自己理解 HTTP Upload。
> 
> 

第二步：

> 自己设计 API。
> 
> 

第三步：

> 自己画流程。
> 
> 

第四步：

> 让 AI 写初版。
> 
> 

第五步：

> 自己逐行阅读。
> 
> 

第六步：

> 自己修改。
> 
> 

第七步：

> 自己测试。
> 
> 

第八步：

> 写技术笔记。
> 
> 

这样：

> AI 是你的高级程序员，而不是替代你的大脑。
> 
> 

---

# 五十四、第一阶段核心学习路线

## Client

```Plain Text
Dart
 ↓
Flutter
 ↓
HTTP
 ↓
State
 ↓
File / Camera
 ↓
Native Bridge
 ↓
Android / iOS
```

---

## Backend

```Plain Text
TypeScript
 ↓
NestJS
 ↓
REST
 ↓
PostgreSQL
 ↓
Redis
 ↓
Object Storage
 ↓
Async Task
 ↓
Docker
 ↓
Cloud Deployment
```

---

## AI

```Plain Text
Python
 ↓
OpenCV
 ↓
Image Processing
 ↓
Face
 ↓
Hair
 ↓
Segmentation
 ↓
Generative AI
 ↓
Image-to-Image
 ↓
AI Evaluation
```

---

# 五十五、Token 成本控制

这是 PhantomMirror 必须从第一天就设计的。

## 原则 1

开发阶段：

> 不允许每次调试都调用生产级高价模型。
> 
> 

---

## 原则 2

保存测试图片。

建立：

```Plain Text
benchmark/
├── person_001/
├── person_002/
...
```

以后修改 Prompt / Backend：

> 尽量复用同一批测试数据。
> 
> 

---

## 原则 3

记录每次 AI 调用

```Plain Text
provider
model
input
output
latency
cost
success
```

---

## 原则 4

开发阶段使用：

> 低成本 / 免费额度 / Playground。
> 
> 

---

## 原则 5

建立 AI Cache

相同：

```Plain Text
photo
+
hairstyle
+
model
+
parameters
```

不重复生成。

---

# 五十六、AI 成本数据表

建立：

```Plain Text
AIUsage

id
provider
model
task_type
input_size
output_size
latency
estimated_cost
created_at
```

以后你可以直接算：

> 一个用户平均多少钱。
> 
> 

---

# 五十七、图片安全

图片不能：

```Plain Text
公开 URL
```

应该：

```Plain Text
Private Bucket
      ↓
Presigned URL
      ↓
短时间访问
```

---

# 五十八、AI Provider 数据隐私

每接一个 AI Provider，都记录：

```Plain Text
Provider
数据是否上传
保存多久
是否用于训练
地区
API SLA
价格
删除机制
```

然后再决定：

> 哪些照片允许送过去。
> 
> 

---

# 五十九、第一阶段架构决策原则

## ADR\-001

### Client

> Flutter
> 
> 

---

## ADR\-002

### Backend

> NestJS \+ TypeScript
> 
> 

---

## ADR\-003

### AI

> Python Worker \+ Provider Abstraction
> 
> 

---

## ADR\-004

### Database

> PostgreSQL
> 
> 

---

## ADR\-005

### Queue

> Redis
> 
> 

---

## ADR\-006

### Storage

> S3\-compatible Object Storage
> 
> 

---

## ADR\-007

### Architecture

> Modular Monolith
> 
> 

---

## ADR\-008

### AI Strategy

> BUY → BUILD → RESEARCH
> 
> 

---

# 六十、最终 Phase 1 架构

```Plain Text
USER
                          │
                          ↓
                    Flutter Client
                          │
                          │ HTTPS
                          ↓
                  ┌───────────────┐
                  │   NestJS API  │
                  └───────┬───────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ↓               ↓                ↓
     PostgreSQL         Redis        Object Storage
          │               │                ↑
          │               ↓                │
          │            AI Queue             │
          │               │                │
          │               ↓                │
          │        Python AI Worker         │
          │               │                │
          │      ┌────────┼─────────┐      │
          │      ↓        ↓         ↓      │
          │   Perfect   Gemini    Local    │
          │      API      API     Model     │
          │      │        │         │       │
          └──────┴────────┴─────────┘       │
                          │                 │
                          └─────────────────┘
                                  ↓
                              AI Result
                                  ↓
                              Flutter
                                  ↓
                              Feedback
                                  ↓
                            PostgreSQL
```

---

# 六十一、Phase 1 最终交付物

## 产品

- PhantomMirror V0\.1

## Client

- Flutter App

- Upload

- Analysis

- Hairstyle

- Simulation

- Result

- Feedback

## Backend

- NestJS

- REST API

- PostgreSQL

- Redis

- Object Storage

- Task System

## AI

- Perfect Corp Integration

- 至少一个第二 AI Provider 实验

- AI Provider Abstraction

- AI Benchmark

## Engineering

- Docker

- CI/CD

- Logging

- Error Handling

- Security

- Cost Monitoring

## Learning

- Flutter 基础

- Android 原生基础

- iOS 原生基础

- TypeScript/NestJS

- Object Storage

- AI API

- Python/CV 基础

---

# 六十二、Phase 1 的真正终点

Phase 1 不是：

> “我们把 Flutter App 做出来了。”
> 
> 

也不是：

> “我们调用了一个 AI API。”
> 
> 

真正的终点是：

```Plain Text
真实用户
   ↓
真实照片
   ↓
真实云端处理
   ↓
真实 AI 发型模拟
   ↓
真实用户评价
   ↓
真实数据
   ↓
我们知道下一步应该解决什么
```

到这里，PhantomMirror 才真正从：

> **一个想法**
> 
> 

变成：

> **一个拥有真实用户数据、真实技术实验和真实失败案例的产品项目。**
> 
> 



