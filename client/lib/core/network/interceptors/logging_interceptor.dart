import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

/// 请求 / 响应日志（脱敏：不打印图片字节、Token、API Key）。
class LoggingInterceptor extends Interceptor {
  final Logger _logger = Logger(printer: PrettyPrinter(methodCount: 0));

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _logger.i('${options.method} ${options.uri}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _logger.i(
      '${response.requestOptions.method} ${response.requestOptions.uri} '
      '-> ${response.statusCode}',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _logger.e(
      '${err.requestOptions.method} ${err.requestOptions.uri} -> ${err.message}',
    );
    handler.next(err);
  }
}
