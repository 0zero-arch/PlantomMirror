import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/task_poller.dart';
import '../data/analysis_api.dart';
import '../data/appearance_profile_model.dart';

class AnalysisNotifier extends AsyncNotifier<AppearanceProfile?> {
  @override
  Future<AppearanceProfile?> build() async => null;

  /// 创建分析任务 → 轮询 → 返回 Profile。
  Future<void> run(String photoId) async {
    state = const AsyncLoading<AppearanceProfile?>();
    state = await AsyncValue.guard(() async {
      final api = ref.read(analysisApiProvider);
      final config = ref.read(appConfigProvider);
      final taskId = await api.create(photoId: photoId);
      final result = await TaskPoller(
        interval: config.pollInterval,
        maxInterval: config.pollMaxInterval,
      ).poll(
        fetch: () => api.getTask(taskId),
        isDone: (r) => TaskStatus.fromWire(r.status).isTerminal,
        timeout: config.analysisTimeout,
      );
      if (TaskStatus.fromWire(result.status) != TaskStatus.success) {
        throw const ApiException(
          code: 'analysis_failed',
          message: '分析失败，请重试',
          retryable: true,
        );
      }
      return result.profile;
    });
  }
}

final analysisProvider =
    AsyncNotifierProvider<AnalysisNotifier, AppearanceProfile?>(AnalysisNotifier.new);
