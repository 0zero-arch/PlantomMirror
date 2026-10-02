import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../data/hairstyle_model.dart';
import '../providers/hairstyle_provider.dart';

/// C005 发型选择。
class HairstyleListPage extends ConsumerWidget {
  const HairstyleListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hairstyleListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('选择发型')),
      body: async.when(
        loading: () => const LoadingView(message: '加载发型中…'),
        error: (e, _) => ErrorView(
          message: '发型列表加载失败，请检查网络后重试',
          onRetry: () => ref.invalidate(hairstyleListProvider),
        ),
        data: (list) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: list.length,
          itemBuilder: (context, i) => _HairstyleCard(
            hairstyle: list[i],
            onTap: () => context.push('/simulation/${list[i].id}'),
          ),
        ),
      ),
    );
  }
}

class _HairstyleCard extends StatelessWidget {
  const _HairstyleCard({required this.hairstyle, required this.onTap});

  final Hairstyle hairstyle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Row(
          children: [
            SizedBox(
              width: 88,
              height: 88,
              child: CachedNetworkImage(
                imageUrl: hairstyle.referenceImage,
                fit: BoxFit.cover,
                placeholder: (_, _) => const ColoredBox(color: Color(0xFFEDEDF2)),
                errorWidget: (_, _, _) => const ColoredBox(
                  color: Color(0xFFEDEDF2),
                  child: Icon(Icons.person, color: Colors.black26),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hairstyle.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${hairstyle.category} · ${hairstyle.length} · ${hairstyle.texture}',
                    style: const TextStyle(color: Colors.black54, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
