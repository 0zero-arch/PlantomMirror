import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/widgets/primary_button.dart';

/// C001 首页：产品介绍 + 引导开始。
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Icon(Icons.auto_awesome, size: 72, color: AppTheme.brand),
              const SizedBox(height: 16),
              const Text(
                '幻境',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                '让天下没有难变帅的人',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.black54),
              ),
              const SizedBox(height: 40),
              PrimaryButton(
                label: '开始体验',
                onPressed: () => context.push('/photo'),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
