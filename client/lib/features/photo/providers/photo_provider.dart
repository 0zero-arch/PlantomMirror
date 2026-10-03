import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/photo_api.dart';

enum UploadStatus { idle, uploading, done, error }

class PhotoUploadState {
  const PhotoUploadState({
    this.status = UploadStatus.idle,
    this.progress = 0,
    this.photoId,
  });

  final UploadStatus status;
  final double progress;
  final String? photoId;
}

class PhotoNotifier extends Notifier<PhotoUploadState> {
  @override
  PhotoUploadState build() => const PhotoUploadState();

  /// 上传照片：获取 Presigned URL → 直传（带进度）→ 通知完成。
  Future<void> upload({
    required Uint8List bytes,
    required String contentType,
  }) async {
    state = const PhotoUploadState(status: UploadStatus.uploading);
    try {
      final api = ref.read(photoApiProvider);
      final photoId = await api.upload(
        bytes: bytes,
        contentType: contentType,
        onProgress: (sent, total) {
          state = PhotoUploadState(
            status: UploadStatus.uploading,
            progress: total == 0 ? 0 : sent / total,
          );
        },
      );
      state = PhotoUploadState(status: UploadStatus.done, progress: 1, photoId: photoId);
    } catch (_) {
      state = const PhotoUploadState(status: UploadStatus.error);
    }
  }
}

final photoProvider = NotifierProvider<PhotoNotifier, PhotoUploadState>(PhotoNotifier.new);
