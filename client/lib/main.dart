import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/storage/session_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 初始化会话存储（匿名 user_id），失败不阻塞启动。
  await SessionStore.instance.init();

  runApp(const ProviderScope(child: PhantomMirrorApp()));
}
