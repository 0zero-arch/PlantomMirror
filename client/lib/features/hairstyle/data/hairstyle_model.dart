import 'package:json_annotation/json_annotation.dart';

part 'hairstyle_model.g.dart';

@JsonSerializable()
class Hairstyle {
  const Hairstyle({
    required this.id,
    required this.name,
    required this.category,
    required this.gender,
    required this.length,
    required this.texture,
    required this.providerStyleId,
    required this.referenceImage,
  });

  final String id;
  final String name;
  final String category;
  final String gender;
  final String length;
  final String texture;

  @JsonKey(name: 'provider_style_id')
  final String providerStyleId;

  @JsonKey(name: 'reference_image')
  final String referenceImage;

  factory Hairstyle.fromJson(Map<String, dynamic> json) =>
      _$HairstyleFromJson(json);

  Map<String, dynamic> toJson() => _$HairstyleToJson(this);
}
