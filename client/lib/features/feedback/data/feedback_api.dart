import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import 'feedback_model.dart';

final feedbackApiProvider = Provider<FeedbackApi>((ref) => FeedbackApi(ref.watch(dioProvider)));

class FeedbackApi {
  FeedbackApi(this._dio);

  final Dio _dio;

  Future<void> submit(AppFeedback feedback) async {
    await _dio.post<dynamic>(ApiEndpoints.feedback, data: feedback.toJson());
  }
}
