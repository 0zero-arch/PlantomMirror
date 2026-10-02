import 'package:flutter/material.dart';

/// 统一加载态。
class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.message = '加载中…'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.black54)),
        ],
      ),
    );
  }
}
