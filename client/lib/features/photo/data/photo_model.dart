import 'package:json_annotation/json_annotation.dart';

part 'photo_model.g.dart';

@JsonSerializable()
class Photo {
  const Photo({
    required this.id,
    required this.storageKey,
    required this.type,
    required this.width,
    required this.height,
  });

  final String id;

  @JsonKey(name: 'storage_key')
  final String storageKey;

  /// original / result。
  final String type;

  final int width;
  final int height;

  factory Photo.fromJson(Map<String, dynamic> json) => _$PhotoFromJson(json);

  Map<String, dynamic> toJson() => _$PhotoToJson(this);
}
