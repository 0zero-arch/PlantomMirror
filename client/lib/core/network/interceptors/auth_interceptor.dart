import 'package:dio/dio.dart';

import '../../storage/session_store.dart';

/// 请求头附带匿名 user_id（`X-Anonymous-Id`）。
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final id = SessionStore.instance.anonymousId;
    if (id.isNotEmpty) {
      options.headers['X-Anonymous-Id'] = id;
    }
    handler.next(options);
  }
}
