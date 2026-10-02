import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import 'api_exception.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/logging_interceptor.dart';

/// Dio 单例：配 baseUrl、超时、拦截器。所有 Feature 的 data 层都通过它发请求。
final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: config.baseUrl,
      connectTimeout: config.connectTimeout,
      receiveTimeout: config.receiveTimeout,
    ),
  );
  dio.interceptors.add(AuthInterceptor());
  dio.interceptors.add(LoggingInterceptor());
  return dio;
});

/// 把 Dio 异常统一转成 [ApiException]。
ApiException toApiException(DioException e) {
  final status = e.response?.statusCode;
  final data = e.response?.data;

  var code = 'network_error';
  var message = '网络异常，请稍后重试';
  var retryable = true;

  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      code = 'timeout';
      message = '请求超时，请稍后重试';
      break;
    case DioExceptionType.connectionError:
      code = 'connection_error';
      message = '网络连接失败，请检查网络';
      break;
    case DioExceptionType.badResponse:
      retryable = status != null && status >= 500;
      if (data is Map && data['message'] is String) {
        code = (data['code'] as String?) ?? 'http_$status';
        message = data['message'] as String;
      } else {
        code = 'http_$status';
        message = '服务异常（$status），请稍后重试';
      }
      break;
    default:
      break;
  }

  return ApiException(
    code: code,
    message: message,
    retryable: retryable,
    statusCode: status,
  );
}
