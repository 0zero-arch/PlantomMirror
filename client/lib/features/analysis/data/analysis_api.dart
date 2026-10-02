import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import 'appearance_profile_model.dart';

final analysisApiProvider = Provider<AnalysisApi>((ref) => AnalysisApi(ref.watch(dioProvider)));

/// 分析任务的一次状态快照。
class AnalysisTaskResult {
  const AnalysisTaskResult({required this.status, this.profile});

  final String status;
  final AppearanceProfile? profile;
}

class AnalysisApi {
  AnalysisApi(this._dio);

  final Dio _dio;

  /// 创建分析任务，返回 task_id。
  Future<String> create({required String photoId}) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.analysis,
      data: {'photo_id': photoId},
    );
    return res.data!['task_id'] as String;
  }

  Future<AnalysisTaskResult> getTask(String taskId) async {
    final res = await _dio.get<Map<String, dynamic>>(
      ApiEndpoints.analysisTask(taskId),
    );
    final data = res.data!;
    return AnalysisTaskResult(
      status: data['status'] as String,
      profile: data['profile'] == null
          ? null
          : AppearanceProfile.fromJson(data['profile'] as Map<String, dynamic>),
    );
  }
}
