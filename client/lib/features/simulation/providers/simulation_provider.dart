import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/task_poller.dart';
import '../data/simulation_api.dart';
import '../data/simulation_model.dart';

class SimulationNotifier extends AsyncNotifier<Simulation?> {
  @override
  Future<Simulation?> build() async => null;

  /// 创建模拟任务 → 轮询 → 返回结果 Simulation。
  Future<void> run({
    required String photoId,
    required String hairstyleId,
  }) async {
    state = const AsyncLoading<Simulation?>();
    state = await AsyncValue.guard(() async {
      final api = ref.read(simulationApiProvider);
      final config = ref.read(appConfigProvider);
      final simulationId = await api.create(
        photoId: photoId,
        hairstyleId: hairstyleId,
      );
      final result = await TaskPoller(
        interval: config.pollInterval,
        maxInterval: config.pollMaxInterval,
      ).poll(
        fetch: () => api.get(simulationId),
        isDone: (s) => s.taskStatus.isTerminal,
        timeout: config.simulationTimeout,
      );
      if (result.taskStatus != TaskStatus.success) {
        throw const ApiException(
          code: 'simulation_failed',
          message: '生成失败，请重试',
          retryable: true,
        );
      }
      return result;
    });
  }
}

final simulationProvider =
    AsyncNotifierProvider<SimulationNotifier, Simulation?>(SimulationNotifier.new);
