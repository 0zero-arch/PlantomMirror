# PhantomMirror 客户端环境配置（Android 优先 / D 盘安装）

**版本：** V0.1
**目标平台：** Android（Web 保留）
**硬约束：** C 盘空间不足，**所有工具链一律装 D 盘**。

> 本文档是安装清单与步骤，供「环境配置」这一步执行时照做。当前先落文档，实际安装再按此进行。

---

## 1. 安装总原则

1. 一切 SDK / 缓存 / 模拟器镜像装 **D 盘**，绝不放 C 盘。
2. 先装 Flutter SDK，再装 Android 工具链，最后用 `flutter doctor` 逐项验证。
3. 每装一步就验证一步，不要一口气装完再排查。

---

## 2. 磁盘规划（D 盘）

| 目录 | 用途 | 大小预估 |
|---|---|---|
| `D:\dev\flutter` | Flutter SDK | ~2 GB |
| `D:\dev\pub-cache` | Dart 包缓存（`PUB_CACHE`） | 1~3 GB |
| `D:\Android\Sdk` | Android SDK（`ANDROID_HOME`） | 5~10 GB |
| `D:\Android\Studio` | Android Studio（含自带 JDK/JBR） | 3~5 GB |
| `D:\Android\user` | AVD / adb 等（`ANDROID_USER_HOME`） | 视模拟器，每个 AVD 数 GB |
| `D:\Android\gradle` | Gradle 缓存（`GRADLE_USER_HOME`） | 2~5 GB（会持续涨） |

> ⚠️ 默认情况下 Flutter/Android 会把上面几项塞到 `C:\Users\asus\...`，必须用环境变量重定向到 D 盘。

---

## 3. 环境变量（用户级，需设置）

| 变量 | 值 | 说明 |
|---|---|---|
| `FLUTTER_HOME` | `D:\dev\flutter` | Flutter SDK 根 |
| `PATH`（追加） | `%FLUTTER_HOME%\bin` | 让 `flutter`/`dart` 可全局调用 |
| `ANDROID_HOME` | `D:\Android\Sdk` | Android SDK |
| `ANDROID_SDK_ROOT` | `D:\Android\Sdk` | 同上（部分工具读这个） |
| `ANDROID_USER_HOME` | `D:\Android\user` | AVD / adb key / `.android` |
| `GRADLE_USER_HOME` | `D:\Android\gradle` | Gradle 缓存（最容易占满 C 盘） |
| `PUB_CACHE` | `D:\dev\pub-cache` | Dart 依赖缓存 |
| `JAVA_HOME` | Android Studio 自带 JBR，如 `D:\Android\Studio\jbr` | 供 Gradle 用（可选，Studio 会自动找） |

---

## 4. 安装步骤

### Step 1：安装 Flutter SDK（D 盘）

1. 到 flutter.dev 下载 **Windows 稳定版 zip**（或 `git clone -b stable`）。
2. 解压到 `D:\dev\flutter`。
3. 设好上面的 `FLUTTER_HOME` / `PATH`。
4. 验证：

```bash
flutter --version
dart --version
```

5. 指定 Android SDK 路径：

```bash
flutter config --android-sdk D:\Android\Sdk
```

### Step 2：安装 Android Studio（D 盘）

1. 下载 Android Studio 安装包，安装时**自定义路径**选 `D:\Android\Studio`。
2. 安装时或首次启动时，把 SDK Location 指向 `D:\Android\Sdk`。
3. Android Studio 自带 JDK（JBR，位于 `D:\Android\Studio\jbr`），**无需单独装 JDK**（若坚持独立装，用 Temurin JDK 17 到 D 盘）。

### Step 3：通过 SDK Manager 装 Android SDK 组件

在 Android Studio → SDK Manager 里勾选：

- Android SDK Platform（当前稳定 API，如 34/35）
- Android SDK Build-Tools
- Android SDK Platform-Tools（含 adb）
- Android SDK Command-line Tools（latest）

全部装到 `D:\Android\Sdk`。

### Step 4：创建 AVD（模拟器，D 盘）

1. Android Studio → Device Manager → Create Device。
2. AVD 数据会存到 `ANDROID_USER_HOME`（即 `D:\Android\user`）。
3. 优先**真机调试**（开 USB 调试，省模拟器性能开销）；模拟器作为无真机时的备选。

### Step 5：安装 VS Code 扩展

- Flutter（官方）
- Dart（官方）

### Step 6：接受 Android 许可 & 验证

```bash
flutter doctor -v
```

按提示处理：

```bash
flutter doctor --android-licenses   # 接受许可
```

目标：`flutter doctor` 里 **Flutter / Android toolchain 两项全绿**（VS Code 可选，Chrome 可选）。

---

## 5. 跑通 Hello World

```bash
cd D:\PlantomMirror
flutter create --org com.phantommirror --project-name phantom_mirror client
cd client
flutter devices                      # 确认能看到 Android 设备/模拟器
flutter run -d <device-id>           # Android 优先
# Web 备用：flutter run -d chrome
```

---

## 6. 常见坑（提前规避）

| 坑 | 规避 |
|---|---|
| C 盘被 Gradle/Pub/AVD 撑爆 | 务必设 `GRADLE_USER_HOME` / `PUB_CACHE` / `ANDROID_USER_HOME` 到 D 盘 |
| 首次构建下载依赖慢 | 配置国内镜像（flutter 镜像、Gradle 阿里云镜像、`PUB_HOSTED_URL`） |
| 项目路径含中文/空格 | 工程路径用纯英文（本项目 `D:\PlantomMirror` 已符合，避免中文子目录） |
| 许可未接受 | 跑 `flutter doctor --android-licenses` |
| 真机连不上 | 开启开发者选项 + USB 调试；装好对应手机厂商驱动 |
| Java 找不到 | 确认 `JAVA_HOME` 指向 Studio 自带 JBR，或 Gradle 用 Studio JDK |

---

## 7. 环境就绪的判定标准

- `flutter --version` 正常输出。
- `flutter doctor` 中 Flutter 与 Android toolchain 无红色错误。
- `client` 工程能 `flutter run` 到 Android 真机/模拟器，显示 Hello World。

满足以上即进入下一阶段：按《client-architecture.md》的目录结构搭建骨架。
