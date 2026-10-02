import 'package:flutter/material.dart';

/// 全局主题：颜色 / 字体 / 间距 tokens（后续可按需扩展）。
class AppTheme {
  AppTheme._();

  static const Color brand = Color(0xFF6C4DFF);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(seedColor: brand);
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: const Color(0xFFF7F7FB),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        backgroundColor: Color(0xFFF7F7FB),
        elevation: 0,
        foregroundColor: Color(0xFF1A1A2E),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
