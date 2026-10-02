import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

/// 会话存储：持久化匿名 user_id。Phase 1 无完整注册体系，靠它识别同一用户。
class SessionStore {
  SessionStore._();

  static final SessionStore instance = SessionStore._();

  static const _kAnonymousId = 'anonymous_id';

  SharedPreferences? _prefs;
  String? _anonymousId;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _anonymousId = _prefs?.getString(_kAnonymousId);
    if (_anonymousId == null) {
      _anonymousId = _generateId();
      await _prefs?.setString(_kAnonymousId, _anonymousId!);
    }
  }

  /// 首次启动生成 UUID，之后复用。
  String get anonymousId => _anonymousId ?? '';

  String _generateId() {
    final rand = Random.secure();
    final bytes = List<int>.generate(16, (_) => rand.nextInt(256));
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return 'anon_$hex';
  }
}
