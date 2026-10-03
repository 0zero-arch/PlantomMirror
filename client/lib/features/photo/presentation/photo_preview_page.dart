import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/image_utils.dart';
import '../../../shared/widgets/primary_button.dart';
import '../providers/photo_provider.dart';

/// C003 预览 + 上传。
///
/// 「下一步」触发**真实上传**：取预签名地址 → 直传对象存储（图片字节不经过
/// 后端）→ 服务端确认对象确实存在 → 带 photoId 进分析页。
///
/// 分析页强依赖 photoId，所以上传失败时必须停在这里报错，不能放行 ——
/// 否则下游会拿到 null 并卡在一个没有任何出口的占位页上。
class PhotoPreviewPage extends ConsumerStatefulWidget {
  const PhotoPreviewPage({super.key, this.imagePath});

  final String? imagePath;

  @override
  ConsumerState<PhotoPreviewPage> createState() => _PhotoPreviewPageState();
}

class _PhotoPreviewPageState extends ConsumerState<PhotoPreviewPage> {
  /// 本地预检未通过时的提示（当前 precheck 是占位实现，永远放行）。
  String? _precheckMessage;

  /// 与服务端 `ALLOWED_CONTENT_TYPES` 白名单保持一致。
  /// 不在表里的扩展名回落到 jpeg —— image_picker 设了 imageQuality 后
  /// 通常就是重新编码过的 JPEG。
  static const _contentTypes = <String, String>{
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
  };

  String _contentTypeFor(String path) {
    final ext = path.split('.').last.toLowerCase();
    return _contentTypes[ext] ?? 'image/jpeg';
  }

  Future<void> _upload() async {
    final path = widget.imagePath;
    if (path == null) return;

    final bytes = await File(path).readAsBytes();

    final check = await ImageUtils.precheck(bytes);
    if (!check.ok) {
      setState(() => _precheckMessage = check.message ?? '照片不符合要求');
      return;
    }
    setState(() => _precheckMessage = null);

    await ref.read(photoProvider.notifier).upload(
          bytes: bytes,
          contentType: _contentTypeFor(path),
        );

    if (!mounted) return;

    final state = ref.read(photoProvider);
    if (state.status == UploadStatus.done && state.photoId != null) {
      context.push('/analysis?photoId=${state.photoId}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final upload = ref.watch(photoProvider);
    final uploading = upload.status == UploadStatus.uploading;

    return Scaffold(
      appBar: AppBar(title: const Text('预览照片')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Expanded(
              child: widget.imagePath == null
                  ? const Center(child: Text('未选择照片'))
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.file(
                        File(widget.imagePath!),
                        fit: BoxFit.contain,
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            if (uploading) ...[
              LinearProgressIndicator(value: upload.progress),
              const SizedBox(height: 8),
              Text('上传中 ${(upload.progress * 100).toStringAsFixed(0)}%'),
            ],
            if (_precheckMessage != null)
              _Hint(_precheckMessage!, color: Colors.orange.shade800),
            if (upload.status == UploadStatus.error)
              const _Hint('上传失败，请检查网络后重试', color: Colors.red),
            const SizedBox(height: 16),
            PrimaryButton(
              label: '下一步',
              loading: uploading,
              onPressed: widget.imagePath == null ? null : _upload,
            ),
          ],
        ),
      ),
    );
  }
}

class _Hint extends StatelessWidget {
  const _Hint(this.message, {required this.color});

  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Text(message, style: TextStyle(color: color)),
    );
  }
}