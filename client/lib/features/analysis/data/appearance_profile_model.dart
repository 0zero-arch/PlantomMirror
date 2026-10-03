import 'package:json_annotation/json_annotation.dart';

part 'appearance_profile_model.g.dart';

/// 个人外貌特征（第三方 AI 的输出，UI 措辞需谨慎，不作医学/科学结论）。
///
/// 字段名与后端 wire 格式一致（camelCase），刻意**不做** snake_case 映射：
/// 多一层映射就多一类「字段名对不上、只在运行时才炸」的故障。
///
/// TODO(Phase 1)：待 AI 契约确定后补充 faceLandmarks / headPose 等字段。
@JsonSerializable()
class AppearanceProfile {
  const AppearanceProfile({
    required this.faceShape,
    required this.hairType,
    required this.hairLength,
    required this.hairDensity,
    required this.hairFrizziness,
  });

  final String faceShape;
  final String hairType;
  final String hairLength;
  final String hairDensity;
  final String hairFrizziness;

  factory AppearanceProfile.fromJson(Map<String, dynamic> json) =>
      _$AppearanceProfileFromJson(json);

  Map<String, dynamic> toJson() => _$AppearanceProfileToJson(this);
}