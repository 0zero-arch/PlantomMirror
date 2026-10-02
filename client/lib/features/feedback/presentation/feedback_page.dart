import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/primary_button.dart';
import '../data/feedback_model.dart';
import '../providers/feedback_provider.dart';

/// C008 反馈：满意度 + 原因 + 意见。
class FeedbackPage extends ConsumerStatefulWidget {
  const FeedbackPage({super.key, required this.simulationId});

  final String simulationId;

  @override
  ConsumerState<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends ConsumerState<FeedbackPage> {
  int _rating = 5;
  final List<String> _reasons = [];
  final TextEditingController _commentController = TextEditingController();

  static const _reasonOptions = ['效果自然', '符合预期', '想换别的', '效果不佳', '其他'];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _submit() {
    final feedback = AppFeedback(
      simulationId: widget.simulationId,
      rating: _rating,
      reason: _reasons.isEmpty ? null : _reasons.join(','),
      comment: _commentController.text.trim().isEmpty
          ? null
          : _commentController.text.trim(),
    );
    ref.read(feedbackProvider.notifier).submit(feedback);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedbackProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('反馈')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text(
            '对这次效果满意吗？',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(5, (i) {
              final v = i + 1;
              return IconButton(
                onPressed: () => setState(() => _rating = v),
                icon: Icon(
                  v <= _rating ? Icons.star : Icons.star_border,
                  color: Colors.amber,
                  size: 36,
                ),
              );
            }),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _reasonOptions.map((r) {
              final selected = _reasons.contains(r);
              return FilterChip(
                label: Text(r),
                selected: selected,
                onSelected: (v) => setState(() {
                  if (v) {
                    _reasons.add(r);
                  } else {
                    _reasons.remove(r);
                  }
                }),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: '其他意见（选填）',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),
          if (state.status == FeedbackStatus.success)
            const Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: Text(
                '感谢你的反馈！',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.green),
              ),
            ),
          if (state.status == FeedbackStatus.error)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                state.message ?? '提交失败，请重试',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          PrimaryButton(
            label: '提交',
            loading: state.status == FeedbackStatus.submitting,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}
