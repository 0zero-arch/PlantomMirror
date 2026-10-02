import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';

final photoApiProvider = Provider<PhotoApi>((ref) => PhotoApi(ref.watch(dioProvider)));

/// 照片上传接口：Presigned URL 直传对象存储，不经 Backend 传图。
class PhotoApi {
  PhotoApi(this._dio);

  final Dio _dio;

  /// 获取上传地址 → 直传 → 通知完成，返回 photo_id。
  Future<String> upload({
    required Uint8List bytes,
    required String fileName,
    required String contentType,
    void Function(int sent, int total)? onProgress,
  }) async {
    final (photoId, uploadUrl) = await requestUploadUrl(
      fileName: fileName,
      contentType: contentType,
    );

    await _dio.put<dynamic>(
      uploadUrl,
      data: bytes,
      options: Options(contentType: contentType),
      onSendProgress: onProgress,
    );

    await _dio.post<dynamic>(ApiEndpoints.photoComplete(photoId));
    return photoId;
  }

  Future<(String, String)> requestUploadUrl({
    required String fileName,
    required String contentType,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.uploadUrl,
      data: {'file_name': fileName, 'content_type': contentType},
    );
    final data = res.data!;
    return (data['photo_id'] as String, data['upload_url'] as String);
  }
}
