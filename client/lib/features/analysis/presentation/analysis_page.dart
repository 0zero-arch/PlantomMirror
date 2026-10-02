import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../data/appearance_profile_model.dart';
import '../providers/analysis_provider.dart';

/// C004 分析：展示进度 → Profile 摘要。
class AnalysisPage extends ConsumerStatefulWidget {
  const AnalysisPage({super.key, this.photoId});

  final String? photoId;

  @override
  ConsumerState<AnalysisPage> createState() => _AnalysisPageState();
}

class _AnalysisPageState extends ConsumerState<AnalysisPage> {
  @override
  void initState() {
    super.initState();
    final photoId = widget.photoId;
    if (photoId != null && photoId.isNotEmpty) {
      Future.microtask(() => ref.read(analysisProvider.notifier).run(photoId));
    }
  }

  void _start() {
    // TODO(Phase 1)：photo_id 来自上传流程，接入后替换。
    ref.read(analysisProvider.notifier).run(widget.photoId ?? '');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(analysisProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('智能分析')),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(AsyncValue<AppearanceProfile?> state) {
    if (widget.photoId == null || widget.photoId!.isEmpty) {
      return const Center(child: Text('完成照片上传后，这里会展示 AI 分析结果'));
    }
    return state.when(
      loading: () => const LoadingView(message: '正在分析脸型与头发…'),
      error: (e, _) => ErrorView(
        message: e is ApiException ? e.message : '分析失败，请重试',
        onRetry: _start,
      ),
      data: (profile) {
        if (profile == null) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('开始分析你的外貌特征'),
                const SizedBox(height: 16),
                OutlinedButton(onPressed: _start, child: const Text('开始分析')),
              ],
            ),
          );
        }
        return _ProfileSummary(profile: profile);
      },
    );
  }
}

class _ProfileSummary extends StatelessWidget {
  const _ProfileSummary({required this.profile});

  final AppearanceProfile profile;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Text('AI 初步判断', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                _row('脸型', profile.faceShape),
                _row('发质', profile.hairType),
                _row('发长', profile.hairLength),
                _row('发量', profile.hairDensity),
                _row('毛躁程度', profile.hairFrizziness),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () => context.push('/hairstyle'),
          child: const Text('选择发型'),
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
