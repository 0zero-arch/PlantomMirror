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

  /// 获取上传地址 → 直传 → 通知完成，返回 photoId。
  ///
  /// 注意不传文件名：对象存储的 key 由服务端按 userId/photoId 生成，
  /// 客户端传上来的名字既不参与寻址也不可信。
  Future<String> upload({
    required Uint8List bytes,
    required String contentType,
    void Function(int sent, int total)? onProgress,
  }) async {
    final (photoId, uploadUrl) = await requestUploadUrl(
      contentType: contentType,
      sizeBytes: bytes.length,
    );

    await _dio.put<dynamic>(
      uploadUrl,
      data: bytes,
      options: Options(contentType: contentType),
      onSendProgress: onProgress,
    );

    /// 服务端会真的去对象存储确认对象存在，才把照片置为 READY。
    await _dio.post<dynamic>(ApiEndpoints.photoComplete(photoId));
    return photoId;
  }

  /// 取预签名上传地址。
  ///
  /// [sizeBytes] 让服务端能提前拦掉过大的文件，不必等传完才发现。
  Future<(String, String)> requestUploadUrl({
    required String contentType,
    required int sizeBytes,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.uploadUrl,
      data: {'contentType': contentType, 'sizeBytes': sizeBytes},
    );
    final data = res.data!;
    return (data['photoId'] as String, data['uploadUrl'] as String);
  }
}
