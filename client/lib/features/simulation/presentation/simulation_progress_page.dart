import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/utils/task_poller.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../providers/simulation_provider.dart';

/// C006 模拟进度：创建任务 → 轮询 → 成功后跳转结果页。
class SimulationProgressPage extends ConsumerStatefulWidget {
  const SimulationProgressPage({
    super.key,
    required this.hairstyleId,
    this.photoId,
  });

  final String hairstyleId;
  final String? photoId;

  @override
  ConsumerState<SimulationProgressPage> createState() =>
      _SimulationProgressPageState();
}

class _SimulationProgressPageState extends ConsumerState<SimulationProgressPage> {
  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    // photoId 由路由 query 带进来（选图上传 → 分析 → 发型列表 → 这里）。
    // 传空串服务端会以 VALIDATION_FAILED 拒绝，错误会呈现在下面的 ErrorView。
    ref.read(simulationProvider.notifier).run(
          photoId: widget.photoId ?? '',
          hairstyleId: widget.hairstyleId,
        );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(simulationProvider, (_, next) {
      final sim = next.value;
      if (sim != null && sim.taskStatus == TaskStatus.success) {
        context.push('/result/${sim.simulationId}');
      }
    });

    final state = ref.watch(simulationProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('生成中')),
      body: state.when(
        loading: () => const LoadingView(message: '正在为你生成专属发型…'),
        error: (e, _) => ErrorView(
          message: e is ApiException ? e.message : '生成失败，请重试',
          onRetry: _start,
        ),
        data: (_) => const LoadingView(message: '正在为你生成专属发型…'),
      ),
    );
  }
}
