// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feedback_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppFeedback _$AppFeedbackFromJson(Map<String, dynamic> json) => AppFeedback(
  simulationId: json['simulationId'] as String,
  rating: (json['rating'] as num).toInt(),
  reason: json['reason'] as String?,
  comment: json['comment'] as String?,
);

Map<String, dynamic> _$AppFeedbackToJson(AppFeedback instance) =>
    <String, dynamic>{
      'simulationId': instance.simulationId,
      'rating': instance.rating,
      'reason': instance.reason,
      'comment': instance.comment,
    };
