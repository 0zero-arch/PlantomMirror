import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/feedback_api.dart';
import '../data/feedback_model.dart';

enum FeedbackStatus { idle, submitting, success, error }

class FeedbackState {
  const FeedbackState({this.status = FeedbackStatus.idle, this.message});

  final FeedbackStatus status;
  final String? message;
}

class FeedbackNotifier extends Notifier<FeedbackState> {
  @override
  FeedbackState build() => const FeedbackState();

  Future<void> submit(AppFeedback feedback) async {
    state = const FeedbackState(status: FeedbackStatus.submitting);
    try {
      await ref.read(feedbackApiProvider).submit(feedback);
      state = const FeedbackState(status: FeedbackStatus.success);
    } catch (_) {
      state = const FeedbackState(status: FeedbackStatus.error, message: '提交失败，请重试');
    }
  }
}

final feedbackProvider = NotifierProvider<FeedbackNotifier, FeedbackState>(FeedbackNotifier.new);
