import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/primary_button.dart';

/// C003 预览 + 上传。
class PhotoPreviewPage extends StatelessWidget {
  const PhotoPreviewPage({super.key, this.imagePath});

  final String? imagePath;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('预览照片')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Expanded(
              child: imagePath == null
                  ? const Center(child: Text('未选择照片'))
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.file(File(imagePath!), fit: BoxFit.contain),
                    ),
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              label: '下一步',
              // TODO(Phase 1)：真实上传（PhotoApi.upload）后，用返回的 photo_id
              // 跳转 /analysis?photoId=xxx。当前先直接进入分析页占位。
              onPressed: () => context.push('/analysis'),
            ),
          ],
        ),
      ),
    );
  }
}
