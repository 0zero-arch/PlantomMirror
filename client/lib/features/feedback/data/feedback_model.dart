import 'package:json_annotation/json_annotation.dart';

part 'feedback_model.g.dart';

/// 反馈。类名用 AppFeedback 以避免与 Flutter 的 `Feedback` 冲突。
///
/// 字段名与后端 wire 格式一致（camelCase），不做 snake_case 映射。
@JsonSerializable()
class AppFeedback {
  const AppFeedback({
    required this.simulationId,
    required this.rating,
    this.reason,
    this.comment,
  });

  final String simulationId;

  /// 1~5（非常满意 ~ 非常不满意）。
  final int rating;

  final String? reason;
  final String? comment;

  factory AppFeedback.fromJson(Map<String, dynamic> json) =>
      _$AppFeedbackFromJson(json);

  Map<String, dynamic> toJson() => _$AppFeedbackToJson(this);
}
