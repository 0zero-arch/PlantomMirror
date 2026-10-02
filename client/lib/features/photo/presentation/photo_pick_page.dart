import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../shared/widgets/primary_button.dart';

/// C002 选图：相机 / 相册选图 → 预览。
class PhotoPickPage extends StatelessWidget {
  const PhotoPickPage({super.key});

  Future<void> _pick(BuildContext context, ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: source,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 90,
    );
    if (file == null || !context.mounted) return;
    await context.push('/photo/preview', extra: file.path);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('选择照片')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 12),
            const Text(
              '请上传一张正面、光线正常、面部清晰、头发完整的照片',
              style: TextStyle(color: Colors.black54),
            ),
            const Spacer(),
            PrimaryButton(
              label: '从相册选择',
              onPressed: () => _pick(context, ImageSource.gallery),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => _pick(context, ImageSource.camera),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('拍照'),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
