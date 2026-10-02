import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 应用配置。通过 `--dart-define` 注入，缺省回落到开发默认值。
///
/// 示例：
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000 --dart-define=APP_ENV=dev`
class AppConfig {
  const AppConfig({
    required this.baseUrl,
    required this.env,
    required this.connectTimeout,
    required this.receiveTimeout,
    required this.analysisTimeout,
    required this.simulationTimeout,
    required this.pollInterval,
    required this.pollMaxInterval,
  });

  factory AppConfig.fromEnvironment() {
    const env = String.fromEnvironment('APP_ENV', defaultValue: 'dev');
    const baseUrl = String.fromEnvironment(
      'API_BASE_URL',
      // Android 模拟器访问宿主机用 10.0.2.2；真机调试请改为开发机局域网 IP。
      defaultValue: 'http://10.0.2.2:3000',
    );
    return AppConfig(
      baseUrl: baseUrl,
      env: env,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      analysisTimeout: const Duration(seconds: 60),
      simulationTimeout: const Duration(seconds: 120),
      pollInterval: const Duration(seconds: 2),
      pollMaxInterval: const Duration(seconds: 5),
    );
  }

  final String baseUrl;
  final String env;
  final Duration connectTimeout;
  final Duration receiveTimeout;

  /// 分析任务轮询超时。
  final Duration analysisTimeout;

  /// 模拟任务轮询超时（AI 生成较慢）。
  final Duration simulationTimeout;

  final Duration pollInterval;
  final Duration pollMaxInterval;
}

final appConfigProvider = Provider<AppConfig>((ref) => AppConfig.fromEnvironment());
