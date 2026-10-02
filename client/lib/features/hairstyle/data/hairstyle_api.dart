import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import 'hairstyle_model.dart';

final hairstyleApiProvider = Provider<HairstyleApi>((ref) => HairstyleApi(ref.watch(dioProvider)));

class HairstyleApi {
  HairstyleApi(this._dio);

  final Dio _dio;

  Future<List<Hairstyle>> list() async {
    final res = await _dio.get<List<dynamic>>(ApiEndpoints.hairstyles);
    final items = res.data ?? const [];
    return items
        .map((e) => Hairstyle.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
