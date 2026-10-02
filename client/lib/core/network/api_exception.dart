/// 统一错误模型。网络层把 HTTP / 超时等错误转成 [ApiException]，
/// UI 层只面对它，不感知 HTTP 细节。
class ApiException implements Exception {
  const ApiException({
    required this.code,
    required this.message,
    this.retryable = true,
    this.statusCode,
  });

  /// 后端错误码（或客户端约定的 code，如 `timeout` / `network_error`）。
  final String code;

  /// 面向用户的中文提示。
  final String message;

  /// 是否可重试。
  final bool retryable;

  final int? statusCode;

  @override
  String toString() => 'ApiException($code, $message, retryable=$retryable)';
}
