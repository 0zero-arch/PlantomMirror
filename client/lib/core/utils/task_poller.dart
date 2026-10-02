import '../network/api_exception.dart';

/// 异步任务状态（客户端镜像后端定义）。
enum TaskStatus {
  created('CREATED'),
  uploading('UPLOADING'),
  queued('QUEUED'),
  processing('PROCESSING'),
  success('SUCCESS'),
  failed('FAILED'),
  cancelled('CANCELLED');

  const TaskStatus(this.wire);

  /// 后端 wire 值。
  final String wire;

  bool get isTerminal =>
      this == TaskStatus.success ||
      this == TaskStatus.failed ||
      this == TaskStatus.cancelled;

  static TaskStatus fromWire(String? s) {
    return TaskStatus.values.firstWhere(
      (e) => e.wire == s || e.name.toUpperCase() == s,
      orElse: () => TaskStatus.created,
    );
  }
}

/// 通用任务轮询器（分析 / 模拟两处复用）。
///
/// 间隔从 [interval] 指数退避到 [maxInterval]，直到 [isDone] 为真或超时。
class TaskPoller {
  TaskPoller({
    this.interval = const Duration(seconds: 2),
    this.maxInterval = const Duration(seconds: 5),
  });

  final Duration interval;
  final Duration maxInterval;

  Future<T> poll<T>({
    required Future<T> Function() fetch,
    required bool Function(T) isDone,
    required Duration timeout,
  }) async {
    final deadline = DateTime.now().add(timeout);
    var delay = interval;
    var result = await fetch();

    while (!isDone(result)) {
      if (DateTime.now().isAfter(deadline)) {
        throw const ApiException(
          code: 'timeout',
          message: '处理较慢，请稍后重试',
          retryable: true,
        );
      }
      await Future<void>.delayed(delay);
      final next = delay * 2;
      delay = next > maxInterval ? maxInterval : next;
      result = await fetch();
    }
    return result;
  }
}
