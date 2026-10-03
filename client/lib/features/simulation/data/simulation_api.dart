import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import 'simulation_model.dart';

final simulationApiProvider = Provider<SimulationApi>((ref) => SimulationApi(ref.watch(dioProvider)));

class SimulationApi {
  SimulationApi(this._dio);

  final Dio _dio;

  /// 创建模拟任务，返回 simulationId。
  Future<String> create({
    required String photoId,
    required String hairstyleId,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.simulations,
      data: {'photoId': photoId, 'hairstyleId': hairstyleId},
    );
    return res.data!['simulationId'] as String;
  }

  Future<Simulation> get(String simulationId) async {
    final res = await _dio.get<Map<String, dynamic>>(
      ApiEndpoints.simulation(simulationId),
    );
    return Simulation.fromJson(res.data!);
  }
}
