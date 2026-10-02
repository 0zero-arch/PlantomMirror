import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/before_after_slider.dart';
import '../providers/simulation_provider.dart';

/// C007 结果：Before / After 对比 + 换发型 / 评价。
class ResultPage extends ConsumerWidget {
  const ResultPage({super.key, required this.simulationId});

  final String simulationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sim = ref.watch(simulationProvider).value;

    return Scaffold(
      appBar: AppBar(title: const Text('试戴结果')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Expanded(
              child: BeforeAfterSlider(
                before: _placeholder('原图'),
                after: sim?.outputImage != null
                    ? Image.network(sim!.outputImage!, fit: BoxFit.cover)
                    : _placeholder('效果图'),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.push('/hairstyle'),
                    child: const Text('换发型'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.push('/feedback/$simulationId'),
                    child: const Text('评价'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(String label) {
    return ColoredBox(
      color: const Color(0xFFEDEDF2),
      child: Center(
        child: Text(label, style: const TextStyle(color: Colors.black38)),
      ),
    );
  }
}
