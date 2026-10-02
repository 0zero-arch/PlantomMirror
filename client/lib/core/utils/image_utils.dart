import 'dart:typed_data';

/// 图片工具：本地质量预检与压缩。
/// TODO(Phase 1)：接入 `image` 包做压缩；接入人脸检测（如 mlkit）做
/// 正脸 / 模糊 / 角度预检。当前为占位实现，直接放行。
class ImageUtils {
  ImageUtils._();

  static Future<ImageCheckResult> precheck(Uint8List bytes) async {
    // 占位：先不阻塞流程，后续替换为真实检测。
    return const ImageCheckResult(ok: true);
  }
}

class ImageCheckResult {
  const ImageCheckResult({required this.ok, this.message});

  final bool ok;
  final String? message;
}
