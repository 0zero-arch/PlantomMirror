import 'package:json_annotation/json_annotation.dart';

part 'appearance_profile_model.g.dart';

/// 个人外貌特征（第三方 AI 的输出，UI 措辞需谨慎，不作医学/科学结论）。
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

  @JsonKey(name: 'face_shape')
  final String faceShape;

  @JsonKey(name: 'hair_type')
  final String hairType;

  @JsonKey(name: 'hair_length')
  final String hairLength;

  @JsonKey(name: 'hair_density')
  final String hairDensity;

  @JsonKey(name: 'hair_frizziness')
  final String hairFrizziness;

  factory AppearanceProfile.fromJson(Map<String, dynamic> json) =>
      _$AppearanceProfileFromJson(json);

  Map<String, dynamic> toJson() => _$AppearanceProfileToJson(this);
}
